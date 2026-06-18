(() => {
  const backendSyncEvent = "drivex:seller-backend-sync";
  const storageKeys = Object.freeze({
    db: "drivex.seller.crm.db.v1",
    auth: "drivex.partner.auth.v1",
    sync: "drivex.partner.sync.v1"
  });

  const notificationMeta = Object.freeze({
    order_new: { color: "var(--drivex-electric-blue)", icon: "bag" },
    order_status: { color: "var(--drivex-neon-cyan)", icon: "truck" },
    product_low_stock: { color: "var(--drivex-danger)", icon: "scan" },
    product_published: { color: "var(--drivex-success)", icon: "bag" },
    store_updated: { color: "var(--drivex-warning)", icon: "settings" },
    welcome: { color: "var(--drivex-electric-blue)", icon: "sparkles" }
  });

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  // Колонки id в Supabase имеют тип uuid. Клиентские id вида "seller-product-…"
  // не проходят валидацию. Возвращаем валидный uuid: либо исходный (если он уже uuid),
  // либо новый. Используется только в Supabase-режиме — локальная БД принимает любые строки.
  function makeUuid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function isUuid(value) {
    return typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  function slugify(value, fallback = "item") {
    return (
      String(value || fallback)
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^a-z0-9а-яё]+/gi, "-")
        .replace(/^-+|-+$/g, "") || fallback
    );
  }

  function normalizeOrderStatus(status) {
    return String(status || "new").trim().toLowerCase();
  }

  function getAllowedOrderStatuses(currentStatus, deliveryType) {
    const normalizedStatus = normalizeOrderStatus(currentStatus);
    const normalizedDeliveryType = String(deliveryType || "delivery").trim().toLowerCase();
    const isPickupOrder = normalizedDeliveryType === "pickup";

    switch (normalizedStatus) {
      case "new":
        return ["new", "confirmed", "cancelled"];
      case "confirmed":
        return isPickupOrder ? ["confirmed", "pickup_ready", "cancelled"] : ["confirmed", "delivery", "cancelled"];
      case "pickup_ready":
        return ["pickup_ready", "completed"];
      case "delivery":
        return ["delivery", "completed"];
      case "completed":
        return ["completed"];
      case "cancelled":
        return ["cancelled"];
      default:
        return ["new", "confirmed", "cancelled"];
    }
  }

  function canTransitionOrderStatus(currentStatus, nextStatus, deliveryType) {
    return getAllowedOrderStatuses(currentStatus, deliveryType).includes(normalizeOrderStatus(nextStatus));
  }

  function getOrderStatusLabel(status) {
    switch (normalizeOrderStatus(status)) {
      case "confirmed":
        return "Подтвержден";
      case "pickup_ready":
        return "Готов к выдаче";
      case "delivery":
        return "В доставке";
      case "completed":
        return "Завершен";
      case "cancelled":
        return "Отменен";
      case "new":
      default:
        return "Новый";
    }
  }

  function deepClone(value) {
    return safeParse(JSON.stringify(value), value);
  }

  function getLocalStorageRef() {
    try {
      return window.localStorage || null;
    } catch {
      return null;
    }
  }

  function getSessionStorageRef() {
    try {
      return window.sessionStorage || null;
    } catch {
      return null;
    }
  }

  function readJsonStorage(storage, key, fallback) {
    if (!storage) return fallback;
    try {
      return safeParse(storage.getItem(key), fallback);
    } catch {
      return fallback;
    }
  }

  function writeJsonStorage(storage, key, value) {
    if (!storage) return;
    try {
      if (value === null || typeof value === "undefined") {
        storage.removeItem(key);
      } else {
        storage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // ignore storage write errors
    }
  }

  function readStorage(key, fallback) {
    try {
      return readJsonStorage(getLocalStorageRef(), key, fallback);
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      writeJsonStorage(getLocalStorageRef(), key, value);
    } catch {
      // ignore storage write errors
    }
  }

  function emitSync(reason) {
    const payload = { reason, at: Date.now() };
    writeStorage(storageKeys.sync, payload);
    try {
      window.dispatchEvent(new CustomEvent(backendSyncEvent, { detail: payload }));
    } catch {
      // ignore
    }
  }

  function createEmptyDb() {
    return {
      authUsers: [],
      profiles: [],
      stores: [],
      products: [],
      orders: [],
      orderItems: [],
      sellerNotifications: [],
      chatThreads: [],
      chatMessages: []
    };
  }

  function readDb() {
    return readStorage(storageKeys.db, createEmptyDb());
  }

  function writeDb(db) {
    writeStorage(storageKeys.db, db);
  }

  function clearAuthSessionStorage() {
    writeJsonStorage(getLocalStorageRef(), storageKeys.auth, null);
    writeJsonStorage(getSessionStorageRef(), storageKeys.auth, null);
  }

  function readAuthSession() {
    const sessionScoped = readJsonStorage(getSessionStorageRef(), storageKeys.auth, null);
    if (sessionScoped) return sessionScoped;
    return readJsonStorage(getLocalStorageRef(), storageKeys.auth, null);
  }

  function writeAuthSession(session, options = {}) {
    const remember = options && typeof options.remember === "boolean" ? options.remember : true;
    clearAuthSessionStorage();
    if (!session) return;

    if (remember) {
      writeJsonStorage(getLocalStorageRef(), storageKeys.auth, session);
      return;
    }

    writeJsonStorage(getSessionStorageRef(), storageKeys.auth, session);
  }

  function getConfig() {
    const config = window.DRIVEX_SUPABASE_CONFIG || {};
    return {
      url: String(config.url || "").trim(),
      anonKey: String(config.anonKey || "").trim(),
      storageBucket: String(config.storageBucket || "seller-assets").trim()
    };
  }

  function createSupabaseClient() {
    const config = getConfig();
    if (!config.url || !config.anonKey) return null;
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
    // ВАЖНО: используем единый shared клиент чтобы избежать Lock "auth-token" conflicts
    if (window.__DRIVEX_SUPABASE_CLIENT__) return window.__DRIVEX_SUPABASE_CLIENT__;
    window.__DRIVEX_SUPABASE_CLIENT__ = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "drivex-auth"  // единый ключ для всех клиентов
      }
    });
    return window.__DRIVEX_SUPABASE_CLIENT__;
  }

  function getBackendMode() {
    if (window.__DRIVEX_SELLER_LOCAL_MODE__) return "local";
    try {
      if (window.localStorage && window.localStorage.getItem('drivex.seller.force.local') === '1') return "local";
    } catch(e) {}
    return createSupabaseClient() ? "supabase" : "local";
  }

  function getStatus() {
    const config = getConfig();
    return {
      mode: getBackendMode(),
      configured: Boolean(config.url && config.anonKey),
      storageKeys: deepClone(storageKeys),
      eventName: backendSyncEvent
    };
  }

  function inferStoreAccent(category) {
    const safeCategory = String(category || "").toLowerCase();
    if (safeCategory.includes("масл")) return "var(--drivex-warning)";
    if (safeCategory.includes("акб")) return "var(--drivex-success)";
    if (safeCategory.includes("шины")) return "var(--drivex-electric-blue)";
    return "var(--drivex-neon-cyan)";
  }

  function resolveProductCategoryId(category) {
    const safeCategory = String(category || "").toLowerCase();
    if (safeCategory.includes("шин")) return "tires";
    if (safeCategory.includes("масл")) return "oil";
    if (safeCategory.includes("акб")) return "battery";
    if (safeCategory.includes("акс")) return "accessories";
    return "parts";
  }

  function resolveProductCategoryLabel(category) {
    const safeCategory = String(category || "").toLowerCase();
    if (safeCategory === "tires" || safeCategory.includes("шин")) return "Шины";
    if (safeCategory === "oil" || safeCategory.includes("масл")) return "Масла";
    if (safeCategory === "battery" || safeCategory.includes("акб")) return "АКБ";
    if (safeCategory === "accessories" || safeCategory.includes("акс")) return "Аксессуары";
    return "Запчасти";
  }

  function isStoreProfileComplete(storeRow) {
    const requiredValues = [
      storeRow.name,
      storeRow.city,
      storeRow.address,
      storeRow.category,
      storeRow.business_type,
      storeRow.working_hours,
      storeRow.description,
      storeRow.location_text
    ];
    return requiredValues.every((value) => String(value || "").trim());
  }

  function mapDbSessionToFrontend(authUser) {
    if (!authUser) {
      return {
        id: "guest-buyer",
        name: "Покупатель DRIVEX",
        email: "buyer@drivex.app",
        role: "buyer",
        sellerStoreId: "auto-parts-khujand"
      };
    }

    return {
      id: authUser.id,
      name: authUser.full_name || "",
      email: authUser.email || "",
      role: authUser.role || "seller",
      sellerStoreId: authUser.store_id || "auto-parts-khujand"
    };
  }

  function mapProfileRowToFrontend(row, authUser) {
    if (!row && !authUser) return null;
    return {
      id: row?.id || authUser?.id || makeId("seller-profile"),
      ownerFullName: row?.full_name || authUser?.full_name || "",
      phone: row?.phone || authUser?.phone || "",
      email: authUser?.email || "",
      password: "",
      registrationCompleted: Boolean(row || authUser)
    };
  }

  function mapStoreRowToFrontend(row, authUser) {
    if (!row) return null;
    const profileCompleted = Boolean(row.onboarding_completed) || isStoreProfileComplete(row);
    return {
      id: row.id,
      name: row.name || "",
      ownerName: authUser?.full_name || "",
      city: row.city || "",
      address: row.address || "",
      locationLabel: row.location_text || "",
      geolocation:
        Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude))
          ? `${row.latitude}, ${row.longitude}`
          : "",
      storeCategory: row.category || "Автозапчасти",
      businessType: row.business_type || "Доставка и самовывоз",
      phone: authUser?.phone || "",
      deliveryAvailable: Boolean(row.delivery_available),
      pickupAvailable: Boolean(row.pickup_available),
      deliveryRadius: row.delivery_radius || "",
      workingHours: row.working_hours || "",
      description: row.description || "",
      logo: row.logo_url || "DX",
      rating: 4.8,
      reviews: 0,
      accent: inferStoreAccent(row.category),
      registrationCompleted: true,
      profileCompleted,
      status: row.status || (profileCompleted ? "active" : "pending-setup"),
      catalogInitialized: true
    };
  }

  function mapProductRowToFrontend(row) {
    if (!row) return null;
    const stockQty = Math.max(0, Number(row.stock || 0));
    return {
      id: row.id,
      marketProductId: Number(row.market_product_id || 0) || Number(String(row.id).replace(/\D/g, "").slice(-6)) || Date.now(),
      storeId: row.store_id,
      title: row.title || "",
      slug: row.slug || slugify(row.title || row.id, row.id),
      categoryId: resolveProductCategoryId(row.category),
      category: resolveProductCategoryLabel(row.category),
      price: Math.max(0, Number(row.price || 0)),
      oldPrice: Number(row.old_price || 0) > Number(row.price || 0) ? Number(row.old_price) : null,
      rating: 4.7,
      reviewsCount: 0,
      image: row.image_url || "",
      badge: row.badge || "",
      stockQty,
      stock: stockQty > 0,
      description: row.description || "Описание товара пока не заполнено.",
      popular: false,
      discounted: Number(row.old_price || 0) > Number(row.price || 0),
      brand: row.brand || "DRIVEX",
      sku: row.sku || "",
      deliveryAvailable: Boolean(row.delivery_available),
      status: row.publish_status === "active" ? "active" : row.publish_status === "archived" ? "archived" : "draft",
      createdAt: Date.parse(row.created_at || "") || Date.now()
    };
  }

  function mapOrderRowsToFrontend(orderRows, itemRows) {
    const itemsByOrder = {};
    for (const item of itemRows || []) {
      const bucket = itemsByOrder[item.order_id] || [];
      bucket.push({
        productId: item.product_id || "",
        title: item.product_title || "Товар",
        qty: Math.max(1, Number(item.quantity || 1)),
        price: Math.max(0, Number(item.unit_price || 0))
      });
      itemsByOrder[item.order_id] = bucket;
    }

    return (orderRows || []).map((row) => ({
      id: row.id,
      storeId: row.store_id,
      customerName: row.customer_name || "Клиент DRIVEX",
      customerPhone: row.customer_phone || "",
      items: itemsByOrder[row.id] || [],
      amount: Math.max(0, Number(row.total_amount || 0)),
      status: row.status || "new",
      date: String(row.created_at || nowIso()).slice(0, 10),
      deliveryMethod: row.delivery_type === "pickup" ? "Самовывоз" : "Доставка",
      address: row.delivery_address || "",
      notes: "",
      storeName: row.store_name || ""
    }));
  }

  function createChatThreadRow(orderRow, storeRow) {
    return {
      id: makeId("chat-thread"),
      order_id: orderRow.id,
      store_id: orderRow.store_id,
      store_name: orderRow.store_name || storeRow?.name || "",
      customer_name: orderRow.customer_name || "Клиент DRIVEX",
      customer_phone: orderRow.customer_phone || "",
      buyer_unread_count: 0,
      seller_unread_count: 0,
      last_message: "",
      last_message_at: orderRow.created_at || nowIso(),
      created_at: nowIso(),
      updated_at: nowIso()
    };
  }

  function appendSystemChatMessage(
    db,
    orderRow,
    text,
    {
      buyerUnreadIncrement = 0,
      sellerUnreadIncrement = 0,
      createdAt = nowIso()
    } = {}
  ) {
    if (!db || !orderRow || !String(text || "").trim()) {
      return null;
    }

    const threadRow = ensureChatThreadRow(db, orderRow);
    const messageRow = {
      id: makeId("chat-message"),
      thread_id: threadRow.id,
      order_id: orderRow.id,
      sender_type: "system",
      sender_name: "DRIVEX",
      text: String(text || "").trim(),
      created_at: createdAt
    };

    db.chatMessages = [...(db.chatMessages || []), messageRow];
    db.chatThreads = (db.chatThreads || []).map((thread) =>
      thread.id === threadRow.id
        ? {
            ...thread,
            store_name: thread.store_name || orderRow.store_name || "",
            last_message: messageRow.text,
            last_message_at: createdAt,
            updated_at: createdAt,
            buyer_unread_count: Math.max(0, Number(thread.buyer_unread_count || 0)) + Math.max(0, Number(buyerUnreadIncrement || 0)),
            seller_unread_count: Math.max(0, Number(thread.seller_unread_count || 0)) + Math.max(0, Number(sellerUnreadIncrement || 0))
          }
        : thread
    );

    return messageRow;
  }

  function ensureChatThreadRow(db, orderRow) {
    const existingThread = (db.chatThreads || []).find((thread) => thread.order_id === orderRow.id);
    if (existingThread) {
      return existingThread;
    }

    const storeRow = (db.stores || []).find((item) => item.id === orderRow.store_id) || null;
    const nextThread = createChatThreadRow(orderRow, storeRow);
    db.chatThreads = [nextThread, ...(db.chatThreads || [])];
    return nextThread;
  }

  function mapChatRowsToFrontend(threadRows, messageRows) {
    const messagesByThread = {};
    for (const item of messageRows || []) {
      const bucket = messagesByThread[item.thread_id] || [];
      bucket.push({
        id: item.id,
        threadId: item.thread_id,
        orderId: item.order_id,
        senderType: item.sender_type || "buyer",
        senderName: item.sender_name || "Пользователь",
        text: item.text || "",
        createdAt: item.created_at || nowIso()
      });
      messagesByThread[item.thread_id] = bucket;
    }

    return (threadRows || [])
      .map((thread) => ({
        id: thread.id,
        orderId: thread.order_id,
        storeId: thread.store_id,
        storeName: thread.store_name || "",
        customerName: thread.customer_name || "Клиент DRIVEX",
        customerPhone: thread.customer_phone || "",
        buyerUnreadCount: Math.max(0, Number(thread.buyer_unread_count || 0)),
        sellerUnreadCount: Math.max(0, Number(thread.seller_unread_count || 0)),
        lastMessage: thread.last_message || "",
        lastMessageAt: thread.last_message_at || thread.updated_at || thread.created_at || nowIso(),
        messages: (messagesByThread[thread.id] || []).sort((left, right) =>
          String(left.createdAt || "").localeCompare(String(right.createdAt || ""))
        )
      }))
      .sort((left, right) => String(right.lastMessageAt || "").localeCompare(String(left.lastMessageAt || "")));
  }

  function attachChatsToAppState(appState, extraOrderIds = []) {
    const db = readDb();
    const sellerOrderIds = Array.isArray(appState?.seller?.orders) ? appState.seller.orders.map((order) => order.id) : [];
    const relevantOrderIds = [...new Set([...sellerOrderIds, ...(Array.isArray(extraOrderIds) ? extraOrderIds : [])].filter(Boolean))];
    const threadRows = (db.chatThreads || []).filter((thread) => relevantOrderIds.includes(thread.order_id));
    const threadIds = threadRows.map((thread) => thread.id);
    const messageRows = (db.chatMessages || []).filter((message) => threadIds.includes(message.thread_id));

    return {
      ...appState,
      chats: mapChatRowsToFrontend(threadRows, messageRows)
    };
  }

  function mapNotificationRowToFrontend(row) {
    const typeMeta = notificationMeta[row?.type] || notificationMeta.welcome;
    return {
      id: row?.id || makeId("notification"),
      type: row?.type || "welcome",
      title: row?.title || "Обновление seller кабинета",
      body: row?.message || "",
      message: row?.message || "",
      isRead: Boolean(row?.is_read),
      createdAt: row?.created_at || nowIso(),
      color: typeMeta.color,
      icon: typeMeta.icon
    };
  }

  function mapStoreRowToCatalog(row, authUser) {
    const safeStore = mapStoreRowToFrontend(row, authUser);
    if (!safeStore || !safeStore.name) return null;

    return {
      id: safeStore.id,
      name: safeStore.name,
      city: safeStore.city,
      deliveryAvailable: Boolean(safeStore.deliveryAvailable),
      deliveryLabel: safeStore.deliveryAvailable
        ? `Доставка • ${safeStore.deliveryRadius || safeStore.city}`
        : "Самовывоз",
      deliveryNote: safeStore.deliveryAvailable
        ? `Доставка по зоне: ${safeStore.deliveryRadius || "уточняется"}`
        : "Только самовывоз",
      rating: safeStore.rating,
      reviews: safeStore.reviews,
      avatar: String(safeStore.logo || safeStore.name || "DX").slice(0, 2).toUpperCase(),
      accent: safeStore.accent,
      tagline: safeStore.description || "Партнёрский магазин DRIVEX",
      pickup: safeStore.address || safeStore.city,
      delivery: safeStore.deliveryAvailable ? "yes" : "pickup",
      logo: safeStore.logo || "DX",
      description: safeStore.description || "Партнёрский магазин DRIVEX",
      phone: safeStore.phone,
      storeCategory: safeStore.storeCategory,
      businessType: safeStore.businessType,
      catalogInitialized: true
    };
  }

  function mapProductRowToCatalog(row) {
    const safeProduct = mapProductRowToFrontend(row);
    if (!safeProduct) return null;
    return safeProduct;
  }

  function toDbStorePayload(payload, ownerUserId) {
    const geoParts = String(payload.geolocation || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const latitude = Number(geoParts[0]);
    const longitude = Number(geoParts[1]);
    const onboardingCompleted = Boolean(payload.profileCompleted);

    return {
      id: payload.id || slugify(payload.name || makeId("store"), makeId("store")),
      owner_user_id: ownerUserId,
      name: String(payload.name || "").trim(),
      city: String(payload.city || "").trim(),
      address: String(payload.address || "").trim(),
      category: String(payload.storeCategory || "Автозапчасти").trim(),
      business_type: String(payload.businessType || "Доставка и самовывоз").trim(),
      delivery_available: Boolean(payload.deliveryAvailable),
      pickup_available: Boolean(payload.pickupAvailable),
      delivery_radius: String(payload.deliveryRadius || "").trim(),
      working_hours: String(payload.workingHours || "").trim(),
      description: String(payload.description || "").trim(),
      location_text: String(payload.locationLabel || "").trim(),
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      logo_url: String(payload.logo || "").trim(),
      onboarding_completed: onboardingCompleted,
      status: onboardingCompleted ? "active" : "pending_review",
      updated_at: nowIso()
    };
  }

  function toDbProductPayload(payload, storeId) {
    // По умолчанию товар публикуется (active) — именно это видит продавец ("Активен")
    // и ожидает увидеть покупатель. Черновик/архив — только если явно задан.
    const publishStatus =
      payload.status === "draft" ? "draft" : payload.status === "archived" ? "archived" : "active";
    return {
      id: payload.id || makeId("product"),
      store_id: storeId,
      title: String(payload.title || "").trim(),
      slug: slugify(payload.slug || payload.title || payload.id, makeId("product")),
      category: resolveProductCategoryLabel(payload.category || payload.categoryId || "parts"),
      brand: String(payload.brand || "").trim(),
      sku: String(payload.sku || "").trim(),
      price: Math.max(0, Number(payload.price || 0)),
      old_price: Number(payload.oldPrice || 0) > Number(payload.price || 0) ? Number(payload.oldPrice) : null,
      stock: Math.max(0, Number(payload.stockQty || 0)),
      description: String(payload.description || "").trim(),
      badge: String(payload.badge || "").trim(),
      image_url: String(payload.image || "").trim(),
      delivery_available: Boolean(payload.deliveryAvailable),
      publish_status: publishStatus,
      updated_at: nowIso()
    };
  }

  function createNotificationRow({ storeId, type, title, message }) {
    return {
      id: makeId("notification"),
      store_id: storeId,
      type,
      title,
      message,
      is_read: false,
      created_at: nowIso()
    };
  }

  function getLocalUserById(db, userId) {
    return (db.authUsers || []).find((item) => item.id === userId) || null;
  }

  function getLocalStoreByUserId(db, userId) {
    return (db.stores || []).find((item) => item.owner_user_id === userId) || null;
  }

  function buildLocalAppState() {
    const db = readDb();
    const authSession = readAuthSession();
    const authUser = authSession ? getLocalUserById(db, authSession.userId) : null;
    const storeRow = authUser ? getLocalStoreByUserId(db, authUser.id) : null;
    const productRows = storeRow ? (db.products || []).filter((item) => item.store_id === storeRow.id) : [];
    const orderRows = storeRow ? (db.orders || []).filter((item) => item.store_id === storeRow.id) : [];
    const orderItems = (db.orderItems || []).filter((item) => orderRows.some((order) => order.id === item.order_id));
    const notifications = storeRow
      ? (db.sellerNotifications || [])
          .filter((item) => item.store_id === storeRow.id)
          .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
      : [];

    const session = authUser ? mapDbSessionToFrontend(authUser) : null;
    const seller = authUser && storeRow
      ? {
          profile: mapProfileRowToFrontend(
            (db.profiles || []).find((entry) => entry.id === authUser.id),
            authUser
          ),
          store: mapStoreRowToFrontend(storeRow, authUser),
          products: productRows.map(mapProductRowToFrontend).filter(Boolean),
          orders: mapOrderRowsToFrontend(orderRows, orderItems),
          notifications: notifications.map(mapNotificationRowToFrontend)
        }
      : null;

    const authUsersById = (db.authUsers || []).reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
    const catalogStores = (db.stores || [])
      .filter((item) => item.status === "active")
      .map((item) => mapStoreRowToCatalog(item, authUsersById[item.owner_user_id]))
      .filter(Boolean);
    const catalogProducts = (db.products || [])
      .filter((item) => item.publish_status === "active")
      .map(mapProductRowToCatalog)
      .filter(Boolean);

    return attachChatsToAppState({
      ...getStatus(),
      session,
      seller,
      catalog: {
        stores: catalogStores,
        products: catalogProducts
      }
    });
  }

  function persistLocalRegistration(payload) {
    const db = readDb();
    const email = String(payload.profile?.email || "").trim().toLowerCase();
    const phone = String(payload.profile?.phone || "").trim();
    const password = String(payload.profile?.password || "");

    if (!email) {
      throw new Error("Укажите email для партнёрского входа");
    }
    if (!password || password.length < 6) {
      throw new Error("Пароль должен быть не короче 6 символов");
    }
    const existingAuthUser = (db.authUsers || []).find(
      (entry) => String(entry.email || "").toLowerCase() === email
    );
    if (existingAuthUser) {
      const existingStore = getLocalStoreByUserId(db, existingAuthUser.id);
      const reusedStoreId = existingStore?.id || existingAuthUser.store_id || makeId("store");
      const updatedAt = nowIso();
      const nextAuthUser = {
        ...existingAuthUser,
        password,
        phone,
        full_name: String(payload.profile?.ownerFullName || existingAuthUser.full_name || "").trim(),
        role: "seller",
        store_id: reusedStoreId,
        updated_at: updatedAt
      };
      const nextProfileRow = {
        id: existingAuthUser.id,
        full_name: nextAuthUser.full_name,
        phone,
        role: "seller",
        created_at:
          (db.profiles || []).find((entry) => entry.id === existingAuthUser.id)?.created_at || existingAuthUser.created_at,
        updated_at: updatedAt
      };
      const nextStoreRow = {
        ...(existingStore || {}),
        ...toDbStorePayload(
          {
            ...(payload.store || {}),
            id: reusedStoreId,
            profileCompleted: Boolean(payload.store?.profileCompleted)
          },
          existingAuthUser.id
        ),
        created_at: existingStore?.created_at || existingAuthUser.created_at || updatedAt,
        updated_at: updatedAt,
        onboarding_completed: Boolean(payload.store?.profileCompleted),
        status: payload.store?.profileCompleted ? "active" : "pending_review"
      };

      db.authUsers = (db.authUsers || []).map((entry) => (entry.id === existingAuthUser.id ? nextAuthUser : entry));
      db.profiles = (db.profiles || []).some((entry) => entry.id === existingAuthUser.id)
        ? (db.profiles || []).map((entry) => (entry.id === existingAuthUser.id ? nextProfileRow : entry))
        : [nextProfileRow, ...(db.profiles || [])];
      db.stores = existingStore
        ? (db.stores || []).map((entry) => (entry.id === existingStore.id ? nextStoreRow : entry))
        : [nextStoreRow, ...(db.stores || [])];
      db.sellerNotifications = [
        createNotificationRow({
          storeId: reusedStoreId,
          type: "store_updated",
          title: "Данные магазина обновлены",
          message: "Партнёрская регистрация обновила карточку магазина."
        }),
        ...(db.sellerNotifications || [])
      ];

      writeDb(db);
      writeAuthSession({
        userId: existingAuthUser.id,
        role: "seller",
        storeId: reusedStoreId,
        at: Date.now()
      }, { remember: payload?.remember !== false });
      emitSync("partner-register-existing");
      return buildLocalAppState();
    }

    const userId = makeId("partner");
    const storeId = slugify(payload.store?.name || payload.store?.id || makeId("store"), makeId("store"));
    const createdAt = nowIso();
    const authUser = {
      id: userId,
      email,
      password,
      phone,
      full_name: String(payload.profile?.ownerFullName || "").trim(),
      role: "seller",
      store_id: storeId,
      created_at: createdAt,
      updated_at: createdAt
    };
    const profileRow = {
      id: userId,
      full_name: authUser.full_name,
      phone,
      role: "seller",
      created_at: createdAt,
      updated_at: createdAt
    };
    const storeRow = {
      ...toDbStorePayload(
        {
          ...(payload.store || {}),
          id: storeId,
          profileCompleted: Boolean(payload.store?.profileCompleted)
        },
        userId
      ),
      created_at: createdAt,
      updated_at: createdAt,
      onboarding_completed: Boolean(payload.store?.profileCompleted),
      status: payload.store?.profileCompleted ? "active" : "pending_review"
    };

    db.authUsers = [...(db.authUsers || []), authUser];
    db.profiles = [...(db.profiles || []), profileRow];
    db.stores = [...(db.stores || []), storeRow];
    db.sellerNotifications = [
      createNotificationRow({
        storeId,
        type: "welcome",
        title: "Магазин зарегистрирован",
        message: "Проверьте карточку магазина и завершите onboarding."
      }),
      ...(db.sellerNotifications || [])
    ];

    writeDb(db);
    writeAuthSession({ userId, role: "seller", storeId, at: Date.now() }, { remember: payload?.remember !== false });
    emitSync("partner-register");

    return buildLocalAppState();
  }

  function loginLocalPartner(payload) {
    const db = readDb();
    const identifier = String(payload.email || payload.phone || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const authUser = (db.authUsers || []).find((entry) => {
      const email = String(entry.email || "").trim().toLowerCase();
      const phone = String(entry.phone || "").trim().toLowerCase();
      return (email === identifier || phone === identifier) && entry.password === password;
    });

    if (!authUser) {
      throw new Error("Неверный email/телефон или пароль");
    }

    writeAuthSession({
      userId: authUser.id,
      role: authUser.role,
      storeId: authUser.store_id,
      at: Date.now()
    }, { remember: payload?.remember !== false });
    emitSync("partner-login");
    return buildLocalAppState();
  }

  function logoutLocalPartner() {
    clearAuthSessionStorage();
    emitSync("partner-logout");
    return buildLocalAppState();
  }

  function resetLocalPartnerPassword(payload) {
    const db = readDb();
    const identifier = String(payload?.identifier || payload?.email || payload?.phone || "").trim().toLowerCase();
    const nextPassword = String(payload?.newPassword || "").trim();

    if (!identifier) {
      throw new Error("Введите email или телефон");
    }
    if (!nextPassword || nextPassword.length < 6) {
      throw new Error("Новый пароль должен быть не короче 6 символов");
    }

    const authUser = (db.authUsers || []).find((entry) => {
      const email = String(entry.email || "").trim().toLowerCase();
      const phone = String(entry.phone || "").trim().toLowerCase();
      return email === identifier || phone === identifier;
    });
    if (!authUser) {
      throw new Error("Партнёр с таким email или телефоном не найден");
    }

    const updatedAt = nowIso();
    db.authUsers = (db.authUsers || []).map((entry) =>
      entry.id === authUser.id
        ? {
            ...entry,
            password: nextPassword,
            updated_at: updatedAt
          }
        : entry
    );
    db.sellerNotifications = [
      createNotificationRow({
        storeId: authUser.store_id,
        type: "store_updated",
        title: "Пароль обновлён",
        message: "Доступ в seller CRM был обновлён через восстановление пароля."
      }),
      ...(db.sellerNotifications || [])
    ];

    writeDb(db);
    emitSync("partner-reset-password");
    return buildLocalAppState();
  }

  function saveLocalStore(payload) {
    const db = readDb();
    const authSession = readAuthSession();
    const authUser = authSession ? getLocalUserById(db, authSession.userId) : null;
    if (!authUser) throw new Error("Партнёр не авторизован");

    const storeRow = getLocalStoreByUserId(db, authUser.id);
    if (!storeRow) throw new Error("Магазин не найден");

    const nextStore = {
      ...storeRow,
      ...toDbStorePayload(
        {
          ...payload,
          id: storeRow.id,
          profileCompleted: payload.profileCompleted || isStoreProfileComplete(toDbStorePayload(payload, authUser.id))
        },
        authUser.id
      ),
      onboarding_completed: Boolean(payload.profileCompleted),
      status: payload.profileCompleted ? "active" : "pending_review",
      updated_at: nowIso()
    };

    db.stores = (db.stores || []).map((item) => (item.id === storeRow.id ? nextStore : item));
    db.authUsers = (db.authUsers || []).map((item) =>
      item.id === authUser.id
        ? {
            ...item,
            full_name: String(payload.ownerName || item.full_name || "").trim(),
            phone: String(payload.phone || item.phone || "").trim(),
            updated_at: nowIso()
          }
        : item
    );
    db.profiles = (db.profiles || []).map((item) =>
      item.id === authUser.id
        ? {
            ...item,
            full_name: String(payload.ownerName || item.full_name || "").trim(),
            phone: String(payload.phone || item.phone || "").trim(),
            updated_at: nowIso()
          }
        : item
    );
    db.sellerNotifications = [
      createNotificationRow({
        storeId: storeRow.id,
        type: "store_updated",
        title: "Профиль магазина обновлен",
        message: nextStore.onboarding_completed
          ? "Store onboarding завершён, кабинет полностью активен."
          : "Проверьте недостающие поля и завершите onboarding."
      }),
      ...(db.sellerNotifications || [])
    ];

    writeDb(db);
    emitSync("store-save");
    return buildLocalAppState();
  }

  function saveLocalProduct(payload) {
    const db = readDb();
    const authSession = readAuthSession();
    const authUser = authSession ? getLocalUserById(db, authSession.userId) : null;
    const storeRow = authUser ? getLocalStoreByUserId(db, authUser.id) : null;
    if (!authUser || !storeRow) throw new Error("Партнёр не авторизован");

    const productRow = toDbProductPayload(payload, storeRow.id);
    const exists = (db.products || []).some((item) => item.id === productRow.id);
    const existingProduct = exists ? (db.products || []).find((item) => item.id === productRow.id) : null;
    const nextProduct = {
      ...(existingProduct || {}),
      ...productRow,
      created_at: existingProduct?.created_at || nowIso(),
      updated_at: nowIso()
    };

    db.products = exists
      ? (db.products || []).map((item) => (item.id === nextProduct.id ? nextProduct : item))
      : [nextProduct, ...(db.products || [])];

    db.stores = (db.stores || []).map((item) =>
      item.id === storeRow.id
        ? {
            ...item,
            onboarding_completed: true,
            status: "active",
            updated_at: nowIso()
          }
        : item
    );

    const nextNotifications = [...(db.sellerNotifications || [])];
    nextNotifications.unshift(
      createNotificationRow({
        storeId: storeRow.id,
        type: "product_published",
        title: exists ? "Карточка товара обновлена" : "Новый товар опубликован",
        message: nextProduct.title
      })
    );
    if (Number(nextProduct.stock || 0) > 0 && Number(nextProduct.stock || 0) <= 3) {
      nextNotifications.unshift(
        createNotificationRow({
          storeId: storeRow.id,
          type: "product_low_stock",
          title: "Низкий остаток товара",
          message: `${nextProduct.title} • осталось ${nextProduct.stock} шт.`
        })
      );
    }
    db.sellerNotifications = nextNotifications;

    writeDb(db);
    emitSync("product-save");
    return buildLocalAppState();
  }

  function deleteLocalProduct(productId) {
    const db = readDb();
    const authSession = readAuthSession();
    const authUser = authSession ? getLocalUserById(db, authSession.userId) : null;
    const storeRow = authUser ? getLocalStoreByUserId(db, authUser.id) : null;
    if (!authUser || !storeRow) throw new Error("Партнёр не авторизован");

    const removedProduct = (db.products || []).find((item) => item.id === productId && item.store_id === storeRow.id);
    db.products = (db.products || []).filter((item) => !(item.id === productId && item.store_id === storeRow.id));
    if (removedProduct) {
      db.sellerNotifications = [
        createNotificationRow({
          storeId: storeRow.id,
          type: "product_published",
          title: "Товар удалён",
          message: removedProduct.title
        }),
        ...(db.sellerNotifications || [])
      ];
    }
    writeDb(db);
    emitSync("product-delete");
    return buildLocalAppState();
  }

  function updateLocalOrderStatus(payload) {
    const db = readDb();
    const authSession = readAuthSession();
    const authUser = authSession ? getLocalUserById(db, authSession.userId) : null;
    const storeRow = authUser ? getLocalStoreByUserId(db, authUser.id) : null;
    if (!authUser || !storeRow) throw new Error("Партнёр не авторизован");

    const target = (db.orders || []).find((item) => item.id === payload.orderId && item.store_id === storeRow.id);
    if (!target) throw new Error("Заказ не найден");
    if (!canTransitionOrderStatus(target.status, payload.status, target.delivery_type)) {
      throw new Error("Недопустимый переход статуса заказа");
    }

    db.orders = (db.orders || []).map((item) =>
      item.id === target.id
        ? {
            ...item,
            status: payload.status,
            updated_at: nowIso()
          }
        : item
    );
    db.sellerNotifications = [
      createNotificationRow({
        storeId: storeRow.id,
        type: "order_status",
        title: `Заказ ${target.id} обновлен`,
        message: `Новый статус: ${payload.status}`
      }),
      ...(db.sellerNotifications || [])
    ];
    appendSystemChatMessage(
      db,
      {
        ...target,
        status: payload.status
      },
      `Статус заказа обновлён: ${getOrderStatusLabel(payload.status)}`,
      {
        buyerUnreadIncrement: 1
      }
    );

    writeDb(db);
    emitSync("order-status");
    return buildLocalAppState();
  }

  function loadLocalOrderChats(payload) {
    const orderIds = Array.isArray(payload?.orderIds)
      ? payload.orderIds.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

    return attachChatsToAppState(buildLocalAppState(), orderIds);
  }

  function sendLocalOrderChatMessage(payload) {
    const db = readDb();
    const orderId = String(payload?.orderId || "").trim();
    const text = String(payload?.text || "").trim();
    const senderType = payload?.senderType === "seller" ? "seller" : "buyer";
    if (!orderId) throw new Error("Заказ для чата не найден");
    if (!text) throw new Error("Введите сообщение");

    const orderRow = (db.orders || []).find((item) => item.id === orderId);
    if (!orderRow) throw new Error("Заказ не найден");

    if (senderType === "seller") {
      const authSession = readAuthSession();
      const authUser = authSession ? getLocalUserById(db, authSession.userId) : null;
      const storeRow = authUser ? getLocalStoreByUserId(db, authUser.id) : null;
      if (!authUser || !storeRow || storeRow.id !== orderRow.store_id) {
        throw new Error("Партнёр не авторизован для этого чата");
      }
    }

    const threadRow = ensureChatThreadRow(db, orderRow);
    const senderName =
      String(payload?.senderName || "").trim() ||
      (senderType === "seller"
        ? (db.stores || []).find((item) => item.id === orderRow.store_id)?.name || "Продавец"
        : orderRow.customer_name || "Покупатель");
    const messageRow = {
      id: makeId("chat-message"),
      thread_id: threadRow.id,
      order_id: orderRow.id,
      sender_type: senderType,
      sender_name: senderName,
      text,
      created_at: nowIso()
    };

    db.chatMessages = [...(db.chatMessages || []), messageRow];
    db.chatThreads = (db.chatThreads || []).map((thread) =>
      thread.id === threadRow.id
        ? {
            ...thread,
            store_name: thread.store_name || orderRow.store_name || "",
            last_message: text,
            last_message_at: messageRow.created_at,
            updated_at: messageRow.created_at,
            buyer_unread_count:
              senderType === "seller" ? Math.max(0, Number(thread.buyer_unread_count || 0)) + 1 : 0,
            seller_unread_count:
              senderType === "buyer" ? Math.max(0, Number(thread.seller_unread_count || 0)) + 1 : 0
          }
        : thread
    );

    if (senderType === "buyer") {
      db.sellerNotifications = [
        createNotificationRow({
          storeId: orderRow.store_id,
          type: "order_new",
          title: `Сообщение по заказу ${orderId}`,
          message: `${orderRow.customer_name || "Клиент DRIVEX"}: ${text.slice(0, 80)}`
        }),
        ...(db.sellerNotifications || [])
      ];
    }

    writeDb(db);
    emitSync("order-chat-message");
    return attachChatsToAppState(buildLocalAppState(), [orderId]);
  }

  function markLocalOrderChatRead(payload) {
    const db = readDb();
    const orderId = String(payload?.orderId || "").trim();
    const readerType = payload?.readerType === "seller" ? "seller" : "buyer";
    if (!orderId) throw new Error("Заказ для чата не найден");

    const orderRow = (db.orders || []).find((item) => item.id === orderId);
    if (!orderRow) throw new Error("Заказ не найден");

    if (readerType === "seller") {
      const authSession = readAuthSession();
      const authUser = authSession ? getLocalUserById(db, authSession.userId) : null;
      const storeRow = authUser ? getLocalStoreByUserId(db, authUser.id) : null;
      if (!authUser || !storeRow || storeRow.id !== orderRow.store_id) {
        throw new Error("Партнёр не авторизован для этого чата");
      }
    }

    db.chatThreads = (db.chatThreads || []).map((thread) =>
      thread.order_id === orderId
        ? {
            ...thread,
            buyer_unread_count: readerType === "buyer" ? 0 : Math.max(0, Number(thread.buyer_unread_count || 0)),
            seller_unread_count: readerType === "seller" ? 0 : Math.max(0, Number(thread.seller_unread_count || 0)),
            updated_at: nowIso()
          }
        : thread
    );

    writeDb(db);
    emitSync("order-chat-read");
    return attachChatsToAppState(buildLocalAppState(), [orderId]);
  }

  function recordLocalMarketplaceCheckout(payload) {
    const db = readDb();
    const incomingOrders = Array.isArray(payload.orders) ? payload.orders : [];
    if (!incomingOrders.length) return buildLocalAppState();

    const nextOrders = [];
    const nextOrderItems = [];
    const nextNotifications = [];

    for (const order of incomingOrders) {
      const orderId = order.id || makeId("order");
      nextOrders.push({
        id: orderId,
        store_id: order.storeId,
        store_name: order.storeName || "",
        customer_user_id: null,
        customer_name: order.customerName || "Клиент DRIVEX",
        customer_phone: order.customerPhone || "",
        delivery_type: String(order.deliveryMethod || "Доставка").toLowerCase().includes("самовывоз")
          ? "pickup"
          : "delivery",
        delivery_address: order.address || "",
        total_amount: Math.max(0, Number(order.amount || 0)),
        status: order.status || "new",
        created_at: `${String(order.date || nowIso()).slice(0, 10)}T10:00:00.000Z`,
        updated_at: nowIso()
      });
      for (const item of order.items || []) {
        nextOrderItems.push({
          id: makeId("order-item"),
          order_id: orderId,
          product_id: item.productId || null,
          product_title: item.title || "Товар",
          quantity: Math.max(1, Number(item.qty || 1)),
          unit_price: Math.max(0, Number(item.price || 0)),
          total_price: Math.max(1, Number(item.qty || 1)) * Math.max(0, Number(item.price || 0))
        });
      }
      nextNotifications.push(
        createNotificationRow({
          storeId: order.storeId,
          type: "order_new",
          title: `Новый заказ ${orderId}`,
          message: `${order.customerName || "Клиент DRIVEX"} • ${order.amount || 0} TJS`
        })
      );
      const draftOrderRow = {
        id: orderId,
        store_id: order.storeId,
        store_name: order.storeName || "",
        customer_name: order.customerName || "Клиент DRIVEX",
        customer_phone: order.customerPhone || "",
        created_at: `${String(order.date || nowIso()).slice(0, 10)}T10:00:00.000Z`
      };
      ensureChatThreadRow(db, draftOrderRow);
      appendSystemChatMessage(
        db,
        draftOrderRow,
        "Заказ создан. Продавец скоро подтвердит его."
      );
    }

    db.orders = [...nextOrders, ...(db.orders || [])];
    db.orderItems = [...nextOrderItems, ...(db.orderItems || [])];
    db.sellerNotifications = [...nextNotifications, ...(db.sellerNotifications || [])];

    writeDb(db);
    emitSync("marketplace-checkout");
    return buildLocalAppState();
  }

  async function loadSupabaseAppState() {
    const client = createSupabaseClient();
    if (!client) return buildLocalAppState();

    const { data: authData } = await client.auth.getSession();
    const session = authData?.session || null;

    const [{ data: storesRows }, { data: productsRows }] = await Promise.all([
      client.from("stores").select("*").eq("status", "active"),
      client.from("products").select("*").eq("publish_status", "active")
    ]);

    const catalogStoreRows = Array.isArray(storesRows) ? storesRows : [];
    const catalogProductRows = Array.isArray(productsRows) ? productsRows : [];
    const seller = session?.user
      ? await (async () => {
          const userId = session.user.id;
          const [{ data: profileRow }, { data: storeRow }] = await Promise.all([
            client.from("users").select("*").eq("id", userId).maybeSingle(),
            client.from("stores").select("*").eq("owner_user_id", userId).maybeSingle()
          ]);
          if (!storeRow) return null;
          const [{ data: sellerProducts }, { data: sellerOrders }, { data: sellerNotifications }] = await Promise.all([
            client.from("products").select("*").eq("store_id", storeRow.id).order("updated_at", { ascending: false }),
            client.from("orders").select("*").eq("store_id", storeRow.id).order("created_at", { ascending: false }),
            client.from("seller_notifications").select("*").eq("store_id", storeRow.id).order("created_at", { ascending: false }).limit(12)
          ]);
          const orderIds = (sellerOrders || []).map((item) => item.id);
          const { data: orderItems } = orderIds.length
            ? await client.from("order_items").select("*").in("order_id", orderIds)
            : { data: [] };

          return {
            profile: mapProfileRowToFrontend(profileRow, {
              id: session.user.id,
              full_name: profileRow?.full_name || session.user.user_metadata?.full_name || "",
              email: session.user.email || "",
              phone: profileRow?.phone || session.user.user_metadata?.phone || "",
              role: profileRow?.role || "seller",
              store_id: storeRow.id
            }),
            store: mapStoreRowToFrontend(storeRow, {
              full_name: profileRow?.full_name || session.user.user_metadata?.full_name || "",
              phone: profileRow?.phone || session.user.user_metadata?.phone || ""
            }),
            products: (sellerProducts || []).map(mapProductRowToFrontend).filter(Boolean),
            orders: mapOrderRowsToFrontend(sellerOrders || [], orderItems || []),
            notifications: (sellerNotifications || []).map(mapNotificationRowToFrontend)
          };
        })()
      : null;

    return {
      ...getStatus(),
      session: session?.user
        ? {
            id: session.user.id,
            name: seller?.profile?.ownerFullName || session.user.user_metadata?.full_name || "",
            email: session.user.email || "",
            role: seller?.profile ? "seller" : "buyer",
            sellerStoreId: seller?.store?.id || "auto-parts-khujand"
          }
        : null,
      seller,
      catalog: {
        stores: catalogStoreRows.map((row) => mapStoreRowToCatalog(row, { phone: "" })).filter(Boolean),
        products: catalogProductRows.map(mapProductRowToCatalog).filter(Boolean)
      }
    };
  }

  async function registerSupabasePartner(payload) {
    const client = createSupabaseClient();
    if (!client) return persistLocalRegistration(payload);

    const email = String(payload.profile?.email || "").trim();
    const password = String(payload.profile?.password || "");
    let authData = null;
    let authError = null;
    ({ data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: payload.profile?.ownerFullName || "",
          phone: payload.profile?.phone || "",
          role: "seller"
        }
      }
    }));

    if (authError) {
      if (/registered|exists|already/i.test(String(authError.message || ""))) {
        const loginResult = await client.auth.signInWithPassword({
          email,
          password
        });
        if (loginResult.error) {
          throw new Error("Email уже зарегистрирован. Войдите через seller CRM с тем же паролем.");
        }
        authData = loginResult.data;
      } else {
        throw authError;
      }
    }
    const userId = authData?.user?.id;
    if (!userId) return loadSupabaseAppState();

    const profileRow = {
      id: userId,
      full_name: payload.profile?.ownerFullName || "",
      phone: payload.profile?.phone || "",
      role: "seller"
    };
    const storeRow = toDbStorePayload(
      {
        ...(payload.store || {}),
        profileCompleted: Boolean(payload.store?.profileCompleted)
      },
      userId
    );
    storeRow.owner_user_id = userId;
    storeRow.onboarding_completed = Boolean(payload.store?.profileCompleted);
    storeRow.status = payload.store?.profileCompleted ? "active" : "pending_review";

    const { error: profileError } = await client.from("users").upsert(profileRow, { onConflict: "id" });
    if (profileError) throw profileError;
    const { error: storeError } = await client.from("stores").upsert(storeRow);
    if (storeError) throw storeError;
    await client.from("seller_notifications").insert({
      store_id: storeRow.id,
      type: "welcome",
      title: "Магазин зарегистрирован",
      message: "Проверьте карточку магазина и завершите onboarding."
    });

    if (!authData?.session) {
      const { error: signInError } = await client.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        throw signInError;
      }
    }

    return loadSupabaseAppState();
  }

  async function loginSupabasePartner(payload) {
    const client = createSupabaseClient();
    if (!client) return loginLocalPartner(payload);

    const identifier = String(payload.email || payload.phone || "").trim();
    let email = identifier;

    // Вход по телефону: продавцы регистрируются по email, поэтому резолвим
    // email по номеру через серверный endpoint (service-role). Если введён email
    // (содержит @) — используем как есть.
    if (identifier && identifier.indexOf("@") === -1) {
      try {
        const resp = await fetch("/api/partner/email-by-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: identifier })
        });
        const data = await resp.json().catch(() => ({}));
        if (data && data.email) {
          email = data.email;
        } else {
          throw new Error("Не нашли магазин с таким номером. Войдите по email или зарегистрируйтесь.");
        }
      } catch (e) {
        throw new Error(e && e.message ? e.message : "Не удалось войти по номеру телефона");
      }
    }

    const { error } = await client.auth.signInWithPassword({
      email,
      password: String(payload.password || "")
    });
    if (error) throw error;
    return loadSupabaseAppState();
  }

  async function resetSupabasePartnerPassword(payload) {
    const client = createSupabaseClient();
    if (!client) return resetLocalPartnerPassword(payload);

    const email = String(payload?.email || payload?.identifier || "").trim();
    const nextPassword = String(payload?.newPassword || "").trim();
    if (!email) {
      throw new Error("Для Supabase-восстановления укажите email");
    }
    if (!nextPassword || nextPassword.length < 6) {
      throw new Error("Новый пароль должен быть не короче 6 символов");
    }

    const { error } = await client.auth.updateUser({
      password: nextPassword
    });
    if (error) {
      const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}#/partner/login`
      });
      if (resetError) throw resetError;
    }

    emitSync("partner-reset-password");
    return loadSupabaseAppState();
  }

  async function logoutSupabasePartner() {
    const client = createSupabaseClient();
    if (!client) return logoutLocalPartner();
    await client.auth.signOut();
    emitSync("partner-logout");
    return loadSupabaseAppState();
  }

  async function saveSupabaseStore(payload) {
    const client = createSupabaseClient();
    if (!client) return saveLocalStore(payload);

    const { data: authData } = await client.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) throw new Error("Партнёр не авторизован");

    const { data: existingStore, error: storeLookupError } = await client
      .from("stores")
      .select("*")
      .eq("owner_user_id", userId)
      .maybeSingle();
    if (storeLookupError) throw storeLookupError;

    const storeRow = {
      ...toDbStorePayload(payload, userId),
      id: existingStore?.id || payload.id || slugify(payload.name || makeId("store"), makeId("store")),
      owner_user_id: userId,
      onboarding_completed: Boolean(payload.profileCompleted),
      status: payload.profileCompleted ? "active" : "pending_review"
    };

    const { error: storeError } = await client.from("stores").upsert(storeRow);
    if (storeError) throw storeError;

    await client.from("users").upsert({
      id: userId,
      full_name: payload.ownerName || "",
      phone: payload.phone || "",
      role: "seller"
    }, { onConflict: "id" });

    await client.from("seller_notifications").insert({
      store_id: storeRow.id,
      type: "store_updated",
      title: "Профиль магазина обновлен",
      message: storeRow.onboarding_completed
        ? "Store onboarding завершён, кабинет полностью активен."
        : "Проверьте недостающие поля и завершите onboarding."
    });

    emitSync("store-save");
    return loadSupabaseAppState();
  }

  async function saveSupabaseProduct(payload) {
    const client = createSupabaseClient();
    if (!client) return saveLocalProduct(payload);

    const { data: authData } = await client.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) throw new Error("Партнёр не авторизован");
    const { data: storeRow } = await client.from("stores").select("*").eq("owner_user_id", userId).maybeSingle();
    if (!storeRow) throw new Error("Магазин не найден");

    const productRow = {
      ...toDbProductPayload(payload, storeRow.id),
      store_id: storeRow.id
    };
    // products.id — это uuid в БД. Клиентские id ("seller-product-…") не валидны:
    // для нового товара генерируем uuid, при редактировании сохраняем существующий uuid.
    if (!isUuid(productRow.id)) productRow.id = makeUuid();

    const { error } = await client.from("products").upsert(productRow);
    if (error) throw error;

    await client.from("seller_notifications").insert({
      store_id: storeRow.id,
      type: Number(productRow.stock || 0) > 0 && Number(productRow.stock || 0) <= 3 ? "product_low_stock" : "product_published",
      title: payload.id ? "Карточка товара обновлена" : "Новый товар опубликован",
      message:
        Number(productRow.stock || 0) > 0 && Number(productRow.stock || 0) <= 3
          ? `${productRow.title} • осталось ${productRow.stock} шт.`
          : productRow.title
    });

    emitSync("product-save");
    return loadSupabaseAppState();
  }

  async function deleteSupabaseProduct(productId) {
    const client = createSupabaseClient();
    if (!client) return deleteLocalProduct(productId);
    const { data: authData } = await client.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) throw new Error("Партнёр не авторизован");
    const { data: storeRow } = await client.from("stores").select("*").eq("owner_user_id", userId).maybeSingle();
    if (!storeRow) throw new Error("Магазин не найден");

    const { data: existingProduct } = await client
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("store_id", storeRow.id)
      .maybeSingle();

    const { error } = await client.from("products").delete().eq("id", productId).eq("store_id", storeRow.id);
    if (error) throw error;

    if (existingProduct) {
      await client.from("seller_notifications").insert({
        store_id: storeRow.id,
        type: "product_published",
        title: "Товар удалён",
        message: existingProduct.title
      });
    }

    emitSync("product-delete");
    return loadSupabaseAppState();
  }

  async function updateSupabaseOrderStatus(payload) {
    const client = createSupabaseClient();
    if (!client) return updateLocalOrderStatus(payload);
    const { data: authData } = await client.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) throw new Error("Партнёр не авторизован");
    const { data: storeRow } = await client.from("stores").select("*").eq("owner_user_id", userId).maybeSingle();
    if (!storeRow) throw new Error("Магазин не найден");

    const { data: orderRow } = await client
      .from("orders")
      .select("*")
      .eq("id", payload.orderId)
      .eq("store_id", storeRow.id)
      .maybeSingle();
    if (!orderRow) throw new Error("Заказ не найден");
    if (!canTransitionOrderStatus(orderRow.status, payload.status, orderRow.delivery_type)) {
      throw new Error("Недопустимый переход статуса заказа");
    }

    const { error } = await client
      .from("orders")
      .update({ status: payload.status, updated_at: nowIso() })
      .eq("id", payload.orderId)
      .eq("store_id", storeRow.id);
    if (error) throw error;

    await client.from("seller_notifications").insert({
      store_id: storeRow.id,
      type: "order_status",
      title: `Заказ ${payload.orderId} обновлен`,
      message: `Новый статус: ${payload.status}`
    });

    emitSync("order-status");
    return loadSupabaseAppState();
  }

  async function recordSupabaseMarketplaceCheckout(payload) {
    const client = createSupabaseClient();
    if (!client) return recordLocalMarketplaceCheckout(payload);
    const incomingOrders = Array.isArray(payload.orders) ? payload.orders : [];
    if (!incomingOrders.length) return loadSupabaseAppState();

    // RLS на orders требует customer_user_id = auth.uid(). Без id покупателя
    // INSERT падает с "violates row-level security policy" и заказ не оформляется.
    // id берём из payload (передан приложением из активной сессии). Фолбэк —
    // getSession() (локальное чтение из storage, без сети). НЕ зовём getUser():
    // сетевой вызов + Web Lock, который под множеством вкладок рвётся
    // ("Lock broken by another request with the 'steal' option") и срывает заказ.
    let buyerUserId = payload.buyerUserId || null;
    if (!buyerUserId) {
      try {
        const { data: sessionData } = await client.auth.getSession();
        buyerUserId = sessionData?.session?.user?.id || null;
      } catch (e) {
        buyerUserId = null;
      }
    }

    for (const order of incomingOrders) {
      // Не передаём id — пусть Supabase генерирует UUID автоматически
      // Это исправляет ошибку "invalid input syntax for type uuid"
      const orderRow = {
        store_id: order.storeId,
        customer_user_id: buyerUserId,
        customer_name: order.customerName || "Клиент DRIVEX",
        customer_phone: order.customerPhone || "",
        delivery_type: String(order.deliveryMethod || "Доставка").toLowerCase().includes("самовывоз")
          ? "pickup"
          : "delivery",
        delivery_address: order.address || "",
        total_amount: Math.max(0, Number(order.amount || 0)),
        status: order.status || "new",
        items: Array.isArray(order.items) ? order.items : []
      };
      const { data: insertedOrder, error: orderError } = await client
        .from("orders").insert(orderRow).select("id").single();
      if (orderError) throw orderError;
      const createdOrderId = insertedOrder?.id || makeId("order");

      const orderItems = (order.items || []).map((item) => ({
        order_id: createdOrderId,
        product_id: item.productId || null,
        product_title: item.title || "Товар",
        quantity: Math.max(1, Number(item.qty || 1)),
        unit_price: Math.max(0, Number(item.price || 0)),
        total_price: Math.max(1, Number(item.qty || 1)) * Math.max(0, Number(item.price || 0))
      }));

      if (orderItems.length) {
        const { error: itemsError } = await client.from("order_items").insert(orderItems);
        if (itemsError) console.warn("[seller-backend] order_items insert:", itemsError.message);
      }

      await client.from("seller_notifications").insert({
        store_id: order.storeId,
        type: "order_new",
        title: `Новый заказ ${createdOrderId}`,
        message: `${order.customerName || "Клиент DRIVEX"} • ${order.amount || 0} TJS`
      });
    }

    emitSync("marketplace-checkout");
    return loadSupabaseAppState();
  }

  const api = {
    storageKeys,
    eventName: backendSyncEvent,
    getStatus,
    async loadAppState() {
      return getBackendMode() === "supabase" ? loadSupabaseAppState() : buildLocalAppState();
    },
    async registerPartner(payload) {
      return getBackendMode() === "supabase"
        ? registerSupabasePartner(payload)
        : persistLocalRegistration(payload);
    },
    async loginPartner(payload) {
      return getBackendMode() === "supabase" ? loginSupabasePartner(payload) : loginLocalPartner(payload);
    },
    async resetPartnerPassword(payload) {
      return getBackendMode() === "supabase"
        ? resetSupabasePartnerPassword(payload)
        : resetLocalPartnerPassword(payload);
    },
    async logoutPartner() {
      return getBackendMode() === "supabase" ? logoutSupabasePartner() : logoutLocalPartner();
    },
    async saveStore(payload) {
      return getBackendMode() === "supabase" ? saveSupabaseStore(payload) : saveLocalStore(payload);
    },
    async saveProduct(payload) {
      return getBackendMode() === "supabase" ? saveSupabaseProduct(payload) : saveLocalProduct(payload);
    },
    async deleteProduct(productId) {
      return getBackendMode() === "supabase" ? deleteSupabaseProduct(productId) : deleteLocalProduct(productId);
    },
    async updateOrderStatus(payload) {
      return getBackendMode() === "supabase" ? updateSupabaseOrderStatus(payload) : updateLocalOrderStatus(payload);
    },
    async recordMarketplaceCheckout(payload) {
      return getBackendMode() === "supabase"
        ? recordSupabaseMarketplaceCheckout(payload)
        : recordLocalMarketplaceCheckout(payload);
    },
    async loadOrderChats(payload) {
      return loadLocalOrderChats(payload);
    },
    async sendOrderChatMessage(payload) {
      return sendLocalOrderChatMessage(payload);
    },
    async markOrderChatRead(payload) {
      return markLocalOrderChatRead(payload);
    }
  };

  window.DrivexSellerBackend = api;
})();


