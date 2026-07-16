// app/app-main.js — App() компонент + роутинг
// ЗАГРУЖАЕТСЯ ПОСЛЕДНИМ: к этому моменту все screen файлы уже заполнили DX.screens
(() => {
  'use strict';
  const React   = window.DX.React;
  const ReactDOM = window.DX.ReactDOM;
  const html    = window.DX.html;
  const { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } = window.DX;
  const sellerBackend = window.DrivexSellerBackend || null;

  // ── Все зависимости из DX (загружены предыдущими файлами) ──────────
  const Icon        = function(p){ return window.DX.Icon ? window.DX.Icon(p) : null; };
  const alphaBg     = function(){ return window.DX.alphaBg ? window.DX.alphaBg(...arguments) : arguments[0]; };
  const BottomNav   = function(p){ return window.DX.BottomNav ? window.DX.BottomNav(p) : null; };
  const SimplePage  = function(p){ var F=window.DX.SimplePage; return F ? F(p) : (p.children||null); };
  const ToastProvider = function(p){ var F=window.DX.ToastProvider; return F ? F(p) : (p.children||null); };
  const ConfirmProvider = function(p){ var F=window.DX.ConfirmProvider; return F ? F(p) : (p.children||null); };

  // ── useToast: напрямую через context (не через DX wrapper) ───────────
  const ToastContext = window.DX.ToastContext || createContext({ push: function(){} });
  function useToast(){ return useContext(ToastContext); }

  // ── useConfirm: внутри-приложенческое модальное подтверждение ─────────
  const ConfirmContext = window.DX.ConfirmContext || createContext({ confirm: function(){ return Promise.resolve(true); } });
  function useConfirm(){ return useContext(ConfirmContext); }

  // ── normalizePath и useHashPath: прямые реализации (без DX proxy) ────
  function normalizePath(p) {
    var raw = (String(p || '')).replace(/^#/, '');
    // Отбрасываем query/fragment для сопоставления маршрута: иначе
    // "/partner/login?logout=1" не совпадёт с "/partner/login" -> 404 и
    // не сработает выход. Сам флаг logout читается из raw-хэша отдельно.
    raw = raw.split('?')[0].split('#')[0];
    var clean = raw.startsWith('/') ? raw : '/' + raw;
    return clean.replace(/\/+$/, '') || '/';
  }
  const ToastCtx = ToastContext;
  function useHashPath() {
    var init = normalizePath(window.location.hash);
    var stateArr = useState(init);
    var path = stateArr[0];
    var setPath = stateArr[1];
    useEffect(function() {
      function onChange() { setPath(normalizePath(window.location.hash)); }
      window.addEventListener('hashchange', onChange);
      return function() { window.removeEventListener('hashchange', onChange); };
    }, []);
    return path;
  }
  function navigateToHash(p) {
    var next = String(p || '/');
    window.location.hash = next.startsWith('#') ? next : '#' + next;
  }


  // ── getScreen(): lazy lookup из DX.screens (цепочка: screen файлы → DX.screens → здесь) ──
  // Вызывается при РЕНДЕРЕ, когда DX.screens уже заполнен всеми screen файлами
  const _nullFn = function(){ return null; };
  function getScreen(name) {
    return (window.DX && window.DX.screens && window.DX.screens[name]) || _nullFn;
  }

  // ── Импорт всех утилит из DX (загружены utils-models.js + data.js) ──
  // Это позволяет App() использовать их как обычные переменные
  const _importFromDX = (function() {
    const d = window.DX || {};
    return function(name) { return d[name]; };
  })();
  
  // Критические функции которые App() использует напрямую
  const normalizeBuyerSession     = function(){ return _importFromDX('normalizeBuyerSession')(...arguments); };
  const createEmptyBuyerSession   = function(){ return _importFromDX('createEmptyBuyerSession')(...arguments); };
  const normalizeBuyerProfile     = function(){ return _importFromDX('normalizeBuyerProfile')(...arguments); };
  const createDefaultBuyerProfile = function(){ return _importFromDX('createDefaultBuyerProfile')(...arguments); };
  const buyerSessionToProfile     = function(){ return _importFromDX('buyerSessionToProfile')(...arguments); };
  const makeBuyerSessionFromSupabaseUser = function(){ return _importFromDX('makeBuyerSessionFromSupabaseUser')(...arguments); };
  const makeBuyerSessionFromLocalUser    = function(){ return _importFromDX('makeBuyerSessionFromLocalUser')(...arguments); };
  const makeBuyerId               = function(){ return _importFromDX('makeBuyerId')(...arguments); };
  const readBuyerLocalStorage     = function(){ return _importFromDX('readBuyerLocalStorage')(...arguments); };
  const writeBuyerLocalStorage    = function(){ return _importFromDX('writeBuyerLocalStorage')(...arguments); };
  const readLocalBuyerUsers       = function(){ return _importFromDX('readLocalBuyerUsers')(...arguments); };
  const writeLocalBuyerUsers      = function(){ return _importFromDX('writeLocalBuyerUsers')(...arguments); };
  const getBuyerLocalStorageKey   = function(){ return _importFromDX('getBuyerLocalStorageKey')(...arguments); };
  const clearBuyerLocalStorageForSession = function(){ return _importFromDX('clearBuyerLocalStorageForSession')(...arguments); };
  const fetchSharedAppState       = function(){ return _importFromDX('fetchSharedAppState')(...arguments); };
  const fetchBuyerAppState        = function(){ return _importFromDX('fetchBuyerAppState')(...arguments); };
  const saveBuyerAppState         = function(){ return _importFromDX('saveBuyerAppState')(...arguments); };
  const getSupabaseClient         = function(){ return _importFromDX('getSupabaseClient')(...arguments); };
  const getBuyerAuthStatus        = function(){ return _importFromDX('getBuyerAuthStatus')(...arguments); };
  const fetchProfileFromSupabase  = function(){ return _importFromDX('fetchProfileFromSupabase')(...arguments); };
  const syncProfileToSupabase     = function(){ return _importFromDX('syncProfileToSupabase')(...arguments); };
  const uploadAvatarToStorage     = function(){ return _importFromDX('uploadAvatarToStorage')(...arguments); };
  const formatTjsPrice            = function(){ return _importFromDX('formatTjsPrice')(...arguments); };
  const genId                     = function(){ return _importFromDX('genId')(...arguments); };
  const slugifyText               = function(){ return _importFromDX('slugifyText')(...arguments); };
  const normalizeGarageCar        = function(){ return _importFromDX('normalizeGarageCar')(...arguments); };
  const normalizeGarageList       = function(){ return _importFromDX('normalizeGarageList')(...arguments); };
  const normalizeSavedPlacesList  = function(){ return _importFromDX('normalizeSavedPlacesList')(...arguments); };
  const normalizeMaintenanceState = function(){ return _importFromDX('normalizeMaintenanceState')(...arguments); };
  const createEmptyMaintenanceState=function(){ return _importFromDX('createEmptyMaintenanceState')(...arguments); };
  const normalizeDocumentsState   = function(){ return _importFromDX('normalizeDocumentsState')(...arguments); };
  const createEmptyDocumentsState = function(){ return _importFromDX('createEmptyDocumentsState')(...arguments); };
  const countDocumentsState       = function(){ return _importFromDX('countDocumentsState')(...arguments); };
  const normalizeSidedDoc         = function(){ return _importFromDX('normalizeSidedDoc')(...arguments); };
  const countMaintenanceRecords   = function(){ return _importFromDX('countMaintenanceRecords')(...arguments); };
  const buildSmartCareTasks       = function(){ return _importFromDX('buildSmartCareTasks')(...arguments); };
  const normalizeMaintenanceRecord= function(){ return _importFromDX('normalizeMaintenanceRecord')(...arguments); };
  const ensureCarId               = function(){ return _importFromDX('ensureCarId')(...arguments); };
  const normalizeSellerSession    = function(){ return _importFromDX('normalizeSellerSession')(...arguments); };
  const normalizeSellerStore      = function(){ return _importFromDX('normalizeSellerStore')(...arguments); };
  const normalizeSellerProfile    = function(){ return _importFromDX('normalizeSellerProfile')(...arguments); };
  const normalizeSellerProduct    = function(){ return _importFromDX('normalizeSellerProduct')(...arguments); };
  const normalizeSellerOrdersList = function(){ return _importFromDX('normalizeSellerOrdersList')(...arguments); };
  const normalizeSellerNotificationsList=function(){ return _importFromDX('normalizeSellerNotificationsList')(...arguments); };
  const resolveSellerBackendSnapshot=function(){ return _importFromDX('resolveSellerBackendSnapshot')(...arguments); };
  const persistSellerFrontendSnapshot=function(){ return _importFromDX('persistSellerFrontendSnapshot')(...arguments); };
  const getSellerSetupState       = function(){ return _importFromDX('getSellerSetupState')(...arguments); };
  const buildSellerDashboardStats = function(){ return _importFromDX('buildSellerDashboardStats')(...arguments); };
  const resolveSellerProductsState= function(){ return _importFromDX('resolveSellerProductsState')(...arguments); };
  const normalizeSellerNotification=function(){ return _importFromDX('normalizeSellerNotification')(...arguments); };
  const mergeSellerNotifications  = function(){ return _importFromDX('mergeSellerNotifications')(...arguments); };
  const isSellerRole              = function(){ return _importFromDX('isSellerRole')(...arguments); };
  const normalizeServiceSession   = function(){ return _importFromDX('normalizeServiceSession')(...arguments); };
  const normalizeServiceProfile   = function(){ return _importFromDX('normalizeServiceProfile')(...arguments); };
  const normalizeServiceCenter    = function(){ return _importFromDX('normalizeServiceCenter')(...arguments); };
  const createServiceRegistrationDraft=function(){ return _importFromDX('createServiceRegistrationDraft')(...arguments); };
  const createServiceCenterSeed   = function(){ return _importFromDX('createServiceCenterSeed')(...arguments); };
  const normalizeServiceClientsList=function(){ return _importFromDX('normalizeServiceClientsList')(...arguments); };
  const normalizeServiceRepairOrdersList=function(){ return _importFromDX('normalizeServiceRepairOrdersList')(...arguments); };
  const createServiceClientsSeed  = function(){ return _importFromDX('createServiceClientsSeed')(...arguments); };
  const createServiceOrdersSeed   = function(){ return _importFromDX('createServiceOrdersSeed')(...arguments); };
  const normalizeServiceInventoryList=function(){ return _importFromDX('normalizeServiceInventoryList')(...arguments); };
  const createServiceInventorySeed= function(){ return _importFromDX('createServiceInventorySeed')(...arguments); };
  const normalizeServiceFinanceList=function(){ return _importFromDX('normalizeServiceFinanceList')(...arguments); };
  const createServiceFinanceSeed  = function(){ return _importFromDX('createServiceFinanceSeed')(...arguments); };
  const normalizeServiceAppointmentsList=function(){ return _importFromDX('normalizeServiceAppointmentsList')(...arguments); };
  const createServiceAppointmentsSeed=function(){ return _importFromDX('createServiceAppointmentsSeed')(...arguments); };
  const normalizeServiceRequestsList=function(){ return _importFromDX('normalizeServiceRequestsList')(...arguments); };
  const buildServiceDashboardStats= function(){ return _importFromDX('buildServiceDashboardStats')(...arguments); };
  const buildServiceFinanceSummary= function(){ return _importFromDX('buildServiceFinanceSummary')(...arguments); };
  const buildServiceDirectoryData = function(){ return _importFromDX('buildServiceDirectoryData')(...arguments); };
  const dedupeServicesById        = function(){ return _importFromDX('dedupeServicesById')(...arguments); };
  const decorateServiceRecord     = function(){ return _importFromDX('decorateServiceRecord')(...arguments); };
  const getPersonalizedServices   = function(){ return _importFromDX('getPersonalizedServices')(...arguments); };
  const buildBuyerServiceNotifications=function(){ return _importFromDX('buildBuyerServiceNotifications')(...arguments); };
  const createCatalogServiceFromCenter=function(){ return _importFromDX('createCatalogServiceFromCenter')(...arguments); };
  const mergeServiceCenterList    = function(){ return _importFromDX('mergeServiceCenterList')(...arguments); };
  const normalizeMarketProductId  = function(){ return _importFromDX('normalizeMarketProductId')(...arguments); };
  const getMarketProduct          = function(){ return _importFromDX('getMarketProduct')(...arguments); };
  const getMarketProductsByStore  = function(){ return _importFromDX('getMarketProductsByStore')(...arguments); };
  const getMarketStore            = function(){ return _importFromDX('getMarketStore')(...arguments); };
  const buildMarketplaceRuntimeData=function(){ return _importFromDX('buildMarketplaceRuntimeData')(...arguments); };
  const setMarketplaceRuntime     = function(){ return _importFromDX('setMarketplaceRuntime')(...arguments); };
  const parseMarketCartKey        = function(){ return _importFromDX('parseMarketCartKey')(...arguments); };
  const createMarketCartKey       = function(){ return _importFromDX('createMarketCartKey')(...arguments); };
  const normalizeBuyerOrder       = function(){ return _importFromDX('normalizeBuyerOrder')(...arguments); };
  const normalizeBuyerOrdersList  = function(){ return _importFromDX('normalizeBuyerOrdersList')(...arguments); };
  const getBuyerOrderStatusMeta   = function(){ return _importFromDX('getBuyerOrderStatusMeta')(...arguments); };
  const toLocalISODate            = function(){ return _importFromDX('toLocalISODate')(...arguments); };
  const prepareDocumentDataUrl    = function(){ return _importFromDX('prepareDocumentDataUrl')(...arguments); };
  const prepareAvatarDataUrl      = function(){ return _importFromDX('prepareAvatarDataUrl')(...arguments); };
  const decodeRouteSegment        = function(){ return _importFromDX('decodeRouteSegment')(...arguments); };
  const getBuyerOrderChatPath     = function(){ return _importFromDX('getBuyerOrderChatPath')(...arguments); };
  const buildMarketplaceCheckoutDraft = function(){ return _importFromDX('buildMarketplaceCheckoutDraft')(...arguments); };
  const syncMarketplaceCheckoutDraft  = function(){ return _importFromDX('syncMarketplaceCheckoutDraft')(...arguments); };
  const normalizeMarketCheckoutDraft  = function(){ return _importFromDX('normalizeMarketCheckoutDraft')(...arguments); };
  const normalizeMarketplaceOrder     = function(){ return _importFromDX('normalizeMarketplaceOrder')(...arguments); };
  const normalizeMarketplaceOrdersList= function(){ return _importFromDX('normalizeMarketplaceOrdersList')(...arguments); };
  const runSellerBackendAction    = function(){ return _importFromDX('runSellerBackendAction')(...arguments); };
  const loadSellerBackendAppState = function(){ return _importFromDX('loadSellerBackendAppState')(...arguments); };
  const saveServiceCenter         = function(){ return _importFromDX('saveServiceCenter')(...arguments); };
  const getServiceCategoryMeta    = function(){ return _importFromDX('getServiceCategoryMeta')(...arguments); };
  const resolveServiceCategoryId  = function(){ return _importFromDX('resolveServiceCategoryId')(...arguments); };
  const upsertServiceCenterToServer=function(){ return _importFromDX('upsertServiceCenterToServer')(...arguments); };
  const loadSharedServiceCenters  = function(){ return _importFromDX('loadSharedServiceCenters')(...arguments); };
  const persistServiceCenterToLocalStorage=function(){ return _importFromDX('persistServiceCenterToLocalStorage')(...arguments); };
  const getLatestPersistedServiceCenter=function(){ return _importFromDX('getLatestPersistedServiceCenter')(...arguments); };
  const serializeServiceCenterForStorage=function(){ return _importFromDX('serializeServiceCenterForStorage')(...arguments); };
  const writeSellerPendingRoute   = function(){ return _importFromDX('writeSellerPendingRoute')(...arguments); };
  const createPendingSellerStoreId= function(){ return _importFromDX('createPendingSellerStoreId')(...arguments); };
  const createSellerOrdersSeed    = function(){ return _importFromDX('createSellerOrdersSeed')(...arguments); };
  const upsertMaintenanceRecord   = function(a,b,c,d){ return _importFromDX('upsertMaintenanceRecord') ? _importFromDX('upsertMaintenanceRecord')(a,b,c,d) : null; };
  // Constants via DX
  const drivexStorageKeys    = window.DX.drivexStorageKeys    || {};
  const drivexSyncChannelName= window.DX.drivexSyncChannelName|| 'drivex.market.sync.v1';
  const marketplaceData      = window.DX.marketplaceData      || {products:[],stores:[],categories:[]};
  const nearbyServices       = window.DX.nearbyServices       || [];
  const recommendedServices  = window.DX.recommendedServices  || [];
  const serviceShowcaseProfiles = window.DX.serviceShowcaseProfiles || {};
  const sellerProductStatusOptions = window.DX.sellerProductStatusOptions || [];
  const buyerOrderStatusOptions    = window.DX.buyerOrderStatusOptions    || [];
  const serviceRepairStatusOptions = window.DX.serviceRepairStatusOptions || [];
  const serviceAppointmentStatusOptions = window.DX.serviceAppointmentStatusOptions || [];
  const serviceRequestStatusOptions     = window.DX.serviceRequestStatusOptions     || [];
  const sellerPrimaryStoreId   = window.DX.sellerPrimaryStoreId   || 'auto-parts-khujand';
  const servicePrimaryCenterId = window.DX.servicePrimaryCenterId || 'service-center-1';
  const vehicleDocumentKinds   = window.DX.vehicleDocumentKinds   || [];
  const maintenanceTypeOptions = window.DX.maintenanceTypeOptions || [];
  const quickActions           = window.DX.quickActions           || [];
  const mapFilters             = window.DX.mapFilters             || [];
  const mapPoints              = window.DX.mapPoints              || [];
  const serviceCategories      = window.DX.serviceCategories      || [];
  const serviceCategoryAliases = window.DX.serviceCategoryAliases || {};
  const marketCategories       = window.DX.marketCategories       || [];
  // Mutable live state refs
  let garageCars  = []; // shadowed by getter above
  let savedPlaces = []; // shadowed by getter above

  function App() {
    const path = useHashPath();
    const toast = useToast();
    const { confirm } = useConfirm();
    const sellerSyncChannelRef = useRef(null);
    const sharedAppStateReadyRef = useRef(false);
    const sharedAppStateUpdatedAtRef = useRef({});
    const buyerStateReadyRef = useRef(!getSupabaseClient());
    // Ключи, для которых уже применялись НЕпустые облачные данные — чтобы пустые
    // значения (из гонки фетчей) не затирали показанное на экране (анти-мелькание).
    const nonEmptyAppliedRef = useRef({});
    const recentBuyerSavesRef = useRef({});
    // Метки недавних локальных изменений seller-заказов/уведомлений. Продавец —
    // владелец этих данных; сразу после его правки (напр. смены статуса заказа)
    // фоновый polling НЕ должен применить устаревший общий снапшот и откатить статус.
    const recentSellerSavesRef = useRef({});
    // Индикатор загрузки личных данных из облака (после входа / при старте)
    const [buyerStateLoading, setBuyerStateLoading] = useState(false);
    // Stable refs — позволяют useEffect([]) читать актуальные функции без перезапуска
    const applySharedStateSnapshotRef = useRef(null);
    const applyBuyerAppStateRef      = useRef(null);
    const applyBuyerSessionRef        = useRef(null);

    const [buyerSession, setBuyerSession] = useState(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem(drivexStorageKeys.buyerSession) : null;
        if (!raw) return createEmptyBuyerSession();
        return normalizeBuyerSession(JSON.parse(raw));
      } catch {
        return createEmptyBuyerSession();
      }
    });

    // Реферал: захват ?ref= из ссылки приглашения (до регистрации)
    useEffect(() => {
      try {
        const ref = new URLSearchParams(window.location.search || "").get("ref");
        if (ref) window.localStorage.setItem("drivex.pendingRef", String(ref).toUpperCase());
      } catch { /* ignore */ }
    }, []);

    // Реферал: после авторизации покупателя фиксируем связь «кто кого» (один раз)
    useEffect(() => {
      if (!buyerSession || !buyerSession.authenticated || !buyerSession.id) return;
      let pending = "";
      try { pending = window.localStorage.getItem("drivex.pendingRef") || ""; } catch { pending = ""; }
      if (!pending) return;
      const api = window.DrivexReferrals;
      const refCode = DX.normalizeReferralCode ? DX.normalizeReferralCode(pending) : "";
      const myCode = DX.getBuyerReferralCode ? DX.getBuyerReferralCode(buyerSession.id) : "";
      const clear = () => { try { window.localStorage.removeItem("drivex.pendingRef"); } catch { /* ignore */ } };
      if (!api || !refCode || refCode === myCode) { clear(); return; }
      const name = buyerSession.name || buyerSession.fullName || "";
      api.register(refCode, buyerSession.id, name).finally(clear);
    }, [buyerSession && buyerSession.authenticated, buyerSession && buyerSession.id]);

    // Реферал: доступный бонус-баланс покупателя (заработано − потрачено)
    const [referralBalance, setReferralBalance] = useState(0);
    useEffect(() => {
      let cancelled = false;
      const api = window.DrivexReferrals;
      if (!buyerSession || !buyerSession.authenticated || !buyerSession.id || !api) { setReferralBalance(0); return; }
      const myCode = DX.getBuyerReferralCode ? DX.getBuyerReferralCode(buyerSession.id) : "";
      let spent = 0;
      try {
        const s = readBuyerLocalStorage(drivexStorageKeys.buyerInvite, buyerSession);
        spent = Math.max(0, Number(s && s.spent) || 0);
      } catch { spent = 0; }
      api.getStats(myCode).then((st) => {
        if (cancelled) return;
        const earned = Number(st && st.earned) || 0;
        setReferralBalance(Math.max(0, Math.round((earned - spent) * 100) / 100));
      }).catch(() => { if (!cancelled) setReferralBalance(0); });
      return () => { cancelled = true; };
    }, [buyerSession && buyerSession.authenticated, buyerSession && buyerSession.id]);
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
    // Синхронизируем с DX._garageCarsRef → window.garageCars (shim) будет актуален в всех компонентах
    if (window.DX) window.DX._garageCarsRef && (window.DX._garageCarsRef.val = userGarageCars);
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
    if (window.DX && window.DX._savedPlacesRef) window.DX._savedPlacesRef.val = userSavedPlaces;
    const [favorites, setFavorites] = useState(() => {
      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.favorites, buyerSession);
        return normalizeFavoritesList(raw ? raw : []);
      } catch {
        return [];
      }
    });
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

    const [emergencyContact, setEmergencyContact] = useState(() => {
      try {
        const raw = readBuyerLocalStorage(drivexStorageKeys.emergencyContact, buyerSession);
        return raw && typeof raw === "object" ? normalizeEmergencyContact(raw) : createDefaultEmergencyContact();
      } catch {
        return createDefaultEmergencyContact();
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

        // Лицензия: поддерживаем old ({id,image,...}) и new ({front,back}) форматы
        const rawLicense = Array.isArray(parsed.license) ? parsed.license[0] : parsed.license;
        next.license = normalizeSidedDoc(rawLicense, "Права");

        if (parsed.cars && typeof parsed.cars === "object") {
          const carIds = new Set([...Object.keys(parsed.cars), ...garageCars.map((car) => car.id)]);
          for (const carId of carIds) {
            const car = garageCars.find((item) => item.id === carId);
            const carDocs = parsed.cars[carId] && typeof parsed.cars[carId] === "object" ? parsed.cars[carId] : {};
            next.cars[carId] = {
              registration: normalizeSidedDoc(carDocs.registration, car ? `Техпаспорт ${car.name}` : "Техпаспорт"),
              inspection:   normalizeSidedDoc(carDocs.inspection,   car ? `Техосмотр ${car.name}`  : "Техосмотр")
            };
          }
          return next;
        }

        // Legacy: старый формат с массивами
        const legacyRegistration = Array.isArray(parsed.registration)
          ? parsed.registration.map((item) => normalizeSidedDoc(item, "Техпаспорт")).filter(Boolean)
          : [];
        const legacyInspection = Array.isArray(parsed.inspection)
          ? parsed.inspection.map((item) => normalizeSidedDoc(item, "Техосмотр")).filter(Boolean)
          : [];

        garageCars.forEach((car, index) => {
          next.cars[car.id] = {
            registration: legacyRegistration[index] || null,
            inspection:   legacyInspection[index]   || null
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
    // Магазины с геоточками из Supabase (для маркеров на общей Карте) —
    // грузятся один раз при старте в эффекте «живых данных» ниже.
    const [mapStores, setMapStores] = useState([]);

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
            // Принимаем HTTPS (Supabase Storage) и data:image/ (локально)
            let avatar = prev.avatar || "";
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
          });
          return;
        }

        if (key === drivexStorageKeys.activeCar) {
          setActiveCarId(ensureCarId(nextValue));
          return;
        }

        if (key === drivexStorageKeys.emergencyContact) {
          setEmergencyContact(normalizeEmergencyContact(nextValue));
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

        if (key === drivexStorageKeys.favorites) {
          const normalized = normalizeFavoritesList(nextValue);
          setFavorites(normalized);
          try { if (typeof marketFavoritesStore !== "undefined") marketFavoritesStore.setAll(normalized, { silent: true }); } catch {}
          return;
        }

        if (key === drivexStorageKeys.documents) {
          // Supabase хранит только HTTPS URL (data URL вырезаются при сохранении)
          // localStorage хранит полные данные включая data URL
          // Объединяем: Supabase даёт структуру, localStorage добавляет data URL если HTTPS отсутствует
          const cloudSource = nextValue && typeof nextValue === "object" ? nextValue : {};

          // Читаем локальный кеш (может содержать data URL)
          let localSource = null;
          try {
            const localRaw = readBuyerLocalStorage(drivexStorageKeys.documents, buyerSession);
            localSource = localRaw && typeof localRaw === "object" ? localRaw : null;
          } catch {}

          // Функция слияния стороны документа: предпочитаем HTTPS из облака, fallback = data URL из local
          function mergeDocPage(cloudPage, localPage) {
            if (cloudPage && cloudPage.image && (cloudPage.image.startsWith("https://") || cloudPage.image.startsWith("http://"))) {
              return cloudPage; // есть HTTPS URL из Storage — используем
            }
            if (localPage && localPage.image) {
              return localPage; // нет HTTPS — берём из localStorage (data URL или старый HTTPS)
            }
            return cloudPage || null;
          }

          function mergeSided(cloudSided, localSided) {
            const c = normalizeSidedDoc(cloudSided) || { front: null, back: null };
            const l = normalizeSidedDoc(localSided) || { front: null, back: null };
            const front = mergeDocPage(c.front, l.front);
            const back  = mergeDocPage(c.back,  l.back);
            return (front || back) ? { front: front || null, back: back || null } : null;
          }

          const next = createEmptyDocumentsState(garageCars);
          const cloudLicense = cloudSource.license;
          const localLicense = localSource && localSource.license;
          next.license = mergeSided(cloudLicense, localLicense);

          const cloudCars = cloudSource.cars && typeof cloudSource.cars === "object" ? cloudSource.cars : {};
          const localCars = localSource && localSource.cars && typeof localSource.cars === "object" ? localSource.cars : {};
          const carIds = new Set([...Object.keys(cloudCars), ...Object.keys(localCars), ...garageCars.map((c) => c.id)]);
          for (const carId of carIds) {
            const car = garageCars.find((item) => item.id === carId);
            const cDocs = cloudCars[carId] && typeof cloudCars[carId] === "object" ? cloudCars[carId] : {};
            const lDocs = localCars[carId] && typeof localCars[carId] === "object" ? localCars[carId] : {};
            next.cars[carId] = {
              registration: mergeSided(cDocs.registration, lDocs.registration),
              inspection:   mergeSided(cDocs.inspection,   lDocs.inspection)
            };
          }
          setDocuments(next);
          return;
        }

        if (key === drivexStorageKeys.maintenance) {
          const source = nextValue && typeof nextValue === "object" ? nextValue : createEmptyMaintenanceState();
          const next = createEmptyMaintenanceState();
          // Берём car id и из облака (source.cars), и из гаража — иначе при входе,
          // когда гараж ещё не загрузился, записи ТО терялись.
          const sourceCars = source.cars && typeof source.cars === "object" ? source.cars : {};
          const carIds = new Set([...Object.keys(sourceCars), ...garageCars.map((c) => c.id)]);
          for (const carId of carIds) {
            const carState = sourceCars[carId] && typeof sourceCars[carId] === "object"
              ? sourceCars[carId]
              : {};
            next.cars[carId] = {
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
          // Флаг входа в Service CRM — строго локальный (это устройство).
          // Раньше он приходил из ОБЩЕГО app-state: любой браузер инстанса
          // автоматически «входил» в чужой кабинет.
          return;
        }

        if (key === drivexStorageKeys.serviceCenter) {
          // serviceCenter больше не пишется в /api/app-state (см. persist-
          // эффект) — но старые/сторонние записи под этим ключом могли
          // остаться от прошлых версий. Игнорируем их: применение затирало
          // свежий serviceCenter устаревшим снимком (терялись priceList/
          // masters). Источник истины — /api/service-centers.
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
          setOrderChats((prev) => {
            if (nextValue === null) return Object.keys(prev || {}).length ? {} : prev;
            const incoming = normalizeOrderChatsMap(nextValue);
            if (!prev || !Object.keys(prev).length) return incoming;
            const merged = { ...prev };
            for (const [orderId, thread] of Object.entries(incoming)) {
              if (!thread) continue;
              const existingThread = merged[orderId];
              if (!existingThread) { merged[orderId] = thread; continue; }
              const existingMsgs = Array.isArray(existingThread.messages) ? existingThread.messages : [];
              const incomingMsgs = Array.isArray(thread.messages) ? thread.messages : [];
              const msgsById = new Map();
              for (const m of existingMsgs) { if (m && m.id) msgsById.set(m.id, m); }
              for (const m of incomingMsgs) { if (m && m.id) msgsById.set(m.id, m); }
              const messages = Array.from(msgsById.values()).sort((a, b) =>
                (a.sentAt || "") < (b.sentAt || "") ? -1 : 1
              );
              merged[orderId] = { ...existingThread, ...thread, messages };
            }
            // Анти-петля: входящий снапшот всегда пересобирает объект заново
            // (spread + пересортировка сообщений), даже если данные не изменились.
            // Новая ссылка триггерила эффект сохранения (см. ниже), который слал
            // те же данные обратно на сервер — а те снова прилетали поллингом.
            // Возвращаем ПРЕЖНЮЮ ссылку, если содержимое не изменилось.
            try {
              if (JSON.stringify(merged) === JSON.stringify(prev)) return prev;
            } catch {
              // не сериализуется — считаем изменившимся, ведём себя как раньше
            }
            return merged;
          });
          return;
        }

        if (key === drivexStorageKeys.marketplaceCatalog) {
          setMarketplacePartnerCatalog(normalizeMarketplacePartnerCatalog(nextValue));
        }
      },
      [sellerSession, sellerSession.sellerStoreId, sellerStore, serviceSession, serviceSession.serviceCenterId]
    );

    // ⛔ Анти-петля МЕЖДУ ВКЛАДКАМИ (тот же класс бага, что orderChats):
    // приём из BroadcastChannel/storage-события создаёт новые ссылки массивов →
    // эффекты сохранения срабатывают → pushSharedState рассылает ТЕ ЖЕ данные
    // обратно → вторая вкладка применяет → её эффекты рассылают снова → цикл.
    // Кешируем последнее известное СОДЕРЖИМОЕ по ключу: и отправка, и приём
    // пропускаются, если содержимое не изменилось.
    const crossTabContentRef = useRef({});
    const crossTabSerialize = (value) => {
      try {
        return JSON.stringify(value === undefined ? null : value);
      } catch {
        return null; // не сериализуется — не кешируем, ведём себя как раньше
      }
    };

    const pushSharedState = useCallback((key, nextValue) => {
      const serialized = crossTabSerialize(nextValue);
      if (serialized !== null && crossTabContentRef.current[key] === serialized) {
        return; // это эхо только что применённых данных — не рассылаем повторно
      }
      if (serialized !== null) crossTabContentRef.current[key] = serialized;

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

        // Непустые данные (добавленную машину/ТО/заказ) сохраняем ВСЕГДА — даже если
        // первичная загрузка ещё не завершилась. Раньше на медленном сервере сохранение
        // блокировалось до загрузки, и новые данные терялись. Профиль сохраняем только
        // после загрузки (чтобы частичный профиль не затёр аватар из облака). От затирания
        // пустым защищают saveBuyerAppState (isEmptyish) и триггер БД.
        const _hasData = (() => {
          const v = nextValue;
          if (v === null || v === undefined) return false;
          if (typeof v === "string") return v.trim() !== "";
          if (Array.isArray(v)) return v.length > 0;
          if (typeof v === "object") { const ks = Object.keys(v); return ks.length > 0 && !ks.every((k) => { const x = v[k]; return x == null || (Array.isArray(x) && !x.length) || (typeof x === "object" && x && !Object.keys(x).length); }); }
          return true;
        })();
        const _isProfileKey = key === drivexStorageKeys.profile;
        if (buyerSession?.authenticated && buyerSession.id && (buyerStateReadyRef.current || (_hasData && !_isProfileKey))) {
          // Сохраняем в Supabase ТОЛЬКО после первичной загрузки серверного состояния
          // (buyerStateReadyRef === true). Иначе сброс к дефолтам при логине/перезагрузке
          // успевает перезаписать реальные данные пользователя пустыми значениями.
          // localStorage пишется выше без гейта — локальные правки не теряются.
          // Метку «недавнего сохранения» ставим ТОЛЬКО при реальной отправке на сервер —
          // иначе сброс к дефолтам (gated) помечал бы ключи и блокировал применение
          // серверных данных (skipRecent) при первичной загрузке → пустой гараж.
          try {
            recentBuyerSavesRef.current = recentBuyerSavesRef.current || {};
            recentBuyerSavesRef.current[key] = Date.now();
          } catch {
            // ignore
          }
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

        // Идентичность продавца (сессия/профиль/магазин/товары) принадлежит
        // seller-бэкенду (локальная БД в local-режиме, Supabase иначе), а не общему
        // app-state.json. Видимость товаров для покупателей идёт через marketplaceCatalog.
        // Если применять эти ключи из общего снапшота, устаревшие данные затирают
        // корректное состояние, восстановленное из seller-бэкенда. Поэтому пропускаем их.
        const sellerBackendOwnedKeys = new Set([
          drivexStorageKeys.sellerSession,
          drivexStorageKeys.sellerProfile,
          drivexStorageKeys.sellerStore,
          drivexStorageKeys.sellerProducts
        ]);

        for (const [key, entry] of Object.entries(sharedState)) {
          if (!includeBuyerPersonal && buyerPersonalStorageKeys.has(key)) continue;
          if (sellerBackendOwnedKeys.has(key)) continue;
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

          // Та же защита для seller-заказов/уведомлений: после локальной правки продавца
          // не даём устаревшему снапшоту откатить статус (напр. «Подтверждён» → «Новый»),
          // пока POST не долетит до общего состояния.
          const recentSeller = (recentSellerSavesRef.current && recentSellerSavesRef.current[key]) || 0;
          if ((key === drivexStorageKeys.sellerOrders || key === drivexStorageKeys.sellerNotifications) && Date.now() - recentSeller < 5000) {
            console.debug && console.debug("[applySharedStateSnapshot] skip applying recent seller key", { key });
            continue;
          }

          // Анти-мелькание: не затираем уже показанные НЕпустые данные пустыми,
          // прилетевшими из гонки фетчей (симптом «данные появились и исчезли»).
          const _isEmptyish = (v) => {
            if (v === null || v === undefined) return true;
            if (typeof v === "string") return v.trim() === "";
            if (typeof v === "number" || typeof v === "boolean") return false;
            if (Array.isArray(v)) return v.length === 0;
            if (typeof v === "object") { const ks = Object.keys(v); return ks.length === 0 || ks.every((k) => _isEmptyish(v[k])); }
            return false;
          };
          if (_isEmptyish(value)) {
            if (nonEmptyAppliedRef.current[key]) {
              console.debug && console.debug("[applySharedStateSnapshot] skip empty over non-empty", { key });
              continue;
            }
          } else {
            nonEmptyAppliedRef.current[key] = true;
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
          applySharedStateSnapshotRef.current && applySharedStateSnapshotRef.current(sharedState);
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
    }, []); // [] — не перезапускаем при изменении функций

    useEffect(() => {
      let cancelled = false;

      const pullLiveState = () => {
        fetchSharedAppState()
          .then((sharedState) => {
            if (cancelled) return;
            applySharedStateSnapshotRef.current && applySharedStateSnapshotRef.current(sharedState, {
              onlyNewer: true,
              onlyLiveKeys: true
            });
          })
          .catch(() => {
            // Следующий polling попробует снова.
          });
      };

      // 8с вместо 3.5с: на каждый цикл JSON.stringify всего app-state (растёт
      // с демо-данными, уже ~500КБ) — на слабых устройствах частый повтор
      // этого разбора наблюдался как зависание/чёрный экран через некоторое время.
      const intervalId = window.setInterval(pullLiveState, 8000);
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
    }, []); // [] — polling запускается один раз

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

      // Магазины с геоточками (выбраны продавцами на карте при регистрации) —
      // для маркеров на общей Карте.
      if (typeof supa.loadMapStores === "function") {
        supa.loadMapStores({ limit: 60 }).then((stores) => {
          if (!cancelled && Array.isArray(stores) && stores.length) setMapStores(stores);
        }).catch(() => {});
      }

      // Реальные оценки товаров из отзывов покупателей
      const reviewsApi = window.DrivexMarketReviews;
      if (reviewsApi && typeof reviewsApi.loadRatingsSummary === "function") {
        reviewsApi.loadRatingsSummary().then((summaryMap) => {
          if (!cancelled && summaryMap && typeof marketRatingsStore !== "undefined") {
            marketRatingsStore.setAll(summaryMap);
          }
        }).catch(() => {});
      }

      return () => { cancelled = true; };
    }, []);

    const applyBuyerSession = useCallback((session) => {
      const nextSession = normalizeBuyerSession(session);
      const isNewUser = nextSession.authenticated && nextSession.id !== buyerSession?.id;
      if (isNewUser) {
        buyerStateReadyRef.current = false;
        setProfile(createDefaultBuyerProfile());
        setUserGarageCars([]);
        setActiveCarId("");
        setUserSavedPlaces([]);
        setFavorites([]);
        setDocuments(createEmptyDocumentsState());
        setMaintenance(createEmptyMaintenanceState());
        setBuyerOrders([]);
        setOrderChats({});
        setCart({});

        // При Supabase-логине тянем профиль из БД (аватар и проч.)
        if (nextSession.provider === "supabase") {
          fetchProfileFromSupabase(nextSession).then(function(remoteProfile) {
            if (remoteProfile) {
              setProfile(function(prev) {
                return normalizeBuyerProfile(Object.assign({}, prev, remoteProfile));
              });
            }
          }).catch(function(){});
        }
      }
      setBuyerSession(nextSession);
      setProfile((prev) => buyerSessionToProfile(nextSession, prev));
      return nextSession;
    }, [buyerSession?.id]);

    const applyBuyerAppState = useCallback(
      (state) => {
        // Всегда ставим ready=true — иначе saveBuyerAppState никогда не вызывается
        if (state && typeof state === "object") {
          // Защита от потери данных: НЕ применяем пустые/дефолтные серверные значения
          // поверх реальных локальных данных (иначе «отравленный» дефолтами сервер
          // затирал бы машины/профиль покупателя при каждой перезагрузке).
          const defaultProfileName = createDefaultBuyerProfile().name;
          const isEmptyStateValue = (key, value) => {
            if (value === null || value === undefined) return true;
            if (Array.isArray(value)) return value.length === 0;
            if (typeof value === "string") return value.trim() === "";
            if (typeof value === "object") {
              if (key === drivexStorageKeys.profile) {
                return (!value.name || value.name === defaultProfileName) && !value.phone && !value.avatar;
              }
              const vals = Object.values(value);
              if (!vals.length) return true;
              return vals.every((v) =>
                v === null || v === undefined ||
                (Array.isArray(v) && v.length === 0) ||
                (typeof v === "object" && v && Object.keys(v).length === 0) ||
                (typeof v === "string" && v.trim() === "")
              );
            }
            return false;
          };
          const filtered = {};
          for (const [key, entry] of Object.entries(state)) {
            const value = entry && typeof entry === "object" && Object.prototype.hasOwnProperty.call(entry, "value")
              ? entry.value
              : entry;
            if (!isEmptyStateValue(key, value)) filtered[key] = entry;
          }
          applySharedStateSnapshot(filtered, { includeBuyerPersonal: true });
        }
        buyerStateReadyRef.current = true;
        setBuyerStateLoading(false); // данные загружены — убираем индикатор
      },
      [applySharedStateSnapshot]
    );

    // Обновляем stable refs при каждом рендере
    applySharedStateSnapshotRef.current = applySharedStateSnapshot;
    applyBuyerAppStateRef.current       = applyBuyerAppState;
    applyBuyerSessionRef.current        = applyBuyerSession;

    useEffect(() => {
      const client = getSupabaseClient();
      setBuyerAuthStatus(getBuyerAuthStatus());
      if (!client) return;

      let cancelled = false;
      client.auth
        .getSession()
        .then(({ data }) => {
          if (cancelled || !data?.session?.user) return;
          const fn = applyBuyerSessionRef.current;
          const session = fn && fn(makeBuyerSessionFromSupabaseUser(data.session.user));
          if (!session) return;
          // Блокирующий оверлей только при первой загрузке. Фоновые ресинки
          // (token refresh, focus) не должны перекрывать уже отрисованный UI.
          if (!buyerStateReadyRef.current) setBuyerStateLoading(true);
          fetchBuyerAppState(session)
            .then((state) => {
              if (!cancelled) {
                const applyFn = applyBuyerAppStateRef.current;
                applyFn && applyFn(state || {});
              }
            })
            .catch(() => { buyerStateReadyRef.current = true; setBuyerStateLoading(false); });
        })
        .catch(() => {});

      const subscription = client.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        if (session?.user) {
          const fn = applyBuyerSessionRef.current;
          const nextSession = fn && fn(makeBuyerSessionFromSupabaseUser(session.user));
          if (!nextSession) return;
          // Блокирующий оверлей только при первой загрузке (см. выше).
          if (!buyerStateReadyRef.current) setBuyerStateLoading(true);
          fetchBuyerAppState(nextSession)
            .then((state) => {
              if (!cancelled) {
                const applyFn = applyBuyerAppStateRef.current;
                applyFn && applyFn(state || {});
              }
            })
            .catch(() => { buyerStateReadyRef.current = true; setBuyerStateLoading(false); });
        } else {
          buyerStateReadyRef.current = !getSupabaseClient();
          setBuyerStateLoading(false);
          setBuyerSession(createEmptyBuyerSession());
        }
      });

      return () => {
        cancelled = true;
        const sub = subscription?.data?.subscription || subscription?.subscription;
        if (sub && typeof sub.unsubscribe === "function") sub.unsubscribe();
      };
    }, []); // [] — auth подписка один раз, refs всегда актуальны

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
          // Документы хранятся двусторонними ({front, back}) — нормализуем тем же
          // нормализатором, что и при загрузке (normalizeSidedDoc), иначе обнуляются.
          nextCars[car.id] = {
            registration: normalizeSidedDoc(carDocs.registration),
            inspection: normalizeSidedDoc(carDocs.inspection)
          };
        }
        return { license: normalizeSidedDoc(current.license), cars: nextCars };
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
      pushBuyerState(drivexStorageKeys.favorites, favorites);
    }, [pushBuyerState, favorites]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.emergencyContact, emergencyContact);
    }, [pushBuyerState, emergencyContact]);

    useEffect(() => {
      try {
        if (typeof marketFavoritesStore === "undefined") return;
        marketFavoritesStore.setAll(Array.isArray(favorites) ? favorites : [], { silent: true });
        return marketFavoritesStore.subscribe(() => {
          const list = marketFavoritesStore.list();
          setFavorites(list);
          pushBuyerState(drivexStorageKeys.favorites, list);
        });
      } catch { /* ignore if store not ready */ }
    }, [buyerSession?.id]);  // eslint-disable-line

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
      // НЕ синхронизируем идентичность продавца в общий app-state.json —
      // источник истины это seller-бэкенд (локальная БД / Supabase). Иначе
      // устаревшие данные одного браузера затирают корректное состояние.
    }, [sellerSession]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.sellerProfile, JSON.stringify(sellerProfile));
      } catch {
        toast.push("Не удалось сохранить seller профиль");
      }
      // Идентичность продавца не уходит в общий app-state.json (см. sellerSession).
    }, [sellerProfile, toast]);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem(drivexStorageKeys.sellerStore, JSON.stringify(sellerStore));
      } catch {
        toast.push("Не удалось сохранить настройки seller магазина");
      }
      // Идентичность продавца не уходит в общий app-state.json (см. sellerSession).
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
      // Товары продавца видны покупателям через marketplaceCatalog (см. applySellerBackendAppState),
      // а не через прямую запись в общий app-state.json. Это исключает гонку устаревших данных.
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
      // serviceAuth НЕ уходит в общий app-state: вход действует только на
      // этом устройстве (см. applySharedStateUpdate — оттуда он тоже не читается).
    }, [serviceAuth]);

    useEffect(() => {
      const persisted = persistServiceCenterToLocalStorage(serviceCenter, serviceSession.serviceCenterId);
      if (!persisted.ok) {
        toast.push("Не удалось сохранить карточку сервиса");
      }
      // ⛔ БОЛЬШЕ не зеркалим serviceCenter в общий /api/app-state. Раньше это
      // писало сюда И читалось обратно через 3.5с-поллинг (pullLiveState →
      // applySharedStateUpdate). Как только /api/app-state однажды получал
      // УСТАРЕВШИЙ снимок (напр. из-за гонки до фикса debounce-автосейва),
      // следующий же поллинг тем же устаревшим значением затирал корректный
      // serviceCenter в памяти и localStorage — приорсы/мастера пропадали
      // насовсем, хотя /api/service-centers (авторитетный источник) был верным.
      // serviceCenter теперь синкается ТОЛЬКО через явные действия
      // (saveServiceCenter/registerServiceCrm/loginServiceCrm), которые пишут
      // прямиком в /api/service-centers.
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

    // ⛔ УДАЛЁН debounce-автосейв serviceCenter → сервер (был здесь: 700мс после
    // ЛЮБОГО изменения serviceCenter). Он дублировал явный saveServiceCenter()
    // (settings-сабмит уже сам зовёт saveSharedServiceCenter) и гонялся с ним:
    // при быстрой навигации после сохранения этот эффект успевал переотправить
    // УСТАРЕВШИЙ снимок serviceCenter и затирал на сервере только что
    // сохранённые priceList/masters пустыми массивами. Сервер теперь получает
    // центр ТОЛЬКО из явных действий (сохранение настроек, регистрация, вход).

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.buyerOrders, buyerOrders);
    }, [buyerOrders, pushBuyerState]);

    useEffect(() => {
      pushBuyerState(drivexStorageKeys.orderChats, orderChats);
      pushSharedState(drivexStorageKeys.orderChats, orderChats);
    }, [orderChats, pushBuyerState, pushSharedState]);

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
        // Анти-петля: если содержимое уже применялось/отправлялось этой
        // вкладкой — пропускаем (см. crossTabContentRef у pushSharedState).
        const serialized = crossTabSerialize(message.value);
        if (serialized !== null && crossTabContentRef.current[message.key] === serialized) return;
        if (serialized !== null) crossTabContentRef.current[message.key] = serialized;
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
          // Анти-петля: не применяем содержимое, которое эта вкладка уже
          // применяла/отправляла (см. crossTabContentRef у pushSharedState).
          const serialized = crossTabSerialize(parsed);
          if (serialized !== null && crossTabContentRef.current[event.key] === serialized) return;
          if (serialized !== null) crossTabContentRef.current[event.key] = serialized;
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

      const name = typeof next.name === "string" ? next.name : "";
      const phone = typeof next.phone === "string" ? next.phone : "";
      const email = typeof next.email === "string" ? next.email : "";
      const avatarRaw = String(typeof next.avatar === "string" ? next.avatar : "").trim();

      let avatar = "";
      if (avatarRaw) {
        if (avatarRaw.startsWith("https://") || avatarRaw.startsWith("http://")) {
          avatar = avatarRaw;
        } else if (avatarRaw.startsWith("data:image/") && avatarRaw.length <= 500000) {
          avatar = avatarRaw;
        }
      }

      setProfile((prev) => {
        const nextProfile = {
          name: String(name || "").trim() || prev.name,
          phone: String(phone || "").trim() || prev.phone,
          email: String(email || "").trim() || prev.email,
          avatar: avatar || (avatarRaw === "" ? "" : prev.avatar)
        };
        pushBuyerState(drivexStorageKeys.profile, nextProfile);
        return nextProfile;
      });

      // Фоновый синк с Supabase — вне setProfile чтобы не вызывать лупы
      const profileForSync = {
        name: String(name || "").trim(),
        phone: String(phone || "").trim(),
        email: String(email || "").trim().toLowerCase(),
        avatar
      };
      syncProfileToSupabase(buyerSession, profileForSync).catch(function(){});
    }, [pushBuyerState, buyerSession]);

    const updateEmergencyContact = useCallback((next) => {
      setEmergencyContact(normalizeEmergencyContact(next));
    }, []);

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

    // ── Избранное ──────────────────────────────────────────────────────────
    const removeFavorite = useCallback((type, id) => {
      const safeType = type === "product" ? "product" : "service";
      const safeId = String(id || "");
      setFavorites((prev) => normalizeFavoritesList(prev).filter((f) => !(f.type === safeType && f.id === safeId)));
    }, []);

    const toggleFavorite = useCallback((item) => {
      const normalized = normalizeFavorite(item);
      if (!normalized) return false;
      let added = false;
      setFavorites((prev) => {
        const list = normalizeFavoritesList(prev);
        const exists = list.some((f) => f.type === normalized.type && f.id === normalized.id);
        if (exists) {
          added = false;
          return list.filter((f) => !(f.type === normalized.type && f.id === normalized.id));
        }
        added = true;
        return [normalized, ...list];
      });
      return added;
    }, []);

    // side = "front" | "back"
    const setLicenseDocument = useCallback((side, doc) => {
      if (!side || !doc || typeof doc !== "object") return;
      const safeSide = side === "back" ? "back" : "front";

      setDocuments((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyDocumentsState();
        const imageVal = doc.image || doc.fileUrl || "";
        const patchedDoc = { ...doc, image: imageVal };
        const nextPage = normalizeDocumentItem(patchedDoc, safeSide === "front" ? "Права (лицевая)" : "Права (обратная)")
          || (imageVal ? { id: doc.id || genId("doc"), name: doc.name || "Права", image: imageVal, addedAt: doc.addedAt || Date.now() } : null);
        if (!nextPage) return prev;

        // Получаем текущий sided doc (с обратной совместимостью)
        const existingSided = normalizeSidedDoc(current.license) || { front: null, back: null };
        const nextSided = { ...existingSided, [safeSide]: nextPage };

        const nextState = { ...current, license: nextSided };
        pushBuyerState(drivexStorageKeys.documents, nextState);
        return nextState;
      });
    }, [pushBuyerState]);

    const removeLicenseDocument = useCallback((side) => {
      setDocuments((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyDocumentsState();
        if (!current.license) return prev;

        let nextLicense;
        if (side === "front" || side === "back") {
          const existing = normalizeSidedDoc(current.license) || { front: null, back: null };
          const updated = { ...existing, [side]: null };
          nextLicense = (updated.front || updated.back) ? updated : null;
        } else {
          nextLicense = null;
        }

        const nextState = { ...current, license: nextLicense };
        pushBuyerState(drivexStorageKeys.documents, nextState);
        return nextState;
      });
    }, [pushBuyerState]);

    // side = "front" | "back"
    const setCarDocument = useCallback((carId, kind, side, doc) => {
      if (!carId || !kind || !side) return;
      if (!doc || typeof doc !== "object") return;
      if (!["registration", "inspection"].includes(kind)) return;
      const safeSide = side === "back" ? "back" : "front";

      setDocuments((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyDocumentsState();
        const carDocs = current.cars && current.cars[carId] ? current.cars[carId] : { registration: null, inspection: null };
        const kindLabel = kind === "registration" ? "Техпаспорт" : "Техосмотр";
        const sideLabel = safeSide === "front" ? " (лицевая)" : " (обратная)";
        const imageVal = doc.image || doc.fileUrl || "";
        const patchedDoc = { ...doc, image: imageVal };
        const nextPage = normalizeDocumentItem(patchedDoc, kindLabel + sideLabel)
          || (imageVal ? { id: doc.id || genId("doc"), name: doc.name || kindLabel, image: imageVal, addedAt: doc.addedAt || Date.now() } : null);
        if (!nextPage) return prev;

        const existingSided = normalizeSidedDoc(carDocs[kind]) || { front: null, back: null };
        const nextSided = { ...existingSided, [safeSide]: nextPage };

        const nextState = {
          ...current,
          cars: {
            ...(current.cars || {}),
            [carId]: { ...carDocs, [kind]: nextSided }
          }
        };
        pushBuyerState(drivexStorageKeys.documents, nextState);
        return nextState;
      });
    }, [pushBuyerState]);

    const removeCarDocument = useCallback((carId, kind, side) => {
      if (!carId || !kind) return;
      if (!["registration", "inspection"].includes(kind)) return;

      setDocuments((prev) => {
        const current = prev && typeof prev === "object" ? prev : createEmptyDocumentsState();
        const carDocs = current.cars && current.cars[carId] ? current.cars[carId] : null;
        if (!carDocs) return prev;

        let nextKind;
        if (side === "front" || side === "back") {
          const existing = normalizeSidedDoc(carDocs[kind]) || { front: null, back: null };
          const updated = { ...existing, [side]: null };
          nextKind = (updated.front || updated.back) ? updated : null;
        } else {
          nextKind = null;
        }

        const nextState = {
          ...current,
          cars: {
            ...(current.cars || {}),
            [carId]: { ...carDocs, [kind]: nextKind }
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
              const _r = await client.from("users").select("role,full_name").eq("id", user.id);
              userRow = Array.isArray(_r.data) ? _r.data[0] : (_r.data || null);
            } catch(_) {}
            if (userRow?.role) actualRole = userRow.role;
            // Машины/документы/ТО грузятся ТОЛЬКО из единого дерева (user_app_state)
            // через fetchBuyerAppState ниже — не дублируем чтение из users.cars.
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
        const rawPhone = String(payload?.phone || "").trim();
        const email    = String(payload?.email || "").trim().toLowerCase();
        const password = String(payload?.password || "");
        const name     = String(payload?.name || "").trim();

        if (!name) throw new Error("Введите имя");
        if (!password || password.length < 6) throw new Error("Пароль — минимум 6 символов");

        const client = getSupabaseClient();
        if (client) {
          // Определяем email для Supabase Auth:
          // - если передан реальный email → используем его
          // - если только телефон → генерируем phone-email
          const digits = rawPhone.replace(/\D/g, "");
          // Единая схема phone-email во всех путях входа (совпадает с OTP в auth-phone.js),
          // чтобы один номер всегда давал один и тот же Supabase-аккаунт (без дублей).
          const authEmail = email || ("phone_" + digits + "@drivex.app");

          const { data, error } = await client.auth.signUp({
            email: authEmail,
            password,
            options: {
              data: { role: payload.role || "buyer", full_name: name, phone: rawPhone }
            }
          });

          // Номер уже зарегистрирован (или signUp вернул user без session —
          // так Supabase отвечает при включённом email-confirm). Пробуем сразу
          // войти с введённым паролем: повторная «регистрация» того же номера
          // с верным паролем превращается в обычный вход, а не в ошибку.
          // БЕЗ этого возможен тихий сценарий: applyBuyerSession локально
          // «входит», но реальной сессии в клиенте нет — и через несколько
          // секунд onAuthStateChange(null) выбрасывает на экран входа.
          let authedUser = data?.user || null;
          if (error || !data?.session) {
            const isExisting = error && /already (registered|exists)/i.test(String(error.message || ""));
            if (error && !isExisting) throw error;
            const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
              email: authEmail,
              password
            });
            if (signInError || !signInData?.session) {
              throw new Error("Этот номер уже зарегистрирован. Войдите с паролем или восстановите его через «Забыли пароль?»");
            }
            authedUser = signInData.user;
          }

          const session = makeBuyerSessionFromSupabaseUser(authedUser);
          // Создаём запись в public.users
          await client.from("users").upsert({
            id: authedUser?.id,
            full_name: name,
            phone: rawPhone,
            email: authEmail,
            role: payload.role || "buyer"
          }, { onConflict: "id" }).catch(() => {});
          applyBuyerSession(session);
          buyerStateReadyRef.current = true;

          // Встроенные браузеры (Telegram/Instagram на iOS) могут не сохранять
          // вход между перезагрузками — честно предупреждаем сразу.
          try {
            if (!window.localStorage.getItem("drivex-auth")) {
              toast.push("Вход может не сохраниться в этом браузере — откройте сайт в Safari или Chrome");
            }
          } catch {
            toast.push("Вход может не сохраниться в этом браузере — откройте сайт в Safari или Chrome");
          }
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
      [applyBuyerSession, loginByPhone, toast]
    );

    const loginBuyer = useCallback(
      async (payload) => {
        // Если это phone-based session из OTP — просто применяем
        if (payload?._supabaseSession) {
          return loginByPhone(payload);
        }

        const phone    = String(payload?.phone || "").trim();
        const email    = String(payload?.email || "").trim().toLowerCase();
        const password = String(payload?.password || "");

        if (!password) throw new Error("Введите пароль");
        if (!phone && !email) throw new Error("Введите номер телефона или email");

        const client = getSupabaseClient();
        if (client) {
          // Собираем кандидатов email и пробуем войти по очереди.
          // Надёжно даже если в users записан неверный email: детерминированный
          // phone_<digits>@drivex.app всегда среди кандидатов и будет проверен.
          let candidateEmails = [];
          if (email) {
            candidateEmails = [email];
          } else if (phone) {
            const digits = phone.replace(/\D/g, "");
            const last9 = digits.slice(-9);
            let lookedUp = [];
            try {
              // Поиск email по ПОСЛЕДНИМ 9 цифрам номера — устойчив к пробелам и формату.
              // В users телефон хранится как "+992 111180333" (с пробелом), и точный
              // матч (.in) его не находил → вход по телефону падал в неверный аккаунт.
              const r1 = await client.from("users").select("email,phone").ilike("phone", "%" + last9 + "%");
              lookedUp = Array.isArray(r1.data) ? r1.data.map((row) => row && row.email).filter(Boolean) : [];
            } catch (_) {}
            candidateEmails = Array.from(new Set([...lookedUp, "phone_" + digits + "@drivex.app"]));
          }

          let data = null;
          let lastError = null;
          let authEmail = candidateEmails[0] || email;
          for (const em of candidateEmails) {
            const r = await client.auth.signInWithPassword({ email: em, password });
            if (!r.error) { data = r.data; authEmail = em; lastError = null; break; }
            lastError = r.error;
          }
          if (!data) throw lastError || new Error("Неверный номер или пароль");
          const session = makeBuyerSessionFromSupabaseUser(data?.user);

          // Самолечение реестра: гарантируем строку в public.users с НАШИМ auth-id
          // (раньше строки создавались с чужими id → дубли и нестабильный поиск по номеру).
          try {
            const selfDigits = String(session.phone || phone || "").replace(/\D/g, "");
            const selfPhone = selfDigits ? ("+" + selfDigits) : "";
            await client.from("users").upsert({
              id: session.id,
              full_name: session.name || "",
              phone: selfPhone,
              email: session.email || authEmail,
              role: session.role || "buyer"
            }, { onConflict: "id" }).catch(() => {});
          } catch (_) {}

          // Имя/телефон для подписи сессии берём из мини-реестра public.users.
          // ВСЕ личные данные (машины, документы, ТО, заказы и т.д.) грузятся ТОЛЬКО
          // из единого дерева user_app_state (fetchBuyerAppState ниже) — один источник.
          const supa = window.DrivexSupabaseData;
          if (supa && session.id) {
            const userProfile = await supa.loadUserProfile(session.id).catch(() => null);
            if (userProfile) {
              session.name = userProfile.full_name || session.name;
              session.phone = userProfile.phone || session.phone;
            }
          }

          applyBuyerSession(session);
          setBuyerStateLoading(true);
          const state = await fetchBuyerAppState(session).catch(() => null);
          if (state) {
            applyBuyerAppState(state);
          } else {
            buyerStateReadyRef.current = true;
            setBuyerStateLoading(false);
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
      const confirmed = await confirm({
        title: "Выйти из аккаунта?",
        message: "Ваши данные сохранены в облаке.",
        confirmLabel: "Выйти",
        cancelLabel: "Остаться",
        danger: true,
        icon: "lock"
      });
      if (!confirmed) return;
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
      setBuyerStateLoading(false);
      setProfile(createDefaultBuyerProfile());
      setUserGarageCars([]);
      setUserSavedPlaces([]);
      setFavorites([]);
      setActiveCarId("");
      setDocuments({ license: null, cars: {} });
      setMaintenance({ cars: {} });
      setBuyerOrders([]);
      setOrderChats({});
      setCart({});
      navigateToHash("/login");
      toast.push("Вы вышли из аккаунта");
    }, [buyerSession, toast, confirm]);

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

        // Помечаем локальную правку ДО setState, чтобы фоновый polling, который
        // может сработать между optimistic-обновлением и POST, не откатил статус.
        try {
          recentSellerSavesRef.current = recentSellerSavesRef.current || {};
          recentSellerSavesRef.current[drivexStorageKeys.sellerOrders] = Date.now();
        } catch {
          // ignore
        }

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

      setOrderChats((prev) => {
        const next = appendOrderChatMessage(prev, safeOrderId, { senderRole, text: safeText });
        try { pushSharedState(drivexStorageKeys.orderChats, next); } catch {}
        return next;
      });
    }, [pushSharedState]);

    const markOrderChatRead = useCallback((orderId, viewerRole) => {
      const safeOrderId = String(orderId || "").trim();
      if (!safeOrderId) return;

      setOrderChats((prev) => {
        if (!getOrderChatUnreadCount(prev, safeOrderId, viewerRole)) return prev;
        const next = markOrderChatAsRead(prev, safeOrderId, viewerRole);
        try { pushSharedState(drivexStorageKeys.orderChats, next); } catch {}
        return next;
      });
    }, [pushSharedState]);

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

    const registerServiceCrm = useCallback(async (payload) => {
      if (!payload || typeof payload !== "object") return;

      // Реальная регистрация: аккаунт владельца создаётся в Supabase Auth.
      // Пароль НИГДЕ не сохраняется — раньше он лежал открытым текстом в
      // общем app-state.json, и «логин» сверял строки на клиенте.
      const authEmail = String(payload?.profile?.email || "").trim().toLowerCase();
      const authPassword = String(payload?.profile?.password || "");
      if (!authEmail || authEmail.indexOf("@") === -1) {
        throw new Error("Укажите корректный email — это логин кабинета");
      }
      if (authPassword.length < 6) {
        throw new Error("Пароль — минимум 6 символов");
      }
      const client = getSupabaseClient();
      if (!client) {
        throw new Error("Нет соединения с сервером авторизации — попробуйте позже");
      }

      let ownerUserId = "";
      // role в metadata НЕ передаём: DB-триггер копирует её в public.users,
      // а CHECK-ограничение не знает service_owner и валит всю регистрацию
      // («Database error saving new user»). Права кабинета определяет владение
      // центром (ownerUserId), а не роль в users.
      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            full_name: payload?.profile?.ownerFullName || "",
            phone: payload?.profile?.phone || ""
          }
        }
      });
      if (signUpError) {
        const looksExisting = /already|registered|exists/i.test(String(signUpError.message || ""));
        if (!looksExisting) {
          throw new Error(signUpError.message || "Не удалось создать аккаунт");
        }
        // Email уже занят: пробуем войти с этим паролем (владелец повторяет регистрацию)
        const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        if (signInError) {
          throw new Error("Этот email уже зарегистрирован. Войдите с его паролем или восстановите доступ.");
        }
        ownerUserId = signInData?.user?.id || "";
      } else {
        ownerUserId = signUpData?.user?.id || "";
        // signUp может вернуть user БЕЗ сессии — тогда активной остаётся
        // предыдущая (покупательская) сессия браузера, и сервер привязал бы
        // центр к ЧУЖОМУ uid. Входим явно, чтобы токен был владельца.
        if (!signUpData?.session) {
          const { error: postSignInError } = await client.auth.signInWithPassword({
            email: authEmail,
            password: authPassword
          });
          if (postSignInError) {
            throw new Error("Аккаунт создан, но вход не удался. Подтвердите email и войдите.");
          }
        }
      }
      if (!ownerUserId) {
        throw new Error("Авторизация не подтвердила аккаунт — попробуйте ещё раз");
      }

      const resolvedCenterId = slugifyText(
        [payload?.center?.name, payload?.center?.city].filter(Boolean).join("-"),
        payload?.center?.id || `service-${Date.now()}`
      );
      const nextSession = normalizeServiceSession({
        id: ownerUserId,
        name: payload?.profile?.ownerFullName || "",
        email: authEmail,
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
          ownerUserId,
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

      if (!identifier) {
        throw new Error("Введите email или телефон");
      }
      if (!password) {
        throw new Error("Введите пароль");
      }
      const client = getSupabaseClient();
      if (!client) {
        throw new Error("Нет соединения с сервером авторизации — попробуйте позже");
      }

      // Вход по телефону: находим email владельца по реестру центров
      let email = identifier.toLowerCase();
      if (email.indexOf("@") === -1) {
        const phoneDigits = identifier.replace(/\D/g, "");
        const centers = await fetchSharedServiceCenters().catch(() => []);
        const byPhone = centers.find(
          (item) => String(item.phone || "").replace(/\D/g, "") === phoneDigits && item.email
        );
        if (!byPhone) {
          throw new Error("Сервис с таким номером не найден. Войдите по email.");
        }
        email = String(byPhone.email).toLowerCase();
      }

      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw new Error("Неверный email или пароль");
      }
      const ownerUserId = signInData?.user?.id || "";

      // Восстанавливаем кабинет по владельцу: работает с любого устройства
      const centers = await fetchSharedServiceCenters().catch(() => []);
      const ownCenter = centers.find((item) => item.ownerUserId === ownerUserId);
      if (!ownCenter) {
        throw new Error("Этот аккаунт не привязан к сервису. Зарегистрируйте сервис.");
      }

      const nextSession = normalizeServiceSession({
        id: ownerUserId,
        name: signInData?.user?.user_metadata?.full_name || ownCenter.name || "",
        email,
        role: "service_owner",
        serviceCenterId: ownCenter.id
      });
      setServiceSession(nextSession);
      setServiceProfile(normalizeServiceProfile(
        {
          ownerFullName: signInData?.user?.user_metadata?.full_name || "",
          phone: signInData?.user?.user_metadata?.phone || ownCenter.phone || "",
          email,
          registrationCompleted: true
        },
        nextSession
      ));
      setServiceCenter(ownCenter);
      setSharedServiceCenters((prev) => mergeServiceCenterList(prev, ownCenter));
      setServiceAuth({
        authenticated: true,
        lastLoginAt: new Date().toISOString()
      });
      toast.push("Вы вошли в Service CRM");
      navigateToHash("/service-crm/dashboard");
    }, [toast]);

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
      // Заявка рождается «new» — сервис должен подтвердить её в своей CRM.
      // Раньше статус сразу был «accepted», и клиент видел «Приняли», хотя
      // сервис заявку даже не открывал.
      let request = normalizeServiceRequest({
        ...payload,
        createdAt,
        status: "new",
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
          // Владелец CRM записывает клиента в СВОЙ центр — слот и заказ уже
          // созданы, поэтому заявка сразу подтверждена.
          status: "accepted",
          statusUpdatedAt: new Date().toISOString(),
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

      toast.push(
        request.status === "accepted"
          ? `Запись подтверждена: ${formatRuDate(request.day)} • ${request.time}`
          : `Заявка отправлена в «${request.serviceName}» — сервис подтвердит запись`
      );
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

    // ── Входящие заявки сервиса: подтверждение и отклонение ────────────
    // Принятие заявки — то же, что владелец делал при записи в свой центр:
    // клиент + слот в расписании + ремонтный заказ, и только потом «accepted».
    const acceptServiceRequest = useCallback((requestId) => {
      const request = normalizeServiceRequestsList(serviceRequests).find((item) => item.id === requestId);
      if (!request) {
        toast.push("Заявка не найдена");
        return;
      }
      if (request.status !== "new") return;

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
          note: request.note || "Онлайн заявка из приложения DRIVEX.",
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

      setServiceClients(clientResult.clients);
      setServiceAppointments([
        nextAppointment,
        ...normalizeServiceAppointmentsList(serviceAppointments, safeCenter.id).filter((item) => !isDemoServiceAppointment(item))
      ]);
      setServiceOrders([nextOrder, ...normalizeServiceRepairOrdersList(serviceOrders, safeCenter.id)]);
      setServiceRequests((prev) =>
        normalizeServiceRequestsList(prev).map((item) =>
          item.id === requestId
            ? normalizeServiceRequest({
                ...item,
                status: "accepted",
                statusUpdatedAt: new Date().toISOString(),
                sourceOrderId: nextOrder.id
              })
            : item
        )
      );
      toast.push(`Заявка подтверждена: ${request.clientName} • ${formatRuDate(request.day)} ${request.time}`);
    }, [serviceAppointments, serviceCenter, serviceClients, serviceOrders, serviceRequests, serviceSession.serviceCenterId, toast]);

    const declineServiceRequest = useCallback((requestId, reason = "") => {
      const request = normalizeServiceRequestsList(serviceRequests).find((item) => item.id === requestId);
      if (!request) {
        toast.push("Заявка не найдена");
        return;
      }
      setServiceRequests((prev) =>
        normalizeServiceRequestsList(prev).map((item) =>
          item.id === requestId
            ? normalizeServiceRequest({
                ...item,
                status: "declined",
                declineReason: String(reason || "").trim(),
                statusUpdatedAt: new Date().toISOString()
              })
            : item
        )
      );
      toast.push("Заявка отклонена — клиент увидит статус в приложении");
    }, [serviceRequests, toast]);

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

      // Реферал-бонус: списываем доступный баланс с суммы заказов
      const bonusRequested = Math.max(0, Number(checkoutDraft && checkoutDraft.bonusApplied) || 0);
      let bonusUsed = Math.min(bonusRequested, Math.max(0, Number(referralBalance) || 0));
      if (bonusUsed > 0) {
        let remaining = bonusUsed;
        for (const o of nextOrders) {
          if (remaining <= 0) break;
          const cut = Math.min(remaining, Number(o.amount) || 0);
          o.amount = Math.max(0, Math.round(((Number(o.amount) || 0) - cut) * 100) / 100);
          remaining = Math.round((remaining - cut) * 100) / 100;
        }
        bonusUsed = Math.round((bonusUsed - remaining) * 100) / 100; // фактически применено
      }

      try {
        const checkoutResult = await runSellerBackendAction("recordMarketplaceCheckout", {
          orders: nextOrders,
          // Передаём id покупателя из уже загруженной сессии — бэкенду не нужно
          // звать client.auth.getUser() (сетевой вызов + Web Lock), который под
          // множеством вкладок падает с "Lock broken ... steal" и срывал заказ.
          buyerUserId: buyerSession?.id || null
        });
        // Привязываем заказ покупателя к uuid из БД (createdOrders), чтобы статус,
        // который выставит продавец, доходил до покупателя (совпадение по id при сверке).
        const createdOrders = (checkoutResult && Array.isArray(checkoutResult.createdOrders)) ? checkoutResult.createdOrders : [];
        const ordersForBuyer = nextOrders.map((o) => {
          const match = createdOrders.find((c) => (c.code && c.code === o.id) || c.storeId === o.storeId);
          return match && match.id ? { ...o, id: match.id, code: o.id } : o;
        });
        const nextBuyerOrders = createBuyerOrdersFromCheckout({
          orders: ordersForBuyer,
          stores: runtimeMarketStores
        });
        setBuyerOrders((prev) => mergeBuyerOrders(prev, nextBuyerOrders));
        setCart({});
        // Реферал: начисляем награду пригласившему (если покупатель пришёл по коду)
        if (window.DrivexReferrals && buyerSession && buyerSession.id) {
          window.DrivexReferrals.reward(buyerSession.id).catch(() => {});
        }
        // Списанный бонус — фиксируем потраченное и обновляем баланс
        if (bonusUsed > 0) {
          try {
            const prevInvite = readBuyerLocalStorage(drivexStorageKeys.buyerInvite, buyerSession) || {};
            const nextSpent = Math.max(0, Number(prevInvite.spent) || 0) + bonusUsed;
            writeBuyerLocalStorage(drivexStorageKeys.buyerInvite, { ...prevInvite, spent: nextSpent }, buyerSession);
          } catch { /* ignore */ }
          setReferralBalance((b) => Math.max(0, Math.round(((Number(b) || 0) - bonusUsed) * 100) / 100));
        }
        toast.push(`Заказ отправлен продавцам: ${nextOrders.length}`);
        navigateToHash("/orders");
      } catch (error) {
        toast.push(error?.message || "Не удалось отправить заказ продавцу");
      }
    }, [cartItems, profile, runSellerBackendAction, runtimeMarketStores, sellerOrders, toast, buyerSession, referralBalance]);

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
    const notificationsCount = (window.DX && typeof window.DX.countUnreadBuyerNotifications === "function")
      ? window.DX.countUnreadBuyerNotifications(serviceRequests, buyerOrders, orderChats)
      : (baseNotificationsCount + buildBuyerServiceNotifications(serviceRequests).length);
    const serviceDirectory = buildServiceDirectoryData(serviceCurrentCenter, {
      clients: serviceScopedClients,
      orders: serviceScopedOrders,
      finance: serviceScopedFinance,
      appointments: serviceScopedAppointments,
      sharedCenters: sharedServiceCenters
    });
    // Заявки ИМЕННО этого центра: id заявки ссылается на карточку каталога,
    // которая детерминированно строится из центра (service-<slug(center.id)>).
    const serviceCatalogSelf = createCatalogServiceFromCenter(serviceCurrentCenter, {
      clients: serviceScopedClients,
      orders: serviceScopedOrders,
      finance: serviceScopedFinance,
      appointments: serviceScopedAppointments
    });
    const serviceScopedRequests = serviceCatalogSelf
      ? normalizeServiceRequestsList(serviceRequests).filter(
          (item) => String(item.serviceId) === String(serviceCatalogSelf.id)
        )
      : [];
    const serviceNewRequestsCount = serviceScopedRequests.filter((item) => item.status === "new").length;
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
        ? html`<${getScreen('ProfileScreen')}
            notificationsCount=${notificationsCount}
            profile=${profile}
            documents=${documents}
            documentsTotalCount=${documentsTotalCount}
            maintenance=${maintenance}
            ordersCount=${buyerActiveOrdersCount || buyerOrders.length}
            favoritesCount=${favorites.length}
            onLogout=${logoutBuyer}
          />`
        : html`<${getScreen('BuyerAuthScreen')}
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
      content = html`<${getScreen('BuyerAuthScreen')}
        mode="login"
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
          ? html`<${getScreen('SellerRegistrationScreen')}
              currentUser=${sellerRegistrationDraft.session}
              profile=${sellerRegistrationDraft.profile}
              store=${sellerRegistrationDraft.store}
              onRegister=${registerSeller}
            />`
          : html`<${getScreen('PartnerRegisterIntroScreen')}
              onStart=${beginSellerRegistration}
            />`;
      } else if (canAccessSeller && sellerBackendReady) {
        content = sellerNeedsOnboarding
          ? html`<${getScreen('SellerOnboardingScreen')}
              currentUser=${sellerSession}
              store=${sellerCurrentStore}
              profile=${sellerCurrentProfile}
              setupState=${sellerSetupState}
              notifications=${sellerNotifications}
              onCompleteSetup=${completeSellerSetup}
            />`
          : html`<${getScreen('SellerDashboardScreen')}
              currentUser=${sellerSession}
              store=${sellerCurrentStore}
              products=${sellerScopedProducts}
              orders=${sellerScopedOrders}
              notifications=${sellerNotifications}
              setupState=${sellerSetupState}
            />`;
      } else {
        content = html`<${getScreen('PartnerLoginScreen')}
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
        content = html`<${getScreen('PartnerLoginScreen')}
          onLogin=${partnerLogin}
          onGoRegister=${activateSellerMode}
          onResetPassword=${resetPartnerPassword}
          authStatus=${sellerBackendStatus}
          message="Подключаем seller backend..."
        />`;
      } else if (!canAccessSeller) {
        content = html`<${getScreen('PartnerLoginScreen')}
          onLogin=${partnerLogin}
          onGoRegister=${activateSellerMode}
          onResetPassword=${resetPartnerPassword}
          authStatus=${sellerBackendStatus}
          message="Чтобы открыть seller CRM, войдите в партнёрский кабинет."
        />`;
      } else if (normalized === "/seller") {
        content = sellerNeedsOnboarding
          ? html`<${getScreen('SellerOnboardingScreen')}
              currentUser=${sellerSession}
              store=${sellerCurrentStore}
              profile=${sellerCurrentProfile}
              setupState=${sellerSetupState}
              notifications=${sellerNotifications}
              onCompleteSetup=${completeSellerSetup}
            />`
          : html`<${getScreen('SellerDashboardScreen')}
              currentUser=${sellerSession}
              store=${sellerCurrentStore}
              products=${sellerScopedProducts}
              orders=${sellerScopedOrders}
              notifications=${sellerNotifications}
              setupState=${sellerSetupState}
            />`;
      } else if (sellerNeedsRegistration) {
        content = html`<${getScreen('SellerRegistrationScreen')}
          currentUser=${sellerSession}
          profile=${sellerCurrentProfile}
          store=${sellerCurrentStore}
          onRegister=${registerSeller}
        />`;
      } else if (normalized === "/seller/onboarding") {
        content = html`<${getScreen('SellerOnboardingScreen')}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          profile=${sellerCurrentProfile}
          setupState=${sellerSetupState}
          notifications=${sellerNotifications}
          onCompleteSetup=${completeSellerSetup}
        />`;
      } else if (normalized === "/seller/store" || normalized === "/seller/store-settings") {
        content = html`<${getScreen('SellerStoreSettingsScreen')}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          onSaveStore=${saveSellerStore}
        />`;
      } else if (sellerNeedsOnboarding) {
        content = html`<${getScreen('SellerOnboardingScreen')}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          profile=${sellerCurrentProfile}
          setupState=${sellerSetupState}
          notifications=${sellerNotifications}
          onCompleteSetup=${completeSellerSetup}
        />`;
      } else if (normalized === "/seller/dashboard") {
        content = html`<${getScreen('SellerDashboardScreen')}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          products=${sellerScopedProducts}
          orders=${sellerScopedOrders}
          notifications=${sellerNotifications}
          setupState=${sellerSetupState}
        />`;
      } else if (normalized === "/seller/products") {
        content = html`<${getScreen('SellerProductsScreen')}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          products=${sellerScopedProducts}
          onDeleteProduct=${deleteSellerProduct}
        />`;
      } else if (normalized === "/seller/products/new") {
        content = html`<${getScreen('SellerProductEditorScreen')}
          mode="new"
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          onSaveProduct=${saveSellerProduct}
        />`;
      } else if (sellerProductEditMatch) {
        content = html`<${getScreen('SellerProductEditorScreen')}
          mode="edit"
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          product=${getSellerProductById(sellerScopedProducts, sellerProductEditMatch[1])}
          onSaveProduct=${saveSellerProduct}
        />`;
      } else if (sellerOrderChatMatch) {
        content = html`<${getScreen('OrderChatScreen')}
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
        content = html`<${getScreen('SellerOrdersScreen')}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          orders=${sellerScopedOrders}
          orderChats=${orderChats}
          onUpdateOrderStatus=${updateSellerOrderStatus}
        />`;
      } else if (normalized === "/seller/clients") {
        // Вкладка «Клиенты» нижней навигации CRM — база формируется из заказов.
        content = html`<${getScreen('SellerClientsScreen')}
          currentUser=${sellerSession}
          store=${sellerCurrentStore}
          orders=${sellerScopedOrders}
        />`;
      } else {
        content = html`<${getScreen('SellerNotFoundScreen')} currentUser=${sellerSession} store=${sellerCurrentStore} />`;
      }
    } else if (isServiceCrmRoute) {
      activePath = "/service-crm";

      if (normalized === "/service-crm") {
        content = serviceNeedsRegistration
          ? serviceRegistrationDraft
            ? html`<${getScreen('ServiceRegistrationScreen')}
                currentUser=${serviceRegistrationDraft.session}
                profile=${serviceRegistrationDraft.profile}
                center=${serviceRegistrationDraft.center}
                onRegister=${registerServiceCrm}
              />`
            : html`<${getScreen('ServicePartnerRegisterIntroScreen')} onStart=${beginServiceRegistration} />`
          : serviceIsAuthenticated
            ? html`<${getScreen('ServiceDashboardScreen')}
                currentUser=${serviceCurrentSession}
                center=${serviceCurrentCenter}
                clients=${serviceScopedClients}
                orders=${serviceScopedOrders}
                finance=${serviceScopedFinance}
                appointments=${serviceScopedAppointments}
                newRequestsCount=${serviceNewRequestsCount}
              />`
            : html`<${getScreen('ServiceLoginScreen')}
                onLogin=${loginServiceCrm}
                onGoRegister=${beginServiceRegistration}
                message=${serviceCurrentCenter.name
                  ? `Войдите, чтобы открыть кабинет сервиса ${serviceCurrentCenter.name}.`
                  : "Войдите в свой сервисный кабинет."}
              />`;
      } else if (normalized === "/service-crm/register") {
        // Регистрация доступна ВСЕГДА — даже если на устройстве уже есть
        // кабинет. Раньше маршрут проваливался в экран входа, и кнопка
        // «Регистрация» на логине выглядела неработающей.
        content = serviceRegistrationDraft
          ? html`<${getScreen('ServiceRegistrationScreen')}
              currentUser=${serviceRegistrationDraft.session}
              profile=${serviceRegistrationDraft.profile}
              center=${serviceRegistrationDraft.center}
              onRegister=${registerServiceCrm}
            />`
          : html`<${getScreen('ServicePartnerRegisterIntroScreen')} onStart=${beginServiceRegistration} />`;
      } else if (normalized === "/service-crm/login") {
        // Вход доступен ВСЕГДА — даже на новом устройстве без локального
        // кабинета: владелец существующего сервиса входит, и кабинет
        // восстанавливается по владельцу. Раньше этот маршрут перехватывала
        // ветка serviceNeedsRegistration, и до формы входа было не добраться.
        content = html`<${getScreen('ServiceLoginScreen')}
          onLogin=${loginServiceCrm}
          onGoRegister=${beginServiceRegistration}
          message=${serviceCurrentCenter.name
            ? `Войдите, чтобы открыть кабинет сервиса ${serviceCurrentCenter.name}.`
            : "Войдите в свой сервисный кабинет."}
        />`;
      } else if (serviceNeedsRegistration) {
        content = serviceRegistrationDraft
          ? html`<${getScreen('ServiceRegistrationScreen')}
              currentUser=${serviceRegistrationDraft.session}
              profile=${serviceRegistrationDraft.profile}
              center=${serviceRegistrationDraft.center}
              onRegister=${registerServiceCrm}
            />`
          : html`<${getScreen('ServicePartnerRegisterIntroScreen')} onStart=${beginServiceRegistration} />`;
      } else if (!serviceIsAuthenticated) {
        content = html`<${getScreen('ServiceLoginScreen')}
          onLogin=${loginServiceCrm}
          onGoRegister=${beginServiceRegistration}
          message=${serviceCurrentCenter.name
            ? `Войдите, чтобы открыть кабинет сервиса ${serviceCurrentCenter.name}.`
            : "Войдите в свой сервисный кабинет."}
        />`;
      } else if (normalized === "/service-crm/dashboard") {
        content = html`<${getScreen('ServiceDashboardScreen')}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          clients=${serviceScopedClients}
          orders=${serviceScopedOrders}
          finance=${serviceScopedFinance}
          appointments=${serviceScopedAppointments}
          newRequestsCount=${serviceNewRequestsCount}
        />`;
      } else if (normalized === "/service-crm/clients") {
        content = html`<${getScreen('ServiceClientsScreen')}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          clients=${serviceScopedClients}
          orders=${serviceScopedOrders}
          appointments=${serviceScopedAppointments}
        />`;
      } else if (normalized === "/service-crm/orders") {
        content = html`<${getScreen('ServiceOrdersScreen')}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          orders=${serviceScopedOrders}
          onUpdateStatus=${updateServiceRepairStatus}
        />`;
      } else if (normalized === "/service-crm/requests") {
        content = html`<${getScreen('ServiceRequestsScreen')}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          requests=${serviceScopedRequests}
          onAcceptRequest=${acceptServiceRequest}
          onDeclineRequest=${declineServiceRequest}
        />`;
      } else if (normalized === "/service-crm/parts") {
        content = html`<${getScreen('ServiceInventoryScreen')}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          inventory=${serviceScopedInventory}
          onSaveItem=${saveServiceInventoryItem}
        />`;
      } else if (normalized === "/service-crm/finance") {
        content = html`<${getScreen('ServiceFinanceScreen')}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          orders=${serviceScopedOrders}
          finance=${serviceScopedFinance}
        />`;
      } else if (normalized === "/service-crm/schedule") {
        content = html`<${getScreen('ServiceScheduleScreen')}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          appointments=${serviceScopedAppointments}
          onCreateAppointment=${createManualServiceAppointment}
        />`;
      } else if (normalized === "/service-crm/settings") {
        content = html`<${getScreen('ServiceSettingsScreen')}
          currentUser=${serviceCurrentSession}
          center=${serviceCurrentCenter}
          onSaveCenter=${saveServiceCenter}
        />`;
      } else {
        content = html`<${getScreen('ServiceNotFoundScreen')} currentUser=${serviceCurrentSession} center=${serviceCurrentCenter} />`;
      }
    } else if (normalized === "/" || normalized === "/home") {
      activePath = "/";
      content = html`<${getScreen('DashboardScreen')}
        notificationsCount=${notificationsCount}
        profileName=${profile.name}
        serviceDirectory=${serviceDirectory}
        activeCarId=${activeCarId}
        maintenance=${maintenance}
      />`;
    } else if (normalized === "/map") {
      activePath = "/map";
      content = html`<${getScreen('MapScreen')} serviceDirectory=${serviceDirectory} activeCarId=${activeCarId} mapStores=${mapStores} />`;
    } else if (normalized === "/services") {
      activePath = "/services";
      content = html`<${getScreen('ServicesScreen')}
        serviceDirectory=${serviceDirectory}
        activeCarId=${activeCarId}
        serviceCrmReady=${!serviceNeedsRegistration}
        serviceCenterName=${serviceCurrentCenter.name}
        favorites=${favorites}
        onToggleFavorite=${toggleFavorite}
      />`;
    } else if (normalized === "/market") {
      activePath = "/market";
      content = html`<${getScreen('MarketScreen')} cartCount=${cartCount} onAddToCart=${addToCart} favorites=${favorites} onToggleFavorite=${toggleFavorite} />`;
    } else if (normalized === "/marketplace/catalog") {
      activePath = "/market";
      content = html`<${getScreen('MarketCatalogScreen')} cartCount=${cartCount} onAddToCart=${addToCart} />`;
    } else if (normalized === "/marketplace/auto") {
      activePath = "/market";
      content = html`<${getScreen('MarketAutoPickerScreen')} cartCount=${cartCount} onAddToCart=${addToCart} />`;
    } else if (normalized === "/marketplace/orders") {
      activePath = "/market";
      content = html`<${getScreen('MarketOrdersScreen')}
        orders=${buyerOrders}
        orderChats=${orderChats}
        cartCount=${cartCount}
      />`;
    } else if (normalized === "/profile") {
      activePath = "/profile";
      content = html`<${getScreen('ProfileScreen')}
        notificationsCount=${notificationsCount}
        profile=${profile}
        documents=${documents}
        documentsTotalCount=${documentsTotalCount}
        maintenance=${maintenance}
        ordersCount=${buyerActiveOrdersCount || buyerOrders.length}
        favoritesCount=${favorites.length}
        onLogout=${logoutBuyer}
      />`;
    } else {
      const serviceBookingMatch = normalized.match(/^\/service\/([^/]+)\/book$/);
      const serviceMatch = normalized.match(/^\/service\/([^/]+)$/);
      const productMatch = normalized.match(/^\/(?:marketplace\/product|product)\/([^/]+)$/);
      const marketStoreMatch = normalized.match(/^\/(?:marketplace\/store|market-store)\/([^/]+)$/);
      const categoryMatch = normalized.match(/^\/category\/([\w-]+)$/);
      const documentCarMatch = normalized.match(/^\/documents\/car\/([\w-]+)$/);

      if (serviceBookingMatch) {
        activePath = "/services";
        content = html`<${getScreen('ServiceBookingScreen')}
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
        content = html`<${getScreen('ServiceDetailScreen')}
          serviceId=${decodeRouteSegment(serviceMatch[1])}
          serviceDirectory=${serviceDirectory}
          serviceRequests=${serviceRequests}
        />`;
      } else if (productMatch) {
        activePath = "/market";
        content = html`<${getScreen('ProductDetailScreen')}
          productId=${decodeRouteSegment(productMatch[1])}
          onAddToCart=${addToCart}
        />`;
      } else if (marketStoreMatch) {
        activePath = "/market";
        content = html`<${getScreen('MarketStoreScreen')}
          storeId=${decodeRouteSegment(marketStoreMatch[1])}
          onAddToCart=${addToCart}
        />`;
      } else if (categoryMatch) {
        activePath = "/services";
        content = html`<${getScreen('CategoryScreen')}
          categoryId=${categoryMatch[1]}
          serviceDirectory=${serviceDirectory}
          activeCarId=${activeCarId}
        />`;
      } else if (normalized === "/documents") {
        activePath = "/profile";
        content = html`<${getScreen('DocumentsVaultScreen')}
          documents=${documents}
          totalCount=${documentsTotalCount}
          authStatus=${buyerAuthStatus}
          garageCars=${userGarageCars}
        />`;
      } else if (normalized === "/documents/license") {
        activePath = "/profile";
        content = html`<${getScreen('LicenseDocumentScreen')}
          document=${documents?.license || null}
          onSave=${setLicenseDocument}
          onRemove=${removeLicenseDocument}
          authStatus=${buyerAuthStatus}
          buyerSession=${buyerSession}
        />`;
      } else if (documentCarMatch) {
        activePath = "/profile";
        content = html`<${getScreen('CarDocumentsScreen')}
          carId=${documentCarMatch[1]}
          documents=${documents}
          onSaveDocument=${setCarDocument}
          onRemoveDocument=${removeCarDocument}
          onSelectCar=${selectActiveCar}
          authStatus=${buyerAuthStatus}
          buyerSession=${buyerSession}
        />`;
      } else if (normalized === "/notifications") {
        activePath = "/profile";
        content = html`<${getScreen('NotificationsScreen')} serviceRequests=${serviceRequests} buyerOrders=${buyerOrders} orderChats=${orderChats} />`;
      } else if (normalized === "/profile-security") {
        activePath = "/profile";
        content = html`<${getScreen('ProfileSecurityScreen')} profile=${profile} />`;
      } else if (normalized === "/profile-edit") {
        activePath = "/profile";
        content = html`<${getScreen('ProfileEditScreen')}
          profile=${profile}
          onSave=${updateProfile}
          buyerSession=${buyerSession}
          onUploadAvatar=${uploadAvatarToStorage}
        />`;
      } else if (normalized === "/maintenance") {
        activePath = "/profile";
        content = html`<${getScreen('MaintenanceScreen')}
          maintenance=${maintenance}
          spentTotal=${maintenanceSpentTotal}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          onRemoveRecord=${removeMaintenanceRecord}
          serviceRequests=${serviceRequests}
        />`;
      } else if (normalized === "/maintenance-add") {
        activePath = "/profile";
        content = html`<${getScreen('MaintenanceAddScreen')}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          onAddRecord=${addMaintenanceRecord}
        />`;
      } else if (normalized === "/inspection") {
        activePath = "/profile";
        content = html`<${getScreen('InspectionScreen')}
          maintenance=${maintenance}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          onSave=${setInspection}
        />`;
      } else if (normalized === "/garage") {
        activePath = "/profile";
        content = html`<${getScreen('GarageScreen')}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          onAddCar=${addGarageCar}
          onRemoveCar=${removeGarageCar}
        />`;
      } else if (normalized === "/smart-care") {
        activePath = "/profile";
        content = html`<${getScreen('SmartCareScreen')} maintenance=${maintenance} activeCarId=${activeCarId} />`;
      } else if (normalized === "/ai-assistant") {
        activePath = "/";
        content = html`<${getScreen('AIAssistantScreen')}
          profile=${profile}
          activeCarId=${activeCarId}
          maintenance=${maintenance}
          serviceDirectory=${serviceDirectory}
        />`;
      } else if (normalized === "/emergency") {
        activePath = "/";
        content = html`<${getScreen('SosScreen')}
          serviceDirectory=${serviceDirectory}
          activeCarId=${activeCarId}
          profile=${profile}
          emergencyContact=${emergencyContact}
          onSaveContact=${updateEmergencyContact}
        />`;
      } else if (normalized === "/cart" || normalized === "/marketplace/cart") {
        activePath = "/market";
        content = html`<${getScreen('CartScreen')}
          items=${cartItems}
          total=${cartTotal}
          profile=${profile}
          referralBalance=${referralBalance}
          onSetQty=${setCartQty}
          onRemove=${removeFromCart}
          onCheckout=${checkoutCart}
        />`;
      } else if (buyerOrderChatMatch) {
        activePath = "/profile";
        content = html`<${getScreen('OrderChatScreen')}
          viewerRole="buyer"
          order=${buyerChatOrder}
          orderChats=${orderChats}
          backPath="/orders"
          onSendMessage=${sendOrderChatMessage}
          onMarkRead=${markOrderChatRead}
        />`;
      } else if (normalized === "/orders") {
        activePath = "/profile";
        content = html`<${getScreen('OrdersScreen')} orders=${buyerOrders} orderChats=${orderChats} />`;
      } else if (normalized === "/trips") {
        activePath = "/profile";
        content = html`<${getScreen('TripsScreen')}
          buyerSession=${buyerSession}
          activeCarId=${activeCarId}
          onSelectCar=${selectActiveCar}
          maintenance=${maintenance}
        />`;
      } else if (normalized === "/saved-locations") {
        activePath = "/profile";
        content = html`<${getScreen('SavedLocationsScreen')}
          places=${userSavedPlaces}
          onAddPlace=${addSavedPlace}
          onRemovePlace=${removeSavedPlace}
        />`;
      } else if (normalized === "/favorites") {
        activePath = "/profile";
        content = html`<${getScreen('FavoritesScreen')}
          favorites=${favorites}
          onRemove=${removeFavorite}
        />`;
      } else if (normalized === "/settings") {
        activePath = "/profile";
        content = html`<${getScreen('SettingsScreen')} session=${buyerSession} />`;
      } else if (normalized === "/help") {
        activePath = "/profile";
        content = html`<${getScreen('HelpScreen')} />`;
      } else if (normalized === "/payment") {
        activePath = "/profile";
        content = html`<${getScreen('ComingSoonScreen')} title="Платёжные данные" emoji="💳" subtitle="Управление картами появится в ближайшем обновлении" />`;
      } else if (normalized === "/bonus") {
        activePath = "/profile";
        content = html`<${getScreen('ComingSoonScreen')} title="Бонусная программа" emoji="⭐" subtitle="Баллы и награды появятся в ближайшем обновлении" />`;
      } else if (normalized === "/invite") {
        activePath = "/profile";
        content = html`<${getScreen('InviteScreen')} buyerSession=${buyerSession} />`;
      } else {
        activePath = "/";
        content = html`<${getScreen('NotFoundScreen')} path=${normalized} />`;
      }
    }

    return html`
      <div className="min-h-screen relative" style=${{ background: "var(--drivex-black)" }}>
        <main id="main">${content}</main>
        ${isSellerRoute || isPartnerRoute || isServiceCrmRoute ? null : html`<${BottomNav} activePath=${activePath} />`}
        ${buyerStateLoading
          ? html`
              <div
                className="fixed inset-0 z-50 flex items-center justify-center px-6"
                style=${{ background: "rgba(2, 6, 12, 0.88)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", maxWidth: "480px", margin: "0 auto" }}
                aria-live="polite"
              >
                <style>${"@keyframes drivexSpin{to{transform:rotate(360deg)}}"}</style>
                <div className="flex flex-col items-center" style=${{ gap: "16px", textAlign: "center" }}>
                  <div
                    style=${{
                      width: "52px",
                      height: "52px",
                      borderRadius: "9999px",
                      border: "3px solid rgba(6, 182, 212, 0.25)",
                      borderTopColor: "var(--drivex-neon-cyan)",
                      animation: "drivexSpin 0.8s linear infinite"
                    }}
                  ></div>
                  <p style=${{ color: "var(--drivex-white)", fontWeight: 700, fontSize: "16px" }}>
                    Загружаем ваши данные…
                  </p>
                  <p style=${{ color: "var(--drivex-silver)", fontSize: "13px" }}>
                    Синхронизация с облаком
                  </p>
                </div>
              </div>
            `
          : null}
      </div>
    `;
  }

  function Root() {
    return html`<${ToastProvider}><${ConfirmProvider}><${App} /></${ConfirmProvider}></${ToastProvider}>`;
  }

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    // eslint-disable-next-line no-console
    console.error("DRIVEX (React): missing #root element.");
    return;
  }

  if (typeof ReactDOM.createRoot === "function") {
    ReactDOM.createRoot(rootElement).render(html`<${Root} />`);
  } else if (typeof ReactDOM.render === "function") {
    ReactDOM.render(html`<${Root} />`, rootElement);
  } else {
    // eslint-disable-next-line no-console
    console.error("DRIVEX (React): unable to mount (no createRoot/render).");
  }

  try {
    if (window.__DRIVEX_BOOT__ && typeof window.__DRIVEX_BOOT__.markReady === "function") {
      window.__DRIVEX_BOOT__.markReady();
    }
  } catch (e) {
    // ignore boot hide errors
  }
})();









