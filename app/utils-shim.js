// app/utils-shim.js вЂ” РіР»РѕР±Р°Р»СЊРЅС‹Рµ РіРµС‚С‚РµСЂС‹ РґР»СЏ С„СѓРЅРєС†РёР№ РёР· DX
// Р—Р°РіСЂСѓР¶Р°РµС‚СЃСЏ РџРћРЎР›Р• utils-models.js, Р”Рћ screen С„Р°Р№Р»РѕРІ
// Р”РµР»Р°РµС‚ DX-С„СѓРЅРєС†РёРё РґРѕСЃС‚СѓРїРЅС‹РјРё РєР°Рє bare names РІ Р»СЋР±РѕРј С„Р°Р№Р»Рµ
(function() {
  var ALL_FNS = [
    // Utility
    'alphaBg','formatTjsPrice','pluralize','genId','slugifyText','toLocalISODate','parseISODate',
    'normalizePath','decodeRouteSegment','encodeRouteSegment','getBuyerOrderChatPath',
    'navigateToHash','useHashPath','daysUntil','formatRuDate','formatChatTime',
    'formatPrice','getMarketProductPath','getMarketStorePath','getMarketCartPath',
    'getMarketBadgeColor','getMarketDiscountPercent',

    // Service directory
    'decorateServiceRecord','dedupeServicesById','getPersonalizedServices',
    'buildServiceDirectoryData','createCatalogServiceFromCenter',
    'normalizeServiceCategoryText','getServiceCategoryMeta','resolveServiceCategoryId','getServiceImageRenderKey',
    'buildBuyerServiceNotifications','normalizeServiceCenter','clampServiceMetric',
    'estimateServiceDurationMinutes','normalizeServiceBrands','getServiceBookingPath',

    // Documents
    'prepareDocumentDataUrl','prepareAvatarDataUrl',

    // Garage / car
    'findGarageCar','normalizeGarageCar','normalizeGarageList','ensureCarId',
    'buildSmartCareTasks','normalizeMaintenanceRecord','countMaintenanceRecords',
    'getMaintenanceCarState','getMaintenanceSpentTotal','normalizeSavedPlace',

    // Buyer models
    'normalizeBuyerSession','normalizeBuyerProfile','createDefaultBuyerProfile',
    'buyerSessionToProfile','makeBuyerSessionFromSupabaseUser','makeBuyerSessionFromLocalUser',
    'makeBuyerId','normalizeSavedPlacesList','normalizeFavorite','normalizeFavoritesList',
    'readBuyerLocalStorage','writeBuyerLocalStorage','readLocalBuyerUsers','writeLocalBuyerUsers',
    'getBuyerLocalStorageKey','clearBuyerLocalStorageForSession',
    'fetchProfileFromSupabase','syncProfileToSupabase','uploadAvatarToStorage',
    'normalizeSidedDoc','getSidedDocPage','getSidedDocCount',
    'normalizeBuyerOrder','normalizeBuyerOrdersList','getBuyerOrderStatusMeta',

    // Marketplace
    'normalizeMarketProductId','getMarketProduct','getMarketProductsByStore','getMarketStore',
    'getRelatedMarketProducts','filterMarketProducts','normalizeMarketSearchText',
    'buildMarketplaceRuntimeData','setMarketplaceRuntime',
    'parseMarketCartKey','createMarketCartKey',
    'marketFavoritesStore','marketRatingsStore',
    'useMarketFavorites','getMarketFavoriteKey','getMarketFavoriteProducts',
    'useMarketRatings','getMarketProductRating','getMarketStoreRating',
    'normalizeProductCompatibility','productMatchesCar','getMarketProductQuestionThreadId','getMarketStoreRating',
    'normalizeProductCompatibility','productMatchesCar','getMarketStoreRating',
    'createMarketplaceCheckoutDraft','syncMarketplaceCheckoutDraft','normalizeMarketplaceOrder',
    'normalizeMarketplaceOrdersList','normalizeMarketCheckoutDraft',

    // Chat / orders
    'getOrderChatThread','getOrderChatLastMessage','getOrderChatPreviewText','getOrderChatUnreadCount',
    'getSellerOrderChatPath','formatOrderShortId',

    // Referrals («Пригласи друга»)
    'getBuyerReferralCode','normalizeReferralCode','normalizeReferralRecord',
    'normalizeReferralsList','computeReferralStats',

    // Поездки (GPS-трекер)
    'tripHaversineKm','computeTripStats','normalizeTrip','normalizeTripsList',
    'summarizeTrips','estimateTripFuel','estimateTripCost',
    'getFuelType','estimateTripConsumption',

    // Seller models
    'createDefaultSellerSession','createFreshSellerSession',
    'normalizeSellerSession','normalizeSellerStore','normalizeSellerProfile','normalizeSellerProduct',
    'normalizeSellerOrdersList','normalizeSellerNotificationsList',
    'resolveSellerBackendSnapshot','persistSellerFrontendSnapshot',
    'getSellerSetupState','buildSellerDashboardStats','resolveSellerProductsState',
    'createSellerStoreSeed','createPendingSellerStoreId','createSellerProductFormState',
    'createSellerStoreFormState','isSellerRole','isPickupSellerOrder',
    'getSellerOrderStatusMeta','getSellerOrderActions',

    // Service CRM models
    'createDefaultServiceSession','createFreshServiceSession',
    'normalizeServiceSession','normalizeServiceProfile',
    'normalizeTjPhoneInput','isCompleteTjPhone',
    'normalizeServiceClient','normalizeServiceClientsList','isDemoServiceClient',
    'normalizeServiceRepairOrder','normalizeServiceRepairOrdersList','isDemoServiceOrder',
    'normalizeServiceInventoryItem','normalizeServiceInventoryList','isDemoServiceInventoryItem',
    'normalizeServiceFinanceEntry','normalizeServiceFinanceList','isDemoServiceFinanceEntry',
    'normalizeServiceAppointment','normalizeServiceAppointmentsList','isDemoServiceAppointment',
    'normalizeServiceRequest','normalizeServiceRequestsList','normalizeServiceRequestStatusId',
    'getServiceRepairStatusMeta','getServiceAppointmentStatusMeta','getServiceRequestStatusMeta',
    'getServiceRepairActions','buildServiceDashboardStats','buildServiceFinanceSummary',
    'countServiceVehicles','buildServiceBookingSlotOptions','buildServiceScheduleSlots',
    'parseClockMinutes','formatClockMinutes','addMinutesToClock','getFutureLocalISODate',
    'getServiceBoxesCount','parseServiceWorkingHoursRange','createServiceOrderCode',
    'upsertServiceClientFromBooking','createServiceVehicleSnapshot',
    'persistServiceCenterToLocalStorage','getLatestPersistedServiceCenter',
    'serializeServiceCenterForStorage','normalizeServiceImageAsset',
    'normalizeServiceGalleryList','normalizeServiceVideoUrl','normalizeServiceCenter',
    'createServiceCenterSeed','createServiceCenterFormState','createServiceRegistrationDraft',
    'normalizeServiceBrands',

    // Auth / Supabase
    'getSupabaseClient','getBuyerAuthStatus',
    'fetchSharedAppState','fetchBuyerAppState','saveBuyerAppState',
    'applySharedStateSnapshot','saveServiceCenter','upsertServiceCenterToServer',
    'loadSharedServiceCenters',

    // Additional utility functions
    'appendOrderChatMessage',
    'applySellerOrderStatus',
    'canTransitionSellerOrder',
    'canUseIndexedDbStorage',
    'clearSellerPendingRoute',
    'compactSellerProductForSync',
    'compactSellerProductsForSync',
    'countDocumentsState',
    'createBuyerOrdersFromCheckout',
    'createDefaultServiceAuthState',
    'createEmptyBuyerSession',
    'createEmptyDocumentsState',
    'createEmptyMaintenanceState',
    'createGeneratedMarketProductId',
    'createSellerNotifications',
    'createSellerOrdersFromCart',
    'createSellerProductsSeed',
    'createSellerProfileSeed',
    'createSellerRegistrationDraft',
    'createServiceProfileSeed',
    'deriveBrandFromTitle',
    'extractServiceCenterMedia',
    'fetchSharedServiceCenters',
    'formatServiceAverageTime',
    'getAllowedSellerOrderStatuses',
    'getAllowedSellerOrderStatusIds',
    'getHashPath',
    'getOrderChatPeerLabel',
    'getOrderChatSenderLabel',
    'getOrderTimelineCompactLabel',
    'getOrderTimelineStepIds',
    'getOrderTimelineSteps',
    'getSellerFallbackProductImage',
    'getSellerNotificationMeta',
    'getSellerProductById',
    'getSellerProductCategoryMeta',
    'getSellerProductStatusMeta',
    'getSellerSetupChecklist',
    'getServiceCenterMediaStorageKey',
    'getServicePrimaryBadges',
    'isImageDataUrl',
    'mapRepairStatusToServiceRequestStatus',
    'mapSellerProductToMarketplaceProduct',
    'mapSellerStoreToMarketplaceStore',
    'markOrderChatAsRead',
    'mergeBuyerOrders',
    'mergeSellerNotifications',
    'mergeServiceCenterList',
    'navigateToAppRoute',
    'normalizeDocumentItem',
    'normalizeInspection',
    'normalizeMarketplacePartnerCatalog',
    'normalizeMarketplacePartnerProduct',
    'normalizeOrderChatMessage',
    'normalizeOrderChatMessagesList',
    'normalizeOrderChatsMap',
    'normalizeOrderChatThread',
    'normalizeSellerNotification',
    'normalizeSellerOrder',
    'normalizeSellerProductsList',
    'normalizeServiceAuthState',
    'openDrivexMediaDatabase',
    'OrderStatusTimeline',
    'pickServiceBookingBox',
    'readDrivexMediaValue',
    'readSellerPendingRoute',
    'saveSharedServiceCenter',
    'syncBuyerOrdersWithSellerOrders',
    'useToast',
    'writeDrivexMediaValue',

    // Seller + SimplePage components
    'SimplePage',
    'SellerLogo',
    'SellerField',
    'SellerInput',
    'SellerSelect',
    'SellerTextarea',
    'SellerMetricCard',
    'SellerLayout',

    // React.memo components
    'MemoProductCard',

    // Booking + Memo components
    'ServicePhoneButton',
    'ServiceStatusChip',
    'ServiceLayout',
    'MemoProductGrid',
    'RecommendedServicesScreen',
    'ServiceShowcaseScreen',
    'ServiceCatalogScreen',
    'OrderChatSummaryCard',
    'OrderChatScreen',

    // Services/Dashboard components
    'BuyerAuthScreen',
    'CarDocumentsScreen',
    'CartBadge',
    'CategoryRow',
    'DashboardScreen',
    'DocumentsVaultScreen',
    'LicenseDocumentScreen',
    'MapScreen',
    'MarketAppNav',
    'MarketAutoPickerScreen',
    'MarketCatalogScreen',
    'MarketOrdersScreen',
    'MarketplacePage',
    'MarketScreen',
    'MarketSectionTitle',
    'MarketStoreAvatar',
    'MarketTopBar',
    'ProductCard',
    'ProductGrid',
    'ProfileScreen',
    'PromoBanner',
    'SearchBar',
    'ServiceRequestStatusTimeline',
    'ServicesScreen',
    'StoreLabel',

    // Garage + Misc components
    'GarageScreen',
    'InspectionScreen',
    'MaintenanceAddScreen',
    'MaintenanceScreen',
    'OrdersScreen',
    'SavedLocationsScreen',
    'SmartCareScreen',
    'TripsScreen',

    // Shared-UI + Misc components
    'SmartDashboard',
    'NumberTicker',
    'AIAssistantScreen',
    'AIAssistCard',
    'AIChip',
    'AIPremiumAIMessage',
    'AIPremiumEmptyState',
    'AIPremiumHeader',
    'AIPremiumInputBar',
    'AIPremiumSuggestionCard',
    'AIPremiumSuggestionChip',
    'AIPremiumThinkingCard',
    'AIPremiumUserMessage',
    'AIQuickActionCard',
    'AIResponseCard',
    'BackHeader',
    'PlaceholderPage',
    'ToastProvider',
    'buildDashboardMaintenanceFeed',
    'buildWeatherUrl',
    'getContextDashboardStatus',
    'getMarketingDashboardStatus',
    'getMonthlySavings',
    'getMorningCommuteMinutes',
    'getServiceDashboardStatus',
    'getWeatherDashboardStatus',
    'normalizeWeatherPayload',
    'parseMileageLabel',
    'sortByDateDesc',
    'ServiceBookingScreen',
    'BookingSlotPickerScreen',
    'NotificationsScreen',
    'SettingsScreen',
    'ProfileSecurityScreen',
    'ProfileEditScreen',
    'HelpScreen',
    'PaymentDataScreen',
    'BonusProgramScreen',
    'InviteFriendsScreen',

    // Booking service
    'getServicePhoneHref','buildServiceScheduleSlots','buildServiceBookingSlotOptions',

    // App helpers
    'runSellerBackendAction','loadSellerBackendAppState','saveSharedAppState',
    'writeSellerPendingRoute','createSellerOrdersSeed',
    'createServiceClientsSeed','createServiceOrdersSeed','createServiceInventorySeed',
    'createServiceFinanceSeed','createServiceAppointmentsSeed'
  ];

  var CONSTS = [
    'marketFeedFilters',
    'marketplaceBaseData',
    'marketplaceRuntime',
    'marketStores',
    'products',
    'sellerBusinessTypeOptions',
    'sellerNavigationItems',
    'sellerOrderStatusOptions',
    'sellerStoreCategoryOptions',
    'serviceCenterTypeOptions',
    'serviceCrmNavigationItems',
    'ToastContext',
    'marketplaceData','drivexStorageKeys','drivexSyncChannelName',
    'serviceShowcaseProfiles','serviceCategories','serviceCategoryAliases',
    'vehicleDocumentKinds','maintenanceTypeOptions','quickActions',
    'nearbyServices','recommendedServices','marketCategories','mapFilters','mapPoints',
    'sellerProductStatusOptions','buyerOrderStatusOptions',
    'serviceRepairStatusOptions','serviceAppointmentStatusOptions','serviceRequestStatusOptions',
    'sellerPrimaryStoreId','servicePrimaryCenterId',
    'baseNotificationsCount','drivexMediaDbName','drivexMediaStoreName',
    'liveSharedAppStateKeys','buyerPersonalStorageKeys'
  ];

  // РЎРѕР·РґР°С‘Рј РіР»РѕР±Р°Р»СЊРЅС‹Рµ РіРµС‚С‚РµСЂС‹
  ALL_FNS.concat(CONSTS).forEach(function(name) {
    try {
      Object.defineProperty(window, name, {
        get: function() { return window.DX ? window.DX[name] : undefined; },
        configurable: true,
        enumerable: false
      });
    } catch(e) { /* СѓР¶Рµ РѕРїСЂРµРґРµР»С‘РЅ вЂ” РёРіРЅРѕСЂРёСЂСѓРµРј */ }
  });

  // Mutable live refs (garageCars/savedPlaces РѕР±РЅРѕРІР»СЏСЋС‚СЃСЏ App())
  try {
    Object.defineProperty(window, 'garageCars', {
      get: function() { return window.DX && window.DX._garageCarsRef ? window.DX._garageCarsRef.val : []; },
      configurable: true, enumerable: false
    });
  } catch(e) {}
  try {
    Object.defineProperty(window, 'savedPlaces', {
      get: function() { return window.DX && window.DX._savedPlacesRef ? window.DX._savedPlacesRef.val : []; },
      configurable: true, enumerable: false
    });
  } catch(e) {}


  // Live Supabase data vars (null по умолчанию, обновляются App())
  ['_liveNearbyServices','_liveRecommendedServices','_liveMarketProducts'].forEach(function(name) {
    try {
      Object.defineProperty(window, name, {
        get: function() { return window.DX ? window.DX[name] : null; },
        set: function(v) { if (window.DX) window.DX[name] = v; },
        configurable: true, enumerable: false
      });
    } catch(e) {}
  });
})();










