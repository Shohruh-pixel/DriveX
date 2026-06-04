// app/screens/marketplace-detail.js — Market Detail экраны
// Зависимости: читаем из window.DX (экспортируется app.js до App())
(() => {
  'use strict';
  const DX = window.DX;
  const html  = DX.html;
  const React = DX.React;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon  = DX.Icon;
  const alphaBg = DX.alphaBg;

  // Все зависимости через DX — app.js экспортирует их перед App()
  const _d = window.DX; // shorthand для lazy чтения

  // Utility/UI
  function useToast()  { return (_d.useToast || function(){return{push:function(){}};})(); }
  const navigateToHash = function(p) { _d.navigateToHash && _d.navigateToHash(p); };
  const SimplePage     = function(p) { var F=(_d.screens||{}).SimplePage||_d.SimplePage; return F?F(p):(p.children||null); };
  const formatTjsPrice = function(n) { return _d.formatTjsPrice?_d.formatTjsPrice(n):(String(n)+' сом.'); };
  const genId          = function(p) { return _d.genId?_d.genId(p):(p+'-'+Date.now()); };
  const slugifyText    = function(s,f){ return _d.slugifyText?_d.slugifyText(s,f):String(s||f||'x'); };
  const toLocalISODate = function(d) { return _d.toLocalISODate?_d.toLocalISODate(d):String(d||'').slice(0,10); };
  const encodeRouteSegment = function(s){ return _d.encodeRouteSegment?_d.encodeRouteSegment(s):encodeURIComponent(s||''); };
  const decodeRouteSegment = function(s){ return _d.decodeRouteSegment?_d.decodeRouteSegment(s):decodeURIComponent(String(s||'')); };
  const prepareDocumentDataUrl = function(f,o){ return _d.prepareDocumentDataUrl?_d.prepareDocumentDataUrl(f,o):Promise.resolve(''); };
  const prepareAvatarDataUrl   = function(f,o){ return _d.prepareAvatarDataUrl?_d.prepareAvatarDataUrl(f,o):Promise.resolve(''); };

  // Service directory functions
  const decorateServiceRecord    = function(s){ return _d.decorateServiceRecord?_d.decorateServiceRecord(s):(s||{}); };
  const dedupeServicesById       = function(a){ return _d.dedupeServicesById?_d.dedupeServicesById(a):(a||[]); };
  const getPersonalizedServices  = function(a,id){ return _d.getPersonalizedServices?_d.getPersonalizedServices(a,id):(a||[]).slice(0,3); };
  const resolveServiceCategoryId = function(v){ return _d.resolveServiceCategoryId?_d.resolveServiceCategoryId(v):'repair'; };
  const getServiceCategoryMeta   = function(v){ return _d.getServiceCategoryMeta?_d.getServiceCategoryMeta(v):{id:'repair',name:'Ремонт',icon:'wrench',color:'var(--drivex-electric-blue)'}; };
  const getServiceImageRenderKey = function(r){ return _d.getServiceImageRenderKey?_d.getServiceImageRenderKey(r):''; };
  const buildBuyerServiceNotifications = function(r){ return _d.buildBuyerServiceNotifications?_d.buildBuyerServiceNotifications(r):[]; };
  const buildServiceDirectoryData= function(c,ctx){ return _d.buildServiceDirectoryData?_d.buildServiceDirectoryData(c,ctx):{}; };
  const createCatalogServiceFromCenter = function(c,ctx){ return _d.createCatalogServiceFromCenter?_d.createCatalogServiceFromCenter(c,ctx):null; };
  const normalizeServiceCenter   = function(c,id){ return _d.normalizeServiceCenter?_d.normalizeServiceCenter(c,id):(c||{}); };
  const getServicePhoneHref      = function(p){ return _d.getServicePhoneHref?_d.getServicePhoneHref(p):('tel:'+String(p||'')); };
  const clampServiceMetric       = function(v){ return _d.clampServiceMetric?_d.clampServiceMetric(v):(v||0); };
  const estimateServiceDurationMinutes=function(t){ return _d.estimateServiceDurationMinutes?_d.estimateServiceDurationMinutes(t):30; };
  const normalizeServiceBrands   = function(v){ return _d.normalizeServiceBrands?_d.normalizeServiceBrands(v):[]; };
  const serviceShowcaseProfiles  = _d.serviceShowcaseProfiles || {};
  const serviceCategories        = _d.serviceCategories || [];
  const serviceCategoryAliases   = _d.serviceCategoryAliases || {};

  // Marketplace functions
  const marketplaceData      = {get products(){ return (_d.marketplaceData||{}).products||[]; }, get stores(){ return (_d.marketplaceData||{}).stores||[]; }, get categories(){ return (_d.marketplaceData||{}).categories||[]; }};
  const normalizeMarketProductId = function(id){ return _d.normalizeMarketProductId?_d.normalizeMarketProductId(id):String(id||''); };
  const getMarketProduct     = function(id){ return _d.getMarketProduct?_d.getMarketProduct(id):null; };
  const getMarketProductsByStore=function(id){ return _d.getMarketProductsByStore?_d.getMarketProductsByStore(id):[]; };
  const getRelatedProducts   = function(p,limit){ return _d.getRelatedProducts?_d.getRelatedProducts(p,limit):[]; };
  const getMarketStore       = function(id){ return _d.getMarketStore?_d.getMarketStore(id):null; };
  const formatTjsPrice_     = formatTjsPrice;
  const getBuyerOrderChatPath= function(id){ return _d.getBuyerOrderChatPath?_d.getBuyerOrderChatPath(id):'/orders'; };
  const OrderStatusTimeline  = function(p){ var F=(_d.screens||{}).OrderStatusTimeline||_d.OrderStatusTimeline; return F?F(p):null; };
  const OrderChatSummaryCard = function(p){ var F=(_d.screens||{}).OrderChatSummaryCard; return F?F(p):null; };
  const CartBadge            = function(p){ var F=(_d.screens||{}).CartBadge; return F?F(p):null; };
  const SearchBar            = function(p){ var F=(_d.screens||{}).SearchBar; return F?F(p):null; };
  const CategoryRow          = function(p){ var F=(_d.screens||{}).CategoryRow; return F?F(p):null; };
  const ProductCard          = function(p){ var F=(_d.screens||{}).ProductCard; return F?F(p):null; };
  const ProductGrid          = function(p){ var F=(_d.screens||{}).ProductGrid; return F?F(p):null; };
  const MarketTopBar         = function(p){ var F=(_d.screens||{}).MarketTopBar; return F?F(p):null; };
  const MarketAppNav         = function(p){ var F=(_d.screens||{}).MarketAppNav; return F?F(p):null; };
  const MarketStoreAvatar    = function(p){ var F=(_d.screens||{}).MarketStoreAvatar; return F?F(p):null; };
  const StoreLabel           = function(p){ var F=(_d.screens||{}).StoreLabel; return F?F(p):null; };
  const PromoBanner          = function(p){ var F=(_d.screens||{}).PromoBanner; return F?F(p):null; };
  const MarketSectionTitle   = function(p){ var F=(_d.screens||{}).MarketSectionTitle; return F?F(p):null; };
  const MarketplacePage      = function(p){ var F=(_d.screens||{}).MarketplacePage; return F?F(p):null; };
  const marketCategories     = _d.marketCategories || [];

  // Seller helpers
  const SellerLayout    = function(p){ var F=(_d.screens||{}).SellerLayout||_d.SellerLayout; return F?F(p):(p.children||null); };
  const SellerField     = function(p){ var F=(_d.screens||{}).SellerField||_d.SellerField;  return F?F(p):(p.children||null); };
  const SellerInput     = function(p){ var F=(_d.screens||{}).SellerInput||_d.SellerInput;  return F?F(p):null; };
  const SellerTextarea  = function(p){ var F=(_d.screens||{}).SellerTextarea; return F?F(p):null; };
  const SellerSelect    = function(p){ var F=(_d.screens||{}).SellerSelect;   return F?F(p):null; };
  const SellerMetricCard= function(p){ var F=(_d.screens||{}).SellerMetricCard;return F?F(p):null; };
  const SellerLogo      = function(p){ var F=(_d.screens||{}).SellerLogo;     return F?F(p):null; };
  const SellerNotFoundScreen=function(p){ var F=(_d.screens||{}).SellerNotFoundScreen;return F?F(p):null; };
  const OrderChatScreen = function(p){ var F=(_d.screens||{}).OrderChatScreen; return F?F(p):null; };
  const SellerAccessDeniedScreen=function(p){ var F=(_d.screens||{}).SellerAccessDeniedScreen;return F?F(p):null; };
  const normalizeSellerStore   =function(s,id){ return _d.normalizeSellerStore?_d.normalizeSellerStore(s,id):(s||{}); };
  const normalizeSellerProfile =function(p,s){ return _d.normalizeSellerProfile?_d.normalizeSellerProfile(p,s):(p||{}); };
  const normalizeSellerProduct =function(p,id){ return _d.normalizeSellerProduct?_d.normalizeSellerProduct(p,id):(p||{}); };
  const normalizeSellerOrdersList=function(o,id){ return _d.normalizeSellerOrdersList?_d.normalizeSellerOrdersList(o,id):(o||[]); };
  const getSellerSetupState    =function(s,p){ return _d.getSellerSetupState?_d.getSellerSetupState(s,p):{isProfileComplete:false,completedCount:0,totalCount:1}; };
  const buildSellerDashboardStats=function(p,o){ return _d.buildSellerDashboardStats?_d.buildSellerDashboardStats(p,o):{}; };
  const getSellerProductCategoryMeta=function(id){ return _d.getSellerProductCategoryMeta?_d.getSellerProductCategoryMeta(id):{id,name:id}; };
  const getSellerProductStatusMeta=function(s){ return _d.getSellerProductStatusMeta?_d.getSellerProductStatusMeta(s):{id:s,label:s}; };
  const getSellerFallbackProductImage=function(c){ return _d.getSellerFallbackProductImage?_d.getSellerFallbackProductImage(c):''; };
  const createSellerProductFormState=function(p,id){ return _d.createSellerProductFormState?_d.createSellerProductFormState(p,id):{}; };
  const createSellerStoreFormState  =function(s){ return _d.createSellerStoreFormState?_d.createSellerStoreFormState(s):{}; };
  const isSellerRole           =function(r){ return _d.isSellerRole?_d.isSellerRole(r):(r==='seller'||r==='admin'); };
  const sellerProductStatusOptions = _d.sellerProductStatusOptions || [];
  const buyerOrderStatusOptions = _d.buyerOrderStatusOptions || [];
  const drivexStorageKeys = _d.drivexStorageKeys || {};

  // Service CRM helpers
  const ServiceCrmLayout = function(p){ var F=(_d.screens||{}).ServiceCrmLayout; return F?F(p):(p.children||null); };
  const ServiceLayout    = function(p){ var F=(_d.screens||{}).ServiceLayout||_d.ServiceLayout; return F?F(p):(p.children||null); };
  const ServiceStatusChip= function(p){ var F=(_d.screens||{}).ServiceStatusChip; return F?F(p):null; };
  const ServicePhoneButton=function(p){ var F=(_d.screens||{}).ServicePhoneButton; return F?F(p):null; };
  const normalizeServiceSession   =function(s){ return _d.normalizeServiceSession?_d.normalizeServiceSession(s):(s||{}); };
  const normalizeServiceProfile   =function(p,s){ return _d.normalizeServiceProfile?_d.normalizeServiceProfile(p,s):(p||{}); };
  const normalizeServiceClient    =function(c){ return _d.normalizeServiceClient?_d.normalizeServiceClient(c):(c||{}); };
  const normalizeServiceClientsList=function(l){ return _d.normalizeServiceClientsList?_d.normalizeServiceClientsList(l):(l||[]); };
  const normalizeServiceRepairOrder=function(o){ return _d.normalizeServiceRepairOrder?_d.normalizeServiceRepairOrder(o):(o||{}); };
  const normalizeServiceRepairOrdersList=function(l){ return _d.normalizeServiceRepairOrdersList?_d.normalizeServiceRepairOrdersList(l):(l||[]); };
  const normalizeServiceInventoryItem=function(i){ return _d.normalizeServiceInventoryItem?_d.normalizeServiceInventoryItem(i):(i||{}); };
  const normalizeServiceInventoryList=function(l){ return _d.normalizeServiceInventoryList?_d.normalizeServiceInventoryList(l):(l||[]); };
  const normalizeServiceFinanceEntry=function(e){ return _d.normalizeServiceFinanceEntry?_d.normalizeServiceFinanceEntry(e):(e||{}); };
  const normalizeServiceFinanceList=function(l){ return _d.normalizeServiceFinanceList?_d.normalizeServiceFinanceList(l):(l||[]); };
  const normalizeServiceAppointment=function(a){ return _d.normalizeServiceAppointment?_d.normalizeServiceAppointment(a):(a||{}); };
  const normalizeServiceAppointmentsList=function(l){ return _d.normalizeServiceAppointmentsList?_d.normalizeServiceAppointmentsList(l):(l||[]); };
  const normalizeServiceRequest=function(r){ return _d.normalizeServiceRequest?_d.normalizeServiceRequest(r):(r||{}); };
  const normalizeServiceRequestsList=function(l){ return _d.normalizeServiceRequestsList?_d.normalizeServiceRequestsList(l):(l||[]); };
  const getServiceRepairStatusMeta=function(s){ return _d.getServiceRepairStatusMeta?_d.getServiceRepairStatusMeta(s):{id:s,label:s,color:''}; };
  const getServiceAppointmentStatusMeta=function(s){ return _d.getServiceAppointmentStatusMeta?_d.getServiceAppointmentStatusMeta(s):{id:s,label:s}; };
  const getServiceRequestStatusMeta=function(s){ return _d.getServiceRequestStatusMeta?_d.getServiceRequestStatusMeta(s):{id:s,label:s}; };
  const getServiceRepairActions=function(s){ return _d.getServiceRepairActions?_d.getServiceRepairActions(s):[]; };
  const buildServiceDashboardStats=function(c,cl,o,f,a){ return _d.buildServiceDashboardStats?_d.buildServiceDashboardStats(c,cl,o,f,a):{}; };
  const buildServiceFinanceSummary=function(f){ return _d.buildServiceFinanceSummary?_d.buildServiceFinanceSummary(f):{}; };
  const buildServiceBookingSlotOptions=function(c,d){ return _d.buildServiceBookingSlotOptions?_d.buildServiceBookingSlotOptions(c,d):[]; };
  const buildServiceScheduleSlots=function(c,d){ return _d.buildServiceScheduleSlots?_d.buildServiceScheduleSlots(c,d):[]; };
  const parseClockMinutes=function(t){ return _d.parseClockMinutes?_d.parseClockMinutes(t):0; };
  const formatClockMinutes=function(m){ return _d.formatClockMinutes?_d.formatClockMinutes(m):'00:00'; };
  const createServiceOrderCode=function(){ return _d.createServiceOrderCode?_d.createServiceOrderCode():'ORD-'+Date.now(); };
  const upsertServiceClientFromBooking=function(cls,b){ return _d.upsertServiceClientFromBooking?_d.upsertServiceClientFromBooking(cls,b):(cls||[]); };
  const createServiceVehicleSnapshot=function(c){ return _d.createServiceVehicleSnapshot?_d.createServiceVehicleSnapshot(c):(c||{}); };
  const persistServiceCenterToLocalStorage=function(c){ _d.persistServiceCenterToLocalStorage&&_d.persistServiceCenterToLocalStorage(c); };
  const getLatestPersistedServiceCenter=function(){ return _d.getLatestPersistedServiceCenter?_d.getLatestPersistedServiceCenter():null; };
  const normalizeServiceImageAsset=function(v){ return _d.normalizeServiceImageAsset?_d.normalizeServiceImageAsset(v):''; };
  const normalizeServiceGalleryList=function(l){ return _d.normalizeServiceGalleryList?_d.normalizeServiceGalleryList(l):[]; };
  const normalizeServiceVideoUrl=function(v){ return _d.normalizeServiceVideoUrl?_d.normalizeServiceVideoUrl(v):''; };
  const serviceRepairStatusOptions=_d.serviceRepairStatusOptions||[];
  const serviceAppointmentStatusOptions=_d.serviceAppointmentStatusOptions||[];
  const serviceRequestStatusOptions=_d.serviceRequestStatusOptions||[];
  const servicePrimaryCenterId = _d.servicePrimaryCenterId || 'service-center-1';

  // Garage helpers
  const normalizeGarageCar   = function(c){ return _d.normalizeGarageCar?_d.normalizeGarageCar(c):(c||{}); };
  const normalizeGarageList  = function(l){ return _d.normalizeGarageList?_d.normalizeGarageList(l):(l||[]); };
  const ensureCarId          = function(id){ return _d.ensureCarId?_d.ensureCarId(id):(id||''); };
  const buildSmartCareTasks  = function(m,id){ return _d.buildSmartCareTasks?_d.buildSmartCareTasks(m,id):[]; };
  const normalizeMaintenanceRecord=function(r){ return _d.normalizeMaintenanceRecord?_d.normalizeMaintenanceRecord(r):(r||{}); };
  const countMaintenanceRecords=function(m){ return _d.countMaintenanceRecords?_d.countMaintenanceRecords(m):0; };
  const vehicleDocumentKinds = _d.vehicleDocumentKinds || [];
  const maintenanceTypeOptions=_d.maintenanceTypeOptions || [];
  // garageCars и savedPlaces читаются через _d динамически в компонентах
  // (используйте _d.garageCars и _d.savedPlaces напрямую)

  // Misc helpers
  const normalizeGarageSavedPlaces=function(l){ return _d.normalizeSavedPlacesList?_d.normalizeSavedPlacesList(l):(l||[]); };
  const getSupabaseClient    = function(){ return window.__DRIVEX_SUPABASE_CLIENT__||null; };

  // BookingService & other services
  const DrivexBookingService = window.DrivexBookingService || null;
  const DrivexPartnerRepository = window.DrivexPartnerRepository || null;
  function ServiceDetailScreen({ serviceId, serviceDirectory }) {
    const runtimeServices =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item));
    const service = runtimeServices.find((item) => String(item.id) === String(serviceId)) || null;
    const toast = useToast();
    const [isSaved, setIsSaved] = useState(false);

    if (!service) {
      return html`
        <${SimplePage} title="Сервис не найден" backPath="/services">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Попробуйте открыть другой сервис.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const fallbackImage =
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
    const heroImage = service.image || service.coverImage || fallbackImage;
    const serviceRenderKey = `${String(service.id || "service")}:${heroImage.length}:${heroImage.slice(-24)}`;
    const gallery = Array.from(new Set([heroImage, ...(Array.isArray(service.gallery) ? service.gallery.filter(Boolean) : [])]))
      .filter(Boolean)
      .slice(0, 6);
    const masters = Array.isArray(service.masters) ? service.masters.filter(Boolean).slice(0, 6) : [];
    const ratingValue = Number.isFinite(Number(service.smartRating || service.rating))
      ? Number(service.smartRating || service.rating).toFixed(1)
      : "4.8";
    const reviewCount = Math.max(0, Math.round(Number(service.reviews) || 0));
    const distanceLabel = String(service.distance || "1.2 км").trim();
    const travelMinutes = (() => {
      const normalized = distanceLabel.replace(",", ".").toLowerCase();
      if (normalized.includes("м") && !normalized.includes("км")) return 5;
      const numeric = parseFloat(normalized);
      if (!Number.isFinite(numeric) || numeric <= 0) return 5;
      return Math.max(5, Math.round(numeric * 4.2));
    })();
    const locationMeta = [service.type || service.category || "СТО", distanceLabel, service.city || "Худжанд"]
      .filter(Boolean)
      .join(" • ");
    const shortAddress = [service.city, service.address || service.locationLabel].filter(Boolean).join(", ");
    const workingHours = String(service.workingHours || "").trim();
    const endTime = parseServiceWorkingHoursRange(workingHours).endTime || "18:00";
    const availability = service.available === false
      ? { label: `Занято до ${endTime}`, color: "var(--drivex-danger)" }
      : { label: "Свободно сейчас", color: "var(--drivex-success)" };
    const startingPrice = (() => {
      const typeLabel = `${service.type || ""} ${service.category || ""}`.toLowerCase();
      if (typeLabel.includes("детейл")) return 120;
      if (typeLabel.includes("шин")) return 60;
      if (typeLabel.includes("диаг")) return 50;
      if (typeLabel.includes("элект")) return 70;
      return 80;
    })();
    const returnRate = Math.max(40, Math.round(Number(service.repeatClientsPercent) || 67));
    const monthlyClients = Math.max(18, Math.round((Number(service.completedCars) || 216) / 12));
    const trustChips = [
      { id: "verified", label: "Проверено DRIVEX", color: "var(--drivex-neon-cyan)" },
      { id: "monthly", label: `${monthlyClients} клиентов в месяц`, color: "var(--drivex-electric-blue)" }
    ];
    const summaryMetrics = [
      { id: "rating", icon: "star", value: ratingValue, label: "рейтинг", color: "var(--drivex-warning)" },
      { id: "time", icon: "clock", value: service.averageRepairTime || "25 мин", label: "среднее время", color: "var(--drivex-electric-blue)" },
      { id: "price", icon: "coins", value: `от ${formatTjsPrice(startingPrice)}`, label: "старт по цене", color: "var(--drivex-warning)" },
      { id: "repeat", icon: "repeat", value: `${returnRate}%`, label: "возвращаются", color: "var(--drivex-success)" }
    ];
    const servicesList = (() => {
      const typeLabel = `${service.type || ""} ${service.category || ""}`.toLowerCase();
      if (typeLabel.includes("детейл")) {
        return [
          { id: "wash", title: "Комплексная мойка", duration: "45 мин", price: 80 },
          { id: "salon", title: "Химчистка салона", duration: "2 ч", price: 180 },
          { id: "polish", title: "Полировка кузова", duration: "3 ч", price: 260 },
          { id: "coat", title: "Защитное покрытие", duration: "4 ч", price: 420 }
        ];
      }
      if (typeLabel.includes("шин")) {
        return [
          { id: "tires", title: "Комплект шиномонтажа", duration: "35 мин", price: 60 },
          { id: "balance", title: "Балансировка", duration: "20 мин", price: 40 },
          { id: "repair", title: "Ремонт прокола", duration: "15 мин", price: 25 },
          { id: "storage", title: "Сезонная замена", duration: "30 мин", price: 70 }
        ];
      }
      return [
        { id: "oil", title: "Замена масла", duration: "25 мин", price: 95 },
        { id: "diag", title: "Диагностика", duration: "15 мин", price: 40 },
        { id: "brakes", title: "Проверка тормозов", duration: "30 мин", price: 70 },
        { id: "suspension", title: "Ходовая и подвеска", duration: "45 мин", price: 120 }
      ];
    })();
    const messageHref = (() => {
      const safePhone = String(service.phone || "").trim().replace(/[^\d+]/g, "");
      return safePhone ? `sms:${safePhone}` : "";
    })();

    return html`
      <div className="min-h-screen" style=${{ background: "var(--drivex-black)", paddingBottom: "112px" }}>
        <div className="relative h-[292px] overflow-hidden">
          <img key=${serviceRenderKey} src=${heroImage} alt=${service.name} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style=${{
              background:
                "linear-gradient(180deg, rgba(2, 6, 23, 0.08) 0%, rgba(2, 6, 23, 0.36) 30%, rgba(2, 6, 23, 0.88) 100%)"
            }}
          ></div>
          <div
            className="absolute inset-x-0 top-0 h-32"
            style=${{ background: "linear-gradient(180deg, rgba(2, 6, 23, 0.72) 0%, rgba(2, 6, 23, 0) 100%)" }}
          ></div>

          <div className="absolute inset-x-0 top-0 px-5 pt-5 flex items-center justify-between">
            <a
              href="#/services"
              className="w-11 h-11 rounded-2xl inline-flex items-center justify-center"
              style=${{
                background: "rgba(8, 15, 26, 0.5)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(14px)"
              }}
              aria-label="Назад к сервисам"
            >
              <${Icon} name="chevron-left" size=${20} />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-11 h-11 rounded-2xl inline-flex items-center justify-center"
                style=${{
                  background: isSaved ? alphaBg("var(--drivex-warning)", 0.22) : "rgba(8, 15, 26, 0.5)",
                  color: isSaved ? "var(--drivex-warning)" : "var(--drivex-white)",
                  border: `1px solid ${isSaved ? alphaBg("var(--drivex-warning)", 0.4) : "rgba(255, 255, 255, 0.12)"}`,
                  backdropFilter: "blur(14px)"
                }}
                onClick=${() => {
                  const next = !isSaved;
                  setIsSaved(next);
                  toast.push(next ? "Сервис сохранён" : "Сервис убран из избранного");
                }}
                aria-label=${isSaved ? "Убрать из избранного" : "Сохранить сервис"}
              >
                <${Icon} name="star" size=${18} />
              </button>
              <button
                type="button"
                className="w-11 h-11 rounded-2xl inline-flex items-center justify-center"
                style=${{
                  background: "rgba(8, 15, 26, 0.5)",
                  color: "var(--drivex-white)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(14px)"
                }}
                onClick=${async () => {
                  const shareLink = `${window.location.href.split("#")[0]}#/service/${service.id}`;
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(shareLink);
                      toast.push("Ссылка на сервис скопирована");
                    } else {
                      toast.push("Копирование недоступно");
                    }
                  } catch (error) {
                    toast.push("Не удалось скопировать ссылку");
                  }
                }}
                aria-label="Поделиться сервисом"
              >
                <${Icon} name="copy" size=${18} />
              </button>
            </div>
          </div>

          <div className="absolute left-5 top-20 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold" style=${{
              background: alphaBg(availability.color, 0.18),
              color: availability.color,
              border: `1px solid ${alphaBg(availability.color, 0.28)}`,
              backdropFilter: "blur(10px)"
            }}>
              <span className="w-2 h-2 rounded-full" style=${{ background: availability.color }}></span>
              ${availability.label}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
            <h1 className="text-[30px] leading-tight font-bold" style=${{ color: "var(--drivex-white)" }}>
              ${service.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-sm">
              <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-warning)" }}>
                <${Icon} name="star" size=${14} />
                ${ratingValue} • ${reviewCount} отзывов
              </span>
              <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-light-silver)" }}>
                <${Icon} name="map" size=${14} />
                ${distanceLabel} • ${travelMinutes} мин
              </span>
            </div>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
              ${locationMeta}
            </p>
          </div>
        </div>

        <div className="relative z-10 -mt-10 px-5 space-y-4">
          <div className="space-y-3">
            <button
              type="button"
              className="w-full text-left"
              style=${{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                minHeight: "60px",
                padding: "0 18px 0 20px",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 52%, #0284c7 100%)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(186, 230, 253, 0.18)",
                boxShadow: "0 18px 36px rgba(14, 165, 233, 0.28)"
              }}
              onClick=${() => navigateToHash(getServiceBookingPath(service.id))}
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em]" style=${{ color: "rgba(224, 242, 254, 0.82)" }}>
                  Онлайн запись
                </span>
                <span className="block text-[18px] font-semibold leading-none mt-1">
                  Записаться сейчас
                </span>
              </span>
              <span
                className="w-9 h-9 rounded-full inline-flex items-center justify-center flex-shrink-0"
                style=${{
                  background: "rgba(255, 255, 255, 0.18)",
                  color: "var(--drivex-white)",
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14)"
                }}
              >
                <${Icon} name="chevron-right" size=${18} />
              </span>
            </button>
            <div className="flex flex-wrap gap-2">
              ${trustChips.map((chip) => html`
                <span
                  key=${chip.id}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style=${{
                    background: alphaBg(chip.color, 0.16),
                    color: chip.color,
                    border: `1px solid ${alphaBg(chip.color, 0.22)}`
                  }}
                >
                  ${chip.label}
                </span>
              `)}
            </div>
          </div>

          <section
            className="rounded-[28px] p-5"
            style=${{
              background: "linear-gradient(145deg, rgba(13, 23, 39, 0.98) 0%, rgba(16, 27, 46, 0.96) 100%)",
              border: "1px solid rgba(6, 182, 212, 0.12)",
              boxShadow: "0 22px 50px rgba(0, 0, 0, 0.24)"
            }}
          >
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px]" style=${{ background: "rgba(148, 163, 184, 0.14)" }}>
              ${summaryMetrics.map((item) => html`
                <div key=${item.id} className="p-4" style=${{ background: "rgba(11, 18, 32, 0.96)" }}>
                  <span className="inline-flex items-center gap-2 text-xs font-medium" style=${{ color: item.color }}>
                    <${Icon} name=${item.icon} size=${14} />
                    ${item.label}
                  </span>
                  <p className="text-[20px] font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                    ${item.value}
                  </p>
                </div>
              `)}
            </div>
          </section>

          <section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div className="mb-4">
              <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                Услуги
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Популярные работы сервиса без лишнего шума
              </p>
            </div>
            <div className="space-y-3">
              ${servicesList.map((item) => html`
                <div
                  key=${item.id}
                  className="rounded-[22px] p-4 flex items-center gap-3"
                  style=${{ background: "rgba(255, 255, 255, 0.035)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      ${item.title}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${item.duration} • ${formatTjsPrice(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-full text-sm font-semibold flex-shrink-0"
                    style=${{
                      background: "rgba(14, 165, 233, 0.14)",
                      color: "var(--drivex-electric-blue)",
                      border: "1px solid rgba(14, 165, 233, 0.2)"
                    }}
                    onClick=${() => navigateToHash(getServiceBookingPath(service.id))}
                  >
                    Записаться
                  </button>
                </div>
              `)}
            </div>
            <button
              type="button"
              className="w-full mt-4 px-4 py-3 rounded-full text-sm font-semibold"
              style=${{
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
              onClick=${() => toast.push("Полный прайс откроем в следующем обновлении")}
            >
              Показать все услуги
            </button>
          </section>

          ${masters.length
            ? html`<section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div className="mb-4">
                  <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                    Мастера
                  </h2>
                  <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Команда, которой доверяют клиенты
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  ${masters.map((master) => {
                    const initials = String(master.name || "DX")
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase();
                    return html`<div
                      key=${master.id || master.name}
                      className="w-40 flex-shrink-0 rounded-[24px] p-4"
                      style=${{ background: "rgba(255, 255, 255, 0.035)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold"
                        style=${{
                          background: "linear-gradient(145deg, rgba(14, 165, 233, 0.22) 0%, rgba(6, 182, 212, 0.16) 100%)",
                          color: "var(--drivex-white)"
                        }}
                      >
                        ${initials}
                      </div>
                      <p className="font-semibold mt-4" style=${{ color: "var(--drivex-white)" }}>
                        ${master.name}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-light-silver)" }}>
                        ${master.experience || "Опытный мастер"}
                      </p>
                      <p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)", lineHeight: 1.5 }}>
                        ${master.specialty || master.role || "ТО и ремонт"}
                      </p>
                    </div>`;
                  })}
                </div>
              </section>`
            : null}

          ${gallery.length
            ? html`<section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div className="mb-4">
                  <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                    Фото сервиса
                  </h2>
                  <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Живые кадры сервиса и рабочей зоны
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1" style=${{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                  ${gallery.map((photo, index) => html`
                    <div
                      key=${`${service.id}-gallery-${index}`}
                      className="rounded-[22px] overflow-hidden flex-shrink-0"
                      style=${{
                        width: "160px",
                        minWidth: "160px",
                        flex: "0 0 160px",
                        height: "112px",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        background: "rgba(255, 255, 255, 0.03)"
                      }}
                    >
                      <img src=${photo} alt=${`${service.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  `)}
                </div>
              </section>`
            : null}

          <section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style=${{ background: "rgba(14, 165, 233, 0.12)", color: "var(--drivex-electric-blue)" }}
              >
                <${Icon} name="map" size=${18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Локация
                </h2>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)", lineHeight: 1.6 }}>
                  ${shortAddress || "Точка сервиса уже отмечена на карте DRIVEX"}
                </p>
                ${workingHours
                  ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${workingHours}
                    </p>`
                  : null}
              </div>
            </div>
            <button
              type="button"
              className="w-full mt-4 px-4 py-3 rounded-full text-sm font-semibold"
              style=${{
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
              onClick=${() => navigateToHash("/map")}
            >
              Открыть на карте
            </button>
          </section>
        </div>

        <div className="px-5 pt-3 pb-8">
          <div
            className="rounded-[28px] p-3"
            style=${{
              background: "rgba(8, 15, 26, 0.88)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
              backdropFilter: "blur(18px)"
            }}
          >
            <div className="grid gap-3" style=${{ gridTemplateColumns: "0.9fr 1.3fr" }}>
              <button
                type="button"
                className="px-4 py-3.5 rounded-[20px] text-sm font-semibold"
                style=${{
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "var(--drivex-white)",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
                onClick=${() => {
                  if (messageHref) {
                    window.location.href = messageHref;
                    return;
                  }
                  toast.push("У сервиса пока нет номера для сообщения");
                }}
              >
                Написать
              </button>
              <button
                type="button"
                className="px-4 py-3.5 rounded-[20px] text-sm font-semibold dx-btn"
                style=${{ boxShadow: "0 16px 34px rgba(14, 165, 233, 0.22)" }}
                onClick=${() => navigateToHash(getServiceBookingPath(service.id))}
              >
                Записаться
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function MarketStoreScreen({ storeId, onAddToCart }) {
    const store = getMarketStore(storeId);

    if (!store) {
      return html`
        <${SimplePage} title="Магазин не найден" backPath="/market">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Попробуйте открыть другой партнёрский магазин.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const storeProducts = getMarketProductsByStore(store.id);

    return html`
      <${SimplePage} title=${store.name} backPath="/market">
        <div className="px-6 py-6 space-y-4">
          <div
            className="glass-card rounded-3xl p-6"
            style=${{
              background: `linear-gradient(145deg, ${alphaBg(store.accent, 0.28)} 0%, rgba(15, 23, 42, 0.96) 100%)`
            }}
          >
            <div className="flex items-start gap-4">
              <${MarketStoreAvatar} store=${store} size=${56} rounded="18px" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${store.name}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${store.city}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style=${{
                      background: alphaBg(store.accent, 0.18),
                      color: store.accent
                    }}
                  >
                    ${store.deliveryAvailable ? "Есть доставка" : "Самовывоз"}
                  </span>
                </div>

                <p className="text-sm mt-4" style=${{ color: "var(--drivex-light-silver)" }}>
                  ${store.description || store.tagline}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="glass-card-light rounded-2xl p-3">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  Рейтинг
                </p>
                <p className="font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${store.rating}
                </p>
              </div>
              <div className="glass-card-light rounded-2xl p-3">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  Отзывы
                </p>
                <p className="font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${store.reviews}
                </p>
              </div>
              <div className="glass-card-light rounded-2xl p-3">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  Товары
                </p>
                <p className="font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${storeProducts.length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
              Условия магазина
            </p>
            <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
              ${store.deliveryNote}
            </p>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
              Самовывоз: ${store.pickup}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Товары магазина
            </h2>
            <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              ${storeProducts.length} позиций
            </span>
          </div>

          <${MemoProductGrid}
            products=${storeProducts}
            onAddToCart=${onAddToCart}
            emptyTitle="У магазина пока нет товаров"
          />
        </div>
      </${SimplePage}>
    `;
  }

  function ProductDetailScreen({ productId, onAddToCart }) {
    const toast = useToast();
    const [addedPulse, setAddedPulse] = useState(false);
    const addedTimerRef = useRef(null);
    const product = getMarketProduct(productId);

    useEffect(() => {
      return () => {
        if (addedTimerRef.current) {
          window.clearTimeout(addedTimerRef.current);
        }
      };
    }, []);

    if (!product) {
      return html`
        <${SimplePage} title="Товар не найден" backPath="/market">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Попробуйте открыть другой товар.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const store = getMarketStore(product.storeId);
    const badgeBg = getMarketBadgeColor(product);
    const relatedProducts = getRelatedMarketProducts(product, 4);
    const handleAddToCart = useCallback(() => {
      onAddToCart && onAddToCart(product);
      setAddedPulse(true);
      if (addedTimerRef.current) {
        window.clearTimeout(addedTimerRef.current);
      }
      addedTimerRef.current = window.setTimeout(() => {
        setAddedPulse(false);
        addedTimerRef.current = null;
      }, 1200);
    }, [onAddToCart, product]);

    return html`
      <${SimplePage} title=${product.name} backPath="/market">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-3xl overflow-hidden">
            <div className="relative h-60 overflow-hidden">
              <img src=${product.image} alt=${product.name} className="w-full h-full object-cover" />
              ${product.badge
                ? html`<div
                    className="absolute top-3 left-3 px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md"
                    style=${{ background: badgeBg, color: "var(--drivex-white)" }}
                  >
                    ${product.badge}
                  </div>`
                : null}
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="px-3 py-1 rounded-xl text-xs font-semibold"
                  style=${{
                    background: alphaBg(
                      marketCategories.find((category) => category.id === product.categoryId)?.color ||
                        "var(--drivex-neon-cyan)",
                      0.18
                    ),
                    color:
                      marketCategories.find((category) => category.id === product.categoryId)?.color ||
                      "var(--drivex-neon-cyan)"
                  }}
                >
                  ${product.category}
                </span>
                <span style=${{ color: "var(--drivex-silver)", fontSize: "12px" }}>
                  ${product.unitLabel}
                </span>
              </div>

              <p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)" }}>
                ${product.description}
              </p>

              ${store
                ? html`<a
                    href=${getMarketStorePath(store.id)}
                    className="glass-card rounded-2xl p-4 mt-4 block"
                    style=${{
                      background: `linear-gradient(145deg, ${alphaBg(store.accent, 0.2)} 0%, rgba(15, 23, 42, 0.9) 100%)`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <${MarketStoreAvatar} store=${store} size=${42} rounded="14px" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                              ${store.name}
                            </p>
                            <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                              ${store.city}
                            </p>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-xl text-xs font-semibold"
                            style=${{
                              background: alphaBg(store.accent, 0.18),
                              color: store.accent
                            }}
                          >
                            ${store.deliveryAvailable ? "Доставка" : "Самовывоз"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-sm">
                          <span style=${{ color: "var(--drivex-warning)" }}>
                            <${Icon} name="star" size=${13} />
                          </span>
                          <span style=${{ color: "var(--drivex-warning)" }}>${store.rating}</span>
                          <span style=${{ color: "var(--drivex-silver)" }}>(${store.reviews})</span>
                          <span style=${{ color: "var(--drivex-silver)" }}>• ${product.delivery}</span>
                        </div>
                      </div>
                    </div>
                  </a>`
                : null}

              <div className="flex items-baseline gap-2 mb-3 mt-5">
                <span className="font-bold text-2xl" style=${{ color: "var(--drivex-white)" }}>
                  ${formatTjsPrice(product.price)}
                </span>
                ${product.oldPrice
                  ? html`<span className="text-sm line-through" style=${{ color: "var(--drivex-silver)" }}>
                      ${formatTjsPrice(product.oldPrice)}
                    </span>`
                  : null}
              </div>

              <div className="flex items-center gap-2 text-sm mb-4" style=${{ color: "var(--drivex-warning)" }}>
                <${Icon} name="star" size=${14} />
                ${product.rating}
                <span style=${{ color: "var(--drivex-silver)" }}>(${product.reviewsCount || product.reviews})</span>
              </div>

              <div className="glass-card rounded-2xl p-4 mb-4">
                <p className="text-sm" style=${{ color: "var(--drivex-light-silver)" }}>
                  Доставка: <span style=${{ color: "var(--drivex-white)" }}>${product.delivery}</span>
                  <br />
                  В наличии: <span style=${{ color: "var(--drivex-white)" }}>
                    ${product.stock ? "Да" : "Нет"}
                  </span>
                  ${store
                    ? html`<span>
                        <br />
                        Самовывоз: <span style=${{ color: "var(--drivex-white)" }}>${store.pickup}</span>
                      </span>`
                    : null}
                </p>
              </div>

              ${Array.isArray(product.specs) && product.specs.length
                ? html`<div className="glass-card-light rounded-2xl p-4 mb-4">
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Характеристики
                    </p>
                    <div className="flex gap-2 flex-wrap mt-3">
                      ${product.specs.map((spec) => html`
                        <span
                          key=${spec}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style=${{
                            background: "var(--glass-bg)",
                            color: "var(--drivex-light-silver)"
                          }}
                        >
                          ${spec}
                        </span>
                      `)}
                    </div>
                  </div>`
                : null}

              <div className="grid grid-cols-3 gap-3">
                ${store
                  ? html`<a
                      href=${getMarketStorePath(store.id)}
                      className="py-3 rounded-2xl text-center font-semibold"
                      style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                    >
                      Магазин
                    </a>`
                  : html`<div
                      className="py-3 rounded-2xl text-center font-semibold"
                      style=${{ background: "var(--glass-bg)", color: "var(--drivex-silver)" }}
                    >
                      Магазин
                    </div>`}
                <button
                  type="button"
                  className="py-3 rounded-2xl text-sm font-semibold"
                  style=${{ background: "rgba(6, 182, 212, 0.12)", color: "var(--drivex-neon-cyan)" }}
                  onClick=${() => toast.push("Чат с продавцом появится после оформления заказа")}
                >
                  Написать
                </button>
                <button
                  type="button"
                  className=${`py-3 rounded-2xl text-sm font-bold dx-btn ${addedPulse ? "market-added-btn" : ""}`}
                  onClick=${handleAddToCart}
                >
                  ${addedPulse ? "Добавлено" : "В корзину"}
                </button>
              </div>
            </div>
          </div>

          ${relatedProducts.length
            ? html`<div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                      Похожие товары
                    </h2>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      По категории и продавцу
                    </p>
                  </div>
                  <a
                    href="#/market"
                    className="text-sm font-semibold"
                    style=${{ color: "var(--drivex-neon-cyan)" }}
                  >
                    В каталог
                  </a>
                </div>

                <${MemoProductGrid} products=${relatedProducts} onAddToCart=${onAddToCart} />
              </div>`
            : null}
        </div>
      </${SimplePage}>
    `;
  }

  function CategoryScreen({ categoryId, serviceDirectory, activeCarId }) {
    const decodedCategoryId = decodeRouteSegment(categoryId);
    const categoryMeta = getServiceCategoryMeta(decodedCategoryId);
    const servicesSource =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]);
    const allServices = dedupeServicesById(servicesSource).map((item) => decorateServiceRecord(item));
    const personalizedServices = getPersonalizedServices(allServices, activeCarId);
    const filteredServices = dedupeServicesById([
      ...personalizedServices.filter((service) => service.categoryId === categoryMeta.id),
      ...allServices.filter((service) => service.categoryId === categoryMeta.id)
    ]);

    const renderFilteredService = (service) => {
      const meta = [
        service.categoryLabel || service.category,
        service.distance,
        service.city
      ].filter(Boolean).join(" • ");

      return html`
        <a
          key=${`category-service-${service.id}`}
          href=${`#/service/${service.id}`}
          className="services-redesign-card"
          style=${{ textDecoration: "none" }}
        >
          <div className="services-redesign-photo">
            ${service.image
              ? html`<img
                  key=${getServiceImageRenderKey(service)}
                  src=${service.image}
                  alt=${service.name}
                />`
              : html`<span style=${{ color: categoryMeta.color }}><${Icon} name=${categoryMeta.icon} size=${24} /></span>`}
            <b>${categoryMeta.name}</b>
          </div>

          <div className="services-redesign-card-body">
            <div className="services-redesign-card-head">
              <div className="min-w-0">
                <h3>${service.name}</h3>
                <p>${meta || service.address || "Сервис DriveX"}</p>
              </div>
              <span
                className="inline-flex items-center gap-1 text-[13px] font-bold"
                style=${{ color: "var(--drivex-warning)" }}
              >
                <${Icon} name="star" size=${12} />
                ${service.smartRating || service.rating || "4.8"}
              </span>
            </div>

            <div className="services-redesign-meta">
              <span>${service.workingHours || "08:00 — 20:00"}</span>
              <span>${service.reviews || "120+"} отзывов</span>
              <span>${service.boxesCount || 2} бокса</span>
            </div>

            <div className="services-redesign-card-foot">
              <strong>${service.price || "Запись онлайн"}</strong>
              <button
                type="button"
                onClick=${(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  navigateToHash(getServiceBookingPath(service.id));
                }}
              >
                Записаться
              </button>
            </div>
          </div>
        </a>
      `;
    };

    return html`
      <${SimplePage} title=${`Категория: ${categoryMeta.name}`} backPath="/services">
        <div className="px-4 py-5 space-y-4">
          <div
            className="rounded-[24px] p-5"
            style=${{
              background: "linear-gradient(135deg, rgba(9, 30, 47, 0.96), rgba(17, 22, 35, 0.96))",
              border: `1px solid ${alphaBg(categoryMeta.color, 0.24)}`,
              boxShadow: `0 18px 34px ${alphaBg(categoryMeta.color, 0.12)}`
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center rounded-2xl"
                style=${{
                  width: "48px",
                  height: "48px",
                  color: categoryMeta.color,
                  background: alphaBg(categoryMeta.color, 0.16)
                }}
              >
                <${Icon} name=${categoryMeta.icon} size=${22} />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] font-bold" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  Фильтр услуг
                </p>
                <h2 className="text-xl font-black m-0" style=${{ color: "var(--drivex-white)" }}>
                  ${categoryMeta.name}
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed" style=${{ color: "var(--drivex-silver)" }}>
              ${filteredServices.length
                ? `Найдено сервисов: ${filteredServices.length}. Новые сервисы из CRM автоматически попадают сюда и в ленту.`
                : "Пока в этой категории нет подключенных сервисов. Когда сервис добавит такой тип услуги, он появится здесь автоматически."}
            </p>
          </div>

          ${filteredServices.length
            ? html`
                <div className="services-redesign-list">
                  ${filteredServices.map(renderFilteredService)}
                </div>
              `
            : html`
                <div className="glass-card-light rounded-2xl p-5">
                  <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    Нет сервисов в категории «${categoryMeta.name}»
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                    Добавьте сервис с типом «${categoryMeta.name}» через CRM, и он появится в этом фильтре.
                  </p>
                  <a
                    href="#/service-crm"
                    className="inline-flex items-center justify-center mt-4 px-4 py-3 rounded-full text-sm font-bold dx-btn"
                  >
                    Добавить сервис
                  </a>
                </div>
              `}
        </div>
      </${SimplePage}>
    `;
  }

  function NotFoundScreen({ path }) {
    return html`
      <${SimplePage} title="404" backPath="/">
        <div className="px-6 py-6">
          <div className="glass-card-light rounded-2xl p-5">
            <p className="text-sm" style=${{ color: "var(--drivex-white)" }}>
              Страница не найдена:
              <code style=${{ color: "var(--drivex-neon-cyan)" }}>${path}</code>
            </p>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function CartScreen({ items, total, profile, onSetQty, onRemove, onCheckout }) {
    const toast = useToast();
    const storesCount = new Set(items.map((item) => item.storeId).filter(Boolean)).size;
    const [checkoutDraft, setCheckoutDraft] = useState(() => createMarketplaceCheckoutDraft(items, profile));

    useEffect(() => {
      setCheckoutDraft((prev) => syncMarketplaceCheckoutDraft(prev, items, profile));
    }, [items, profile]);

    const groupedItems = useMemo(() => {
      return Object.entries(
        (Array.isArray(items) ? items : []).reduce((acc, item) => {
          const storeId = item.storeId || "unknown-store";
          if (!acc[storeId]) acc[storeId] = [];
          acc[storeId].push(item);
          return acc;
        }, {})
      );
    }, [items]);

    const updateCheckoutField = useCallback((key, value) => {
      setCheckoutDraft((prev) => ({
        ...(prev || createMarketplaceCheckoutDraft(items, profile)),
        [key]: value
      }));
    }, [items, profile]);

    const updateStoreCheckoutField = useCallback((storeId, key, value) => {
      setCheckoutDraft((prev) => {
        const nextDraft = syncMarketplaceCheckoutDraft(prev, items, profile);
        return {
          ...nextDraft,
          deliveryByStore: {
            ...nextDraft.deliveryByStore,
            [storeId]: {
              ...nextDraft.deliveryByStore[storeId],
              [key]: value
            }
          }
        };
      });
    }, [items, profile]);

    return html`
      <${SimplePage} title="Корзина" backPath="/market">
        <div className="px-6 py-6 space-y-4">
          ${items.length === 0
            ? html`<div className="glass-card-light rounded-2xl p-6 text-center">
                <p className="font-semibold mb-2" style=${{ color: "var(--drivex-white)" }}>
                  Корзина пуста
                </p>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Добавьте товары из Маркета.
                </p>
              </div>`
            : html`
                <div className="glass-card rounded-2xl p-5 neon-glow-blue">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                        В корзине
                      </p>
                      <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                        ${items.length} товара
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                        Магазинов
                      </p>
                      <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                        ${storesCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  ${groupedItems.map(([storeId, storeItems]) => {
                    const store = getMarketStore(storeId);
                    const storeSubtotal = storeItems.reduce(
                      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
                      0
                    );

                    return html`
                      <div key=${`cart-group-${storeId}`} className="market-cart-store">
                        <div className="market-cart-store-head">
                          <div className="min-w-0">
                            <h3>${store?.name || storeItems[0]?.storeName || "Магазин DRIVEX"}</h3>
                            <p>${store?.city || "Marketplace"} • ${storeItems.length} поз.</p>
                          </div>
                          <strong>${formatTjsPrice(storeSubtotal)}</strong>
                        </div>

                        <div className="market-cart-items">
                          ${storeItems.map((item) => html`
                            <div key=${`${storeId}-${item.id}`} className="market-cart-item">
                              <img src=${item.image} alt=${item.name} loading="lazy" decoding="async" />

                              <div className="min-w-0 flex-1">
                                <div className="market-cart-item-top">
                                  <div className="min-w-0">
                                    <h4>${item.name}</h4>
                                    <p>${formatTjsPrice(item.price)}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick=${() => onRemove(item.cartKey || item.id, item.storeId)}
                                    aria-label="Удалить"
                                  >
                                    ×
                                  </button>
                                </div>

                                <div className="market-cart-item-bottom">
                                  <div className="market-cart-qty">
                                    <button
                                      type="button"
                                      onClick=${() => onSetQty(item.cartKey || item.id, item.qty - 1, item.storeId)}
                                    >
                                      -
                                    </button>
                                    <span>${item.qty}</span>
                                    <button
                                      type="button"
                                      onClick=${() => onSetQty(item.cartKey || item.id, item.qty + 1, item.storeId)}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <strong>${formatTjsPrice(item.price * item.qty)}</strong>
                                </div>
                              </div>
                            </div>
                          `)}
                        </div>
                      </div>
                    `;
                  })}
                </div>

                <div className="glass-card-light rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        Оформление заказа
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        Покупатель выбирает способ получения, а продавец получает заказ именно в таком виде.
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-semibold"
                      style=${{
                        background: "rgba(14, 165, 233, 0.16)",
                        color: "var(--drivex-electric-blue)"
                      }}
                    >
                      ${storesCount} магазина
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        Имя получателя
                      </span>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl outline-none dx-input mt-2"
                        style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                        value=${checkoutDraft.customerName}
                        onInput=${(e) => updateCheckoutField("customerName", e.target.value)}
                        placeholder="Введите имя"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        Телефон
                      </span>
                      <input
                        type="tel"
                        className="w-full p-3 rounded-xl outline-none dx-input mt-2"
                        style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                        value=${checkoutDraft.customerPhone}
                        onInput=${(e) => updateCheckoutField("customerPhone", e.target.value)}
                        placeholder="+992 00 000 00 00"
                      />
                    </label>
                  </div>

                  <div className="space-y-4 mt-5">
                    ${groupedItems.map(([storeId, storeItems]) => {
                      const store = getMarketStore(storeId);
                      const storeDraft = checkoutDraft.deliveryByStore?.[storeId] || {
                        deliveryMode: store?.deliveryAvailable ? "delivery" : "pickup",
                        address: "",
                        comment: ""
                      };
                      const storeSubtotal = storeItems.reduce(
                        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
                        0
                      );

                      return html`
                        <div key=${storeId} className="glass-card rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                                ${store?.name || "Магазин DRIVEX"}
                              </p>
                              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                                ${storeItems.length} поз. • ${formatTjsPrice(storeSubtotal)}
                              </p>
                            </div>
                            <span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                              ${store?.city || ""}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                              type="button"
                              className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                              style=${{
                                background:
                                  storeDraft.deliveryMode === "pickup"
                                    ? "rgba(14, 165, 233, 0.16)"
                                    : "var(--glass-bg)",
                                color:
                                  storeDraft.deliveryMode === "pickup"
                                    ? "var(--drivex-electric-blue)"
                                    : "var(--drivex-white)",
                                opacity: 1
                              }}
                              onClick=${() => updateStoreCheckoutField(storeId, "deliveryMode", "pickup")}
                            >
                              Самовывоз
                            </button>
                            <button
                              type="button"
                              className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                              style=${{
                                background:
                                  storeDraft.deliveryMode === "delivery"
                                    ? "rgba(6, 182, 212, 0.16)"
                                    : "var(--glass-bg)",
                                color:
                                  storeDraft.deliveryMode === "delivery"
                                    ? "var(--drivex-neon-cyan)"
                                    : "var(--drivex-white)",
                                opacity: store?.deliveryAvailable ? 1 : 0.55
                              }}
                              onClick=${() => {
                                if (!store?.deliveryAvailable) {
                                  toast.push("У этого магазина сейчас только самовывоз");
                                  return;
                                }
                                updateStoreCheckoutField(storeId, "deliveryMode", "delivery");
                              }}
                            >
                              Доставка
                            </button>
                          </div>

                          ${storeDraft.deliveryMode === "delivery"
                            ? html`<label className="block mt-4">
                                <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                                  Адрес доставки
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-3 rounded-xl outline-none dx-input mt-2"
                                  style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                                  value=${storeDraft.address}
                                  onInput=${(e) => updateStoreCheckoutField(storeId, "address", e.target.value)}
                                  placeholder="Например: Зарафшон, ул. Сомони 15, кв. 8"
                                />
                              </label>`
                            : html`<div className="glass-card-light rounded-2xl p-4 mt-4">
                                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                                  Адрес самовывоза
                                </p>
                                <p className="text-sm mt-2" style=${{ color: "var(--drivex-white)" }}>
                                  ${store?.pickup || store?.address || "Магазин сообщит адрес самовывоза"}
                                </p>
                              </div>`}

                          <label className="block mt-4">
                            <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                              Комментарий продавцу
                            </span>
                            <textarea
                              className="w-full p-3 rounded-xl outline-none dx-input mt-2"
                              style=${{
                                background: "var(--glass-bg)",
                                color: "var(--drivex-white)",
                                minHeight: "88px"
                              }}
                              value=${storeDraft.comment}
                              onInput=${(e) => updateStoreCheckoutField(storeId, "comment", e.target.value)}
                              placeholder="Например: позвоните перед доставкой"
                            ></textarea>
                          </label>
                        </div>
                      `;
                    })}
                  </div>
                </div>
              `}

          ${items.length > 0
            ? html`<div className="glass-card rounded-2xl p-5 neon-glow-blue">
                <div className="flex items-center justify-between mb-3">
                  <span style=${{ color: "var(--drivex-silver)" }}>Итого</span>
                  <span className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                    ${formatTjsPrice(total)}
                  </span>
                </div>
                <p className="text-xs mb-4" style=${{ color: "var(--drivex-silver)" }}>
                  После оформления продавец увидит выбранный способ получения, адрес доставки или самовывоз и комментарий покупателя.
                </p>
                <button
                  type="button"
                  className="w-full py-4 rounded-2xl font-bold text-lg"
                  style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
                  onClick=${() => {
                    if (!items.length) {
                      toast.push("Корзина пуста");
                      return;
                    }
                    if (!checkoutDraft.customerName.trim()) {
                      toast.push("Введите имя получателя");
                      return;
                    }
                    if (!checkoutDraft.customerPhone.trim()) {
                      toast.push("Введите телефон");
                      return;
                    }

                    const missingAddressStore = groupedItems.find(([storeId]) => {
                      const storeDraft = checkoutDraft.deliveryByStore?.[storeId];
                      return storeDraft?.deliveryMode === "delivery" && !String(storeDraft.address || "").trim();
                    });
                    if (missingAddressStore) {
                      const store = getMarketStore(missingAddressStore[0]);
                      toast.push(`Введите адрес доставки для ${store?.name || "магазина"}`);
                      return;
                    }

                    onCheckout && onCheckout(checkoutDraft);
                  }}
                >
                  Оформить заказ
                </button>
              </div>`
            : null}
        </div>
      </${SimplePage}>
    `;
  }

  // ── Экспорт в DX.screens ─────────────────────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.ServiceDetailScreen = ServiceDetailScreen;
  DX.screens.MarketStoreScreen = MarketStoreScreen;
  DX.screens.ProductDetailScreen = ProductDetailScreen;
  DX.screens.CategoryScreen = CategoryScreen;
  DX.screens.NotFoundScreen = NotFoundScreen;
  DX.screens.CartScreen = CartScreen;
})();


