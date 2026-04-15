(() => {
  const supaCfg = window.DRIVEX_SUPABASE_CONFIG || {};
  const supaEnabled = Boolean(supaCfg.url && supaCfg.anonKey && window.supabase);
  const supa = supaEnabled
    ? window.supabase.createClient(supaCfg.url, supaCfg.anonKey, {
        auth: { persistSession: true },
        global: { headers: { "x-client-info": "drivex-partner-crm" } }
      })
    : null;

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

  // Partners
  async function upsertPartner(partner) {
    const normalized = {
      id: partner.id || `partner-${Date.now()}`,
      name: partner.name || "",
      category: partner.category || "СТО",
      description: partner.description || "",
      address: partner.address || "",
      city: partner.city || "",
      district: partner.district || "",
      phone: partner.phone || "",
      altPhone: partner.altPhone || "",
      email: partner.email || "",
      ownerId: partner.ownerId || partner.email || partner.phone || "",
      rating: Number(partner.rating) || 5,
      reviewCount: Number(partner.reviewCount) || 0,
      priceLevel: Number(partner.priceLevel) || 2,
      services: Array.isArray(partner.services) ? partner.services : [],
      status: partner.status || "pending",
      createdAt: partner.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (supa) {
      const { data, error } = await supa.from("partners").upsert(normalized).select().single();
      if (error) throw error;
      return data;
    }
    return localPartner ? localPartner.createPartner(normalized) : normalized;
  }

  async function listPartners() {
    if (supa) {
      const { data, error } = await supa.from("partners").select("*").order("createdAt", { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return localPartner ? localPartner.getPartners() : [];
  }

  // Bookings
  async function listBookings(partnerId) {
    if (!partnerId) return [];
    if (supa) {
      const { data, error } = await supa
        .from("partner_bookings")
        .select("*")
        .eq("partnerId", partnerId)
        .order("date", { ascending: true });
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
    listBookings,
    createBooking,
    updateBookingStatus
  };
})();
