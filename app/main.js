// app/main.js — App() компонент, роутинг, ReactDOM.render
// Использует все модули из window.DX
(() => {
  'use strict';
  const DX = window.DX;
  const React    = DX.React;
  const ReactDOM = DX.ReactDOM;
  const html     = DX.html;
  const { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } = React;

  // ── Shared UI из DX ──────────────────────────────────
  const { BottomNav, SimplePage, useHashPath, navigateToHash } = DX;
  const { useToast, ToastProvider } = DX;

  // ── Storage/Supabase helpers ──────────────────────────
  const { getSupabaseClient, getBuyerAuthStatus, makeBuyerSessionFromSupabaseUser } = DX;
  const { readBuyerLocalStorage, writeBuyerLocalStorage, readLocalBuyerUsers, writeLocalBuyerUsers,
          drivexStorageKeys, fetchSharedAppState, applySharedStateSnapshot,
          fetchBuyerAppState, saveBuyerAppState, clearBuyerLocalStorageForSession } = DX;
  const { fetchProfileFromSupabase, syncProfileToSupabase, uploadAvatarToStorage } = DX;

  // ── Models ───────────────────────────────────────────
  const { normalizeBuyerSession, createEmptyBuyerSession, normalizeBuyerProfile,
          createDefaultBuyerProfile, buyerSessionToProfile, makeBuyerSessionFromLocalUser,
          makeBuyerId, normalizeBuyerSession: _nbs } = DX;
  const { normalizeGarageCar, normalizeGarageList, normalizeGarageSavedPlaces,
          normalizeSavedPlacesList, normalizeDocumentsState, createEmptyDocumentsState,
          normalizeMaintenanceState, createEmptyMaintenanceState, countMaintenanceRecords,
          buildSmartCareTasks, countDocumentsState, upsertMaintenanceRecord: _umi,
          normalizeMaintenanceRecord, toLocalISODate } = DX;
  const { normalizeBuyerOrder, normalizeBuyerOrdersList, getBuyerOrderStatusMeta,
          buyerOrderStatusOptions, parseMarketCartKey, createMarketCartKey,
          marketplaceData, setMarketplaceRuntime, buildMarketplaceRuntimeData,
          normalizeMarketProductId, getMarketProduct } = DX;
  const { normalizeSellerSession, normalizeSellerProfile, normalizeSellerStore,
          normalizeSellerProduct, normalizeSellerOrdersList, normalizeSellerNotificationsList,
          resolveSellerBackendSnapshot, resolveSellerProductsState, persistSellerFrontendSnapshot,
          getSellerSetupState, isSellerRole, sellerPrimaryStoreId, slugifyText,
          createPendingSellerStoreId } = DX;
  const { normalizeServiceSession, normalizeServiceProfile, normalizeServiceAuthState,
          normalizeServiceCenter, createDefaultServiceSession, createFreshServiceSession,
          createServiceCenterSeed, normalizeServiceClientsList, normalizeServiceRepairOrdersList,
          normalizeServiceInventoryList, normalizeServiceFinanceList,
          normalizeServiceAppointmentsList, normalizeServiceRequestsList,
          createServiceClientsSeed, createServiceOrdersSeed, createServiceInventorySeed,
          createServiceFinanceSeed, createServiceAppointmentsSeed,
          buildServiceDirectoryData, dedupeServicesById, decorateServiceRecord,
          buildServiceDashboardStats, buildServiceFinanceSummary,
          buildBuyerServiceNotifications, createServiceRegistrationDraft,
          serializeServiceCenterForStorage, getLatestPersistedServiceCenter,
          persistServiceCenterToLocalStorage, extractServiceCenterMedia,
          upsertServiceClientFromBooking, createServiceOrderCode } = DX;

  // ── i18n ─────────────────────────────────────────────
  const { t, LangSwitcher } = DX;

  // ── Constants/live data ──────────────────────────────
  let { garageCars, savedPlaces } = DX;
  let _liveNearbyServices      = DX._liveNearbyServices     || null;
  let _liveRecommendedServices = DX._liveRecommendedServices || null;
  let _liveMarketProducts      = DX._liveMarketProducts      || null;

  // ── All screens ──────────────────────────────────────
  // (exported by screen files into DX.screens)
  const S = DX.screens || {};
  const {
    BuyerAuthScreen, DashboardScreen, ProfileScreen, GarageScreen,
    DocumentsVaultScreen, LicenseDocumentScreen, CarDocumentScreen,
    MaintenanceScreen, MaintenanceCostScreen, ServiceHistoryScreen,
    MarketScreen, MarketCatalogScreen, MarketAutoPickerScreen,
    MarketOrdersScreen, MarketOrderDetailScreen, CartScreen,
    ProductDetailScreen, ServicesScreen, ServiceDetailScreen,
    MapScreen, BookingFlowScreen,
    SellerRegistrationScreen, SellerOnboardingScreen, SellerDashboardScreen,
    SellerProductsScreen, SellerProductEditorScreen, SellerOrdersScreen,
    SellerOrderDetailScreen, SellerOrderChatScreen, SellerStorePage,
    PartnerLoginScreen, PartnerRegisterIntroScreen, SellerLayout,
    ServiceCrmRegistrationScreen, ServiceDashboardScreen, ServiceClientsScreen,
    ServiceOrdersScreen, ServiceInventoryScreen, ServiceFinanceScreen,
    ServiceAppointmentsScreen, ServiceRequestsScreen, ServiceSettingsScreen,
    ServiceNotFoundScreen, ServiceLayout,
    NotFoundScreen, PlaceholderPage, HelpScreen, PaymentDataScreen,
    BonusProgramScreen, InviteFriendsScreen, TripsScreen,
    RecommendedServicesScreen, ServiceShowcaseScreen,
    OrderStatusTimeline, OrderChatSummaryCard,
    BookingSlotPickerScreen, ServiceCatalogScreen
  } = S;

  // ── Seller backend ───────────────────────────────────
  const sellerBackend = window.DrivexSellerBackend || null;

  // Остальные утилиты из DX (misc)
  const { genId, alphaBg, ensureCarId, formatTjsPrice, formatDate,
          getBuyerOrderChatPath, prepareDocumentDataUrl, decodeRouteSegment,
          normalizeCartItemKey, drivexSyncChannelName, writeSellerPendingRoute,
          baseNotificationsCount, recommendedServices, nearbyServices,
          serviceShowcaseProfiles, mapFilters, mapPoints,
          marketplacePartnerCatalog, serviceDirectorySharedCenters } = DX;

  // Partner auth helpers
  const { saveServiceAuthState, loadServiceAuthState, upsertServiceCenterToServer,
          loadSharedServiceCenters } = DX;
  const { runSellerBackendAction, loadSellerBackendAppState } = DX;

  function App() {
    const path = useHashPath();
    const toast = useToast();
    const sellerSyncChannelRef = useRef(null);
    const sharedAppStateReadyRef = useRef(false);
    const sharedAppStateUpdatedAtRef = useRef({});
    const buyerStateReadyRef = useRef(!getSupabaseClient());
    const recentBuyerSavesRef = useRef({});

    const [buyerSession, setBuyerSession] = useState(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.buyerSession) : null;
        if (!raw) return createEmptyBuyerSession();
        return normalizeBuyerSession(JSON.parse(raw));
      } catch {
        return createEmptyBuyerSession();
      }
    });
    const [cart, setCart] = useState(() => {
      const fallback = {};

      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.cart, buyerSession);
        if (!raw) return fallback;
        const parsed = raw;
        if (!parsed || typeof parsed !== "object") return fallback;

        const normalizedCart = {};
        for (const [key, value] of Object.entries(parsed)) {
          const parsedKey = parseMarketCartKey(key);
          const qty = Math.floor(Number(value));
          const safeKey = parsedKey.cartKey || createMarketCartKey(parsedKey.productId, parsedKey.storeId);
          if (!safeKey || !parsedKey.productId) continue;
          if (!Number.isFinite(qty) || qty <= 0) continue;
          normalizedCart[safeKey] = qty;
        }

        return Object.keys(normalizedCart).length ? normalizedCart : fallback;
      } catch {
        return fallback;
      }
    });
    const baseNotificationsCount = 3;
    const [userGarageCars, setUserGarageCars] = useState(() => {
      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.buyerGarage, buyerSession);
        return normalizeGarageList(raw ? raw : []);
      } catch {
        return [];
      }
    });
    garageCars = userGarageCars;
    const [activeCarId, setActiveCarId] = useState(() => {
      const fallback = garageCars[0] ? garageCars[0].id : "";

      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.activeCar, buyerSession);
        if (!raw) return fallback;
        const parsed = raw;
        return ensureCarId(parsed);
      } catch {
        return fallback;
      }
    });
    const [userSavedPlaces, setUserSavedPlaces] = useState(() => {
      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.savedPlaces, buyerSession);
        return normalizeSavedPlacesList(raw ? raw : []);
      } catch {
        return [];
      }
    });
    savedPlaces = userSavedPlaces;
    const [buyerAuthStatus, setBuyerAuthStatus] = useState(() => getBuyerAuthStatus());
    const [profile, setProfile] = useState(() => {
      const fallback = createDefaultBuyerProfile();

      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.profile, buyerSession);
        if (!raw) return fallback;
        const parsed = raw;
        if (!parsed || typeof parsed !== "object") return fallback;
        return normalizeBuyerProfile(parsed);
      } catch {
        return fallback;
      }
    });

    const [documents, setDocuments] = useState(() => {
      const fallback = createEmptyDocumentsState();

      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.documents, buyerSession);
        if (!raw) return fallback;
        const parsed = raw;
        if (!parsed || typeof parsed !== "object") return fallback;

        const next = createEmptyDocumentsState(garageCars);

        const rawLicense = Array.isArray(parsed.license) ? parsed.license[0] : parsed.license;
        next.license = normalizeDocumentItem(rawLicense, "Права");

        if (parsed.cars && typeof parsed.cars === "object") {
          const carIds = new Set([...Object.keys(parsed.cars), ...garageCars.map((car) => car.id)]);
          for (const carId of carIds) {
            const car = garageCars.find((item) => item.id === carId);
            const fallbackRegistrationName = car ? `Техпаспорт ${car.name}` : "Техпаспорт";
            const fallbackInspectionName = car ? `Техосмотр ${car.name}` : "Техосмотр";
            const carDocs = parsed.cars[carId] && typeof parsed.cars[carId] === "object" ? parsed.cars[carId] : {};
            next.cars[carId] = {
              registration: normalizeDocumentItem(carDocs.registration, fallbackRegistrationName),
              inspection: normalizeDocumentItem(carDocs.inspection, fallbackInspectionName)
            };
          }
          return next;
        }

        const legacyRegistration = Array.isArray(parsed.registration)
          ? parsed.registration
              .map((item) => normalizeDocumentItem(item, "Техпаспорт"))
              .filter(Boolean)
          : [];
        const legacyInspection = Array.isArray(parsed.inspection)
          ? parsed.inspection
              .map((item) => normalizeDocumentItem(item, "Техосмотр"))
              .filter(Boolean)
          : [];

        garageCars.forEach((car, index) => {
          next.cars[car.id] = {
            registration: legacyRegistration[index] || null,
            inspection: legacyInspection[index] || null
          };
        });

        return next;
      } catch {
        return fallback;
      }
    });

    const [maintenance, setMaintenance] = useState(() => {
      const fallback = createEmptyMaintenanceState();

      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.maintenance, buyerSession);
        if (!raw) return fallback;
        const parsed = raw;
        if (!parsed || typeof parsed !== "object") return fallback;

        const next = createEmptyMaintenanceState();

        if (parsed.cars && typeof parsed.cars === "object") {
          for (const car of garageCars) {
            const carState =
              parsed.cars[car.id] && typeof parsed.cars[car.id] === "object"
                ? parsed.cars[car.id]
                : {};

            next.cars[car.id] = {
              records: (Array.isArray(carState.records) ? carState.records : [])
                .map((item) => normalizeMaintenanceRecord(item))
                .filter(Boolean)
                .slice(0, 200),
              inspection: normalizeInspection(carState.inspection)
            };
          }

          return next;
        }

        const firstCarId = garageCars[0] ? garageCars[0].id : "";
        if (firstCarId) {
          next.cars[firstCarId] = {
            records: (Array.isArray(parsed.records) ? parsed.records : [])
              .map((item) => normalizeMaintenanceRecord(item))
              .filter(Boolean)
              .slice(0, 200),
            inspection: normalizeInspection(parsed.inspection)
          };
        }

        return next;
      } catch {
        return fallback;
      }
    });
    const [sellerSession, setSellerSession] = useState(() => {
      const fallback = createDefaultSellerSession();

      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.sellerSession) : null;
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return normalizeSellerSession(parsed);
      } catch {
        return fallback;
      }
    });
    const [sellerProfile, setSellerProfile] = useState(() => {
      const fallback = createSellerProfileSeed(sellerSession);

      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.sellerProfile) : null;
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return normalizeSellerProfile(parsed, sellerSession);
      } catch {
        return fallback;
      }
    });
    const [sellerStore, setSellerStore] = useState(() => {
      const fallback = createSellerStoreSeed(sellerSession.sellerStoreId);

      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.sellerStore) : null;
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return normalizeSellerStore(parsed, sellerSession.sellerStoreId);
      } catch {
        return fallback;
      }
    });
    const [sellerProducts, setSellerProducts] = useState(() => {
      const fallback = createSellerProductsSeed(sellerSession.sellerStoreId);

      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.sellerProducts) : null;
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        return resolveSellerProductsState(parsed, sellerStore, sellerSession.sellerStoreId);
      } catch {
        return fallback;
      }
    });
    const [sellerOrders, setSellerOrders] = useState(() => {
      const fallback = createSellerOrdersSeed(sellerSession.sellerStoreId);

      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.sellerOrders) : null;
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        return normalizeSellerOrdersList(parsed, sellerSession.sellerStoreId);
      } catch {
        return fallback;
      }
    });
    const [sellerNotificationsState, setSellerNotificationsState] = useState(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.sellerNotifications) : null;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return normalizeSellerNotificationsList(parsed);
      } catch {
        return [];
      }
    });
    const [buyerOrders, setBuyerOrders] = useState(() => {
      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.buyerOrders, buyerSession);
        if (!raw) return [];
        const parsed = raw;
        return normalizeBuyerOrdersList(parsed);
      } catch {
        return [];
      }
    });
    const [orderChats, setOrderChats] = useState(() => {
      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.orderChats, buyerSession);
        if (!raw) return {};
        return normalizeOrderChatsMap(raw);
      } catch {
        return {};
      }
    });
    const [marketplacePartnerCatalog, setMarketplacePartnerCatalog] = useState(() => {
      try {
        const raw =
          typeof window !== "undefined" && window.localStorage
            ? window.localStorage.getItem(drivexStorageKeys.marketplaceCatalog)
            : null;
        if (!raw) {
          return {
            stores: [],
            products: []
          };
        }
        return normalizeMarketplacePartnerCatalog(JSON.parse(raw));
      } catch {
        return {
          stores: [],
          products: []
        };
      }
    });
    const [sellerBackendStatus, setSellerBackendStatus] = useState(() =>
      sellerBackend && typeof sellerBackend.getStatus === "function"
        ? sellerBackend.getStatus()
        : {
            mode: "local",
            configured: false,
            storageKeys: {},
            eventName: ""
          }
    );
    const [sellerBackendReady, setSellerBackendReady] = useState(() => !sellerBackend);
    const [sellerRouteBridge, setSellerRouteBridge] = useState(null);
    const [pendingSellerRedirect, setPendingSellerRedirect] = useState(() => readSellerPendingRoute());
    const [sellerRegistrationDraftState, setSellerRegistrationDraftState] = useState(() =>
      normalizePath(path) === "/seller/register" ? createSellerRegistrationDraft(Date.now()) : null
    );
    const [serviceSession, setServiceSession] = useState(() => {
      const fallback = createDefaultServiceSession();

      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceSession) : null;
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return normalizeServiceSession(parsed);
      } catch {
        return fallback;
      }
    });
    const [serviceProfile, setServiceProfile] = useState(() => {
      const fallback = createServiceProfileSeed(serviceSession);

      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceProfile) : null;
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return normalizeServiceProfile(parsed, serviceSession);
      } catch {
        return fallback;
      }
    });
    const [serviceAuth, setServiceAuth] = useState(() => {
      const fallback = createDefaultServiceAuthState();

      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceAuth) : null;
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return normalizeServiceAuthState(parsed);
      } catch {
        return fallback;
      }
    });
    const [serviceCenter, setServiceCenter] = useState(() => {
      const fallback = createServiceCenterSeed(serviceSession.serviceCenterId);

      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceCenter) : null;
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return normalizeServiceCenter(parsed, serviceSession.serviceCenterId);
      } catch {
        return fallback;
      }
    });
    const [serviceClients, setServiceClients] = useState(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceClients) : null;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return normalizeServiceClientsList(parsed, serviceSession.serviceCenterId).filter((item) => !isDemoServiceClient(item));
      } catch {
        return [];
      }
    });
    const [serviceOrders, setServiceOrders] = useState(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceOrders) : null;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return normalizeServiceRepairOrdersList(parsed, serviceSession.serviceCenterId).filter((item) => !isDemoServiceOrder(item));
      } catch {
        return [];
      }
    });
    const [serviceInventory, setServiceInventory] = useState(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceInventory) : null;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return normalizeServiceInventoryList(parsed, serviceSession.serviceCenterId)
          .filter((item) => !isDemoServiceInventoryItem(item));
      } catch {
        return [];
      }
    });
    const [serviceFinance, setServiceFinance] = useState(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceFinance) : null;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return normalizeServiceFinanceList(parsed, serviceSession.serviceCenterId).filter((item) => !isDemoServiceFinanceEntry(item));
      } catch {
        return [];
      }
    });
    const [serviceAppointments, setServiceAppointments] = useState(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceAppointments) : null;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return normalizeServiceAppointmentsList(parsed, serviceSession.serviceCenterId)
          .filter((item) => !isDemoServiceAppointment(item));
      } catch {
        return [];
      }
    });
    const [serviceRequests, setServiceRequests] = useState(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.serviceRequests) : null;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return normalizeServiceRequestsList(parsed);
      } catch {
        return [];
      }
    });
    const [sharedServiceCenters, setSharedServiceCenters] = useState([]);
    const serviceCenterMediaKey = useMemo(
      () => getServiceCenterMediaStorageKey(serviceSession.serviceCenterId),
      [serviceSession.serviceCenterId]
    );
    const serviceCenterMediaToken = useMemo(
      () => JSON.stringify(extractServiceCenterMedia(serviceCenter, serviceSession.serviceCenterId)),
      [serviceCenter, serviceSession.serviceCenterId]
    );
    const [serviceRegistrationDraftState, setServiceRegistrationDraftState] = useState(() =>
      normalizePath(path) === "/service-crm/register" ? createServiceRegistrationDraft(Date.now()) : null
    );

    const applySharedStateUpdate = useCallback(
      (key, nextValue) => {
        if (key === drivexStorageKeys.profile) {
          setProfile((prev) => {
            const fallback = createDefaultBuyerProfile();
            const source = nextValue && typeof nextValue === "object" ? nextValue : {};
            const avatarRaw = typeof source.avatar === "string" ? source.avatar.trim() : "";
            return {
              name: String(source.name || fallback.name).trim() || fallback.name,
              phone: String(source.phone || fallback.phone).trim() || fallback.phone,
              email: String(source.email || fallback.email).trim() || fallback.email,
              avatar:
                avatarRaw && avatarRaw.startsWith("data:image/") && avatarRaw.length <= 500000
                  ? avatarRaw
                  : prev.avatar || ""
            };
          });
          return;
        }

        if (key === drivexStorageKeys.activeCar) {
          setActiveCarId(ensureCarId(nextValue));
          return;
        }

        if (key === drivexStorageKeys.buyerGarage) {
          setUserGarageCars(normalizeGarageList(nextValue));
          return;
        }

        if (key === drivexStorageKeys.savedPlaces) {
          setUserSavedPlaces(normalizeSavedPlacesList(nextValue));
          return;
        }

        if (key === drivexStorageKeys.documents) {
          const source = nextValue && typeof nextValue === "object" ? nextValue : createEmptyDocumentsState();
          const next = createEmptyDocumentsState(garageCars);
          next.license = normalizeDocumentItem(source.license, "Права");
          const sourceCars = source.cars && typeof source.cars === "object" ? source.cars : {};
          const carIds = new Set([...Object.keys(sourceCars), ...garageCars.map((car) => car.id)]);
          for (const carId of carIds) {
            const car = garageCars.find((item) => item.id === carId);
            const fallbackRegistrationName = car ? `Техпаспорт ${car.name}` : "Техпаспорт";
            const fallbackInspectionName = car ? `Техосмотр ${car.name}` : "Техосмотр";
            const carDocs = sourceCars[carId] && typeof sourceCars[carId] === "object" ? sourceCars[carId] : {};
            next.cars[carId] = {
              registration: normalizeDocumentItem(carDocs.registration, fallbackRegistrationName),
              inspection: normalizeDocumentItem(carDocs.inspection, fallbackInspectionName)
            };
          }
          console.debug && console.debug("[applySharedStateSnapshot] apply documents", { keys: Object.keys(next.cars || {}), sourceKeys: Object.keys(sourceCars || {}) });
          setDocuments(next);
          return;
        }

        if (key === drivexStorageKeys.maintenance) {
          const source = nextValue && typeof nextValue === "object" ? nextValue : createEmptyMaintenanceState();
          const next = createEmptyMaintenanceState();
          for (const car of garageCars) {
            const carState = source.cars && source.cars[car.id] && typeof source.cars[car.id] === "object"
              ? source.cars[car.id]
              : {};
            next.cars[car.id] = {
              records: (Array.isArray(carState.records) ? carState.records : [])
                .map((item) => normalizeMaintenanceRecord(item))
                .filter(Boolean)
                .slice(0, 200),
              inspection: normalizeInspection(carState.inspection)
            };
          }
          setMaintenance(next);
          return;
        }

        if (key === drivexStorageKeys.cart) {
          const normalizedCart = {};
          for (const [cartKey, cartValue] of Object.entries(nextValue || {})) {
            const parsedKey = parseMarketCartKey(cartKey);
            const qty = Math.floor(Number(cartValue));
            const safeKey = parsedKey.cartKey || createMarketCartKey(parsedKey.productId, parsedKey.storeId);
            if (!safeKey || !parsedKey.productId) continue;
            if (!Number.isFinite(qty) || qty <= 0) continue;
            normalizedCart[safeKey] = qty;
          }
          setCart(normalizedCart);
          return;
        }

        if (key === drivexStorageKeys.sellerSession) {
          setSellerSession(normalizeSellerSession(nextValue));
          return;
        }

        if (key === drivexStorageKeys.sellerProfile) {
          setSellerProfile(normalizeSellerProfile(nextValue, sellerSession));
          return;
        }

        if (key === drivexStorageKeys.sellerStore) {
          setSellerStore(normalizeSellerStore(nextValue, sellerSession.sellerStoreId));
          return;
        }

        if (key === drivexStorageKeys.sellerProducts) {
          setSellerProducts(
            nextValue === null
              ? createSellerProductsSeed(sellerSession.sellerStoreId)
              : resolveSellerProductsState(nextValue, sellerStore, sellerSession.sellerStoreId)
          );
          return;
        }

        if (key === drivexStorageKeys.sellerOrders) {
          setSellerOrders(
            nextValue === null
              ? createSellerOrdersSeed(sellerSession.sellerStoreId)
              : normalizeSellerOrdersList(nextValue, sellerSession.sellerStoreId)
          );
          return;
        }

        if (key === drivexStorageKeys.sellerNotifications) {
          setSellerNotificationsState(nextValue === null ? [] : normalizeSellerNotificationsList(nextValue));
          return;
        }

        if (key === drivexStorageKeys.serviceSession) {
          setServiceSession(normalizeServiceSession(nextValue));
          return;
        }

        if (key === drivexStorageKeys.serviceProfile) {
          setServiceProfile(normalizeServiceProfile(nextValue, serviceSession));
          return;
        }

        if (key === drivexStorageKeys.serviceAuth) {
          setServiceAuth(nextValue === null ? createDefaultServiceAuthState() : normalizeServiceAuthState(nextValue));
          return;
        }

        if (key === drivexStorageKeys.serviceCenter) {
          setServiceCenter(normalizeServiceCenter(nextValue, serviceSession.serviceCenterId));
          return;
        }

        if (key === drivexStorageKeys.serviceClients) {
          setServiceClients(
            nextValue === null
              ? []
              : normalizeServiceClientsList(nextValue, serviceSession.serviceCenterId).filter((item) => !isDemoServiceClient(item))
          );
          return;
        }

        if (key === drivexStorageKeys.serviceOrders) {
          setServiceOrders(
            nextValue === null
              ? []
              : normalizeServiceRepairOrdersList(nextValue, serviceSession.serviceCenterId).filter((item) => !isDemoServiceOrder(item))
          );
          return;
        }

        if (key === drivexStorageKeys.serviceInventory) {
          setServiceInventory(
            nextValue === null
              ? []
              : normalizeServiceInventoryList(nextValue, serviceSession.serviceCenterId)
                  .filter((item) => !isDemoServiceInventoryItem(item))
          );
          return;
        }

        if (key === drivexStorageKeys.serviceFinance) {
          setServiceFinance(
            nextValue === null
              ? []
              : normalizeServiceFinanceList(nextValue, serviceSession.serviceCenterId).filter((item) => !isDemoServiceFinanceEntry(item))
          );
          return;
        }

        if (key === drivexStorageKeys.serviceAppointments) {
          setServiceAppointments(
            nextValue === null
              ? []
              : normalizeServiceAppointmentsList(nextValue, serviceSession.serviceCenterId)
                  .filter((item) => !isDemoServiceAppointment(item))
          );
          return;
        }

        if (key === drivexStorageKeys.serviceRequests) {
          setServiceRequests(nextValue === null ? [] : normalizeServiceRequestsList(nextValue));
          return;
        }

        if (key === drivexStorageKeys.buyerOrders) {
          setBuyerOrders(nextValue === null ? [] : normalizeBuyerOrdersList(nextValue));
          return;
        }

        if (key === drivexStorageKeys.orderChats) {
          setOrderChats(nextValue === null ? {} : normalizeOrderChatsMap(nextValue));
          return;
        }

        if (key === drivexStorageKeys.marketplaceCatalog) {
          setMarketplacePartnerCatalog(normalizeMarketplacePartnerCatalog(nextValue));
        }
      },
      [sellerSession, sellerSession.sellerStoreId, sellerStore, serviceSession, serviceSession.serviceCenterId]
    );

    const pushSharedState = useCallback((key, nextValue) => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          if (nextValue === null) {
            window.localStorage.removeItem(key);
          } else {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          }
        }
      } catch {
        // ignore storage sync failures here; state remains in-memory
      }

      try {
        if (sellerSyncChannelRef.current) {
          sellerSyncChannelRef.current.postMessage({
            key,
            value: nextValue,
            sentAt: Date.now()
          });
        }
      } catch {
        // ignore broadcast failures on unsupported browsers
      }

      saveSharedAppState(key, nextValue).catch(() => {
        // Серверная синхронизация не должна ломать локальную работу приложения.
      });
    }, []);

    const pushBuyerState = useCallback(
      (key, nextValue) => {
        try {
          recentBuyerSavesRef.current = recentBuyerSavesRef.current || {};
          recentBuyerSavesRef.current[key] = Date.now();
        } catch {
          // ignore
        }
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            console.debug && console.debug("[pushBuyerState]", { key, buyerId: buyerSession?.id || null });
            if (buyerSession?.authenticated && buyerSession.id) {
              if (nextValue === null) {
                writeBuyerLocalStorage(key, null, buyerSession);
              } else {
                writeBuyerLocalStorage(key, nextValue, buyerSession);
              }
            } else {
              if (nextValue === null) {
                window.localStorage.removeItem(key);
              } else {
                window.localStorage.setItem(key, JSON.stringify(nextValue));
              }
            }
          }
        } catch {
          // local cache is best effort
        }

        if (buyerSession?.authenticated && buyerStateReadyRef.current) {
          saveBuyerAppState(buyerSession, key, nextValue).catch(() => {
            // Supabase sync should not break the current in-memory session.
          });
        }
      },
      [buyerSession]
    );

    const applySharedStateSnapshot = useCallback(
      (sharedState, options = {}) => {
        if (!sharedState || typeof sharedState !== "object") return;
        const onlyNewer = Boolean(options.onlyNewer);
        const onlyLiveKeys = Boolean(options.onlyLiveKeys);
        const includeBuyerPersonal = Boolean(options.includeBuyerPersonal);

        for (const [key, entry] of Object.entries(sharedState)) {
          if (!includeBuyerPersonal && buyerPersonalStorageKeys.has(key)) continue;
          if (onlyLiveKeys && !liveSharedAppStateKeys.has(key)) continue;
          const value = entry && typeof entry === "object" && Object.prototype.hasOwnProperty.call(entry, "value")
            ? entry.value
            : entry;
          if (value === undefined) continue;

          const updatedAt = entry && typeof entry === "object" && typeof entry.updatedAt === "string"
            ? entry.updatedAt
            : "";
          const previousUpdatedAt = sharedAppStateUpdatedAtRef.current[key] || "";
          if (
            onlyNewer &&
            updatedAt &&
            previousUpdatedAt &&
            Date.parse(updatedAt) <= Date.parse(previousUpdatedAt)
          ) {
            continue;
          }

          if (updatedAt) {
            sharedAppStateUpdatedAtRef.current[key] = updatedAt;
          }

          const recent = (recentBuyerSavesRef.current && recentBuyerSavesRef.current[key]) || 0;
          const skipRecent = buyerPersonalStorageKeys.has(key) && Date.now() - recent < 5000; // 5s grace to avoid race with recent local save
          if (skipRecent) {
            console.debug && console.debug("[applySharedStateSnapshot] skip applying recent buyer key", { key });
            continue;
          }

          applySharedStateUpdate(key, value);
          try {
            if (typeof window !== "undefined" && window.localStorage) {
                if (buyerPersonalStorageKeys.has(key)) {
                  writeBuyerLocalStorage(key, value, buyerSession);
                } else {
                  window.localStorage.setItem(key, JSON.stringify(value));
                }
            }
          } catch {
            // ignore local cache write failures
          }
        }
      },
      [applySharedStateUpdate]
    );

    const applySellerBackendAppState = useCallback((appState) => {
      if (appState && typeof appState === "object") {
        setSellerBackendStatus((prev) => ({
          mode: appState.mode || prev.mode || "local",
          configured: Boolean(appState.configured),
          storageKeys: appState.storageKeys || prev.storageKeys || {},
          eventName: appState.eventName || prev.eventName || ""
        }));
      }

      const nextCatalog = appState?.catalog && typeof appState.catalog === "object" ? appState.catalog : null;
      const normalizedCatalog = normalizeMarketplacePartnerCatalog(nextCatalog);
      setMarketplacePartnerCatalog(normalizedCatalog);
      pushSharedState(drivexStorageKeys.marketplaceCatalog, normalizedCatalog);

      const nextSnapshot = resolveSellerBackendSnapshot(appState);
      const nextSession = nextSnapshot?.session || createDefaultSellerSession();
      setSellerSession(nextSession);

      if (nextSnapshot) {
        setSellerProfile(nextSnapshot.profile);
        setSellerStore(nextSnapshot.store);
        setSellerProducts(nextSnapshot.products);
        setSellerOrders(nextSnapshot.orders);
        setSellerNotificationsState(nextSnapshot.notifications);
      } else {
        setSellerProfile(createSellerProfileSeed(nextSession));
        setSellerStore(createSellerStoreSeed(nextSession.sellerStoreId));
        setSellerProducts([]);
        setSellerOrders([]);
        setSellerNotificationsState([]);
      }

      setSellerBackendReady(true);
      return nextSession;
    }, [pushSharedState]);

    const refreshSellerBackendState = useCallback(async () => {
      if (!sellerBackend || typeof sellerBackend.loadAppState !== "function") {
        setSellerBackendReady(true);
        return null;
      }

      const appState = await sellerBackend.loadAppState();
      applySellerBackendAppState(appState);
      return appState;
    }, [applySellerBackendAppState]);

    const runSellerBackendAction = useCallback(
      async (actionName, payload) => {
        if (!sellerBackend || typeof sellerBackend[actionName] !== "function") {
          return null;
        }

        const appState = await sellerBackend[actionName](payload);
        applySellerBackendAppState(appState);
        return appState;
      },
      [applySellerBackendAppState]
    );

    useEffect(() => {
      let cancelled = false;

      fetchSharedAppState()
        .then((sharedState) => {
          if (cancelled) return;
          applySharedStateSnapshot(sharedState);
        })
        .catch(() => {
          // Локальный режим остается рабочим, если общий сервер недоступен.
        })
        .finally(() => {
          if (!cancelled) sharedAppStateReadyRef.current = true;
        });

      return () => {
        cancelled = true;
      };
    }, [applySharedStateSnapshot]);

    useEffect(() => {
      let cancelled = false;

      const pullLiveState = () => {
        fetchSharedAppState()
          .then((sharedState) => {
            if (cancelled) return;
            applySharedStateSnapshot(sharedState, {
              onlyNewer: true,
              onlyLiveKeys: true
            });
          })
          .catch(() => {
            // Следующий polling попробует снова.
          });
      };

      const intervalId = window.setInterval(pullLiveState, 3500);
      const handleFocus = () => pullLiveState();
      const handleVisibility = () => {
        if (!document.hidden) pullLiveState();
      };

      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleVisibility);

      return () => {
        cancelled = true;
        window.clearInterval(intervalId);
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }, [applySharedStateSnapshot]);

    // ─── Загрузка живых данных из Supabase ───────────────────────────────
    useEffect(() => {
      const supa = window.DrivexSupabaseData;
      if (!supa) return;
      let cancelled = false;

      // Загружаем сервисные центры
      supa.loadServiceCenters({ limit: 60 }).then((services) => {
        if (cancelled || !services) return;
        _liveNearbyServices = services;
        _liveRecommendedServices = services.slice(0, 3);
      }).catch(() => {});

      // Загружаем товары маркетплейса
      supa.loadProducts({ pageSize: 48 }).then((prods) => {
        if (cancelled || !prods || !prods.length) return;
        _liveMarketProducts = prods;
        // Обновляем runtime так чтобы маркетплейс сразу показал живые товары
        if (typeof setMarketplaceRuntime === "function") {
          const liveStores = [];
          const storeIds = new Set();
          prods.forEach((p) => { if (p.storeId && !storeIds.has(p.storeId)) { storeIds.add(p.storeId); liveStores.push({ id: p.storeId, storeId: p.storeId, name: p.storeId }); } });
          setMarketplaceRuntime({ products: [...prods, ...marketplaceData.products.filter((p) => !storeIds.has(p.storeId))], stores: liveStores.length ? liveStores : undefined });
        }
      }).catch(() => {});

      return () => { cancelled = true; };
    }, []);

    const applyBuyerSession = useCallback((session) => {
      const nextSession = normalizeBuyerSession(session);
      if (nextSession.authenticated && nextSession.id !== buyerSession?.id) {
        buyerStateReadyRef.current = false;
        setProfile(createDefaultBuyerProfile());
        setUserGarageCars([]);
        setActiveCarId("");
        setUserSavedPlaces([]);
        setDocuments(createEmptyDocumentsState());
        setMaintenance(createEmptyMaintenanceState());
        setBuyerOrders([]);
        setOrderChats({});
        setCart({});

        // При новом Supabase-логине тянем профиль из БД
        if (nextSession.provider === "supabase") {
          fetchProfileFromSupabase(nextSession).then((remoteProfile) => {
            if (remoteProfile) {
              setProfile((prev) => normalizeBuyerProfile({ ...prev, ...remoteProfile }));
            }
          }).catch(() => {});
        }
      }
      setBuyerSession(nextSession);
      setProfile((prev) => buyerSessionToProfile(nextSession, prev));
      return nextSession;
    }, [buyerSession?.id]);

    const applyBuyerAppState = useCallback(
      (state) => {
        if (!state || typeof state !== "object") return;
        applySharedStateSnapshot(state, { includeBuyerPersonal: true });
        buyerStateReadyRef.current = true;
      },
      [applySharedStateSnapshot]
    );

    useEffect(() => {
      const client = getSupabaseClient();
      setBuyerAuthStatus(getBuyerAuthStatus());
      if (!client) return;

      let cancelled = false;
      client.auth
        .getSession()
        .then(({ data }) => {
          if (cancelled || !data?.session?.user) return;
          const session = applyBuyerSession(makeBuyerSessionFromSupabaseUser(data.session.user));
          fetchBuyerAppState(session).then((state) => !cancelled && applyBuyerAppState(state)).catch(() => {});
        })
        .catch(() => {});

      const subscription = client.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        if (session?.user) {
          const nextSession = applyBuyerSession(makeBuyerSessionFromSupabaseUser(session.user));
          fetchBuyerAppState(nextSession).then((state) => !cancelled && applyBuyerAppState(state)).catch(() => {});
        } else {
          buyerStateReadyRef.current = !getSupabaseClient();
          setBuyerSession(createEmptyBuyerSession());
        }
      });

      return () => {
        cancelled = true;
        const sub = subscription?.data?.subscription || subscription?.subscription;
        if (sub && typeof sub.unsubscribe === "function") sub.unsubscribe();
      };
    }, [applyBuyerAppState, applyBuyerSession]);

    useEffect(() => {
      try {
        if (window.localStorage) {
          if (buyerSession?.authenticated) {
            window.localStorage.setItem(drivexStorageKeys.buyerSession, JSON.stringify(buyerSession));
          } else {
            window.localStorage.removeItem(drivexStorageKeys.buyerSession);
          }
        }
      } catch {
        // ignore buyer session persistence errors
      }
    }, [buyerSession]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.profile, profile);
    }, [profile, pushBuyerState]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.buyerGarage, userGarageCars);
    }, [pushBuyerState, userGarageCars]);

    useEffect(() => {
      const currentExists = userGarageCars.some((car) => car.id === activeCarId);
      if (!currentExists) {
        setActiveCarId(userGarageCars[0]?.id || "");
      }

      setDocuments((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyDocumentsState();
        const nextCars = {};
        for (const car of userGarageCars) {
          const carDocs = current.cars && current.cars[car.id] ? current.cars[car.id] : {};
          nextCars[car.id] = {
            registration: normalizeDocumentItem(carDocs.registration, `Техпаспорт ${car.name}`),
            inspection: normalizeDocumentItem(carDocs.inspection, `Техосмотр ${car.name}`)
          };
        }
        return { license: normalizeDocumentItem(current.license, "Права"), cars: nextCars };
      });

      setMaintenance((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyMaintenanceState();
        const nextCars = {};
        for (const car of userGarageCars) {
          const carState = current.cars && current.cars[car.id] ? current.cars[car.id] : {};
          nextCars[car.id] = {
            records: (Array.isArray(carState.records) ? carState.records : [])
              .map((item) => normalizeMaintenanceRecord(item))
              .filter(Boolean),
            inspection: normalizeInspection(carState.inspection)
          };
        }
        return { cars: nextCars };
      });
    }, [activeCarId, userGarageCars]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.savedPlaces, userSavedPlaces);
    }, [pushBuyerState, userSavedPlaces]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.activeCar, activeCarId);
    }, [activeCarId, pushBuyerState]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.documents, documents);
    }, [documents, pushBuyerState]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.maintenance, maintenance);
    }, [maintenance, pushBuyerState]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.sellerSession, JSON.stringify(sellerSession));
      } catch {
        // ignore
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.sellerSession, sellerSession).catch(() => {});
    }, [sellerSession]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.sellerProfile, JSON.stringify(sellerProfile));
      } catch {
        toast.push("Не удалось сохранить seller профиль");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.sellerProfile, sellerProfile).catch(() => {});
    }, [sellerProfile, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.sellerStore, JSON.stringify(sellerStore));
      } catch {
        toast.push("Не удалось сохранить настройки seller магазина");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.sellerStore, sellerStore).catch(() => {});
    }, [sellerStore, toast]);

    useEffect(() => {
      const compactProducts = compactSellerProductsForSync(sellerProducts, sellerSession.sellerStoreId);
      try {
        window.localStorage &&
          window.localStorage.setItem(
            drivexStorageKeys.sellerProducts,
            JSON.stringify(compactProducts)
          );
      } catch {
        toast.push("Не удалось сохранить seller товары");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.sellerProducts, compactProducts).catch(() => {});
    }, [sellerProducts, sellerSession.sellerStoreId, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.sellerOrders, JSON.stringify(sellerOrders));
      } catch {
        toast.push("Не удалось сохранить seller заказы");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.sellerOrders, sellerOrders).catch(() => {});
    }, [sellerOrders, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(
            drivexStorageKeys.sellerNotifications,
            JSON.stringify(sellerNotificationsState)
          );
      } catch {
        toast.push("Не удалось сохранить seller уведомления");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.sellerNotifications, sellerNotificationsState).catch(() => {});
    }, [sellerNotificationsState, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.serviceSession, JSON.stringify(serviceSession));
      } catch {
        // ignore
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceSession, serviceSession).catch(() => {});
    }, [serviceSession]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.serviceProfile, JSON.stringify(serviceProfile));
      } catch {
        toast.push("Не удалось сохранить профиль сервиса");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceProfile, serviceProfile).catch(() => {});
    }, [serviceProfile, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.serviceAuth, JSON.stringify(serviceAuth));
      } catch {
        // ignore
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceAuth, serviceAuth).catch(() => {});
    }, [serviceAuth]);

    useEffect(() => {
      const persisted = persistServiceCenterToLocalStorage(serviceCenter, serviceSession.serviceCenterId);
      if (!persisted.ok) {
        toast.push("Не удалось сохранить карточку сервиса");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceCenter, serviceCenter).catch(() => {});
    }, [serviceCenter, serviceSession.serviceCenterId, toast]);

    useEffect(() => {
      let cancelled = false;
      if (!canUseIndexedDbStorage()) return undefined;

      readDrivexMediaValue(serviceCenterMediaKey).then((storedMedia) => {
        if (cancelled || !storedMedia || typeof storedMedia !== "object") return;

        const nextGallery = normalizeServiceGalleryList(storedMedia.gallery);

        setServiceCenter((prev) => {
          const currentCenter = normalizeServiceCenter(prev, serviceSession.serviceCenterId);
          const nextCoverImage = currentCenter.coverImage || normalizeServiceImageAsset(storedMedia.coverImage);
          const currentGalleryToken = JSON.stringify(normalizeServiceGalleryList(currentCenter.gallery));
          const nextGalleryToken = JSON.stringify(nextGallery);

          if (currentCenter.coverImage === nextCoverImage && currentGalleryToken === nextGalleryToken) {
            return prev;
          }

          return normalizeServiceCenter(
            {
              ...currentCenter,
              coverImage: nextCoverImage,
              gallery: nextGallery
            },
            serviceSession.serviceCenterId
          );
        });
      });

      return () => {
        cancelled = true;
      };
    }, [serviceCenterMediaKey, serviceSession.serviceCenterId]);

    useEffect(() => {
      let cancelled = false;
      if (!canUseIndexedDbStorage()) return undefined;

      const mediaPayload = extractServiceCenterMedia(serviceCenter, serviceSession.serviceCenterId);
      writeDrivexMediaValue(serviceCenterMediaKey, mediaPayload).then((saved) => {
        const hasMedia = Boolean(mediaPayload.coverImage || mediaPayload.gallery.length);
        if (!saved && !cancelled && hasMedia) {
          toast.push("Не удалось сохранить фото сервиса");
        }
      });

      return () => {
        cancelled = true;
      };
    }, [serviceCenterMediaKey, serviceCenterMediaToken, serviceSession.serviceCenterId, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.serviceClients, JSON.stringify(serviceClients));
      } catch {
        toast.push("Не удалось сохранить базу клиентов сервиса");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceClients, serviceClients).catch(() => {});
    }, [serviceClients, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.serviceOrders, JSON.stringify(serviceOrders));
      } catch {
        toast.push("Не удалось сохранить ремонты сервиса");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceOrders, serviceOrders).catch(() => {});
    }, [serviceOrders, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.serviceInventory, JSON.stringify(serviceInventory));
      } catch {
        toast.push("Не удалось сохранить склад сервиса");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceInventory, serviceInventory).catch(() => {});
    }, [serviceInventory, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.serviceFinance, JSON.stringify(serviceFinance));
      } catch {
        toast.push("Не удалось сохранить финансы сервиса");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceFinance, serviceFinance).catch(() => {});
    }, [serviceFinance, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.serviceAppointments, JSON.stringify(serviceAppointments));
      } catch {
        toast.push("Не удалось сохранить расписание сервиса");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceAppointments, serviceAppointments).catch(() => {});
    }, [serviceAppointments, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.serviceRequests, JSON.stringify(serviceRequests));
      } catch {
        toast.push("Не удалось сохранить записи в сервис");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.serviceRequests, serviceRequests).catch(() => {});
    }, [serviceRequests, toast]);

    useEffect(() => {
      let cancelled = false;

      fetchSharedServiceCenters()
        .then((centers) => {
          if (!cancelled) setSharedServiceCenters(centers);
        })
        .catch(() => {
          if (!cancelled) {
            // Серверная синхронизация не критична для локального запуска.
          }
        });

      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      const safeCenter = normalizeServiceCenter(serviceCenter, serviceSession.serviceCenterId);
      if (!safeCenter.registrationCompleted || !safeCenter.name || !safeCenter.serviceType || !safeCenter.address) {
        return undefined;
      }

      const timer = window.setTimeout(() => {
        saveSharedServiceCenter(safeCenter)
          .then((savedCenter) => {
            setSharedServiceCenters((prev) => mergeServiceCenterList(prev, savedCenter));
          })
          .catch(() => {
            // Локальная CRM остаётся рабочей, даже если общий сервер временно недоступен.
          });
      }, 700);

      return () => window.clearTimeout(timer);
    }, [serviceCenter, serviceSession.serviceCenterId]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.buyerOrders, buyerOrders);
    }, [buyerOrders, pushBuyerState]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.orderChats, orderChats);
    }, [orderChats, pushBuyerState]);

    useEffect(() => {
      const normalizedCatalog = normalizeMarketplacePartnerCatalog(marketplacePartnerCatalog);
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.marketplaceCatalog, JSON.stringify(normalizedCatalog));
      } catch {
        toast.push("Не удалось сохранить маркет");
      }
      if (sharedAppStateReadyRef.current) saveSharedAppState(drivexStorageKeys.marketplaceCatalog, normalizedCatalog).catch(() => {});
    }, [marketplacePartnerCatalog, toast]);

    useEffect(() => {
      let cancelled = false;

      (async () => {
        try {
          const appState = await refreshSellerBackendState();
          if (!cancelled && appState && sellerBackend && typeof sellerBackend.getStatus === "function") {
            setSellerBackendStatus(sellerBackend.getStatus());
          }
        } catch (error) {
          if (!cancelled) {
            toast.push("Не удалось загрузить seller CRM");
            setSellerBackendReady(true);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [refreshSellerBackendState, toast]);

    useEffect(() => {
      if (typeof window === "undefined" || !sellerBackendStatus.eventName) return undefined;

      const handleBackendSync = () => {
        refreshSellerBackendState().catch(() => {
          // ignore background sync errors
        });
      };

      window.addEventListener(sellerBackendStatus.eventName, handleBackendSync);
      return () => window.removeEventListener(sellerBackendStatus.eventName, handleBackendSync);
    }, [refreshSellerBackendState, sellerBackendStatus.eventName]);

    useEffect(() => {
      if (typeof window === "undefined" || typeof window.BroadcastChannel !== "function") return undefined;

      const channel = new window.BroadcastChannel(drivexSyncChannelName);
      sellerSyncChannelRef.current = channel;

      channel.onmessage = (event) => {
        const message = event?.data;
        if (!message || typeof message !== "object" || !message.key) return;
        applySharedStateUpdate(message.key, message.value);
      };

      return () => {
        if (sellerSyncChannelRef.current === channel) {
          sellerSyncChannelRef.current = null;
        }
        channel.close();
      };
    }, [applySharedStateUpdate]);

    useEffect(() => {
      const onStorage = (event) => {
        if (!event || !event.key) return;

        if (
          event.key === sellerBackendStatus.storageKeys?.db ||
          event.key === sellerBackendStatus.storageKeys?.auth ||
          event.key === sellerBackendStatus.storageKeys?.sync
        ) {
          refreshSellerBackendState().catch(() => {
            // ignore cross-tab backend sync issues
          });
          return;
        }

        try {
          if (!Object.values(drivexStorageKeys).includes(event.key)) return;
          const parsed = event.newValue ? JSON.parse(event.newValue) : null;
          applySharedStateUpdate(event.key, parsed);
        } catch {
          // ignore cross-tab sync issues
        }
      };

      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, [applySharedStateUpdate, refreshSellerBackendState, sellerBackendStatus.storageKeys]);

    const updateProfile = useCallback((next) => {
      if (!next || typeof next !== "object") return;

      setProfile((prev) => {
        const name = typeof next.name === "string" ? next.name : prev.name;
        const phone = typeof next.phone === "string" ? next.phone : prev.phone;
        const email = typeof next.email === "string" ? next.email : prev.email;
        const avatarCandidate = typeof next.avatar === "string" ? next.avatar : prev.avatar;
        const avatarRaw = String(avatarCandidate || "").trim();

        let avatar = "";
        if (avatarRaw) {
          if (avatarRaw.startsWith("https://") || avatarRaw.startsWith("http://")) {
            avatar = avatarRaw;
          } else if (avatarRaw.startsWith("data:image/") && avatarRaw.length <= 500000) {
            avatar = avatarRaw;
          } else {
            avatar = prev.avatar;
          }
        }

        const nextProfile = {
          name: String(name || "").trim() || prev.name,
          phone: String(phone || "").trim() || prev.phone,
          email: String(email || "").trim() || prev.email,
          avatar
        };

        pushBuyerState(drivexStorageKeys.profile, nextProfile);

        // Фоновый синк с Supabase — не блокируем UI
        syncProfileToSupabase(buyerSession, nextProfile).catch(() => {});

        return nextProfile;
      });
    }, [pushBuyerState, buyerSession]);

    const documentsTotalCount = useMemo(() => {
      return countDocumentsState(documents);
    }, [documents]);

    const selectActiveCar = useCallback((carId) => {
      setActiveCarId(ensureCarId(carId));
    }, []);

    const addGarageCar = useCallback((car) => {
      const normalized = normalizeGarageCar(car);
      if (!normalized) return;
      setUserGarageCars((prev) => {
        const current = normalizeGarageList(prev);
        return [normalized, ...current.filter((item) => item.id !== normalized.id)];
      });
      setActiveCarId(normalized.id);
    }, []);

    const removeGarageCar = useCallback((carId) => {
      const safeId = String(carId || "");
      if (!safeId) return;
      setUserGarageCars((prev) => normalizeGarageList(prev).filter((car) => car.id !== safeId));
    }, []);

    const addSavedPlace = useCallback((place) => {
      const normalized = normalizeSavedPlace(place);
      if (!normalized) return;
      setUserSavedPlaces((prev) => [normalized, ...normalizeSavedPlacesList(prev).filter((item) => item.id !== normalized.id)]);
    }, []);

    const removeSavedPlace = useCallback((placeId) => {
      const safeId = String(placeId || "");
      setUserSavedPlaces((prev) => normalizeSavedPlacesList(prev).filter((place) => place.id !== safeId));
    }, []);

    const setLicenseDocument = useCallback((doc) => {
      if (!doc || typeof doc !== "object") return;

      setDocuments((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyDocumentsState();
        const nextDoc = normalizeDocumentItem(doc, "Права");
        if (!nextDoc) return prev;

        const nextState = {
          ...current,
          license: nextDoc
        };

        console.debug && console.debug("[setLicenseDocument] saving license", { docId: nextDoc && nextDoc.id });
        pushBuyerState(drivexStorageKeys.documents, nextState);
        return nextState;
      });
    }, [pushBuyerState]);

    const removeLicenseDocument = useCallback(() => {
      setDocuments((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyDocumentsState();
        if (!current.license) return prev;

        const nextState = {
          ...current,
          license: null
        };

        pushBuyerState(drivexStorageKeys.documents, nextState);
        return nextState;
      });
    }, [pushBuyerState]);

    const setCarDocument = useCallback((carId, kind, doc) => {
      if (!carId || !kind) return;
      if (!doc || typeof doc !== "object") return;
      if (!["registration", "inspection"].includes(kind)) return;

      setDocuments((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyDocumentsState();
        const carDocs = current.cars && current.cars[carId] ? current.cars[carId] : { registration: null, inspection: null };
        const nextDoc = normalizeDocumentItem(
          doc,
          kind === "registration" ? "Техпаспорт" : "Техосмотр"
        );
        if (!nextDoc) return prev;

        const nextState = {
          ...current,
          cars: {
            ...(current.cars || {}),
            [carId]: {
              ...carDocs,
              [kind]: nextDoc
            }
          }
        };

        console.debug && console.debug("[setCarDocument] saving", { carId, kind, docId: nextDoc && nextDoc.id });
        pushBuyerState(drivexStorageKeys.documents, nextState);
        return nextState;
      });
    }, [pushBuyerState]);

    const removeCarDocument = useCallback((carId, kind) => {
      if (!carId || !kind) return;
      if (!["registration", "inspection"].includes(kind)) return;

      setDocuments((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyDocumentsState();
        const carDocs = current.cars && current.cars[carId] ? current.cars[carId] : null;
        if (!carDocs || !carDocs[kind]) return prev;

        const nextState = {
          ...current,
          cars: {
            ...(current.cars || {}),
            [carId]: {
              ...carDocs,
              [kind]: null
            }
          }
        };

        pushBuyerState(drivexStorageKeys.documents, nextState);
        return nextState;
      });
    }, [pushBuyerState]);

    const maintenanceSpentTotal = useMemo(() => {
      return getMaintenanceSpentTotal(maintenance);
    }, [maintenance]);

    const addMaintenanceRecord = useCallback((carId, record) => {
      if (!record || typeof record !== "object") return;
      const safeCarId = ensureCarId(carId);

      setMaintenance((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyMaintenanceState();
        const carState = getMaintenanceCarState(current, safeCarId);
        const nextRecord = normalizeMaintenanceRecord({
          ...record,
          id: typeof record.id === "string" ? record.id : genId("svc"),
          date: typeof record.date === "string" ? record.date.slice(0, 10) : toLocalISODate()
        });
        if (!nextRecord) return prev;

        return {
          ...current,
          cars: {
            ...(current.cars || {}),
            [safeCarId]: {
              ...carState,
              records: [nextRecord, ...carState.records].slice(0, 200)
            }
          }
        };
      });
    }, []);

    const upsertMaintenanceRecord = useCallback((carId, record) => {
      if (!record || typeof record !== "object") return;
      const safeCarId = ensureCarId(carId);
      const safeRecordId = String(record.id || "").trim() || genId("svc");

      setMaintenance((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyMaintenanceState();
        const carState = getMaintenanceCarState(current, safeCarId);
        const nextRecord = normalizeMaintenanceRecord({
          ...record,
          id: safeRecordId,
          date: typeof record.date === "string" ? record.date.slice(0, 10) : toLocalISODate()
        });
        if (!nextRecord) return prev;

        const existingIndex = carState.records.findIndex((item) => item && item.id === safeRecordId);
        const nextRecords =
          existingIndex >= 0
            ? carState.records.map((item, index) => (index === existingIndex ? nextRecord : item))
            : [nextRecord, ...carState.records];

        return {
          ...current,
          cars: {
            ...(current.cars || {}),
            [safeCarId]: {
              ...carState,
              records: nextRecords.slice(0, 200)
            }
          }
        };
      });
    }, []);

    const removeMaintenanceRecord = useCallback((carId, recordId) => {
      if (!recordId) return;
      const safeCarId = ensureCarId(carId);

      setMaintenance((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyMaintenanceState();
        const carState = getMaintenanceCarState(current, safeCarId);
        const nextRecords = carState.records.filter((record) => record && record.id !== recordId);
        if (nextRecords.length === carState.records.length) return prev;

        return {
          ...current,
          cars: {
            ...(current.cars || {}),
            [safeCarId]: {
              ...carState,
              records: nextRecords
            }
          }
        };
      });
    }, []);

    const setInspection = useCallback((carId, nextInspection) => {
      if (!nextInspection || typeof nextInspection !== "object") return;
      const safeCarId = ensureCarId(carId);

      setMaintenance((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyMaintenanceState();
        const carState = getMaintenanceCarState(current, safeCarId);

        return {
          ...current,
          cars: {
            ...(current.cars || {}),
            [safeCarId]: {
              ...carState,
              inspection: normalizeInspection(nextInspection)
            }
          }
        };
      });
    }, []);

    // Phone-based auth: после OTP-верификации сохраняем профиль и машину
    const loginByPhone = useCallback(
      async ({ phone, name, userId, car, _supabaseSession }) => {
        // Если передан готовый Supabase-session — просто применяем
        if (_supabaseSession) {
          applyBuyerSession(_supabaseSession);
          buyerStateReadyRef.current = true;
          navigateToHash("/");
          return _supabaseSession;
        }

        const client = getSupabaseClient();

        // Пробуем найти/создать пользователя в Supabase через phone OTP
        if (client) {
          // После verifyOtp сессия уже установлена — синхронизируем
          const { data } = await client.auth.getUser().catch(() => ({ data: {} }));
          const user = data?.user;

          // Загружаем актуальную роль из public.users (не из auth metadata!)
          let actualRole = "buyer";
          if (user?.id) {
            let userRow = null;
            try {
              const _r = await client.from("users").select("role,full_name,cars,active_car_id").eq("id", user.id);
              userRow = Array.isArray(_r.data) ? _r.data[0] : (_r.data || null);
            } catch(_) {}
            if (userRow?.role) actualRole = userRow.role;
            // Загружаем машины если они уже есть
            if (Array.isArray(userRow?.cars) && userRow.cars.length > 0) {
              setUserGarageCars(normalizeGarageList(userRow.cars));
              if (userRow.active_car_id) setActiveCarId(userRow.active_car_id);
            }
          }

          const session = user
            ? { ...makeBuyerSessionFromSupabaseUser(user), role: actualRole }
            : normalizeBuyerSession({
                id: userId || `phone-${phone.replace(/\D/g, "")}`,
                name: name || "",
                phone,
                role: actualRole,
                provider: "supabase",
                authenticated: true
              });

          // Сохраняем профиль в Supabase (только если role = buyer — не перезаписываем seller/partner)
          const supa = window.DrivexSupabaseData;
          if (supa && session.id && actualRole === "buyer") {
            await supa.upsertUserProfile(session.id, {
              full_name: name || session.name || "",
              phone,
              role: "buyer",
              cars: car ? [{ id: `car-${Date.now()}`, make: car.make, model: car.model, year: car.year }] : []
            }).catch(() => {});
          }

          applyBuyerSession(session);
          buyerStateReadyRef.current = true;

          // Добавляем машину в локальный гараж
          if (car && (car.make || car.model)) {
            const newCar = {
              id: `car-${Date.now()}`,
              make: car.make || "",
              model: car.model || "",
              year: String(car.year || ""),
              color: "",
              plate: "",
              addedAt: new Date().toISOString()
            };
            setUserGarageCars((prev) => [newCar, ...prev.filter((c) => c.id !== newCar.id)]);
            setActiveCarId(newCar.id);
          }

          // Запрашиваем разрешение на push-уведомления
          const push = window.DrivexPush;
          if (push && session.id) {
            push.registerTokenForUser(session.id).catch(() => {});
          }

          toast.push(`Добро пожаловать, ${name || session.name || "водитель"}!`);

          // Перенаправляем по роли
          if (actualRole === "seller") {
            navigateToHash("/seller");
          } else if (actualRole === "partner") {
            navigateToHash("/partner/login");
          } else {
            navigateToHash("/");
          }
          return session;
        }

        // Локальный fallback
        const localUser = {
          id: userId || `phone-${phone.replace(/\D/g, "")}`,
          name: name || "",
          phone,
          email: "",
          password: "",
          role: "buyer",
          createdAt: new Date().toISOString()
        };
        const localUsers = readLocalBuyerUsers();
        if (!localUsers.find((u) => u.id === localUser.id)) {
          writeLocalBuyerUsers([localUser, ...localUsers]);
        }
        const session = makeBuyerSessionFromLocalUser(localUser);
        applyBuyerSession(session);
        navigateToHash("/");
        return session;
      },
      [applyBuyerSession, toast]
    );

    const registerBuyer = useCallback(
      async (payload) => {
        const email = String(payload?.email || "").trim().toLowerCase();
        const password = String(payload?.password || "");
        const name = String(payload?.name || "").trim();
        const phone = String(payload?.phone || "").trim();

        // Phone auth без пароля — делегируем loginByPhone
        if (phone && !email) {
          return loginByPhone({ phone, name, userId: payload.userId, role: "buyer" });
        }
        if (!email || !password || !name) throw new Error("Заполните имя, email и пароль");

        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: payload.role || "buyer",
                full_name: name,
                phone
              }
            }
          });
          if (error) throw error;
          const session = makeBuyerSessionFromSupabaseUser(data?.user);
          // Создаём запись в public.users
          await client.from("users").upsert({
            id: data?.user?.id,
            full_name: name,
            phone,
            email,
            role: payload.role || "buyer"
          }, { onConflict: "id" }).catch(() => {});
          applyBuyerSession(session);
          buyerStateReadyRef.current = true;
          // Push токен
          const push = window.DrivexPush;
          if (push && session.id) push.registerTokenForUser(session.id).catch(() => {});
          navigateToHash("/profile");
          return session;
        }

        const users = readLocalBuyerUsers();
        const existing = users.find((user) => String(user.email || "").toLowerCase() === email);
        if (existing) throw new Error("Пользователь с таким email уже есть");

        const user = {
          id: makeBuyerId(),
          name,
          phone,
          email,
          password,
          role: payload.role || "buyer",
          createdAt: new Date().toISOString()
        };
        writeLocalBuyerUsers([user, ...users]);
        const session = makeBuyerSessionFromLocalUser(user);
        applyBuyerSession(session);
        navigateToHash("/profile");
        return session;
      },
      [applyBuyerSession, loginByPhone]
    );

    const loginBuyer = useCallback(
      async (payload) => {
        // Если это phone-based session из OTP — просто применяем
        if (payload?._supabaseSession) {
          return loginByPhone(payload);
        }

        const email = String(payload?.email || "").trim().toLowerCase();
        const password = String(payload?.password || "");
        if (!email || !password) throw new Error("Введите email и пароль");

        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const session = makeBuyerSessionFromSupabaseUser(data?.user);

          // Загружаем полный профиль из Supabase
          const supa = window.DrivexSupabaseData;
          if (supa && session.id) {
            const [userProfile, orders, docs] = await Promise.all([
              supa.loadUserProfile(session.id).catch(() => null),
              supa.loadBuyerOrders(session.id).catch(() => null),
              supa.loadDocuments(session.id).catch(() => null)
            ]);
            if (userProfile) {
              // Применяем имя, телефон из профиля
              session.name = userProfile.full_name || session.name;
              session.phone = userProfile.phone || session.phone;
              // Загружаем машины
              if (Array.isArray(userProfile.cars) && userProfile.cars.length) {
                setUserGarageCars(normalizeGarageList(userProfile.cars));
                if (userProfile.active_car_id) setActiveCarId(userProfile.active_car_id);
              }
            }
            if (orders) {
              setBuyerOrders(orders.map((o) => ({
                id: o.id, storeId: o.store_id, amount: Number(o.total_amount) || 0,
                status: o.status, date: String(o.created_at || "").slice(0, 10),
                items: Array.isArray(o.items) ? o.items : []
              })));
            }
          }

          applyBuyerSession(session);
          const state = await fetchBuyerAppState(session).catch(() => null);
          if (state) {
            applyBuyerAppState(state);
          } else {
            buyerStateReadyRef.current = true;
          }
          // Push токен
          const push = window.DrivexPush;
          if (push && session.id) push.registerTokenForUser(session.id).catch(() => {});
          navigateToHash("/");
          return session;
        }

        const user = readLocalBuyerUsers().find(
          (entry) => String(entry.email || "").toLowerCase() === email && String(entry.password || "") === password
        );
        if (!user) throw new Error("Неверный email или пароль");

        const session = makeBuyerSessionFromLocalUser(user);
        applyBuyerSession(session);
        navigateToHash("/");
        return session;
      },
      [applyBuyerAppState, applyBuyerSession, loginByPhone]
    );

    const logoutBuyer = useCallback(async () => {
      const client = getSupabaseClient();
      if (client) {
        await client.auth.signOut().catch(() => {});
      }
      clearBuyerLocalStorageForSession(buyerSession);
      try {
        if (window.localStorage) {
          window.localStorage.removeItem(drivexStorageKeys.buyerSession);
        }
      } catch {
        // ignore
      }
      setBuyerSession(createEmptyBuyerSession());
      buyerStateReadyRef.current = !getSupabaseClient();
      setProfile(createDefaultBuyerProfile());
      setUserGarageCars([]);
      setUserSavedPlaces([]);
      setActiveCarId("");
      setDocuments({ license: null, cars: {} });
      setMaintenance({ cars: {} });
      setBuyerOrders([]);
      setOrderChats({});
      setCart({});
      navigateToHash("/login");
      toast.push("Вы вышли из аккаунта");
    }, [buyerSession, toast]);

    const registerSeller = useCallback(
      async (payload) => {
        if (!payload || typeof payload !== "object") return;

        const resolvedStoreId = slugifyText(
          [payload?.store?.name, payload?.store?.city].filter(Boolean).join("-"),
          payload?.store?.id || createPendingSellerStoreId()
        );
        const draftSession = normalizeSellerSession({
          id: `seller-${resolvedStoreId}`,
          name: payload?.profile?.ownerFullName || "",
          email: payload?.profile?.email || "",
          role: "seller",
          sellerStoreId: resolvedStoreId
        });
        const draftProfile = normalizeSellerProfile(
          {
            ...payload.profile,
            registrationCompleted: true
          },
          draftSession
        );
        const draftStore = normalizeSellerStore(
          {
            ...payload.store,
            id: resolvedStoreId,
            ownerName: draftProfile.ownerFullName,
            phone: draftProfile.phone,
            registrationCompleted: true
          },
          resolvedStoreId
        );
        const draftSetupState = getSellerSetupState(draftStore, draftProfile);

        const backendPayload = {
          profile: draftProfile,
          store: {
            ...draftStore,
            id: resolvedStoreId,
            registrationCompleted: true,
            profileCompleted: draftSetupState.isProfileComplete,
            status: draftSetupState.isProfileComplete ? "active" : "pending-setup"
          }
        };

        try {
          const appState = await runSellerBackendAction("registerPartner", backendPayload);
          if (!appState) {
            throw new Error("Seller backend не ответил");
          }
          const nextSnapshot = resolveSellerBackendSnapshot(appState);
          const nextSetupState = nextSnapshot
            ? getSellerSetupState(nextSnapshot.store, nextSnapshot.profile)
            : null;
          if (!nextSnapshot || !isSellerRole(nextSnapshot.session.role)) {
            throw new Error("Регистрация сохранилась, но seller CRM не открылся. Попробуйте войти через партнёрский логин.");
          }
          const nextRoute =
            nextSetupState && nextSetupState.isProfileComplete ? "/seller/dashboard" : "/seller/store";
          persistSellerFrontendSnapshot(nextSnapshot);
          setSellerRouteBridge(nextSnapshot);
          setPendingSellerRedirect(nextRoute);
          writeSellerPendingRoute(nextRoute);
          setSellerRegistrationDraftState(null);
          toast.push("Магазин зарегистрирован");
        } catch (error) {
          toast.push(error?.message || "Не удалось зарегистрировать партнёра");
          throw error;
        }
      },
      [runSellerBackendAction, toast]
    );

    const partnerLogin = useCallback(
      async (payload) => {
        try {
          const appState = await runSellerBackendAction("loginPartner", payload);
          const nextSnapshot = resolveSellerBackendSnapshot(appState);
          const nextSetupState = nextSnapshot
            ? getSellerSetupState(nextSnapshot.store, nextSnapshot.profile)
            : null;
          if (!nextSnapshot || !isSellerRole(nextSnapshot.session.role)) {
            throw new Error("Партнёрский кабинет не подтвердил seller доступ");
          }
          const nextRoute =
            nextSetupState && nextSetupState.isProfileComplete ? "/seller/dashboard" : "/seller/store";
          persistSellerFrontendSnapshot(nextSnapshot);
          setSellerRouteBridge(nextSnapshot);
          setPendingSellerRedirect(nextRoute);
          writeSellerPendingRoute(nextRoute);
          toast.push("Вход выполнен");
        } catch (error) {
          toast.push(error?.message || "Не удалось войти");
          throw error;
        }
      },
      [runSellerBackendAction, toast]
    );

    const resetPartnerPassword = useCallback(
      async (payload) => {
        try {
          await runSellerBackendAction("resetPartnerPassword", payload);
        } catch (error) {
          toast.push(error?.message || "Не удалось обновить пароль");
          throw error;
        }
      },
      [runSellerBackendAction, toast]
    );

    const partnerLogout = useCallback(async () => {
      try {
        await runSellerBackendAction("logoutPartner");
        setSellerRouteBridge(null);
        setPendingSellerRedirect("");
        clearSellerPendingRoute();
        setSellerRegistrationDraftState(null);
        toast.push("Вы вышли из seller CRM");
        navigateToHash("/partner/login");
      } catch (error) {
        toast.push(error?.message || "Не удалось выйти");
      }
    }, [runSellerBackendAction, toast]);

    const completeSellerSetup = useCallback(async () => {
      const safeProfile = normalizeSellerProfile(
        {
          ...(sellerProfile || {}),
          registrationCompleted: true
        },
        sellerSession
      );
      const nextStore = normalizeSellerStore(
        {
          ...(sellerStore || {}),
          ownerName: safeProfile.ownerFullName,
          phone: safeProfile.phone,
          registrationCompleted: true,
          profileCompleted: true,
          status: "active",
          catalogInitialized: true
        },
        sellerSession.sellerStoreId
      );

      try {
        await runSellerBackendAction("saveStore", nextStore);
        toast.push("Seller setup завершён");
      } catch (error) {
        toast.push(error?.message || "Не удалось завершить onboarding");
        throw error;
      }
    }, [runSellerBackendAction, sellerProfile, sellerSession, sellerStore, toast]);

    const saveSellerProduct = useCallback(
      async (nextProduct) => {
        if (!nextProduct || typeof nextProduct !== "object") return;
        const normalizedProduct = normalizeSellerProduct(
          {
            ...nextProduct,
            storeId: sellerSession.sellerStoreId,
            status: nextProduct.status || "active"
          },
          sellerSession.sellerStoreId
        );

        try {
          await runSellerBackendAction("saveProduct", normalizedProduct);
          toast.push(nextProduct.id ? "Товар обновлён" : "Товар создан");
        } catch (error) {
          toast.push(error?.message || "Не удалось сохранить товар");
          throw error;
        }
      },
      [runSellerBackendAction, sellerSession.sellerStoreId, toast]
    );

    const deleteSellerProduct = useCallback(
      async (productId) => {
        if (!productId) return;
        try {
          await runSellerBackendAction("deleteProduct", productId);
          toast.push("Товар удалён");
        } catch (error) {
          toast.push(error?.message || "Не удалось удалить товар");
          throw error;
        }
      },
      [runSellerBackendAction, toast]
    );

    const updateSellerOrderStatus = useCallback(
      async (orderId, status) => {
        if (!orderId) return;
        if (!sellerOrderStatusOptions.some((item) => item.id === status)) return;

        const previousOrders = normalizeSellerOrdersList(sellerOrders, sellerSession.sellerStoreId);
        const currentOrder = previousOrders.find((order) => order.id === orderId) || null;
        if (!currentOrder) {
          toast.push("Заказ не найден");
          return;
        }
        if (status === currentOrder.status) return;
        if (!canTransitionSellerOrder(currentOrder, status)) {
          toast.push("Сначала переведите заказ на следующий логичный этап");
          return;
        }

        const previousBridge = sellerRouteBridge;
        const nextOrders = applySellerOrderStatus(previousOrders, orderId, status, sellerSession.sellerStoreId);
        const nextBridge =
          previousBridge && Array.isArray(previousBridge.orders)
            ? {
                ...previousBridge,
                orders: applySellerOrderStatus(
                  previousBridge.orders,
                  orderId,
                  status,
                  previousBridge.session?.sellerStoreId || sellerSession.sellerStoreId
                )
              }
            : previousBridge;

        setSellerOrders(nextOrders);
        if (nextBridge !== previousBridge) {
          setSellerRouteBridge(nextBridge);
        }

        try {
          await runSellerBackendAction("updateOrderStatus", { orderId, status });
        } catch (error) {
          setSellerOrders(previousOrders);
          if (nextBridge !== previousBridge) {
            setSellerRouteBridge(previousBridge);
          }
          toast.push(error?.message || "Не удалось обновить заказ");
          throw error;
        }
      },
      [runSellerBackendAction, sellerOrders, sellerRouteBridge, sellerSession.sellerStoreId, toast]
    );

    const sendOrderChatMessage = useCallback((orderId, senderRole, text) => {
      const safeOrderId = String(orderId || "").trim();
      const safeText = String(text || "").trim();
      if (!safeOrderId || !safeText) return;

      setOrderChats((prev) => appendOrderChatMessage(prev, safeOrderId, { senderRole, text: safeText }));
    }, []);

    const markOrderChatRead = useCallback((orderId, viewerRole) => {
      const safeOrderId = String(orderId || "").trim();
      if (!safeOrderId) return;

      setOrderChats((prev) => {
        if (!getOrderChatUnreadCount(prev, safeOrderId, viewerRole)) return prev;
        return markOrderChatAsRead(prev, safeOrderId, viewerRole);
      });
    }, []);

    const saveSellerStore = useCallback(
      async (nextStore) => {
        if (!nextStore || typeof nextStore !== "object") return;
        const safeProfile = normalizeSellerProfile(
          {
            ...sellerProfile,
            ownerFullName: nextStore.ownerName || sellerProfile?.ownerFullName,
            phone: nextStore.phone || sellerProfile?.phone,
            email: sellerProfile?.email
          },
          sellerSession
        );

        const mergedStore = normalizeSellerStore(
          {
            ...sellerStore,
            ...nextStore,
            ownerName: nextStore.ownerName || sellerStore?.ownerName || safeProfile.ownerFullName,
            phone: nextStore.phone || sellerStore?.phone || safeProfile.phone
          },
          sellerSession.sellerStoreId
        );
        const setupState = getSellerSetupState(
          {
            ...mergedStore,
            registrationCompleted: true
          },
          safeProfile
        );

        const backendPayload = {
          ...mergedStore,
          ownerName: safeProfile.ownerFullName,
          phone: safeProfile.phone,
          profileCompleted: setupState.isProfileComplete,
          registrationCompleted: true,
          status: setupState.isProfileComplete ? "active" : "pending-setup",
          catalogInitialized: true
        };

        try {
          await runSellerBackendAction("saveStore", backendPayload);
          toast.push("Магазин сохранён");
        } catch (error) {
          toast.push(error?.message || "Не удалось сохранить магазин");
          throw error;
        }
      },
      [runSellerBackendAction, sellerProfile, sellerSession, sellerStore, toast]
    );

    const activateSellerMode = useCallback(() => {
      setSellerRouteBridge(null);
      setPendingSellerRedirect("");
      clearSellerPendingRoute();
      setSellerRegistrationDraftState(null);
      toast.push("Открыта ссылка для регистрации продавца");
      navigateToHash("/partner/register");
    }, [toast]);

    const beginSellerRegistration = useCallback(() => {
      setSellerRouteBridge(null);
      setPendingSellerRedirect("");
      clearSellerPendingRoute();
      setSellerRegistrationDraftState(createSellerRegistrationDraft(Date.now()));
      toast.push("Форма регистрации открыта");
    }, [toast]);

    const beginServiceRegistration = useCallback(() => {
      setServiceRegistrationDraftState(createServiceRegistrationDraft(Date.now()));
      toast.push("Форма сервиса открыта");
      navigateToHash("/service-crm/register");
    }, [toast]);

    const registerServiceCrm = useCallback((payload) => {
      if (!payload || typeof payload !== "object") return;

      const resolvedCenterId = slugifyText(
        [payload?.center?.name, payload?.center?.city].filter(Boolean).join("-"),
        payload?.center?.id || `service-${Date.now()}`
      );
      const nextSession = normalizeServiceSession({
        id: `service-owner-${resolvedCenterId}`,
        name: payload?.profile?.ownerFullName || "",
        email: payload?.profile?.email || "",
        role: "service_owner",
        serviceCenterId: resolvedCenterId
      });
      const nextProfile = normalizeServiceProfile(
        {
          ...payload.profile,
          registrationCompleted: true
        },
        nextSession
      );
      const nextCenter = normalizeServiceCenter(
        {
          ...payload.center,
          id: resolvedCenterId,
          phone: payload?.center?.phone || nextProfile.phone,
          email: payload?.center?.email || nextProfile.email,
          registrationCompleted: true,
          status: "active"
        },
        resolvedCenterId
      );

      setServiceSession(nextSession);
      setServiceProfile(nextProfile);
      setServiceCenter(nextCenter);
      setServiceClients([]);
      setServiceOrders([]);
      setServiceInventory([]);
      setServiceFinance([]);
      setServiceAppointments([]);
      setServiceAuth({
        authenticated: true,
        lastLoginAt: new Date().toISOString()
      });
      setSharedServiceCenters((prev) => mergeServiceCenterList(prev, nextCenter));
      saveSharedServiceCenter(nextCenter)
        .then((savedCenter) => {
          setSharedServiceCenters((prev) => mergeServiceCenterList(prev, savedCenter));
        })
        .catch(() => {
          toast.push("Сервис сохранён на этом устройстве. Общая база временно недоступна");
        });
      setServiceRegistrationDraftState(null);
      toast.push("Service CRM готов");
      navigateToHash("/service-crm/dashboard");
    }, [toast]);

    const loginServiceCrm = useCallback(async (payload) => {
      const safePayload = payload && typeof payload === "object" ? payload : {};
      const identifier = String(
        safePayload.identifier || safePayload.email || safePayload.phone || ""
      ).trim();
      const password = String(safePayload.password || "");
      const safeProfile = normalizeServiceProfile(serviceProfile, serviceSession);
      const safeCenter = normalizeServiceCenter(serviceCenter, serviceSession.serviceCenterId);

      if (!identifier) {
        throw new Error("Введите email или телефон");
      }
      if (!password) {
        throw new Error("Введите пароль");
      }
      if (!safeProfile.registrationCompleted || !safeCenter.registrationCompleted) {
        throw new Error("Сначала зарегистрируйте сервис");
      }
      if (!safeProfile.password) {
        throw new Error("Для этого сервиса пароль ещё не задан");
      }

      const loweredIdentifier = identifier.toLowerCase();
      const phoneIdentifier = identifier.replace(/\D/g, "");
      const emailCandidates = [safeProfile.email, safeCenter.email]
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean);
      const phoneCandidates = [safeProfile.phone, safeCenter.phone]
        .map((item) => String(item || "").replace(/\D/g, ""))
        .filter(Boolean);
      const matched =
        emailCandidates.includes(loweredIdentifier) ||
        (phoneIdentifier ? phoneCandidates.includes(phoneIdentifier) : false);

      if (!matched) {
        throw new Error("Неверный email или телефон");
      }
      if (safeProfile.password !== password) {
        throw new Error("Неверный пароль");
      }

      setServiceAuth({
        authenticated: true,
        lastLoginAt: new Date().toISOString()
      });
      toast.push("Вы вошли в Service CRM");
      navigateToHash("/service-crm/dashboard");
    }, [serviceCenter, serviceProfile, serviceSession, toast]);

    const logoutServiceCrm = useCallback((options = {}) => {
      const shouldRedirect = options?.redirect !== false;
      const shouldNotify = options?.notify !== false;

      setServiceAuth(createDefaultServiceAuthState());
      if (shouldNotify) {
        toast.push("Вы вышли из Service CRM");
      }
      if (shouldRedirect) {
        navigateToHash("/service-crm/login");
      }
    }, [toast]);

    const saveServiceCenter = useCallback((nextCenter) => {
      if (!nextCenter || typeof nextCenter !== "object") return;

      const mergedCenter = normalizeServiceCenter(
        {
          ...serviceCenter,
          ...nextCenter,
          id: serviceSession.serviceCenterId,
          phone: nextCenter.phone || serviceCenter.phone || serviceProfile.phone,
          email: nextCenter.email || serviceCenter.email || serviceProfile.email,
          registrationCompleted: true,
          status: "active"
        },
        serviceSession.serviceCenterId
      );

      const persisted = persistServiceCenterToLocalStorage(mergedCenter, serviceSession.serviceCenterId);
      if (!persisted.ok) {
        throw new Error("Не удалось сохранить карточку сервиса");
      }

      const effectiveCenter =
        !canUseIndexedDbStorage() && persisted.variant > 0 && persisted.storedCenter
          ? normalizeServiceCenter(persisted.storedCenter, serviceSession.serviceCenterId)
          : mergedCenter;

      setServiceCenter(effectiveCenter);
      setServiceProfile((prev) => normalizeServiceProfile(
        {
          ...prev,
          email: effectiveCenter.email || prev.email
        },
        serviceSession
      ));
      setServiceSession((prev) => normalizeServiceSession({
        ...prev,
        name: serviceProfile.ownerFullName || prev.name,
        email: effectiveCenter.email || serviceProfile.email || prev.email,
          serviceCenterId: prev.serviceCenterId || effectiveCenter.id
      }));
      setSharedServiceCenters((prev) => mergeServiceCenterList(prev, effectiveCenter));
      saveSharedServiceCenter(effectiveCenter)
        .then((savedCenter) => {
          setSharedServiceCenters((prev) => mergeServiceCenterList(prev, savedCenter));
        })
        .catch(() => {
          toast.push("Настройки сохранены локально. Общая база временно недоступна");
        });
      if (persisted.ok && persisted.variant > 0) {
        toast.push("Главное фото сохранено. Галерея сохранена частично");
      }
      toast.push("Сервис сохранён");
    }, [serviceCenter, serviceProfile, serviceSession, toast]);

    const saveServiceInventoryItem = useCallback((payload) => {
      const safeCenter = normalizeServiceCenter(serviceCenter, serviceSession.serviceCenterId);
      const nextItem = normalizeServiceInventoryItem(
        {
          ...payload,
          id: genId("service-stock"),
          centerId: safeCenter.id
        },
        safeCenter.id
      );

      if (!nextItem.name || nextItem.stockQty <= 0 || nextItem.price <= 0) {
        toast.push("Заполните товар, остаток и цену");
        return;
      }

      setServiceInventory((prev) => [
        nextItem,
        ...normalizeServiceInventoryList(prev, safeCenter.id).filter((item) => !isDemoServiceInventoryItem(item))
      ]);
    }, [serviceCenter, serviceSession.serviceCenterId, toast]);

    const createManualServiceAppointment = useCallback((payload) => {
      const safeCenter = normalizeServiceCenter(serviceCenter, serviceSession.serviceCenterId);
      const request = normalizeServiceRequest({
        id: genId("service-request"),
        serviceId: createCatalogServiceFromCenter(safeCenter)?.id || safeCenter.id,
        serviceName: safeCenter.name,
        city: safeCenter.city,
        address: safeCenter.address,
        phone: safeCenter.phone,
        day: payload?.day,
        time: payload?.time,
        clientName: payload?.clientName,
        clientPhone: payload?.clientPhone,
        carLabel: payload?.carLabel,
        workLabel: payload?.workLabel,
        note: payload?.note || "Ручная запись из CRM сервиса.",
        status: "accepted",
        createdAt: new Date().toISOString(),
        statusUpdatedAt: new Date().toISOString()
      });

      if (!request.clientName || !request.clientPhone || !request.workLabel || !request.time) {
        toast.push("Заполните клиента, телефон, время и цель обращения");
        return;
      }

      const cleanAppointments = normalizeServiceAppointmentsList(serviceAppointments, safeCenter.id)
        .filter((item) => !isDemoServiceAppointment(item));
      const boxLabel = pickServiceBookingBox(safeCenter, cleanAppointments, request.day, request.time);
      const nextAppointment = normalizeServiceAppointment(
        {
          id: genId("service-slot"),
          centerId: safeCenter.id,
          day: request.day,
          startTime: request.time,
          endTime: addMinutesToClock(request.time, 60),
          boxLabel,
          status: "booked",
          clientName: request.clientName,
          phone: request.clientPhone,
          carLabel: request.carLabel,
          workLabel: request.workLabel
        },
        safeCenter.id
      );
      const clientResult = upsertServiceClientFromBooking(serviceClients, safeCenter.id, request, null);
      const nextOrder = normalizeServiceRepairOrder(
        {
          id: createServiceOrderCode(),
          centerId: safeCenter.id,
          clientId: clientResult.clientId,
          clientName: request.clientName,
          clientPhone: request.clientPhone,
          carLabel: request.carLabel,
          problem: request.workLabel,
          note: request.note,
          boxLabel,
          estimate: "1 час",
          createdAt: request.createdAt,
          appointmentTime: request.time,
          total: 0,
          status: "queued",
          sourceRequestId: request.id,
          parts: []
        },
        safeCenter.id
      );
      const linkedRequest = normalizeServiceRequest({
        ...request,
        sourceOrderId: nextOrder.id
      });

      setServiceClients(clientResult.clients);
      setServiceAppointments([nextAppointment, ...cleanAppointments]);
      setServiceOrders([
        nextOrder,
        ...normalizeServiceRepairOrdersList(serviceOrders, safeCenter.id).filter((item) => !isDemoServiceOrder(item))
      ]);
      setServiceRequests((prev) => [linkedRequest, ...normalizeServiceRequestsList(prev)].slice(0, 120));
    }, [serviceAppointments, serviceCenter, serviceClients, serviceOrders, serviceSession.serviceCenterId, toast]);

    const submitServiceBooking = useCallback(async (payload) => {
      if (!payload || typeof payload !== "object") {
        throw new Error("Не удалось собрать данные записи");
      }

      const createdAt = new Date().toISOString();
      let request = normalizeServiceRequest({
        ...payload,
        createdAt,
        status: "accepted",
        statusUpdatedAt: createdAt
      });

      if (!request.serviceId || !request.serviceName) {
        throw new Error("Сервис для записи не найден");
      }

      const currentCatalogService = createCatalogServiceFromCenter(serviceCenter, {
        clients: serviceClients,
        orders: serviceOrders,
        finance: serviceFinance,
        appointments: serviceAppointments
      });
      const isCrmBacked =
        Boolean(currentCatalogService) &&
        String(currentCatalogService.id) === String(request.serviceId);

      if (isCrmBacked) {
        const safeCenter = normalizeServiceCenter(serviceCenter, serviceSession.serviceCenterId);
        const activeCar = findGarageCar(request.carId);
        const clientResult = upsertServiceClientFromBooking(serviceClients, safeCenter.id, request, activeCar);
        const boxLabel = pickServiceBookingBox(safeCenter, serviceAppointments, request.day, request.time);
        const nextAppointment = normalizeServiceAppointment(
          {
            id: genId("service-slot"),
            centerId: safeCenter.id,
            day: request.day,
            startTime: request.time,
            endTime: addMinutesToClock(request.time, 60),
            boxLabel,
            status: "booked",
            clientName: request.clientName,
            phone: request.clientPhone,
            carLabel: request.carLabel,
            workLabel: request.workLabel
          },
          safeCenter.id
        );
        const nextOrder = normalizeServiceRepairOrder(
          {
            id: createServiceOrderCode(),
            centerId: safeCenter.id,
            clientId: clientResult.clientId,
            clientName: request.clientName,
            clientPhone: request.clientPhone,
            carLabel: request.carLabel,
            problem: request.workLabel,
            note: request.note || "Онлайн запись из приложения DRIVEX.",
            boxLabel,
            estimate: "1-2 часа",
            createdAt: request.createdAt,
            appointmentTime: request.time,
            total: 0,
            status: "queued",
            sourceRequestId: request.id,
            parts: []
          },
          safeCenter.id
        );

        request = normalizeServiceRequest({
          ...request,
          sourceOrderId: nextOrder.id
        });
        setServiceClients(clientResult.clients);
        setServiceAppointments([
          nextAppointment,
          ...normalizeServiceAppointmentsList(serviceAppointments, safeCenter.id).filter((item) => !isDemoServiceAppointment(item))
        ]);
        setServiceOrders([nextOrder, ...normalizeServiceRepairOrdersList(serviceOrders, safeCenter.id)]);
      }

      setServiceRequests((prev) => [request, ...normalizeServiceRequestsList(prev)].slice(0, 120));

      if (request.carId) {
        const bookingCar = findGarageCar(request.carId);
        const mileageValue = Number(String(bookingCar?.mileage || "").replace(/[^\d]/g, ""));

        addMaintenanceRecord(request.carId, {
          id: request.id,
          type: "booking",
          title: request.workLabel || "Запись в сервис",
          date: request.day,
          mileage: Number.isFinite(mileageValue) && mileageValue > 0 ? mileageValue : null,
          cost: 0,
          service: request.serviceName,
          notes: [`Запись на ${request.time}`, request.note].filter(Boolean).join(" • ")
        });
      }

      toast.push(`Запись добавлена в Журнал обслуживания: ${formatRuDate(request.day)} • ${request.time}`);
      return request;
    }, [
      addMaintenanceRecord,
      serviceAppointments,
      serviceCenter,
      serviceClients,
      serviceFinance,
      serviceOrders,
      serviceSession.serviceCenterId,
      toast
    ]);

    const updateServiceRepairStatus = useCallback((orderId, status, completion = {}) => {
      const safeOrderId = String(orderId || "").trim();
      if (!safeOrderId) return;
      if (!serviceRepairStatusOptions.some((item) => item.id === status)) return;

      const currentOrders = normalizeServiceRepairOrdersList(serviceOrders, serviceSession.serviceCenterId);
      const currentOrder = currentOrders.find((item) => item.id === safeOrderId);
      if (!currentOrder) {
        toast.push("Ремонт не найден");
        return;
      }
      if (currentOrder.status === status) return;

      const allowedActions = getServiceRepairActions(currentOrder);
      if (!allowedActions.some((item) => item.status === status)) {
        toast.push("Сначала переведите ремонт на следующий этап");
        return;
      }

      const completedAt = new Date().toISOString();
      const completionWork = String(completion?.workSummary || completion?.completedWork || "").trim();
      const completionTotal = Math.max(
        0,
        Math.floor(Number(String(completion?.total || completion?.amount || "").replace(/[^\d.]/g, "")) || 0)
      );
      if (status === "ready" && (!completionWork || completionTotal <= 0)) {
        toast.push("Укажите выполненную работу и сумму ремонта");
        return;
      }

      const linkedServiceRequest = normalizeServiceRequestsList(serviceRequests).find((item) => {
        const isLinkedByOrder = String(item.sourceOrderId || "") === safeOrderId;
        const isLinkedByRequest = currentOrder.sourceRequestId && item.id === currentOrder.sourceRequestId;
        return isLinkedByOrder || isLinkedByRequest;
      });

      const nextOrders = currentOrders.map((item) =>
        item.id === safeOrderId
          ? normalizeServiceRepairOrder(
              {
                ...item,
                status,
                ...(status === "ready"
                  ? {
                      completedWork: completionWork,
                      completedAt,
                      total: completionTotal
                    }
                  : {})
              },
              serviceSession.serviceCenterId
            )
          : item
      );

      setServiceOrders(nextOrders);

      const nextRequestStatus = mapRepairStatusToServiceRequestStatus(status);
      setServiceRequests((prev) =>
        normalizeServiceRequestsList(prev).map((item) => {
          const isLinkedByOrder = String(item.sourceOrderId || "") === safeOrderId;
          const isLinkedByRequest = currentOrder.sourceRequestId && item.id === currentOrder.sourceRequestId;
          if (!isLinkedByOrder && !isLinkedByRequest) return item;

          return normalizeServiceRequest({
            ...item,
            sourceOrderId: safeOrderId,
            status: nextRequestStatus,
            ...(status === "ready"
              ? {
                  completedWork: completionWork,
                  completedAt,
                  total: completionTotal
                }
              : {}),
            statusUpdatedAt: new Date().toISOString()
          });
        })
      );

      if (status === "ready" && linkedServiceRequest?.carId) {
        const bookingCar = findGarageCar(linkedServiceRequest.carId);
        const mileageValue = Number(String(bookingCar?.mileage || "").replace(/[^\d]/g, ""));
        upsertMaintenanceRecord(linkedServiceRequest.carId, {
          id: linkedServiceRequest.id,
          type: "booking",
          title: completionWork || linkedServiceRequest.workLabel || currentOrder.problem || "Ремонт в сервисе",
          date: linkedServiceRequest.day || toLocalISODate(),
          mileage: Number.isFinite(mileageValue) && mileageValue > 0 ? mileageValue : null,
          cost: completionTotal,
          service: linkedServiceRequest.serviceName || currentOrder.serviceName || "Сервис",
          notes: [
            `Готово: ${formatTjsPrice(completionTotal)}`,
            linkedServiceRequest.time ? `Запись на ${linkedServiceRequest.time}` : "",
            currentOrder.carLabel,
            completionWork
          ]
            .filter(Boolean)
            .join(" • ")
        });
      }

      if (status === "ready") {
        setServiceFinance((prev) => {
          const normalizedFinance = normalizeServiceFinanceList(prev, serviceSession.serviceCenterId);
          if (normalizedFinance.some((entry) => entry.sourceOrderId === safeOrderId)) {
            return normalizedFinance;
          }

          return [
            normalizeServiceFinanceEntry(
              {
                id: genId("service-finance"),
                centerId: serviceSession.serviceCenterId,
                type: "income",
                title: completionWork || `Ремонт ${currentOrder.clientName}`,
                amount: completionTotal,
                category: "Ремонт",
                date: toLocalISODate(),
                sourceOrderId: safeOrderId
              },
              serviceSession.serviceCenterId
            ),
            ...normalizedFinance
          ];
        });
      }

      toast.push(
        status === "progress"
          ? "Ремонт переведён в работу"
          : `Ремонт готов: ${formatTjsPrice(completionTotal)}`
      );
    }, [serviceOrders, serviceRequests, serviceSession.serviceCenterId, toast, upsertMaintenanceRecord]);

    const sellerBridgeSession = sellerRouteBridge?.session
      ? normalizeSellerSession(sellerRouteBridge.session)
      : null;
    const sellerBridgeProfile = sellerBridgeSession && sellerRouteBridge?.profile
      ? normalizeSellerProfile(sellerRouteBridge.profile, sellerBridgeSession)
      : null;
    const sellerBridgeStore = sellerBridgeSession && sellerRouteBridge?.store
      ? normalizeSellerStore(sellerRouteBridge.store, sellerBridgeSession.sellerStoreId)
      : null;
    const sellerBridgeProducts = sellerBridgeStore && sellerBridgeSession
      ? resolveSellerProductsState(
          sellerRouteBridge?.products,
          sellerBridgeStore,
          sellerBridgeSession.sellerStoreId
        )
      : null;
    const sellerBridgeOrders = sellerBridgeSession
      ? normalizeSellerOrdersList(sellerRouteBridge?.orders, sellerBridgeSession.sellerStoreId)
      : null;
    const sellerBridgeNotifications = normalizeSellerNotificationsList(sellerRouteBridge?.notifications);
    const effectiveSellerSession = sellerBridgeSession || sellerSession;
    const effectiveSellerProfile = sellerBridgeProfile || sellerProfile;
    const effectiveSellerStore = sellerBridgeStore || sellerStore;
    const effectiveSellerProducts = sellerBridgeProducts || sellerProducts;
    const effectiveSellerOrders = sellerBridgeOrders || sellerOrders;
    const effectiveSellerNotificationsState = sellerBridgeSession
      ? sellerBridgeNotifications
      : sellerNotificationsState;

    const canAccessSeller = useMemo(() => {
      return isSellerRole(effectiveSellerSession.role);
    }, [effectiveSellerSession.role]);

    const runtimeMarketData = useMemo(() => {
      return buildMarketplaceRuntimeData({
        sellerStore: effectiveSellerStore,
        sellerProducts: effectiveSellerProducts,
        partnerStores: marketplacePartnerCatalog.stores,
        partnerProducts: marketplacePartnerCatalog.products
      });
    }, [
      effectiveSellerProducts,
      effectiveSellerStore,
      marketplacePartnerCatalog.products,
      marketplacePartnerCatalog.stores
    ]);
    const runtimeMarketProducts = runtimeMarketData.products;
    const runtimeMarketStores = runtimeMarketData.stores;
    setMarketplaceRuntime(runtimeMarketData);

    const cartItems = useMemo(() => {
      return Object.entries(cart)
        .map(([cartKey, qty]) => {
          const parsedKey = parseMarketCartKey(cartKey);
          const product = runtimeMarketProducts.find((p) => {
            const sameProductId = normalizeMarketProductId(p.id) === parsedKey.productId;
            if (!sameProductId) return false;
            if (!parsedKey.storeId) return true;
            return String(p.storeId || "").trim() === parsedKey.storeId;
          });
          if (!product) return null;
          return {
            ...product,
            qty: Number(qty),
            cartKey: parsedKey.cartKey || createMarketCartKey(product.id, product.storeId)
          };
        })
        .filter(Boolean);
    }, [cart, runtimeMarketProducts]);

    const cartCount = useMemo(() => {
      return cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);
    }, [cartItems]);

    const cartTotal = useMemo(() => {
      return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    }, [cartItems]);

    const buyerActiveOrdersCount = useMemo(() => {
      return buyerOrders.filter((order) => !["completed", "cancelled"].includes(order.status)).length;
    }, [buyerOrders]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.cart, cart);
    }, [cart, pushBuyerState]);

    const setCartQty = useCallback((productOrCartKey, qty, fallbackStoreId = "") => {
      const parsedKey = parseMarketCartKey(productOrCartKey);
      const normalizedId = parsedKey.productId || normalizeMarketProductId(productOrCartKey);
      const nextQty = Math.floor(Number(qty));
      const cartKey = parsedKey.cartKey || createMarketCartKey(normalizedId, fallbackStoreId);
      if (!normalizedId || !cartKey) return;

      setCart((prev) => {
        const next = { ...(prev || {}) };
        if (!Number.isFinite(nextQty) || nextQty <= 0) {
          delete next[cartKey];
        } else {
          next[cartKey] = nextQty;
        }

        return next;
      });
    }, []);

    const removeFromCart = useCallback(
      (productOrCartKey, storeId = "") => {
        setCartQty(productOrCartKey, 0, storeId);
      },
      [setCartQty]
    );

    const addToCart = useCallback(
      (productOrId, qty = 1, fallbackStoreId = "") => {
        const product =
          productOrId && typeof productOrId === "object"
            ? productOrId
            : runtimeMarketProducts.find((item) => normalizeMarketProductId(item.id) === normalizeMarketProductId(productOrId));
        const normalizedId = normalizeMarketProductId(product?.id ?? productOrId);
        const resolvedStoreId = String(product?.storeId || fallbackStoreId || "").trim();
        const addQty = Math.floor(Number(qty));
        if (!normalizedId) return;
        if (!Number.isFinite(addQty) || addQty <= 0) return;
        const cartKey = createMarketCartKey(normalizedId, resolvedStoreId);
        if (!cartKey) return;

        setCart((prev) => {
          const next = { ...(prev || {}) };
          const current = Math.floor(Number(next[cartKey] || 0));
          next[cartKey] = current + addQty;
          return next;
        });
      },
      [runtimeMarketProducts]
    );

    useEffect(() => {
      if (!buyerOrders.length || !sellerOrders.length) return;

      setBuyerOrders((prev) => {
        const next = syncBuyerOrdersWithSellerOrders(prev, sellerOrders);
        const changed =
          next.length !== prev.length ||
          next.some((order, index) => {
            const prevOrder = prev[index];
            return (
              !prevOrder ||
              order.id !== prevOrder.id ||
              order.status !== prevOrder.status ||
              order.amount !== prevOrder.amount ||
              order.address !== prevOrder.address ||
              order.deliveryMethod !== prevOrder.deliveryMethod
            );
          });

        return changed ? next : prev;
      });
    }, [buyerOrders.length, sellerOrders]);

    const checkoutCart = useCallback(async (checkoutDraft) => {
      if (!cartItems.length) {
        toast.push("Корзина пуста");
        return;
      }

      const nextOrders = createSellerOrdersFromCart({
        items: cartItems,
        profile,
        stores: runtimeMarketStores,
        existingOrders: sellerOrders,
        checkout: checkoutDraft
      });

      if (!nextOrders.length) {
        toast.push("Не удалось оформить заказ");
        return;
      }

      try {
        await runSellerBackendAction("recordMarketplaceCheckout", {
          orders: nextOrders
        });
        const nextBuyerOrders = createBuyerOrdersFromCheckout({
          orders: nextOrders,
          stores: runtimeMarketStores
        });
        setBuyerOrders((prev) => mergeBuyerOrders(prev, nextBuyerOrders));
        setCart({});
        toast.push(`Заказ отправлен продавцам: ${nextOrders.length}`);
        navigateToHash("/orders");
      } catch (error) {
        toast.push(error?.message || "Не удалось отправить заказ продавцу");
      }
    }, [cartItems, profile, runSellerBackendAction, runtimeMarketStores, sellerOrders, toast]);

    const normalized = normalizePath(path);

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [normalized]);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const currentHash = String(window.location.hash || "");
      const hasInviteFlag = /[?&](invite|demo)=1\b/i.test(currentHash);
      const shouldBootstrapSeller =
        hasInviteFlag && (normalized === "/seller" || normalized === "/seller/register" || normalized === "/partner/register");
      if (shouldBootstrapSeller) {
        activateSellerMode();
      }
    }, [activateSellerMode, normalized]);

    useEffect(() => {
      if (normalized === "/seller/register") {
        setSellerRegistrationDraftState((prev) => prev || createSellerRegistrationDraft(Date.now()));
      }
    }, [normalized]);

    useEffect(() => {
      if (normalized === "/service-crm/register") {
        setServiceRegistrationDraftState((prev) => prev || createServiceRegistrationDraft(Date.now()));
      }
    }, [normalized]);

    useEffect(() => {
      if (!sellerRouteBridge) return;

      const bridgeSession = sellerRouteBridge?.session
        ? normalizeSellerSession(sellerRouteBridge.session)
        : null;
      const bridgeStore = bridgeSession && sellerRouteBridge?.store
        ? normalizeSellerStore(sellerRouteBridge.store, bridgeSession.sellerStoreId)
        : null;
      const sessionSettled =
        Boolean(bridgeSession) &&
        sellerSession.id === bridgeSession.id &&
        sellerSession.role === bridgeSession.role &&
        sellerSession.sellerStoreId === bridgeSession.sellerStoreId;
      const storeSettled =
        !bridgeStore ||
        normalizeSellerStore(sellerStore, sellerSession.sellerStoreId).id === bridgeStore.id;

      if (sessionSettled && storeSettled) {
        setSellerRouteBridge(null);
      }
    }, [sellerRouteBridge, sellerSession, sellerStore]);

    useEffect(() => {
      if (!pendingSellerRedirect || !sellerBackendReady) return;

      const bridgeReady = Boolean(
        sellerRouteBridge?.session && isSellerRole(normalizeSellerSession(sellerRouteBridge.session).role)
      );
      if (!bridgeReady && !canAccessSeller) return;

      clearSellerPendingRoute();
      setPendingSellerRedirect("");
      navigateToAppRoute(pendingSellerRedirect);
    }, [canAccessSeller, pendingSellerRedirect, sellerBackendReady, sellerRouteBridge]);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const currentHash = String(window.location.hash || "");
      const shouldLogout = normalized === "/partner/login" && /[?&]logout=1\b/i.test(currentHash);
      if (shouldLogout) {
        partnerLogout();
      }
    }, [normalized, partnerLogout]);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const currentHash = String(window.location.hash || "");
      const shouldLogout = normalized === "/service-crm/login" && /[?&]logout=1\b/i.test(currentHash);
      if (shouldLogout) {
        logoutServiceCrm({ redirect: true, notify: true });
      }
    }, [normalized, logoutServiceCrm]);

    let activePath = normalized;
    let content = null;
    const sellerOrderChatMatch = normalized.match(/^\/seller\/orders\/([^/]+)\/chat$/);
    const buyerOrderChatMatch = normalized.match(/^\/orders\/([^/]+)\/chat$/);
    const isPartnerRoute = normalized === "/partner/login" || normalized === "/partner/register";
    const isSellerRoute = normalized === "/seller" || normalized.startsWith("/seller/");
    const isServiceCrmRoute = normalized === "/service-crm" || normalized.startsWith("/service-crm/");
    const isBuyerAuthRoute = normalized === "/login" || normalized === "/register";
    const buyerIsAuthenticated = Boolean(buyerSession?.authenticated);

    // Маршруты, доступные без входа (гостевой режим)
    const isGuestAllowedRoute = [
      "/", "/market", "/services", "/map", "/emergency"
    ].includes(normalized) ||
      normalized.startsWith("/market/") ||
      normalized.startsWith("/services/") ||
      normalized.startsWith("/map/");

    // Маршруты, требующие авторизации
    const isAuthRequiredRoute = [
      "/profile", "/garage", "/documents", "/maintenance",
      "/orders", "/checkout", "/ai-assistant", "/notifications"
    ].some((r) => normalized === r || normalized.startsWith(r + "/"));
    const sellerCurrentProfile = normalizeSellerProfile(effectiveSellerProfile, effectiveSellerSession);
    const sellerCurrentStore = normalizeSellerStore(
      effectiveSellerStore,
      effectiveSellerSession.sellerStoreId
    );
    const sellerScopedProducts = (Array.isArray(effectiveSellerProducts) ? effectiveSellerProducts : []).filter(
      (product) => product.storeId === sellerCurrentStore.id
    );
    const sellerScopedOrders = (Array.isArray(effectiveSellerOrders) ? effectiveSellerOrders : []).filter(
      (order) => order.storeId === sellerCurrentStore.id
    );
    const sellerSetupState = getSellerSetupState(sellerCurrentStore, sellerCurrentProfile);
    const sellerNotifications = mergeSellerNotifications(
      effectiveSellerNotificationsState,
      createSellerNotifications({
        setupState: sellerSetupState,
        products: sellerScopedProducts,
        orders: sellerScopedOrders
      })
    );
    const sellerRegistrationDraft = sellerRegistrationDraftState;
    const sellerNeedsRegistration = !sellerSetupState.isRegistrationComplete;
    const sellerNeedsOnboarding = sellerSetupState.isRegistrationComplete && !sellerSetupState.isProfileComplete;
    const serviceCurrentSession = normalizeServiceSession(serviceSession);
    const serviceCurrentProfile = normalizeServiceProfile(serviceProfile, serviceCurrentSession);
    const serviceCurrentCenter = getLatestPersistedServiceCenter(serviceCenter, serviceCurrentSession.serviceCenterId);
    const serviceScopedClients = normalizeServiceClientsList(serviceClients, serviceCurrentCenter.id)
      .filter((item) => item.centerId === serviceCurrentCenter.id && !isDemoServiceClient(item));
    const serviceScopedOrders = normalizeServiceRepairOrdersList(serviceOrders, serviceCurrentCenter.id)
      .filter((item) => item.centerId === serviceCurrentCenter.id && !isDemoServiceOrder(item));
    const serviceScopedInventory = normalizeServiceInventoryList(serviceInventory, serviceCurrentCenter.id)
      .filter((item) => item.centerId === serviceCurrentCenter.id && !isDemoServiceInventoryItem(item));
    const serviceScopedFinance = normalizeServiceFinanceList(serviceFinance, serviceCurrentCenter.id)
      .filter((item) => item.centerId === serviceCurrentCenter.id && !isDemoServiceFinanceEntry(item));
    const serviceScopedAppointments = normalizeServiceAppointmentsList(serviceAppointments, serviceCurrentCenter.id)
      .filter((item) => item.centerId === serviceCurrentCenter.id && !isDemoServiceAppointment(item));
    const notificationsCount = baseNotificationsCount + buildBuyerServiceNotifications(serviceRequests).length;
    const serviceDirectory = buildServiceDirectoryData(serviceCurrentCenter, {
      clients: serviceScopedClients,
      orders: serviceScopedOrders,
      finance: serviceScopedFinance,
      appointments: serviceScopedAppointments,
      sharedCenters: sharedServiceCenters
    });
    const serviceRegistrationDraft = serviceRegistrationDraftState;
    const serviceNeedsRegistration =
      !serviceCurrentProfile.registrationCompleted ||
      !serviceCurrentCenter.registrationCompleted ||
      !serviceCurrentCenter.name ||
      !serviceCurrentCenter.serviceType;
    const serviceIsAuthenticated = !serviceNeedsRegistration && Boolean(serviceAuth?.authenticated);
    const sellerChatOrderId = sellerOrderChatMatch ? decodeRouteSegment(sellerOrderChatMatch[1]) : "";
    const buyerChatOrderId = buyerOrderChatMatch ? decodeRouteSegment(buyerOrderChatMatch[1]) : "";
    const sellerChatOrder = sellerChatOrderId
      ? sellerScopedOrders.find((order) => order.id === sellerChatOrderId) || null
      : null;
    const buyerChatOrder = buyerChatOrderId ? buyerOrders.find((order) => order.id === buyerChatOrderId) || null : null;

    // Оставляем партнёрский логин внутри partner.html, не редиректим в seller

    if (isBuyerAuthRoute) {
      activePath = "/profile";
      content = buyerIsAuthenticated
        ? html`<${ProfileScreen}
            notificationsCount=${notificationsCount}
            profile=${profile}
            documents=${documents}
            documentsTotalCount=${documentsTotalCount}
            maintenance=${maintenance}
            ordersCount=${buyerActiveOrdersCount || buyerOrders.length}
            onLogout=${logoutBuyer}
          />`
        : html`<${BuyerAuthScreen}
            mode=${normalized === "/login" ? "login" : "register"}
            authStatus=${buyerAuthStatus}
            onLogin=${loginBuyer}
            onRegister=${registerBuyer}
            onPhoneAuth=${loginByPhone}
            onGuest=${() => navigateToHash("/")}
          />`;
    } else if (!buyerIsAuthenticated && !isPartnerRoute && !isSellerRoute && !isServiceCrmRoute && isAuthRequiredRoute) {
      // Требует авторизации — показываем экран входа
      activePath = "/profile";
      content = html`<${BuyerAuthScreen}
        mode="register"
        authStatus=${buyerAuthStatus}
        onLogin=${loginBuyer}
        onRegister=${registerBuyer}
        onPhoneAuth=${loginByPhone}
        onGuest=${() => navigateToHash("/")}
      />`;
    } else if (isPartnerRoute) {
      activePath = "/partner";

      if (normalized === "/partner/register") {
        content = sellerRegistrationDraft
          ? html`<${SellerRegistrationScreen}
              currentUser=${sellerRegistrationDraft.session}
              profile=${sellerRegistrationDraft.profile}
              store=${sellerRegistrationDraft.store}
              onRegister=${registerSeller}
            />`
          : html`<${PartnerRegisterIntroScreen}
              onStart=${beginSellerRegistration}
            />`;
      } else if (canAccessSeller && sellerBackendReady) {
        content = sellerNeedsOnboarding
          ? html`<${SellerOnboardingScreen}
              currentUser=${sellerSession}
              store=${sellerCurrentStore}
              profile=${sellerCurrentProfile}
              setupState=${sellerSetupState}
              notifications=${sellerNotifications}
              onCompleteSetup=${completeSellerSetup}
            />`
          : html`<${SellerDashboardScreen}
              currentUser=${sellerSession}
              store=${sellerCurrentStore}
              products=${sellerScopedProducts}
              orders=${sellerScopedOrders}
              notifications=${sellerNotifications}
              setupState=${sellerSetupState}
            />`;
      } else {
        content = html`<${PartnerLoginScreen}
          onLogin=${partnerLogin}
          onGoRegister=${activateSellerMode}
          onResetPassword=${resetPartnerPassword}
          authStatus=${sellerBackendStatus}
          message=${sellerBackendReady ? "" : "Подключаем seller backend..."}
        />`;
      }
    } else if (isSellerRoute) {
      const sellerProductEditMatch = normalized.match(/^\/seller\/products\/([\w-]+)\/edit$/);

      activePath = "/seller";

      if (!sellerBackendReady) {
        content = html`<${PartnerLoginScreen}
          onLogin=${partnerLogin}
          onGoRegister=${activateSellerMode}
          onResetPassword=${resetPartnerPassword}
          authStatus=${sellerBackendStatus}
          message="Подключаем seller backend..."
        />`;
      } else if (!canAccessSeller) {
        content = html`<${PartnerLoginScreen}
          onLogin=${partnerLogin}
          onGoRegister=${activateSellerMode}
          onResetPassword=${resetPartnerPassword}
          authStatus=${sellerBackendStatus}
          message="Чтобы открыть seller CRM, войдите в партнёрский кабинет."
        />`;
      } else if (normalized === "/seller") {
        content = sellerNeedsOnboarding
          ? html`<${SellerOnboardingScreen}
              currentUser=${sellerSession}
              store=${sellerCurrentStore}
              profile=${sellerCurrentProfile}
              setupState=${sellerSetupState}
              notifications=${sellerNotifications}
              onCompleteSetup=${completeSellerSetup}
            />`
          : html`<${SellerDashboardScreen}
              currentUser=${sellerSession}
              store=${sellerCurrentStore}
              products=${sellerScopedProducts}
              orders=${sellerScopedOrders}
              notifications=${sellerNotifications}
              setupState=${sellerSetupState}
            />`;
      } else if (sellerNeedsRegistration) {
        content = html`<${SellerRegistrationScreen}
          currentUser=${sellerSession}
          profile=${sellerCurrentProfile}
          store=${sellerCurrentStore}
          onRegister=${registerSeller}
        />`;
      } else if (normalized === "/seller/onboarding") {
        content = html`<${SellerOnboardingScreen}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          profile=${sellerCurrentProfile}
          setupState=${sellerSetupState}
          notifications=${sellerNotifications}
          onCompleteSetup=${completeSellerSetup}
        />`;
      } else if (normalized === "/seller/store" || normalized === "/seller/store-settings") {
        content = html`<${SellerStoreSettingsScreen}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          onSaveStore=${saveSellerStore}
        />`;
      } else if (sellerNeedsOnboarding) {
        content = html`<${SellerOnboardingScreen}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          profile=${sellerCurrentProfile}
          setupState=${sellerSetupState}
          notifications=${sellerNotifications}
          onCompleteSetup=${completeSellerSetup}
        />`;
      } else if (normalized === "/seller/dashboard") {
        content = html`<${SellerDashboardScreen}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          products=${sellerScopedProducts}
          orders=${sellerScopedOrders}
          notifications=${sellerNotifications}
          setupState=${sellerSetupState}
        />`;
      } else if (normalized === "/seller/products") {
        content = html`<${SellerProductsScreen}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          products=${sellerScopedProducts}
          onDeleteProduct=${deleteSellerProduct}
        />`;
      } else if (normalized === "/seller/products/new") {
        content = html`<${SellerProductEditorScreen}
          mode="new"
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          onSaveProduct=${saveSellerProduct}
        />`;
      } else if (sellerProductEditMatch) {
        content = html`<${SellerProductEditorScreen}
          mode="edit"
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          product=${getSellerProductById(sellerScopedProducts, sellerProductEditMatch[1])}
          onSaveProduct=${saveSellerProduct}
        />`;
      } else if (sellerOrderChatMatch) {
        content = html`<${OrderChatScreen}
          viewerRole="seller"
          order=${sellerChatOrder}
          orderChats=${orderChats}
          backPath="/seller/orders"
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          onSendMessage=${sendOrderChatMessage}
          onMarkRead=${markOrderChatRead}
        />`;
      } else if (normalized === "/seller/orders") {
        content = html`<${SellerOrdersScreen}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          orders=${sellerScopedOrders}
          orderChats=${orderChats}
          onUpdateOrderStatus=${updateSellerOrderStatus}
        />`;
      } else {
        content = html`<${SellerNotFoundScreen} currentUser=${sellerSession} store=${sellerCurrentStore} />`;
      }
    } else if (isServiceCrmRoute) {
      activePath = "/service-crm";

      if (normalized === "/service-crm") {
        content = serviceNeedsRegistration
          ? serviceRegistrationDraft
            ? html`<${ServiceRegistrationScreen}
                currentUser=${serviceRegistrationDraft.session}
                profile=${serviceRegistrationDraft.profile}
                center=${serviceRegistrationDraft.center}
                onRegister=${registerServiceCrm}
              />`
            : html`<${ServicePartnerRegisterIntroScreen} onStart=${beginServiceRegistration} />`
          : serviceIsAuthenticated
            ? html`<${ServiceDashboardScreen}
                currentUser=${serviceCurrentSession}
                center=${serviceCurrentCenter}
                clients=${serviceScopedClients}
                orders=${serviceScopedOrders}
                finance=${serviceScopedFinance}
                appointments=${serviceScopedAppointments}
              />`
            : html`<${ServiceLoginScreen}
                onLogin=${loginServiceCrm}
                onGoRegister=${beginServiceRegistration}
                message=${serviceCurrentCenter.name
                  ? `Войдите, чтобы открыть кабинет сервиса ${serviceCurrentCenter.name}.`
                  : "Войдите в свой сервисный кабинет."}
              />`;
      } else if (serviceNeedsRegistration) {
        content = serviceRegistrationDraft
          ? html`<${ServiceRegistrationScreen}
              currentUser=${serviceRegistrationDraft.session}
              profile=${serviceRegistrationDraft.profile}
              center=${serviceRegistrationDraft.center}
              onRegister=${registerServiceCrm}
            />`
          : html`<${ServicePartnerRegisterIntroScreen} onStart=${beginServiceRegistration} />`;
      } else if (normalized === "/service-crm/login" || !serviceIsAuthenticated) {
        content = html`<${ServiceLoginScreen}
          onLogin=${loginServiceCrm}
          onGoRegister=${beginServiceRegistration}
          message=${serviceCurrentCenter.name
            ? `Войдите, чтобы открыть кабинет сервиса ${serviceCurrentCenter.name}.`
            : "Войдите в свой сервисный кабинет."}
        />`;
      } else if (normalized === "/service-crm/dashboard") {
        content = html`<${ServiceDashboardScreen}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          clients=${serviceScopedClients}
          orders=${serviceScopedOrders}
          finance=${serviceScopedFinance}
          appointments=${serviceScopedAppointments}
        />`;
      } else if (normalized === "/service-crm/clients") {
        content = html`<${ServiceClientsScreen}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          clients=${serviceScopedClients}
          orders=${serviceScopedOrders}
          appointments=${serviceScopedAppointments}
        />`;
      } else if (normalized === "/service-crm/orders") {
        content = html`<${ServiceOrdersScreen}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          orders=${serviceScopedOrders}
          onUpdateStatus=${updateServiceRepairStatus}
        />`;
      } else if (normalized === "/service-crm/parts") {
        content = html`<${ServiceInventoryScreen}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          inventory=${serviceScopedInventory}
          onSaveItem=${saveServiceInventoryItem}
        />`;
      } else if (normalized === "/service-crm/finance") {
        content = html`<${ServiceFinanceScreen}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          orders=${serviceScopedOrders}
          finance=${serviceScopedFinance}
        />`;
      } else if (normalized === "/service-crm/schedule") {
        content = html`<${ServiceScheduleScreen}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          appointments=${serviceScopedAppointments}
          onCreateAppointment=${createManualServiceAppointment}
        />`;
      } else if (normalized === "/service-crm/settings") {
        content = html`<${ServiceSettingsScreen}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          onSaveCenter=${saveServiceCenter}
        />`;
      } else {
        content = html`<${ServiceNotFoundScreen} currentUser=${serviceCurrentSession} center=${serviceCurrentCenter} />`;
      }
    } else if (normalized === "/" || normalized === "/home") {
      activePath = "/";
      content = html`<${DashboardScreen}
        notificationsCount=${notificationsCount}
        profileName=${profile.name}
        serviceDirectory=${serviceDirectory}
        activeCarId=${activeCarId}
        maintenance=${maintenance}
      />`;
    } else if (normalized === "/map") {
      activePath = "/map";
      content = html`<${MapScreen} serviceDirectory=${serviceDirectory} />`;
    } else if (normalized === "/services") {
      activePath = "/services";
      content = html`<${ServicesScreen}
        serviceDirectory=${serviceDirectory}
        activeCarId=${activeCarId}
        serviceCrmReady=${!serviceNeedsRegistration}
        serviceCenterName=${serviceCurrentCenter.name}
      />`;
    } else if (normalized === "/market") {
      activePath = "/market";
      content = html`<${MarketScreen} cartCount=${cartCount} onAddToCart=${addToCart} />`;
    } else if (normalized === "/marketplace/catalog") {
      activePath = "/market";
      content = html`<${MarketCatalogScreen} cartCount=${cartCount} onAddToCart=${addToCart} />`;
    } else if (normalized === "/marketplace/auto") {
      activePath = "/market";
      content = html`<${MarketAutoPickerScreen} cartCount=${cartCount} onAddToCart=${addToCart} />`;
    } else if (normalized === "/marketplace/orders") {
      activePath = "/market";
      content = html`<${MarketOrdersScreen}
        orders=${buyerOrders}
        orderChats=${orderChats}
        cartCount=${cartCount}
      />`;
    } else if (normalized === "/profile") {
      activePath = "/profile";
      content = html`<${ProfileScreen}
        notificationsCount=${notificationsCount}
        profile=${profile}
        documents=${documents}
        documentsTotalCount=${documentsTotalCount}
        maintenance=${maintenance}
        ordersCount=${buyerActiveOrdersCount || buyerOrders.length}
        onLogout=${logoutBuyer}
      />`;
    } else {
      const serviceBookingMatch = normalized.match(/^\/service\/([^/]+)\/book$/);
      const serviceMatch = normalized.match(/^\/service\/([^/]+)$/);
      const productMatch = normalized.match(/^\/(?:marketplace\/product|product)\/([^/]+)$/);
      const marketStoreMatch = normalized.match(/^\/(?:marketplace\/store|market-store)\/([\w-]+)$/);
      const categoryMatch = normalized.match(/^\/category\/([\w-]+)$/);
      const documentCarMatch = normalized.match(/^\/documents\/car\/([\w-]+)$/);

      if (serviceBookingMatch) {
        activePath = "/services";
        content = html`<${ServiceBookingScreen}
          serviceId=${decodeRouteSegment(serviceBookingMatch[1])}
          serviceDirectory=${serviceDirectory}
          profile=${profile}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          currentCenter=${serviceCurrentCenter}
          appointments=${serviceScopedAppointments}
          onSubmitBooking=${submitServiceBooking}
        />`;
      } else if (serviceMatch) {
        activePath = "/services";
        content = html`<${ServiceDetailScreen}
          serviceId=${decodeRouteSegment(serviceMatch[1])}
          serviceDirectory=${serviceDirectory}
          serviceRequests=${serviceRequests}
        />`;
      } else if (productMatch) {
        activePath = "/market";
        content = html`<${ProductDetailScreen}
          productId=${decodeRouteSegment(productMatch[1])}
          onAddToCart=${addToCart}
        />`;
      } else if (marketStoreMatch) {
        activePath = "/market";
        content = html`<${MarketStoreScreen}
          storeId=${marketStoreMatch[1]}
          onAddToCart=${addToCart}
        />`;
      } else if (categoryMatch) {
        activePath = "/services";
        content = html`<${CategoryScreen}
          categoryId=${categoryMatch[1]}
          serviceDirectory=${serviceDirectory}
          activeCarId=${activeCarId}
        />`;
      } else if (normalized === "/documents") {
        activePath = "/profile";
        content = html`<${DocumentsVaultScreen}
          documents=${documents}
          totalCount=${documentsTotalCount}
          authStatus=${buyerAuthStatus}
        />`;
      } else if (normalized === "/documents/license") {
        activePath = "/profile";
        content = html`<${LicenseDocumentScreen}
          document=${documents?.license || null}
          onSave=${setLicenseDocument}
          onRemove=${removeLicenseDocument}
        />`;
      } else if (documentCarMatch) {
        activePath = "/profile";
        content = html`<${CarDocumentsScreen}
          carId=${documentCarMatch[1]}
          documents=${documents}
          onSaveDocument=${setCarDocument}
          onRemoveDocument=${removeCarDocument}
          onSelectCar=${selectActiveCar}
        />`;
      } else if (normalized === "/notifications") {
        activePath = "/profile";
        content = html`<${NotificationsScreen} serviceRequests=${serviceRequests} />`;
      } else if (normalized === "/profile-security") {
        activePath = "/profile";
        content = html`<${ProfileSecurityScreen} profile=${profile} />`;
      } else if (normalized === "/profile-edit") {
        activePath = "/profile";
        content = html`<${ProfileEditScreen}
          profile=${profile}
          onSave=${updateProfile}
          buyerSession=${buyerSession}
          onUploadAvatar=${uploadAvatarToStorage}
        />`;
      } else if (normalized === "/maintenance") {
        activePath = "/profile";
        content = html`<${MaintenanceScreen}
          maintenance=${maintenance}
          spentTotal=${maintenanceSpentTotal}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          onRemoveRecord=${removeMaintenanceRecord}
          serviceRequests=${serviceRequests}
        />`;
      } else if (normalized === "/maintenance-add") {
        activePath = "/profile";
        content = html`<${MaintenanceAddScreen}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          onAddRecord=${addMaintenanceRecord}
        />`;
      } else if (normalized === "/inspection") {
        activePath = "/profile";
        content = html`<${InspectionScreen}
          maintenance=${maintenance}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          onSave=${setInspection}
        />`;
      } else if (normalized === "/garage") {
        activePath = "/profile";
        content = html`<${GarageScreen}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          onAddCar=${addGarageCar}
          onRemoveCar=${removeGarageCar}
        />`;
      } else if (normalized === "/smart-care") {
        activePath = "/profile";
        content = html`<${SmartCareScreen} maintenance=${maintenance} activeCarId=${activeCarId} />`;
      } else if (normalized === "/ai-assistant") {
        activePath = "/";
        content = html`<${AIAssistantScreen}
          profile=${profile}
          activeCarId=${activeCarId}
          maintenance=${maintenance}
          serviceDirectory=${serviceDirectory}
        />`;
      } else if (normalized === "/emergency") {
        activePath = "/";
        content = html`<${PlaceholderPage} title="SOS помощь" backPath="/" />`;
      } else if (normalized === "/cart" || normalized === "/marketplace/cart") {
        activePath = "/market";
        content = html`<${CartScreen}
          items=${cartItems}
          total=${cartTotal}
          profile=${profile}
          onSetQty=${setCartQty}
          onRemove=${removeFromCart}
          onCheckout=${checkoutCart}
        />`;
      } else if (buyerOrderChatMatch) {
        activePath = "/profile";
        content = html`<${OrderChatScreen}
          viewerRole="buyer"
          order=${buyerChatOrder}
          orderChats=${orderChats}
          backPath="/orders"
          onSendMessage=${sendOrderChatMessage}
          onMarkRead=${markOrderChatRead}
        />`;
      } else if (normalized === "/orders") {
        activePath = "/profile";
        content = html`<${OrdersScreen} orders=${buyerOrders} orderChats=${orderChats} />`;
      } else if (normalized === "/trips") {
        activePath = "/profile";
        content = html`<${TripsScreen} />`;
      } else if (normalized === "/saved-locations") {
        activePath = "/profile";
        content = html`<${SavedLocationsScreen}
          places=${userSavedPlaces}
          onAddPlace=${addSavedPlace}
          onRemovePlace=${removeSavedPlace}
        />`;
      } else if (normalized === "/settings") {
        activePath = "/profile";
        content = html`<${SettingsScreen} />`;
      } else if (normalized === "/help") {
        activePath = "/profile";
        content = html`<${HelpScreen} />`;
      } else if (normalized === "/payment") {
        activePath = "/profile";
        content = html`<${PaymentDataScreen} />`;
      } else if (normalized === "/bonus") {
        activePath = "/profile";
        content = html`<${BonusProgramScreen} />`;
      } else if (normalized === "/invite") {
        activePath = "/profile";
        content = html`<${InviteFriendsScreen} />`;
      } else {
        activePath = "/";
        content = html`<${NotFoundScreen} path=${normalized} />`;
      }
    }

    return html`
      <div className="min-h-screen relative" style=${{ background: "var(--drivex-black)" }}>
        <main id="main">${content}</main>
        ${isSellerRoute || isPartnerRoute || isServiceCrmRoute ? null : html`<${BottomNav} activePath=${activePath} />`}
      </div>
    `;
  }

  // ── Root и рендер ────────────────────────────────────
  function Root() {
    return html`<${ToastProvider}><${App} /></${ToastProvider}>`;
  }

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("DRIVEX: missing #root element.");
    return;
  }
  if (typeof ReactDOM.createRoot === "function") {
    ReactDOM.createRoot(rootElement).render(html`<${Root} />`);
  } else if (typeof ReactDOM.render === "function") {
    ReactDOM.render(html`<${Root} />`, rootElement);
  } else {
    console.error("DRIVEX: unable to mount.");
  }
  try {
    if (window.__DRIVEX_BOOT__ && typeof window.__DRIVEX_BOOT__.markReady === "function") {
      window.__DRIVEX_BOOT__.markReady();
    }
  } catch (e) { /* ignore */ }
})();
