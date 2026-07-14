// app/utils-models.js — Нормализация данных + утилиты
(() => {
  'use strict';
  window.DX = window.DX || {};
  // React hooks из DX (globals.js должен загрузиться первым)
  const React = window.DX.React || window.React;
  const { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } = (window.DX.React || window.React || {});
  // ── Shared mutable state из data.js (объекты передаются по ссылке) ──
  var marketplaceRuntime   = window.DX.marketplaceRuntime   || { stores: [], products: [] };
  var marketplaceBaseData  = window.DX.marketplaceBaseData  || { categories: [], stores: [], products: [] };

  const html = window.DX.html;

  const DX = window.DX;

  const drivexSyncChannelName = "drivex.market.sync.v1";
  const drivexStorageKeys = Object.freeze({
    profile: "drivex.profile.v1",
    activeCar: "drivex.active-car.v1",
    documents: "drivex.documents.v1",
    maintenance: "drivex.maintenance.v1",
    cart: "drivex.cart.v1",
    buyerOrders: "drivex.buyer.orders.v1",
    buyerSession: "drivex.buyer.session.v1",
    buyerUsers: "drivex.buyer.users.v1",
    buyerGarage: "drivex.buyer.garage.v1",
    savedPlaces: "drivex.saved-places.v1",
    favorites: "drivex.favorites.v1",
    orderChats: "drivex.order-chats.v1",
    buyerInvite: "drivex.buyer.invite.v1",
    referrals: "drivex.referrals.v1",
    trips: "drivex.trips.v1",
    marketplaceCatalog: "drivex.market.catalog.v1",
    sellerSession: "drivex.seller.session.v1",
    sellerProfile: "drivex.seller.profile.v1",
    sellerStore: "drivex.seller.store.v1",
    sellerProducts: "drivex.seller.products.v1",
    sellerOrders: "drivex.seller.orders.v1",
    sellerNotifications: "drivex.seller.notifications.v1",
    sellerPendingRoute: "drivex.seller.pending-route.v1",
    serviceSession: "drivex.service.session.v1",
    serviceProfile: "drivex.service.profile.v1",
    serviceCenter: "drivex.service.center.v1",
    serviceAuth: "drivex.service.auth.v1",
    serviceClients: "drivex.service.clients.v1",
    serviceOrders: "drivex.service.orders.v1",
    serviceInventory: "drivex.service.inventory.v1",
    serviceFinance: "drivex.service.finance.v1",
    serviceAppointments: "drivex.service.appointments.v1",
    serviceRequests: "drivex.service.requests.v1",
    emergencyContact: "drivex.emergency-contact.v1"
  });
  const liveSharedAppStateKeys = new Set([
    drivexStorageKeys.serviceClients,
    drivexStorageKeys.serviceOrders,
    drivexStorageKeys.serviceInventory,
    drivexStorageKeys.serviceFinance,
    drivexStorageKeys.serviceAppointments,
    drivexStorageKeys.serviceRequests,
    drivexStorageKeys.serviceCenter,
    drivexStorageKeys.maintenance,
    drivexStorageKeys.marketplaceCatalog,
    drivexStorageKeys.sellerOrders,
    drivexStorageKeys.sellerNotifications,
    drivexStorageKeys.orderChats
  ]);
  const buyerPersonalStorageKeys = new Set([
    drivexStorageKeys.profile,
    drivexStorageKeys.activeCar,
    drivexStorageKeys.buyerGarage,
    drivexStorageKeys.documents,
    drivexStorageKeys.maintenance,
    drivexStorageKeys.cart,
    drivexStorageKeys.buyerOrders,
    drivexStorageKeys.savedPlaces,
    drivexStorageKeys.favorites,
    drivexStorageKeys.buyerInvite,
    drivexStorageKeys.trips,
    drivexStorageKeys.emergencyContact
  ]);
  const drivexMediaDbName = "drivex.media.v1";
  const drivexMediaStoreName = "media";

  function canUseIndexedDbStorage() {
    return (
      typeof window !== "undefined" &&
      typeof window.indexedDB !== "undefined" &&
      String(window.location?.protocol || "").toLowerCase() !== "file:"
    );
  }

  function openDrivexMediaDatabase() {
    return new Promise((resolve) => {
      if (!canUseIndexedDbStorage()) {
        resolve(null);
        return;
      }

      try {
        const request = window.indexedDB.open(drivexMediaDbName, 1);

        request.onupgradeneeded = () => {
          try {
            const db = request.result;
            if (db && !db.objectStoreNames.contains(drivexMediaStoreName)) {
              db.createObjectStore(drivexMediaStoreName);
            }
          } catch {
            // ignore upgrade errors and fall back to in-memory only
          }
        };

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  function readDrivexMediaValue(key) {
    return openDrivexMediaDatabase().then((db) => new Promise((resolve) => {
      if (!db) {
        resolve(null);
        return;
      }

      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        try {
          db.close();
        } catch {
          // ignore
        }
        resolve(value);
      };

      try {
        const transaction = db.transaction(drivexMediaStoreName, "readonly");
        const store = transaction.objectStore(drivexMediaStoreName);
        const request = store.get(key);

        request.onsuccess = () => finish(request.result ?? null);
        request.onerror = () => finish(null);
        transaction.onerror = () => finish(null);
        transaction.onabort = () => finish(null);
      } catch {
        finish(null);
      }
    }));
  }

  function writeDrivexMediaValue(key, value) {
    return openDrivexMediaDatabase().then((db) => new Promise((resolve) => {
      if (!db) {
        resolve(false);
        return;
      }

      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        try {
          db.close();
        } catch {
          // ignore
        }
        resolve(result);
      };

      try {
        const transaction = db.transaction(drivexMediaStoreName, "readwrite");
        const store = transaction.objectStore(drivexMediaStoreName);
        const safeValue = value && typeof value === "object" ? value : {};
        const hasMedia = Boolean(
          normalizeServiceImageAsset(safeValue.coverImage) ||
          normalizeServiceGalleryList(safeValue.gallery).length
        );

        if (hasMedia) {
          store.put({
            coverImage: normalizeServiceImageAsset(safeValue.coverImage),
            gallery: normalizeServiceGalleryList(safeValue.gallery)
          }, key);
        } else {
          store.delete(key);
        }

        transaction.oncomplete = () => finish(true);
        transaction.onerror = () => finish(false);
        transaction.onabort = () => finish(false);
      } catch {
        finish(false);
      }
    }));
  }

  function getServiceCenterMediaStorageKey(centerId = "") {
    return `service-media:${slugifyText(centerId || servicePrimaryCenterId, servicePrimaryCenterId)}`;
  }

  const marketplaceData = {
    get categories() {
      return marketplaceBaseData.categories;
    },
    get stores() {
      return marketplaceRuntime.stores;
    },
    get products() {
      return marketplaceRuntime.products;
    }
  };

  function setMarketplaceRuntime(nextRuntime = {}) {
    if (Array.isArray(nextRuntime.stores)) {
      marketplaceRuntime.stores = nextRuntime.stores;
    }
    if (Array.isArray(nextRuntime.products)) {
      marketplaceRuntime.products = nextRuntime.products;
    }
  }

  function normalizeMarketplacePartnerCatalog(value) {
    const source = value && typeof value === "object" ? value : {};
    const stores = Array.isArray(source.stores) ? source.stores.filter(Boolean) : [];
    const products = Array.isArray(source.products) ? source.products.filter(Boolean) : [];
    // Тестовые магазины и товары (созданные при отладке регистрации продавцов)
    // скрываем из публичной витрины покупателя. Бекенд-данные не трогаем:
    // продавец в своём CRM видит их как раньше через seller-backend.
    const isTestName = (name) => /тест/i.test(String(name || ""));
    const hiddenStoreIds = new Set(
      stores.filter((store) => isTestName(store.name)).map((store) => String(store.id))
    );
    return {
      stores: stores.filter((store) => !hiddenStoreIds.has(String(store.id))),
      products: products.filter(
        (product) => !hiddenStoreIds.has(String(product.storeId)) && !isTestName(product.name)
      )
    };
  }

  // ⛔ АНТИ-ЭХО: polling каждые 3.5с применяет снапшот к state с новой identity,
  // после чего useEffect-ы «сохранения» отправляли ТЕ ЖЕ данные обратно на сервер
  // (13 POST за цикл, бесконечно). Кешируем последнее известное содержимое по ключу:
  // POST уходит только если данные реально изменились.
  const _lastSharedSent = Object.create(null);

  function _stableSharedSerialize(value) {
    try {
      return JSON.stringify(value === undefined ? null : value);
    } catch {
      return null; // не сериализуется — не кешируем, шлём как раньше
    }
  }

  async function fetchSharedAppState() {
    const response = await fetch("/api/app-state", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("App state load failed");
    const payload = await response.json();
    const state = payload && typeof payload.state === "object" && payload.state ? payload.state : {};
    // Запоминаем серверное содержимое: эффекты, эхо-сохраняющие применённый
    // снапшот, увидят совпадение и не будут дублировать POST.
    for (const [key, entry] of Object.entries(state)) {
      const value = entry && typeof entry === "object" && Object.prototype.hasOwnProperty.call(entry, "value")
        ? entry.value
        : entry;
      const s = _stableSharedSerialize(value);
      if (s !== null) _lastSharedSent[key] = s;
    }
    return state;
  }

  async function saveSharedAppState(key, value) {
    const serialized = _stableSharedSerialize(value);
    if (serialized !== null && _lastSharedSent[key] === serialized) {
      return {}; // содержимое не изменилось — POST не нужен
    }
    const response = await fetch("/api/app-state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ key, value })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error || "App state save failed");
    }
    // Кеш обновляем ТОЛЬКО после успешной записи — иначе неудачный POST
    // заблокировал бы повторную отправку тех же данных.
    if (serialized !== null) _lastSharedSent[key] = serialized;
    return response.json().catch(() => ({}));
  }

  async function fetchBuyerAppState(session) {
    const safeSession = normalizeBuyerSession(session);
    const client = getSupabaseClient();
    if (!client || !safeSession.authenticated || !safeSession.id) return null;

    // Таймаут: если облако отвечает дольше 7с, не держим пользователя за
    // блокирующим оверлеем — отдаём управление, приложение работает на локальном кеше.
    // До 2 попыток, таймаут 20с: на медленном соединении / «спящем» сервере
    // первый запрос мог не успеть за 7с → buyerStateReady не выставлялся и
    // СОХРАНЕНИЕ новых данных блокировалось (машина/ТО не попадали в облако).
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const query = client
          .from("user_app_state")
          .select("key,value,updated_at")
          .eq("user_id", safeSession.id);
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Облако отвечает слишком долго")), 20000)
        );
        const { data, error } = await Promise.race([query, timeout]);
        if (error) throw error;
        return (Array.isArray(data) ? data : []).reduce((acc, row) => {
          if (!row || typeof row.key !== "string") return acc;
          acc[row.key] = { value: row.value, updatedAt: row.updated_at || "" };
          // Анти-эхо: применение этого значения к state не должно породить
          // повторный upsert того же содержимого (см. saveBuyerAppState).
          const s = _stableSharedSerialize(row.value);
          if (s !== null) _lastBuyerSent[safeSession.id + "::" + row.key] = s;
          return acc;
        }, {});
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("fetchBuyerAppState failed");
  }

  // Убирает data:image/... из значения перед сохранением в Supabase
  // чтобы не превышать лимит размера тела запроса (~2MB)
  // Только HTTPS-URL из Storage остаются — они маленькие
  function slimValueForCloud(value) {
    if (!value || typeof value !== "object") return value;

    // Рекурсивно обходим объект и заменяем data URL на пустую строку
    function stripDataUrls(obj) {
      if (typeof obj === "string") {
        return obj.startsWith("data:image/") ? "" : obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(stripDataUrls);
      }
      if (obj && typeof obj === "object") {
        const result = {};
        for (const k of Object.keys(obj)) {
          result[k] = stripDataUrls(obj[k]);
        }
        return result;
      }
      return obj;
    }

    return stripDataUrls(value);
  }

  // Считает значение "пустым" (нет смысла хранить / опасно затирать им данные):
  // null/undefined, пустая строка, пустой массив, пустой объект, либо объект,
  // ВСЕ поля которого тоже пустые (напр. {cars:{}} у ТО/документов).
  function isEmptyishCloudValue(v) {
    if (v === null || v === undefined) return true;
    if (typeof v === "string") return v.trim() === "";
    if (typeof v === "number" || typeof v === "boolean") return false;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object") {
      const keys = Object.keys(v);
      if (keys.length === 0) return true;
      return keys.every((k) => isEmptyishCloudValue(v[k]));
    }
    return false;
  }

  // Анти-эхо для облака покупателя: ключ — "<userId>::<key>", значение —
  // последнее успешно отправленное/загруженное содержимое (JSON-строка).
  const _lastBuyerSent = Object.create(null);

  async function saveBuyerAppState(session, key, value) {
    const safeSession = normalizeBuyerSession(session);
    const client = getSupabaseClient();
    if (!client || !safeSession.authenticated || !safeSession.id) return null;

    // Убираем data URL перед сохранением в облако
    // Они хранятся только в localStorage (быстрый локальный кеш)
    const cloudValue = slimValueForCloud(value);

    // Содержимое не изменилось с последней успешной записи/загрузки — не гоняем
    // одинаковые upsert-ы в Supabase на каждый re-render.
    const _cacheKey = safeSession.id + "::" + key;
    const _serialized = _stableSharedSerialize(cloudValue);
    if (_serialized !== null && _lastBuyerSent[_cacheKey] === _serialized) {
      return true;
    }

    // ⛔ ЗАЩИТА ОТ ПОТЕРИ ДАННЫХ: не перезаписываем облако ПУСТЫМ значением,
    // если по этому ключу там уже лежат НЕпустые данные. Пустое почти всегда
    // означает "ещё не загрузилось" (гонка при входе на новом устройстве),
    // а не "пользователь всё удалил". Именно это раньше затирало гараж/ТО.
    if (isEmptyishCloudValue(cloudValue)) {
      try {
        const { data: rows } = await client
          .from("user_app_state")
          .select("value")
          .eq("user_id", safeSession.id)
          .eq("key", key)
          .limit(1);
        const existing = Array.isArray(rows) && rows.length ? rows[0] : null;
        if (existing && !isEmptyishCloudValue(existing.value)) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("[saveBuyerAppState] пропуск: НЕ затираю непустые данные пустыми", { key });
          }
          return false;
        }
      } catch (e) {
        // Проверку выполнить не удалось — безопаснее НЕ записывать пустое,
        // чтобы не рисковать существующими данными.
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[saveBuyerAppState] не удалось проверить облако — пропускаю пустую запись", { key, error: e && e.message });
        }
        return false;
      }
    }

    const { error } = await client.from("user_app_state").upsert(
      {
        user_id: safeSession.id,
        key,
        value: cloudValue,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,key" }
    );
    if (error) throw error;
    // Кеш — только после успешной записи, чтобы сбой не блокировал повтор.
    if (_serialized !== null) _lastBuyerSent[_cacheKey] = _serialized;
    return true;
  }

  const ToastContext = createContext({
    push: () => {}
  });

  function useToast() {
    return useContext(ToastContext);
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("ru-RU").format(price);
  }

  function formatTjsPrice(price) {
    return `${formatPrice(price)} TJS`;
  }

  // Русское склонение: pluralize(1,'товар','товара','товаров') → 'товар'
  function pluralize(n, one, few, many) {
    const num = Math.abs(Number(n) || 0);
    const mod10 = num % 10;
    const mod100 = num % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
  }

  function normalizeMarketSearchText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-z0-9\u0400-\u04ff]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getMarketProductPath(productId) {
    return `#/marketplace/product/${productId}`;
  }

  function getMarketStorePath(storeId) {
    return `#/marketplace/store/${storeId}`;
  }

  function getMarketCartPath() {
    return "#/marketplace/cart";
  }

  function normalizeMarketProductId(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    return raw;
  }

  function createMarketCartKey(productId, storeId = "") {
    const normalizedProductId = normalizeMarketProductId(productId);
    const normalizedStoreId = String(storeId || "").trim();
    if (!normalizedProductId) return "";
    return normalizedStoreId ? `${normalizedStoreId}::${normalizedProductId}` : normalizedProductId;
  }

  function parseMarketCartKey(cartKey) {
    const raw = String(cartKey || "").trim();
    if (!raw) {
      return { cartKey: "", storeId: "", productId: "" };
    }

    const separatorIndex = raw.indexOf("::");
    if (separatorIndex === -1) {
      return {
        cartKey: raw,
        storeId: "",
        productId: normalizeMarketProductId(raw)
      };
    }

    return {
      cartKey: raw,
      storeId: raw.slice(0, separatorIndex),
      productId: normalizeMarketProductId(raw.slice(separatorIndex + 2))
    };
  }

  // ── Избранное маркета: глобальный store с подпиской ──
  const marketFavoritesStore = {
    ids: new Set(),
    listeners: new Set(),
    notify() {
      this.listeners.forEach((listener) => { try { listener(); } catch { /* ignore */ } });
    },
    setAll(list, { silent = false } = {}) {
      this.ids = new Set(
        (Array.isArray(list) ? list : []).map((item) => String(item || "").trim()).filter(Boolean)
      );
      if (!silent) this.notify();
    },
    toggle(key) {
      const clean = String(key || "").trim();
      if (!clean) return false;
      const wasFavorite = this.ids.has(clean);
      if (wasFavorite) { this.ids.delete(clean); } else { this.ids.add(clean); }
      this.notify();
      return !wasFavorite;
    },
    has(key) { return this.ids.has(String(key || "").trim()); },
    list() { return [...this.ids]; },
    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
  };

  function useMarketFavorites() {
    const [, setTick] = useState(0);
    useEffect(() => marketFavoritesStore.subscribe(() => setTick((v) => v + 1)), []);
    return marketFavoritesStore;
  }

  function getMarketFavoriteKey(product) {
    if (!product || typeof product !== "object") return "";
    return createMarketCartKey(product.id, product.storeId || "");
  }

  function getMarketFavoriteProducts(catalog) {
    return (Array.isArray(catalog) ? catalog : []).filter((product) =>
      marketFavoritesStore.has(getMarketFavoriteKey(product))
    );
  }

  // ── Реальные оценки товаров: глобальный store ──
  const marketRatingsStore = {
    map: {},
    listeners: new Set(),
    notify() {
      this.listeners.forEach((listener) => { try { listener(); } catch { /* ignore */ } });
    },
    setAll(map) {
      if (!map || typeof map !== "object") return;
      this.map = { ...this.map, ...map };
      this.notify();
    },
    set(productId, entry) {
      const key = String(productId ?? "").trim();
      if (!key || !entry) return;
      this.map[key] = { rating: Number(entry.rating) || 0, count: Math.max(0, Math.floor(Number(entry.count) || 0)) };
      this.notify();
    },
    get(productId) { return this.map[String(productId ?? "").trim()] || null; },
    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
  };

  function useMarketRatings() {
    const [, setTick] = useState(0);
    useEffect(() => marketRatingsStore.subscribe(() => setTick((v) => v + 1)), []);
    return marketRatingsStore;
  }

  function getMarketProductRating(product) {
    const entry = marketRatingsStore.get(product && product.id);
    if (entry && entry.count > 0) return { rating: entry.rating, count: entry.count, has: true };
    return { rating: 0, count: 0, has: false };
  }

  function getMarketStoreRating(storeId) {
    const safeStoreId = String(storeId ?? "").trim();
    if (!safeStoreId) return { rating: 0, count: 0, has: false };
    let total = 0;
    let count = 0;
    for (const product of marketplaceData.products) {
      if (String(product.storeId ?? "").trim() !== safeStoreId) continue;
      const entry = marketRatingsStore.get(product.id);
      if (!entry || !entry.count) continue;
      total += entry.rating * entry.count;
      count += entry.count;
    }
    if (!count) return { rating: 0, count: 0, has: false };
    return { rating: Math.round((total / count) * 10) / 10, count, has: true };
  }

  function normalizeProductCompatibility(value) {
    if (!value || typeof value !== "object") return null;
    const brands = Array.isArray(value.brands) ? value.brands.filter(Boolean).map(String) : [];
    const models = Array.isArray(value.models) ? value.models.filter(Boolean).map(String) : [];
    const years = Array.isArray(value.years)
      ? value.years.map((year) => Math.floor(Number(year))).filter((year) => Number.isFinite(year))
      : [];
    const universal = Boolean(value.universal) || (!brands.length && !models.length && !years.length);
    return { universal, brands, models, years };
  }

  function productMatchesCar(product, { brand = "", model = "", year = "" } = {}) {
    const compat = normalizeProductCompatibility(product && product.compatibility);
    if (!compat || compat.universal) return { match: true, universal: true };
    if (compat.brands.length && brand) {
      const brandNorm = normalizeMarketSearchText(brand);
      const hasBrand = compat.brands.some((item) => normalizeMarketSearchText(item) === brandNorm);
      if (!hasBrand) return { match: false, universal: false };
    }
    if (compat.models.length && model && model !== "any") {
      const modelNorm = normalizeMarketSearchText(model);
      const hasModel = compat.models.some((item) => {
        const itemNorm = normalizeMarketSearchText(item);
        return itemNorm.includes(modelNorm) || modelNorm.includes(itemNorm);
      });
      if (!hasModel) return { match: false, universal: false };
    }
    if (compat.years.length === 2 && year) {
      const numericYear = Number(year);
      if (Number.isFinite(numericYear) && (numericYear < compat.years[0] || numericYear > compat.years[1])) {
        return { match: false, universal: false };
      }
    }
    return { match: true, universal: false };
  }

  const marketQuestionThreadPrefix = "question::";

  function getMarketProductQuestionThreadId(storeId, productId) {
    const safeStoreId = String(storeId ?? "").trim();
    const safeProductId = String(productId ?? "").trim();
    if (!safeStoreId || !safeProductId) return "";
    return `${marketQuestionThreadPrefix}${safeStoreId}::${safeProductId}`;
  }

  function getMarketStore(storeId) {
    return marketplaceData.stores.find((store) => store.id === storeId) || null;
  }

  function getMarketProduct(productId) {
    const normalizedId = normalizeMarketProductId(productId);
    return marketplaceData.products.find((product) => normalizeMarketProductId(product.id) === normalizedId) || null;
  }

  function getMarketProductsByStore(storeId) {
    return marketplaceData.products.filter((product) => product.storeId === storeId);
  }

  function filterMarketProducts(
    catalog,
    {
      query = "",
      categoryId = "all",
      city = "all",
      deliveryOnly = false,
      saleOnly = false,
      inStockOnly = false,
      feedFilterId = "all"
    } = {}
  ) {
    const normalizedQuery = normalizeMarketSearchText(query);
    const queryTokens = normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : [];

    return (Array.isArray(catalog) ? catalog : []).filter((product) => {
      const store = getMarketStore(product.storeId);
      const searchHaystack = normalizeMarketSearchText([
        product.title,
        product.name,
        product.category,
        product.badge,
        product.keywords,
        store?.name,
        store?.city,
        store?.description
      ]
        .filter(Boolean)
        .join(" "));

      const matchesQuery =
        !queryTokens.length || queryTokens.every((token) => searchHaystack.includes(token));
      const matchesCategory = categoryId === "all" || product.categoryId === categoryId;
      const matchesCity = city === "all" || store?.city === city;
      const matchesDelivery = !deliveryOnly || Boolean(store?.deliveryAvailable);
      const matchesSale = !saleOnly || Boolean(product.discounted || product.oldPrice);
      const matchesStock = !inStockOnly || Boolean(product.stock || product.inStock);
      const matchesFeed =
        feedFilterId === "all" ||
        (feedFilterId === "discounted" && Boolean(product.discounted || product.oldPrice)) ||
        (feedFilterId === "popular" && Boolean(product.popular));

      return (
        matchesQuery &&
        matchesCategory &&
        matchesCity &&
        matchesDelivery &&
        matchesSale &&
        matchesStock &&
        matchesFeed
      );
    });
  }

  function getRelatedMarketProducts(product, limit = 4) {
    if (!product || typeof product !== "object") return [];

    return marketplaceData.products
      .filter((candidate) => candidate.id !== product.id)
      .sort((left, right) => {
        const leftScore =
          (left.categoryId === product.categoryId ? 4 : 0) +
          (left.storeId === product.storeId ? 3 : 0) +
          (left.popular ? 2 : 0) +
          (left.discounted ? 1 : 0);
        const rightScore =
          (right.categoryId === product.categoryId ? 4 : 0) +
          (right.storeId === product.storeId ? 3 : 0) +
          (right.popular ? 2 : 0) +
          (right.discounted ? 1 : 0);

        return rightScore - leftScore || right.rating - left.rating || right.reviews - left.reviews;
      })
      .slice(0, limit);
  }

  function getMarketDiscountPercent(product) {
    const price = Number(product?.price);
    const oldPrice = Number(product?.oldPrice);
    if (!Number.isFinite(price) || !Number.isFinite(oldPrice) || oldPrice <= price || oldPrice <= 0) {
      return 0;
    }
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  function getMarketBadgeColor(product) {
    const badge = String(product?.badge || "").toLowerCase();
    if (badge.includes("скид")) return "var(--drivex-danger)";
    if (badge.includes("премиум") || badge.includes("комплект")) return "var(--drivex-electric-blue)";
    return "var(--drivex-warning)";
  }

  function slugifyText(value, fallback = "item") {
    return (
      String(value || fallback)
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^a-z0-9а-яё]+/gi, "-")
        .replace(/^-+|-+$/g, "") || fallback
    );
  }

  function isSellerRole(role) {
    return role === "seller" || role === "admin";
  }

  function getSellerProductCategoryMeta(categoryId) {
    return marketCategories.find((category) => category.id === categoryId && category.id !== "all") || marketCategories[4];
  }

  function getSellerOrderStatusMeta(statusId) {
    return sellerOrderStatusOptions.find((status) => status.id === statusId) || sellerOrderStatusOptions[0];
  }

  function isPickupSellerOrder(order) {
    return normalizeMarketSearchText(order?.deliveryMethod).includes("самовывоз");
  }

  function getAllowedSellerOrderStatusIds(order) {
    const currentStatus = getSellerOrderStatusMeta(order?.status).id;
    const isPickupOrder = isPickupSellerOrder(order);

    switch (currentStatus) {
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

  function getAllowedSellerOrderStatuses(order) {
    const allowedIds = getAllowedSellerOrderStatusIds(order);
    return sellerOrderStatusOptions.filter((status) => allowedIds.includes(status.id));
  }

  function canTransitionSellerOrder(order, nextStatus) {
    return getAllowedSellerOrderStatusIds(order).includes(nextStatus);
  }

  function getSellerOrderActions(order) {
    const currentStatus = getSellerOrderStatusMeta(order?.status).id;
    const isPickupOrder = isPickupSellerOrder(order);

    switch (currentStatus) {
      case "new":
        return [
          {
            id: "confirm",
            status: "confirmed",
            label: "Подтвердить",
            color: "var(--drivex-electric-blue)",
            background: "rgba(14, 165, 233, 0.16)",
            successMessage: "Заказ подтверждён"
          },
          {
            id: "cancel",
            status: "cancelled",
            label: "Отменить",
            color: "var(--drivex-danger)",
            background: "rgba(239, 68, 68, 0.16)",
            successMessage: "Заказ отменён"
          }
        ];
      case "confirmed":
        return [
          {
            id: isPickupOrder ? "pickup-ready" : "delivery",
            status: isPickupOrder ? "pickup_ready" : "delivery",
            label: isPickupOrder ? "Готов к выдаче" : "В доставку",
            color: isPickupOrder ? "var(--drivex-electric-blue)" : "var(--drivex-neon-cyan)",
            background: isPickupOrder ? "rgba(14, 165, 233, 0.16)" : "rgba(6, 182, 212, 0.16)",
            successMessage: isPickupOrder ? "Заказ готов к выдаче" : "Заказ передан в доставку"
          },
          {
            id: "cancel",
            status: "cancelled",
            label: "Отменить",
            color: "var(--drivex-danger)",
            background: "rgba(239, 68, 68, 0.16)",
            successMessage: "Заказ отменён"
          }
        ];
      case "pickup_ready":
        return [
          {
            id: "complete-pickup",
            status: "completed",
            label: "Выдать заказ",
            color: "var(--drivex-success)",
            background: "rgba(16, 185, 129, 0.16)",
            successMessage: "Заказ выдан клиенту"
          }
        ];
      case "delivery":
        return [
          {
            id: "complete-delivery",
            status: "completed",
            label: "Завершить",
            color: "var(--drivex-success)",
            background: "rgba(16, 185, 129, 0.16)",
            successMessage: "Заказ завершён"
          }
        ];
      default:
        return [];
    }
  }

  function getOrderTimelineStepIds(order) {
    const isPickupOrder = isPickupSellerOrder(order);
    const statusId = getSellerOrderStatusMeta(order?.status).id;

    if (statusId === "cancelled") {
      return ["new", "cancelled"];
    }

    return isPickupOrder
      ? ["new", "confirmed", "pickup_ready", "completed"]
      : ["new", "confirmed", "delivery", "completed"];
  }

  function getOrderTimelineSteps(order, variant = "seller") {
    const statusResolver = variant === "buyer" ? getBuyerOrderStatusMeta : getSellerOrderStatusMeta;
    const stepIds = getOrderTimelineStepIds(order);
    const currentStatusId = getSellerOrderStatusMeta(order?.status).id;
    const currentIndex = stepIds.indexOf(currentStatusId);

    return stepIds.map((stepId, index) => {
      const meta = statusResolver(stepId);
      const isCompleted = currentIndex > index;
      const isCurrent = currentIndex === index;
      const isUpcoming = currentIndex !== -1 ? index > currentIndex : stepId !== currentStatusId;

      return {
        id: stepId,
        label: meta.label,
        color: meta.color,
        isCompleted,
        isCurrent,
        isUpcoming
      };
    });
  }

  function getOrderTimelineCompactLabel(stepId) {
    const compactLabels = {
      new: "Новый",
      confirmed: "Подтв.",
      pickup_ready: "Выдача",
      delivery: "Доставка",
      completed: "Готово",
      cancelled: "Отмена"
    };

    return compactLabels[stepId] || stepId;
  }

  function OrderStatusTimeline({ order, variant = "seller" }) {
    const steps = getOrderTimelineSteps(order, variant);

    return html`
      <div className="mt-3">
        <div className="flex items-start gap-1.5">
          ${steps.map((step, index) => html`
            <div key=${`${order?.id || "order"}-${variant}-${step.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style=${{
                    background: step.isCurrent ? step.color : "rgba(148, 163, 184, 0.16)",
                    boxShadow: step.isCurrent ? `0 0 0 3px ${alphaBg(step.color, 0.16)}` : "none"
                  }}
                ></span>
                ${index < steps.length - 1
                  ? html`<span
                      className="flex-1 h-[2px] rounded-full"
                      style=${{
                        background: "rgba(148, 163, 184, 0.12)"
                      }}
                    ></span>`
                  : null}
              </div>
              <p
                className="text-[10px] mt-2 leading-tight text-center"
                style=${{
                  minHeight: "24px",
                  color: step.isCurrent ? "var(--drivex-white)" : "var(--drivex-silver)"
                }}
              >
                ${getOrderTimelineCompactLabel(step.id)}
              </p>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  function getBuyerOrderStatusMeta(statusId) {
    return buyerOrderStatusOptions.find((status) => status.id === statusId) || buyerOrderStatusOptions[0];
  }

  function getSellerProductStatusMeta(statusId) {
    return sellerProductStatusOptions.find((status) => status.id === statusId) || sellerProductStatusOptions[0];
  }

  function getSellerFallbackProductImage(categoryId = "parts") {
    return (
      marketplaceData.products.find((product) => product.categoryId === categoryId)?.image ||
      marketplaceData.products[0]?.image ||
      ""
    );
  }

  function deriveBrandFromTitle(title) {
    const safeTitle = String(title || "").trim();
    if (!safeTitle) return "DRIVEX";
    const firstToken = safeTitle.split(/\s+/)[0] || "DRIVEX";
    return firstToken.slice(0, 24);
  }

  function createPendingSellerStoreId(seed = Date.now()) {
    return slugifyText(`seller-${seed}`, `seller-${Date.now()}`);
  }

  function createDefaultSellerSession() {
    return {
      id: "guest-buyer",
      name: "Покупатель DRIVEX",
      email: "buyer@drivex.app",
      role: "buyer",
      sellerStoreId: sellerPrimaryStoreId
    };
  }

  function createFreshSellerSession(seed = Date.now()) {
    const storeId = createPendingSellerStoreId(seed);

    return {
      id: `seller-session-${String(seed).replace(/\D/g, "").slice(-8) || "new"}`,
      name: "",
      email: "",
      role: "seller",
      sellerStoreId: storeId
    };
  }

  function createSellerRegistrationDraft(seed = Date.now()) {
    const session = createFreshSellerSession(seed);

    return {
      session,
      profile: createSellerProfileSeed(session),
      store: createSellerStoreSeed(session.sellerStoreId)
    };
  }

  function normalizeSellerSession(value) {
    const fallback = createDefaultSellerSession();
    const source = value && typeof value === "object" ? value : {};
    const storeId =
      typeof source.sellerStoreId === "string" && source.sellerStoreId.trim()
        ? slugifyText(source.sellerStoreId, fallback.sellerStoreId)
        : fallback.sellerStoreId;
    const role = typeof source.role === "string" ? source.role.trim().toLowerCase() : fallback.role;

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : fallback.id,
      name: typeof source.name === "string" && source.name.trim() ? source.name.trim() : fallback.name,
      email: typeof source.email === "string" && source.email.trim() ? source.email.trim() : fallback.email,
      role: role || fallback.role,
      sellerStoreId: storeId
    };
  }

  function resolveSellerBackendSnapshot(appState) {
    if (!appState || typeof appState !== "object" || !appState.seller) return null;

    const sellerData = appState.seller;
    const fallbackStoreId =
      sellerData?.store?.id ||
      appState?.session?.sellerStoreId ||
      appState?.session?.storeId ||
      sellerPrimaryStoreId;
    const resolvedSession = normalizeSellerSession(
      appState?.session && isSellerRole(appState.session.role)
        ? appState.session
        : {
            id: sellerData?.profile?.id || `seller-${fallbackStoreId}`,
            name: sellerData?.profile?.ownerFullName || sellerData?.store?.ownerName || "",
            email: sellerData?.profile?.email || "",
            role: "seller",
            sellerStoreId: fallbackStoreId
          }
    );
    const resolvedProfile = normalizeSellerProfile(sellerData.profile, resolvedSession);
    const resolvedStore = normalizeSellerStore(sellerData.store, resolvedSession.sellerStoreId);

    return {
      session: resolvedSession,
      profile: resolvedProfile,
      store: resolvedStore,
      products: resolveSellerProductsState(
        sellerData.products,
        resolvedStore,
        resolvedSession.sellerStoreId
      ),
      orders: normalizeSellerOrdersList(sellerData.orders, resolvedSession.sellerStoreId),
      notifications: normalizeSellerNotificationsList(sellerData.notifications)
    };
  }

  function createSellerProfileSeed(session = createDefaultSellerSession()) {
    const safeSession = normalizeSellerSession(session);

    return {
      id: `seller-profile-${safeSession.sellerStoreId}`,
      ownerFullName: safeSession.role === "buyer" ? "" : safeSession.name,
      phone: "",
      email: safeSession.role === "buyer" ? "" : safeSession.email,
      password: "",
      registrationCompleted: false
    };
  }

  function normalizeSellerProfile(value, session = createDefaultSellerSession()) {
    const fallback = createSellerProfileSeed(session);
    const source = value && typeof value === "object" ? value : {};

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : fallback.id,
      ownerFullName:
        typeof source.ownerFullName === "string" && source.ownerFullName.trim()
          ? source.ownerFullName.trim()
          : fallback.ownerFullName,
      phone: typeof source.phone === "string" ? source.phone.trim() : fallback.phone,
      email:
        typeof source.email === "string" && source.email.trim()
          ? source.email.trim()
          : fallback.email,
      password: typeof source.password === "string" ? source.password.trim() : fallback.password,
      registrationCompleted:
        typeof source.registrationCompleted === "boolean"
          ? source.registrationCompleted
          : fallback.registrationCompleted
    };
  }

  function createSellerStoreSeed(storeId = sellerPrimaryStoreId) {
    return {
      id: storeId || sellerPrimaryStoreId,
      name: "",
      ownerName: "",
      city: "",
      address: "",
      locationLabel: "",
      geolocation: "",
      storeCategory: "",
      businessType: "",
      phone: "",
      deliveryAvailable: false,
      pickupAvailable: false,
      deliveryRadius: "",
      workingHours: "",
      description: "",
      logo: "",
      rating: 4.7,
      reviews: 0,
      accent: "var(--drivex-electric-blue)",
      registrationCompleted: false,
      profileCompleted: false,
      status: "new",
      catalogInitialized: false
    };
  }

  function normalizeSellerStore(value, fallbackStoreId = sellerPrimaryStoreId) {
    const fallback = createSellerStoreSeed(fallbackStoreId);
    const source = value && typeof value === "object" ? value : {};
    const rawLogo = typeof source.logo === "string" ? source.logo.trim() : "";

    return {
      id:
        typeof source.id === "string" && source.id.trim()
          ? slugifyText(source.id, fallback.id)
          : fallback.id,
      name: typeof source.name === "string" && source.name.trim() ? source.name.trim() : fallback.name,
      ownerName:
        typeof source.ownerName === "string" && source.ownerName.trim()
          ? source.ownerName.trim()
          : fallback.ownerName,
      city: typeof source.city === "string" && source.city.trim() ? source.city.trim() : fallback.city,
      address:
        typeof source.address === "string" && source.address.trim() ? source.address.trim() : fallback.address,
      locationLabel:
        typeof source.locationLabel === "string" && source.locationLabel.trim()
          ? source.locationLabel.trim()
          : fallback.locationLabel,
      geolocation:
        typeof source.geolocation === "string" && source.geolocation.trim()
          ? source.geolocation.trim()
          : fallback.geolocation,
      storeCategory:
        typeof source.storeCategory === "string" && source.storeCategory.trim()
          ? source.storeCategory.trim()
          : fallback.storeCategory,
      businessType:
        typeof source.businessType === "string" && source.businessType.trim()
          ? source.businessType.trim()
          : fallback.businessType,
      phone: typeof source.phone === "string" && source.phone.trim() ? source.phone.trim() : fallback.phone,
      deliveryAvailable:
        typeof source.deliveryAvailable === "boolean" ? source.deliveryAvailable : fallback.deliveryAvailable,
      pickupAvailable:
        typeof source.pickupAvailable === "boolean" ? source.pickupAvailable : fallback.pickupAvailable,
      deliveryRadius:
        typeof source.deliveryRadius === "string" && source.deliveryRadius.trim()
          ? source.deliveryRadius.trim()
          : fallback.deliveryRadius,
      workingHours:
        typeof source.workingHours === "string" && source.workingHours.trim()
          ? source.workingHours.trim()
          : fallback.workingHours,
      description:
        typeof source.description === "string" && source.description.trim()
          ? source.description.trim()
          : fallback.description,
      logo:
        rawLogo && (rawLogo.startsWith("data:image/") || /^https?:/i.test(rawLogo) || rawLogo.length <= 4)
          ? rawLogo
          : fallback.logo,
      rating: Number.isFinite(Number(source.rating)) ? Number(source.rating) : fallback.rating,
      reviews: Number.isFinite(Number(source.reviews)) ? Number(source.reviews) : fallback.reviews,
      accent: typeof source.accent === "string" && source.accent.trim() ? source.accent.trim() : fallback.accent,
      registrationCompleted:
        typeof source.registrationCompleted === "boolean"
          ? source.registrationCompleted
          : fallback.registrationCompleted,
      profileCompleted:
        typeof source.profileCompleted === "boolean" ? source.profileCompleted : fallback.profileCompleted,
      status:
        typeof source.status === "string" && source.status.trim() ? source.status.trim() : fallback.status,
      catalogInitialized:
        typeof source.catalogInitialized === "boolean"
          ? source.catalogInitialized
          : fallback.catalogInitialized
    };
  }

  function getSellerSetupChecklist(store, profile) {
    const safeStore = normalizeSellerStore(store);
    const safeProfile = normalizeSellerProfile(profile);

    return [
      { id: "owner", label: "Владелец", done: Boolean(safeProfile.ownerFullName) },
      { id: "phone", label: "Телефон", done: Boolean(safeProfile.phone) },
      { id: "email", label: "Email", done: Boolean(safeProfile.email) },
      { id: "name", label: "Название магазина", done: Boolean(safeStore.name) },
      { id: "city", label: "Город", done: Boolean(safeStore.city) },
      { id: "address", label: "Точный адрес", done: Boolean(safeStore.address) },
      { id: "category", label: "Категория магазина", done: Boolean(safeStore.storeCategory) },
      { id: "business", label: "Тип продаж", done: Boolean(safeStore.businessType) },
      {
        id: "shipping",
        label: "Способ получения",
        done: safeStore.deliveryAvailable || safeStore.pickupAvailable
      },
      { id: "hours", label: "Часы работы", done: Boolean(safeStore.workingHours) },
      { id: "description", label: "Описание", done: Boolean(safeStore.description) },
      { id: "location", label: "Локация / геоточка", done: Boolean(safeStore.locationLabel || safeStore.geolocation) }
    ];
  }

  function getSellerSetupState(store, profile) {
    const safeStore = normalizeSellerStore(store);
    const safeProfile = normalizeSellerProfile(profile);
    const checklist = getSellerSetupChecklist(safeStore, safeProfile);
    const completedCount = checklist.filter((item) => item.done).length;
    const isRegistrationComplete =
      Boolean(safeStore.registrationCompleted) &&
      Boolean(safeProfile.registrationCompleted) &&
      Boolean(safeProfile.ownerFullName) &&
      Boolean(safeProfile.email) &&
      Boolean(safeProfile.phone) &&
      Boolean(safeStore.name) &&
      Boolean(safeStore.city) &&
      Boolean(safeStore.address);
    const isProfileComplete =
      Boolean(safeStore.profileCompleted) ||
      (isRegistrationComplete && completedCount === checklist.length);

    return {
      checklist,
      completedCount,
      totalCount: checklist.length,
      isRegistrationComplete,
      isProfileComplete,
      progressPercent: checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0
    };
  }

  function createGeneratedMarketProductId(seed) {
    const digits = String(seed || Date.now()).replace(/\D/g, "");
    const tail = digits.slice(-9);
    const numericTail = Number(tail || Date.now().toString().slice(-9));
    return 100000 + (Number.isFinite(numericTail) ? numericTail : Date.now());
  }

  function normalizeSellerProduct(value, fallbackStoreId = sellerPrimaryStoreId) {
    const source = value && typeof value === "object" ? value : {};
    const title =
      typeof source.title === "string" && source.title.trim()
        ? source.title.trim()
        : typeof source.name === "string" && source.name.trim()
          ? source.name.trim()
          : "Новый товар";
    const categoryMeta = getSellerProductCategoryMeta(source.categoryId);
    const categoryId = categoryMeta?.id || "parts";
    const price = Math.max(0, Math.floor(Number(source.price) || 0));
    const oldPriceNum = Math.floor(Number(source.oldPrice));
    const oldPrice = Number.isFinite(oldPriceNum) && oldPriceNum > price ? oldPriceNum : null;
    const rawStock = source.stockQty ?? source.stock_count ?? source.stock;
    const stockQty =
      typeof rawStock === "boolean"
        ? rawStock
          ? 6
          : 0
        : Math.max(0, Math.floor(Number(rawStock) || 0));
    const status =
      typeof source.status === "string" && sellerProductStatusOptions.some((item) => item.id === source.status)
        ? source.status
        : stockQty > 0
          ? "active"
          : "draft";
    const storeId =
      typeof source.storeId === "string" && source.storeId.trim()
        ? slugifyText(source.storeId, fallbackStoreId || sellerPrimaryStoreId)
        : fallbackStoreId || sellerPrimaryStoreId;
    const rawMarketProductId = Number(source.marketProductId ?? source.market_product_id);
    const marketProductId =
      Number.isFinite(rawMarketProductId) && rawMarketProductId > 0
        ? rawMarketProductId
        : createGeneratedMarketProductId(source.id || source.createdAt || Date.now());
    const rawImage = typeof source.image === "string" ? source.image.trim() : "";
    const image =
      rawImage && !(rawImage.startsWith("data:image/") && rawImage.length > 180000)
        ? rawImage
        : getSellerFallbackProductImage(categoryId);

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("seller-product"),
      marketProductId,
      storeId,
      title,
      slug: slugifyText(source.slug || title, `seller-product-${Date.now()}`),
      categoryId,
      category: categoryMeta?.name || "Запчасти",
      price,
      oldPrice,
      rating: Number.isFinite(Number(source.rating)) ? Number(source.rating) : 4.7,
      reviewsCount: Math.max(0, Math.floor(Number(source.reviewsCount ?? source.reviews) || 0)),
      image,
      badge: typeof source.badge === "string" ? source.badge.trim() : "",
      stockQty,
      stock: stockQty > 0,
      description:
        typeof source.description === "string" && source.description.trim()
          ? source.description.trim()
          : "Описание товара пока не заполнено.",
      popular: Boolean(source.popular),
      discounted: Boolean(oldPrice),
      brand:
        typeof source.brand === "string" && source.brand.trim()
          ? source.brand.trim()
          : deriveBrandFromTitle(title),
      sku:
        typeof source.sku === "string" && source.sku.trim()
          ? source.sku.trim()
          : `DX-${String(storeId).slice(0, 2).toUpperCase()}-${String(title.length).padStart(4, "0")}`,
      deliveryAvailable:
        typeof source.deliveryAvailable === "boolean"
          ? source.deliveryAvailable
          : Boolean(getMarketStore(storeId)?.deliveryAvailable),
      // Совместимость с авто и поисковые слова — сохраняем, чтобы их заполнял ИИ
      // и они доходили до карточки в маркете (раньше тут терялись).
      compatibility: source.compatibility || null,
      keywords: typeof source.keywords === "string" ? source.keywords.trim() : "",
      createdAt: Number.isFinite(Number(source.createdAt)) ? Number(source.createdAt) : Date.now()
    };
  }

  function mapSellerStoreToMarketplaceStore(store) {
    const safeStore = normalizeSellerStore(store);
    const baseStore = marketplaceBaseData.stores.find((item) => item.id === safeStore.id) || {};
    const logoText = String(safeStore.logo || baseStore.logo || safeStore.name || "DX").trim();
    const avatar =
      logoText.startsWith("data:image/") || /^https?:/i.test(logoText)
        ? baseStore.avatar || safeStore.name.slice(0, 2).toUpperCase()
        : logoText.slice(0, 2).toUpperCase();
    const deliveryLabel = safeStore.deliveryAvailable
      ? `Доставка • ${safeStore.deliveryRadius || safeStore.city}`
      : "Самовывоз";
    const pickup = safeStore.address || baseStore.pickup || safeStore.city;
    const tagline = safeStore.description || baseStore.tagline || "Партнёрский магазин DRIVEX";

    return {
      ...baseStore,
      id: safeStore.id,
      name: safeStore.name,
      city: safeStore.city,
      deliveryAvailable: Boolean(safeStore.deliveryAvailable),
      deliveryLabel,
      deliveryNote: safeStore.deliveryAvailable
        ? `Доставка по зоне: ${safeStore.deliveryRadius || "уточняется"}`
        : "Только самовывоз",
      rating: Number.isFinite(Number(safeStore.rating)) ? Number(safeStore.rating) : Number(baseStore.rating) || 4.7,
      reviews: Number.isFinite(Number(safeStore.reviews)) ? Number(safeStore.reviews) : Number(baseStore.reviews) || 0,
      avatar,
      accent: safeStore.accent || baseStore.accent || "var(--drivex-electric-blue)",
      tagline,
      pickup,
      delivery: safeStore.deliveryAvailable ? "yes" : "pickup",
      logo: safeStore.logo || baseStore.logo || avatar,
      description: `${tagline}. ${safeStore.deliveryAvailable ? deliveryLabel : "Самовывоз из магазина."}`,
      phone: safeStore.phone,
      storeCategory: safeStore.storeCategory,
      businessType: safeStore.businessType,
      catalogInitialized: Boolean(safeStore.catalogInitialized)
    };
  }

  function mapSellerProductToMarketplaceProduct(product, storesById = {}) {
    const safeProduct = normalizeSellerProduct(product);
    const store = storesById[safeProduct.storeId] || getMarketStore(safeProduct.storeId);
    const categoryMeta = getSellerProductCategoryMeta(safeProduct.categoryId);

    return {
      id: safeProduct.marketProductId,
      storeId: safeProduct.storeId,
      name: safeProduct.title,
      title: safeProduct.title,
      slug: safeProduct.slug,
      categoryId: safeProduct.categoryId,
      category: safeProduct.category || categoryMeta?.name || "Запчасти",
      price: safeProduct.price,
      oldPrice: safeProduct.oldPrice,
      old_price: safeProduct.oldPrice,
      rating: safeProduct.rating,
      reviews: safeProduct.reviewsCount,
      reviewsCount: safeProduct.reviewsCount,
      reviews_count: safeProduct.reviewsCount,
      image: safeProduct.image,
      inStock: safeProduct.stockQty > 0 && safeProduct.status === "active",
      stock: safeProduct.stockQty > 0 && safeProduct.status === "active",
      stockQty: safeProduct.stockQty,
      status: safeProduct.status,
      delivery: safeProduct.deliveryAvailable
        ? store?.deliveryLabel || store?.deliveryNote || "Доставка"
        : "Самовывоз",
      storeName: store?.name || "",
      badge: safeProduct.badge,
      unitLabel: safeProduct.stockQty > 0 ? `Остаток: ${safeProduct.stockQty} шт.` : "Нет в наличии",
      description: safeProduct.description,
      brand: safeProduct.brand,
      sku: safeProduct.sku,
      compatibility: safeProduct.compatibility || null,
      specs: [safeProduct.brand, safeProduct.sku, safeProduct.deliveryAvailable ? "Есть доставка" : "Самовывоз"].filter(Boolean),
      store_id: safeProduct.storeId,
      discounted: Boolean(safeProduct.oldPrice),
      popular: Boolean(safeProduct.reviewsCount >= 50 || /хит|популяр/i.test(String(safeProduct.badge || ""))),
      keywords: [
        safeProduct.title,
        safeProduct.category,
        safeProduct.brand,
        safeProduct.sku,
        safeProduct.badge,
        safeProduct.keywords,
        store?.name
      ]
        .filter(Boolean)
        .join(" ")
    };
  }

  function normalizeMarketplacePartnerProduct(product, storesById = {}, fallbackStoreId = "") {
    if (!product || typeof product !== "object") return null;

    const resolvedStoreId =
      typeof product.storeId === "string" && product.storeId.trim()
        ? slugifyText(product.storeId, fallbackStoreId || sellerPrimaryStoreId)
        : typeof product.store_id === "string" && product.store_id.trim()
          ? slugifyText(product.store_id, fallbackStoreId || sellerPrimaryStoreId)
          : fallbackStoreId || sellerPrimaryStoreId;

    if (!resolvedStoreId) return null;

    const looksLikeMarketplaceProduct =
      (typeof product.name === "string" || typeof product.title === "string") &&
      ("unitLabel" in product || "inStock" in product || "reviewsCount" in product || "reviews" in product);

    if (!looksLikeMarketplaceProduct) {
      return mapSellerProductToMarketplaceProduct(
        {
          ...product,
          storeId: resolvedStoreId
        },
        storesById
      );
    }

    const title =
      typeof product.title === "string" && product.title.trim()
        ? product.title.trim()
        : typeof product.name === "string" && product.name.trim()
          ? product.name.trim()
          : "Товар";
    const categoryId =
      typeof product.categoryId === "string" && product.categoryId.trim()
        ? product.categoryId.trim()
        : resolveProductCategoryId(product.category || "parts");
    const stockQty = Math.max(
      0,
      Math.floor(
        Number(
          product.stockQty ??
            product.stock_count ??
            (typeof product.stock === "boolean" ? (product.stock ? 1 : 0) : product.stock) ??
            (typeof product.inStock === "boolean" ? (product.inStock ? 1 : 0) : 0)
        ) || 0
      )
    );
    const marketProductId =
      Number.isFinite(Number(product.id)) && Number(product.id) > 0
        ? Number(product.id)
        : createGeneratedMarketProductId(product.marketProductId || title);
    const categoryMeta = getSellerProductCategoryMeta(categoryId);
    const store = storesById[resolvedStoreId] || getMarketStore(resolvedStoreId);

    return {
      ...product,
      id: marketProductId,
      marketProductId,
      storeId: resolvedStoreId,
      store_id: resolvedStoreId,
      title,
      name: typeof product.name === "string" && product.name.trim() ? product.name.trim() : title,
      categoryId,
      category:
        typeof product.category === "string" && product.category.trim()
          ? product.category.trim()
          : categoryMeta?.name || "Запчасти",
      price: Math.max(0, Math.floor(Number(product.price) || 0)),
      oldPrice:
        Number(product.oldPrice || product.old_price || 0) > Number(product.price || 0)
          ? Math.floor(Number(product.oldPrice || product.old_price))
          : null,
      old_price:
        Number(product.oldPrice || product.old_price || 0) > Number(product.price || 0)
          ? Math.floor(Number(product.oldPrice || product.old_price))
          : null,
      rating: Number.isFinite(Number(product.rating)) ? Number(product.rating) : 4.7,
      reviews: Math.max(0, Math.floor(Number(product.reviews ?? product.reviewsCount) || 0)),
      reviewsCount: Math.max(0, Math.floor(Number(product.reviewsCount ?? product.reviews) || 0)),
      reviews_count: Math.max(0, Math.floor(Number(product.reviewsCount ?? product.reviews) || 0)),
      image: String(product.image || "").trim() || getSellerFallbackProductImage(categoryId),
      inStock: typeof product.inStock === "boolean" ? product.inStock : stockQty > 0,
      stock: typeof product.stock === "boolean" ? product.stock : stockQty > 0,
      stockQty,
      delivery:
        typeof product.delivery === "string" && product.delivery.trim()
          ? product.delivery.trim()
          : store?.deliveryLabel || store?.deliveryNote || "Доставка",
      storeName:
        typeof product.storeName === "string" && product.storeName.trim()
          ? product.storeName.trim()
          : store?.name || "",
      badge: typeof product.badge === "string" ? product.badge.trim() : "",
      unitLabel:
        typeof product.unitLabel === "string" && product.unitLabel.trim()
          ? product.unitLabel.trim()
          : stockQty > 0
            ? `Остаток: ${stockQty} шт.`
            : "Нет в наличии",
      description:
        typeof product.description === "string" && product.description.trim()
          ? product.description.trim()
          : "Описание товара пока не заполнено.",
      status:
        typeof product.status === "string" && product.status.trim()
          ? product.status.trim()
          : stockQty > 0
            ? "active"
            : "draft",
      discounted: Boolean(
        Number(product.oldPrice || product.old_price || 0) > Number(product.price || 0)
      ),
      popular: Boolean(product.popular),
      keywords:
        typeof product.keywords === "string" && product.keywords.trim()
          ? product.keywords.trim()
          : [title, categoryMeta?.name || product.category, store?.name].filter(Boolean).join(" ")
    };
  }

  function buildMarketplaceRuntimeData({
    sellerStore,
    sellerProducts,
    partnerStores = [],
    partnerProducts = []
  }) {
    const sellerStoreCandidates = [];
    if (sellerStore && typeof sellerStore === "object" && String(sellerStore.name || "").trim()) {
      sellerStoreCandidates.push(sellerStore);
    }
    for (const store of Array.isArray(partnerStores) ? partnerStores : []) {
      if (!store || typeof store !== "object") continue;
      if (!String(store.id || "").trim()) continue;
      sellerStoreCandidates.push(store);
    }

    const sellerProductCandidates = [];
    for (const product of Array.isArray(partnerProducts) ? partnerProducts : []) {
      if (product && typeof product === "object") sellerProductCandidates.push(product);
    }
    for (const product of Array.isArray(sellerProducts) ? sellerProducts : []) {
      if (product && typeof product === "object") sellerProductCandidates.push(product);
    }

    const normalizedStoresById = {};
    for (const store of sellerStoreCandidates) {
      const mappedStore =
        store && typeof store === "object" && store.deliveryLabel && store.deliveryNote
          ? store
          : mapSellerStoreToMarketplaceStore(store);
      if (!mappedStore.id || !mappedStore.name) continue;
      normalizedStoresById[mappedStore.id] = mappedStore;
    }

    const stores = [...marketplaceBaseData.stores];
    for (const partnerStore of Object.values(normalizedStoresById)) {
      const existingIndex = stores.findIndex((entry) => entry.id === partnerStore.id);
      if (existingIndex >= 0) {
        stores[existingIndex] = partnerStore;
      } else if (
        partnerStore.catalogInitialized ||
        sellerProductCandidates.some((product) => product && product.storeId === partnerStore.id)
      ) {
        stores.unshift(partnerStore);
      }
    }

    const storesById = stores.reduce((acc, store) => {
      acc[store.id] = store;
      return acc;
    }, {});

    const partnerCatalogProducts = sellerProductCandidates
      .map((product) =>
        normalizeMarketplacePartnerProduct(
          product,
          storesById,
          sellerStore && typeof sellerStore === "object" ? sellerStore.id : ""
        )
      )
      .filter(Boolean)
      .filter((product) => !product.status || product.status === "active")
      .filter((product, index, list) => list.findIndex((entry) => entry.id === product.id) === index);
    const partnerProductStoreIds = new Set(partnerCatalogProducts.map((product) => product.storeId));
    const baseProducts = marketplaceBaseData.products.filter((product) => !partnerProductStoreIds.has(product.storeId));

    return {
      stores,
      products: [...partnerCatalogProducts, ...baseProducts]
    };
  }

  function compactSellerProductForSync(product, fallbackStoreId = sellerPrimaryStoreId) {
    const normalized = normalizeSellerProduct(product, fallbackStoreId);
    const image = String(normalized.image || "").trim();

    return {
      ...normalized,
      image:
        image.startsWith("data:image/") && image.length > 90000
          ? getSellerFallbackProductImage(normalized.categoryId)
          : image,
      description: String(normalized.description || "").slice(0, 1200)
    };
  }

  function compactSellerProductsForSync(list, fallbackStoreId = sellerPrimaryStoreId) {
    return normalizeSellerProductsList(list, fallbackStoreId).map((product) =>
      compactSellerProductForSync(product, fallbackStoreId)
    );
  }

  function createMarketplaceCheckoutDraft(items, profile) {
    const safeProfile = profile && typeof profile === "object" ? profile : createDefaultBuyerProfile();
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
    const groupedStoreIds = [...new Set(safeItems.map((item) => item.storeId).filter(Boolean))];
    const deliveryByStore = groupedStoreIds.reduce((acc, storeId) => {
      const store = getMarketStore(storeId);
      const deliveryMode = store?.deliveryAvailable ? "delivery" : "pickup";
      acc[storeId] = {
        deliveryMode,
        address: "",
        comment: ""
      };
      return acc;
    }, {});

    return {
      customerName: String(safeProfile.name || "").trim(),
      customerPhone: String(safeProfile.phone || "").trim(),
      deliveryByStore
    };
  }

  function syncMarketplaceCheckoutDraft(currentDraft, items, profile) {
    const baseDraft = createMarketplaceCheckoutDraft(items, profile);
    const source = currentDraft && typeof currentDraft === "object" ? currentDraft : {};
    const sourceDelivery = source.deliveryByStore && typeof source.deliveryByStore === "object"
      ? source.deliveryByStore
      : {};

    return {
      customerName:
        typeof source.customerName === "string" && source.customerName.trim()
          ? source.customerName
          : baseDraft.customerName,
      customerPhone:
        typeof source.customerPhone === "string" && source.customerPhone.trim()
          ? source.customerPhone
          : baseDraft.customerPhone,
      deliveryByStore: Object.entries(baseDraft.deliveryByStore).reduce((acc, [storeId, defaults]) => {
        const currentStoreDraft = sourceDelivery[storeId] && typeof sourceDelivery[storeId] === "object"
          ? sourceDelivery[storeId]
          : {};
        acc[storeId] = {
          deliveryMode:
            currentStoreDraft.deliveryMode === "pickup" || currentStoreDraft.deliveryMode === "delivery"
              ? currentStoreDraft.deliveryMode
              : defaults.deliveryMode,
          address:
            typeof currentStoreDraft.address === "string" ? currentStoreDraft.address : defaults.address,
          comment:
            typeof currentStoreDraft.comment === "string" ? currentStoreDraft.comment : defaults.comment
        };
        return acc;
      }, {})
    };
  }

  function createSellerOrdersFromCart({ items, profile, stores, existingOrders, checkout }) {
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!safeItems.length) return [];

    const safeStores = Array.isArray(stores) ? stores : [];
    const existingCount = Array.isArray(existingOrders) ? existingOrders.length : 0;
    const todayCompact = toLocalISODate().replace(/-/g, "").slice(2);
    const safeCheckout = syncMarketplaceCheckoutDraft(checkout, safeItems, profile);
    const groups = safeItems.reduce((acc, item) => {
      const storeId = item.storeId || "unknown-store";
      if (!acc[storeId]) acc[storeId] = [];
      acc[storeId].push(item);
      return acc;
    }, {});

    return Object.entries(groups).map(([storeId, groupedItems], index) => {
      const store = safeStores.find((entry) => entry.id === storeId);
      const storeCheckout = safeCheckout.deliveryByStore?.[storeId] || {};
      const requestedDeliveryMode = storeCheckout.deliveryMode === "pickup" ? "pickup" : "delivery";
      const resolvedDeliveryMode =
        requestedDeliveryMode === "delivery" && store?.deliveryAvailable ? "delivery" : "pickup";
      const deliveryMethod = resolvedDeliveryMode === "delivery" ? "Доставка" : "Самовывоз";
      const pickupAddress = store?.pickup || store?.address || "Самовывоз из магазина";
      const deliveryAddress =
        typeof storeCheckout.address === "string" && storeCheckout.address.trim()
          ? storeCheckout.address.trim()
          : "";
      const comment =
        typeof storeCheckout.comment === "string" && storeCheckout.comment.trim()
          ? storeCheckout.comment.trim()
          : "";
      const orderNotes = ["Оформлено через DRIVEX Marketplace"];
      if (comment) {
        orderNotes.push(`Комментарий клиента: ${comment}`);
      }

      return normalizeSellerOrder(
        {
          id: `DX-${todayCompact}-${String(existingCount + index + 1).padStart(3, "0")}`,
          storeId,
          storeName:
            groupedItems.find((item) => typeof item.storeName === "string" && item.storeName.trim())?.storeName ||
            store?.name ||
            "",
          customerName: safeCheckout.customerName || profile?.name || "Клиент DRIVEX",
          customerPhone: safeCheckout.customerPhone || profile?.phone || "+992 00 000 00 00",
          items: groupedItems.map((item) => ({
            productId: String(item.id),
            title: item.title || item.name,
            qty: Math.max(1, Number(item.qty) || 1),
            price: Math.max(0, Number(item.price) || 0)
          })),
          amount: groupedItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0),
          status: "new",
          date: toLocalISODate(),
          deliveryMethod,
          address: resolvedDeliveryMode === "delivery" ? deliveryAddress : pickupAddress,
          notes: orderNotes.join(" • ")
        },
        storeId
      );
    });
  }

  function normalizeSellerProductsList(list, fallbackStoreId = sellerPrimaryStoreId) {
    return Array.isArray(list)
      ? list.map((item) => normalizeSellerProduct(item, fallbackStoreId)).filter(Boolean)
      : [];
  }

  function normalizeSellerOrdersList(list, fallbackStoreId = sellerPrimaryStoreId) {
    return Array.isArray(list)
      ? list.map((item) => normalizeSellerOrder(item, fallbackStoreId)).filter(Boolean)
      : [];
  }

  function applySellerOrderStatus(list, orderId, status, fallbackStoreId = sellerPrimaryStoreId) {
    return normalizeSellerOrdersList(list, fallbackStoreId).map((order) =>
      order.id === orderId
        ? normalizeSellerOrder(
            {
              ...order,
              status
            },
            order.storeId || fallbackStoreId
          )
        : order
    );
  }

  function normalizeBuyerOrder(value, fallbackStoreId = sellerPrimaryStoreId) {
    const normalizedOrder = normalizeSellerOrder(value, fallbackStoreId);
    const source = value && typeof value === "object" ? value : {};
    const statusMeta = getBuyerOrderStatusMeta(normalizedOrder.status);
    const store =
      getMarketStore(normalizedOrder.storeId) ||
      (source.storeName
        ? {
            name: source.storeName
          }
        : null);
    const itemsCount = normalizedOrder.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

    return {
      id: normalizedOrder.id,
      storeId: normalizedOrder.storeId,
      storeName:
        typeof source.storeName === "string" && source.storeName.trim()
          ? source.storeName.trim()
          : store?.name || "Магазин DRIVEX",
      customerName: normalizedOrder.customerName,
      customerPhone: normalizedOrder.customerPhone,
      items: normalizedOrder.items,
      itemsCount,
      amount: normalizedOrder.amount,
      total: normalizedOrder.amount,
      status: normalizedOrder.status,
      statusLabel: statusMeta.label,
      statusColor: statusMeta.color,
      statusNote: statusMeta.note,
      date: normalizedOrder.date,
      deliveryMethod: normalizedOrder.deliveryMethod,
      address: normalizedOrder.address,
      notes: normalizedOrder.notes
    };
  }

  function normalizeBuyerOrdersList(list, fallbackStoreId = sellerPrimaryStoreId) {
    return Array.isArray(list)
      ? list.map((item) => normalizeBuyerOrder(item, fallbackStoreId)).filter(Boolean)
      : [];
  }

  function createBuyerOrdersFromCheckout({ orders, stores }) {
    const safeOrders = normalizeSellerOrdersList(orders);
    const safeStores = Array.isArray(stores) ? stores : [];

    return safeOrders.map((order) => {
      const store = safeStores.find((entry) => entry.id === order.storeId) || getMarketStore(order.storeId);
      return normalizeBuyerOrder({
        ...order,
        storeName:
          (typeof order.storeName === "string" && order.storeName.trim() ? order.storeName.trim() : "") ||
          store?.name ||
          "Магазин DRIVEX"
      }, order.storeId);
    });
  }

  function mergeBuyerOrders(currentOrders, incomingOrders) {
    const current = normalizeBuyerOrdersList(currentOrders);
    const incoming = normalizeBuyerOrdersList(incomingOrders);
    const merged = [...incoming];

    for (const order of current) {
      if (merged.some((entry) => entry.id === order.id)) continue;
      merged.push(order);
    }

    return merged.sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
  }

  function syncBuyerOrdersWithSellerOrders(currentOrders, sellerOrders) {
    const current = normalizeBuyerOrdersList(currentOrders);
    const sellerById = normalizeSellerOrdersList(sellerOrders).reduce((acc, order) => {
      acc[order.id] = order;
      return acc;
    }, {});
    let hasChanges = false;

    const nextOrders = current.map((order) => {
      const sellerOrder = sellerById[order.id];
      if (!sellerOrder) return order;

      const nextOrder = normalizeBuyerOrder(
        {
          ...order,
          storeName:
            (typeof sellerOrder.storeName === "string" && sellerOrder.storeName.trim()
              ? sellerOrder.storeName.trim()
              : "") ||
            order.storeName,
          status: sellerOrder.status,
          date: sellerOrder.date,
          amount: sellerOrder.amount,
          items: sellerOrder.items,
          deliveryMethod: sellerOrder.deliveryMethod,
          address: sellerOrder.address,
          notes: sellerOrder.notes,
          customerName: sellerOrder.customerName,
          customerPhone: sellerOrder.customerPhone
        },
        sellerOrder.storeId
      );

      if (
        nextOrder.status !== order.status ||
        nextOrder.amount !== order.amount ||
        nextOrder.address !== order.address ||
        nextOrder.deliveryMethod !== order.deliveryMethod
      ) {
        hasChanges = true;
      }

      return nextOrder;
    });

    return hasChanges ? nextOrders : current;
  }

  function normalizeOrderChatMessage(value, orderId = "") {
    const source = value && typeof value === "object" ? value : {};
    const text = typeof source.text === "string" ? source.text.trim() : "";
    if (!text) return null;

    const senderRole = source.senderRole === "seller" ? "seller" : "buyer";
    const resolvedOrderId =
      typeof source.orderId === "string" && source.orderId.trim() ? source.orderId.trim() : String(orderId || "").trim();
    const sentAtCandidate =
      typeof source.sentAt === "string" && source.sentAt.trim() ? source.sentAt.trim() : new Date().toISOString();
    const sentAt = Number.isNaN(new Date(sentAtCandidate).getTime()) ? new Date().toISOString() : sentAtCandidate;

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("chat-message"),
      orderId: resolvedOrderId,
      senderRole,
      text,
      sentAt,
      readByBuyer: senderRole === "buyer" ? true : Boolean(source.readByBuyer),
      readBySeller: senderRole === "seller" ? true : Boolean(source.readBySeller)
    };
  }

  function normalizeOrderChatMessagesList(list, orderId = "") {
    return (Array.isArray(list) ? list : [])
      .map((item) => normalizeOrderChatMessage(item, orderId))
      .filter(Boolean)
      .sort((left, right) => String(left.sentAt || "").localeCompare(String(right.sentAt || "")));
  }

  function normalizeOrderChatThread(value, fallbackOrderId = "") {
    const source = value && typeof value === "object" ? value : {};
    const orderId =
      typeof source.orderId === "string" && source.orderId.trim()
        ? source.orderId.trim()
        : String(fallbackOrderId || "").trim();

    return {
      orderId,
      messages: normalizeOrderChatMessagesList(source.messages, orderId)
    };
  }

  function normalizeOrderChatsMap(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};

    return Object.entries(source).reduce((acc, [orderId, thread]) => {
      const normalizedThread = normalizeOrderChatThread(thread, orderId);
      if (!normalizedThread.orderId) return acc;
      acc[normalizedThread.orderId] = normalizedThread;
      return acc;
    }, {});
  }

  function getOrderChatThread(orderChats, orderId = "") {
    const resolvedOrderId = String(orderId || "").trim();
    if (!resolvedOrderId) {
      return {
        orderId: "",
        messages: []
      };
    }

    const normalizedChats = normalizeOrderChatsMap(orderChats);
    return (
      normalizedChats[resolvedOrderId] || {
        orderId: resolvedOrderId,
        messages: []
      }
    );
  }

  function getOrderChatLastMessage(orderChats, orderId = "") {
    const thread = getOrderChatThread(orderChats, orderId);
    return thread.messages[thread.messages.length - 1] || null;
  }

  function getOrderChatUnreadCount(orderChats, orderId = "", viewerRole = "buyer") {
    const thread = getOrderChatThread(orderChats, orderId);
    const safeViewerRole = viewerRole === "seller" ? "seller" : "buyer";

    return thread.messages.reduce((count, message) => {
      if (!message || message.senderRole === safeViewerRole) return count;
      const isRead = safeViewerRole === "seller" ? Boolean(message.readBySeller) : Boolean(message.readByBuyer);
      return isRead ? count : count + 1;
    }, 0);
  }

  function appendOrderChatMessage(orderChats, orderId = "", payload = {}) {
    const resolvedOrderId = String(orderId || "").trim();
    if (!resolvedOrderId) return normalizeOrderChatsMap(orderChats);

    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!text) return normalizeOrderChatsMap(orderChats);

    const normalizedChats = normalizeOrderChatsMap(orderChats);
    const currentThread = getOrderChatThread(normalizedChats, resolvedOrderId);
    const senderRole = payload.senderRole === "seller" ? "seller" : "buyer";
    const nextMessage = normalizeOrderChatMessage(
      {
        ...payload,
        orderId: resolvedOrderId,
        senderRole,
        text,
        sentAt: new Date().toISOString(),
        readByBuyer: senderRole === "buyer",
        readBySeller: senderRole === "seller"
      },
      resolvedOrderId
    );

    return {
      ...normalizedChats,
      [resolvedOrderId]: {
        orderId: resolvedOrderId,
        messages: [...currentThread.messages, nextMessage]
      }
    };
  }

  function markOrderChatAsRead(orderChats, orderId = "", viewerRole = "buyer") {
    const resolvedOrderId = String(orderId || "").trim();
    if (!resolvedOrderId) return normalizeOrderChatsMap(orderChats);

    const normalizedChats = normalizeOrderChatsMap(orderChats);
    const currentThread = normalizedChats[resolvedOrderId];
    if (!currentThread) return normalizedChats;

    const safeViewerRole = viewerRole === "seller" ? "seller" : "buyer";
    const readKey = safeViewerRole === "seller" ? "readBySeller" : "readByBuyer";
    const hasUnread = currentThread.messages.some(
      (message) => message.senderRole !== safeViewerRole && !Boolean(message[readKey])
    );

    if (!hasUnread) return normalizedChats;

    return {
      ...normalizedChats,
      [resolvedOrderId]: {
        ...currentThread,
        messages: currentThread.messages.map((message) =>
          message.senderRole === safeViewerRole
            ? message
            : {
                ...message,
                [readKey]: true
              }
        )
      }
    };
  }

  function resolveSellerProductsState(list, store, fallbackStoreId = sellerPrimaryStoreId) {
    const normalizedProducts = normalizeSellerProductsList(list, fallbackStoreId);
    const safeStore = normalizeSellerStore(store, fallbackStoreId);

    if (!normalizedProducts.length && !safeStore.catalogInitialized) {
      return createSellerProductsSeed(fallbackStoreId);
    }

    return normalizedProducts;
  }

  function createSellerProductsSeed(storeId = sellerPrimaryStoreId) {
    const quantityById = {
      1: 12,
      2: 7,
      3: 9,
      4: 4,
      5: 2,
      17: 8
    };

    return getMarketProductsByStore(storeId).map((product) =>
      normalizeSellerProduct({
        id: `seller-${product.id}`,
        marketProductId: product.id,
        storeId,
        title: product.title || product.name,
        categoryId: product.categoryId,
        price: product.price,
        oldPrice: product.oldPrice,
        rating: product.rating,
        reviewsCount: product.reviewsCount || product.reviews,
        image: product.image,
        badge: product.badge,
        stockQty: quantityById[product.id] ?? (product.stock ? 6 : 0),
        description: product.description,
        popular: product.popular,
        brand: deriveBrandFromTitle(product.title || product.name),
        sku: `AK-${String(product.id).padStart(4, "0")}`,
        deliveryAvailable: Boolean(getMarketStore(storeId)?.deliveryAvailable),
        status: product.stock ? "active" : "draft",
        createdAt: Date.now() - product.id * 86400000
      }, storeId)
    );
  }

  function normalizeSellerOrder(value, storeId = sellerPrimaryStoreId) {
    const source = value && typeof value === "object" ? value : {};
    const items = Array.isArray(source.items)
      ? source.items
          .map((item) => {
            const itemSource = item && typeof item === "object" ? item : {};
            const qty = Math.max(1, Math.floor(Number(itemSource.qty) || 1));
            const price = Math.max(0, Math.floor(Number(itemSource.price) || 0));
            const productTitle =
              typeof itemSource.title === "string" && itemSource.title.trim()
                ? itemSource.title.trim()
                : "Товар";

            return {
              productId:
                typeof itemSource.productId === "string" && itemSource.productId.trim()
                  ? itemSource.productId.trim()
                  : null,
              title: productTitle,
              qty,
              price
            };
          })
          .filter(Boolean)
      : [];
    const amount =
      Math.max(0, Math.floor(Number(source.amount) || 0)) ||
      items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const status =
      typeof source.status === "string" && sellerOrderStatusOptions.some((item) => item.id === source.status)
        ? source.status
        : "new";
    const resolvedStoreId =
      typeof source.storeId === "string" && source.storeId.trim()
        ? slugifyText(source.storeId, storeId)
        : storeId;
    const resolvedStore =
      getMarketStore(resolvedStoreId) ||
      (typeof source.storeName === "string" && source.storeName.trim()
        ? {
            name: source.storeName.trim()
          }
        : null);

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("order"),
      storeId: resolvedStoreId,
      storeName:
        typeof source.storeName === "string" && source.storeName.trim()
          ? source.storeName.trim()
          : resolvedStore?.name || "",
      customerName:
        typeof source.customerName === "string" && source.customerName.trim()
          ? source.customerName.trim()
          : "Клиент DRIVEX",
      customerPhone:
        typeof source.customerPhone === "string" && source.customerPhone.trim()
          ? source.customerPhone.trim()
          : "+992 00 000 00 00",
      items,
      amount,
      status,
      date: parseISODate(source.date) ? source.date : toLocalISODate(),
      deliveryMethod:
        typeof source.deliveryMethod === "string" && source.deliveryMethod.trim()
          ? source.deliveryMethod.trim()
          : "Доставка",
      address:
        typeof source.address === "string" && source.address.trim() ? source.address.trim() : "",
      notes: typeof source.notes === "string" ? source.notes.trim() : ""
      };
  }

  function createDefaultBuyerProfile() {
    return {
      name: "Пользователь DRIVEX",
      phone: "",
      email: "",
      avatar: ""
    };
  }

  function createEmptyBuyerSession() {
    return {
      id: "",
      name: "",
      phone: "",
      email: "",
      role: "buyer",
      provider: "local",
      authenticated: false
    };
  }

  function normalizeBuyerSession(value) {
    const fallback = createEmptyBuyerSession();
    const source = value && typeof value === "object" ? value : {};
    const id = typeof source.id === "string" && source.id.trim() ? source.id.trim() : "";
    const email = typeof source.email === "string" ? source.email.trim().toLowerCase() : "";
    const phone = typeof source.phone === "string" ? source.phone.trim() : "";
    const name = typeof source.name === "string" ? source.name.trim() : "";

    // Сохраняем роль если это seller/partner/admin, иначе buyer
    const rawRole = typeof source.role === "string" ? source.role.trim() : "";
    const role = (rawRole === "seller" || rawRole === "partner" || rawRole === "admin")
      ? rawRole
      : "buyer";

    return {
      id,
      name,
      phone,
      email,
      role,
      provider: source.provider === "supabase" ? "supabase" : "local",
      authenticated: Boolean(source.authenticated && (id || email || phone))
    };
  }

  function normalizeBuyerProfile(value) {
    const fallback = createDefaultBuyerProfile();
    const source = value && typeof value === "object" ? value : {};
    const avatarRaw = typeof source.avatar === "string" ? source.avatar.trim() : "";

    let avatar = "";
    if (avatarRaw) {
      if (avatarRaw.startsWith("https://") || avatarRaw.startsWith("http://")) {
        avatar = avatarRaw;
      } else if (avatarRaw.startsWith("data:image/") && avatarRaw.length <= 500000) {
        avatar = avatarRaw;
      }
    }

    return {
      name: String(source.name || fallback.name).trim() || fallback.name,
      phone: String(source.phone || "").trim(),
      email: String(source.email || "").trim().toLowerCase(),
      avatar
    };
  }

  // Экстренный контакт (SOS): один человек, которому можно за секунду
  // позвонить или отправить геолокацию с дороги. Хранится и синкается как
  // обычные личные данные покупателя (localStorage + облако).
  function createDefaultEmergencyContact() {
    return { name: "", phone: "" };
  }

  function normalizeEmergencyContact(value) {
    const fallback = createDefaultEmergencyContact();
    const source = value && typeof value === "object" ? value : {};
    return {
      name: String(source.name || fallback.name).trim().slice(0, 60),
      phone: normalizeTjPhoneInput(typeof source.phone === "string" ? source.phone : fallback.phone)
    };
  }

  function buyerSessionToProfile(session, currentProfile) {
    const safeSession = normalizeBuyerSession(session);
    const safeProfile = normalizeBuyerProfile(currentProfile);

    return normalizeBuyerProfile({
      ...safeProfile,
      name: safeSession.name || safeProfile.name,
      phone: safeSession.phone || safeProfile.phone,
      email: safeSession.email || safeProfile.email
    });
  }

  // Внутривкладочный лок auth-операций вместо navigator.locks. При множестве
  // открытых вкладок дефолтный navigatorLock воруется (steal) другой вкладкой,
  // и запрос (signInWithPassword/getUser) падает с "Failed to fetch" /
  // "Lock broken ... steal". Сериализуем операции в памяти этой вкладки —
  // никакой кросс-вкладочной гонки и прерывания запросов.
  function getDrivexAuthLock() {
    if (window.__DRIVEX_AUTH_LOCK__) return window.__DRIVEX_AUTH_LOCK__;
    const chains = {};
    window.__DRIVEX_AUTH_LOCK__ = function (name, _acquireTimeout, fn) {
      const prev = chains[name] || Promise.resolve();
      const run = prev.then(() => fn(), () => fn());
      chains[name] = run.then(() => {}, () => {});
      return run;
    };
    return window.__DRIVEX_AUTH_LOCK__;
  }

  function getSupabaseClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
    const config = window.DRIVEX_SUPABASE_CONFIG || {};
    if (!config.url || !config.anonKey) return null;

    if (!window.__DRIVEX_SUPABASE_CLIENT__) {
      window.__DRIVEX_SUPABASE_CLIENT__ = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "drivex-auth",  // единый ключ — предотвращает Lock conflicts
          lock: getDrivexAuthLock()   // in-memory lock вместо navigator.locks (см. выше)
        }
      });
    }

    return window.__DRIVEX_SUPABASE_CLIENT__;
  }

  function getBuyerAuthStatus() {
    return {
      mode: getSupabaseClient() ? "supabase" : "local",
      configured: Boolean(getSupabaseClient())
    };
  }

  // ── Supabase Profile Sync ─────────────────────────────────────────

  async function fetchProfileFromSupabase(session) {
    const client = getSupabaseClient();
    if (!client) return null;
    const safeSession = normalizeBuyerSession(session);
    if (!safeSession.authenticated || !safeSession.id || safeSession.provider !== "supabase") return null;
    try {
      const { data, error } = await client
        .from("users")
        .select("full_name, phone, email, avatar_url")
        .eq("id", safeSession.id)
        .single();
      if (error || !data) return null;
      return { name: data.full_name || "", phone: data.phone || "", email: data.email || "", avatar: data.avatar_url || "" };
    } catch {
      return null;
    }
  }

  async function syncProfileToSupabase(session, profile) {
    const client = getSupabaseClient();
    if (!client) return false;
    const safeSession = normalizeBuyerSession(session);
    if (!safeSession.authenticated || !safeSession.id || safeSession.provider !== "supabase") return false;
    if (!profile || typeof profile !== "object") return false;
    try {
      const update = {
        full_name: String(profile.name || "").trim(),
        phone: String(profile.phone || "").trim(),
        email: String(profile.email || "").trim().toLowerCase(),
        updated_at: new Date().toISOString()
      };
      if (profile.avatar && (profile.avatar.startsWith("https://") || profile.avatar.startsWith("http://"))) {
        update.avatar_url = profile.avatar;
      }
      const { error } = await client.from("users").update(update).eq("id", safeSession.id);
      return !error;
    } catch {
      return false;
    }
  }

  async function uploadAvatarToStorage(session, dataUrl) {
    const client = getSupabaseClient();
    if (!client) return null;
    const safeSession = normalizeBuyerSession(session);
    if (!safeSession.authenticated || !safeSession.id || safeSession.provider !== "supabase") return null;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) return null;
    try {
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return null;
      const mimeType = match[1];
      const ext = mimeType === "image/png" ? "png" : "jpg";
      const byteChars = atob(match[2]);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: mimeType });
      const filePath = `${safeSession.id}/avatar.${ext}`;
      const cfg = window.DRIVEX_SUPABASE_CONFIG || {};
      const avatarBucket = (cfg.buckets && cfg.buckets.userAvatars) || cfg.storageBucket || "user-avatars";
      const { error: uploadError } = await client.storage
        .from(avatarBucket)
        .upload(filePath, blob, { upsert: true, contentType: mimeType });
      if (uploadError) return null;
      const { data: urlData } = client.storage.from(avatarBucket).getPublicUrl(filePath);
      return urlData?.publicUrl || null;
    } catch {
      return null;
    }
  }

  // Загрузка фото из чата в Supabase Storage -> публичный URL (его и шлём как
  // сообщение; data-URL не годится — он вырезается при синхронизации в облако).
  async function uploadChatImage(dataUrl) {
    const client = getSupabaseClient();
    if (!client || !dataUrl || !String(dataUrl).startsWith("data:image/")) return null;
    try {
      const { data: sess } = await client.auth.getSession();
      const uid = sess && sess.session && sess.session.user && sess.session.user.id;
      if (!uid) return null;
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return null;
      const mimeType = match[1];
      const ext = mimeType === "image/png" ? "png" : (mimeType === "image/webp" ? "webp" : "jpg");
      const byteChars = atob(match[2]);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: mimeType });
      const cfg = window.DRIVEX_SUPABASE_CONFIG || {};
      const bucket = (cfg.buckets && cfg.buckets.userAvatars) || cfg.storageBucket || "user-avatars";
      const filePath = `${uid}/chat/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
      const { error } = await client.storage.from(bucket).upload(filePath, blob, { upsert: true, contentType: mimeType });
      if (error) return null;
      const { data: urlData } = client.storage.from(bucket).getPublicUrl(filePath);
      return (urlData && urlData.publicUrl) || null;
    } catch {
      return null;
    }
  }

  function getBuyerLocalStorageKey(key, session) {
    const safeSession = normalizeBuyerSession(session);
    if (safeSession.authenticated && safeSession.id) {
      return `${key}#buyer:${safeSession.id}`;
    }
    return key;
  }

  function readBuyerLocalStorage(key, session) {
    try {
      const storageKey = getBuyerLocalStorageKey(key, session);
      const raw = window.localStorage ? window.localStorage.getItem(storageKey) : null;
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writeBuyerLocalStorage(key, value, session) {
    try {
      const storageKey = getBuyerLocalStorageKey(key, session);
      if (value === null) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      }
    } catch {
      // ignore storage errors
    }
  }

  function clearBuyerLocalStorageForSession(session) {
    try {
      if (!window.localStorage) return;
      const safeSession = normalizeBuyerSession(session);
      if (!safeSession.authenticated || !safeSession.id) return;
      for (const key of buyerPersonalStorageKeys) {
        const storageKey = getBuyerLocalStorageKey(key, safeSession);
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // ignore cleanup errors
    }
  }

  function readLocalBuyerUsers() {
    try {
      const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.buyerUsers) : null;
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object") : [];
    } catch {
      return [];
    }
  }

  function writeLocalBuyerUsers(users) {
    try {
      window.localStorage &&
        window.localStorage.setItem(drivexStorageKeys.buyerUsers, JSON.stringify(Array.isArray(users) ? users : []));
    } catch {
      // ignore local auth cache errors
    }
  }

  function makeBuyerId(seed = Date.now()) {
    return `buyer-${String(seed).replace(/\D/g, "").slice(-10) || "new"}`;
  }

  function makeBuyerSessionFromLocalUser(user) {
    const safeUser = user && typeof user === "object" ? user : {};
    return normalizeBuyerSession({
      id: safeUser.id || makeBuyerId(),
      name: safeUser.name || "",
      phone: safeUser.phone || "",
      email: safeUser.email || "",
      role: safeUser.role || "buyer",  // сохраняем роль пользователя
      provider: "local",
      authenticated: true
    });
  }

  function makeBuyerSessionFromSupabaseUser(user) {
    const metadata = user?.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {};
    // Читаем роль из user_metadata — продавец/партнёр не должны получать роль buyer
    const metaRole = metadata.role || "";
    const role = (metaRole === "seller" || metaRole === "partner" || metaRole === "admin")
      ? metaRole
      : "buyer";
    return normalizeBuyerSession({
      id: user?.id || "",
      name: metadata.full_name || metadata.name || "",
      phone: metadata.phone || user?.phone || "",
      email: user?.email || "",
      role,
      provider: "supabase",
      authenticated: Boolean(user?.id)
    });
  }

  function normalizeGarageCar(value) {
    if (!value || typeof value !== "object") return null;
    const brand = typeof value.brand === "string" ? value.brand.trim() : "";
    const model = typeof value.model === "string" ? value.model.trim() : "";
    const nameRaw = typeof value.name === "string" ? value.name.trim() : "";
    const name = nameRaw || [brand, model].filter(Boolean).join(" ").trim();
    if (!name) return null;

    const mileageNumber = Number(value.mileageValue ?? value.mileage);
    const mileageValue = Number.isFinite(mileageNumber) && mileageNumber >= 0 ? Math.floor(mileageNumber) : 0;
    const mileageText =
      typeof value.mileage === "string" && value.mileage.trim()
        ? value.mileage.trim()
        : mileageValue
          ? `${mileageValue.toLocaleString("ru-RU")} км`
          : "";
    const yearNumber = Number(value.year);

    return {
      id: typeof value.id === "string" && value.id.trim() ? value.id.trim() : genId("car"),
      name,
      brand: brand || name.split(/\s+/)[0] || "",
      model: model || name.split(/\s+/).slice(1).join(" "),
      plate: typeof value.plate === "string" ? value.plate.trim().toUpperCase() : "",
      year: Number.isFinite(yearNumber) && yearNumber > 1900 ? Math.floor(yearNumber) : "",
      mileage: mileageText,
      mileageValue,
      vin: typeof value.vin === "string" ? value.vin.trim().toUpperCase() : "",
      fuelType: ["petrol", "diesel", "gas", "electric"].includes(String(value.fuelType || "").toLowerCase())
        ? String(value.fuelType).toLowerCase()
        : "petrol",
      engine: (function () {
        const e = Number(value.engine ?? value.engineVolume);
        return Number.isFinite(e) && e > 0 && e < 12 ? Math.round(e * 10) / 10 : "";
      })(),
      createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString()
    };
  }

  function normalizeGarageList(value) {
    return (Array.isArray(value) ? value : []).map(normalizeGarageCar).filter(Boolean);
  }

  function normalizeSavedPlace(value) {
    if (!value || typeof value !== "object") return null;
    const title = typeof value.title === "string" ? value.title.trim() : "";
    const address = typeof value.address === "string" ? value.address.trim() : "";
    if (!title && !address) return null;

    return {
      id: typeof value.id === "string" && value.id.trim() ? value.id.trim() : genId("place"),
      title: title || "Место",
      address,
      icon: typeof value.icon === "string" && value.icon.trim() ? value.icon.trim() : "map",
      color: typeof value.color === "string" && value.color.trim() ? value.color.trim() : "var(--drivex-neon-cyan)",
      createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString()
    };
  }

  function normalizeSavedPlacesList(value) {
    return (Array.isArray(value) ? value : []).map(normalizeSavedPlace).filter(Boolean);
  }

  function normalizeFavorite(value) {
    if (!value || typeof value !== "object") return null;
    const id = typeof value.id === "string" ? value.id.trim() : (value.id != null ? String(value.id) : "");
    if (!id) return null;
    const type = value.type === "product" ? "product" : "service";
    return {
      id,
      type,
      title: typeof value.title === "string" && value.title.trim() ? value.title.trim() : (value.name || "Без названия"),
      subtitle: typeof value.subtitle === "string" ? value.subtitle : "",
      image: typeof value.image === "string" ? value.image : "",
      path: typeof value.path === "string" ? value.path : "",
      addedAt: typeof value.addedAt === "string" ? value.addedAt : new Date().toISOString()
    };
  }

  function normalizeFavoritesList(value) {
    const seen = new Set();
    return (Array.isArray(value) ? value : [])
      .map(normalizeFavorite)
      .filter(Boolean)
      .filter((item) => {
        const key = item.type + ":" + item.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function createSellerOrdersSeed(storeId = sellerPrimaryStoreId) {
    return [
      normalizeSellerOrder(
        {
          id: "DX-240315-101",
          customerName: "Фирдавс Саидов",
          customerPhone: "+992 93 220 11 44",
          items: [
            { productId: "seller-1", title: "Michelin Pilot Sport 4 225/45 R17", qty: 2, price: 2480 }
          ],
          amount: 4960,
          status: "new",
          date: "2026-03-15",
          deliveryMethod: "Доставка",
          address: "Худжанд, 8 мкр",
          notes: "Позвонить за 20 минут"
        },
        storeId
      ),
      normalizeSellerOrder(
        {
          id: "DX-240314-089",
          customerName: "Мунира Абдуллоева",
          customerPhone: "+992 92 110 88 01",
          items: [
            { productId: "seller-3", title: "Brembo тормозные колодки передние", qty: 1, price: 365 },
            { productId: "seller-4", title: "Салонный фильтр Bosch", qty: 1, price: 95 }
          ],
          amount: 460,
          status: "confirmed",
          date: "2026-03-14",
          deliveryMethod: "Самовывоз",
          address: "Худжанд, 8 мкр",
          notes: "Заберёт после 18:00"
        },
        storeId
      ),
      normalizeSellerOrder(
        {
          id: "DX-240313-074",
          customerName: "Азиз Набиев",
          customerPhone: "+992 90 555 13 13",
          items: [
            { productId: "seller-17", title: "Щётки стеклоочистителя Bosch AeroTwin", qty: 1, price: 210 },
            { productId: "seller-5", title: "Амортизатор KYB Excel-G", qty: 2, price: 620 }
          ],
          amount: 1450,
          status: "delivery",
          date: "2026-03-13",
          deliveryMethod: "Доставка",
          address: "Б.Гафуров, ул. Сомони",
          notes: ""
        },
        storeId
      ),
      normalizeSellerOrder(
        {
          id: "DX-240312-051",
          customerName: "Рустам Хайдаров",
          customerPhone: "+992 98 440 07 70",
          items: [
            { productId: "seller-2", title: "Triangle TH201 205/55 R16", qty: 4, price: 985 }
          ],
          amount: 3940,
          status: "completed",
          date: "2026-03-12",
          deliveryMethod: "Самовывоз",
          address: "Худжанд, pickup",
          notes: ""
        },
        storeId
      )
    ];
  }

  function buildSellerDashboardStats(products, orders) {
    const safeProducts = Array.isArray(products) ? products : [];
    const safeOrders = Array.isArray(orders) ? orders : [];

    return {
      totalProducts: safeProducts.length,
      publishedProducts: safeProducts.filter((product) => product.status === "active").length,
      totalOrders: safeOrders.length,
      newOrders: safeOrders.filter((order) => order.status === "new").length,
      lowStockProducts: safeProducts.filter((product) => product.stockQty > 0 && product.stockQty <= 3).length,
      revenue: safeOrders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + (Number(order.amount) || 0), 0)
    };
  }

  // База клиентов CRM: группировка заказов по телефону (или имени, если телефона
  // нет). Экран «Клиенты» и счётчик на дашборде ждут { name, phone, ordersCount,
  // totalAmount } — до этого функции не существовало и клиенты всегда были «0».
  function buildSellerClientsFromOrders(orders) {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const byKey = {};
    for (const order of safeOrders) {
      if (!order || order.status === "cancelled") continue;
      const phoneDigits = String(order.customerPhone || "").replace(/\D/g, "");
      const name = String(order.customerName || "").trim() || "Клиент DRIVEX";
      const key = phoneDigits || name.toLowerCase();
      const entry = byKey[key] || {
        id: key,
        name,
        phone: order.customerPhone || "",
        ordersCount: 0,
        totalAmount: 0,
        lastDate: ""
      };
      entry.ordersCount += 1;
      entry.totalAmount += Number(order.amount) || 0;
      if (!entry.phone && order.customerPhone) entry.phone = order.customerPhone;
      if (String(order.date || "") > String(entry.lastDate || "")) entry.lastDate = order.date || "";
      byKey[key] = entry;
    }
    return Object.values(byKey).sort((a, b) => String(b.lastDate).localeCompare(String(a.lastDate)));
  }

  function createSellerNotifications({ setupState, products, orders }) {
    const notifications = [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeOrders = Array.isArray(orders) ? orders : [];

    if (setupState && !setupState.isProfileComplete) {
      notifications.push({
        id: "setup",
        title: "Завершите профиль магазина",
        body: `Заполнено ${setupState.completedCount} из ${setupState.totalCount} пунктов`,
        color: "var(--drivex-warning)",
        icon: "settings"
      });
    }

    const newestOrder = safeOrders.find((order) => order.status === "new");
    if (newestOrder) {
      notifications.push({
        id: `order-${newestOrder.id}`,
        title: `Новый заказ ${newestOrder.id}`,
        body: `${newestOrder.customerName} • ${formatTjsPrice(newestOrder.amount)}`,
        color: "var(--drivex-electric-blue)",
        icon: "bag"
      });
    }

    const lowStock = safeProducts.find((product) => product.stockQty > 0 && product.stockQty <= 3);
    if (lowStock) {
      notifications.push({
        id: `stock-${lowStock.id}`,
        title: "Низкий остаток товара",
        body: `${lowStock.title} • осталось ${lowStock.stockQty} шт.`,
        color: "var(--drivex-danger)",
        icon: "scan"
      });
    }

    const deliveryOrder = safeOrders.find((order) => order.status === "delivery");
    if (deliveryOrder) {
      notifications.push({
        id: `delivery-${deliveryOrder.id}`,
        title: `${deliveryOrder.id} переведён в доставку`,
        body: deliveryOrder.customerName,
        color: "var(--drivex-neon-cyan)",
        icon: "truck"
      });
    }

    return notifications.slice(0, 4);
  }

  function getSellerNotificationMeta(type) {
    const normalizedType = String(type || "").trim().toLowerCase();
    if (normalizedType === "order_new") {
      return { color: "var(--drivex-electric-blue)", icon: "bag" };
    }
    if (normalizedType === "order_status") {
      return { color: "var(--drivex-neon-cyan)", icon: "truck" };
    }
    if (normalizedType === "product_low_stock") {
      return { color: "var(--drivex-danger)", icon: "scan" };
    }
    if (normalizedType === "product_published") {
      return { color: "var(--drivex-success)", icon: "bag" };
    }
    if (normalizedType === "store_updated") {
      return { color: "var(--drivex-warning)", icon: "settings" };
    }
    return { color: "var(--drivex-electric-blue)", icon: "sparkles" };
  }

  function normalizeSellerNotification(value) {
    const source = value && typeof value === "object" ? value : {};
    const meta = getSellerNotificationMeta(source.type);
    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("notification"),
      type: typeof source.type === "string" ? source.type.trim() : "welcome",
      title:
        typeof source.title === "string" && source.title.trim()
          ? source.title.trim()
          : "Обновление seller кабинета",
      body:
        typeof source.body === "string" && source.body.trim()
          ? source.body.trim()
          : typeof source.message === "string" && source.message.trim()
            ? source.message.trim()
            : "",
      message:
        typeof source.message === "string" && source.message.trim()
          ? source.message.trim()
          : typeof source.body === "string"
            ? source.body.trim()
            : "",
      isRead: Boolean(source.isRead ?? source.is_read),
      createdAt:
        typeof source.createdAt === "string" && source.createdAt.trim()
          ? source.createdAt.trim()
          : typeof source.created_at === "string" && source.created_at.trim()
            ? source.created_at.trim()
            : new Date().toISOString(),
      color: typeof source.color === "string" && source.color.trim() ? source.color.trim() : meta.color,
      icon: typeof source.icon === "string" && source.icon.trim() ? source.icon.trim() : meta.icon
    };
  }

  function normalizeSellerNotificationsList(list) {
    return (Array.isArray(list) ? list : []).map((item) => normalizeSellerNotification(item)).filter(Boolean);
  }

  function mergeSellerNotifications(serverNotifications, derivedNotifications) {
    const merged = [];
    const seenIds = new Set();

    for (const item of [...normalizeSellerNotificationsList(serverNotifications), ...normalizeSellerNotificationsList(derivedNotifications)]) {
      if (!item || seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      merged.push(item);
    }

    return merged
      .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")))
      .slice(0, 8);
  }

  function getSellerProductById(productsList, productId) {
    return (Array.isArray(productsList) ? productsList : []).find((product) => product.id === productId) || null;
  }

  function createDefaultServiceSession() {
    return {
      id: "guest-service",
      name: "",
      email: "",
      role: "service_owner",
      serviceCenterId: servicePrimaryCenterId
    };
  }

  function createFreshServiceSession(seed = Date.now()) {
    const centerId = slugifyText(`service-${seed}`, `service-${Date.now()}`);

    return {
      id: `service-session-${String(seed).replace(/\D/g, "").slice(-8) || "new"}`,
      name: "",
      email: "",
      role: "service_owner",
      serviceCenterId: centerId
    };
  }

  function normalizeServiceSession(value) {
    const fallback = createDefaultServiceSession();
    const source = value && typeof value === "object" ? value : {};
    const centerId =
      typeof source.serviceCenterId === "string" && source.serviceCenterId.trim()
        ? slugifyText(source.serviceCenterId, fallback.serviceCenterId)
        : fallback.serviceCenterId;

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : fallback.id,
      name: typeof source.name === "string" ? source.name.trim() : fallback.name,
      email: typeof source.email === "string" ? source.email.trim() : fallback.email,
      role: "service_owner",
      serviceCenterId: centerId
    };
  }

  function createServiceProfileSeed(session = createDefaultServiceSession()) {
    const safeSession = normalizeServiceSession(session);

    return {
      id: `service-profile-${safeSession.serviceCenterId}`,
      ownerFullName: safeSession.name || "",
      phone: "+992 ",
      email: safeSession.email || "",
      password: "",
      position: "Владелец сервиса",
      registrationCompleted: false
    };
  }

  function normalizeTjPhoneInput(value = "") {
    const digits = String(value || "").replace(/\D/g, "");
    let localDigits = "";

    if (digits.startsWith("992")) {
      localDigits = digits.slice(3);
    } else if (digits.startsWith("0")) {
      localDigits = digits.slice(1);
    } else {
      localDigits = digits;
    }

    const limited = localDigits.slice(0, 9);
    const parts = [
      limited.slice(0, 2),
      limited.slice(2, 5),
      limited.slice(5, 7),
      limited.slice(7, 9)
    ].filter(Boolean);

    return parts.length ? `+992 ${parts.join(" ")}` : "+992 ";
  }

  function isCompleteTjPhone(value = "") {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.startsWith("992") && digits.length >= 12;
  }

  function normalizeServiceProfile(value, session = createDefaultServiceSession()) {
    const fallback = createServiceProfileSeed(session);
    const source = value && typeof value === "object" ? value : {};

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : fallback.id,
      ownerFullName:
        typeof source.ownerFullName === "string" && source.ownerFullName.trim()
          ? source.ownerFullName.trim()
          : fallback.ownerFullName,
      phone: normalizeTjPhoneInput(typeof source.phone === "string" ? source.phone : fallback.phone),
      email: typeof source.email === "string" ? source.email.trim() : fallback.email,
      // Пароль в профиле НЕ храним: раньше он лежал открытым текстом в общем
      // app-state.json на сервере. Аутентификация — только через Supabase Auth.
      position:
        typeof source.position === "string" && source.position.trim() ? source.position.trim() : fallback.position,
      registrationCompleted:
        typeof source.registrationCompleted === "boolean"
          ? source.registrationCompleted
          : fallback.registrationCompleted
    };
  }

  function createDefaultServiceAuthState() {
    return {
      authenticated: false,
      lastLoginAt: ""
    };
  }

  function normalizeServiceAuthState(value) {
    const fallback = createDefaultServiceAuthState();
    const source = value && typeof value === "object" ? value : {};

    return {
      authenticated:
        typeof source.authenticated === "boolean" ? source.authenticated : fallback.authenticated,
      lastLoginAt:
        typeof source.lastLoginAt === "string" && source.lastLoginAt.trim()
          ? source.lastLoginAt.trim()
          : fallback.lastLoginAt
    };
  }

  function createServiceCenterSeed(centerId = servicePrimaryCenterId) {
    return {
      id: centerId || servicePrimaryCenterId,
      name: "",
      serviceType: "",
      city: "",
      address: "",
      locationLabel: "",
      geolocation: "",
      phone: "+992 ",
      email: "",
      boxesCount: 2,
      workingHours: "08:00 — 19:00",
      description: "",
      logo: "",
      coverImage: "",
      gallery: [],
      videoUrl: "",
      registrationCompleted: false,
      status: "new"
    };
  }

  function normalizeServiceImageAsset(value) {
    const raw = typeof value === "string" ? value.trim() : "";
    return raw && (raw.startsWith("data:image/") || /^https?:/i.test(raw)) ? raw : "";
  }

  function normalizeServiceGalleryList(value, limit = 6) {
    const source = Array.isArray(value)
      ? value
      : typeof value === "string" && value.trim()
        ? value.split(/\r?\n|,/g)
        : [];
    return source.map((item) => normalizeServiceImageAsset(item)).filter(Boolean).slice(0, limit);
  }

  function normalizeServiceVideoUrl(value) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^[\w.-]+\.[A-Za-z]{2,}(?:[/?#].*)?$/i.test(raw)) return `https://${raw}`;
    return "";
  }

  // Прайс-лист сервиса: владелец добавляет/редактирует/удаляет позиции в CRM
  // (Настройки → «Услуги и цены»). Раньше клиент видел фиксированные 4
  // заглушки по категории — эти позиции реальные, с ценой и длительностью.
  function normalizeServicePriceItem(value) {
    const source = value && typeof value === "object" ? value : {};
    const title = typeof source.title === "string" ? source.title.trim() : "";
    if (!title) return null;
    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("service-price"),
      title: title.slice(0, 80),
      price: Math.max(0, Math.floor(Number(source.price) || 0)),
      durationMinutes: Math.max(0, Math.floor(Number(source.durationMinutes ?? source.duration) || 0))
    };
  }

  function normalizeServicePriceList(list) {
    return (Array.isArray(list) ? list : []).map(normalizeServicePriceItem).filter(Boolean).slice(0, 40);
  }

  // Мастера сервиса: тоже управляются владельцем в CRM. Раньше на карточке
  // сервиса ВСЕГДА показывался один выдуманный «Главный мастер / CRM owner» —
  // теперь список пуст, пока владелец сам не добавит реальных сотрудников.
  function normalizeServiceMasterEntry(value) {
    const source = value && typeof value === "object" ? value : {};
    const name = typeof source.name === "string" ? source.name.trim() : "";
    if (!name) return null;
    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("service-master"),
      name: name.slice(0, 60),
      specialty: typeof source.specialty === "string" ? source.specialty.trim().slice(0, 80) : "",
      experience: typeof source.experience === "string" ? source.experience.trim().slice(0, 40) : ""
    };
  }

  function normalizeServiceMastersList(list) {
    return (Array.isArray(list) ? list : []).map(normalizeServiceMasterEntry).filter(Boolean).slice(0, 12);
  }

  function normalizeServiceCenter(value, fallbackCenterId = servicePrimaryCenterId) {
    const fallback = createServiceCenterSeed(fallbackCenterId);
    const source = value && typeof value === "object" ? value : {};
    const rawLogo = typeof source.logo === "string" ? source.logo.trim() : "";
    const logo =
      rawLogo && (rawLogo.startsWith("data:image/") || /^https?:/i.test(rawLogo)) ? rawLogo : fallback.logo;
    const coverImage = normalizeServiceImageAsset(source.coverImage || source.heroImage || source.image);
    const gallery = normalizeServiceGalleryList(source.gallery || source.photos || source.workPhotos);
    const videoUrl = normalizeServiceVideoUrl(source.videoUrl || source.video_url || source.video);
    const boxesCount = Math.max(1, Math.floor(Number(source.boxesCount ?? source.boxes_count) || fallback.boxesCount));

    return {
      id:
        typeof source.id === "string" && source.id.trim()
          ? slugifyText(source.id, fallback.id)
          : slugifyText(source.name || fallback.id, fallback.id),
      name: typeof source.name === "string" ? source.name.trim() : fallback.name,
      serviceType:
        typeof source.serviceType === "string" && source.serviceType.trim()
          ? source.serviceType.trim()
          : typeof source.type === "string" && source.type.trim()
            ? source.type.trim()
            : fallback.serviceType,
      city: typeof source.city === "string" ? source.city.trim() : fallback.city,
      address: typeof source.address === "string" ? source.address.trim() : fallback.address,
      locationLabel:
        typeof source.locationLabel === "string" && source.locationLabel.trim()
          ? source.locationLabel.trim()
          : typeof source.location_label === "string" && source.location_label.trim()
            ? source.location_label.trim()
            : fallback.locationLabel,
      geolocation:
        typeof source.geolocation === "string" && source.geolocation.trim()
          ? source.geolocation.trim()
          : fallback.geolocation,
      phone: normalizeTjPhoneInput(typeof source.phone === "string" ? source.phone : fallback.phone),
      email: typeof source.email === "string" ? source.email.trim() : fallback.email,
      boxesCount,
      workingHours:
        typeof source.workingHours === "string" && source.workingHours.trim()
          ? source.workingHours.trim()
          : typeof source.working_hours === "string" && source.working_hours.trim()
            ? source.working_hours.trim()
            : fallback.workingHours,
      description:
        typeof source.description === "string" && source.description.trim()
          ? source.description.trim()
          : fallback.description,
      logo,
      coverImage,
      gallery,
      videoUrl,
      registrationCompleted:
        typeof source.registrationCompleted === "boolean"
          ? source.registrationCompleted
          : fallback.registrationCompleted,
      status: typeof source.status === "string" && source.status.trim() ? source.status.trim() : fallback.status,
      // Владелец центра (Supabase auth uid) — по нему восстанавливается кабинет
      // при входе и сервер запрещает перезапись чужого центра.
      ownerUserId:
        typeof source.ownerUserId === "string" && source.ownerUserId.trim()
          ? source.ownerUserId.trim()
          : typeof source.owner_user_id === "string" && source.owner_user_id.trim()
            ? source.owner_user_id.trim()
            : "",
      // Услуги с ценами и мастера — управляются владельцем в CRM
      // (Настройки → «Услуги и цены» / «Мастера»).
      priceList: normalizeServicePriceList(source.priceList || source.price_list),
      masters: normalizeServiceMastersList(source.masters)
    };
  }

  function createServiceCenterFormState(center) {
    const normalized = normalizeServiceCenter(center);

    return {
      name: normalized.name,
      serviceType: normalized.serviceType,
      city: normalized.city,
      address: normalized.address,
      locationLabel: normalized.locationLabel,
      geolocation: normalized.geolocation,
      phone: normalized.phone,
      email: normalized.email,
      boxesCount: String(normalized.boxesCount || 1),
      workingHours: normalized.workingHours,
      description: normalized.description,
      logo: normalized.logo,
      coverImage: normalized.coverImage,
      gallery: [...normalized.gallery],
      videoUrl: normalized.videoUrl,
      priceList: [...normalized.priceList],
      masters: [...normalized.masters]
    };
  }

  function extractServiceCenterMedia(center, fallbackCenterId = servicePrimaryCenterId) {
    const safeCenter = normalizeServiceCenter(center, fallbackCenterId);
    return {
      coverImage: safeCenter.coverImage,
      gallery: normalizeServiceGalleryList(safeCenter.gallery)
    };
  }

  function serializeServiceCenterForStorage(center, fallbackCenterId = servicePrimaryCenterId) {
    const safeCenter = normalizeServiceCenter(center, fallbackCenterId);
    if (!canUseIndexedDbStorage()) return safeCenter;
    return {
      ...safeCenter,
      gallery: []
    };
  }

  function getLatestPersistedServiceCenter(center, fallbackCenterId = servicePrimaryCenterId) {
    const stateCenter = normalizeServiceCenter(center, fallbackCenterId);
    try {
      if (typeof window === "undefined" || !window.localStorage) return stateCenter;
      const raw = window.localStorage.getItem(drivexStorageKeys.serviceCenter);
      if (!raw) return stateCenter;
      const storedCenter = normalizeServiceCenter(JSON.parse(raw), fallbackCenterId);
      if (!storedCenter.id || String(storedCenter.id) !== String(stateCenter.id)) {
        return stateCenter;
      }

      const storedGallery = normalizeServiceGalleryList(storedCenter.gallery);
      const stateGallery = normalizeServiceGalleryList(stateCenter.gallery);

      return normalizeServiceCenter(
        {
          ...stateCenter,
          ...storedCenter,
          coverImage: storedCenter.coverImage || stateCenter.coverImage,
          gallery: storedGallery.length ? storedGallery : stateGallery
        },
        fallbackCenterId
      );
    } catch {
      return stateCenter;
    }
  }

  function persistServiceCenterToLocalStorage(center, fallbackCenterId = servicePrimaryCenterId) {
    if (typeof window === "undefined" || !window.localStorage) {
      return { ok: false, variant: -1 };
    }

    const safeCenter = normalizeServiceCenter(center, fallbackCenterId);
    const variants = canUseIndexedDbStorage()
      ? [serializeServiceCenterForStorage(safeCenter, fallbackCenterId)]
      : [
          safeCenter,
          {
            ...safeCenter,
            gallery: normalizeServiceGalleryList(safeCenter.gallery).slice(0, 2)
          },
          {
            ...safeCenter,
            gallery: []
          }
        ];

    let lastError = null;
    for (let index = 0; index < variants.length; index += 1) {
      try {
        window.localStorage.setItem(drivexStorageKeys.serviceCenter, JSON.stringify(variants[index]));
        return {
          ok: true,
          variant: index,
          storedCenter: variants[index]
        };
      } catch (error) {
        lastError = error;
      }
    }

    return {
      ok: false,
      variant: -1,
      error: lastError
    };
  }

  function createServiceRegistrationDraft(seed = Date.now()) {
    const session = createFreshServiceSession(seed);

    return {
      session,
      profile: createServiceProfileSeed(session),
      center: createServiceCenterSeed(session.serviceCenterId)
    };
  }

  function normalizeServiceClient(value, fallbackCenterId = servicePrimaryCenterId) {
    const source = value && typeof value === "object" ? value : {};
    const vehicles = (Array.isArray(source.vehicles) ? source.vehicles : [])
      .map((vehicle, index) => {
        const raw = vehicle && typeof vehicle === "object" ? vehicle : {};
        const brand = typeof raw.brand === "string" ? raw.brand.trim() : "";
        const model = typeof raw.model === "string" ? raw.model.trim() : "";
        const plate = typeof raw.plate === "string" ? raw.plate.trim() : "";
        if (!brand && !model && !plate) return null;

        return {
          id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `${source.id || "vehicle"}-${index + 1}`,
          brand,
          model,
          year: typeof raw.year === "string" ? raw.year.trim() : String(raw.year || "").trim(),
          plate,
          mileage: typeof raw.mileage === "string" ? raw.mileage.trim() : String(raw.mileage || "").trim()
        };
      })
      .filter(Boolean);

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("service-client"),
      centerId:
        typeof source.centerId === "string" && source.centerId.trim()
          ? slugifyText(source.centerId, fallbackCenterId)
          : fallbackCenterId,
      name: typeof source.name === "string" ? source.name.trim() : "",
      phone: typeof source.phone === "string" ? source.phone.trim() : "",
      loyalty: typeof source.loyalty === "string" ? source.loyalty.trim() : "Новый клиент",
      note: typeof source.note === "string" ? source.note.trim() : "",
      lastVisit: parseISODate(source.lastVisit) ? source.lastVisit : toLocalISODate(),
      vehicles
    };
  }

  function normalizeServiceClientsList(list, fallbackCenterId = servicePrimaryCenterId) {
    return (Array.isArray(list) ? list : [])
      .map((item) => normalizeServiceClient(item, fallbackCenterId))
      .filter((item) => item.name || item.phone);
  }

  function isDemoServiceClient(client) {
    const id = String(client?.id || "");
    return /^service-client-\d+$/i.test(id);
  }

  function createServiceClientsSeed(centerId = servicePrimaryCenterId) {
    return normalizeServiceClientsList(
      [
        {
          id: "service-client-1",
          centerId,
          name: "Шохрух Махкамов",
          phone: "+992 92 927 12 59",
          loyalty: "Постоянный клиент",
          note: "Удобнее сначала звонок, потом WhatsApp.",
          lastVisit: "2026-03-28",
          vehicles: [
            {
              id: "service-client-1-car-1",
              brand: "Toyota",
              model: "Camry",
              year: "2018",
              plate: "1234AB01",
              mileage: "124 000 км"
            }
          ]
        },
        {
          id: "service-client-2",
          centerId,
          name: "Рустам Турсунов",
          phone: "+992 93 440 10 22",
          loyalty: "Новый клиент",
          note: "Просил онлайн-статус ремонта.",
          lastVisit: "2026-03-30",
          vehicles: [
            {
              id: "service-client-2-car-1",
              brand: "Hyundai",
              model: "Elantra",
              year: "2020",
              plate: "6789CD01",
              mileage: "63 000 км"
            }
          ]
        },
        {
          id: "service-client-3",
          centerId,
          name: "Мунира Саидова",
          phone: "+992 90 120 44 11",
          loyalty: "VIP",
          note: "Часто приезжает на сезонное ТО.",
          lastVisit: "2026-03-24",
          vehicles: [
            {
              id: "service-client-3-car-1",
              brand: "Kia",
              model: "Sportage",
              year: "2019",
              plate: "4455EF01",
              mileage: "89 000 км"
            },
            {
              id: "service-client-3-car-2",
              brand: "Chevrolet",
              model: "Cobalt",
              year: "2021",
              plate: "9911GH01",
              mileage: "51 000 км"
            }
          ]
        }
      ],
      centerId
    );
  }

  function getServiceRepairStatusMeta(statusId) {
    return serviceRepairStatusOptions.find((status) => status.id === statusId) || serviceRepairStatusOptions[0];
  }

  function normalizeServiceRepairOrder(value, fallbackCenterId = servicePrimaryCenterId) {
    const source = value && typeof value === "object" ? value : {};
    const statusMeta = getServiceRepairStatusMeta(source.status);
    const parts = (Array.isArray(source.parts) ? source.parts : [])
      .map((item) => {
        const raw = item && typeof item === "object" ? item : {};
        const name = typeof raw.name === "string" ? raw.name.trim() : "";
        if (!name) return null;

        return {
          id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : genId("service-part-line"),
          name,
          qty: Math.max(1, Math.floor(Number(raw.qty) || 1)),
          price: Math.max(0, Math.floor(Number(raw.price) || 0))
        };
      })
      .filter(Boolean);

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("service-order"),
      centerId:
        typeof source.centerId === "string" && source.centerId.trim()
          ? slugifyText(source.centerId, fallbackCenterId)
          : fallbackCenterId,
      clientId: typeof source.clientId === "string" ? source.clientId.trim() : "",
      clientName: typeof source.clientName === "string" ? source.clientName.trim() : "",
      clientPhone: typeof source.clientPhone === "string" ? source.clientPhone.trim() : "",
      sourceRequestId: typeof source.sourceRequestId === "string" ? source.sourceRequestId.trim() : "",
      carLabel: typeof source.carLabel === "string" ? source.carLabel.trim() : "",
      problem: typeof source.problem === "string" ? source.problem.trim() : "",
      note: typeof source.note === "string" ? source.note.trim() : "",
      boxLabel: typeof source.boxLabel === "string" ? source.boxLabel.trim() : "Бокс 1",
      estimate: typeof source.estimate === "string" ? source.estimate.trim() : "1 час",
      createdAt:
        typeof source.createdAt === "string" && source.createdAt.trim() ? source.createdAt.trim() : new Date().toISOString(),
      appointmentTime: typeof source.appointmentTime === "string" ? source.appointmentTime.trim() : "",
      total: Math.max(0, Math.floor(Number(source.total) || 0)),
      completedWork: typeof source.completedWork === "string" ? source.completedWork.trim() : "",
      completedAt: typeof source.completedAt === "string" ? source.completedAt.trim() : "",
      status: statusMeta.id,
      statusLabel: statusMeta.label,
      statusColor: statusMeta.color,
      parts
    };
  }

  function normalizeServiceRepairOrdersList(list, fallbackCenterId = servicePrimaryCenterId) {
    return (Array.isArray(list) ? list : [])
      .map((item) => normalizeServiceRepairOrder(item, fallbackCenterId))
      .filter((item) => item.clientName || item.problem);
  }

  function isDemoServiceOrder(order) {
    const id = String(order?.id || "");
    const clientId = String(order?.clientId || "");
    return /^SRV-2603(29|30)-/i.test(id) || /^service-client-\d+$/i.test(clientId);
  }

  function isDemoServiceFinanceEntry(entry) {
    const sourceOrderId = String(entry?.sourceOrderId || "");
    return /^SRV-2603(29|30)-/i.test(sourceOrderId);
  }

  function createServiceOrdersSeed(centerId = servicePrimaryCenterId) {
    return normalizeServiceRepairOrdersList(
      [
        {
          id: "SRV-260330-001",
          centerId,
          clientId: "service-client-1",
          clientName: "Шохрух Махкамов",
          clientPhone: "+992 92 927 12 59",
          carLabel: "Toyota Camry • 1234AB01",
          problem: "Замена передних колодок и быстрая диагностика ходовой",
          note: "Клиент ждёт звонок после осмотра.",
          boxLabel: "Бокс 1",
          estimate: "2 часа",
          createdAt: "2026-03-30T09:15:00",
          appointmentTime: "09:30",
          total: 420,
          status: "queued",
          parts: [
            { id: "service-line-1", name: "Колодки Brembo", qty: 1, price: 260 },
            { id: "service-line-2", name: "Смазка направляющих", qty: 1, price: 40 }
          ]
        },
        {
          id: "SRV-260330-002",
          centerId,
          clientId: "service-client-2",
          clientName: "Рустам Турсунов",
          clientPhone: "+992 93 440 10 22",
          carLabel: "Hyundai Elantra • 6789CD01",
          problem: "Замена масла и фильтра",
          note: "Нужно отдать до 14:00.",
          boxLabel: "Бокс 2",
          estimate: "45 минут",
          createdAt: "2026-03-30T10:05:00",
          appointmentTime: "10:00",
          total: 310,
          status: "progress",
          parts: [
            { id: "service-line-3", name: "Масло 5W-30", qty: 1, price: 165 },
            { id: "service-line-4", name: "Фильтр масляный", qty: 1, price: 55 }
          ]
        },
        {
          id: "SRV-260329-009",
          centerId,
          clientId: "service-client-3",
          clientName: "Мунира Саидова",
          clientPhone: "+992 90 120 44 11",
          carLabel: "Kia Sportage • 4455EF01",
          problem: "Компьютерная диагностика и замена свечей",
          note: "Можно забирать вечером.",
          boxLabel: "Бокс 3",
          estimate: "1.5 часа",
          createdAt: "2026-03-29T15:40:00",
          appointmentTime: "15:30",
          total: 540,
          status: "ready",
          parts: [
            { id: "service-line-5", name: "Свечи NGK", qty: 4, price: 80 }
          ]
        }
      ],
      centerId
    );
  }

  function getServiceRepairActions(order) {
    const currentStatus = getServiceRepairStatusMeta(order?.status).id;

    switch (currentStatus) {
      case "queued":
        return [
          {
            id: "to-progress",
            status: "progress",
            label: "В работу",
            color: "var(--drivex-neon-cyan)"
          }
        ];
      case "progress":
        return [
          {
            id: "to-ready",
            status: "ready",
            label: "Отметить готовым",
            color: "var(--drivex-success)"
          }
        ];
      default:
        return [];
    }
  }

  function normalizeServiceInventoryItem(value, fallbackCenterId = servicePrimaryCenterId) {
    const source = value && typeof value === "object" ? value : {};

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("service-stock"),
      centerId:
        typeof source.centerId === "string" && source.centerId.trim()
          ? slugifyText(source.centerId, fallbackCenterId)
          : fallbackCenterId,
      name: typeof source.name === "string" ? source.name.trim() : "",
      sku: typeof source.sku === "string" ? source.sku.trim() : "",
      unit: typeof source.unit === "string" ? source.unit.trim() : "шт.",
      stockQty: Math.max(0, Math.floor(Number(source.stockQty ?? source.stock_qty) || 0)),
      minQty: Math.max(0, Math.floor(Number(source.minQty ?? source.min_qty) || 0)),
      price: Math.max(0, Math.floor(Number(source.price) || 0)),
      location: typeof source.location === "string" ? source.location.trim() : "Основной склад"
    };
  }

  function normalizeServiceInventoryList(list, fallbackCenterId = servicePrimaryCenterId) {
    return (Array.isArray(list) ? list : [])
      .map((item) => normalizeServiceInventoryItem(item, fallbackCenterId))
      .filter((item) => item.name);
  }

  function isDemoServiceInventoryItem(item) {
    const id = String(item?.id || "");
    const sku = String(item?.sku || "");
    return /^service-stock-[1-3]$/i.test(id) || /^(OIL-5W30|FLT-HY-01|SPK-NGK)$/i.test(sku);
  }

  function createServiceInventorySeed(centerId = servicePrimaryCenterId) {
    return normalizeServiceInventoryList(
      [
        {
          id: "service-stock-1",
          centerId,
          name: "Масло 5W-30",
          sku: "OIL-5W30",
          unit: "кан.",
          stockQty: 18,
          minQty: 6,
          price: 165,
          location: "Стеллаж A1"
        },
        {
          id: "service-stock-2",
          centerId,
          name: "Фильтр масляный Hyundai",
          sku: "FLT-HY-01",
          unit: "шт.",
          stockQty: 5,
          minQty: 4,
          price: 55,
          location: "Стеллаж B2"
        },
        {
          id: "service-stock-3",
          centerId,
          name: "Свечи NGK",
          sku: "SPK-NGK",
          unit: "шт.",
          stockQty: 12,
          minQty: 8,
          price: 80,
          location: "Стеллаж C1"
        }
      ],
      centerId
    );
  }

  function normalizeServiceFinanceEntry(value, fallbackCenterId = servicePrimaryCenterId) {
    const source = value && typeof value === "object" ? value : {};
    const type = source.type === "expense" ? "expense" : "income";

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("service-finance"),
      centerId:
        typeof source.centerId === "string" && source.centerId.trim()
          ? slugifyText(source.centerId, fallbackCenterId)
          : fallbackCenterId,
      type,
      title: typeof source.title === "string" ? source.title.trim() : "",
      amount: Math.max(0, Math.floor(Number(source.amount) || 0)),
      category: typeof source.category === "string" ? source.category.trim() : (type === "expense" ? "Расход" : "Ремонт"),
      date: parseISODate(source.date) ? source.date : toLocalISODate(),
      sourceOrderId: typeof source.sourceOrderId === "string" ? source.sourceOrderId.trim() : ""
    };
  }

  function normalizeServiceFinanceList(list, fallbackCenterId = servicePrimaryCenterId) {
    return (Array.isArray(list) ? list : [])
      .map((item) => normalizeServiceFinanceEntry(item, fallbackCenterId))
      .filter((item) => item.title && item.amount > 0);
  }

  function createServiceFinanceSeed(centerId = servicePrimaryCenterId) {
    return normalizeServiceFinanceList(
      [
        {
          id: "service-finance-1",
          centerId,
          type: "income",
          title: "Ремонт Kia Sportage",
          amount: 540,
          category: "Ремонт",
          date: "2026-03-29",
          sourceOrderId: "SRV-260329-009"
        },
        {
          id: "service-finance-2",
          centerId,
          type: "expense",
          title: "Покупка фильтров и расходников",
          amount: 280,
          category: "Склад",
          date: "2026-03-28"
        },
        {
          id: "service-finance-3",
          centerId,
          type: "expense",
          title: "Зарплата мастеру",
          amount: 350,
          category: "Персонал",
          date: "2026-03-27"
        }
      ],
      centerId
    );
  }

  function getServiceAppointmentStatusMeta(statusId) {
    return serviceAppointmentStatusOptions.find((status) => status.id === statusId) || serviceAppointmentStatusOptions[0];
  }

  function normalizeServiceAppointment(value, fallbackCenterId = servicePrimaryCenterId) {
    const source = value && typeof value === "object" ? value : {};
    const statusMeta = getServiceAppointmentStatusMeta(source.status);

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("service-slot"),
      centerId:
        typeof source.centerId === "string" && source.centerId.trim()
          ? slugifyText(source.centerId, fallbackCenterId)
          : fallbackCenterId,
      day: parseISODate(source.day) ? source.day : toLocalISODate(),
      startTime: typeof source.startTime === "string" ? source.startTime.trim() : "09:00",
      endTime: typeof source.endTime === "string" ? source.endTime.trim() : "10:00",
      boxLabel: typeof source.boxLabel === "string" ? source.boxLabel.trim() : "Бокс 1",
      status: statusMeta.id,
      statusLabel: statusMeta.label,
      statusColor: statusMeta.color,
      clientName: typeof source.clientName === "string" ? source.clientName.trim() : "",
      phone: typeof source.phone === "string" ? source.phone.trim() : "",
      carLabel: typeof source.carLabel === "string" ? source.carLabel.trim() : "",
      workLabel: typeof source.workLabel === "string" ? source.workLabel.trim() : ""
    };
  }

  function normalizeServiceAppointmentsList(list, fallbackCenterId = servicePrimaryCenterId) {
    return (Array.isArray(list) ? list : [])
      .map((item) => normalizeServiceAppointment(item, fallbackCenterId))
      .filter(Boolean);
  }

  function isDemoServiceAppointment(slot) {
    const id = String(slot?.id || "");
    const phone = String(slot?.phone || "").replace(/\D/g, "");
    const clientName = String(slot?.clientName || "");
    return (
      /^service-slot-[1-4]$/i.test(id) ||
      ["992929271259", "992934401022", "992901204411"].includes(phone) ||
      /Шохрух Махкамов|Рустам Турсунов|Мунира Саидова/i.test(clientName)
    );
  }

  function createServiceAppointmentsSeed(centerId = servicePrimaryCenterId) {
    return normalizeServiceAppointmentsList(
      [
        {
          id: "service-slot-1",
          centerId,
          day: toLocalISODate(),
          startTime: "09:30",
          endTime: "11:00",
          boxLabel: "Бокс 1",
          status: "booked",
          clientName: "Шохрух Махкамов",
          phone: "+992 92 927 12 59",
          carLabel: "Toyota Camry",
          workLabel: "Колодки и диагностика"
        },
        {
          id: "service-slot-2",
          centerId,
          day: toLocalISODate(),
          startTime: "10:00",
          endTime: "11:00",
          boxLabel: "Бокс 2",
          status: "busy",
          clientName: "Рустам Турсунов",
          phone: "+992 93 440 10 22",
          carLabel: "Hyundai Elantra",
          workLabel: "Замена масла"
        },
        {
          id: "service-slot-3",
          centerId,
          day: toLocalISODate(),
          startTime: "12:00",
          endTime: "13:00",
          boxLabel: "Бокс 3",
          status: "free",
          clientName: "",
          phone: "",
          carLabel: "",
          workLabel: ""
        },
        {
          id: "service-slot-4",
          centerId,
          day: toLocalISODate(),
          startTime: "14:30",
          endTime: "16:00",
          boxLabel: "Бокс 1",
          status: "booked",
          clientName: "Мунира Саидова",
          phone: "+992 90 120 44 11",
          carLabel: "Kia Sportage",
          workLabel: "Выдача и финальная проверка"
        }
      ],
      centerId
    );
  }

  function normalizeServiceRequestStatusId(statusId) {
    const safeStatus = String(statusId || "").trim().toLowerCase();
    if (safeStatus === "ready" || safeStatus === "done" || safeStatus === "completed") return "ready";
    if (safeStatus === "progress" || safeStatus === "in-progress" || safeStatus === "working") return "progress";
    if (safeStatus === "declined" || safeStatus === "rejected" || safeStatus === "cancelled") return "declined";
    if (safeStatus === "accepted" || safeStatus === "confirmed" || safeStatus === "sent" || safeStatus === "queued") {
      return "accepted";
    }
    // «new» и всё неизвестное — заявка ещё не подтверждена сервисом.
    return "new";
  }

  function getServiceRequestStatusMeta(statusId) {
    const normalizedStatusId = normalizeServiceRequestStatusId(statusId);
    if (normalizedStatusId === "declined") {
      return (window.DX && window.DX.serviceRequestDeclinedMeta) ||
        { id: "declined", label: "Отклонена", color: "var(--drivex-danger)" };
    }
    return (
      serviceRequestStatusOptions.find((status) => status.id === normalizedStatusId) ||
      serviceRequestStatusOptions[0]
    );
  }

  function mapRepairStatusToServiceRequestStatus(statusId) {
    const safeStatus = String(statusId || "").trim().toLowerCase();
    if (safeStatus === "ready") return "ready";
    if (safeStatus === "progress") return "progress";
    return "accepted";
  }

  function normalizeServiceRequest(value) {
    const source = value && typeof value === "object" ? value : {};
    const statusMeta = getServiceRequestStatusMeta(source.status);

    return {
      id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : genId("service-request"),
      serviceId: typeof source.serviceId === "string" ? source.serviceId.trim() : String(source.serviceId || "").trim(),
      serviceName: typeof source.serviceName === "string" ? source.serviceName.trim() : "",
      city: typeof source.city === "string" ? source.city.trim() : "",
      address: typeof source.address === "string" ? source.address.trim() : "",
      phone: typeof source.phone === "string" ? source.phone.trim() : "",
      day: parseISODate(source.day) ? source.day : toLocalISODate(),
      time: typeof source.time === "string" ? source.time.trim() : "10:00",
      clientName: typeof source.clientName === "string" ? source.clientName.trim() : "",
      clientPhone: typeof source.clientPhone === "string" ? source.clientPhone.trim() : "",
      carId: typeof source.carId === "string" ? source.carId.trim() : "",
      carLabel: typeof source.carLabel === "string" ? source.carLabel.trim() : "",
      workLabel: typeof source.workLabel === "string" ? source.workLabel.trim() : "",
      note: typeof source.note === "string" ? source.note.trim() : "",
      declineReason: typeof source.declineReason === "string" ? source.declineReason.trim() : "",
      sourceOrderId: typeof source.sourceOrderId === "string" ? source.sourceOrderId.trim() : "",
      completedWork: typeof source.completedWork === "string" ? source.completedWork.trim() : "",
      completedAt: typeof source.completedAt === "string" ? source.completedAt.trim() : "",
      total: Math.max(0, Math.floor(Number(source.total) || 0)),
      status: statusMeta.id,
      statusLabel: statusMeta.label,
      statusColor: statusMeta.color,
      statusUpdatedAt:
        typeof source.statusUpdatedAt === "string" && source.statusUpdatedAt.trim()
          ? source.statusUpdatedAt.trim()
          : typeof source.createdAt === "string" && source.createdAt.trim()
            ? source.createdAt.trim()
            : new Date().toISOString(),
      createdAt:
        typeof source.createdAt === "string" && source.createdAt.trim() ? source.createdAt.trim() : new Date().toISOString()
    };
  }

  function normalizeServiceRequestsList(list) {
    return (Array.isArray(list) ? list : [])
      .map((item) => normalizeServiceRequest(item))
      .filter((item) => item.serviceId && item.serviceName && item.clientName);
  }

  function parseClockMinutes(value) {
    const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  function formatClockMinutes(totalMinutes) {
    const safeValue = Math.max(0, Math.floor(Number(totalMinutes) || 0));
    const hours = Math.floor(safeValue / 60) % 24;
    const minutes = safeValue % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function addMinutesToClock(value, minutesToAdd = 60) {
    const base = parseClockMinutes(value);
    if (base === null) return value;
    return formatClockMinutes(base + Math.max(0, Math.floor(Number(minutesToAdd) || 0)));
  }

  function getFutureLocalISODate(offsetDays = 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + Math.max(0, Math.floor(Number(offsetDays) || 0)));
    return toLocalISODate(date);
  }

  function getServiceBoxesCount(target) {
    const value = Number(target?.boxesCount);
    return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : 1;
  }

  function parseServiceWorkingHoursRange(value) {
    const match = String(value || "").match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/);
    if (!match) return { startTime: "09:00", endTime: "18:00" };
    return {
      startTime: match[1],
      endTime: match[2]
    };
  }

  function buildServiceBookingSlotOptions({ service, center, appointments, day }) {
    const target = center && typeof center === "object" ? center : service;
    const { startTime, endTime } = parseServiceWorkingHoursRange(target?.workingHours);
    const startMinutes = parseClockMinutes(startTime);
    const endMinutes = parseClockMinutes(endTime);
    const boxCount = getServiceBoxesCount(target);
    const slots = [];

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return [{ value: "10:00", label: "10:00", available: true }];
    }

    for (let current = startMinutes; current <= endMinutes - 60; current += 60) {
      const slotValue = formatClockMinutes(current);
      const bookedCount = normalizeServiceAppointmentsList(appointments, target?.id)
        .filter((item) => !isDemoServiceAppointment(item) && item.day === day && item.startTime === slotValue && item.status !== "free")
        .length;
      const freeBoxes = Math.max(0, boxCount - bookedCount);
      slots.push({
        value: slotValue,
        label: freeBoxes > 0 ? `${slotValue} • свободно ${freeBoxes}` : `${slotValue} • всё занято`,
        available: freeBoxes > 0
      });
    }

    return slots.length ? slots : [{ value: startTime, label: startTime, available: true }];
  }

  function buildServiceScheduleSlots(center, appointments, day) {
    const safeCenter = normalizeServiceCenter(center);
    const { startTime, endTime } = parseServiceWorkingHoursRange(safeCenter.workingHours);
    const startMinutes = parseClockMinutes(startTime);
    const endMinutes = parseClockMinutes(endTime);
    const boxCount = getServiceBoxesCount(safeCenter);
    const slots = [];
    const appointmentPool = normalizeServiceAppointmentsList(appointments, safeCenter.id)
      .filter((item) => !isDemoServiceAppointment(item) && item.day === day);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return slots;

    for (let current = startMinutes; current <= endMinutes - 60; current += 60) {
      const slotStart = formatClockMinutes(current);
      const booked = appointmentPool.filter((item) => item.startTime === slotStart && item.status !== "free");
      const freeBoxes = Math.max(0, boxCount - booked.length);
      slots.push({
        id: `${day}-${slotStart}`,
        day,
        startTime: slotStart,
        endTime: addMinutesToClock(slotStart, 60),
        booked,
        freeBoxes,
        boxCount,
        available: freeBoxes > 0
      });
    }

    return slots;
  }

  function pickServiceBookingBox(center, appointments, day, startTime) {
    const safeCenter = normalizeServiceCenter(center);
    const boxCount = getServiceBoxesCount(safeCenter);
    const occupied = new Set(
      normalizeServiceAppointmentsList(appointments, safeCenter.id)
        .filter((item) => !isDemoServiceAppointment(item) && item.day === day && item.startTime === startTime && item.status !== "free")
        .map((item) => String(item.boxLabel || "").trim())
        .filter(Boolean)
    );

    for (let index = 1; index <= boxCount; index += 1) {
      const label = `Бокс ${index}`;
      if (!occupied.has(label)) return label;
    }

    return "Бокс 1";
  }

  function createServiceVehicleSnapshot(car) {
    const safeCar = car && typeof car === "object" ? car : null;
    if (!safeCar) return null;

    const nameParts = String(safeCar.name || "").trim().split(/\s+/).filter(Boolean);
    return {
      id: String(safeCar.id || genId("service-vehicle")),
      brand: nameParts[0] || String(safeCar.name || "").trim(),
      model: nameParts.slice(1).join(" "),
      year: String(safeCar.year || "").trim(),
      plate: String(safeCar.plate || "").trim(),
      mileage: String(safeCar.mileage || "").trim()
    };
  }

  function upsertServiceClientFromBooking(clients, centerId, request, car) {
    const safeClients = normalizeServiceClientsList(clients, centerId);
    const phoneDigits = String(request?.clientPhone || "").replace(/\D/g, "");
    const existingClient =
      safeClients.find((item) => String(item.phone || "").replace(/\D/g, "") === phoneDigits) ||
      safeClients.find((item) => item.name === request?.clientName) ||
      null;
    const nextVehicle = createServiceVehicleSnapshot(car);

    if (existingClient) {
      const nextVehicles = Array.isArray(existingClient.vehicles) ? [...existingClient.vehicles] : [];
      if (nextVehicle && !nextVehicles.some((item) => item.id === nextVehicle.id || item.plate === nextVehicle.plate)) {
        nextVehicles.unshift(nextVehicle);
      }

      const updatedClient = normalizeServiceClient(
        {
          ...existingClient,
          centerId,
          name: request?.clientName || existingClient.name,
          phone: request?.clientPhone || existingClient.phone,
          note: request?.note || existingClient.note,
          lastVisit: request?.day || existingClient.lastVisit,
          vehicles: nextVehicles
        },
        centerId
      );

      return {
        clientId: updatedClient.id,
        clients: safeClients.map((item) => (item.id === updatedClient.id ? updatedClient : item))
      };
    }

    const newClient = normalizeServiceClient(
      {
        id: genId("service-client"),
        centerId,
        name: request?.clientName || "Клиент DRIVEX",
        phone: request?.clientPhone || "",
        loyalty: "Новый клиент",
        note: request?.note || "Онлайн запись из DRIVEX.",
        lastVisit: request?.day || toLocalISODate(),
        vehicles: nextVehicle ? [nextVehicle] : []
      },
      centerId
    );

    return {
      clientId: newClient.id,
      clients: [newClient, ...safeClients]
    };
  }

  function createServiceOrderCode(date = new Date()) {
    const stamp = toLocalISODate(date).replace(/-/g, "").slice(2);
    const tail = Math.random().toString().slice(2, 5).padEnd(3, "0");
    return `SRV-${stamp}-${tail}`;
  }

  function countServiceVehicles(clients) {
    return (Array.isArray(clients) ? clients : []).reduce(
      (sum, client) => sum + (Array.isArray(client.vehicles) ? client.vehicles.length : 0),
      0
    );
  }

  function buildServiceDashboardStats(center, clients, orders, finance, appointments) {
    const safeCenter = normalizeServiceCenter(center);
    const safeClients = normalizeServiceClientsList(clients, safeCenter.id).filter((item) => !isDemoServiceClient(item));
    const safeOrders = normalizeServiceRepairOrdersList(orders, safeCenter.id).filter((item) => !isDemoServiceOrder(item));
    const safeFinance = normalizeServiceFinanceList(finance, safeCenter.id).filter((item) => !isDemoServiceFinanceEntry(item));
    const safeAppointments = normalizeServiceAppointmentsList(appointments, safeCenter.id)
      .filter((item) => !isDemoServiceAppointment(item));
    const currentMonthPrefix = toLocalISODate().slice(0, 7);
    const busyBoxes = new Set(
      safeOrders.filter((order) => order.status === "progress").map((order) => order.boxLabel || order.id)
    ).size;
    const activeRepairs = safeOrders.filter((order) => order.status === "queued" || order.status === "progress").length;
    const monthRevenue = safeFinance
      .filter((entry) => entry.type === "income" && entry.date.startsWith(currentMonthPrefix))
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      clients: safeClients.length,
      vehicles: countServiceVehicles(safeClients),
      activeRepairs,
      readyRepairs: safeOrders.filter((order) => order.status === "ready").length,
      busyBoxes,
      freeBoxes: Math.max(0, safeCenter.boxesCount - busyBoxes),
      todayBookings: safeAppointments.filter((slot) => slot.day === toLocalISODate() && slot.status !== "free").length,
      monthRevenue
    };
  }

  function buildServiceFinanceSummary(orders, finance) {
    const safeOrders = normalizeServiceRepairOrdersList(orders).filter((item) => !isDemoServiceOrder(item));
    const safeFinance = normalizeServiceFinanceList(finance).filter((item) => !isDemoServiceFinanceEntry(item));
    const income = safeFinance.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expenses = safeFinance.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const readyOrders = safeOrders.filter((order) => order.status === "ready").length;

    return {
      income,
      expenses,
      profit: income - expenses,
      averageTicket: readyOrders ? Math.round(income / readyOrders) : 0
    };
  }

  function dedupeServicesById(list) {
    const unique = new Map();

    (Array.isArray(list) ? list : []).forEach((item) => {
      if (!item || typeof item !== "object") return;
      const id = String(item.id || "").trim();
      if (!id || unique.has(id)) return;
      unique.set(id, item);
    });

    return Array.from(unique.values());
  }

  function clampServiceMetric(value, fallback = 80) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return fallback;
    // 0 — честное «нет данных», не поднимаем до минимума 45
    if (numericValue <= 0) return 0;
    return Math.max(1, Math.min(99, Math.round(numericValue)));
  }

  function normalizeServiceBrands(list) {
    return (Array.isArray(list) ? list : [])
      .map((item) => String(item || "").trim().toUpperCase())
      .filter(Boolean);
  }

  function estimateServiceDurationMinutes(value) {
    const safeValue = String(value || "").trim().toLowerCase();
    if (!safeValue) return null;

    const hourMatch = safeValue.match(/(\d+(?:[.,]\d+)?)\s*час/);
    if (hourMatch) {
      return Math.max(15, Math.round(Number(hourMatch[1].replace(",", ".")) * 60));
    }

    const minuteMatch = safeValue.match(/(\d+)\s*мин/);
    if (minuteMatch) {
      return Math.max(15, Math.round(Number(minuteMatch[1])));
    }

    return null;
  }

  function formatServiceAverageTime(minutes) {
    const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
    if (!safeMinutes) return "1.5 ч";
    if (safeMinutes < 60) return `${safeMinutes} мин`;
    const hours = Math.round((safeMinutes / 60) * 10) / 10;
    return `${String(hours).replace(".0", "")} ч`;
  }

  function getServicePrimaryBadges(service) {
    const badges = [];
    const priceScore = clampServiceMetric(service?.honestPriceScore, 80);
    const speedScore = clampServiceMetric(service?.speedScore, 80);
    const premiumScore = clampServiceMetric(service?.premiumScore, 78);

    if (priceScore >= 88) {
      badges.push({
        id: "honest-price",
        label: "ТОП по честным ценам",
        color: "var(--drivex-warning)"
      });
    }
    if (speedScore >= 88) {
      badges.push({
        id: "fast-service",
        label: "Быстрый сервис",
        color: "var(--drivex-neon-cyan)"
      });
    }
    if (premiumScore >= 88) {
      badges.push({
        id: "premium",
        label: "Премиум",
        color: "var(--drivex-success)"
      });
    }

    return badges.slice(0, 3);
  }

  function decorateServiceRecord(service, context = {}) {
    const safeService = service && typeof service === "object" ? service : {};
    const profile = serviceShowcaseProfiles[String(safeService.id || "")] || {};
    const merged = {
      ...profile,
      ...safeService
    };
    const honestPriceScore = clampServiceMetric(merged.honestPriceScore, 82);
    const speedScore = clampServiceMetric(merged.speedScore, 80);
    const reviewScore = clampServiceMetric(merged.reviewScore, 84);
    const repeatClientsPercent = clampServiceMetric(merged.repeatClientsPercent, 58);
    const premiumScore = clampServiceMetric(merged.premiumScore, 80);
    const smartRawScore =
      speedScore * 0.32 +
      honestPriceScore * 0.24 +
      reviewScore * 0.24 +
      repeatClientsPercent * 0.2;
    const smartRating = Math.round((3.4 + smartRawScore / 100 * 1.6) * 10) / 10;
    const gallery = (Array.isArray(merged.gallery) ? merged.gallery : []).filter(Boolean);
    const primaryImage = merged.image || gallery[0] || "";
    // Без дублей: у CRM-центров обложка часто повторяется в галерее —
    // «Фото сервиса» показывало один и тот же кадр дважды.
    const finalGallery = [...new Set([primaryImage, ...gallery].filter(Boolean))].slice(0, 4);
    const categoryMeta = getServiceCategoryMeta(
      merged.categoryId || merged.serviceType || merged.category || merged.type || "repair"
    );
    const masters = Array.isArray(merged.masters) ? merged.masters.filter(Boolean) : [];
    const suitableBrands = normalizeServiceBrands(merged.suitableBrands);
    const completedCars = Math.max(0, Math.round(Number(merged.completedCars) || 0));
    const averageRepairTime =
      typeof merged.averageRepairTime === "string" && merged.averageRepairTime.trim()
        ? merged.averageRepairTime.trim()
        : formatServiceAverageTime(context.averageRepairMinutes);

    return {
      ...merged,
      categoryId: categoryMeta.id,
      category: merged.category || merged.type || categoryMeta.name,
      type: merged.type || merged.category || categoryMeta.name,
      categoryLabel: categoryMeta.name,
      categoryIcon: categoryMeta.icon,
      categoryColor: categoryMeta.color,
      image: primaryImage,
      gallery: finalGallery,
      masters,
      suitableBrands,
      honestPriceScore,
      speedScore,
      reviewScore,
      repeatClientsPercent,
      premiumScore,
      smartRating,
      smartRatingLabel: `Смарт-рейтинг ${smartRating}`,
      primaryBadges: getServicePrimaryBadges({
        honestPriceScore,
        speedScore,
        premiumScore
      }),
      completedCars,
      averageRepairTime,
      tagline:
        merged.tagline ||
        merged.description ||
        `${merged.name || "Сервис"} • ${merged.category || merged.type || "Сервис DRIVEX"}`,
      description:
        merged.description ||
        `${merged.name || "Сервис"} помогает держать ремонт прозрачно: понятные этапы, фото и удобная запись.`,
      videoPoster: merged.videoPoster || primaryImage,
      videoUrl: merged.videoUrl || "",
      available: merged.available !== false
    };
  }

  function getPersonalizedServices(services, activeCarId) {
    const safeServices = (Array.isArray(services) ? services : []).map((item) => decorateServiceRecord(item));
    const activeCar = findGarageCar(activeCarId);
    const brand = String(activeCar?.name || "").trim().split(/\s+/)[0].toUpperCase();
    if (!brand) return safeServices.slice(0, 3);

    const matchingServices = safeServices
      .filter((service) => normalizeServiceBrands(service.suitableBrands).includes(brand))
      .sort((left, right) => Number(right.smartRating || 0) - Number(left.smartRating || 0));

    return matchingServices.length ? matchingServices : safeServices.slice(0, 3);
  }

  function getServiceImageRenderKey(service) {
    const safeService = service && typeof service === "object" ? service : {};
    const image = String(safeService.image || "").trim();
    return `${String(safeService.id || "service")}:${image.length}:${image.slice(-24)}`;
  }

  function buildBuyerServiceNotifications(requests) {
    return normalizeServiceRequestsList(requests)
      .slice()
      .sort((left, right) =>
        String(right.statusUpdatedAt || right.createdAt || "").localeCompare(String(left.statusUpdatedAt || left.createdAt || ""))
      )
      .slice(0, 6)
      .map((request) => {
        const meta = getServiceRequestStatusMeta(request.status);
        const carLine = request.carLabel ? ` • ${request.carLabel}` : "";
        const baseTime = request.statusUpdatedAt || request.createdAt;

        if (request.status === "ready") {
          return {
            id: `service-request-${request.id}`,
            title: "Ваш автомобиль готов",
            body: `${request.serviceName}${carLine}. Можно забирать машину или связаться с сервисом.`,
            time: formatChatTime(baseTime),
            color: meta.color,
            icon: "check"
          };
        }

        if (request.status === "progress") {
          return {
            id: `service-request-${request.id}`,
            title: "Ремонт уже в работе",
            body: `${request.serviceName} взял в работу: ${request.workLabel || "обслуживание по записи"}.`,
            time: formatChatTime(baseTime),
            color: meta.color,
            icon: "wrench"
          };
        }

        return {
          id: `service-request-${request.id}`,
          title: "Запись принята сервисом",
          body: `${request.serviceName} ждёт вас ${formatRuDate(request.day)} в ${request.time}.`,
          time: formatChatTime(baseTime),
          color: meta.color,
          icon: "calendar"
        };
      });
  }

  function createCatalogServiceFromCenter(center, context = {}) {
    const safeCenter = normalizeServiceCenter(center);
    if (!safeCenter.registrationCompleted || !safeCenter.name || !safeCenter.serviceType) return null;
    const defaultImage =
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
    const uploadedGallery = normalizeServiceGalleryList(safeCenter.gallery);
    const primaryImage = safeCenter.coverImage || uploadedGallery[0] || safeCenter.logo || defaultImage;
    const realGallery = uploadedGallery.filter((photo) => photo !== primaryImage);
    const videoUrl = normalizeServiceVideoUrl(safeCenter.videoUrl);

    const safeClients = normalizeServiceClientsList(context.clients, safeCenter.id).filter((item) => !isDemoServiceClient(item));
    const safeOrders = normalizeServiceRepairOrdersList(context.orders, safeCenter.id).filter((item) => !isDemoServiceOrder(item));
    const safeFinance = normalizeServiceFinanceList(context.finance, safeCenter.id).filter((item) => !isDemoServiceFinanceEntry(item));
    const safeAppointments = normalizeServiceAppointmentsList(context.appointments, safeCenter.id)
      .filter((item) => !isDemoServiceAppointment(item));
    const dashboardStats = buildServiceDashboardStats(
      safeCenter,
      safeClients,
      safeOrders,
      safeFinance,
      safeAppointments
    );
    const financeSummary = buildServiceFinanceSummary(safeOrders, safeFinance);
    const repeatedClients = safeClients.filter((client) => {
      const loyalty = String(client.loyalty || "").toLowerCase();
      return loyalty.includes("vip") || loyalty.includes("постоян");
    }).length;
    // 0, а не выдуманные «62%», пока клиентов реально нет
    const repeatClientsPercent = safeClients.length ? Math.round((repeatedClients / safeClients.length) * 100) : 0;
    const averageRepairMinutes =
      safeOrders
        .map((order) => estimateServiceDurationMinutes(order.estimate))
        .filter((value) => Number.isFinite(value))
        .reduce((sum, value, _index, array) => sum + value / array.length, 0) || 95;
    const honestPriceScore = financeSummary.averageTicket <= 350 ? 95 : financeSummary.averageTicket <= 520 ? 88 : 76;
    const speedScore = 96 - Math.min(24, dashboardStats.activeRepairs * 5) + Math.min(12, dashboardStats.readyRepairs * 3);
    const reviewScore = 78 + Math.min(18, safeClients.length * 4 + dashboardStats.readyRepairs * 2);
    const premiumScore = 72 + Math.min(22, safeCenter.boxesCount * 3 + dashboardStats.monthRevenue / 240);
    const serviceId = `service-${slugifyText(safeCenter.id || safeCenter.name, "service-center")}`;
    const locationText = [safeCenter.city, safeCenter.locationLabel || safeCenter.address].filter(Boolean).join(" • ");
    const categoryMeta = getServiceCategoryMeta(safeCenter.serviceType);

    return decorateServiceRecord({
      id: serviceId,
      name: safeCenter.name,
      categoryId: categoryMeta.id,
      category: safeCenter.serviceType,
      type: safeCenter.serviceType,
      city: safeCenter.city,
      address: safeCenter.address,
      locationLabel: safeCenter.locationLabel,
      phone: safeCenter.phone,
      workingHours: safeCenter.workingHours,
      boxesCount: safeCenter.boxesCount,
      geolocation: safeCenter.geolocation,
      // Честные цифры: отзывов на сервисы пока нет — не выдумываем «5.0» и
      // «18 отзывов». UI показывает «Новый сервис», пока нет реальных данных.
      rating: 0,
      reviews: 0,
      distance: locationText || "Новый сервис",
      price: financeSummary.averageTicket ? `Средний чек ${formatTjsPrice(financeSummary.averageTicket)}` : "Новый сервис DRIVEX",
      image: primaryImage,
      available: safeCenter.status !== "closed",
      description:
        safeCenter.description || `${safeCenter.name} • ${safeCenter.serviceType} • ${safeCenter.city || "Таджикистан"}`,
      honestPriceScore,
      speedScore,
      reviewScore,
      repeatClientsPercent,
      premiumScore,
      completedCars: dashboardStats.readyRepairs,
      averageRepairTime: formatServiceAverageTime(averageRepairMinutes),
      suitableBrands: ["BMW", "Toyota", "Kia", "Hyundai", "Chevrolet", "Lexus"],
      gallery: realGallery,
      videoPoster: videoUrl ? primaryImage : "",
      videoUrl,
      // Реальные мастера и прайс — из CRM (Настройки). Раньше здесь всегда
      // подставлялся один выдуманный «Главный мастер / CRM owner»; пустой
      // список — это честно, пока владелец сам не заполнил команду.
      masters: safeCenter.masters,
      priceList: safeCenter.priceList,
      isRegisteredCenter: true
    }, { averageRepairMinutes });
  }

  function mergeServiceCenterList(currentCenters, nextCenter) {
    const source = Array.isArray(currentCenters) ? currentCenters : [];
    const safeCenter = normalizeServiceCenter(nextCenter, nextCenter?.id || servicePrimaryCenterId);
    if (!safeCenter.registrationCompleted || !safeCenter.name || !safeCenter.serviceType) return source;
    const withoutDuplicate = source.filter((item) => String(item.id) !== String(safeCenter.id));
    return [safeCenter, ...withoutDuplicate].slice(0, 300);
  }

  async function fetchSharedServiceCenters() {
    const response = await fetch("/api/service-centers", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Service centers load failed");
    const payload = await response.json();
    const centers = Array.isArray(payload?.centers) ? payload.centers : [];
    return centers
      .map((center) => normalizeServiceCenter(center, center?.id || servicePrimaryCenterId))
      .filter((center) => center.registrationCompleted && center.name && center.serviceType);
  }

  async function saveSharedServiceCenter(center) {
    const safeCenter = normalizeServiceCenter(center, center?.id || servicePrimaryCenterId);

    // Supabase access token владельца: сервер проверяет его и привязывает центр
    // к uid — чужой центр перезаписать нельзя.
    let accessToken = "";
    try {
      const client = getSupabaseClient();
      if (client) {
        const { data } = await client.auth.getSession();
        accessToken = data?.session?.access_token || "";
      }
    } catch {
      accessToken = "";
    }

    const response = await fetch("/api/service-centers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify(safeCenter)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || "Service center save failed");
    }
    return normalizeServiceCenter(payload.center || safeCenter, safeCenter.id);
  }

  function buildServiceDirectoryData(center, context = {}) {
    const catalogService = createCatalogServiceFromCenter(center, context);
    const sharedCatalogServices = (Array.isArray(context.sharedCenters) ? context.sharedCenters : [])
      .map((item) => createCatalogServiceFromCenter(item, context))
      .filter(Boolean);
    const catalogServices = dedupeServicesById([
      catalogService,
      ...sharedCatalogServices
    ].filter(Boolean));
    const effectiveRecommended = _liveRecommendedServices || recommendedServices;
    const featuredServices = catalogService
      ? dedupeServicesById([...catalogServices, ...effectiveRecommended]).map((item) => decorateServiceRecord(item))
      : sharedCatalogServices.length
        ? dedupeServicesById([...sharedCatalogServices, ...effectiveRecommended]).map((item) => decorateServiceRecord(item))
        : effectiveRecommended.map((item) => decorateServiceRecord(item));
    const nearbyCatalogCards = catalogServices.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type || item.category,
      rating: item.rating,
      distance: item.distance,
      city: item.city,
      address: item.address,
      categoryId: item.categoryId,
      available: item.available,
      phone: item.phone,
      workingHours: item.workingHours,
      description: item.description,
      image: item.image
    }));
    const effectiveNearby = _liveNearbyServices || nearbyServices;
    const nearbyRuntimeServices = nearbyCatalogCards.length
      ? dedupeServicesById([...nearbyCatalogCards, ...effectiveNearby]).map((item) => decorateServiceRecord(item))
      : effectiveNearby.map((item) => decorateServiceRecord(item));
    const runtimeMapCatalogPoints = catalogServices.map((item) => ({
      id: item.id,
      type: "service",
      name: item.name,
      distance: item.distance,
      rating: item.rating,
      city: item.city,
      address: item.address,
      category: item.category,
      categoryId: item.categoryId,
      phone: item.phone,
      workingHours: item.workingHours
    }));
    const runtimeMapPoints = runtimeMapCatalogPoints.length
      ? dedupeServicesById([...runtimeMapCatalogPoints, ...mapPoints])
      : [...mapPoints];

    return {
      featuredServices,
      nearbyServices: nearbyRuntimeServices,
      mapPoints: runtimeMapPoints,
      services: dedupeServicesById([...featuredServices, ...nearbyRuntimeServices])
    };
  }

  function navigateToHash(path) {
    const nextPath = String(path || "/");
    if (typeof window === "undefined") return;
    window.location.hash = nextPath.startsWith("#") ? nextPath : `#${nextPath}`;
  }

  function decodeRouteSegment(segment = "") {
    try {
      return decodeURIComponent(String(segment || "").trim());
    } catch {
      return String(segment || "").trim();
    }
  }

  function getBuyerOrderChatPath(orderId = "") {
    const safeOrderId = String(orderId || "").trim();
    return safeOrderId ? `/orders/${encodeURIComponent(safeOrderId)}/chat` : "/orders";
  }

  function getServiceBookingPath(serviceId = "") {
    const safeServiceId = String(serviceId || "").trim();
    return safeServiceId ? `/service/${encodeURIComponent(safeServiceId)}/book` : "/services";
  }

  function getSellerOrderChatPath(orderId = "") {
    const safeOrderId = String(orderId || "").trim();
    return safeOrderId ? `/seller/orders/${encodeURIComponent(safeOrderId)}/chat` : "/seller/orders";
  }

  function navigateToAppRoute(path, { forceReload = false } = {}) {
    const nextPath = String(path || "/");
    if (typeof window === "undefined") return;
    if (!forceReload) {
      navigateToHash(nextPath);
      return;
    }

    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.pathname = currentUrl.pathname.replace(/seller\.html$/i, "index.html");
    currentUrl.search = "?v=20260327-seller-crm-23";
      currentUrl.hash = nextPath.startsWith("#") ? nextPath : `#${nextPath}`;
      window.location.replace(currentUrl.toString());
    } catch {
      navigateToHash(nextPath);
    }
  }

  function readSellerPendingRoute() {
    if (typeof window === "undefined" || !window.localStorage) return "";

    try {
      return String(window.localStorage.getItem(drivexStorageKeys.sellerPendingRoute) || "").trim();
    } catch {
      return "";
    }
  }

  function writeSellerPendingRoute(path) {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      const nextPath = String(path || "").trim();
      if (!nextPath) {
        window.localStorage.removeItem(drivexStorageKeys.sellerPendingRoute);
        return;
      }
      window.localStorage.setItem(drivexStorageKeys.sellerPendingRoute, nextPath);
    } catch {
      // ignore
    }
  }

  function clearSellerPendingRoute() {
    writeSellerPendingRoute("");
  }

  function persistSellerFrontendSnapshot(snapshot) {
    if (typeof window === "undefined" || !window.localStorage || !snapshot || typeof snapshot !== "object") return;

    try {
      if (snapshot.session) {
        window.localStorage.setItem(
          drivexStorageKeys.sellerSession,
          JSON.stringify(normalizeSellerSession(snapshot.session))
        );
      }
      if (snapshot.profile) {
        window.localStorage.setItem(
          drivexStorageKeys.sellerProfile,
          JSON.stringify(normalizeSellerProfile(snapshot.profile, snapshot.session))
        );
      }
      if (snapshot.store) {
        window.localStorage.setItem(
          drivexStorageKeys.sellerStore,
          JSON.stringify(normalizeSellerStore(snapshot.store, snapshot.session?.sellerStoreId))
        );
      }
      if (Array.isArray(snapshot.products)) {
        window.localStorage.setItem(
          drivexStorageKeys.sellerProducts,
          JSON.stringify(snapshot.products)
        );
      }
      if (Array.isArray(snapshot.orders)) {
        window.localStorage.setItem(drivexStorageKeys.sellerOrders, JSON.stringify(snapshot.orders));
      }
      if (Array.isArray(snapshot.notifications)) {
        window.localStorage.setItem(
          drivexStorageKeys.sellerNotifications,
          JSON.stringify(snapshot.notifications)
        );
      }
    } catch {
      // ignore
    }
  }

  function genId(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function toLocalISODate(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseISODate(iso) {
    const normalized = String(iso || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
    const d = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  function formatRuDate(iso) {
    const d = parseISODate(iso);
    if (!d) return "";
    try {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(d);
    } catch {
      return String(iso || "");
    }
  }

  function formatChatTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    try {
      const now = new Date();
      const isSameDay =
        now.getFullYear() === date.getFullYear() &&
        now.getMonth() === date.getMonth() &&
        now.getDate() === date.getDate();

      return new Intl.DateTimeFormat(
        "ru-RU",
        isSameDay
          ? {
              hour: "2-digit",
              minute: "2-digit"
            }
          : {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            }
      ).format(date);
    } catch {
      return String(iso || "");
    }
  }

  function getOrderChatPeerLabel(viewerRole = "buyer") {
    return viewerRole === "seller" ? "Покупатель" : "Продавец";
  }

  function getOrderChatSenderLabel(message, viewerRole = "buyer") {
    const safeViewerRole = viewerRole === "seller" ? "seller" : "buyer";
    return message?.senderRole === safeViewerRole ? "Вы" : getOrderChatPeerLabel(safeViewerRole);
  }

  // Сообщение-фото хранит ссылку (Supabase storage) или data:image прямо в text.
  // В превью показываем «📷 Фото», а не сырую ссылку.
  function chatTextIsImage(text) {
    const t = String(text || "");
    if (t.startsWith("data:image/")) return true;
    if (/^https?:\/\//i.test(t) && (/\.(jpe?g|png|webp|gif|heic|bmp)(\?|#|$)/i.test(t) || /\/storage\/v1\/object\//i.test(t))) return true;
    return false;
  }

  function getOrderChatPreviewText(message, viewerRole = "buyer") {
    if (!message) {
      return viewerRole === "seller"
        ? "Чат пуст. Покупатель сможет написать по этому заказу."
        : "Чат пуст. Можно написать продавцу по этому заказу.";
    }

    const body = chatTextIsImage(message.text) ? "📷 Фото" : message.text;
    return `${getOrderChatSenderLabel(message, viewerRole)}: ${body}`;
  }

  // Единый короткий код заказа из длинного UUID бэкенда: "DX-7158E9".
  function formatOrderShortId(id) {
    const raw = String(id || "");
    if (/^DX-/i.test(raw)) return raw;
    const clean = raw.replace(/[^a-zA-Z0-9]/g, "");
    return clean ? "DX-" + clean.slice(0, 6).toUpperCase() : raw;
  }

  // ── Реферальная программа «Пригласи друга» ──────────────────────────────
  // Пригласивший получает REFERRAL_REWARD_TJS за каждого друга ПОСЛЕ его
  // первого заказа. Награда копится и тратится как скидка в корзине.
  const REFERRAL_REWARD_TJS = 1.5;

  function getBuyerReferralCode(buyerId) {
    const cleaned = String(buyerId || "guest").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
    return `DRIVEX-${cleaned || "2026"}`;
  }

  function normalizeReferralCode(value) {
    const raw = String(value || "").trim().toUpperCase();
    if (!raw) return "";
    return raw.startsWith("DRIVEX-") ? raw : `DRIVEX-${raw.replace(/[^A-Z0-9]/g, "")}`;
  }

  function normalizeReferralRecord(value) {
    if (!value || typeof value !== "object") return null;
    const referrerCode = normalizeReferralCode(value.referrerCode);
    const inviteeId = String(value.inviteeId || "").trim();
    if (!referrerCode || !inviteeId) return null;
    const status = value.status === "rewarded" ? "rewarded" : "registered";
    return {
      id: String(value.id || "").trim() || `ref-${inviteeId}`,
      referrerCode,
      inviteeId,
      inviteeName: String(value.inviteeName || "").trim().slice(0, 40),
      status,
      reward: Number(value.reward) || 0,
      createdAt: value.createdAt || new Date().toISOString(),
      rewardedAt: value.rewardedAt || null
    };
  }

  function normalizeReferralsList(list) {
    return (Array.isArray(list) ? list : []).map(normalizeReferralRecord).filter(Boolean);
  }

  // ── Поездки (GPS-трекер) ────────────────────────────────────────────────
  const TRIP_FUEL_L_PER_100 = 9;   // средний расход, л/100км (если у авто не задан)
  const TRIP_FUEL_PRICE_TJS = 11;  // цена бензина, сомони/л (ориентир по TJ)

  function tripHaversineKm(a, b) {
    if (!a || !b) return 0;
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function computeTripStats(points, startedAt, endedAt) {
    const pts = Array.isArray(points)
      ? points.filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng))
      : [];
    let distanceKm = 0, maxSpeed = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = tripHaversineKm(pts[i - 1], pts[i]);
      distanceKm += d;
      const dtH = (Number(pts[i].t) - Number(pts[i - 1].t)) / 3600000;
      if (dtH > 0) { const sp = d / dtH; if (sp < 300 && sp > maxSpeed) maxSpeed = sp; }
    }
    const startMs = Number(startedAt) || (pts[0] && Number(pts[0].t)) || 0;
    const endMs = Number(endedAt) || (pts.length && Number(pts[pts.length - 1].t)) || startMs;
    const durationMin = Math.max(0, Math.round((endMs - startMs) / 60000));
    const durationH = durationMin / 60;
    const round = (n) => Math.round(n * 10) / 10;
    return {
      distanceKm: round(distanceKm),
      durationMin,
      avgSpeed: durationH > 0 ? round(distanceKm / durationH) : 0,
      maxSpeed: round(maxSpeed)
    };
  }

  function estimateTripFuel(distanceKm, lPer100 = TRIP_FUEL_L_PER_100) {
    return Math.round((Number(distanceKm) || 0) * (Number(lPer100) || TRIP_FUEL_L_PER_100) / 100 * 100) / 100;
  }
  function estimateTripCost(liters, pricePerL = TRIP_FUEL_PRICE_TJS) {
    return Math.round((Number(liters) || 0) * (Number(pricePerL) || TRIP_FUEL_PRICE_TJS));
  }

  // Тип двигателя/топлива — расход и стоимость считаются по типу (ориентир по TJ)
  const DRIVEX_FUEL_TYPES = {
    petrol:   { key: "petrol",   label: "Бензин",        unit: "л",     per100: 9,  price: 11,  energyLabel: "топливо" },
    diesel:   { key: "diesel",   label: "Дизель",        unit: "л",     per100: 7,  price: 10,  energyLabel: "топливо" },
    gas:      { key: "gas",      label: "Газ",           unit: "м³",    per100: 11, price: 3.5, energyLabel: "газ" },
    electric: { key: "electric", label: "Электричество", unit: "кВт·ч", per100: 18, price: 1.2, energyLabel: "электричество" }
  };
  function getFuelType(key) {
    return DRIVEX_FUEL_TYPES[String(key || "petrol").toLowerCase()] || DRIVEX_FUEL_TYPES.petrol;
  }
  // Расход за поездку по типу двигателя и объёму мотора: { amount, unit, cost, label }
  // Базовый расход рассчитан на мотор ~2.0 л; больше мотор → выше расход (для топлива).
  function estimateTripConsumption(distanceKm, fuelKey, engineVolume) {
    const ft = getFuelType(fuelKey);
    let per100 = ft.per100;
    if (ft.key !== "electric") {
      const vol = Number(engineVolume) || 0;
      if (vol > 0) per100 = Math.round(ft.per100 * Math.max(0.6, Math.min(2.0, vol / 2.0)) * 10) / 10;
    }
    const amount = Math.round((Number(distanceKm) || 0) * per100 / 100 * 100) / 100;
    return { amount, unit: ft.unit, cost: Math.round(amount * ft.price), label: ft.energyLabel, fuelType: ft.key };
  }

  function normalizeTrip(value) {
    if (!value || typeof value !== "object") return null;
    const points = Array.isArray(value.points)
      ? value.points
          .map((p) => ({ lat: Number(p.lat), lng: Number(p.lng), t: Number(p.t) || 0 }))
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
          .slice(0, 3000)
      : [];
    const startedAt = Number(value.startedAt) || (points[0] && points[0].t) || 0;
    const endedAt = Number(value.endedAt) || (points.length && points[points.length - 1].t) || startedAt;
    const stats = computeTripStats(points, startedAt, endedAt);
    return {
      id: String(value.id || "").trim() || ("trip-" + startedAt),
      carId: String(value.carId || ""),
      title: String(value.title || "").trim(),
      startedAt,
      endedAt,
      points,
      distanceKm: Number.isFinite(Number(value.distanceKm)) && Number(value.distanceKm) > 0 ? Number(value.distanceKm) : stats.distanceKm,
      durationMin: Number.isFinite(Number(value.durationMin)) && Number(value.durationMin) > 0 ? Number(value.durationMin) : stats.durationMin,
      avgSpeed: Number(value.avgSpeed) || stats.avgSpeed,
      maxSpeed: Number(value.maxSpeed) || stats.maxSpeed
    };
  }
  function normalizeTripsList(list) {
    return (Array.isArray(list) ? list : [])
      .map(normalizeTrip)
      .filter(Boolean)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 100);
  }

  function summarizeTrips(trips, sinceMs = 0) {
    const list = normalizeTripsList(trips).filter((t) => t.startedAt >= (Number(sinceMs) || 0));
    const distanceKm = list.reduce((s, t) => s + (t.distanceKm || 0), 0);
    const durationMin = list.reduce((s, t) => s + (t.durationMin || 0), 0);
    const fuelL = estimateTripFuel(distanceKm);
    return {
      count: list.length,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMin,
      fuelL,
      costTjs: estimateTripCost(fuelL)
    };
  }

  // Сводка для пригласившего: сколько приглашено, начислено, доступно к трате
  function computeReferralStats(referrals, myCode, spent = 0) {
    const code = normalizeReferralCode(myCode);
    const mine = code ? normalizeReferralsList(referrals).filter((r) => r.referrerCode === code) : [];
    const rewarded = mine.filter((r) => r.status === "rewarded");
    const earned = rewarded.reduce((sum, r) => sum + (Number(r.reward) || REFERRAL_REWARD_TJS), 0);
    const spentNum = Math.max(0, Number(spent) || 0);
    return {
      code,
      invited: mine.length,
      rewardedCount: rewarded.length,
      earned,
      spent: spentNum,
      available: Math.max(0, Math.round((earned - spentNum) * 100) / 100),
      list: mine.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    };
  }

  function daysUntil(iso) {
    const target = parseISODate(iso);
    if (!target) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / 86400000);
  }

  function findGarageCar(carId) {
    return garageCars.find((car) => car.id === carId) || null;
  }

  function isImageDataUrl(value, maxLen = 1200000) {
    if (typeof value !== "string") return false;
    if (!value.startsWith("data:image/")) return false;
    return value.length <= maxLen;
  }

  function normalizeDocumentItem(value, fallbackName = "Фото") {
    if (!value || typeof value !== "object") return null;
    const rawImage = value.image || value.fileUrl || "";
    // Принимаем: data URL (base64) и HTTPS/HTTP URL (Supabase Storage)
    const isDataUrl = isImageDataUrl(rawImage, 1400000);
    const isHttpUrl = typeof rawImage === "string" && /^https?:\/\//i.test(rawImage);
    const image = (isDataUrl || isHttpUrl) ? rawImage : "";
    if (!image) return null;

    return {
      id: typeof value.id === "string" ? value.id : genId("doc"),
      name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : fallbackName,
      image,
      addedAt: Number.isFinite(Number(value.addedAt)) ? Number(value.addedAt) : Date.now()
    };
  }

  // ── Sided document helpers (передняя / задняя сторона) ──────────────

  // Нормализует документ с двумя сторонами.
  // Поддерживает обратную совместимость: если value.image → старый формат → front
  function normalizeSidedDoc(value, label) {
    if (!value || typeof value !== "object") return null;

    // Новый формат: { front, back }
    if ("front" in value || "back" in value) {
      const front = value.front ? normalizeDocumentItem(value.front, (label || "Документ") + " (лицевая)") : null;
      const back  = value.back  ? normalizeDocumentItem(value.back,  (label || "Документ") + " (обратная)") : null;
      return (front || back) ? { front: front || null, back: back || null } : null;
    }

    // Старый формат: один объект с image → конвертируем в front
    const front = normalizeDocumentItem(value, label || "Документ");
    return front ? { front, back: null } : null;
  }

  function getSidedDocPage(sidedDoc, side) {
    const normalized = normalizeSidedDoc(sidedDoc);
    if (!normalized) return null;
    return side === "back" ? normalized.back : normalized.front;
  }

  function getSidedDocCount(sidedDoc) {
    const normalized = normalizeSidedDoc(sidedDoc);
    if (!normalized) return 0;
    return (normalized.front ? 1 : 0) + (normalized.back ? 1 : 0);
  }

  function createEmptyDocumentsState(cars = garageCars) {
    const nextCars = {};
    for (const car of Array.isArray(cars) ? cars : []) {
      if (!car || typeof car !== "object" || !car.id) continue;
      nextCars[car.id] = {
        registration: null,
        inspection: null
      };
    }

    return {
      license: null,
      cars: nextCars
    };
  }

  function countDocumentsState(documents) {
    if (!documents || typeof documents !== "object") return 0;

    let total = getSidedDocCount(documents.license);
    const cars = documents.cars && typeof documents.cars === "object" ? documents.cars : {};
    for (const carId of Object.keys(cars)) {
      const carDocs = cars[carId] || {};
      total += getSidedDocCount(carDocs.registration);
      total += getSidedDocCount(carDocs.inspection);
    }
    return total;
  }

  function createEmptyMaintenanceState() {
    const cars = {};
    for (const car of garageCars) {
      cars[car.id] = {
        records: [],
        inspection: { doneAt: "", validUntil: "" }
      };
    }

    return { cars };
  }

  function normalizeMaintenanceRecord(value) {
    if (!value || typeof value !== "object") return null;

    const id = typeof value.id === "string" ? value.id : genId("svc");
    const type = typeof value.type === "string" ? value.type : "other";
    const title =
      typeof value.title === "string" && value.title.trim() ? value.title.trim() : "Обслуживание";
    const dateCandidate = typeof value.date === "string" ? value.date.slice(0, 10) : "";
    const date = parseISODate(dateCandidate) ? dateCandidate : "";
    const mileageNum = Number(value.mileage);
    const mileage = Number.isFinite(mileageNum) && mileageNum >= 0 ? Math.floor(mileageNum) : null;
    const costNum = Number(value.cost);
    const cost = Number.isFinite(costNum) && costNum >= 0 ? Math.floor(costNum) : 0;
    const service = typeof value.service === "string" ? value.service.trim() : "";
    const notes = typeof value.notes === "string" ? value.notes.trim() : "";
    const createdAt = Number.isFinite(Number(value.createdAt)) ? Number(value.createdAt) : Date.now();

    return { id, type, title, date, mileage, cost, service, notes, createdAt };
  }

  function normalizeInspection(value) {
    const source = value && typeof value === "object" ? value : {};
    const doneAtCandidate = typeof source.doneAt === "string" ? source.doneAt.slice(0, 10) : "";
    const validUntilCandidate =
      typeof source.validUntil === "string" ? source.validUntil.slice(0, 10) : "";

    return {
      doneAt: parseISODate(doneAtCandidate) ? doneAtCandidate : "",
      validUntil: parseISODate(validUntilCandidate) ? validUntilCandidate : ""
    };
  }

  function ensureCarId(carId) {
    return findGarageCar(carId)?.id || (garageCars[0] ? garageCars[0].id : "");
  }

  function getMaintenanceCarState(maintenance, carId) {
    const safeCarId = ensureCarId(carId);
    const cars = maintenance && typeof maintenance === "object" && maintenance.cars ? maintenance.cars : {};
    const carState = cars[safeCarId] && typeof cars[safeCarId] === "object" ? cars[safeCarId] : {};

    return {
      records: Array.isArray(carState.records) ? carState.records : [],
      inspection: normalizeInspection(carState.inspection)
    };
  }

  function countMaintenanceRecords(maintenance) {
    if (!maintenance || typeof maintenance !== "object" || !maintenance.cars) return 0;
    return Object.values(maintenance.cars).reduce((sum, carState) => {
      const records = carState && Array.isArray(carState.records) ? carState.records : [];
      return sum + records.length;
    }, 0);
  }

  function getMaintenanceSpentTotal(maintenance, carId) {
    if (!maintenance || typeof maintenance !== "object" || !maintenance.cars) return 0;

    if (carId) {
      const carState = getMaintenanceCarState(maintenance, carId);
      return carState.records.reduce((sum, record) => sum + (Number(record?.cost) || 0), 0);
    }

    return Object.keys(maintenance.cars).reduce((sum, currentCarId) => {
      return sum + getMaintenanceSpentTotal(maintenance, currentCarId);
    }, 0);
  }

  function buildSmartCareTasks(maintenance, activeCarId = "") {
    const tasks = [];
    const cars = activeCarId ? [findGarageCar(activeCarId)].filter(Boolean) : garageCars;

    for (const car of cars) {
      const carState = getMaintenanceCarState(maintenance, car.id);
      const inspectionDays = carState.inspection?.validUntil ? daysUntil(carState.inspection.validUntil) : null;
      if (typeof inspectionDays === "number") {
        if (inspectionDays < 0) {
          tasks.push({
            id: `${car.id}-inspection-overdue`,
            task: "Техосмотр просрочен",
            title: "Техосмотр просрочен",
            dueDate: car.name,
            subtitle: car.name,
            urgent: true,
            color: "var(--drivex-danger)"
          });
        } else if (inspectionDays <= 30) {
          tasks.push({
            id: `${car.id}-inspection`,
            task: "Скоро техосмотр",
            title: "Скоро техосмотр",
            dueDate: `${car.name} · ${inspectionDays || "сегодня"} дн`,
            subtitle: `${inspectionDays || "сегодня"} дн`,
            urgent: inspectionDays <= 7,
            color: inspectionDays <= 7 ? "var(--drivex-warning)" : "var(--drivex-neon-cyan)"
          });
        }
      }

      const mileage = Number(car.mileageValue || parseMileageLabel(car.mileage));
      const records = Array.isArray(carState.records) ? carState.records : [];
      const oilRecord = records.find((record) => record.type === "oil" || /масл/i.test(String(record.title || "")));
      if (mileage && oilRecord?.mileage) {
        const left = Number(oilRecord.mileage) + 10000 - mileage;
        if (left <= 1500) {
          tasks.push({
            id: `${car.id}-oil`,
            task: left <= 0 ? "Замена масла просрочена" : "Скоро замена масла",
            title: left <= 0 ? "Замена масла просрочена" : "Скоро замена масла",
            dueDate: `${car.name} · ${left <= 0 ? "сейчас" : `${left.toLocaleString("ru-RU")} км`}`,
            subtitle: left <= 0 ? "сейчас" : `${left.toLocaleString("ru-RU")} км`,
            urgent: left <= 0,
            color: left <= 0 ? "var(--drivex-danger)" : "var(--drivex-electric-blue)"
          });
        }
      }
    }

    return tasks.slice(0, 6);
  }

  function getHashPath() {
    const raw = (window.location.hash || "").replace(/^#/, "");
    const path = raw.split("?")[0].trim();
    if (!path) return "/";
    return path.startsWith("/") ? path : `/${path}`;
  }

  function normalizePath(path) {
    const trimmed = String(path || "/").split("?")[0].replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
  }

  function prepareAvatarDataUrl(file, { size = 256, quality = 0.86 } = {}) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      if (!String(file.type || "").startsWith("image/")) return resolve("");
      if (typeof file.size === "number" && file.size > 18 * 1024 * 1024) {
        return reject(new Error("File too large"));
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }

        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve("");

          // background for JPEG
          ctx.fillStyle = "#0a0a0f";
          ctx.fillRect(0, 0, size, size);

          const w = img.naturalWidth || img.width || size;
          const h = img.naturalHeight || img.height || size;
          const side = Math.max(1, Math.min(w, h));
          const sx = Math.floor((w - side) / 2);
          const sy = Math.floor((h - side) / 2);

          ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

          let dataUrl = "";
          try {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          } catch {
            try {
              dataUrl = canvas.toDataURL();
            } catch {
              dataUrl = "";
            }
          }

          resolve(String(dataUrl || ""));
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
        reject(new Error("Image load error"));
      };

      img.src = objectUrl;
    });
  }

  function prepareDocumentDataUrl(file, { maxSize = 1400, quality = 0.86 } = {}) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      if (!String(file.type || "").startsWith("image/")) return resolve("");
      if (typeof file.size === "number" && file.size > 24 * 1024 * 1024) {
        return reject(new Error("File too large"));
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }

        try {
          const w = img.naturalWidth || img.width || maxSize;
          const h = img.naturalHeight || img.height || maxSize;
          const longest = Math.max(1, Math.max(w, h));
          const scale = Math.min(1, maxSize / longest);
          const outW = Math.max(1, Math.floor(w * scale));
          const outH = Math.max(1, Math.floor(h * scale));

          const canvas = document.createElement("canvas");
          canvas.width = outW;
          canvas.height = outH;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve("");

          ctx.fillStyle = "#0a0a0f";
          ctx.fillRect(0, 0, outW, outH);
          ctx.drawImage(img, 0, 0, outW, outH);

          const serialize = (width, height, q) => {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext("2d");
            if (!tempCtx) return "";
            tempCtx.fillStyle = "#0a0a0f";
            tempCtx.fillRect(0, 0, width, height);
            tempCtx.drawImage(img, 0, 0, width, height);
            try {
              return String(tempCanvas.toDataURL("image/jpeg", q));
            } catch {
              try {
                return String(tempCanvas.toDataURL());
              } catch {
                return "";
              }
            }
          };

          const maxDataUrlLength = 1400000;
          let dataUrl = serialize(outW, outH, quality);

          if (dataUrl && dataUrl.length > maxDataUrlLength) {
            for (const nextQuality of [0.75, 0.6, 0.45, 0.3]) {
              const nextUrl = serialize(outW, outH, nextQuality);
              if (nextUrl && nextUrl.length <= maxDataUrlLength) {
                dataUrl = nextUrl;
                break;
              }
            }
          }

          if (dataUrl && dataUrl.length > maxDataUrlLength) {
            for (const nextMaxSize of [1200, 1000, 800, 600]) {
              const nextScale = Math.min(1, nextMaxSize / longest);
              const nextW = Math.max(1, Math.floor(w * nextScale));
              const nextH = Math.max(1, Math.floor(h * nextScale));
              const nextUrl = serialize(nextW, nextH, Math.min(quality, 0.86));
              if (nextUrl && nextUrl.length <= maxDataUrlLength) {
                dataUrl = nextUrl;
                break;
              }
            }
          }

          if (!dataUrl) {
            resolve("");
            return;
          }

          if (dataUrl.length > maxDataUrlLength) {
            reject(new Error("Image too large"));
            return;
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
        reject(new Error("Image load error"));
      };

      img.src = objectUrl;
    });
  }


  // ── Export to DX ──
  try { if (typeof addMinutesToClock !== 'undefined') window.DX['addMinutesToClock'] = addMinutesToClock; } catch(e) {}
  try { if (typeof appendOrderChatMessage !== 'undefined') window.DX['appendOrderChatMessage'] = appendOrderChatMessage; } catch(e) {}
  try { if (typeof applySellerOrderStatus !== 'undefined') window.DX['applySellerOrderStatus'] = applySellerOrderStatus; } catch(e) {}
  try { if (typeof buildBuyerServiceNotifications !== 'undefined') window.DX['buildBuyerServiceNotifications'] = buildBuyerServiceNotifications; } catch(e) {}
  try { if (typeof buildMarketplaceRuntimeData !== 'undefined') window.DX['buildMarketplaceRuntimeData'] = buildMarketplaceRuntimeData; } catch(e) {}
  try { if (typeof buildSellerDashboardStats !== 'undefined') window.DX['buildSellerDashboardStats'] = buildSellerDashboardStats; } catch(e) {}
  try { if (typeof buildSellerClientsFromOrders !== 'undefined') window.DX['buildSellerClientsFromOrders'] = buildSellerClientsFromOrders; } catch(e) {}
  try { if (typeof buildServiceBookingSlotOptions !== 'undefined') window.DX['buildServiceBookingSlotOptions'] = buildServiceBookingSlotOptions; } catch(e) {}
  try { if (typeof buildServiceDashboardStats !== 'undefined') window.DX['buildServiceDashboardStats'] = buildServiceDashboardStats; } catch(e) {}
  try { if (typeof buildServiceDirectoryData !== 'undefined') window.DX['buildServiceDirectoryData'] = buildServiceDirectoryData; } catch(e) {}
  try { if (typeof buildServiceFinanceSummary !== 'undefined') window.DX['buildServiceFinanceSummary'] = buildServiceFinanceSummary; } catch(e) {}
  try { if (typeof buildServiceScheduleSlots !== 'undefined') window.DX['buildServiceScheduleSlots'] = buildServiceScheduleSlots; } catch(e) {}
  try { if (typeof buildSmartCareTasks !== 'undefined') window.DX['buildSmartCareTasks'] = buildSmartCareTasks; } catch(e) {}
  try { if (typeof buyerPersonalStorageKeys !== 'undefined') window.DX['buyerPersonalStorageKeys'] = buyerPersonalStorageKeys; } catch(e) {}
  try { if (typeof buyerSessionToProfile !== 'undefined') window.DX['buyerSessionToProfile'] = buyerSessionToProfile; } catch(e) {}
  try { if (typeof canTransitionSellerOrder !== 'undefined') window.DX['canTransitionSellerOrder'] = canTransitionSellerOrder; } catch(e) {}
  try { if (typeof canUseIndexedDbStorage !== 'undefined') window.DX['canUseIndexedDbStorage'] = canUseIndexedDbStorage; } catch(e) {}
  try { if (typeof clampServiceMetric !== 'undefined') window.DX['clampServiceMetric'] = clampServiceMetric; } catch(e) {}
  try { if (typeof clearBuyerLocalStorageForSession !== 'undefined') window.DX['clearBuyerLocalStorageForSession'] = clearBuyerLocalStorageForSession; } catch(e) {}
  try { if (typeof clearSellerPendingRoute !== 'undefined') window.DX['clearSellerPendingRoute'] = clearSellerPendingRoute; } catch(e) {}
  try { if (typeof compactSellerProductForSync !== 'undefined') window.DX['compactSellerProductForSync'] = compactSellerProductForSync; } catch(e) {}
  try { if (typeof compactSellerProductsForSync !== 'undefined') window.DX['compactSellerProductsForSync'] = compactSellerProductsForSync; } catch(e) {}
  try { if (typeof countDocumentsState !== 'undefined') window.DX['countDocumentsState'] = countDocumentsState; } catch(e) {}
  try { if (typeof normalizeSidedDoc !== 'undefined') window.DX['normalizeSidedDoc'] = normalizeSidedDoc; } catch(e) {}
  try { if (typeof getSidedDocPage !== 'undefined') window.DX['getSidedDocPage'] = getSidedDocPage; } catch(e) {}
  try { if (typeof getSidedDocCount !== 'undefined') window.DX['getSidedDocCount'] = getSidedDocCount; } catch(e) {}
  try { if (typeof countMaintenanceRecords !== 'undefined') window.DX['countMaintenanceRecords'] = countMaintenanceRecords; } catch(e) {}
  try { if (typeof countServiceVehicles !== 'undefined') window.DX['countServiceVehicles'] = countServiceVehicles; } catch(e) {}
  try { if (typeof createBuyerOrdersFromCheckout !== 'undefined') window.DX['createBuyerOrdersFromCheckout'] = createBuyerOrdersFromCheckout; } catch(e) {}
  try { if (typeof createCatalogServiceFromCenter !== 'undefined') window.DX['createCatalogServiceFromCenter'] = createCatalogServiceFromCenter; } catch(e) {}
  try { if (typeof createDefaultBuyerProfile !== 'undefined') window.DX['createDefaultBuyerProfile'] = createDefaultBuyerProfile; } catch(e) {}
  try { if (typeof createDefaultEmergencyContact !== 'undefined') window.DX['createDefaultEmergencyContact'] = createDefaultEmergencyContact; } catch(e) {}
  try { if (typeof normalizeEmergencyContact !== 'undefined') window.DX['normalizeEmergencyContact'] = normalizeEmergencyContact; } catch(e) {}
  try { if (typeof createDefaultSellerSession !== 'undefined') window.DX['createDefaultSellerSession'] = createDefaultSellerSession; } catch(e) {}
  try { if (typeof createDefaultServiceAuthState !== 'undefined') window.DX['createDefaultServiceAuthState'] = createDefaultServiceAuthState; } catch(e) {}
  try { if (typeof createDefaultServiceSession !== 'undefined') window.DX['createDefaultServiceSession'] = createDefaultServiceSession; } catch(e) {}
  try { if (typeof createEmptyBuyerSession !== 'undefined') window.DX['createEmptyBuyerSession'] = createEmptyBuyerSession; } catch(e) {}
  try { if (typeof createEmptyDocumentsState !== 'undefined') window.DX['createEmptyDocumentsState'] = createEmptyDocumentsState; } catch(e) {}
  try { if (typeof createEmptyMaintenanceState !== 'undefined') window.DX['createEmptyMaintenanceState'] = createEmptyMaintenanceState; } catch(e) {}
  try { if (typeof createFreshSellerSession !== 'undefined') window.DX['createFreshSellerSession'] = createFreshSellerSession; } catch(e) {}
  try { if (typeof createFreshServiceSession !== 'undefined') window.DX['createFreshServiceSession'] = createFreshServiceSession; } catch(e) {}
  try { if (typeof createGeneratedMarketProductId !== 'undefined') window.DX['createGeneratedMarketProductId'] = createGeneratedMarketProductId; } catch(e) {}
  try { if (typeof createMarketCartKey !== 'undefined') window.DX['createMarketCartKey'] = createMarketCartKey; } catch(e) {}
  try { if (typeof marketFavoritesStore !== 'undefined') window.DX['marketFavoritesStore'] = marketFavoritesStore; } catch(e) {}
  try { if (typeof marketRatingsStore !== 'undefined') window.DX['marketRatingsStore'] = marketRatingsStore; } catch(e) {}
  try { if (typeof useMarketFavorites !== 'undefined') window.DX['useMarketFavorites'] = useMarketFavorites; } catch(e) {}
  try { if (typeof getMarketFavoriteKey !== 'undefined') window.DX['getMarketFavoriteKey'] = getMarketFavoriteKey; } catch(e) {}
  try { if (typeof getMarketFavoriteProducts !== 'undefined') window.DX['getMarketFavoriteProducts'] = getMarketFavoriteProducts; } catch(e) {}
  try { if (typeof useMarketRatings !== 'undefined') window.DX['useMarketRatings'] = useMarketRatings; } catch(e) {}
  try { if (typeof getMarketProductRating !== 'undefined') window.DX['getMarketProductRating'] = getMarketProductRating; } catch(e) {}
  try { if (typeof getMarketStoreRating !== 'undefined') window.DX['getMarketStoreRating'] = getMarketStoreRating; } catch(e) {}
  try { if (typeof normalizeProductCompatibility !== 'undefined') window.DX['normalizeProductCompatibility'] = normalizeProductCompatibility; } catch(e) {}
  try { if (typeof productMatchesCar !== 'undefined') window.DX['productMatchesCar'] = productMatchesCar; } catch(e) {}
  try { if (typeof getMarketProductQuestionThreadId !== 'undefined') window.DX['getMarketProductQuestionThreadId'] = getMarketProductQuestionThreadId; } catch(e) {}
  try { if (typeof createMarketplaceCheckoutDraft !== 'undefined') window.DX['createMarketplaceCheckoutDraft'] = createMarketplaceCheckoutDraft; } catch(e) {}
  try { if (typeof createPendingSellerStoreId !== 'undefined') window.DX['createPendingSellerStoreId'] = createPendingSellerStoreId; } catch(e) {}
  try { if (typeof createSellerNotifications !== 'undefined') window.DX['createSellerNotifications'] = createSellerNotifications; } catch(e) {}
  try { if (typeof createSellerOrdersFromCart !== 'undefined') window.DX['createSellerOrdersFromCart'] = createSellerOrdersFromCart; } catch(e) {}
  try { if (typeof createSellerOrdersSeed !== 'undefined') window.DX['createSellerOrdersSeed'] = createSellerOrdersSeed; } catch(e) {}
  try { if (typeof createSellerProductsSeed !== 'undefined') window.DX['createSellerProductsSeed'] = createSellerProductsSeed; } catch(e) {}
  try { if (typeof createSellerProfileSeed !== 'undefined') window.DX['createSellerProfileSeed'] = createSellerProfileSeed; } catch(e) {}
  try { if (typeof createSellerRegistrationDraft !== 'undefined') window.DX['createSellerRegistrationDraft'] = createSellerRegistrationDraft; } catch(e) {}
  try { if (typeof createSellerStoreSeed !== 'undefined') window.DX['createSellerStoreSeed'] = createSellerStoreSeed; } catch(e) {}
  try { if (typeof createServiceAppointmentsSeed !== 'undefined') window.DX['createServiceAppointmentsSeed'] = createServiceAppointmentsSeed; } catch(e) {}
  try { if (typeof createServiceCenterFormState !== 'undefined') window.DX['createServiceCenterFormState'] = createServiceCenterFormState; } catch(e) {}
  try { if (typeof createServiceCenterSeed !== 'undefined') window.DX['createServiceCenterSeed'] = createServiceCenterSeed; } catch(e) {}
  try { if (typeof createServiceClientsSeed !== 'undefined') window.DX['createServiceClientsSeed'] = createServiceClientsSeed; } catch(e) {}
  try { if (typeof createServiceFinanceSeed !== 'undefined') window.DX['createServiceFinanceSeed'] = createServiceFinanceSeed; } catch(e) {}
  try { if (typeof createServiceInventorySeed !== 'undefined') window.DX['createServiceInventorySeed'] = createServiceInventorySeed; } catch(e) {}
  try { if (typeof createServiceOrderCode !== 'undefined') window.DX['createServiceOrderCode'] = createServiceOrderCode; } catch(e) {}
  try { if (typeof createServiceOrdersSeed !== 'undefined') window.DX['createServiceOrdersSeed'] = createServiceOrdersSeed; } catch(e) {}
  try { if (typeof createServiceProfileSeed !== 'undefined') window.DX['createServiceProfileSeed'] = createServiceProfileSeed; } catch(e) {}
  try { if (typeof createServiceRegistrationDraft !== 'undefined') window.DX['createServiceRegistrationDraft'] = createServiceRegistrationDraft; } catch(e) {}
  try { if (typeof createServiceVehicleSnapshot !== 'undefined') window.DX['createServiceVehicleSnapshot'] = createServiceVehicleSnapshot; } catch(e) {}
  try { if (typeof daysUntil !== 'undefined') window.DX['daysUntil'] = daysUntil; } catch(e) {}
  try { if (typeof decodeRouteSegment !== 'undefined') window.DX['decodeRouteSegment'] = decodeRouteSegment; } catch(e) {}
  try { if (typeof decorateServiceRecord !== 'undefined') window.DX['decorateServiceRecord'] = decorateServiceRecord; } catch(e) {}
  try { if (typeof dedupeServicesById !== 'undefined') window.DX['dedupeServicesById'] = dedupeServicesById; } catch(e) {}
  try { if (typeof deriveBrandFromTitle !== 'undefined') window.DX['deriveBrandFromTitle'] = deriveBrandFromTitle; } catch(e) {}
  try { if (typeof ensureCarId !== 'undefined') window.DX['ensureCarId'] = ensureCarId; } catch(e) {}
  try { if (typeof estimateServiceDurationMinutes !== 'undefined') window.DX['estimateServiceDurationMinutes'] = estimateServiceDurationMinutes; } catch(e) {}
  try { if (typeof extractServiceCenterMedia !== 'undefined') window.DX['extractServiceCenterMedia'] = extractServiceCenterMedia; } catch(e) {}
  try { if (typeof filterMarketProducts !== 'undefined') window.DX['filterMarketProducts'] = filterMarketProducts; } catch(e) {}
  try { if (typeof findGarageCar !== 'undefined') window.DX['findGarageCar'] = findGarageCar; } catch(e) {}
  try { if (typeof formatChatTime !== 'undefined') window.DX['formatChatTime'] = formatChatTime; } catch(e) {}
  try { if (typeof formatClockMinutes !== 'undefined') window.DX['formatClockMinutes'] = formatClockMinutes; } catch(e) {}
  try { if (typeof formatPrice !== 'undefined') window.DX['formatPrice'] = formatPrice; } catch(e) {}
  try { if (typeof formatRuDate !== 'undefined') window.DX['formatRuDate'] = formatRuDate; } catch(e) {}
  try { if (typeof formatServiceAverageTime !== 'undefined') window.DX['formatServiceAverageTime'] = formatServiceAverageTime; } catch(e) {}
  try { if (typeof formatTjsPrice !== 'undefined') window.DX['formatTjsPrice'] = formatTjsPrice; } catch(e) {}
  try { if (typeof genId !== 'undefined') window.DX['genId'] = genId; } catch(e) {}
  try { if (typeof pluralize !== 'undefined') window.DX['pluralize'] = pluralize; } catch(e) {}
  try { if (typeof getAllowedSellerOrderStatuses !== 'undefined') window.DX['getAllowedSellerOrderStatuses'] = getAllowedSellerOrderStatuses; } catch(e) {}
  try { if (typeof getAllowedSellerOrderStatusIds !== 'undefined') window.DX['getAllowedSellerOrderStatusIds'] = getAllowedSellerOrderStatusIds; } catch(e) {}
  try { if (typeof getBuyerAuthStatus !== 'undefined') window.DX['getBuyerAuthStatus'] = getBuyerAuthStatus; } catch(e) {}
  try { if (typeof getBuyerLocalStorageKey !== 'undefined') window.DX['getBuyerLocalStorageKey'] = getBuyerLocalStorageKey; } catch(e) {}
  try { if (typeof fetchProfileFromSupabase !== 'undefined') window.DX['fetchProfileFromSupabase'] = fetchProfileFromSupabase; } catch(e) {}
  try { if (typeof syncProfileToSupabase !== 'undefined') window.DX['syncProfileToSupabase'] = syncProfileToSupabase; } catch(e) {}
  try { if (typeof uploadAvatarToStorage !== 'undefined') window.DX['uploadAvatarToStorage'] = uploadAvatarToStorage; } catch(e) {}
  try { if (typeof getBuyerOrderChatPath !== 'undefined') window.DX['getBuyerOrderChatPath'] = getBuyerOrderChatPath; } catch(e) {}
  try { if (typeof getBuyerOrderStatusMeta !== 'undefined') window.DX['getBuyerOrderStatusMeta'] = getBuyerOrderStatusMeta; } catch(e) {}
  try { if (typeof getFutureLocalISODate !== 'undefined') window.DX['getFutureLocalISODate'] = getFutureLocalISODate; } catch(e) {}
  try { if (typeof getHashPath !== 'undefined') window.DX['getHashPath'] = getHashPath; } catch(e) {}
  try { if (typeof getLatestPersistedServiceCenter !== 'undefined') window.DX['getLatestPersistedServiceCenter'] = getLatestPersistedServiceCenter; } catch(e) {}
  try { if (typeof getMaintenanceCarState !== 'undefined') window.DX['getMaintenanceCarState'] = getMaintenanceCarState; } catch(e) {}
  try { if (typeof getMaintenanceSpentTotal !== 'undefined') window.DX['getMaintenanceSpentTotal'] = getMaintenanceSpentTotal; } catch(e) {}
  try { if (typeof getMarketBadgeColor !== 'undefined') window.DX['getMarketBadgeColor'] = getMarketBadgeColor; } catch(e) {}
  try { if (typeof getMarketCartPath !== 'undefined') window.DX['getMarketCartPath'] = getMarketCartPath; } catch(e) {}
  try { if (typeof getMarketDiscountPercent !== 'undefined') window.DX['getMarketDiscountPercent'] = getMarketDiscountPercent; } catch(e) {}
  try { if (typeof getMarketProduct !== 'undefined') window.DX['getMarketProduct'] = getMarketProduct; } catch(e) {}
  try { if (typeof getMarketProductPath !== 'undefined') window.DX['getMarketProductPath'] = getMarketProductPath; } catch(e) {}
  try { if (typeof getMarketProductsByStore !== 'undefined') window.DX['getMarketProductsByStore'] = getMarketProductsByStore; } catch(e) {}
  try { if (typeof getMarketStore !== 'undefined') window.DX['getMarketStore'] = getMarketStore; } catch(e) {}
  try { if (typeof getMarketStorePath !== 'undefined') window.DX['getMarketStorePath'] = getMarketStorePath; } catch(e) {}
  try { if (typeof getOrderChatLastMessage !== 'undefined') window.DX['getOrderChatLastMessage'] = getOrderChatLastMessage; } catch(e) {}
  try { if (typeof getOrderChatPeerLabel !== 'undefined') window.DX['getOrderChatPeerLabel'] = getOrderChatPeerLabel; } catch(e) {}
  try { if (typeof getOrderChatPreviewText !== 'undefined') window.DX['getOrderChatPreviewText'] = getOrderChatPreviewText; } catch(e) {}
  try { if (typeof formatOrderShortId !== 'undefined') window.DX['formatOrderShortId'] = formatOrderShortId; } catch(e) {}
  try { if (typeof getBuyerReferralCode !== 'undefined') window.DX['getBuyerReferralCode'] = getBuyerReferralCode; } catch(e) {}
  try { if (typeof normalizeReferralCode !== 'undefined') window.DX['normalizeReferralCode'] = normalizeReferralCode; } catch(e) {}
  try { if (typeof normalizeReferralRecord !== 'undefined') window.DX['normalizeReferralRecord'] = normalizeReferralRecord; } catch(e) {}
  try { if (typeof normalizeReferralsList !== 'undefined') window.DX['normalizeReferralsList'] = normalizeReferralsList; } catch(e) {}
  try { if (typeof computeReferralStats !== 'undefined') window.DX['computeReferralStats'] = computeReferralStats; } catch(e) {}
  try { window.DX['REFERRAL_REWARD_TJS'] = REFERRAL_REWARD_TJS; } catch(e) {}
  try { if (typeof computeTripStats !== 'undefined') window.DX['computeTripStats'] = computeTripStats; } catch(e) {}
  try { if (typeof normalizeTrip !== 'undefined') window.DX['normalizeTrip'] = normalizeTrip; } catch(e) {}
  try { if (typeof normalizeTripsList !== 'undefined') window.DX['normalizeTripsList'] = normalizeTripsList; } catch(e) {}
  try { if (typeof summarizeTrips !== 'undefined') window.DX['summarizeTrips'] = summarizeTrips; } catch(e) {}
  try { if (typeof estimateTripFuel !== 'undefined') window.DX['estimateTripFuel'] = estimateTripFuel; } catch(e) {}
  try { if (typeof estimateTripCost !== 'undefined') window.DX['estimateTripCost'] = estimateTripCost; } catch(e) {}
  try { if (typeof tripHaversineKm !== 'undefined') window.DX['tripHaversineKm'] = tripHaversineKm; } catch(e) {}
  try { if (typeof getFuelType !== 'undefined') window.DX['getFuelType'] = getFuelType; } catch(e) {}
  try { if (typeof estimateTripConsumption !== 'undefined') window.DX['estimateTripConsumption'] = estimateTripConsumption; } catch(e) {}
  try { if (typeof DRIVEX_FUEL_TYPES !== 'undefined') window.DX['DRIVEX_FUEL_TYPES'] = DRIVEX_FUEL_TYPES; } catch(e) {}
  try { if (typeof getOrderChatSenderLabel !== 'undefined') window.DX['getOrderChatSenderLabel'] = getOrderChatSenderLabel; } catch(e) {}
  try { if (typeof getOrderChatThread !== 'undefined') window.DX['getOrderChatThread'] = getOrderChatThread; } catch(e) {}
  try { if (typeof getOrderChatUnreadCount !== 'undefined') window.DX['getOrderChatUnreadCount'] = getOrderChatUnreadCount; } catch(e) {}
  try { if (typeof getOrderTimelineCompactLabel !== 'undefined') window.DX['getOrderTimelineCompactLabel'] = getOrderTimelineCompactLabel; } catch(e) {}
  try { if (typeof getOrderTimelineStepIds !== 'undefined') window.DX['getOrderTimelineStepIds'] = getOrderTimelineStepIds; } catch(e) {}
  try { if (typeof getOrderTimelineSteps !== 'undefined') window.DX['getOrderTimelineSteps'] = getOrderTimelineSteps; } catch(e) {}
  try { if (typeof getPersonalizedServices !== 'undefined') window.DX['getPersonalizedServices'] = getPersonalizedServices; } catch(e) {}
  try { if (typeof getRelatedMarketProducts !== 'undefined') window.DX['getRelatedMarketProducts'] = getRelatedMarketProducts; } catch(e) {}
  try { if (typeof getSellerFallbackProductImage !== 'undefined') window.DX['getSellerFallbackProductImage'] = getSellerFallbackProductImage; } catch(e) {}
  try { if (typeof getSellerNotificationMeta !== 'undefined') window.DX['getSellerNotificationMeta'] = getSellerNotificationMeta; } catch(e) {}
  try { if (typeof getSellerOrderActions !== 'undefined') window.DX['getSellerOrderActions'] = getSellerOrderActions; } catch(e) {}
  try { if (typeof getSellerOrderChatPath !== 'undefined') window.DX['getSellerOrderChatPath'] = getSellerOrderChatPath; } catch(e) {}
  try { if (typeof getSellerOrderStatusMeta !== 'undefined') window.DX['getSellerOrderStatusMeta'] = getSellerOrderStatusMeta; } catch(e) {}
  try { if (typeof getSellerProductById !== 'undefined') window.DX['getSellerProductById'] = getSellerProductById; } catch(e) {}
  try { if (typeof getSellerProductCategoryMeta !== 'undefined') window.DX['getSellerProductCategoryMeta'] = getSellerProductCategoryMeta; } catch(e) {}
  try { if (typeof getSellerProductStatusMeta !== 'undefined') window.DX['getSellerProductStatusMeta'] = getSellerProductStatusMeta; } catch(e) {}
  try { if (typeof getSellerSetupChecklist !== 'undefined') window.DX['getSellerSetupChecklist'] = getSellerSetupChecklist; } catch(e) {}
  try { if (typeof getSellerSetupState !== 'undefined') window.DX['getSellerSetupState'] = getSellerSetupState; } catch(e) {}
  try { if (typeof getServiceAppointmentStatusMeta !== 'undefined') window.DX['getServiceAppointmentStatusMeta'] = getServiceAppointmentStatusMeta; } catch(e) {}
  try { if (typeof getServiceBookingPath !== 'undefined') window.DX['getServiceBookingPath'] = getServiceBookingPath; } catch(e) {}
  try { if (typeof getServiceBoxesCount !== 'undefined') window.DX['getServiceBoxesCount'] = getServiceBoxesCount; } catch(e) {}
  try { if (typeof getServiceCenterMediaStorageKey !== 'undefined') window.DX['getServiceCenterMediaStorageKey'] = getServiceCenterMediaStorageKey; } catch(e) {}
  try { if (typeof getServiceImageRenderKey !== 'undefined') window.DX['getServiceImageRenderKey'] = getServiceImageRenderKey; } catch(e) {}
  try { if (typeof getServicePrimaryBadges !== 'undefined') window.DX['getServicePrimaryBadges'] = getServicePrimaryBadges; } catch(e) {}
  try { if (typeof getServiceRepairActions !== 'undefined') window.DX['getServiceRepairActions'] = getServiceRepairActions; } catch(e) {}
  try { if (typeof getServiceRepairStatusMeta !== 'undefined') window.DX['getServiceRepairStatusMeta'] = getServiceRepairStatusMeta; } catch(e) {}
  try { if (typeof getServiceRequestStatusMeta !== 'undefined') window.DX['getServiceRequestStatusMeta'] = getServiceRequestStatusMeta; } catch(e) {}
  try { if (typeof getSupabaseClient !== 'undefined') window.DX['getSupabaseClient'] = getSupabaseClient; } catch(e) {}
  try { if (typeof isCompleteTjPhone !== 'undefined') window.DX['isCompleteTjPhone'] = isCompleteTjPhone; } catch(e) {}
  try { if (typeof isDemoServiceAppointment !== 'undefined') window.DX['isDemoServiceAppointment'] = isDemoServiceAppointment; } catch(e) {}
  try { if (typeof isDemoServiceClient !== 'undefined') window.DX['isDemoServiceClient'] = isDemoServiceClient; } catch(e) {}
  try { if (typeof isDemoServiceFinanceEntry !== 'undefined') window.DX['isDemoServiceFinanceEntry'] = isDemoServiceFinanceEntry; } catch(e) {}
  try { if (typeof isDemoServiceInventoryItem !== 'undefined') window.DX['isDemoServiceInventoryItem'] = isDemoServiceInventoryItem; } catch(e) {}
  try { if (typeof isDemoServiceOrder !== 'undefined') window.DX['isDemoServiceOrder'] = isDemoServiceOrder; } catch(e) {}
  try { if (typeof isImageDataUrl !== 'undefined') window.DX['isImageDataUrl'] = isImageDataUrl; } catch(e) {}
  try { if (typeof isPickupSellerOrder !== 'undefined') window.DX['isPickupSellerOrder'] = isPickupSellerOrder; } catch(e) {}
  try { if (typeof isSellerRole !== 'undefined') window.DX['isSellerRole'] = isSellerRole; } catch(e) {}
  try { if (typeof liveSharedAppStateKeys !== 'undefined') window.DX['liveSharedAppStateKeys'] = liveSharedAppStateKeys; } catch(e) {}
  try { if (typeof makeBuyerId !== 'undefined') window.DX['makeBuyerId'] = makeBuyerId; } catch(e) {}
  try { if (typeof makeBuyerSessionFromLocalUser !== 'undefined') window.DX['makeBuyerSessionFromLocalUser'] = makeBuyerSessionFromLocalUser; } catch(e) {}
  try { if (typeof makeBuyerSessionFromSupabaseUser !== 'undefined') window.DX['makeBuyerSessionFromSupabaseUser'] = makeBuyerSessionFromSupabaseUser; } catch(e) {}
  try { if (typeof mapRepairStatusToServiceRequestStatus !== 'undefined') window.DX['mapRepairStatusToServiceRequestStatus'] = mapRepairStatusToServiceRequestStatus; } catch(e) {}
  try { if (typeof mapSellerProductToMarketplaceProduct !== 'undefined') window.DX['mapSellerProductToMarketplaceProduct'] = mapSellerProductToMarketplaceProduct; } catch(e) {}
  try { if (typeof mapSellerStoreToMarketplaceStore !== 'undefined') window.DX['mapSellerStoreToMarketplaceStore'] = mapSellerStoreToMarketplaceStore; } catch(e) {}
  try { if (typeof marketplaceData !== 'undefined') window.DX['marketplaceData'] = marketplaceData; } catch(e) {}
  try { if (typeof markOrderChatAsRead !== 'undefined') window.DX['markOrderChatAsRead'] = markOrderChatAsRead; } catch(e) {}
  try { if (typeof mergeBuyerOrders !== 'undefined') window.DX['mergeBuyerOrders'] = mergeBuyerOrders; } catch(e) {}
  try { if (typeof mergeSellerNotifications !== 'undefined') window.DX['mergeSellerNotifications'] = mergeSellerNotifications; } catch(e) {}
  try { if (typeof mergeServiceCenterList !== 'undefined') window.DX['mergeServiceCenterList'] = mergeServiceCenterList; } catch(e) {}
  try { if (typeof navigateToAppRoute !== 'undefined') window.DX['navigateToAppRoute'] = navigateToAppRoute; } catch(e) {}
  try { if (typeof useHashPath !== 'undefined') window.DX['useHashPath'] = useHashPath; } catch(e) {}
  try { if (typeof navigateToHash !== 'undefined') window.DX['navigateToHash'] = navigateToHash; } catch(e) {}
  try { if (typeof normalizeBuyerOrder !== 'undefined') window.DX['normalizeBuyerOrder'] = normalizeBuyerOrder; } catch(e) {}
  try { if (typeof normalizeBuyerOrdersList !== 'undefined') window.DX['normalizeBuyerOrdersList'] = normalizeBuyerOrdersList; } catch(e) {}
  try { if (typeof normalizeBuyerProfile !== 'undefined') window.DX['normalizeBuyerProfile'] = normalizeBuyerProfile; } catch(e) {}
  try { if (typeof normalizeBuyerSession !== 'undefined') window.DX['normalizeBuyerSession'] = normalizeBuyerSession; } catch(e) {}
  try { if (typeof normalizeDocumentItem !== 'undefined') window.DX['normalizeDocumentItem'] = normalizeDocumentItem; } catch(e) {}
  try { if (typeof normalizeGarageCar !== 'undefined') window.DX['normalizeGarageCar'] = normalizeGarageCar; } catch(e) {}
  try { if (typeof normalizeGarageList !== 'undefined') window.DX['normalizeGarageList'] = normalizeGarageList; } catch(e) {}
  try { if (typeof normalizeInspection !== 'undefined') window.DX['normalizeInspection'] = normalizeInspection; } catch(e) {}
  try { if (typeof normalizeMaintenanceRecord !== 'undefined') window.DX['normalizeMaintenanceRecord'] = normalizeMaintenanceRecord; } catch(e) {}
  try { if (typeof normalizeMarketplacePartnerCatalog !== 'undefined') window.DX['normalizeMarketplacePartnerCatalog'] = normalizeMarketplacePartnerCatalog; } catch(e) {}
  try { if (typeof normalizeMarketplacePartnerProduct !== 'undefined') window.DX['normalizeMarketplacePartnerProduct'] = normalizeMarketplacePartnerProduct; } catch(e) {}
  try { if (typeof normalizeMarketProductId !== 'undefined') window.DX['normalizeMarketProductId'] = normalizeMarketProductId; } catch(e) {}
  try { if (typeof normalizeMarketSearchText !== 'undefined') window.DX['normalizeMarketSearchText'] = normalizeMarketSearchText; } catch(e) {}
  try { if (typeof normalizeOrderChatMessage !== 'undefined') window.DX['normalizeOrderChatMessage'] = normalizeOrderChatMessage; } catch(e) {}
  try { if (typeof normalizeOrderChatMessagesList !== 'undefined') window.DX['normalizeOrderChatMessagesList'] = normalizeOrderChatMessagesList; } catch(e) {}
  try { if (typeof normalizeOrderChatsMap !== 'undefined') window.DX['normalizeOrderChatsMap'] = normalizeOrderChatsMap; } catch(e) {}
  try { if (typeof normalizeOrderChatThread !== 'undefined') window.DX['normalizeOrderChatThread'] = normalizeOrderChatThread; } catch(e) {}
  try { if (typeof normalizePath !== 'undefined') window.DX['normalizePath'] = normalizePath; } catch(e) {}
  try { if (typeof normalizeSavedPlace !== 'undefined') window.DX['normalizeSavedPlace'] = normalizeSavedPlace; } catch(e) {}
  try { if (typeof normalizeSavedPlacesList !== 'undefined') window.DX['normalizeSavedPlacesList'] = normalizeSavedPlacesList; } catch(e) {}
  try { if (typeof normalizeFavorite !== 'undefined') window.DX['normalizeFavorite'] = normalizeFavorite; } catch(e) {}
  try { if (typeof normalizeFavoritesList !== 'undefined') window.DX['normalizeFavoritesList'] = normalizeFavoritesList; } catch(e) {}
  try { if (typeof normalizeSellerNotification !== 'undefined') window.DX['normalizeSellerNotification'] = normalizeSellerNotification; } catch(e) {}
  try { if (typeof normalizeSellerNotificationsList !== 'undefined') window.DX['normalizeSellerNotificationsList'] = normalizeSellerNotificationsList; } catch(e) {}
  try { if (typeof normalizeSellerOrder !== 'undefined') window.DX['normalizeSellerOrder'] = normalizeSellerOrder; } catch(e) {}
  try { if (typeof normalizeSellerOrdersList !== 'undefined') window.DX['normalizeSellerOrdersList'] = normalizeSellerOrdersList; } catch(e) {}
  try { if (typeof normalizeSellerProduct !== 'undefined') window.DX['normalizeSellerProduct'] = normalizeSellerProduct; } catch(e) {}
  try { if (typeof normalizeSellerProductsList !== 'undefined') window.DX['normalizeSellerProductsList'] = normalizeSellerProductsList; } catch(e) {}
  try { if (typeof normalizeSellerProfile !== 'undefined') window.DX['normalizeSellerProfile'] = normalizeSellerProfile; } catch(e) {}
  try { if (typeof normalizeSellerSession !== 'undefined') window.DX['normalizeSellerSession'] = normalizeSellerSession; } catch(e) {}
  try { if (typeof normalizeSellerStore !== 'undefined') window.DX['normalizeSellerStore'] = normalizeSellerStore; } catch(e) {}
  try { if (typeof normalizeServiceAppointment !== 'undefined') window.DX['normalizeServiceAppointment'] = normalizeServiceAppointment; } catch(e) {}
  try { if (typeof normalizeServiceAppointmentsList !== 'undefined') window.DX['normalizeServiceAppointmentsList'] = normalizeServiceAppointmentsList; } catch(e) {}
  try { if (typeof normalizeServiceAuthState !== 'undefined') window.DX['normalizeServiceAuthState'] = normalizeServiceAuthState; } catch(e) {}
  try { if (typeof normalizeServiceBrands !== 'undefined') window.DX['normalizeServiceBrands'] = normalizeServiceBrands; } catch(e) {}
  try { if (typeof normalizeServiceCenter !== 'undefined') window.DX['normalizeServiceCenter'] = normalizeServiceCenter; } catch(e) {}
  try { if (typeof normalizeServiceClient !== 'undefined') window.DX['normalizeServiceClient'] = normalizeServiceClient; } catch(e) {}
  try { if (typeof normalizeServiceClientsList !== 'undefined') window.DX['normalizeServiceClientsList'] = normalizeServiceClientsList; } catch(e) {}
  try { if (typeof normalizeServiceFinanceEntry !== 'undefined') window.DX['normalizeServiceFinanceEntry'] = normalizeServiceFinanceEntry; } catch(e) {}
  try { if (typeof normalizeServiceFinanceList !== 'undefined') window.DX['normalizeServiceFinanceList'] = normalizeServiceFinanceList; } catch(e) {}
  try { if (typeof normalizeServiceGalleryList !== 'undefined') window.DX['normalizeServiceGalleryList'] = normalizeServiceGalleryList; } catch(e) {}
  try { if (typeof normalizeServiceImageAsset !== 'undefined') window.DX['normalizeServiceImageAsset'] = normalizeServiceImageAsset; } catch(e) {}
  try { if (typeof normalizeServiceInventoryItem !== 'undefined') window.DX['normalizeServiceInventoryItem'] = normalizeServiceInventoryItem; } catch(e) {}
  try { if (typeof normalizeServiceInventoryList !== 'undefined') window.DX['normalizeServiceInventoryList'] = normalizeServiceInventoryList; } catch(e) {}
  try { if (typeof normalizeServiceMasterEntry !== 'undefined') window.DX['normalizeServiceMasterEntry'] = normalizeServiceMasterEntry; } catch(e) {}
  try { if (typeof normalizeServiceMastersList !== 'undefined') window.DX['normalizeServiceMastersList'] = normalizeServiceMastersList; } catch(e) {}
  try { if (typeof normalizeServicePriceItem !== 'undefined') window.DX['normalizeServicePriceItem'] = normalizeServicePriceItem; } catch(e) {}
  try { if (typeof normalizeServicePriceList !== 'undefined') window.DX['normalizeServicePriceList'] = normalizeServicePriceList; } catch(e) {}
  try { if (typeof normalizeServiceProfile !== 'undefined') window.DX['normalizeServiceProfile'] = normalizeServiceProfile; } catch(e) {}
  try { if (typeof normalizeServiceRepairOrder !== 'undefined') window.DX['normalizeServiceRepairOrder'] = normalizeServiceRepairOrder; } catch(e) {}
  try { if (typeof normalizeServiceRepairOrdersList !== 'undefined') window.DX['normalizeServiceRepairOrdersList'] = normalizeServiceRepairOrdersList; } catch(e) {}
  try { if (typeof normalizeServiceRequest !== 'undefined') window.DX['normalizeServiceRequest'] = normalizeServiceRequest; } catch(e) {}
  try { if (typeof normalizeServiceRequestsList !== 'undefined') window.DX['normalizeServiceRequestsList'] = normalizeServiceRequestsList; } catch(e) {}
  try { if (typeof normalizeServiceRequestStatusId !== 'undefined') window.DX['normalizeServiceRequestStatusId'] = normalizeServiceRequestStatusId; } catch(e) {}
  try { if (typeof normalizeServiceSession !== 'undefined') window.DX['normalizeServiceSession'] = normalizeServiceSession; } catch(e) {}
  try { if (typeof normalizeServiceVideoUrl !== 'undefined') window.DX['normalizeServiceVideoUrl'] = normalizeServiceVideoUrl; } catch(e) {}
  try { if (typeof normalizeTjPhoneInput !== 'undefined') window.DX['normalizeTjPhoneInput'] = normalizeTjPhoneInput; } catch(e) {}
  try { if (typeof openDrivexMediaDatabase !== 'undefined') window.DX['openDrivexMediaDatabase'] = openDrivexMediaDatabase; } catch(e) {}
  try { if (typeof OrderStatusTimeline !== 'undefined') window.DX['OrderStatusTimeline'] = OrderStatusTimeline; } catch(e) {}
  try { if (typeof parseClockMinutes !== 'undefined') window.DX['parseClockMinutes'] = parseClockMinutes; } catch(e) {}
  try { if (typeof parseISODate !== 'undefined') window.DX['parseISODate'] = parseISODate; } catch(e) {}
  try { if (typeof parseMarketCartKey !== 'undefined') window.DX['parseMarketCartKey'] = parseMarketCartKey; } catch(e) {}
  try { if (typeof parseServiceWorkingHoursRange !== 'undefined') window.DX['parseServiceWorkingHoursRange'] = parseServiceWorkingHoursRange; } catch(e) {}
  try { if (typeof persistSellerFrontendSnapshot !== 'undefined') window.DX['persistSellerFrontendSnapshot'] = persistSellerFrontendSnapshot; } catch(e) {}
  try { if (typeof persistServiceCenterToLocalStorage !== 'undefined') window.DX['persistServiceCenterToLocalStorage'] = persistServiceCenterToLocalStorage; } catch(e) {}
  try { if (typeof pickServiceBookingBox !== 'undefined') window.DX['pickServiceBookingBox'] = pickServiceBookingBox; } catch(e) {}
  try { if (typeof prepareAvatarDataUrl !== 'undefined') window.DX['prepareAvatarDataUrl'] = prepareAvatarDataUrl; } catch(e) {}
  try { if (typeof prepareDocumentDataUrl !== 'undefined') window.DX['prepareDocumentDataUrl'] = prepareDocumentDataUrl; } catch(e) {}
  try { if (typeof readBuyerLocalStorage !== 'undefined') window.DX['readBuyerLocalStorage'] = readBuyerLocalStorage; } catch(e) {}
  try { if (typeof readDrivexMediaValue !== 'undefined') window.DX['readDrivexMediaValue'] = readDrivexMediaValue; } catch(e) {}
  try { if (typeof readLocalBuyerUsers !== 'undefined') window.DX['readLocalBuyerUsers'] = readLocalBuyerUsers; } catch(e) {}
  try { if (typeof readSellerPendingRoute !== 'undefined') window.DX['readSellerPendingRoute'] = readSellerPendingRoute; } catch(e) {}
  try { if (typeof resolveSellerBackendSnapshot !== 'undefined') window.DX['resolveSellerBackendSnapshot'] = resolveSellerBackendSnapshot; } catch(e) {}
  try { if (typeof resolveSellerProductsState !== 'undefined') window.DX['resolveSellerProductsState'] = resolveSellerProductsState; } catch(e) {}
  try { if (typeof serializeServiceCenterForStorage !== 'undefined') window.DX['serializeServiceCenterForStorage'] = serializeServiceCenterForStorage; } catch(e) {}
  try { if (typeof setMarketplaceRuntime !== 'undefined') window.DX['setMarketplaceRuntime'] = setMarketplaceRuntime; } catch(e) {}
  try { if (typeof slugifyText !== 'undefined') window.DX['slugifyText'] = slugifyText; } catch(e) {}
  try { if (typeof syncBuyerOrdersWithSellerOrders !== 'undefined') window.DX['syncBuyerOrdersWithSellerOrders'] = syncBuyerOrdersWithSellerOrders; } catch(e) {}
  try { if (typeof syncMarketplaceCheckoutDraft !== 'undefined') window.DX['syncMarketplaceCheckoutDraft'] = syncMarketplaceCheckoutDraft; } catch(e) {}
  try { if (typeof ToastContext !== 'undefined') window.DX['ToastContext'] = ToastContext; } catch(e) {}
  try { if (typeof toLocalISODate !== 'undefined') window.DX['toLocalISODate'] = toLocalISODate; } catch(e) {}
  try { if (typeof upsertServiceClientFromBooking !== 'undefined') window.DX['upsertServiceClientFromBooking'] = upsertServiceClientFromBooking; } catch(e) {}
  try { if (typeof useToast !== 'undefined') window.DX['useToast'] = useToast; } catch(e) {}
  try { if (typeof writeBuyerLocalStorage !== 'undefined') window.DX['writeBuyerLocalStorage'] = writeBuyerLocalStorage; } catch(e) {}
  try { if (typeof writeDrivexMediaValue !== 'undefined') window.DX['writeDrivexMediaValue'] = writeDrivexMediaValue; } catch(e) {}
  try { if (typeof writeLocalBuyerUsers !== 'undefined') window.DX['writeLocalBuyerUsers'] = writeLocalBuyerUsers; } catch(e) {}
  try { if (typeof writeSellerPendingRoute !== 'undefined') window.DX['writeSellerPendingRoute'] = writeSellerPendingRoute; } catch(e) {}
  try { if (typeof fetchBuyerAppState !== 'undefined') window.DX['fetchBuyerAppState'] = fetchBuyerAppState; } catch(e) {}
  try { if (typeof fetchSharedAppState !== 'undefined') window.DX['fetchSharedAppState'] = fetchSharedAppState; } catch(e) {}
  try { if (typeof fetchSharedServiceCenters !== 'undefined') window.DX['fetchSharedServiceCenters'] = fetchSharedServiceCenters; } catch(e) {}
  try { if (typeof saveBuyerAppState !== 'undefined') window.DX['saveBuyerAppState'] = saveBuyerAppState; } catch(e) {}
  try { if (typeof saveSharedAppState !== 'undefined') window.DX['saveSharedAppState'] = saveSharedAppState; } catch(e) {}
  try { if (typeof saveSharedServiceCenter !== 'undefined') window.DX['saveSharedServiceCenter'] = saveSharedServiceCenter; } catch(e) {}

  // ── Async functions (не попали в основной экспорт) ──
  try { window.DX.fetchSharedAppState = fetchSharedAppState; } catch(e) {}
  try { window.DX.fetchBuyerAppState  = fetchBuyerAppState;  } catch(e) {}
  try { window.DX.saveBuyerAppState   = saveBuyerAppState;   } catch(e) {}
  try { window.DX.applySharedStateSnapshot = applySharedStateSnapshot; } catch(e) {}
  // Key constants
  try { window.DX.drivexStorageKeys    = drivexStorageKeys;   } catch(e) {}
  try { window.DX.drivexSyncChannelName= drivexSyncChannelName; } catch(e) {}
  try { window.DX.sellerPrimaryStoreId = sellerPrimaryStoreId; } catch(e) {}
  try { window.DX.servicePrimaryCenterId = servicePrimaryCenterId; } catch(e) {}
  try { window.DX.serviceRepairStatusOptions = serviceRepairStatusOptions; } catch(e) {}
  try { window.DX.serviceAppointmentStatusOptions = serviceAppointmentStatusOptions; } catch(e) {}
  try { window.DX.serviceRequestStatusOptions = serviceRequestStatusOptions; } catch(e) {}
  try { window.DX.sellerProductStatusOptions = sellerProductStatusOptions; } catch(e) {}
  try { window.DX.buyerOrderStatusOptions = buyerOrderStatusOptions; } catch(e) {}
  try { window.DX.prepareAvatarDataUrl = prepareAvatarDataUrl; } catch(e) {}
  try { window.DX.uploadChatImage = uploadChatImage; } catch(e) {}

})();





