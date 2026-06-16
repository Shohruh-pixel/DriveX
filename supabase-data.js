// DRIVEX — загрузка живых данных из Supabase (сервисы, товары)
(() => {
  function getClient() {
    if (window.__DRIVEX_SUPABASE_CLIENT__) return window.__DRIVEX_SUPABASE_CLIENT__;
    const cfg = window.DRIVEX_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || !window.supabase) return null;
    // Единый shared клиент для всего приложения — предотвращает Lock conflicts
    window.__DRIVEX_SUPABASE_CLIENT__ = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "drivex-auth" }
    });
    return window.__DRIVEX_SUPABASE_CLIENT__;
  }

  // Преобразует запись service_centers → формат nearbyServices в app.js
  function mapServiceCenter(row) {
    const phones = Array.isArray(row.phones) ? row.phones : (row.phones ? [row.phones] : []);
    const photos = Array.isArray(row.photos) ? row.photos : [];
    return {
      id: row.id,
      name: row.name || "",
      type: row.category || "СТО",
      category: row.category || "СТО",
      city: row.city || "",
      address: row.address || "",
      distance: "",
      rating: Number(row.rating) || 0,
      reviews: Number(row.reviews_count) || 0,
      price: "",
      phone: phones[0] || "",
      workingHours: row.working_hours || "",
      boxesCount: Number(row.boxes_count) || 1,
      image: photos[0] || row.logo_url || "",
      available: row.status === "active",
      description: row.description || "",
      lat: row.lat,
      lng: row.lng
    };
  }

  // Преобразует запись products → формат marketplace products в app.js
  function mapProduct(row) {
    const specs = Array.isArray(row.specs) ? row.specs : [];
    const images = Array.isArray(row.images) ? row.images : [];
    // Поддержка обеих схем: seller-backend (title/publish_status/stock) и schema v1 (name/status/stock_qty)
    const title = row.title || row.name || "";
    const stockQty = Number(row.stock_qty || row.stock || 0);
    const activeStatus = row.publish_status === "active" || row.status === "active";
    return {
      id: row.id,
      storeId: row.store_id || "",
      name: title,
      title,
      slug: row.slug || "",
      categoryId: row.category_id || row.category || "parts",
      category: row.category || "",
      price: Number(row.price) || 0,
      oldPrice: row.old_price ? Number(row.old_price) : null,
      old_price: row.old_price ? Number(row.old_price) : null,
      rating: Number(row.rating) || 0,
      reviews: Number(row.reviews_count) || 0,
      reviews_count: Number(row.reviews_count) || 0,
      reviewsCount: Number(row.reviews_count) || 0,
      image: row.image_url || (images[0] || ""),
      image_url: row.image_url || "",
      inStock: stockQty > 0,
      stock: stockQty > 0,
      stockQty,
      delivery: row.delivery || "",
      deliveryAvailable: Boolean(row.delivery_available),
      badge: row.badge || "",
      brand: row.brand || "",
      sku: row.sku || "",
      unitLabel: row.unit_label || "шт.",
      description: row.description || "",
      specs,
      store_id: row.store_id || "",
      discounted: Boolean(row.old_price),
      popular: Boolean(Number(row.rating) >= 4.8),
      keywords: [title, row.category, row.badge, row.brand, ...specs].filter(Boolean).join(" "),
      status: activeStatus ? "active" : "draft"
    };
  }

  // Загружает сервисы из Supabase
  async function loadServiceCenters({ category, city, query, limit = 50 } = {}) {
    const client = getClient();
    if (!client) return null;

    let req = client
      .from("service_centers")
      .select("*")
      .eq("status", "active")
      .order("rating", { ascending: false })
      .limit(limit);

    if (category && category !== "all") req = req.eq("category", category);
    if (city) req = req.ilike("city", `%${city}%`);
    if (query) req = req.ilike("name", `%${query}%`);

    const { data, error } = await req;
    if (error) {
      console.warn("[supabase-data] loadServiceCenters:", error.message);
      return null;
    }
    return (data || []).map(mapServiceCenter);
  }

  // Загружает товары из Supabase (поддерживает schema v1 и seller-backend.js schema)
  async function loadProducts({ storeId, categoryId, query, page = 0, pageSize = 24 } = {}) {
    const client = getClient();
    if (!client) return null;

    let req = client
      .from("products")
      .select("*")
      .or("status.eq.active,publish_status.eq.active")
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (storeId) req = req.eq("store_id", storeId);
    if (categoryId && categoryId !== "all") req = req.ilike("category", `%${categoryId}%`);
    if (query) req = req.or(`title.ilike.%${query}%,name.ilike.%${query}%`);

    const { data, error } = await req;
    if (error) {
      console.warn("[supabase-data] loadProducts:", error.message);
      return null;
    }
    return (data || []).map(mapProduct);
  }

  // Загружает магазины из Supabase
  async function loadStores({ city, query } = {}) {
    const client = getClient();
    if (!client) return null;

    let req = client
      .from("sellers")
      .select("*")
      .eq("status", "active")
      .order("rating", { ascending: false });

    if (city) req = req.ilike("city", `%${city}%`);
    if (query) req = req.ilike("store_name", `%${query}%`);

    const { data, error } = await req;
    if (error) {
      console.warn("[supabase-data] loadStores:", error.message);
      return null;
    }
    return (data || []).map((row) => ({
      id: row.store_id || row.id,
      storeId: row.store_id || row.id,
      name: row.store_name || "",
      category: row.category || "",
      city: row.city || "",
      address: row.address || "",
      phone: row.phone || "",
      logo: row.logo_url || "",
      rating: Number(row.rating) || 0
    }));
  }

  // Сохраняет FCM токен пользователя
  async function saveFcmToken(userId, fcmToken) {
    const client = getClient();
    if (!client || !userId || !fcmToken) return;
    await client
      .from("users")
      .upsert({ id: userId, fcm_token: fcmToken, updated_at: new Date().toISOString() }, { onConflict: "id" })
      .catch((e) => console.warn("[supabase-data] saveFcmToken:", e.message));
  }

  // Загружает профиль пользователя из Supabase
  async function loadUserProfile(userId) {
    const client = getClient();
    if (!client || !userId) return null;
    const { data, error } = await client.from("users").select("*").eq("id", userId).single();
    if (error) return null;
    return data;
  }

  // Сохраняет/обновляет профиль пользователя
  async function upsertUserProfile(userId, profile) {
    const client = getClient();
    if (!client || !userId) return null;
    // public.users — это мини-реестр (визитка). Личные данные (машины, документы, ТО)
    // живут ТОЛЬКО в едином дереве user_app_state. Поэтому cars/active_car_id сюда НЕ пишем.
    const payload = {
      id: userId,
      full_name: profile.full_name || profile.name || "",
      phone: profile.phone || "",
      avatar_url: profile.avatar_url || "",
      updated_at: new Date().toISOString()
    };
    if (profile.role) payload.role = profile.role;
    const { data, error } = await client.from("users").upsert(payload, { onConflict: "id" }).select().single();
    if (error) { console.warn("[supabase-data] upsertUserProfile:", error.message); return null; }
    return data;
  }

  // Загружает документы пользователя
  async function loadDocuments(userId) {
    const client = getClient();
    if (!client || !userId) return null;
    const { data, error } = await client.from("documents").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) { console.warn("[supabase-data] loadDocuments:", error.message); return null; }
    return data || [];
  }

  // Загружает заказы покупателя
  async function loadBuyerOrders(userId) {
    const client = getClient();
    if (!client || !userId) return null;
    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) { console.warn("[supabase-data] loadBuyerOrders:", error.message); return null; }
    return data || [];
  }

  // Загружает заказы магазина для продавца
  async function loadSellerOrders(storeId) {
    const client = getClient();
    if (!client || !storeId) return null;
    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) { console.warn("[supabase-data] loadSellerOrders:", error.message); return null; }
    return data || [];
  }

  // Создаёт заказ в Supabase
  async function createOrder(orderPayload) {
    const client = getClient();
    if (!client) return null;
    const { data, error } = await client.from("orders").insert(orderPayload).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Обновляет статус заказа
  async function updateOrderStatus(orderId, status, paymentStatus) {
    const client = getClient();
    if (!client) return null;
    const update = { status, updated_at: new Date().toISOString() };
    if (paymentStatus) update.payment_status = paymentStatus;
    const { data, error } = await client.from("orders").update(update).eq("id", orderId).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  window.DrivexSupabaseData = {
    loadServiceCenters,
    loadProducts,
    loadStores,
    saveFcmToken,
    loadUserProfile,
    upsertUserProfile,
    loadDocuments,
    loadBuyerOrders,
    loadSellerOrders,
    createOrder,
    updateOrderStatus,
    mapServiceCenter,
    mapProduct
  };

  // ── Отзывы о товарах (Supabase + серверный fallback) ──

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function mapReviewRow(row) {
    if (!row) return null;
    return {
      id: String(row.id || ""),
      productId: String(row.productId || row.product_id || ""),
      authorName: String(row.authorName || row.author_name || "").trim() || "Покупатель DRIVEX",
      rating: Math.max(1, Math.min(5, Math.floor(Number(row.rating) || 5))),
      comment: String(row.comment || "").trim(),
      verified: Boolean(row.verified),
      createdAt: row.createdAt || row.created_at || new Date().toISOString(),
      userId: row.userId || row.user_id || null
    };
  }

  async function loadProductReviews(productId) {
    const safeId = String(productId || "").trim();
    if (!safeId) return [];
    const collected = [];

    const client = getClient();
    if (client && uuidPattern.test(safeId)) {
      const { data, error } = await client
        .from("product_reviews")
        .select("*")
        .eq("product_id", safeId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && Array.isArray(data)) collected.push(...data.map(mapReviewRow));
    }

    try {
      const response = await fetch(`/api/market/reviews?productId=${encodeURIComponent(safeId)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (response.ok) {
        const payload = await response.json();
        collected.push(...(Array.isArray(payload.reviews) ? payload.reviews : []).map(mapReviewRow));
      }
    } catch (e) {
      // офлайн — только Supabase
    }

    const seen = new Set();
    return collected
      .filter(Boolean)
      .filter((review) => {
        if (seen.has(review.id)) return false;
        seen.add(review.id);
        return true;
      })
      .sort((l, r) => String(r.createdAt).localeCompare(String(l.createdAt)));
  }

  async function addProductReview({ productId, rating, comment = "", authorName = "", verified = false }) {
    const safeId = String(productId || "").trim();
    const safeRating = Math.max(1, Math.min(5, Math.floor(Number(rating) || 0)));
    if (!safeId || !safeRating) throw new Error("Поставьте оценку от 1 до 5");

    const client = getClient();
    if (client && uuidPattern.test(safeId)) {
      const { data: authData } = await client.auth.getUser().catch(() => ({ data: null }));
      const userId = authData?.user?.id;
      if (userId) {
        const reviewRow = {
          product_id: safeId,
          user_id: userId,
          author_name: String(authorName || "").trim(),
          rating: safeRating,
          comment: String(comment || "").trim(),
          verified: Boolean(verified)
        };
        let { data, error } = await client
          .from("product_reviews")
          .upsert(reviewRow, { onConflict: "product_id,user_id" })
          .select()
          .single();
        if (error && /verified/i.test(String(error.message || ""))) {
          const { verified: _skip, ...rowWithoutVerified } = reviewRow;
          ({ data, error } = await client
            .from("product_reviews")
            .upsert(rowWithoutVerified, { onConflict: "product_id,user_id" })
            .select()
            .single());
        }
        if (!error) return mapReviewRow(data);
        console.warn("[supabase-data] addProductReview:", error.message);
      }
    }

    const response = await fetch("/api/market/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        productId: safeId,
        rating: safeRating,
        comment: String(comment || "").trim(),
        authorName: String(authorName || "").trim(),
        verified: Boolean(verified)
      })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error || "Не удалось сохранить отзыв");
    }
    const payload = await response.json();
    return mapReviewRow(payload.review);
  }

  async function loadRatingsSummary() {
    const summary = {};
    try {
      const response = await fetch("/api/market/reviews?summary=1", {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (response.ok) {
        const payload = await response.json();
        if (payload && typeof payload.summary === "object" && payload.summary) {
          for (const [productId, entry] of Object.entries(payload.summary)) {
            if (!entry) continue;
            summary[String(productId)] = {
              rating: Number(entry.rating) || 0,
              count: Math.max(0, Math.floor(Number(entry.count) || 0))
            };
          }
        }
      }
    } catch (e) { /* offline */ }

    const client = getClient();
    if (client) {
      const { data, error } = await client.from("product_rating_summary").select("*").limit(2000);
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (!row || !row.product_id) continue;
          const key = String(row.product_id);
          const incoming = {
            rating: Number(row.rating) || 0,
            count: Math.max(0, Math.floor(Number(row.reviews_count) || 0))
          };
          const existing = summary[key];
          if (existing && existing.count) {
            const totalCount = existing.count + incoming.count;
            summary[key] = {
              count: totalCount,
              rating: totalCount
                ? Math.round(((existing.rating * existing.count + incoming.rating * incoming.count) / totalCount) * 10) / 10
                : 0
            };
          } else {
            summary[key] = incoming;
          }
        }
      }
    }
    return summary;
  }

  function summarizeReviews(reviews) {
    const list = Array.isArray(reviews) ? reviews.filter(Boolean) : [];
    if (!list.length) return { count: 0, rating: 0 };
    const total = list.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return {
      count: list.length,
      rating: Math.round((total / list.length) * 10) / 10
    };
  }

  window.DrivexMarketReviews = {
    loadProductReviews,
    addProductReview,
    summarizeReviews,
    loadRatingsSummary
  };
})();
