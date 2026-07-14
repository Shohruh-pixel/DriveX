// app/data.js — Статические данные DRIVEX (сервисы, товары, магазины)
(() => {
  'use strict';
  window.DX = window.DX || {};
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

  // Каталог сервисов — только реальные центры: зарегистрированные через
  // Service CRM (/api/service-centers) и записи из Supabase service_centers.
  // Выдуманные «АвтоМастер Премиум» и т.п. с фейковыми рейтингами удалены.
  const nearbyServices = [];

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

  // Точки карты — только реальные центры каталога; выдуманные POI удалены.
  const mapPoints = [];

  const serviceCategories = [
    // count не выдумываем — UI считает реальное число сервисов в категории
    {
      id: "repair",
      name: "Ремонт авто",
      icon: "wrench",
      color: "var(--drivex-electric-blue)",
      count: ""
    },
    {
      id: "tire",
      name: "Шиномонтаж",
      icon: "tire",
      color: "var(--drivex-neon-cyan)",
      count: ""
    },
    {
      id: "wash",
      name: "Автомойка",
      icon: "wash",
      color: "var(--drivex-neon-cyan)",
      count: ""
    },
    {
      id: "diagnostics",
      name: "Диагностика",
      icon: "scan",
      color: "var(--drivex-warning)",
      count: ""
    },
    {
      id: "towing",
      name: "Эвакуатор",
      icon: "truck",
      color: "var(--drivex-danger)",
      count: ""
    },
    {
      id: "detailing",
      name: "Детейлинг",
      icon: "sparkles",
      color: "#8b5cf6",
      count: ""
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

  // Рекомендации — из реальных центров (Supabase top-3 / CRM); фейк-сид удалён.
  const recommendedServices = [];

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
    { id: "requests", label: "Заявки", path: "/service-crm/requests", icon: "bell" },
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

  // Честный жизненный цикл заявки: сервис ДОЛЖЕН подтвердить запись.
  // «declined» вне линейного таймлайна — см. serviceRequestDeclinedMeta.
  const serviceRequestStatusOptions = [
    { id: "new", label: "Отправлена", color: "var(--drivex-warning)" },
    { id: "accepted", label: "Подтверждена", color: "var(--drivex-electric-blue)" },
    { id: "progress", label: "В работе", color: "var(--drivex-neon-cyan)" },
    { id: "ready", label: "Готово", color: "var(--drivex-success)" }
  ];

  const serviceRequestDeclinedMeta = {
    id: "declined",
    label: "Отклонена",
    color: "var(--drivex-danger)"
  };

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

  const products = [
    {
      id: 1,
      storeId: "auto-parts-khujand",
      name: "Michelin Pilot Sport 4 225/45 R17",
      categoryId: "tires",
      category: "Шины",
      price: 2480,
      oldPrice: 2860,
      rating: 4.9,
      reviews: 126,
      image: "./assets/marketplace/tire-psf.png",
      inStock: true,
      delivery: "Сегодня по Худжанду",
      badge: "Хит продаж",
      unitLabel: "за 1 шт.",
      description: "Летняя шина премиум-класса с точным управлением и коротким тормозным путём.",
      specs: ["Летняя", "225/45 R17", "Индекс скорости Y"]
    },
    {
      id: 2,
      storeId: "auto-parts-khujand",
      name: "Triangle TH201 205/55 R16",
      categoryId: "tires",
      category: "Шины",
      price: 985,
      oldPrice: 1120,
      rating: 4.7,
      reviews: 88,
      image: "./assets/marketplace/tire-brand-new.jpg",
      inStock: true,
      delivery: "1 день по Согду",
      badge: "Скидка -12%",
      unitLabel: "за 1 шт.",
      description: "Практичная летняя шина для городских поездок и трассы.",
      specs: ["Летняя", "205/55 R16", "Усиленный борт"]
    },
    {
      id: 3,
      storeId: "auto-parts-khujand",
      name: "Brembo тормозные колодки передние",
      categoryId: "parts",
      category: "Запчасти",
      price: 365,
      oldPrice: null,
      rating: 4.8,
      reviews: 54,
      image: "./assets/marketplace/automobile-brake-pad.jpg",
      inStock: true,
      delivery: "Сегодня по Худжанду",
      badge: "Надёжный выбор",
      unitLabel: "комплект",
      description: "Передние колодки для ежедневной эксплуатации с уверенным торможением.",
      specs: ["Передняя ось", "Низкий шум", "Город / трасса"]
    },
    {
      id: 4,
      storeId: "auto-parts-khujand",
      name: "Салонный фильтр Bosch",
      categoryId: "parts",
      category: "Запчасти",
      price: 95,
      oldPrice: null,
      rating: 4.7,
      reviews: 39,
      image: "./assets/marketplace/cabin-filter.jpg",
      inStock: true,
      delivery: "Завтра",
      badge: "Быстрый заказ",
      unitLabel: "за 1 шт.",
      description: "Салонный фильтр для чистого воздуха и защиты системы климат-контроля.",
      specs: ["Угольный слой", "Быстрая замена", "Городской режим"]
    },
    {
      id: 5,
      storeId: "auto-parts-khujand",
      name: "Амортизатор KYB Excel-G",
      categoryId: "parts",
      category: "Запчасти",
      price: 620,
      oldPrice: 690,
      rating: 4.8,
      reviews: 47,
      image: "./assets/marketplace/shock-absorber.jpg",
      inStock: true,
      delivery: "1–2 дня",
      badge: "Скидка",
      unitLabel: "за 1 шт.",
      description: "Газомасляный амортизатор для стабильной подвески и комфортной езды.",
      specs: ["Excel-G", "Газомасляный", "Передняя / задняя ось"]
    },
    {
      id: 6,
      storeId: "oil-center-dushanbe",
      name: "Shell Helix Ultra 5W-40 4L",
      categoryId: "oil",
      category: "Масла",
      price: 430,
      oldPrice: 495,
      rating: 4.9,
      reviews: 214,
      image: "./assets/marketplace/shell-helix-ultra-5w40.jpg",
      inStock: true,
      delivery: "Сегодня по Душанбе",
      badge: "Весенняя цена",
      unitLabel: "4 литра",
      description: "Полностью синтетическое моторное масло для современных бензиновых и дизельных двигателей.",
      specs: ["5W-40", "Синтетика", "4 л"]
    },
    {
      id: 7,
      storeId: "oil-center-dushanbe",
      name: "Mannol 10W-40 4L",
      categoryId: "oil",
      category: "Масла",
      price: 285,
      oldPrice: 329,
      rating: 4.7,
      reviews: 131,
      image: "./assets/marketplace/motor-oil-generic.jpg",
      inStock: true,
      delivery: "Сегодня по Душанбе",
      badge: "Скидка -13%",
      unitLabel: "4 литра",
      description: "Оптимальный вариант для городского режима и регулярного ТО.",
      specs: ["10W-40", "Полусинтетика", "API SN/CF"]
    },
    {
      id: 8,
      storeId: "oil-center-dushanbe",
      name: "LIQUI MOLY Top Tec 4200 5W-30",
      categoryId: "oil",
      category: "Масла",
      price: 560,
      oldPrice: null,
      rating: 4.9,
      reviews: 69,
      image: "./assets/marketplace/liqui-moly-top-tec-4200-5w30.png",
      inStock: true,
      delivery: "Завтра",
      badge: "Премиум",
      unitLabel: "5 литров",
      description: "Премиальное масло с защитой от отложений и стабильной вязкостью.",
      specs: ["5W-30", "Longlife", "5 л"]
    },
    {
      id: 9,
      storeId: "oil-center-dushanbe",
      name: "Масляный фильтр MANN W 67/1",
      categoryId: "parts",
      category: "Запчасти",
      price: 78,
      oldPrice: null,
      rating: 4.8,
      reviews: 154,
      image: "./assets/marketplace/mann-w67-1.png",
      inStock: true,
      delivery: "Сегодня по Душанбе",
      badge: "Для ТО",
      unitLabel: "за 1 шт.",
      description: "Фильтр для быстрой замены масла с надёжной фильтрацией частиц.",
      specs: ["Оригинальный размер", "Для ТО", "Быстрая установка"]
    },
    {
      id: 10,
      storeId: "oil-center-dushanbe",
      name: "Набор для ТО: масло + фильтр",
      categoryId: "oil",
      category: "Масла",
      price: 498,
      oldPrice: 575,
      rating: 4.9,
      reviews: 97,
      image: "./assets/marketplace/motor-oil-shelf.jpg",
      inStock: true,
      delivery: "Сегодня по Душанбе",
      badge: "Комплект",
      unitLabel: "набор",
      description: "Готовый комплект для ТО: масло и фильтр в одной покупке.",
      specs: ["Экономия до 13%", "Для регулярного ТО", "Готово к установке"]
    },
    {
      id: 11,
      storeId: "battery-hub-sughd",
      name: "Bosch S5 74Ah",
      categoryId: "battery",
      category: "АКБ",
      price: 1080,
      oldPrice: 1190,
      rating: 4.8,
      reviews: 143,
      image: "./assets/marketplace/bosch-s5-battery.jpg",
      inStock: true,
      delivery: "Самовывоз или отправка завтра",
      badge: "Хит продаж",
      unitLabel: "за 1 шт.",
      description: "Надёжный аккумулятор для уверенного запуска и стабильной работы зимой.",
      specs: ["74Ah", "Пусковой ток 750A", "Европейский стандарт"]
    },
    {
      id: 12,
      storeId: "battery-hub-sughd",
      name: "Mutlu SFB 60Ah",
      categoryId: "battery",
      category: "АКБ",
      price: 890,
      oldPrice: 980,
      rating: 4.7,
      reviews: 102,
      image: "./assets/marketplace/mutlu-sfb-60ah.jpg",
      inStock: true,
      delivery: "Самовывоз",
      badge: "Скидка -9%",
      unitLabel: "за 1 шт.",
      description: "Надёжный аккумулятор для городского режима и повседневных поездок.",
      specs: ["60Ah", "SFB", "Для седанов и кроссоверов"]
    },
    {
      id: 13,
      storeId: "battery-hub-sughd",
      name: "Varta Blue Dynamic 62Ah",
      categoryId: "battery",
      category: "АКБ",
      price: 970,
      oldPrice: null,
      rating: 4.8,
      reviews: 84,
      image: "./assets/marketplace/car-battery-service.jpg",
      inStock: true,
      delivery: "Отправка на следующий день",
      badge: "Надёжный выбор",
      unitLabel: "за 1 шт.",
      description: "АКБ для уверенного запуска и стабильного напряжения в городской эксплуатации.",
      specs: ["62Ah", "Blue Dynamic", "Необслуживаемый"]
    },
    {
      id: 14,
      storeId: "battery-hub-sughd",
      name: "Пусковые провода 400A",
      categoryId: "accessories",
      category: "Аксессуары",
      price: 120,
      oldPrice: 145,
      rating: 4.6,
      reviews: 62,
      image: "./assets/marketplace/jumper-cables.webp",
      inStock: true,
      delivery: "Самовывоз",
      badge: "Полезно в багажнике",
      unitLabel: "комплект",
      description: "Провода для экстренного запуска автомобиля с надёжными зажимами.",
      specs: ["400A", "Медные жилы", "Усиленные клеммы"]
    },
    {
      id: 15,
      storeId: "battery-hub-sughd",
      name: "Магнитный держатель телефона Baseus",
      categoryId: "accessories",
      category: "Аксессуары",
      price: 69,
      oldPrice: null,
      rating: 4.8,
      reviews: 201,
      image: "./assets/marketplace/baseus-car-holder.jpg",
      inStock: true,
      delivery: "Самовывоз или отправка завтра",
      badge: "Популярно",
      unitLabel: "за 1 шт.",
      description: "Компактный держатель для смартфона с надёжной фиксацией на торпедо.",
      specs: ["Магнитный", "Для смартфона", "Быстрый монтаж"]
    },
    {
      id: 16,
      storeId: "oil-center-dushanbe",
      name: "Воздушный фильтр Sakura A-1038",
      categoryId: "parts",
      category: "Запчасти",
      price: 92,
      oldPrice: null,
      rating: 4.7,
      reviews: 58,
      image: "./assets/marketplace/cabin-filter.jpg",
      inStock: true,
      delivery: "Сегодня по Душанбе",
      badge: "Для ТО",
      unitLabel: "за 1 шт.",
      description: "Воздушный фильтр для стабильной тяги двигателя и чистого воздушного потока.",
      specs: ["Воздушный", "Для регулярного ТО", "Быстрая установка"]
    },
    {
      id: 17,
      storeId: "auto-parts-khujand",
      name: "Щётки стеклоочистителя Bosch AeroTwin",
      categoryId: "accessories",
      category: "Аксессуары",
      price: 210,
      oldPrice: 245,
      rating: 4.8,
      reviews: 73,
      image: "./assets/marketplace/bosch-aerotwin.jpg",
      inStock: true,
      delivery: "Сегодня по Худжанду",
      badge: "Скидка",
      unitLabel: "комплект",
      description: "Бескаркасные щётки стеклоочистителя для тихой работы и хорошей очистки стекла.",
      specs: ["AeroTwin", "Бескаркасные", "Комплект 2 шт."]
    },
    {
      id: 18,
      storeId: "battery-hub-sughd",
      name: "Компрессор 12V Xiaomi Air Pump",
      categoryId: "accessories",
      category: "Аксессуары",
      price: 399,
      oldPrice: 455,
      rating: 4.9,
      reviews: 112,
      image: "./assets/marketplace/xiaomi-air-compressor.png",
      inStock: true,
      delivery: "Самовывоз или отправка завтра",
      badge: "Хит продаж",
      unitLabel: "за 1 шт.",
      description: "Компактный компрессор для подкачки шин и экстренных дорожных ситуаций.",
      specs: ["12V", "Цифровой дисплей", "Для шин и аксессуаров"]
    }
  ].map((product) => ({
    ...product,
    title: product.name,
    slug: String(product.name || `product-${product.id}`)
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-+|-+$/g, "") || `product-${product.id}`,
    old_price: product.oldPrice,
    reviews_count: product.reviews,
    reviewsCount: product.reviews,
    store_id: product.storeId,
    stock: product.inStock,
    discounted: Boolean(product.oldPrice),
    popular:
      Boolean(product.rating >= 4.8 && product.reviews >= 70) ||
      /хит|популяр|премиум/i.test(String(product.badge || "")),
    keywords: [
      product.name,
      product.category,
      product.badge,
      ...(Array.isArray(product.specs) ? product.specs : [])
    ]
      .filter(Boolean)
      .join(" ")
  }));

  const marketplaceBaseData = Object.freeze({
    categories: marketCategories,
    stores: marketStores,
    products
  });

  const marketplaceRuntime = {
    stores: marketStores,
    products
  };

  // ── Export to DX ──
  try { if (typeof buyerOrderStatusOptions !== 'undefined') window.DX['buyerOrderStatusOptions'] = buyerOrderStatusOptions; } catch(e) {}
  try { if (typeof getServiceCategoryMeta !== 'undefined') window.DX['getServiceCategoryMeta'] = getServiceCategoryMeta; } catch(e) {}
  try { if (typeof maintenanceTypeOptions !== 'undefined') window.DX['maintenanceTypeOptions'] = maintenanceTypeOptions; } catch(e) {}
  try { if (typeof mapFilters !== 'undefined') window.DX['mapFilters'] = mapFilters; } catch(e) {}
  try { if (typeof mapPoints !== 'undefined') window.DX['mapPoints'] = mapPoints; } catch(e) {}
  try { if (typeof marketCategories !== 'undefined') window.DX['marketCategories'] = marketCategories; } catch(e) {}
  try { if (typeof marketFeedFilters !== 'undefined') window.DX['marketFeedFilters'] = marketFeedFilters; } catch(e) {}
  try { if (typeof marketplaceBaseData !== 'undefined') window.DX['marketplaceBaseData'] = marketplaceBaseData; } catch(e) {}
  try { if (typeof marketplaceRuntime !== 'undefined') window.DX['marketplaceRuntime'] = marketplaceRuntime; } catch(e) {}
  try { if (typeof marketStores !== 'undefined') window.DX['marketStores'] = marketStores; } catch(e) {}
  try { if (typeof nearbyServices !== 'undefined') window.DX['nearbyServices'] = nearbyServices; } catch(e) {}
  try { if (typeof normalizeServiceCategoryText !== 'undefined') window.DX['normalizeServiceCategoryText'] = normalizeServiceCategoryText; } catch(e) {}
  try { if (typeof products !== 'undefined') window.DX['products'] = products; } catch(e) {}
  try { if (typeof quickActions !== 'undefined') window.DX['quickActions'] = quickActions; } catch(e) {}
  try { if (typeof recommendedServices !== 'undefined') window.DX['recommendedServices'] = recommendedServices; } catch(e) {}
  try { if (typeof resolveServiceCategoryId !== 'undefined') window.DX['resolveServiceCategoryId'] = resolveServiceCategoryId; } catch(e) {}
  try { if (typeof sellerBusinessTypeOptions !== 'undefined') window.DX['sellerBusinessTypeOptions'] = sellerBusinessTypeOptions; } catch(e) {}
  try { if (typeof sellerNavigationItems !== 'undefined') window.DX['sellerNavigationItems'] = sellerNavigationItems; } catch(e) {}
  try { if (typeof sellerOrderStatusOptions !== 'undefined') window.DX['sellerOrderStatusOptions'] = sellerOrderStatusOptions; } catch(e) {}
  try { if (typeof sellerPrimaryStoreId !== 'undefined') window.DX['sellerPrimaryStoreId'] = sellerPrimaryStoreId; } catch(e) {}
  try { if (typeof sellerProductStatusOptions !== 'undefined') window.DX['sellerProductStatusOptions'] = sellerProductStatusOptions; } catch(e) {}
  try { if (typeof sellerStoreCategoryOptions !== 'undefined') window.DX['sellerStoreCategoryOptions'] = sellerStoreCategoryOptions; } catch(e) {}
  try { if (typeof serviceAppointmentStatusOptions !== 'undefined') window.DX['serviceAppointmentStatusOptions'] = serviceAppointmentStatusOptions; } catch(e) {}
  try { if (typeof serviceCategories !== 'undefined') window.DX['serviceCategories'] = serviceCategories; } catch(e) {}
  try { if (typeof serviceCategoryAliases !== 'undefined') window.DX['serviceCategoryAliases'] = serviceCategoryAliases; } catch(e) {}
  try { if (typeof serviceCenterTypeOptions !== 'undefined') window.DX['serviceCenterTypeOptions'] = serviceCenterTypeOptions; } catch(e) {}
  try { if (typeof serviceCrmNavigationItems !== 'undefined') window.DX['serviceCrmNavigationItems'] = serviceCrmNavigationItems; } catch(e) {}
  try { if (typeof servicePrimaryCenterId !== 'undefined') window.DX['servicePrimaryCenterId'] = servicePrimaryCenterId; } catch(e) {}
  try { if (typeof serviceRepairStatusOptions !== 'undefined') window.DX['serviceRepairStatusOptions'] = serviceRepairStatusOptions; } catch(e) {}
  try { if (typeof serviceRequestStatusOptions !== 'undefined') window.DX['serviceRequestStatusOptions'] = serviceRequestStatusOptions; } catch(e) {}
  try { if (typeof serviceRequestDeclinedMeta !== 'undefined') window.DX['serviceRequestDeclinedMeta'] = serviceRequestDeclinedMeta; } catch(e) {}
  try { if (typeof serviceShowcaseProfiles !== 'undefined') window.DX['serviceShowcaseProfiles'] = serviceShowcaseProfiles; } catch(e) {}
  try { if (typeof vehicleDocumentKinds !== 'undefined') window.DX['vehicleDocumentKinds'] = vehicleDocumentKinds; } catch(e) {}
  try { if (typeof normalizeServiceCategoryText !== 'undefined') window.DX['normalizeServiceCategoryText'] = normalizeServiceCategoryText; } catch(e) {}
  try { if (typeof getServiceCategoryMeta !== 'undefined') window.DX['getServiceCategoryMeta'] = getServiceCategoryMeta; } catch(e) {}
  try { if (typeof resolveServiceCategoryId !== 'undefined') window.DX['resolveServiceCategoryId'] = resolveServiceCategoryId; } catch(e) {}
  // Live data variables (mutable, обновляются App())
  window.DX._liveNearbyServices = null;
  window.DX._liveRecommendedServices = null;
  window.DX._liveMarketProducts = null;

})();


