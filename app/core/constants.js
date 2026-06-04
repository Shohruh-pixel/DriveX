// app/core/constants.js — All static constant data
(() => {
  'use strict';
  const DX = window.DX;

  const quickActions = [
    {
      icon: "wrench",
      label: "Ремонт",
      path: "/services",
      color: "var(--drivex-electric-blue)"
    },
    {
      icon: "car",
      label: "Мой гараж",
      path: "/garage",
      color: "var(--drivex-neon-cyan)"
    },
    {
      icon: "sos",
      label: "SOS помощь",
      path: "/emergency",
      color: "var(--drivex-danger)"
    },
    {
      icon: "bot",
      label: "AI помощник",
      path: "/ai-assistant",
      color: "var(--drivex-warning)"
    }
  ];

  const nearbyServices = [
    {
      id: 1,
      name: "АвтоМастер Премиум",
      type: "СТО общего ремонта",
      category: "СТО",
      city: "Худжанд",
      address: "пр-т Исмоили Сомони, 28",
      distance: "1.2 км",
      rating: 4.8,
      reviews: 234,
      price: "Честные цены",
      phone: "+992 92 777 21 10",
      workingHours: "08:00 — 20:00",
      boxesCount: 6,
      image:
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      available: true
    },
    {
      id: 2,
      name: "ШиноМонтаж 24/7",
      type: "Шиномонтаж",
      category: "Шиномонтаж",
      city: "Худжанд",
      address: "8 мкр, рядом с кольцом",
      distance: "0.8 км",
      rating: 4.9,
      reviews: 167,
      price: "Быстро и по записи",
      phone: "+992 93 555 44 00",
      workingHours: "Круглосуточно",
      boxesCount: 4,
      image:
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      available: true
    },
    {
      id: 3,
      name: "Detail Garage Premium",
      type: "Детейлинг",
      category: "Детейлинг",
      city: "Худжанд",
      address: "ул. Гагарина, 14",
      distance: "2.1 км",
      rating: 4.7,
      reviews: 445,
      price: "Премиум уход",
      phone: "+992 90 440 88 11",
      workingHours: "09:00 — 21:00",
      boxesCount: 3,
      image:
        "https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      available: true
    }
  ];

  let garageCars = [];
  let savedPlaces = [];

  // Живые данные из Supabase (перезаписываются после загрузки)
  let _liveNearbyServices = null;      // service_centers из Supabase
  let _liveRecommendedServices = null; // top-3 из service_centers
  let _liveMarketProducts = null;      // products из Supabase

  const vehicleDocumentKinds = [
    {
      id: "registration",
      title: "Техпаспорт",
      subtitle: "Свидетельство о регистрации",
      icon: "car",
      color: "var(--drivex-electric-blue)"
    },
    {
      id: "inspection",
      title: "Техосмотр",
      subtitle: "Фото диагностической карты",
      icon: "scan",
      color: "var(--drivex-warning)"
    }
  ];

  const maintenanceTypeOptions = [
    { id: "oil", title: "Замена масла" },
    { id: "filter", title: "Замена фильтра" },
    { id: "bearing", title: "Замена подшипника" },
    { id: "shock", title: "Замена амортизатора" },
    { id: "brakes", title: "Тормозные колодки" },
    { id: "tires", title: "Шины / сезон" },
    { id: "other", title: "Другое" }
  ];

  const mapFilters = [
    { id: "all", label: "Все", icon: "layers" },
    { id: "fuel", label: "АЗС", icon: "fuel" },
    { id: "wash", label: "Мойки", icon: "wash" },
    { id: "service", label: "СТО", icon: "wrench" },
    { id: "tire", label: "Шины", icon: "tire" },
    { id: "parking", label: "Парковки", icon: "parking" }
  ];

  const mapPoints = [
    { id: 1, type: "fuel", name: "Роснефть", distance: "500 м", rating: 4.5 },
    { id: 2, type: "wash", name: "Мойка 24/7", distance: "1.2 км", rating: 4.8 },
    {
      id: 3,
      type: "service",
      name: "СТО Премиум",
      distance: "2.3 км",
      rating: 4.9
    },
    { id: 4, type: "tire", name: "ШиноМонтаж", distance: "800 м", rating: 4.7 }
  ];

  const serviceCategories = [
    {
      id: "repair",
      name: "Ремонт авто",
      icon: "wrench",
      color: "var(--drivex-electric-blue)",
      count: "156 сервисов"
    },
    {
      id: "tire",
      name: "Шиномонтаж",
      icon: "tire",
      color: "var(--drivex-neon-cyan)",
      count: "89 сервисов"
    },
    {
      id: "wash",
      name: "Автомойка",
      icon: "wash",
      color: "#06b6d4",
      count: "203 сервиса"
    },
    {
      id: "diagnostics",
      name: "Диагностика",
      icon: "scan",
      color: "#f59e0b",
      count: "78 сервисов"
    },
    {
      id: "towing",
      name: "Эвакуатор",
      icon: "truck",
      color: "#ef4444",
      count: "45 сервисов"
    },
    {
      id: "detailing",
      name: "Детейлинг",
      icon: "sparkles",
      color: "#8b5cf6",
      count: "34 сервиса"
    }
  ];

  const serviceCategoryAliases = {
    repair: [
      "repair",
      "ремонт",
      "сто",
      "автосервис",
      "двигатель",
      "двигател",
      "ходовая",
      "электрика",
      "кузов"
    ],
    tire: ["tire", "tires", "шин", "шиномонтаж", "колес", "колёс"],
    wash: ["wash", "мойк", "автомойк", "мойка", "car wash"],
    diagnostics: ["diagnostic", "diagnostics", "диагност", "сканер", "ошибк"],
    towing: ["tow", "towing", "эвакуатор", "эваку", "буксир"],
    detailing: ["detailing", "детейл", "полиров", "химчист", "керамик", "уход"]
  };

  function normalizeServiceCategoryText(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function resolveServiceCategoryId(value = "") {
    const normalized = normalizeServiceCategoryText(value);
    if (!normalized) return "repair";
    const exactCategory = serviceCategories.find((category) => normalizeServiceCategoryText(category.id) === normalized);
    if (exactCategory) return exactCategory.id;
    const byName = serviceCategories.find((category) => normalizeServiceCategoryText(category.name) === normalized);
    if (byName) return byName.id;

    const match = Object.entries(serviceCategoryAliases).find(([, aliases]) =>
      aliases.some((alias) => normalized.includes(normalizeServiceCategoryText(alias)))
    );
    return match ? match[0] : "repair";
  }

  function getServiceCategoryMeta(value = "") {
    const categoryId = resolveServiceCategoryId(value);
    return serviceCategories.find((category) => category.id === categoryId) || serviceCategories[0];
  }

  const recommendedServices = [
    {
      id: 1,
      name: "АвтоМастер Премиум",
      category: "СТО",
      rating: 4.9,
      reviews: 234,
      distance: "1.2 км",
      price: "Честные цены",
      city: "Худжанд",
      address: "пр-т Исмоили Сомони, 28",
      phone: "+992 92 777 21 10",
      workingHours: "08:00 — 20:00",
      boxesCount: 6,
      image:
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      available: true
    },
    {
      id: 2,
      name: "ШиноМонтаж 24/7",
      category: "Шиномонтаж",
      rating: 4.8,
      reviews: 167,
      distance: "800 м",
      price: "Быстро и по записи",
      city: "Худжанд",
      address: "8 мкр, рядом с кольцом",
      phone: "+992 93 555 44 00",
      workingHours: "Круглосуточно",
      boxesCount: 4,
      image:
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      available: true
    },
    {
      id: 3,
      name: "Detail Garage Premium",
      category: "Детейлинг",
      rating: 4.7,
      reviews: 445,
      distance: "2.1 км",
      price: "Премиум уход",
      city: "Худжанд",
      address: "ул. Гагарина, 14",
      phone: "+992 90 440 88 11",
      workingHours: "09:00 — 21:00",
      boxesCount: 3,
      image:
        "https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      available: true
    }
  ];

  const serviceShowcaseProfiles = {
    "1": {
      honestPriceScore: 94,
      speedScore: 89,
      reviewScore: 92,
      repeatClientsPercent: 68,
      premiumScore: 91,
      suitableBrands: ["BMW", "Toyota", "Lexus", "Hyundai"],
      completedCars: 2840,
      averageRepairTime: "1.8 ч",
      tagline: "Точная диагностика, понятная смета и быстрый выпуск машины.",
      description:
        "Современное СТО с прозрачной сметой, фотофиксацией и быстрым ремонтом без лишних допродаж.",
      gallery: [
        "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
        "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
        "https://images.unsplash.com/photo-1493238792000-8113da705763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      ],
      videoPoster:
        "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      videoUrl: "https://www.youtube.com/results?search_query=auto+service+tour",
      masters: [
        {
          id: "service-master-1-1",
          name: "Фарход Азимов",
          role: "Мастер-приемщик",
          experience: "9 лет",
          specialty: "Диагностика и ходовая"
        },
        {
          id: "service-master-1-2",
          name: "Сухроб Каримов",
          role: "Старший механик",
          experience: "12 лет",
          specialty: "Тормоза и плановое ТО"
        }
      ]
    },
    "2": {
      honestPriceScore: 88,
      speedScore: 97,
      reviewScore: 89,
      repeatClientsPercent: 61,
      premiumScore: 78,
      suitableBrands: ["Toyota", "Kia", "Chevrolet", "Hyundai"],
      completedCars: 4120,
      averageRepairTime: "38 мин",
      tagline: "Молниеносный шиномонтаж и запись без очередей.",
      description:
        "Экспресс-сервис по шинам и сезонным работам. Быстрая запись, ночные смены и понятные цены.",
      gallery: [
        "https://images.unsplash.com/photo-1613214149922-f1809c99b414?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
        "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      ],
      videoPoster:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      videoUrl: "https://www.youtube.com/results?search_query=tire+service+tour",
      masters: [
        {
          id: "service-master-2-1",
          name: "Бобур Рахмонов",
          role: "Шиномонтажник",
          experience: "7 лет",
          specialty: "Балансировка и сезонная смена"
        },
        {
          id: "service-master-2-2",
          name: "Шерзод Набиев",
          role: "Мастер смены",
          experience: "10 лет",
          specialty: "Диски и вулканизация"
        }
      ]
    },
    "3": {
      honestPriceScore: 74,
      speedScore: 83,
      reviewScore: 95,
      repeatClientsPercent: 73,
      premiumScore: 98,
      suitableBrands: ["BMW", "Mercedes", "Lexus", "Toyota"],
      completedCars: 1260,
      averageRepairTime: "4.5 ч",
      tagline: "Детейлинг и премиальный уход с фотоконтролем до и после.",
      description:
        "Премиальный сервис с реальными фото зоны работы, детейлингом, химчисткой и защитными покрытиями.",
      gallery: [
        "https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
        "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
      ],
      videoPoster:
        "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
      videoUrl: "https://www.youtube.com/results?search_query=detailing+studio+tour",
      masters: [
        {
          id: "service-master-3-1",
          name: "Рустам Назаров",
          role: "Lead detailer",
          experience: "11 лет",
          specialty: "Полировка и керамика"
        },
        {
          id: "service-master-3-2",
          name: "Алишер Холиков",
          role: "Интерьер мастер",
          experience: "8 лет",
          specialty: "Химчистка и уход за салоном"
        }
      ]
    }
  };

  const marketCategories = [
    { id: "all", name: "Все", icon: "layers", color: "var(--drivex-neon-cyan)" },
    { id: "tires", name: "Шины", icon: "tire", color: "var(--drivex-electric-blue)" },
    { id: "oil", name: "Масла", icon: "fuel", color: "var(--drivex-warning)" },
    { id: "battery", name: "АКБ", icon: "battery", color: "var(--drivex-success)" },
    { id: "parts", name: "Запчасти", icon: "wrench", color: "var(--drivex-bright-cyan)" },
    { id: "accessories", name: "Аксессуары", icon: "sparkles", color: "var(--drivex-neon-cyan)" }
  ];

  const marketFeedFilters = [
    { id: "all", label: "Все", color: "var(--drivex-silver)" },
    { id: "discounted", label: "Со скидкой", color: "var(--drivex-danger)" },
    { id: "popular", label: "Популярные", color: "var(--drivex-warning)" }
  ];

  const sellerPrimaryStoreId = "auto-parts-khujand";

  const sellerNavigationItems = [
    { id: "dashboard", label: "Дашборд", path: "/seller/dashboard", icon: "layers" },
    { id: "products", label: "Товары", path: "/seller/products", icon: "bag" },
    { id: "orders", label: "Заказы", path: "/seller/orders", icon: "folder" },
    { id: "store", label: "Магазин", path: "/seller/store", icon: "settings" }
  ];

  const sellerProductStatusOptions = [
    { id: "active", label: "Активен", color: "var(--drivex-success)" },
    { id: "draft", label: "Черновик", color: "var(--drivex-warning)" },
    { id: "archived", label: "Архив", color: "var(--drivex-silver)" }
  ];

  const sellerOrderStatusOptions = [
    { id: "new", label: "Новый", color: "var(--drivex-warning)" },
    { id: "confirmed", label: "Подтвержден", color: "var(--drivex-electric-blue)" },
    { id: "pickup_ready", label: "Готов к выдаче", color: "var(--drivex-electric-blue)" },
    { id: "delivery", label: "В доставке", color: "var(--drivex-neon-cyan)" },
    { id: "completed", label: "Завершен", color: "var(--drivex-success)" },
    { id: "cancelled", label: "Отменен", color: "var(--drivex-danger)" }
  ];

  const buyerOrderStatusOptions = [
    { id: "new", label: "Новый", color: "var(--drivex-warning)", note: "Заказ отправлен продавцу" },
    {
      id: "confirmed",
      label: "Подтвержден",
      color: "var(--drivex-electric-blue)",
      note: "Продавец подтвердил заказ"
    },
    {
      id: "pickup_ready",
      label: "Готов к выдаче",
      color: "var(--drivex-electric-blue)",
      note: "Можно забирать в магазине"
    },
    { id: "delivery", label: "В доставке", color: "var(--drivex-neon-cyan)", note: "Заказ уже в пути" },
    { id: "completed", label: "Завершен", color: "var(--drivex-success)", note: "Заказ успешно завершён" },
    { id: "cancelled", label: "Отменен", color: "var(--drivex-danger)", note: "Заказ отменён продавцом" }
  ];

  const sellerStoreCategoryOptions = [
    "Автозапчасти",
    "Масла и жидкости",
    "Шины",
    "АКБ",
    "Аксессуары",
    "Автосервис",
    "Для грузовых авто"
  ];

  const sellerBusinessTypeOptions = [
    "Только самовывоз",
    "Доставка и самовывоз",
    "Только доставка",
    "Оптовая и розничная продажа"
  ];

  const servicePrimaryCenterId = "service-hub-khujand";

  const serviceCrmNavigationItems = [
    { id: "dashboard", label: "Дашборд", path: "/service-crm/dashboard", icon: "layers" },
    { id: "clients", label: "Клиенты", path: "/service-crm/clients", icon: "user" },
    { id: "orders", label: "Ремонты", path: "/service-crm/orders", icon: "wrench" },
    { id: "parts", label: "Склад", path: "/service-crm/parts", icon: "bag" },
    { id: "finance", label: "Финансы", path: "/service-crm/finance", icon: "card" },
    { id: "schedule", label: "Запись", path: "/service-crm/schedule", icon: "calendar" },
    { id: "settings", label: "Сервис", path: "/service-crm/settings", icon: "settings" }
  ];

  const serviceCenterTypeOptions = [
    "СТО общего ремонта",
    "Экспресс-ТО",
    "Диагностика",
    "Электрика",
    "Шиномонтаж",
    "Кузовной ремонт",
    "Детейлинг"
  ];

  const serviceRepairStatusOptions = [
    { id: "queued", label: "В очереди", color: "var(--drivex-warning)" },
    { id: "progress", label: "В работе", color: "var(--drivex-neon-cyan)" },
    { id: "ready", label: "Готов", color: "var(--drivex-success)" }
  ];

  const serviceRequestStatusOptions = [
    { id: "accepted", label: "Приняли", color: "var(--drivex-warning)" },
    { id: "progress", label: "В работе", color: "var(--drivex-electric-blue)" },
    { id: "ready", label: "Готово", color: "var(--drivex-success)" }
  ];

  const serviceAppointmentStatusOptions = [
    { id: "free", label: "Свободно", color: "var(--drivex-success)" },
    { id: "booked", label: "Запись", color: "var(--drivex-electric-blue)" },
    { id: "busy", label: "Занято", color: "var(--drivex-warning)" }
  ];

  const marketStores = [
    {
      id: "auto-parts-khujand",
      name: "AutoParts Khujand",
      city: "Худжанд",
      deliveryAvailable: true,
      deliveryLabel: "Сегодня по Худжанду",
      deliveryNote: "Курьер по Худжанду и отправка по Согду",
      rating: 4.8,
      reviews: 842,
      avatar: "AK",
      accent: "var(--drivex-electric-blue)",
      tagline: "Шины, колодки, фильтры и ходовая",
      pickup: "8 мкр, Худжанд"
    },
    {
      id: "oil-center-dushanbe",
      name: "Oil Center Dushanbe",
      city: "Душанбе",
      deliveryAvailable: true,
      deliveryLabel: "Сегодня по Душанбе",
      deliveryNote: "Экспресс-доставка масел и комплектов ТО",
      rating: 4.7,
      reviews: 1164,
      avatar: "OD",
      accent: "var(--drivex-warning)",
      tagline: "Оригинальные масла, фильтры и расходники",
      pickup: "ул. Айни, Душанбе"
    },
    {
      id: "battery-hub-sughd",
      name: "Battery Hub Sughd",
      city: "Худжанд",
      deliveryAvailable: false,
      deliveryLabel: "Самовывоз",
      deliveryNote: "АКБ, электрика и аксессуары с самовывозом в Худжанде",
      rating: 4.6,
      reviews: 593,
      avatar: "BS",
      accent: "var(--drivex-success)",
      tagline: "Аккумуляторы, зарядка и автоаксессуары",
      pickup: "ул. Гагарина, Худжанд"
    }
  ].map((store) => ({
    ...store,
    delivery: store.deliveryAvailable ? "yes" : "pickup",
    logo: store.avatar,
    description: `${store.tagline}. ${store.deliveryNote}`
  }));
  // Export all constants to DX namespace
  DX.quickActions = quickActions;
  DX.nearbyServices = nearbyServices;
  DX.vehicleDocumentKinds = vehicleDocumentKinds;
  DX.maintenanceTypeOptions = maintenanceTypeOptions;
  DX.mapFilters = mapFilters;
  DX.mapPoints = mapPoints;
  DX.serviceCategories = serviceCategories;
  DX.serviceCategoryAliases = serviceCategoryAliases;
  DX.normalizeServiceCategoryText = normalizeServiceCategoryText;
  DX.resolveServiceCategoryId = resolveServiceCategoryId;
  DX.getServiceCategoryMeta = getServiceCategoryMeta;
  DX.recommendedServices = recommendedServices;
  DX.serviceShowcaseProfiles = serviceShowcaseProfiles;
  DX.marketCategories = marketCategories;
  DX.marketFeedFilters = marketFeedFilters;
  DX.sellerPrimaryStoreId = sellerPrimaryStoreId;
  DX.sellerNavigationItems = sellerNavigationItems;
  DX.sellerProductStatusOptions = sellerProductStatusOptions;
  DX.sellerOrderStatusOptions = sellerOrderStatusOptions;
  DX.buyerOrderStatusOptions = buyerOrderStatusOptions;
  DX.sellerStoreCategoryOptions = sellerStoreCategoryOptions;
  DX.sellerBusinessTypeOptions = sellerBusinessTypeOptions;
  DX.servicePrimaryCenterId = servicePrimaryCenterId;
  DX.serviceCrmNavigationItems = serviceCrmNavigationItems;
  DX.serviceCenterTypeOptions = serviceCenterTypeOptions;
  DX.serviceRepairStatusOptions = serviceRepairStatusOptions;
  DX.serviceRequestStatusOptions = serviceRequestStatusOptions;
  DX.serviceAppointmentStatusOptions = serviceAppointmentStatusOptions;
  DX.marketStores = marketStores;
})();
