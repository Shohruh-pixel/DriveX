(() => {
  const supaCfg = window.DRIVEX_SUPABASE_CONFIG || {};
  const supaEnabled = Boolean(supaCfg.url && supaCfg.anonKey && window.supabase);

  // Используем shared клиент — один на всё приложение, иначе Lock conflicts
  function getSharedClient() {
    if (!supaEnabled) return null;
    if (window.__DRIVEX_SUPABASE_CLIENT__) return window.__DRIVEX_SUPABASE_CLIENT__;
    window.__DRIVEX_SUPABASE_CLIENT__ = window.supabase.createClient(supaCfg.url, supaCfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "drivex-auth" }
    });
    return window.__DRIVEX_SUPABASE_CLIENT__;
  }
  // Proxy: supa.from(...) → getSharedClient().from(...) без изменений в коде ниже
  const supa = supaEnabled ? new Proxy({}, {
    get(_, prop) {
      const c = getSharedClient();
      if (!c) return undefined;
      const val = c[prop];
      return typeof val === "function" ? val.bind(c) : val;
    }
  }) : null;

  const localPartner = window.DrivexPartnerService;
  const localBooking = window.DrivexBookingService;
  const AUTH_KEY = "drivex.partner.auth.v2"; // не пересекается с seller

  function persistSession(payload) {
    try {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
  }

  function getSession() {
    try {
      const raw = window.localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async function login(identifier, password) {
    if (supa) {
      const { data, error } = await supa.auth.signInWithPassword({
        email: identifier,
        password
      });
      if (error) throw error;
      persistSession({ email: identifier, token: data.session?.access_token });
      return { email: identifier };
    }
    // fallback: local
    persistSession({ email: identifier });
    return { email: identifier };
  }

  async function register(payload) {
    if (supa) {
      const { data, error } = await supa.auth.signUp({
        email: payload.email,
        password: payload.password,
        phone: payload.phone
      });
      if (error) throw error;
    }
    return upsertPartner({
      ...payload,
      status: payload.status || "pending",
      ownerId: payload.email || payload.phone
    });
  }

  function logout() {
    if (supa) {
      supa.auth.signOut().catch(() => {});
    }
    try {
      window.localStorage.removeItem(AUTH_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  // ─── Service Centers (таблица service_centers) ────────────────────────

  function normalizeServiceCenterPayload(partner) {
    const phones = [];
    if (partner.phone) phones.push(partner.phone);
    if (partner.altPhone) phones.push(partner.altPhone);

    return {
      name: partner.name || "",
      category: partner.category || "СТО",
      description: partner.description || "",
      address: partner.address || "",
      city: partner.city || "",
      working_hours: partner.workingHours || partner.working_hours || "",
      phones: phones.length ? phones : (Array.isArray(partner.phones) ? partner.phones : []),
      photos: Array.isArray(partner.photos) ? partner.photos : [],
      logo_url: partner.logo_url || partner.logo || "",
      lat: partner.lat ? Number(partner.lat) : null,
      lng: partner.lng ? Number(partner.lng) : null,
      boxes_count: Number(partner.boxesCount || partner.boxes_count) || 1,
      status: partner.status || "pending",
      updated_at: new Date().toISOString()
    };
  }

  async function upsertPartner(partner) {
    const payload = normalizeServiceCenterPayload(partner);

    if (supa) {
      const userId = (await supa.auth.getUser())?.data?.user?.id;
      if (userId) payload.owner_user_id = userId;

      if (partner.id && !partner.id.startsWith("partner-")) {
        // Обновление существующей записи
        const { data, error } = await supa
          .from("service_centers")
          .update(payload)
          .eq("id", partner.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supa
        .from("service_centers")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      // Обновляем роль пользователя → partner
      if (userId) {
        await supa
          .from("users")
          .upsert({ id: userId, role: "partner", updated_at: new Date().toISOString() }, { onConflict: "id" })
          .catch(() => {});
      }
      return data;
    }

    return localPartner ? localPartner.createPartner({ ...payload, id: partner.id || `partner-${Date.now()}` }) : payload;
  }

  async function listPartners({ category, city, query } = {}) {
    if (supa) {
      let req = supa.from("service_centers").select("*").eq("status", "active").order("rating", { ascending: false });
      if (category && category !== "all") req = req.eq("category", category);
      if (city) req = req.ilike("city", `%${city}%`);
      if (query) req = req.ilike("name", `%${query}%`);
      const { data, error } = await req;
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        address: row.address,
        city: row.city,
        workingHours: row.working_hours,
        phones: Array.isArray(row.phones) ? row.phones : [],
        phone: (Array.isArray(row.phones) && row.phones[0]) || "",
        photos: Array.isArray(row.photos) ? row.photos : [],
        logo_url: row.logo_url,
        lat: row.lat,
        lng: row.lng,
        rating: row.rating,
        reviewCount: row.reviews_count,
        boxesCount: row.boxes_count,
        status: row.status,
        ownerId: row.owner_user_id
      }));
    }
    return localPartner ? localPartner.getPartners() : [];
  }

  async function getMyServiceCenter() {
    if (!supa) return null;
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return null;
    const { data, error } = await supa
      .from("service_centers")
      .select("*")
      .eq("owner_user_id", user.id)
      .single();
    if (error) return null;
    return data;
  }

  async function uploadServicePhoto(file, serviceCenterId) {
    if (!supa) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${serviceCenterId}/${Date.now()}.${ext}`;
    const { data, error } = await supa.storage
      .from("service-photos")
      .upload(filePath, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: urlData } = supa.storage.from("service-photos").getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  async function updateServicePhotos(serviceCenterId, photos) {
    if (!supa) return;
    const { error } = await supa
      .from("service_centers")
      .update({ photos, updated_at: new Date().toISOString() })
      .eq("id", serviceCenterId);
    if (error) throw error;
  }

  // ─── Bookings ─────────────────────────────────────────────────────────

  async function listBookings(partnerId) {
    if (!partnerId) return [];
    if (supa) {
      const { data, error } = await supa
        .from("partner_bookings")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return localBooking ? localBooking.getByPartner(partnerId) : [];
  }

  async function createBooking(payload) {
    if (supa) {
      const { data, error } = await supa.from("partner_bookings").insert(payload).select().single();
      if (error) throw error;
      return data;
    }
    return localBooking ? localBooking.createBooking(payload) : payload;
  }

  async function updateBookingStatus(id, status) {
    if (supa) {
      const { data, error } = await supa.from("partner_bookings").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    }
    return localBooking ? localBooking.updateBookingStatus(id, status) : null;
  }

  window.DrivexPartnerRepository = {
    login,
    register,
    logout,
    getSession,
    upsertPartner,
    listPartners,
    getMyServiceCenter,
    uploadServicePhoto,
    updateServicePhotos,
    listBookings,
    createBooking,
    updateBookingStatus
  };
})();
