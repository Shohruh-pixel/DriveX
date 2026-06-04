// app/core/storage.js — localStorage, IndexedDB, shared state functions
(() => {
  'use strict';
  const DX = window.DX;

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
    orderChats: "drivex.order-chats.v1",
    buyerInvite: "drivex.buyer.invite.v1",
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
    serviceRequests: "drivex.service.requests.v1"
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
    drivexStorageKeys.marketplaceCatalog
  ]);
  const buyerPersonalStorageKeys = new Set([
    drivexStorageKeys.profile,
    drivexStorageKeys.activeCar,
    drivexStorageKeys.buyerGarage,
    drivexStorageKeys.documents,
    drivexStorageKeys.maintenance,
    drivexStorageKeys.cart,
    drivexStorageKeys.buyerOrders,
    drivexStorageKeys.orderChats,
    drivexStorageKeys.savedPlaces,
    drivexStorageKeys.buyerInvite
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
    return {
      stores: Array.isArray(source.stores) ? source.stores.filter(Boolean) : [],
      products: Array.isArray(source.products) ? source.products.filter(Boolean) : []
    };
  }

  async function fetchSharedAppState() {
    const response = await fetch("/api/app-state", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("App state load failed");
    const payload = await response.json();
    return payload && typeof payload.state === "object" && payload.state ? payload.state : {};
  }

  async function saveSharedAppState(key, value) {
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
    return response.json().catch(() => ({}));
  }

  async function fetchBuyerAppState(session) {
    const safeSession = normalizeBuyerSession(session);
    const client = getSupabaseClient();
    if (!client || !safeSession.authenticated || !safeSession.id) return null;

    const { data, error } = await client
      .from("user_app_state")
      .select("key,value,updated_at")
      .eq("user_id", safeSession.id);
    if (error) throw error;

    return (Array.isArray(data) ? data : []).reduce((acc, row) => {
      if (!row || typeof row.key !== "string") return acc;
      acc[row.key] = {
        value: row.value,
        updatedAt: row.updated_at || ""
      };
      return acc;
    }, {});
  }

  async function saveBuyerAppState(session, key, value) {
    const safeSession = normalizeBuyerSession(session);
    const client = getSupabaseClient();
    if (!client || !safeSession.authenticated || !safeSession.id) return null;

    const { error } = await client.from("user_app_state").upsert(
      {
        user_id: safeSession.id,
        key,
        value,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,key" }
    );
    if (error) throw error;
    return true;
  }

  // Export to DX namespace
  DX.canUseIndexedDbStorage = canUseIndexedDbStorage;
  DX.openDrivexMediaDatabase = openDrivexMediaDatabase;
  DX.readDrivexMediaValue = readDrivexMediaValue;
  DX.writeDrivexMediaValue = writeDrivexMediaValue;
  DX.getServiceCenterMediaStorageKey = getServiceCenterMediaStorageKey;
  DX.fetchSharedAppState = fetchSharedAppState;
  DX.saveSharedAppState = saveSharedAppState;
  DX.fetchBuyerAppState = fetchBuyerAppState;
  DX.saveBuyerAppState = saveBuyerAppState;
})();
