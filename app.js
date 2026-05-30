(() => {
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const htm = window.htm;

  if (!React || !ReactDOM || !htm) {
    // eslint-disable-next-line no-console
    console.error("DRIVEX (React): missing React/ReactDOM/htm.");
    return;
  }

  const {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
  } = React;

  const html = htm.bind(React.createElement);
  const sellerBackend = window.DrivexSellerBackend || null;

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

    return {
      id,
      name,
      phone,
      email,
      role: "buyer",
      provider: source.provider === "supabase" ? "supabase" : "local",
      authenticated: Boolean(source.authenticated && (id || email || phone))
    };
  }

  function normalizeBuyerProfile(value) {
    const fallback = createDefaultBuyerProfile();
    const source = value && typeof value === "object" ? value : {};
    const avatarRaw = typeof source.avatar === "string" ? source.avatar.trim() : "";

    return {
      name: String(source.name || fallback.name).trim() || fallback.name,
      phone: String(source.phone || "").trim(),
      email: String(source.email || "").trim().toLowerCase(),
      avatar: avatarRaw && avatarRaw.startsWith("data:image/") && avatarRaw.length <= 500000 ? avatarRaw : ""
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

  function getSupabaseClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
    const config = window.DRIVEX_SUPABASE_CONFIG || {};
    if (!config.url || !config.anonKey) return null;

    if (!window.__DRIVEX_SUPABASE_CLIENT__) {
      window.__DRIVEX_SUPABASE_CLIENT__ = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
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
      role: "buyer",
      provider: "local",
      authenticated: true
    });
  }

  function makeBuyerSessionFromSupabaseUser(user) {
    const metadata = user?.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {};
    return normalizeBuyerSession({
      id: user?.id || "",
      name: metadata.full_name || metadata.name || "",
      phone: metadata.phone || user?.phone || "",
      email: user?.email || "",
      role: "buyer",
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
      password: typeof source.password === "string" ? source.password : fallback.password,
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
      status: typeof source.status === "string" && source.status.trim() ? source.status.trim() : fallback.status
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
      videoUrl: normalized.videoUrl
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
    if (safeStatus === "ready") return "ready";
    if (safeStatus === "progress" || safeStatus === "in-progress" || safeStatus === "working") return "progress";
    if (safeStatus === "accepted" || safeStatus === "sent" || safeStatus === "queued" || safeStatus === "new") {
      return "accepted";
    }
    return serviceRequestStatusOptions[0].id;
  }

  function getServiceRequestStatusMeta(statusId) {
    const normalizedStatusId = normalizeServiceRequestStatusId(statusId);
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
    return Math.max(45, Math.min(99, Math.round(numericValue)));
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
    const finalGallery = [primaryImage, ...gallery].filter(Boolean).slice(0, 4);
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
    const repeatClientsPercent = safeClients.length ? Math.round((repeatedClients / safeClients.length) * 100) : 62;
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
      rating: 5.0,
      reviews: Math.max(18, dashboardStats.clients * 6 + dashboardStats.readyRepairs * 8),
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
      completedCars: Math.max(dashboardStats.readyRepairs, dashboardStats.clients * 12, safeOrders.length * 16),
      averageRepairTime: formatServiceAverageTime(averageRepairMinutes),
      suitableBrands: ["BMW", "Toyota", "Kia", "Hyundai", "Chevrolet", "Lexus"],
      gallery: realGallery,
      videoPoster: videoUrl ? primaryImage : "",
      videoUrl,
      masters: [
        {
          id: `${serviceId}-master-1`,
          name: "Главный мастер",
          role: "Сервис команда",
          experience: "CRM owner",
          specialty: safeCenter.serviceType || "Работы сервиса"
        }
      ],
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
    const response = await fetch("/api/service-centers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
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
    const featuredServices = catalogService
      ? dedupeServicesById([...catalogServices, ...recommendedServices]).map((item) => decorateServiceRecord(item))
      : sharedCatalogServices.length
        ? dedupeServicesById([...sharedCatalogServices, ...recommendedServices]).map((item) => decorateServiceRecord(item))
        : recommendedServices.map((item) => decorateServiceRecord(item));
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
    const nearbyRuntimeServices = nearbyCatalogCards.length
      ? dedupeServicesById([...nearbyCatalogCards, ...nearbyServices]).map((item) => decorateServiceRecord(item))
      : nearbyServices.map((item) => decorateServiceRecord(item));
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

  function getOrderChatPreviewText(message, viewerRole = "buyer") {
    if (!message) {
      return viewerRole === "seller"
        ? "Чат пуст. Покупатель сможет написать по этому заказу."
        : "Чат пуст. Можно написать продавцу по этому заказу.";
    }

    return `${getOrderChatSenderLabel(message, viewerRole)}: ${message.text}`;
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
    const image = isImageDataUrl(value.image, 1400000) ? value.image : "";
    if (!image) return null;

    return {
      id: typeof value.id === "string" ? value.id : genId("doc"),
      name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : fallbackName,
      image,
      addedAt: Number.isFinite(Number(value.addedAt)) ? Number(value.addedAt) : Date.now()
    };
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

    let total = documents.license ? 1 : 0;
    const cars = documents.cars && typeof documents.cars === "object" ? documents.cars : {};
    for (const carId of Object.keys(cars)) {
      const carDocs = cars[carId] || {};
      total += carDocs.registration ? 1 : 0;
      total += carDocs.inspection ? 1 : 0;
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

  function Icon({ name, size = 24, strokeWidth = 2, className = "", style }) {
    const commonProps = {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    };

    const Star = () =>
      html`<svg
        width=${size}
        height=${size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        aria-hidden="true"
        className=${className}
        style=${style}
      >
        <path
          d="M12 17.3 6.8 20l1-5.9L3 9.8l6-.7L12 3.6l3 5.5 6 .7-4.8 4.3 1 5.9z"
        ></path>
      </svg>`;

    switch (name) {
      case "star":
        return Star();
      case "home":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 10.5 12 3l9 7.5"></path>
          <path d="M5 10v10h14V10"></path>
        </svg>`;
      case "map":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"></path>
          <path d="M9 3v15"></path>
          <path d="M15 6v15"></path>
        </svg>`;
      case "wrench":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path
            d="M14.7 6.3a5 5 0 0 1-6.4 6.4L4 17l3 3 4.3-4.3a5 5 0 0 1 6.4-6.4l-3 3 2 2 3-3Z"
          ></path>
        </svg>`;
      case "bag":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M6 7h12l-1 14H7L6 7Z"></path>
          <path d="M9 7a3 3 0 0 1 6 0"></path>
        </svg>`;
      case "user":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M20 21a8 8 0 0 0-16 0"></path>
          <circle cx="12" cy="8" r="4"></circle>
        </svg>`;
      case "smile":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M8.5 15a5 5 0 0 0 7 0"></path>
          <path d="M9 10h.01"></path>
          <path d="M15 10h.01"></path>
        </svg>`;
      case "phone":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path
            d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6.1 6.1l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.9z"
          ></path>
        </svg>`;
      case "bell":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
          ></path>
          <path d="M13.7 21a2 2 0 0 1-3.4 0"></path>
        </svg>`;
      case "sun":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v3"></path>
          <path d="M12 19v3"></path>
          <path d="m4.9 4.9 2.1 2.1"></path>
          <path d="m17 17 2.1 2.1"></path>
          <path d="M2 12h3"></path>
          <path d="M19 12h3"></path>
          <path d="m4.9 19.1 2.1-2.1"></path>
          <path d="m17 7 2.1-2.1"></path>
        </svg>`;
      case "coffee":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M6 8h10v6a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V8Z"></path>
          <path d="M16 10h1a2 2 0 0 1 0 4h-1"></path>
          <path d="M8 3v3"></path>
          <path d="M12 3v3"></path>
          <path d="M6 21h10"></path>
        </svg>`;
      case "gift":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="8" width="18" height="5" rx="1"></rect>
          <path d="M12 8v13"></path>
          <path d="M5 13h14v8H5z"></path>
          <path d="M12 8H8.5a2.5 2.5 0 1 1 0-5c2 0 3.5 2 3.5 5Z"></path>
          <path d="M12 8h3.5a2.5 2.5 0 1 0 0-5C13.5 3 12 5 12 8Z"></path>
        </svg>`;
      case "cloud-rain":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M7 18a4 4 0 1 1 .8-7.9A5 5 0 0 1 18 11a3.5 3.5 0 1 1 0 7H7Z"></path>
          <path d="M9 19.5 8 22"></path>
          <path d="M13 19.5 12 22"></path>
          <path d="M17 19.5 16 22"></path>
        </svg>`;
      case "fuel":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 3h10v18H3z"></path>
          <path d="M13 7h2l3 3v10a2 2 0 0 1-2 2h-3"></path>
          <path d="M6 7h4"></path>
        </svg>`;
      case "battery":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="7" width="16" height="10" rx="2"></rect>
          <path d="M19 10h2v4h-2"></path>
          <path d="M7 10v4"></path>
          <path d="M5 12h4"></path>
          <path d="M13 10v4"></path>
        </svg>`;
      case "car":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 14l1-4a4 4 0 0 1 4-3h8a4 4 0 0 1 4 3l1 4"></path>
          <path d="M5 14v4"></path>
          <path d="M19 14v4"></path>
          <circle cx="7" cy="18" r="2"></circle>
          <circle cx="17" cy="18" r="2"></circle>
        </svg>`;
      case "sos":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 2 2 22h20L12 2Z"></path>
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
        </svg>`;
      case "bot":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 8V4"></path>
          <rect x="5" y="8" width="14" height="12" rx="3"></rect>
          <path d="M9 12h.01"></path>
          <path d="M15 12h.01"></path>
          <path d="M9 16h6"></path>
        </svg>`;
      case "search":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="11" cy="11" r="7"></circle>
          <path d="M21 21l-4.3-4.3"></path>
        </svg>`;
      case "filter":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M4 6h16"></path>
          <path d="M7 12h10"></path>
          <path d="M10 18h4"></path>
        </svg>`;
      case "settings":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M4 21v-7"></path>
          <path d="M4 10V3"></path>
          <path d="M12 21v-9"></path>
          <path d="M12 8V3"></path>
          <path d="M20 21v-5"></path>
          <path d="M20 12V3"></path>
          <path d="M1 14h6"></path>
          <path d="M9 8h6"></path>
          <path d="M17 16h6"></path>
        </svg>`;
      case "edit":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </svg>`;
      case "lock":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="11" width="18" height="11" rx="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>`;
      case "card":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <path d="M2 10h20"></path>
          <path d="M6 15h2"></path>
          <path d="M10 15h6"></path>
        </svg>`;
      case "calendar":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="5" width="18" height="16" rx="2"></rect>
          <path d="M16 3v4"></path>
          <path d="M8 3v4"></path>
          <path d="M3 11h18"></path>
        </svg>`;
      case "clock":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7v5l3 2"></path>
        </svg>`;
      case "coins":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <ellipse cx="12" cy="6.5" rx="5.5" ry="2.5"></ellipse>
          <path d="M6.5 6.5v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4"></path>
          <path d="M6.5 10.5v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4"></path>
        </svg>`;
      case "bolt":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M13 2 5 13h5l-1 9 8-11h-5z"></path>
        </svg>`;
      case "repeat":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M17 2l4 4-4 4"></path>
          <path d="M3 11V9a3 3 0 0 1 3-3h15"></path>
          <path d="M7 22l-4-4 4-4"></path>
          <path d="M21 13v2a3 3 0 0 1-3 3H3"></path>
        </svg>`;
      case "check":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M20 6 9 17l-5-5"></path>
        </svg>`;
      case "copy":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="9" y="9" width="13" height="13" rx="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>`;
      case "folder":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"></path>
        </svg>`;
      case "plus":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </svg>`;
      case "x":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>`;
      case "trash":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </svg>`;
      case "layers":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 2 2 7l10 5 10-5-10-5Z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>`;
      case "wash":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M7 3h10"></path>
          <path d="M9 3v4"></path>
          <path d="M15 3v4"></path>
          <path d="M6 7h12l-1 14H7L6 7Z"></path>
        </svg>`;
      case "tire":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 3v2"></path>
          <path d="M12 19v2"></path>
          <path d="M3 12h2"></path>
          <path d="M19 12h2"></path>
        </svg>`;
      case "parking":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M8 3h6a4 4 0 0 1 0 8H8z"></path>
          <path d="M8 11v10"></path>
        </svg>`;
      case "crosshair":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="7"></circle>
          <path d="M12 3v2"></path>
          <path d="M12 19v2"></path>
          <path d="M3 12h2"></path>
          <path d="M19 12h2"></path>
        </svg>`;
      case "chevron-left":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M15 18 9 12l6-6"></path>
        </svg>`;
      case "truck":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 7h11v10H3z"></path>
          <path d="M14 10h4l3 3v4h-7z"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <circle cx="18" cy="17" r="2"></circle>
        </svg>`;
      case "scan":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M4 7V4h3"></path>
          <path d="M17 4h3v3"></path>
          <path d="M20 17v3h-3"></path>
          <path d="M7 20H4v-3"></path>
          <path d="M7 12h10"></path>
        </svg>`;
      case "sparkles":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 2l1.5 5L19 9l-5.5 2L12 16l-1.5-5L5 9l5.5-2L12 2Z"></path>
        </svg>`;
      case "play":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m10 8 6 4-6 4z"></path>
        </svg>`;
      default:
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="10"></circle>
        </svg>`;
    }
  }

  function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((message) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, message: String(message) }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2200);
    }, []);

    return html`
      <${ToastContext.Provider} value=${{ push }}>
        ${children}
        <div
          className="fixed top-4 left-0 right-0 z-50 pointer-events-none"
          style=${{ maxWidth: "480px", margin: "0 auto" }}
          aria-live="polite"
          aria-atomic="true"
        >
          ${toasts.map(
            (t) => html`
              <div
                key=${t.id}
                className="mx-3 mb-3 glass-card rounded-2xl p-4 neon-glow-cyan"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{
                      background: "rgba(6, 182, 212, 0.2)",
                      color: "var(--drivex-neon-cyan)"
                    }}
                  >
                    <${Icon} name="star" size=${18} />
                  </div>
                  <p className="text-sm" style=${{ color: "var(--drivex-white)" }}>
                    ${t.message}
                  </p>
                </div>
              </div>
            `
          )}
        </div>
      </${ToastContext.Provider}>
    `;
  }

  function useHashPath() {
    const [path, setPath] = useState(() => normalizePath(getHashPath()));

    useEffect(() => {
      if (!window.location.hash) window.location.hash = "#/";
      const onChange = () => setPath(normalizePath(getHashPath()));
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    }, []);

    return path;
  }

  function BackHeader({ title, backPath }) {
    return html`
      <div className="pt-12 pb-6 px-6" style=${{ background: "var(--drivex-graphite)" }}>
        <div className="flex items-center gap-3 mb-6">
          <a
            href=${`#${backPath}`}
            className="p-2 rounded-xl glass-card-light"
            style=${{ color: "var(--drivex-neon-cyan)" }}
            aria-label="Назад"
          >
            <${Icon} name="chevron-left" size=${24} />
          </a>
          <h1 className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
            ${title}
          </h1>
        </div>
      </div>
    `;
  }

  function alphaBg(color, alpha = 0.2) {
    const known = {
      "var(--drivex-electric-blue)": `rgba(14, 165, 233, ${alpha})`,
      "var(--drivex-neon-cyan)": `rgba(6, 182, 212, ${alpha})`,
      "var(--drivex-bright-cyan)": `rgba(34, 211, 238, ${alpha})`,
      "var(--drivex-success)": `rgba(16, 185, 129, ${alpha})`,
      "var(--drivex-warning)": `rgba(245, 158, 11, ${alpha})`,
      "var(--drivex-danger)": `rgba(239, 68, 68, ${alpha})`
    };

    if (known[color]) return known[color];

    if (typeof color === "string" && color.startsWith("#") && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return `rgba(148, 163, 184, ${alpha})`;
  }

  function parseMileageLabel(value) {
    const digits = String(value || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }

  function sortByDateDesc(list = []) {
    return [...list].sort((a, b) => {
      const aTime = new Date(a?.date || a?.doneAt || 0).getTime() || 0;
      const bTime = new Date(b?.date || b?.doneAt || 0).getTime() || 0;
      return bTime - aTime;
    });
  }

  function buildDashboardMaintenanceFeed(maintenance, activeCarId) {
    const carState = getMaintenanceCarState(maintenance, activeCarId);
    const storageService = window.DrivexStorageService;
    const storageHistory =
      storageService && typeof storageService.getByCar === "function"
        ? storageService.getByCar(activeCarId)
        : [];
    const maintenanceRecords = (Array.isArray(carState.records) ? carState.records : []).map((record) => ({
      date: record.date,
      mileage: record.mileage,
      price: record.cost,
      serviceName: record.service || record.title || "Сервис",
      nextServiceAt: null,
      source: "maintenance"
    }));

    return {
      records: sortByDateDesc([...storageHistory, ...maintenanceRecords]),
      inspection: carState.inspection || {}
    };
  }

  function getMonthlySavings(activeCarId, maintenance) {
    const analyticsEngine = window.DrivexAnalyticsEngine;
    const feed = buildDashboardMaintenanceFeed(maintenance, activeCarId);
    const analytics =
      analyticsEngine && typeof analyticsEngine.compute === "function"
        ? analyticsEngine.compute(feed.records)
        : { monthlySpent: 0 };
    const monthlySpent = Number(analytics?.monthlySpent) || 0;
    const cashback = monthlySpent > 0 ? Math.round(monthlySpent * 0.03) : 0;
    return Math.max(cashback, monthlySpent > 0 ? 120 : 320);
  }

  function getMorningCommuteMinutes() {
    const workPlace = savedPlaces.find((place) => place.id === "work");
    if (!workPlace) return 18;
    return Math.max(12, 28 - new Date().getHours());
  }

  function getServiceDashboardStatus({ maintenance, activeCarId }) {
    const activeCar = findGarageCar(activeCarId);
    const currentMileage = parseMileageLabel(activeCar?.mileage);
    const feed = buildDashboardMaintenanceFeed(maintenance, activeCarId);
    const records = feed.records;
    const inspection = feed.inspection || {};
    const nowMs = Date.now();
    const latestRecord = records[0] || null;
    const latestRecordMs = latestRecord?.date ? new Date(latestRecord.date).getTime() : 0;
    const overdueByMileage = records.find(
      (record) =>
        Number.isFinite(Number(record?.nextServiceAt)) &&
        currentMileage >= Number(record.nextServiceAt)
    );
    const dueSoonByMileage = records.find((record) => {
      const nextServiceAt = Number(record?.nextServiceAt);
      if (!Number.isFinite(nextServiceAt)) return false;
      const remaining = nextServiceAt - currentMileage;
      return remaining > 0 && remaining < 500;
    });
    const inspectionExpired =
      inspection.validUntil && new Date(inspection.validUntil).getTime() < nowMs;
    const longNoService = latestRecordMs > 0 && nowMs - latestRecordMs > 180 * 24 * 60 * 60 * 1000;

    if (overdueByMileage || inspectionExpired) {
      return {
        state: "service",
        title: "Status: Service",
        icon: "wrench",
        accent: "#ff6b57",
        glow: "rgba(255, 107, 87, 0.34)",
        message: "Машина просит внимания. Пора заехать на сервис.",
        actionLabel: "Записаться",
        actionHref: "#/services",
        health: 24,
        metricType: "health",
        metricValue: 24,
        helper: overdueByMileage
          ? "Порог ТО уже пройден по пробегу."
          : "Техосмотр просрочен. Проверьте журнал обслуживания."
      };
    }

    if (dueSoonByMileage || longNoService) {
      const remaining = dueSoonByMileage
        ? Math.max(0, Number(dueSoonByMileage.nextServiceAt) - currentMileage)
        : 450;
      const health = longNoService ? 54 : Math.max(48, Math.min(88, Math.round((remaining / 500) * 42 + 46)));
      return {
        state: "service",
        title: "Status: Service",
        icon: "wrench",
        accent: "#ff7f50",
        glow: "rgba(255, 127, 80, 0.32)",
        message: "Машина просит внимания. Пора заехать на сервис.",
        actionLabel: "Записаться",
        actionHref: "#/services",
        health,
        metricType: "health",
        metricValue: health,
        helper: dueSoonByMileage
          ? `До следующего ТО осталось около ${formatPrice(remaining)} км.`
          : "Давно не было новых записей. Лучше заехать на диагностику."
      };
    }

    return {
      state: "service",
      title: "Status: Service",
      icon: "wrench",
      accent: "#3ba7ff",
      glow: "rgba(59, 167, 255, 0.28)",
      message: "По журналу обслуживания все спокойно. Машина в хорошем состоянии.",
      actionLabel: "История ТО",
      actionHref: "#/profile",
      health: 100,
      metricType: "health",
      metricValue: 100,
      helper: "Health Bar заполнен на 100%. Критичных сервисных событий нет."
    };
  }

  function getContextDashboardStatus(profileName) {
    const hour = new Date().getHours();
    const firstName = String(profileName || "").trim().split(/\s+/)[0] || "водитель";
    const commuteMinutes = getMorningCommuteMinutes();

    if (hour >= 7 && hour < 11) {
      return {
        state: "context",
        phase: "morning",
        title: "Status: Context",
        icon: commuteMinutes <= 18 ? "coffee" : "sun",
        accent: "#2ea9ff",
        glow: "rgba(46, 169, 255, 0.34)",
        message: `Доброе утро, ${firstName}! До работы около ${commuteMinutes} мин. Заедем за кофе?`,
        actionLabel: "Маршрут",
        actionHref: "#/map",
        health: 100,
        metricType: "health",
        metricValue: 100,
        helper: "Утренний режим активен. Маршрут и быстрые остановки уже готовы."
      };
    }

    if (hour >= 16 && hour < 21) {
      return {
        state: "context",
        phase: "evening",
        title: "Ритм города",
        icon: "map",
        accent: "#ff9f43",
        glow: "rgba(255, 159, 67, 0.30)",
        message: "Вечерний час-пик в разгаре. На главных улицах Худжанда заторы. DriveX желает вам спокойной и безопасной дороги.",
        actionLabel: "Обзор пробок",
        actionHref: "#/map",
        health: 100,
        metricType: "health",
        metricValue: 100,
        helper: "Вечерний сценарий предупреждает о дорожной обстановке, а не строит маршрут за вас."
      };
    }

    if (hour >= 21 || hour < 7) {
      return {
        state: "context",
        phase: "night",
        title: "Ночной драйв",
        icon: "sparkles",
        accent: "#7dd3fc",
        glow: "rgba(125, 211, 252, 0.28)",
        message: "Дороги свободны, а город в огнях. Идеальное время для спокойной поездки. Ваше авто готово, а вы?",
        moodLine: "Давай-ка освежаем машину и добавим ночи еще больше блеска.",
        actionLabel: "Пойдем в мойку",
        actionHref: "#/services",
        health: 100,
        metricType: "health",
        metricValue: 100,
        helper: "",
        displayMode: "immersive"
      };
    }

    if (hour >= 11 && hour < 16) {
      return {
        state: "context",
        phase: "day",
        title: "Status: Context",
        icon: "sun",
        accent: "#2ea9ff",
        glow: "rgba(46, 169, 255, 0.28)",
        message: `${firstName}, маршрут дня под рукой. Когда соберетесь, DriveX поможет быстро стартовать.`,
        actionLabel: "Маршрут",
        actionHref: "#/map",
        health: 100,
        metricType: "health",
        metricValue: 100,
        helper: "Сейчас не утренний слот 07:00–10:00, поэтому показан общий контекстный сценарий."
      };
    }
  }

  function getMarketingDashboardStatus(activeCarId, maintenance) {
    const savings = getMonthlySavings(activeCarId, maintenance);

    return {
      state: "marketing",
      title: "Status: Marketing",
      icon: "gift",
      accent: "#29d391",
      glow: "rgba(41, 211, 145, 0.34)",
      message: `Вы сэкономили ${formatPrice(savings)} TJS в этом месяце. Крутой результат!`,
      actionLabel: "Забрать бонусы",
      actionHref: "#/bonus",
      health: 100,
      metricType: "money",
      metricValue: savings,
      helper: "Экономия посчитана по расходам на обслуживание и бонусам DriveX."
    };
  }

  function buildWeatherUrl(latitude, longitude) {
    const weatherConfig = window.DRIVEX_WEATHER_CONFIG || {};
    const apiKey = typeof weatherConfig.openWeatherApiKey === "string" ? weatherConfig.openWeatherApiKey.trim() : "";

    if (apiKey) {
      return `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=ru`;
    }

    return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,rain,showers,snowfall,weather_code&timezone=auto`;
  }

  function normalizeWeatherPayload(data) {
    if (!data || typeof data !== "object") return null;

    if (data.current && typeof data.current === "object") {
      return {
        temperature: Number(data.current.temperature_2m) || 0,
        rain: Number(data.current.rain) || 0,
        showers: Number(data.current.showers) || 0,
        snowfall: Number(data.current.snowfall) || 0,
        weatherCode: Number(data.current.weather_code) || 0
      };
    }

    if (data.main && data.weather) {
      const weatherId = Number(data.weather[0]?.id) || 0;
      const rain = weatherId >= 500 && weatherId < 600 ? 1 : 0;
      const snowfall = weatherId >= 600 && weatherId < 700 ? 1 : 0;
      return {
        temperature: Number(data.main.temp) || 0,
        rain,
        showers: rain,
        snowfall,
        weatherCode: weatherId
      };
    }

    return null;
  }

  function getWeatherDashboardStatus(snapshot) {
    const hour = new Date().getHours();
    if (!snapshot) {
      return {
        state: "weather",
        phase: hour >= 11 && hour < 16 ? "lunch" : "normal",
        title: hour >= 11 && hour < 16 ? "Градус комфорта" : "Status: Weather",
        icon: "cloud-rain",
        accent: "#1dc7ff",
        glow: "rgba(29, 199, 255, 0.28)",
        message:
          hour >= 11 && hour < 16
            ? "Пользователь, на улице сейчас около +24°. Не забывайте проветрить салон перед поездкой. Хорошего дня!"
            : "Погодных рисков не обнаружено. Можно ехать спокойно.",
        actionLabel: "Советы",
        actionHref: "#/ai-assistant",
        health: 100,
        metricType: "temperature",
        metricValue: 24,
        helper:
          hour >= 11 && hour < 16
            ? "Дневной сценарий работает как климатический ассистент для водителя."
            : "Нет данных GPS или резких погодных событий. Показан базовый погодный сценарий."
      };
    }

    const temperature = Number(snapshot.temperature) || 0;
    const rain = Number(snapshot.rain) || 0;
    const showers = Number(snapshot.showers) || 0;
    const snowfall = Number(snapshot.snowfall) || 0;
    const weatherCode = Number(snapshot.weatherCode) || 0;
    const wet = rain > 0 || showers > 0 || snowfall > 0;
    const icy = temperature <= 1 && wet;
    const heavyRain = wet && [63, 65, 80, 81, 82, 95, 96, 99, 502, 503, 504, 522].includes(weatherCode);
    const extremeHeat = temperature >= 38;

    if (!icy && !heavyRain && !extremeHeat) {
      return {
        state: "weather",
        phase: hour >= 11 && hour < 16 ? "lunch" : "normal",
        title: hour >= 11 && hour < 16 ? "Градус комфорта" : "Status: Weather",
        icon: "sun",
        accent: "#1dc7ff",
        glow: "rgba(29, 199, 255, 0.28)",
        message:
          hour >= 11 && hour < 16
            ? `Пользователь, на улице сейчас +${Math.round(temperature)}°. Не забывайте проветрить салон перед поездкой. Хорошего дня!`
            : "Погода спокойная. Дорожные условия без критических рисков.",
        actionLabel: hour >= 11 && hour < 16 ? "Советы" : "Советы по вождению",
        actionHref: "#/ai-assistant",
        health: 100,
        metricType: "temperature",
        metricValue: Math.round(temperature),
        helper:
          hour >= 11 && hour < 16
            ? "Обеденный сценарий подсказывает климат и комфорт в салоне."
            : "Осадков и экстремальной температуры нет. Это обычный погодный сценарий."
      };
    }

    let message = "Сегодня скользко. Держите дистанцию и проверьте шины.";
    if (heavyRain) {
      message = "Сегодня сильный дождь. Снизьте скорость и проверьте обзор.";
    } else if (extremeHeat) {
      message = "Сегодня аномальная жара. Следите за температурой двигателя и давлением в шинах.";
    }

    return {
      state: "weather",
      phase: "alert",
      title: "Status: Weather",
      icon: "cloud-rain",
      accent: "#1dc7ff",
      glow: "rgba(29, 199, 255, 0.34)",
      message,
      actionLabel: "Советы по вождению",
      actionHref: "#/ai-assistant",
      health: 100,
      metricType: "temperature",
      metricValue: Math.round(temperature),
      helper: "Погода подтягивается по GPS. Если доступа нет, экран откатится к другому сценарию."
    };
  }

  function NumberTicker({ value, suffix = "", prefix = "", decimals = 0 }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      const target = Number(value) || 0;
      const startValue = displayValue;
      const duration = 900;
      const startTime = performance.now();
      let frameId = 0;

      const tick = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextValue = startValue + (target - startValue) * eased;
        setDisplayValue(progress >= 1 ? target : nextValue);
        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
        }
      };

      frameId = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(frameId);
    }, [value]);

    const normalized =
      decimals > 0
        ? Number(displayValue).toFixed(decimals)
        : formatPrice(Math.round(Number(displayValue) || 0));

    return html`<span>${prefix}${normalized}${suffix}</span>`;
  }

  function SmartDashboard({ profileName, activeCarId, maintenance }) {
    const [weatherStatus, setWeatherStatus] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [transitionKey, setTransitionKey] = useState(0);
    const [transitionDirection, setTransitionDirection] = useState("next");
    const touchStartXRef = useRef(0);
    const serviceStatus = getServiceDashboardStatus({ maintenance, activeCarId });
    const contextStatus = getContextDashboardStatus(profileName);
    const marketingStatus = getMarketingDashboardStatus(activeCarId, maintenance);
    const fallbackWeatherStatus = getWeatherDashboardStatus(null);
    const resolvedWeatherStatus = weatherStatus || fallbackWeatherStatus;
    const serviceStatusKey = `${serviceStatus.state}-${serviceStatus.health}-${serviceStatus.helper}`;
    const statuses = [serviceStatus, resolvedWeatherStatus, contextStatus, marketingStatus];
    const activeStatus = statuses[Math.min(activeIndex, Math.max(0, statuses.length - 1))] || marketingStatus;
    const activeStatusIndex = statuses.findIndex((item) => item === activeStatus);

    useEffect(() => {
      let cancelled = false;

      if (!navigator.geolocation || !window.fetch) {
        setWeatherStatus(null);
        return undefined;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = position.coords?.latitude;
            const longitude = position.coords?.longitude;
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

            const response = await fetch(buildWeatherUrl(latitude, longitude));
            if (!response.ok) return;
            const data = await response.json();
            if (cancelled) return;
            setWeatherStatus(getWeatherDashboardStatus(normalizeWeatherPayload(data)));
          } catch {
            if (!cancelled) setWeatherStatus(null);
          }
        },
        () => {
          if (!cancelled) setWeatherStatus(null);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 10 * 60 * 1000 }
      );

      return () => {
        cancelled = true;
      };
    }, [serviceStatusKey]);

    useEffect(() => {
      const preferredIndex =
        serviceStatus.health < 100
          ? 0
          : resolvedWeatherStatus.phase === "alert" || resolvedWeatherStatus.phase === "lunch"
            ? 1
            : contextStatus.phase === "morning" || contextStatus.phase === "evening" || contextStatus.phase === "night"
              ? 2
              : 3;

      setActiveIndex((prev) => {
        if (prev >= statuses.length) return preferredIndex;
        return prev;
      });
    }, [statuses.length, serviceStatusKey, resolvedWeatherStatus.phase, contextStatus.phase]);

    function goNext() {
      if (statuses.length <= 1) return;
      setTransitionDirection("next");
      setActiveIndex((prev) => (prev + 1) % statuses.length);
      setTransitionKey((prev) => prev + 1);
    }

    function goPrev() {
      if (statuses.length <= 1) return;
      setTransitionDirection("prev");
      setActiveIndex((prev) => (prev - 1 + statuses.length) % statuses.length);
      setTransitionKey((prev) => prev + 1);
    }

    function handleTouchStart(event) {
      touchStartXRef.current = event.changedTouches?.[0]?.clientX || 0;
    }

    function handleTouchEnd(event) {
      const endX = event.changedTouches?.[0]?.clientX || 0;
      const diffX = endX - touchStartXRef.current;
      if (Math.abs(diffX) < 36) return;
      if (diffX < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    const accent = activeStatus.accent;
    const healthWidth = `${Math.max(0, Math.min(100, Number(activeStatus.health) || 0))}%`;
    const isMoney = activeStatus.metricType === "money";
    const isTemperature = activeStatus.metricType === "temperature";
    const isImmersive = activeStatus.displayMode === "immersive";

    useEffect(() => {
      if (statuses.length <= 1) return undefined;
      const intervalId = window.setInterval(() => {
        setTransitionDirection("next");
        setActiveIndex((prev) => (prev + 1) % statuses.length);
        setTransitionKey((prev) => prev + 1);
      }, 4200);
      return () => window.clearInterval(intervalId);
    }, [statuses.length, serviceStatusKey, resolvedWeatherStatus.phase, contextStatus.phase]);

    return html`
      <div
        className="smart-dashboard-shell rounded-3xl p-6"
        onTouchStart=${handleTouchStart}
        onTouchEnd=${handleTouchEnd}
        style=${{
          background: `linear-gradient(140deg, ${alphaBg(accent, 0.28)} 0%, rgba(10, 18, 31, 0.96) 48%, rgba(7, 11, 18, 0.98) 100%)`,
          border: `1px solid ${alphaBg(accent, 0.4)}`,
          boxShadow: `0 24px 60px ${alphaBg(accent, 0.2)}, inset 0 1px 0 rgba(255,255,255,0.06)`
        }}
      >
        <div className="smart-dashboard-grid"></div>
        <div className="smart-dashboard-orb smart-dashboard-orb-a" style=${{ background: activeStatus.glow }}></div>
        <div className="smart-dashboard-orb smart-dashboard-orb-b" style=${{ background: alphaBg(accent, 0.2) }}></div>

        <div
          className="relative z-10 smart-dashboard-animated-content"
          key=${transitionKey}
          data-direction=${transitionDirection}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="smart-dashboard-icon-wrap"
                style=${{
                  background: `linear-gradient(135deg, ${alphaBg(accent, 0.3)} 0%, ${alphaBg(accent, 0.12)} 100%)`,
                  color: accent,
                  border: `1px solid ${alphaBg(accent, 0.4)}`
                }}
              >
                <${Icon} name=${activeStatus.icon} size=${26} />
              </div>
              <div>
                <p className="text-xs font-semibold" style=${{ color: "rgba(255,255,255,0.72)", letterSpacing: "0.14em" }}>
                  SMART DASHBOARD
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-light-silver)" }}>
                  ${activeStatus.title}
                </p>
              </div>
            </div>

            <a
              href=${activeStatus.actionHref}
              className="px-4 py-3 rounded-2xl text-sm font-semibold smart-dashboard-cta"
              style=${{
                background: `linear-gradient(135deg, ${accent} 0%, ${alphaBg(accent, 0.72)} 100%)`,
                color: "var(--drivex-white)"
              }}
            >
              ${activeStatus.actionLabel}
            </a>
          </div>

          <div className="mt-6">
            <p className="text-sm" style=${{ color: "var(--drivex-light-silver)" }}>
              ${activeStatus.message}
            </p>

            ${isImmersive
              ? html`<div className="mt-5 smart-dashboard-immersive-copy">
                  <p className="text-lg font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    ${activeStatus.moodLine || ""}
                  </p>
                </div>`
              : html`<div className="flex items-end justify-between gap-4 mt-5">
                    <div>
                      <div className="text-4xl font-bold tracking-tight" style=${{ color: "var(--drivex-white)" }}>
                        ${isMoney
                          ? html`<${NumberTicker} value=${activeStatus.metricValue} suffix=" TJS" />`
                          : isTemperature
                            ? html`<${NumberTicker} value=${activeStatus.metricValue} suffix="°C" />`
                            : html`<${NumberTicker} value=${activeStatus.metricValue} suffix="%" />`}
                      </div>
                      <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                        ${isMoney ? "Экономия за месяц" : isTemperature ? "Температура сейчас" : "Здоровье авто"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold" style=${{ color: accent, letterSpacing: "0.12em" }}>
                        LIVE
                      </p>
                      <p className="text-sm mt-2 max-w-[160px]" style=${{ color: "var(--drivex-silver)" }}>
                        ${activeStatus.helper}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs mb-2" style=${{ color: "var(--drivex-silver)" }}>
                      <span>Health Bar</span>
                      <span>${Math.round(Number(activeStatus.health) || 0)}%</span>
                    </div>
                    <div className="smart-dashboard-progress">
                      <div
                        className="smart-dashboard-progress-fill"
                        style=${{
                          width: healthWidth,
                          background: `linear-gradient(90deg, ${accent} 0%, ${alphaBg(accent, 0.82)} 100%)`,
                          boxShadow: `0 0 22px ${alphaBg(accent, 0.45)}`
                        }}
                      ></div>
                    </div>
                  </div>`}

            ${statuses.length > 1
              ? html`<div className="smart-dashboard-footer mt-5">
                  <div className="smart-dashboard-swipe-hint" style=${{ color: "var(--drivex-silver)" }}>
                    Свайп влево или вправо
                  </div>
                  <div className="smart-dashboard-dots">
                    ${statuses.map(
                      (status, index) => html`<span
                        key=${`${status.state}-${index}`}
                        className="smart-dashboard-dot"
                        data-active=${index === activeStatusIndex}
                        style=${{
                          background: index === activeStatusIndex ? accent : "rgba(148, 163, 184, 0.24)",
                          boxShadow: index === activeStatusIndex ? `0 0 16px ${alphaBg(accent, 0.45)}` : "none"
                        }}
                      ></span>`
                    )}
                  </div>
                </div>`
              : null}
          </div>
        </div>
      </div>
    `;
  }

  function BottomNav({ activePath }) {
    const items = [
      { path: "/", icon: "home", label: "Главная" },
      { path: "/map", icon: "map", label: "Карта" },
      { path: "/services", icon: "wrench", label: "Сервисы" },
      { path: "/market", icon: "bag", label: "Маркет" },
      { path: "/profile", icon: "user", label: "Профиль" }
    ];

    return html`
      <nav
        id="bottom-nav"
        className="fixed bottom-0 left-0 right-0 glass-card border-t z-50"
        style=${{
          borderTopColor: "var(--glass-border)",
          maxWidth: "480px",
          margin: "0 auto"
        }}
      >
        <div className="flex items-center justify-around h-20 px-2">
          ${items.map((item) => {
            const isActive = activePath === item.path;
            return html`
              <a
                key=${item.path}
                className="nav-link flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 flex-1"
                href=${`#${item.path}`}
                data-nav=${item.path}
                data-active=${isActive ? "true" : "false"}
                aria-current=${isActive ? "page" : "false"}
                style=${{
                  color: isActive
                    ? "var(--drivex-neon-cyan)"
                    : "var(--drivex-silver)",
                  background: isActive ? "rgba(6, 182, 212, 0.1)" : "transparent"
                }}
              >
                <span className="nav-icon">
                  <${Icon}
                    name=${item.icon}
                    size=${24}
                    strokeWidth=${isActive ? 2.5 : 2}
                    className=${isActive ? "neon-glow-cyan" : ""}
                  />
                </span>
                <span className="text-xs font-medium">${item.label}</span>
              </a>
            `;
          })}
        </div>
      </nav>
    `;
  }

  function PlaceholderPage({ title, backPath }) {
    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <${BackHeader} title=${title} backPath=${backPath} />
        <div className="px-6 py-6">
          <div className="glass-card-light rounded-2xl p-5">
            <p className="text-sm" style=${{ color: "var(--drivex-white)" }}>
              Экран в разработке. Это демо-прототип.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function SimplePage({ title, backPath, children }) {
    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <${BackHeader} title=${title} backPath=${backPath} />
        ${children}
      </div>
    `;
  }

  function AIAssistCard({ children, accent = "var(--drivex-neon-cyan)", className = "" }) {
    return html`
      <div
        className=${`glass-card-light rounded-3xl p-5 ${className}`.trim()}
        style=${{
          border: `1px solid ${alphaBg(accent, 0.16)}`,
          boxShadow: `0 18px 36px ${alphaBg(accent, 0.08)}`
        }}
      >
        ${children}
      </div>
    `;
  }

  function AIChip({ label, onClick, active = false }) {
    return html`
      <button
        type="button"
        className="px-3 py-2 rounded-2xl text-sm transition-all"
        style=${{
          background: active ? alphaBg("var(--drivex-neon-cyan)", 0.18) : "rgba(148, 163, 184, 0.12)",
          color: active ? "var(--drivex-neon-cyan)" : "var(--drivex-light-silver)",
          border: active ? `1px solid ${alphaBg("var(--drivex-neon-cyan)", 0.3)}` : "1px solid rgba(148,163,184,0.08)"
        }}
        onClick=${onClick}
      >
        ${label}
      </button>
    `;
  }

  function AIQuickActionCard({ item, active, onClick }) {
    return html`
      <button
        type="button"
        className="ai-quick-card rounded-3xl p-4 text-left transition-all"
        style=${{
          background: active
            ? `linear-gradient(145deg, ${alphaBg(item.accent, 0.22)} 0%, rgba(13, 19, 31, 0.96) 100%)`
            : "rgba(18, 24, 37, 0.88)",
          border: active
            ? `1px solid ${alphaBg(item.accent, 0.32)}`
            : "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: active ? `0 18px 34px ${alphaBg(item.accent, 0.12)}` : "none"
        }}
        onClick=${onClick}
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style=${{
            background: alphaBg(item.accent, 0.18),
            color: item.accent
          }}
        >
          <${Icon} name=${item.icon} size=${20} />
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)", lineHeight: "1.35" }}>
            ${item.title}
          </p>
        </div>
      </button>
    `;
  }

  function AIResponseCard({ response, onFindService, onShowMap, onSave }) {
    if (!response) return null;

    return html`
      <${AIAssistCard} accent="var(--drivex-electric-blue)" className="ai-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold" style=${{ color: "var(--drivex-neon-cyan)", letterSpacing: "0.16em" }}>
              LAST AI RESPONSE
            </p>
            <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
              ${response.title}
            </h3>
            <p className="text-sm mt-3" style=${{ color: "var(--drivex-light-silver)", lineHeight: "1.6" }}>
              ${response.summary}
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style=${{
              background: alphaBg("var(--drivex-electric-blue)", 0.18),
              color: "var(--drivex-electric-blue)"
            }}
          >
            <${Icon} name="bot" size=${22} />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          ${response.sections.map(
            (section) => html`
              <div key=${section.title}>
                <p className="text-sm font-semibold mb-2" style=${{ color: "var(--drivex-white)" }}>
                  ${section.title}
                </p>
                <div className="space-y-2">
                  ${section.items.map(
                    (item) => html`
                      <div key=${item} className="flex items-start gap-3">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style=${{ background: "var(--drivex-neon-cyan)" }}
                        ></span>
                        <p className="text-sm" style=${{ color: "var(--drivex-light-silver)", lineHeight: "1.55" }}>
                          ${item}
                        </p>
                      </div>
                    `
                  )}
                </div>
              </div>
            `
          )}
        </div>

        <div
          className="mt-5 rounded-2xl p-4"
          style=${{
            background: "rgba(8, 15, 26, 0.55)",
            border: "1px solid rgba(148, 163, 184, 0.08)"
          }}
        >
          <p className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)", letterSpacing: "0.12em" }}>
            СРОЧНОСТЬ
          </p>
          <p className="text-sm mt-2" style=${{ color: "var(--drivex-white)", lineHeight: "1.55" }}>
            ${response.urgencyText || response.urgency}
          </p>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-neon-cyan)", lineHeight: "1.55" }}>
            ${response.recommendation}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <button
            type="button"
            className="ai-action-button"
            onClick=${onFindService}
          >
            Найти сервис
          </button>
          <button
            type="button"
            className="ai-action-button"
            onClick=${onShowMap}
          >
            Показать на карте
          </button>
          <button
            type="button"
            className="ai-action-button"
            onClick=${onSave}
          >
            Сохранить
          </button>
        </div>
      </${AIAssistCard}>
    `;
  }

  function AIAssistantScreen({ profile, activeCarId, maintenance, serviceDirectory }) {
    const toast = useToast();
    const aiService = window.DrivexAIAssistService || null;
    const activeCar = findGarageCar(activeCarId) || garageCars[0] || null;
    const carName = activeCar?.name || "BMW X5";
    const carMileage = activeCar?.mileage || "54 200 км";
    const nearbyPool =
      serviceDirectory && Array.isArray(serviceDirectory.nearbyServices)
        ? serviceDirectory.nearbyServices
        : nearbyServices.map((item) => decorateServiceRecord(item));
    const quickScenarios = aiService && typeof aiService.getQuickScenarios === "function"
      ? aiService.getQuickScenarios()
      : [];
    const popularPrompts = aiService && typeof aiService.getPopularPrompts === "function"
      ? aiService.getPopularPrompts()
      : [];
    const [activeScenarioId, setActiveScenarioId] = useState("symptoms");
    const [query, setQuery] = useState("");
    const [placeholder, setPlaceholder] = useState("Например: машина не заводится утром");
    const [loading, setLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [lastResponse, setLastResponse] = useState(() =>
      aiService && typeof aiService.analyzeQuery === "function"
        ? aiService.analyzeQuery("", { activeCar, nearbyServices: nearbyPool, maintenance, profile })
        : null
    );

    const aiContext = {
      activeCar,
      nearbyServices: nearbyPool,
      maintenance,
      profile
    };

    function buildAIInput(message, scenarioType) {
      if (aiService && typeof aiService.buildInput === "function") {
        return aiService.buildInput({
          userMessage: message,
          scenarioType,
          activeCar,
          maintenance,
          location: { city: "Худжанд" },
          locale: "ru-RU"
        });
      }

      return {
        userMessage: message,
        scenarioType,
        vehicle: {
          make: carName.split(" ")[0] || "",
          model: carName.split(" ").slice(1).join(" "),
          year: activeCar?.year || "",
          mileage: Number(String(carMileage).replace(/[^\d]/g, "")) || 0
        },
        location: { city: "Худжанд" },
        locale: "ru-RU"
      };
    }

    function submitAsk(nextQuery = query, scenarioType = activeScenarioId) {
      if (loading || !aiService) return;
      setLoading(true);
      setAiError("");
      const timeoutMs = 700 + Math.floor(Math.random() * 500);
      window.setTimeout(() => {
        const input = buildAIInput(nextQuery, scenarioType);
        const request =
          typeof aiService.askDriveXAI === "function"
            ? aiService.askDriveXAI(input)
            : Promise.resolve(aiService.analyzeQuery(nextQuery, aiContext));

        Promise.resolve(request)
          .then((response) => {
            setLastResponse(response);
          })
          .catch(() => {
            setAiError("Не удалось получить ответ. Попробуй ещё раз.");
            if (typeof aiService.analyzeQuery === "function") {
              setLastResponse(aiService.analyzeQuery(nextQuery, aiContext));
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }, timeoutMs);
    }

    function handleScenarioClick(scenario) {
      setActiveScenarioId(scenario.id);
      if (scenario.placeholder) {
        setPlaceholder(scenario.placeholder);
      }
      if (scenario.immediate && aiService && typeof aiService.runScenario === "function") {
        setLoading(true);
        setAiError("");
        window.setTimeout(() => {
          Promise.resolve(aiService.runScenario(scenario.id, aiContext))
            .then((response) => {
              setLastResponse(response);
            })
            .catch(() => {
              setAiError("Не удалось получить ответ. Попробуй ещё раз.");
              if (typeof aiService.analyzeQuery === "function") {
                setLastResponse(aiService.analyzeQuery("", { ...aiContext, scenarioType: scenario.scenarioType }));
              }
            })
            .finally(() => {
              setLoading(false);
            });
        }, 820);
      }
    }

    function handlePromptChip(prompt) {
      setQuery(prompt);
      submitAsk(prompt);
    }

    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <${BackHeader} title="AI помощник" backPath="/" />
        <div className="px-6 pb-8 space-y-5">
          <div className="ai-fade-in">
            <p className="text-sm" style=${{ color: "var(--drivex-silver)", lineHeight: "1.6" }}>
              Помогу понять проблему, обслуживание и сервисы для твоей машины
            </p>
          </div>

          <${AIAssistCard} accent="var(--drivex-neon-cyan)" className="relative overflow-hidden ai-fade-in">
            <div className="absolute -top-8 right-0 w-32 h-32 rounded-full blur-3xl" style=${{ background: alphaBg("var(--drivex-neon-cyan)", 0.18) }}></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold" style=${{ color: "var(--drivex-neon-cyan)", letterSpacing: "0.18em" }}>
                    SMART ASSIST
                  </p>
                  <h2 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                    ${carName} · Smart Assist
                  </h2>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)" }}>
                    Пробег: ${carMileage}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style=${{
                    background: alphaBg("var(--drivex-neon-cyan)", 0.16),
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="bot" size=${24} />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <div className="ai-summary-pill">
                  AI нашёл 2 рекомендации
                </div>
                <div className="ai-summary-pill">
                  ${nearbyPool.length} сервиса рядом
                </div>
              </div>
            </div>
          </${AIAssistCard}>

          <div className="ai-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Быстрые сценарии
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              ${quickScenarios.map(
                (scenario) => html`
                  <${AIQuickActionCard}
                    key=${scenario.id}
                    item=${scenario}
                    active=${activeScenarioId === scenario.id}
                    onClick=${() => handleScenarioClick(scenario)}
                  />
                `
              )}
            </div>
          </div>

          <${AIAssistCard} accent="var(--drivex-electric-blue)" className="ai-fade-in">
            <p className="text-sm font-semibold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Спроси про симптомы, слова мастера или обслуживание
            </p>
            <textarea
              className="w-full rounded-3xl glass-card-light outline-none dx-input ai-textarea"
              rows="4"
              placeholder=${placeholder}
              value=${query}
              onInput=${(e) => setQuery(e.target.value)}
            ></textarea>

            <button
              type="button"
              className="w-full mt-4 py-4 rounded-2xl font-semibold dx-btn ai-primary-button"
              onClick=${() => submitAsk()}
              disabled=${loading}
              style=${{
                opacity: loading ? 0.76 : 1
              }}
            >
              ${loading ? "AI думает..." : "Спросить AI"}
            </button>
            ${aiError
              ? html`<p className="text-sm mt-3" style=${{ color: "var(--drivex-warning)" }}>
                  ${aiError}
                </p>`
              : null}
          </${AIAssistCard}>

          <div className="ai-fade-in">
            <p className="text-sm font-semibold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Популярные запросы
            </p>
            <div className="flex flex-wrap gap-2">
              ${popularPrompts.map(
                (prompt) => html`
                  <${AIChip}
                    key=${prompt}
                    label=${prompt}
                    onClick=${() => handlePromptChip(prompt)}
                    active=${query === prompt}
                  />
                `
              )}
            </div>
          </div>

          <div className="ai-fade-in">
            <p className="text-sm font-semibold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Последний ответ
            </p>
            ${loading
              ? html`<${AIAssistCard} accent="var(--drivex-electric-blue)">
                  <div className="flex items-center gap-3">
                    <div className="ai-loader-dot"></div>
                    <div>
                      <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        AI анализирует запрос
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        Сопоставляю симптомы, обслуживание и сервисы рядом...
                      </p>
                    </div>
                  </div>
                </${AIAssistCard}>`
              : html`<${AIResponseCard}
                  response=${lastResponse}
                  onFindService=${() => navigateToHash("/services")}
                  onShowMap=${() => navigateToHash("/map")}
                  onSave=${() => toast.push("Ответ AI сохранён")}
                />`}
          </div>
        </div>
      </div>
    `;
  }

  function AIPremiumHeader() {
    return html`
      <div className="ai-premium-header">
        <a href="#/" className="ai-premium-back" aria-label="Назад">
          <${Icon} name="chevron-left" size=${20} />
        </a>
        <div className="min-w-0">
          <h1 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>AI Assist</h1>
          <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
            Диагностика, обслуживание, сервисы
          </p>
        </div>
        <div className="ai-premium-status" aria-hidden="true"><span></span></div>
      </div>
    `;
  }

  function AIPremiumSuggestionCard({ title, icon, delay = 0, onClick }) {
    return html`
      <button type="button" className="ai-suggestion-card" style=${{ animationDelay: `${delay}ms` }} onClick=${onClick}>
        <span className="ai-suggestion-icon"><${Icon} name=${icon} size=${20} /></span>
        <span>${title}</span>
      </button>
    `;
  }

  function AIPremiumEmptyState() {
    return html`
      <div className="ai-empty-state">
        <div className="ai-orb-wrap">
          <div className="ai-orb"></div>
          <div className="ai-orb-core"><${Icon} name="bot" size=${30} /></div>
        </div>
        <h2 className="text-3xl font-bold mt-7" style=${{ color: "var(--drivex-white)", letterSpacing: "-0.03em" }}>
          Чем помочь с машиной?
        </h2>
        <p className="text-sm mt-3 max-w-[320px] mx-auto" style=${{ color: "var(--drivex-silver)", lineHeight: "1.7" }}>
          Опиши симптом, слова мастера или вопрос по обслуживанию
        </p>
      </div>
    `;
  }

  function AIPremiumUserMessage({ text }) {
    return html`
      <div className="ai-message-row ai-message-row-user">
        <div className="ai-user-bubble">${text}</div>
      </div>
    `;
  }

  function AIPremiumAIMessage({ response, onFindService, onShowMap, onFindPart }) {
    const sections = Array.isArray(response?.sections) ? response.sections : [];
    const urgency = response?.urgencyText || response?.urgency || "Средняя. Лучше проверить при повторении.";
    const primaryCta = Array.isArray(response?.cta) ? response.cta[0] : null;
    const secondaryCta = Array.isArray(response?.cta) ? response.cta[1] : null;
    const handleCta = (cta) => {
      const action = cta?.action || cta?.type || "";
      if (action === "show_map" || action === "map") return onShowMap && onShowMap();
      if (action === "find_part" || action === "parts" || action === "market") return onFindPart && onFindPart();
      return onFindService && onFindService();
    };

    return html`
      <div className="ai-message-row ai-message-row-ai">
        <article className="ai-analysis-card">
          <div className="ai-analysis-topline">
            <span>AI ANALYSIS</span>
            <span className="ai-analysis-dot"></span>
          </div>
          <h2 className="text-2xl font-bold mt-3" style=${{ color: "var(--drivex-white)", letterSpacing: "-0.03em" }}>
            ${response?.title || "AI рекомендация DriveX"}
          </h2>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-light-silver)", lineHeight: "1.7" }}>
            ${response?.summary || "Я подготовил предварительный разбор по описанию."}
          </p>
          <div className="ai-analysis-sections">
            ${sections.map(
              (section) => html`
                <section key=${section.title} className="ai-analysis-section">
                  <h3>${section.title}</h3>
                  <div className="space-y-2">
                    ${(section.items || []).map(
                      (item) => html`<div key=${item} className="ai-analysis-item"><span></span><p>${item}</p></div>`
                    )}
                  </div>
                </section>
              `
            )}
            <section className="ai-analysis-section">
              <h3>Срочность</h3>
              <p className="ai-urgency-text">${urgency}</p>
              ${response?.recommendation ? html`<p className="ai-recommendation-text">${response.recommendation}</p>` : null}
            </section>
          </div>
          <div className="ai-analysis-actions">
            <button type="button" className="ai-find-service" onClick=${() => handleCta(primaryCta)}>
              ${primaryCta?.label || "Найти сервис"}
            </button>
            <button type="button" className="ai-map-link" onClick=${() => handleCta(secondaryCta)}>
              ${secondaryCta?.label || "Показать на карте"}
            </button>
          </div>
        </article>
      </div>
    `;
  }

  function AIPremiumThinkingCard() {
    return html`
      <div className="ai-message-row ai-message-row-ai">
        <div className="ai-thinking-card">
          <div className="ai-thinking-orb"></div>
          <div className="min-w-0">
            <p className="ai-thinking-label">AI ANALYSIS IN PROGRESS</p>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)" }}>
              Анализируем симптомы и подбираем лучший сценарий
            </p>
            <div className="ai-shimmer-lines" aria-hidden="true"><span></span><span></span></div>
          </div>
        </div>
      </div>
    `;
  }

  function AIPremiumSuggestionChip({ label, onClick }) {
    return html`<button type="button" className="ai-feed-chip" onClick=${onClick}>${label}</button>`;
  }

  function AIPremiumInputBar({ value, disabled, suggestions = [], onChange, onSend, onSuggestion }) {
    return html`
      <div className="ai-input-shell">
        ${suggestions.length
          ? html`<div className="ai-input-suggestions">
              ${suggestions.map(
                (item, index) => html`<button
                  key=${item.label}
                  type="button"
                  className="ai-input-suggestion"
                  style=${{ animationDelay: `${index * 55}ms` }}
                  disabled=${disabled}
                  onClick=${() => onSuggestion && onSuggestion(item)}
                >
                  ${item.label}
                </button>`
              )}
            </div>`
          : null}
        <form
          className="ai-input-console"
          onSubmit=${(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <textarea
            className="ai-console-input"
            rows="1"
            value=${value}
            placeholder="Например: машина не заводится утром"
            disabled=${disabled}
            onInput=${(event) => onChange(event.target.value)}
          ></textarea>
          <button type="submit" className="ai-send-button" disabled=${disabled || !String(value || "").trim()} aria-label="Отправить">
            <${Icon} name="play" size=${18} />
          </button>
        </form>
      </div>
    `;
  }

  function AIAssistantScreen({ profile, activeCarId, maintenance, serviceDirectory }) {
    const aiService = window.DrivexAIAssistService || null;
    const scrollRef = useRef(null);
    const latestRequestRef = useRef("");
    const activeCar = findGarageCar(activeCarId) || garageCars[0] || null;
    const carName = activeCar?.name || "BMW X5";
    const carMileage = activeCar?.mileage || "54 200 км";
    const nearbyPool =
      serviceDirectory && Array.isArray(serviceDirectory.nearbyServices)
        ? serviceDirectory.nearbyServices
        : nearbyServices.map((item) => decorateServiceRecord(item));
    const [messages, setMessages] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    useEffect(() => {
      const target = scrollRef.current;
      if (!target) return;
      target.scrollTop = target.scrollHeight;
    }, [messages.length, loading]);

    function buildAIInput(message, scenarioType) {
      if (aiService && typeof aiService.buildInput === "function") {
        return aiService.buildInput({
          userMessage: message,
          scenarioType,
          activeCar,
          maintenance,
          location: { city: "Худжанд" },
          locale: "ru-RU"
        });
      }
      return {
        userMessage: message,
        scenarioType,
        vehicle: {
          make: carName.split(" ")[0] || "",
          model: carName.split(" ").slice(1).join(" "),
          year: activeCar?.year || "",
          mileage: Number(String(carMileage).replace(/[^\d]/g, "")) || 0
        },
        location: { city: "Худжанд" },
        locale: "ru-RU"
      };
    }

    function fallbackResponse(message, scenarioType) {
      if (aiService && typeof aiService.analyzeQuery === "function") {
        return aiService.analyzeQuery(message, {
          activeCar,
          nearbyServices: nearbyPool,
          maintenance,
          profile,
          scenarioType
        });
      }
      return {
        title: "AI Assist",
        summary: "Не удалось получить ответ. Рекомендуется очная диагностика в сервисе.",
        sections: [
          { title: "Возможные причины", items: ["симптом требует проверки"] },
          { title: "Что сделать сейчас", items: ["попробовать ещё раз", "обратиться в сервис"] }
        ],
        urgencyText: "Средняя. Лучше не откладывать, если проблема повторяется.",
        recommendation: "Рекомендуется очная диагностика в сервисе"
      };
    }

    function sendMessage(message = query, scenarioType = "diagnostic") {
      const text = String(message || "").trim();
      if (!text || loading || !aiService) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          role: "user",
          text
        }
      ]);
      setQuery("");
      setLoading(true);
      setAiError("");

      const startedAt = Date.now();
      const requestId = `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      latestRequestRef.current = requestId;
      const input = buildAIInput(text, scenarioType);
      const request =
        typeof aiService.askDriveXAI === "function"
          ? aiService.askDriveXAI(input)
          : Promise.resolve(fallbackResponse(text, scenarioType));

      Promise.resolve(request)
        .then((response) => {
          const remaining = Math.max(0, 760 - (Date.now() - startedAt));
          window.setTimeout(() => {
            if (latestRequestRef.current !== requestId) return;
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                role: "ai",
                response
              }
            ]);
            setLoading(false);
          }, remaining);
        })
        .catch(() => {
          const response = fallbackResponse(text, scenarioType);
          window.setTimeout(() => {
            if (latestRequestRef.current !== requestId) return;
            setAiError("Не удалось получить ответ. Показал безопасную рекомендацию.");
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                role: "ai",
                response
              }
            ]);
            setLoading(false);
          }, 700);
        });
    }

    const hasConversation = messages.length > 0 || loading;
    const latestAIMessage = [...messages].reverse().find((item) => item.role === "ai" && item.response);
    const responseSuggestions = latestAIMessage?.response?.suggestions?.length
      ? latestAIMessage.response.suggestions
      : latestAIMessage?.response?.raw?.suggestions || [];
    const inputSuggestions = !hasConversation
      ? [
          { label: "Не заводится утром", message: "Машина не заводится утром", scenario: "diagnostic" },
          { label: "Стук в подвеске", message: "Стук в подвеске", scenario: "diagnostic" },
          { label: "Что скоро обслужить?", message: "Что скоро обслужить?", scenario: "maintenance" }
        ]
      : !loading && responseSuggestions.length
        ? responseSuggestions.slice(0, 3).map((label) => ({
            label,
            message: label,
            scenario: "diagnostic"
          }))
      : !loading
        ? [
            { label: "Понять слова мастера", message: "На СТО сказали менять сайлентблок и амортизатор", scenario: "explain_service" },
            { label: "Найти сервис", message: "Подбери сервис рядом", scenario: "find_service" },
            { label: "Что делать дальше?", message: "Что делать дальше?", scenario: "diagnostic" }
          ]
        : [];

    return html`
      <div className="ai-premium-screen">
        <div className="ai-premium-bg"></div>
        <${AIPremiumHeader} />
        <main ref=${scrollRef} className="ai-feed">
          ${!hasConversation
            ? html`<${AIPremiumEmptyState} />`
            : html`<div className="ai-conversation">
                <div className="ai-car-context"><span>${carName}</span><span>${carMileage}</span></div>
                ${messages.map((message) =>
                  message.role === "user"
                    ? html`<${AIPremiumUserMessage} key=${message.id} text=${message.text} />`
                    : html`<${AIPremiumAIMessage}
                        key=${message.id}
                        response=${message.response}
                        onFindService=${() => navigateToHash("/services")}
                        onShowMap=${() => navigateToHash("/map")}
                        onFindPart=${() => navigateToHash("/market")}
                      />`
                )}
                ${loading ? html`<${AIPremiumThinkingCard} />` : null}
                ${aiError ? html`<p className="ai-error-text">${aiError}</p>` : null}
              </div>`}
        </main>
        <${AIPremiumInputBar}
          value=${query}
          disabled=${loading}
          suggestions=${inputSuggestions}
          onChange=${setQuery}
          onSend=${() => sendMessage(query, "diagnostic")}
          onSuggestion=${(item) => sendMessage(item.message, item.scenario)}
        />
      </div>
    `;
  }

  function DashboardScreen({ notificationsCount, profileName, serviceDirectory, activeCarId, maintenance }) {
    const safeName = String(profileName || "").trim();
    const firstName = safeName ? safeName.split(/\s+/)[0] : "Водитель";
    const nearbyList =
      serviceDirectory && Array.isArray(serviceDirectory.nearbyServices)
        ? serviceDirectory.nearbyServices
        : nearbyServices.map((item) => decorateServiceRecord(item));
    const servicePool =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item));
    const activeCar = findGarageCar(activeCarId);
    const personalizedServices = getPersonalizedServices(servicePool, activeCarId).slice(0, 2);
    const featuredService = personalizedServices[0] || servicePool[0] || nearbyList[0];
    const secondaryService =
      nearbyList.find((service) => String(service.id) !== String(featuredService?.id)) || personalizedServices[1] || nearbyList[1];
    const nearbyPreview = nearbyList.slice(0, 3);
    const reminders = buildSmartCareTasks(maintenance, activeCarId);

    return html`
      <div className="home-redesign min-h-screen">
        <div className="home-redesign-bg"></div>
        <div className="home-redesign-inner">
          <header className="home-redesign-header">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="home-brand text-glow-cyan"
                  style=${{ color: "var(--drivex-white)" }}
                >
                  DRIVEX
                </h1>
                <p className="home-greeting" style=${{ color: "var(--drivex-silver)" }}>
                  Добро пожаловать, ${firstName}
                </p>
              </div>

              <a
                href="#/notifications"
                className="home-notification"
                aria-label="Уведомления"
              >
                <span style=${{ color: "var(--drivex-white)" }}>
                  <${Icon} name="bell" size=${18} />
                </span>
                ${notificationsCount > 0
                  ? html`<span
                      className="absolute top-2 right-2 w-2 h-2 rounded-full"
                      style=${{ background: "var(--drivex-danger)" }}
                    ></span>`
                  : null}
              </a>
            </div>

            <${SmartDashboard}
              profileName=${profileName}
              activeCarId=${activeCarId}
              maintenance=${maintenance}
            />
          </header>

          <main className="home-redesign-content">
            <section className="home-section">
              <h2 className="home-section-title">Быстрые действия</h2>
              <div className="home-quick-grid">
                ${quickActions.map(
                  (action) => html`
                    <a key=${action.path} href=${`#${action.path}`} className="home-quick-action">
                      <span
                        className="home-quick-icon"
                        style=${{
                          background: alphaBg(action.color, 0.14),
                          color: action.color
                        }}
                      >
                        <${Icon} name=${action.icon} size=${18} />
                      </span>
                      <span>${action.label}</span>
                    </a>
                  `
                )}
              </div>
            </section>

            ${featuredService
              ? html`<section className="home-section">
                  <div className="home-section-row">
                    <div>
                      <h2 className="home-section-title">Для твоей машины</h2>
                      <p className="home-section-subtitle">
                        ${activeCar ? `${activeCar.name} · ${activeCar.mileage}` : "Подобрано по рейтингу и расстоянию"}
                      </p>
                    </div>
                    <a href="#/services" className="home-section-link">Все сервисы</a>
                  </div>

                  <a href=${`#/service/${featuredService.id}`} className="home-featured-service">
                    <div className="home-featured-image">
                      <img src=${featuredService.image} alt=${featuredService.name} loading="lazy" />
                      <span className="home-image-badge">Лучший вариант рядом</span>
                    </div>
                    <div className="home-featured-body">
                      <div className="home-featured-top">
                        <div>
                          <p className="home-service-category">${featuredService.category || featuredService.type}</p>
                          <h3>${featuredService.name}</h3>
                        </div>
                        <span className="home-save-icon"><${Icon} name="scan" size=${16} /></span>
                      </div>
                      <div className="home-meta-line">
                        <span>${featuredService.distance || "1.2 км"}</span>
                        <span className="home-rating"><${Icon} name="star" size=${11} /> ${featuredService.smartRating || featuredService.rating}</span>
                        <span>${featuredService.reviews || 120} отзывов</span>
                      </div>
                      <div className="home-featured-chips">
                        <span><${Icon} name="car" size=${13} /> Подходит для ${activeCar?.name || "вашего авто"}</span>
                        <span><${Icon} name="coins" size=${13} /> ${featuredService.price || "Честные цены"}</span>
                      </div>
                      <div className="home-featured-footer">
                        <span className="home-open-dot">Открыто сейчас · Ответ за 5 минут</span>
                        <span className="home-book-button">Записаться</span>
                      </div>
                    </div>
                  </a>

                  ${secondaryService
                    ? html`<a href=${`#/service/${secondaryService.id}`} className="home-secondary-service">
                        <img src=${secondaryService.image} alt=${secondaryService.name} loading="lazy" />
                        <div>
                          <p>${secondaryService.category || secondaryService.type}</p>
                          <h3>${secondaryService.name}</h3>
                          <span>${secondaryService.distance} · ${secondaryService.smartRating || secondaryService.rating}</span>
                        </div>
                        <span>Смотреть →</span>
                      </a>`
                    : null}
                </section>`
              : null}

            <section className="home-section">
              <div className="home-section-row">
                <h2 className="home-section-title">Рядом с вами</h2>
                <a href="#/map" className="home-section-link">Показать на карте</a>
              </div>

              <div className="home-nearby-list">
                ${nearbyPreview.map(
                  (service) => html`
                    <a key=${service.id} href=${`#/service/${service.id}`} className="home-nearby-card">
                      <span className="home-nearby-icon">
                        <${Icon} name=${service.category === "Шиномонтаж" ? "tire" : service.category === "Детейлинг" ? "wash" : "wrench"} size=${18} />
                      </span>
                      <div className="home-nearby-main">
                        <h3>${service.name}</h3>
                        <p>${service.type} · ${service.distance} · <span>${service.available ? "Открыто" : "Закрыто"}</span></p>
                      </div>
                      <div className="home-nearby-side">
                        <span><${Icon} name="star" size=${10} /> ${service.smartRating || service.rating}</span>
                        <b>Подробнее</b>
                      </div>
                    </a>
                  `
                )}
              </div>
            </section>

            <section className="home-section home-reminders-section">
              <div className="home-section-row">
                <h2 className="home-section-title">Напоминания</h2>
                <a href="#/smart-care" className="home-section-link">Все задачи</a>
              </div>

              <div className="home-reminder-grid">
                ${reminders.length
                  ? reminders.map((reminder, idx) => html`
                    <div key=${idx} className="home-reminder-card">
                      <button type="button" aria-label="Скрыть">×</button>
                      <span className="home-reminder-icon">
                        <${Icon} name=${idx === 0 ? "scan" : "calendar"} size=${18} />
                      </span>
                      <h3>${reminder.task}</h3>
                      <p>${reminder.dueDate}</p>
                      <a href="#/smart-care">${idx === 0 ? "Проверить сервис" : "Найти рядом"}</a>
                    </div>
                  `)
                  : html`
                      <div className="home-reminder-card">
                        <span className="home-reminder-icon">
                          <${Icon} name="car" size=${18} />
                        </span>
                        <h3>${garageCars.length ? "Нет срочных задач" : "Добавьте автомобиль"}</h3>
                        <p>${garageCars.length ? "Журнал обслуживания чистый" : "Умный уход начнёт работать после добавления машины"}</p>
                        <a href="#/garage">${garageCars.length ? "Открыть гараж" : "Добавить авто"}</a>
                      </div>
                    `}
              </div>
            </section>
          </main>
        </div>
      </div>
    `;
  }

  function MapScreen({ serviceDirectory }) {
    useEffect(() => {
      let instance = null;
      let cancelled = false;
      let retryId = 0;

      const mountMap = () => {
        if (cancelled || instance) return;
        const mapModule = window.DrivexMapScreen;
        if (!mapModule || typeof mapModule.mount !== "function") {
          retryId = window.setTimeout(mountMap, 120);
          return;
        }
        try {
          instance = mapModule.mount({
            containerId: "map-container",
            serviceDirectory
          });
        } catch (error) {
          const container = document.getElementById("map-container");
          if (container) {
            container.innerHTML = `
              <div class="dx-map-fallback">
                <h2>Карта временно недоступна</h2>
                <p>${String(error?.message || "Не удалось запустить карту.")}</p>
              </div>
            `;
          }
        }
      };

      mountMap();

      return () => {
        cancelled = true;
        window.clearTimeout(retryId);
        if (instance && typeof instance.destroy === "function") instance.destroy();
      };
    }, [serviceDirectory]);

    return html`
      <div id="map-container" className="dx-map-container" aria-label="Карта сервисов DriveX"></div>
    `;
  }

  function ServicesScreen({ serviceDirectory, activeCarId, serviceCrmReady = false, serviceCenterName = "" }) {
    const toast = useToast();
    const [serviceSearchQuery, setServiceSearchQuery] = useState("");
    const servicesList =
      serviceDirectory && Array.isArray(serviceDirectory.featuredServices)
        ? serviceDirectory.featuredServices.map((item) => decorateServiceRecord(item))
        : recommendedServices.map((item) => decorateServiceRecord(item));
    const servicePool =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services.map((item) => decorateServiceRecord(item))
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item));
    const activeCar = findGarageCar(activeCarId);
    const personalizedServices = getPersonalizedServices(servicePool, activeCarId).slice(0, 3);

    const getServiceSavingsLabel = (service) => {
      const priceScore = clampServiceMetric(service?.honestPriceScore, 82);
      const savings = Math.max(35, Math.round(((priceScore - 58) * 2.1) / 5) * 5);
      return `${savings}+ TJS`;
    };

    const getCompactServiceKind = (service) => {
      const raw = String(service?.category || service?.type || "СТО").trim();
      const lower = raw.toLowerCase();
      if (!raw) return "СТО";
      if (lower.includes("сто")) return "СТО";
      if (lower.includes("шин")) return "Шины";
      if (lower.includes("детейл")) return "Детейлинг";
      if (lower.includes("мойк")) return "Мойка";
      if (lower.includes("элект")) return "Электрика";
      if (lower.includes("диагност")) return "Диагностика";
      return raw.split(" ").slice(0, 2).join(" ");
    };

    const getCompactServiceSubtitle = (service) =>
      [getCompactServiceKind(service), service?.distance, service?.city].filter(Boolean).join(" • ");

    const openServiceBooking = (event, serviceId) => {
      event.preventDefault();
      event.stopPropagation();
      navigateToHash(getServiceBookingPath(serviceId));
    };

    const compareService = (event, serviceName) => {
      event.preventDefault();
      event.stopPropagation();
      toast.push(`Сравнение ${serviceName} скоро добавим`);
    };

    const normalizedSearchQuery = normalizeServiceCategoryText(serviceSearchQuery);
    const serviceMatchesSearch = (service) => {
      if (!normalizedSearchQuery) return true;
      const categoryMeta = getServiceCategoryMeta(service?.categoryId || service?.category || service?.type);
      const searchableText = normalizeServiceCategoryText([
        service?.name,
        service?.category,
        service?.categoryLabel,
        service?.type,
        categoryMeta?.name,
        service?.city,
        service?.address,
        service?.locationLabel,
        service?.description,
        service?.tagline,
        service?.price,
        service?.workingHours
      ].filter(Boolean).join(" "));
      return searchableText.includes(normalizedSearchQuery);
    };

    const renderCompactServiceCard = (service, options = {}) => {
      const tags = Array.isArray(service?.primaryBadges) ? service.primaryBadges.slice(0, 2) : [];
      if (options.recommended && tags.length < 3) {
        tags.push({
          id: "recommended",
          label: "Рекомендуем",
          color: "var(--drivex-neon-cyan)"
        });
      }

      return html`
        <a
          key=${`${options.keyPrefix || "service"}-${service.id}`}
          href=${`#/service/${service.id}`}
          className="relative block overflow-hidden rounded-[24px] p-4 transition-all hover:scale-[1.01]"
          style=${{
            background: "linear-gradient(180deg, rgba(18, 24, 38, 0.98) 0%, rgba(12, 18, 29, 0.98) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 16px 28px rgba(0, 0, 0, 0.16)"
          }}
        >
          <div
            className="absolute -top-10 -right-10 w-24 h-24 rounded-full pointer-events-none"
            style=${{
              background: "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0) 72%)"
            }}
          ></div>

          <div className="relative flex items-start gap-3">
            <div
              className="rounded-[12px] overflow-hidden flex-shrink-0"
              style=${{
                width: "88px",
                height: "88px",
                minWidth: "88px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              ${service.image
                ? html`<img
                    key=${getServiceImageRenderKey(service)}
                    src=${service.image}
                    alt=${service.name}
                    className="w-full h-full object-cover"
                  />`
                : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3
                  className="font-bold text-[17px] leading-tight truncate"
                  style=${{ color: "var(--drivex-white)", maxWidth: "65%" }}
                >
                  ${service.name}
                </h3>
                <span
                  className="inline-flex items-center gap-1 text-[15px] font-semibold whitespace-nowrap"
                  style=${{ color: "var(--drivex-warning)" }}
                >
                  <${Icon} name="star" size=${12} />
                  ${service.smartRating}
                </span>
              </div>

              <p className="text-[12px] mt-1 truncate" style=${{ color: "var(--drivex-silver)" }}>
                ${getCompactServiceSubtitle(service)}
              </p>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-4 flex-wrap text-[12px]">
                  <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-silver)" }}>
                    <${Icon} name="clock" size=${12} />
                    ${service.averageRepairTime || "25 мин"}
                  </span>
                  <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-warning)" }}>
                    <${Icon} name="coins" size=${12} />
                    ${getServiceSavingsLabel(service)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[12px]">
                  <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-neon-cyan)" }}>
                    <${Icon} name="repeat" size=${12} />
                    ${service.repeatClientsPercent}% возврат
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            ${tags.slice(0, 3).map((badge) => html`
              <span
                key=${badge.id}
                className="px-2.5 py-1.5 rounded-full text-[10px] font-semibold"
                style=${{
                  background: `linear-gradient(135deg, ${alphaBg(badge.color, 0.2)} 0%, ${alphaBg(badge.color, 0.12)} 100%)`,
                  color: badge.color,
                  border: `1px solid ${alphaBg(badge.color, 0.16)}`
                }}
              >
                ${badge.label}
              </span>
            `)}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span
              role="button"
              tabIndex="0"
              className="inline-flex items-center justify-center px-4 py-3 rounded-full text-sm font-semibold"
              style=${{
                color: "var(--drivex-white)",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
              onClick=${(event) => compareService(event, service.name)}
            >
              Сравнить
            </span>

            <span
              role="button"
              tabIndex="0"
              className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-full text-sm font-semibold dx-btn"
              style=${{ boxShadow: "0 12px 24px rgba(14, 165, 233, 0.2)" }}
              onClick=${(event) => openServiceBooking(event, service.id)}
            >
              Записаться
            </span>
          </div>
        </a>
      `;
    };

    const searchedServices = servicePool.filter(serviceMatchesSearch);
    const searchedServicesList = servicesList.filter(serviceMatchesSearch);
    const searchedPersonalizedServices = personalizedServices.filter(serviceMatchesSearch);
    const topService = searchedPersonalizedServices[0] || searchedServicesList[0] || searchedServices[0];
    const visibleServices = dedupeServicesById(normalizedSearchQuery ? [
      ...searchedPersonalizedServices,
      ...searchedServicesList,
      ...searchedServices
    ] : [
      ...personalizedServices,
      ...servicesList,
      ...servicePool
    ]).slice(0, 6);
    const categoriesWithRuntimeServices = serviceCategories
      .map((category) => ({
        ...category,
        serviceCount: servicePool.filter((service) => service.categoryId === category.id).length
      }))
      .filter((category) => category.serviceCount > 0);
    const quickFilters = [
      { id: "all", label: "Все", icon: "layers", active: true },
      ...categoriesWithRuntimeServices.slice(0, 5).map((category) => ({
        id: category.id,
        label: category.name,
        icon: category.icon
      }))
    ];
    const crmStats = [
      { label: "Записи", value: "24/7" },
      { label: "Клиенты", value: "CRM" },
      { label: "Склад", value: "учет" }
    ];

    const renderServiceRow = (service, index) => {
      const isTop = index === 0;
      const meta = [
        service.distance,
        service.workingHours,
        service.city
      ].filter(Boolean).slice(0, 3).join(" · ");
      const primaryBadge = isTop ? "ТОП" : getCompactServiceKind(service);

      return html`
        <a key=${`services-redesign-${service.id}`} href=${`#/service/${service.id}`} className="services-redesign-card">
          <div className="services-redesign-photo">
            ${service.image
              ? html`<img
                  key=${getServiceImageRenderKey(service)}
                  src=${service.image}
                  alt=${service.name}
                />`
              : html`<span><${Icon} name="wrench" size=${24} /></span>`}
            <b>${primaryBadge}</b>
          </div>

          <div className="services-redesign-card-body">
            <div className="services-redesign-card-head">
              <div className="min-w-0">
                <h3>${service.name}</h3>
                <p>${meta || getCompactServiceSubtitle(service)}</p>
              </div>
              <button
                type="button"
                className="services-redesign-save"
                aria-label="Сохранить сервис"
                onClick=${(event) => compareService(event, service.name)}
              >
                <${Icon} name="star" size=${16} />
              </button>
            </div>

            <div className="services-redesign-meta">
              <span><${Icon} name="star" size=${11} /> ${service.smartRating || service.rating || "4.8"}</span>
              <span>${service.reviews || "200+"} отзывов</span>
              <span>${service.boxesCount || 3} бокса</span>
            </div>

            <div className="services-redesign-card-foot">
              <strong>от ${service.averagePrice || service.priceFrom || "250"} TJS</strong>
              <button
                type="button"
                onClick=${(event) => openServiceBooking(event, service.id)}
              >
                Записаться
              </button>
            </div>
          </div>
        </a>
      `;
    };

    const renderCategoryTile = (category) => html`
      <a key=${category.id} href=${`#/category/${category.id}`} className="services-redesign-category">
        <span style=${{ color: category.color, background: alphaBg(category.color, 0.16) }}>
          <${Icon} name=${category.icon} size=${18} />
        </span>
        <b>${category.name}</b>
      </a>
    `;

    const submitServiceSearch = (event) => {
      event.preventDefault();
      if (!normalizedSearchQuery) {
        toast.push("Введите название сервиса или услуги");
        return;
      }
      if (visibleServices[0]) {
        toast.push(`Найдено сервисов: ${visibleServices.length}`);
        return;
      }
      toast.push(`По запросу «${serviceSearchQuery.trim()}» ничего не найдено`);
    };

    return html`
      <div className="services-redesign-page">
        <header className="services-redesign-hero">
          <div className="services-redesign-hero-copy">
            <p>СЕРВИСЫ ДЛЯ АВТО</p>
            <h1>Найдите лучший сервис рядом</h1>
            <span>${activeCar ? `${activeCar.name} · ${activeCar.mileage}` : "Запись, диагностика и ремонт в Худжанде"}</span>
          </div>
          <div className="services-redesign-car" aria-hidden="true"></div>
        </header>

        <form className="services-redesign-searchbar" onSubmit=${submitServiceSearch}>
          <span><${Icon} name="search" size=${17} /></span>
          <input
            value=${serviceSearchQuery}
            placeholder="Название или услуга..."
            onInput=${(event) => setServiceSearchQuery(event.target.value)}
          />
          <button type="submit">Найти</button>
        </form>

        <nav className="services-redesign-filters" aria-label="Фильтры сервисов">
          ${quickFilters.map((filter) => html`
            <a
              key=${filter.id}
              href=${filter.id === "all" ? "#/services" : `#/category/${filter.id}`}
              data-active=${filter.active ? "true" : "false"}
            >
              <${Icon} name=${filter.icon} size=${15} />
              ${filter.label}
            </a>
          `)}
        </nav>

        <main className="services-redesign-content">
          <section className="services-redesign-section">
            <div className="services-redesign-section-head">
              <div>
                <h2>Популярные сервисы</h2>
                <p>${topService ? `Лучший выбор: ${topService.name}` : "Проверенные сервисы рядом"}</p>
              </div>
              <a href="#/map">Смотреть все</a>
            </div>

            <div className="services-redesign-list">
              ${visibleServices.length
                ? visibleServices.map((service, index) => renderServiceRow(service, index))
                : html`
                    <div className="glass-card-light rounded-2xl p-5">
                      <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        Ничего не найдено
                      </p>
                      <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                        Попробуйте написать тип услуги: автомойка, шиномонтаж, диагностика или ремонт.
                      </p>
                    </div>
                  `}
            </div>
          </section>

          <section className="services-redesign-crm">
            <div>
              <p>ДЛЯ СЕРВИСОВ</p>
              <h2>Получите свой сервис на DriveX</h2>
              <span>
                ${serviceCrmReady
                  ? `${serviceCenterName || "Ваш сервис"} уже подключен. Откройте кабинет.`
                  : "Записи, клиенты и заявки в одном кабинете."}
              </span>
              <a href="#/service-crm">${serviceCrmReady ? "Войти в CRM" : "Добавить сервис"}</a>
            </div>
            <aside>
              <b>DriveX</b>
              ${crmStats.map((item) => html`
                <span key=${item.label}>
                  <small>${item.label}</small>
                  <strong>${item.value}</strong>
                </span>
              `)}
            </aside>
          </section>

          <section className="services-redesign-section">
            <div className="services-redesign-section-head">
              <div>
                <h2>Категории услуг</h2>
                <p>Быстрый выбор без лишних шагов</p>
              </div>
            </div>
            <div className="services-redesign-categories">
              ${serviceCategories.map(renderCategoryTile)}
            </div>
          </section>
        </main>
      </div>
    `;

    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <div className="pt-12 pb-6 px-6" style=${{ background: "var(--drivex-graphite)" }}>
          <h1
            className="text-3xl font-bold mb-6 text-glow-cyan"
            style=${{ color: "var(--drivex-white)" }}
          >
            Автосервисы
          </h1>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style=${{ color: "var(--drivex-silver)" }}
            >
              <${Icon} name="search" size=${20} />
            </span>
            <input
              className="w-full pl-12 pr-4 py-4 rounded-xl glass-card-light outline-none dx-input"
              placeholder="Поиск сервисов..."
            />
          </div>
        </div>

        <div className="px-6 py-6">
          ${activeCar && personalizedServices.length
            ? html`<div
                className="relative overflow-hidden rounded-[32px] p-5 mb-6"
                style=${{
                  background: "linear-gradient(180deg, rgba(14, 19, 31, 0.98) 0%, rgba(9, 15, 26, 0.98) 100%)",
                  border: "1px solid rgba(56, 189, 248, 0.16)",
                  boxShadow: "0 28px 56px rgba(0, 0, 0, 0.22)"
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style=${{
                    background:
                      "radial-gradient(circle at 18% 10%, rgba(34, 211, 238, 0.14) 0%, rgba(34, 211, 238, 0) 28%), radial-gradient(circle at 88% 8%, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0) 24%), radial-gradient(rgba(255, 255, 255, 0.09) 0.8px, transparent 0.8px)",
                    backgroundSize: "auto, auto, 18px 18px",
                    opacity: 0.72
                  }}
                ></div>

                <div
                  className="absolute left-8 top-[104px] w-28 h-[2px] rounded-full pointer-events-none"
                  style=${{
                    background: "linear-gradient(90deg, rgba(56, 189, 248, 0.85) 0%, rgba(56, 189, 248, 0) 100%)"
                  }}
                ></div>

                <div className="relative">
                  <h2 className="text-[29px] font-bold leading-tight" style=${{ color: "var(--drivex-white)" }}>
                    Лучшие сервисы для ${activeCar.name}
                  </h2>
                  <p className="text-sm mt-2 max-w-[280px]" style=${{ color: "var(--drivex-silver)" }}>
                    Подобрали подходящие сервисы быстрее и выгоднее по смарт-рейтингу
                  </p>

                  <div
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold mt-5"
                    style=${{
                      background: "rgba(6, 182, 212, 0.14)",
                      color: "var(--drivex-neon-cyan)",
                      border: "1px solid rgba(6, 182, 212, 0.16)",
                      boxShadow: "0 10px 24px rgba(6, 182, 212, 0.14)"
                    }}
                  >
                    <${Icon} name="bolt" size=${14} />
                    ${personalizedServices.length} варианта
                  </div>

                  <div className="space-y-3 mt-5">
                    ${personalizedServices.map((service, index) =>
                      renderCompactServiceCard(service, {
                        keyPrefix: "personalized",
                        recommended: index === 0
                      })
                    )}
                  </div>
                </div>
              </div>`
            : null}

          <div
            className="relative overflow-hidden rounded-[34px] p-6 mb-6"
            style=${{
              background: "linear-gradient(145deg, rgba(8, 24, 40, 0.98) 0%, rgba(15, 23, 42, 0.98) 62%, rgba(5, 20, 34, 1) 100%)",
              border: "1px solid rgba(6, 182, 212, 0.16)",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.22)"
            }}
          >
            <div
              className="absolute -top-16 -right-10 w-40 h-40 rounded-full pointer-events-none"
              style=${{
                background: "radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, rgba(6, 182, 212, 0) 72%)"
              }}
            ></div>
            <div
              className="absolute -bottom-12 left-8 w-36 h-36 rounded-full pointer-events-none"
              style=${{
                background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0) 74%)"
              }}
            ></div>

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  ДЛЯ СЕРВИСОВ
                </p>
                <h2
                  className="text-[32px] font-bold mt-3"
                  style=${{
                    color: "var(--drivex-white)",
                    lineHeight: "1.04",
                    letterSpacing: "-0.03em"
                  }}
                >
                  Отдельный
                  <br />
                  Service CRM
                </h2>
                <p className="text-sm mt-4 max-w-[360px]" style=${{ color: "var(--drivex-silver)", lineHeight: 1.75 }}>
                  Регистрация сервиса, учёт клиентов и машин, ремонты, склад, финансы и запись по боксам.
                </p>
              </div>

              <div
                className="w-16 h-16 rounded-[24px] flex items-center justify-center flex-shrink-0"
                style=${{
                  background: "linear-gradient(145deg, rgba(6, 182, 212, 0.22) 0%, rgba(6, 182, 212, 0.1) 100%)",
                  color: "var(--drivex-neon-cyan)",
                  border: "1px solid rgba(6, 182, 212, 0.12)"
                }}
              >
                <${Icon} name="wrench" size=${28} />
              </div>
            </div>

            <div className="relative flex flex-wrap gap-2 mt-5">
              ${["Клиенты", "Ремонты", "Склад", "Финансы"].map((chip) => html`
                <span
                  key=${chip}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold"
                  style=${{
                    background: "rgba(255, 255, 255, 0.045)",
                    color: "var(--drivex-white)",
                    border: "1px solid rgba(255, 255, 255, 0.04)"
                  }}
                >
                  ${chip}
                </span>
              `)}
            </div>

            <div className="relative flex items-end justify-between gap-4 flex-wrap mt-6">
              <div>
                <p className="text-xs font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  7 разделов CRM
                </p>
                <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Для владельца сервиса и команды
                </p>
              </div>

              <a
                href="#/service-crm"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-sm font-bold"
                style=${{
                  minWidth: "196px",
                  background: "linear-gradient(135deg, #1fb7f3 0%, #0ea5e9 100%)",
                  color: "var(--drivex-white)",
                  boxShadow: "0 16px 30px rgba(14, 165, 233, 0.28)"
                }}
              >
                <span>Открыть CRM</span>
                <${Icon} name="chevron-left" size=${16} style=${{ transform: "rotate(180deg)" }} />
              </a>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
            Категории услуг
          </h2>
          <div className="grid grid-cols-2 gap-4">
            ${serviceCategories.map(
              (c) => html`
                <a
                  key=${c.id}
                  href=${`#/category/${c.id}`}
                  className="glass-card-light rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-105"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style=${{
                      background: alphaBg(c.color, 0.2),
                      color: c.color
                    }}
                  >
                    <${Icon} name=${c.icon} size=${28} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style=${{ color: "var(--drivex-white)" }}>
                      ${c.name}
                    </h3>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      ${c.count}
                    </p>
                  </div>
                </a>
              `
            )}
          </div>
        </div>

        <div className="px-6 py-6" id="services-recommended">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Рекомендуем
            </h2>
            <a href="#/map" className="text-sm font-medium" style=${{ color: "var(--drivex-neon-cyan)" }}>
              На карте
            </a>
          </div>

          <div className="space-y-4">
            ${servicesList.map((service, index) =>
              renderCompactServiceCard(service, {
                keyPrefix: "recommended",
                recommended: index === 0
              })
            )}
          </div>
        </div>
      </div>
    `;
  }

  function ServiceRequestStatusTimeline({ status = "accepted" }) {
    const currentIndex = Math.max(
      0,
      serviceRequestStatusOptions.findIndex((item) => item.id === normalizeServiceRequestStatusId(status))
    );

    return html`
      <div className="flex items-start justify-between gap-3">
        ${serviceRequestStatusOptions.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return html`
            <div key=${step.id} className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style=${{
                    background: isActive ? step.color : "rgba(148, 163, 184, 0.22)",
                    boxShadow: isCurrent ? `0 0 0 6px ${alphaBg(step.color, 0.16)}` : "none"
                  }}
                ></span>
                <span
                  className="text-xs font-semibold"
                  style=${{ color: isActive ? "var(--drivex-white)" : "var(--drivex-silver)" }}
                >
                  ${step.label}
                </span>
              </div>
              ${index < serviceRequestStatusOptions.length - 1
                ? html`<div
                    className="mt-3 h-[2px] rounded-full"
                    style=${{
                      background:
                        index < currentIndex ? step.color : "rgba(148, 163, 184, 0.18)"
                    }}
                  ></div>`
                : null}
            </div>
          `;
        })}
      </div>
    `;
  }

  function CartBadge({ count, size = 20, offset = { top: "-4px", right: "-4px" } }) {
    const safeCount = Math.max(0, Number(count) || 0);
    if (!safeCount) return null;

    return html`<span
      className="absolute rounded-full flex items-center justify-center text-xs font-bold"
      style=${{
        top: offset.top,
        right: offset.right,
        minWidth: `${size}px`,
        height: `${size}px`,
        padding: "0 6px",
        background: "var(--drivex-danger)",
        color: "var(--drivex-white)",
        boxShadow: "0 10px 30px rgba(239, 68, 68, 0.35)"
      }}
    >
      ${safeCount > 99 ? "99+" : safeCount}
    </span>`;
  }

  function MarketStoreAvatar({ store, size = 40, rounded = "14px" }) {
    const safeStore = store && typeof store === "object" ? store : null;
    const accent = safeStore?.accent || "var(--drivex-neon-cyan)";
    const label = String(safeStore?.avatar || "DX").slice(0, 2).toUpperCase();

    return html`<div
      className="flex items-center justify-center font-bold flex-shrink-0"
      style=${{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: rounded,
        background: `linear-gradient(135deg, ${alphaBg(accent, 0.4)} 0%, rgba(15, 23, 42, 0.92) 100%)`,
        color: "var(--drivex-white)",
        border: `1px solid ${alphaBg(accent, 0.45)}`
      }}
    >
      ${label}
    </div>`;
  }

  function StoreLabel({ store, deliveryText }) {
    if (!store) return null;

    return html`
      <div className="flex items-center gap-2 mt-3">
        <${MarketStoreAvatar} store=${store} size=${30} rounded="10px" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold" style=${{ color: "var(--drivex-white)" }}>
            ${store.name}
          </p>
          <p style=${{ color: "var(--drivex-silver)", fontSize: "11px" }}>
            ${store.city}${deliveryText ? ` • ${deliveryText}` : ""}
          </p>
        </div>
      </div>
    `;
  }

  function SearchBar({ value, onChange, onToggleFilters, filtersCount }) {
    return html`
      <div className="market-ui-search-row">
        <div className="market-ui-search">
          <span>
            <${Icon} name="search" size=${20} />
          </span>
          <input
            type="search"
            className="dx-input"
            placeholder="Поиск автозапчастей, масел, шин..."
            value=${value}
            onInput=${(e) => onChange && onChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="market-ui-icon-btn"
          onClick=${onToggleFilters}
          aria-label="Фильтры"
        >
          <${Icon} name="filter" size=${20} />
          <${CartBadge} count=${filtersCount} size=${18} offset=${{ top: "6px", right: "6px" }} />
        </button>
      </div>
    `;
  }

  function CategoryRow({ categories, activeCategoryId, onSelectCategory }) {
    return html`
      <div className="market-ui-category-row no-scrollbar">
        ${categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          return html`
            <button
              key=${category.id}
              type="button"
              className=${`market-ui-category ${isActive ? "is-active" : ""}`}
              style=${{ "--market-accent": category.color }}
              onClick=${() =>
                onSelectCategory &&
                onSelectCategory(isActive && category.id !== "all" ? "all" : category.id)}
            >
              <span>
                <${Icon} name=${category.icon} size=${18} />
              </span>
              <b>${category.name}</b>
            </button>
          `;
        })}
      </div>
    `;
  }

  function MarketAppNav({ active = "home", cartCount = 0 }) {
    const items = [
      { id: "home", label: "Главная", icon: "home", path: "/market" },
      { id: "catalog", label: "Каталог", icon: "layers", path: "/marketplace/catalog" },
      { id: "auto", label: "Подбор", icon: "search", path: "/marketplace/auto" },
      { id: "orders", label: "Заказы", icon: "folder", path: "/marketplace/orders" }
    ];

    return html`
      <nav className="market-ui-nav" aria-label="Вкладки маркетплейса">
        ${items.map((item) => {
          const isActive = active === item.id;
          return html`
            <a
              key=${item.id}
              href=${`#${item.path}`}
              className=${`market-ui-nav-item ${isActive ? "is-active" : ""}`}
              aria-current=${isActive ? "page" : "false"}
            >
              <span>${item.label}</span>
            </a>
          `;
        })}
      </nav>
    `;
  }

  function MarketTopBar({ title, subtitle, cartCount = 0, backPath = "", compact = false }) {
    return html`
      <header className=${`market-ui-top ${compact ? "is-compact" : ""}`}>
        <div className="market-ui-title-row">
          ${backPath
            ? html`<a href=${`#${backPath}`} className="market-ui-icon-btn" aria-label="Назад">
                <${Icon} name="chevron-left" size=${19} />
              </a>`
            : null}
          <div className="min-w-0">
            <h1>${title}</h1>
            ${subtitle ? html`<p>${subtitle}</p>` : null}
          </div>
          <a href=${getMarketCartPath()} className="market-ui-icon-btn ml-auto" aria-label="Корзина">
            <${Icon} name="bag" size=${20} />
            <${CartBadge} count=${cartCount} size=${17} offset=${{ top: "-6px", right: "-6px" }} />
          </a>
        </div>
      </header>
    `;
  }

  function MarketSectionTitle({ title, actionLabel, actionPath }) {
    return html`
      <div className="market-ui-section-head">
        <h2>${title}</h2>
        ${actionLabel && actionPath
          ? html`<a href=${`#${actionPath}`}>${actionLabel}</a>`
          : null}
      </div>
    `;
  }

  function PromoBanner({ onShowDeals }) {
    return html`
      <div className="market-ui-promo">
        <div>
          <h2>
            Весенняя распродажа
          </h2>
          <p>
            Скидки на масла, фильтры и расходники до 30%
          </p>
          <button
            type="button"
            onClick=${onShowDeals}
          >
            Смотреть
          </button>
        </div>
        <img
          src="./assets/marketplace/motor-oil-shelf.jpg"
          alt="Масла и фильтры"
          loading="eager"
          decoding="async"
        />
      </div>
    `;
  }

  function ProductCard({ product, onAddToCart }) {
    const [addedPulse, setAddedPulse] = useState(false);
    const addedTimerRef = useRef(null);
    const store = getMarketStore(product.storeId);
    const badgeColor = getMarketBadgeColor(product);
    const discount = getMarketDiscountPercent(product);
    const categoryMeta = marketCategories.find((category) => category.id === product.categoryId);
    const categoryColor = categoryMeta?.color || "var(--drivex-neon-cyan)";

    useEffect(() => {
      return () => {
        if (addedTimerRef.current) {
          window.clearTimeout(addedTimerRef.current);
        }
      };
    }, []);

    const handleAddToCart = useCallback((event) => {
      event.preventDefault();
      event.stopPropagation();
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
      <div className=${`market-ui-product ${addedPulse ? "is-added" : ""}`}>
        <a href=${getMarketProductPath(product.id)} className="market-ui-product-link">
          <div className="market-ui-product-img">
          <img src=${product.image} alt=${product.name} loading="lazy" decoding="async" />

          ${discount
            ? html`<span className="market-ui-sale" style=${{ background: badgeColor }}>
                -${discount}%
              </span>`
            : null}
          </div>

          <div className="market-ui-product-body">
            <p className="market-ui-product-store">${store?.name || "Магазин DRIVEX"}</p>
            <h3>
              ${product.name}
            </h3>

            <div className="market-ui-product-meta">
              <span>${product.rating} (${product.reviews})</span>
              <span>${product.category}</span>
            </div>
          </div>
        </a>

        <div className="market-ui-product-foot">
          <div>
            <strong>${formatTjsPrice(product.price)}</strong>
            ${product.oldPrice
              ? html`<small>
                  ${formatTjsPrice(product.oldPrice)}
                </small>`
              : null}
          </div>
          <button
            type="button"
            className=${addedPulse ? "is-added" : ""}
            onClick=${handleAddToCart}
            aria-label=${addedPulse ? "Товар добавлен" : "В корзину"}
          >
            ${addedPulse ? html`<${Icon} name="check" size=${17} />` : html`<${Icon} name="bag" size=${17} />`}
          </button>
        </div>
      </div>
    `;
  }

  const MemoProductCard = React.memo(ProductCard, (prev, next) => {
    return prev.product === next.product && prev.onAddToCart === next.onAddToCart;
  });

  function ProductGrid({ products, onAddToCart, emptyTitle = "Ничего не найдено", emptyBody, onReset }) {
    if (!products.length) {
      return html`
        <div className="glass-card-light rounded-3xl p-6 text-center">
          <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
            ${emptyTitle}
          </p>
          <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
            ${emptyBody || "Попробуйте изменить запрос или сбросить фильтры."}
          </p>
          ${onReset
            ? html`<button
                type="button"
                className="mt-4 px-4 py-3 rounded-2xl text-sm font-semibold dx-btn"
                onClick=${onReset}
              >
                Сбросить
              </button>`
            : null}
        </div>
      `;
    }

    return html`
      <div className="market-ui-product-grid">
        ${products.map((product) => html`<${MemoProductCard} key=${product.id} product=${product} onAddToCart=${onAddToCart} />`)}
      </div>
    `;
  }

  const MemoProductGrid = React.memo(ProductGrid, (prev, next) => {
    return (
      prev.products === next.products &&
      prev.onAddToCart === next.onAddToCart &&
      prev.emptyTitle === next.emptyTitle &&
      prev.emptyBody === next.emptyBody &&
      prev.onReset === next.onReset
    );
  });

  function MarketplacePage({ cartCount, onAddToCart }) {
    const toast = useToast();
    const [query, setQuery] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState("all");
    const [feedFilterId, setFeedFilterId] = useState("all");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState("all");
    const [deliveryOnly, setDeliveryOnly] = useState(false);
    const [saleOnly, setSaleOnly] = useState(false);
    const [inStockOnly, setInStockOnly] = useState(false);
    const catalogStores = marketplaceData.stores;
    const catalogProducts = marketplaceData.products;

    const cityOptions = useMemo(() => {
      return ["all", ...new Set(catalogStores.map((store) => store.city))];
    }, [catalogStores]);

    const resetMarketplaceFilters = useCallback(() => {
      setQuery("");
      setActiveCategoryId("all");
      setFeedFilterId("all");
      setSelectedCity("all");
      setDeliveryOnly(false);
      setSaleOnly(false);
      setInStockOnly(false);
    }, []);

    const filteredProducts = useMemo(() => {
      return filterMarketProducts(catalogProducts, {
        query,
        categoryId: activeCategoryId,
        city: selectedCity,
        deliveryOnly,
        saleOnly,
        inStockOnly,
        feedFilterId
      });
    }, [activeCategoryId, catalogProducts, deliveryOnly, feedFilterId, inStockOnly, query, saleOnly, selectedCity]);

    const highlightedProducts = useMemo(() => {
      const hasActiveFilters =
        query.trim() ||
        activeCategoryId !== "all" ||
        feedFilterId !== "all" ||
        selectedCity !== "all" ||
        deliveryOnly ||
        saleOnly ||
        inStockOnly;

      return hasActiveFilters ? filteredProducts : filteredProducts.slice(0, 8);
    }, [activeCategoryId, deliveryOnly, feedFilterId, filteredProducts, inStockOnly, query, saleOnly, selectedCity]);

    const activeFiltersCount =
      (feedFilterId !== "all" ? 1 : 0) +
      (selectedCity !== "all" ? 1 : 0) +
      (deliveryOnly ? 1 : 0) +
      (saleOnly ? 1 : 0) +
      (inStockOnly ? 1 : 0);

    const featuredStores = useMemo(() => {
      return catalogStores.map((store) => {
        const storeProducts = getMarketProductsByStore(store.id);
        return {
          ...store,
          productsCount: storeProducts.length
        };
      });
    }, [catalogProducts, catalogStores]);

    const handlePromoClick = useCallback(() => {
      setActiveCategoryId("oil");
      setFeedFilterId("discounted");
      setSaleOnly(true);
      setFiltersOpen(true);
      toast.push("Показываю акционные товары");
    }, [toast]);

    return html`
      <div className="market-ui-page">
        <${MarketTopBar}
          title="Маркетплейс"
          subtitle="Простой. Быстрый. Удобный."
          cartCount=${cartCount}
        />

        <main className="market-ui-content">
          <${SearchBar}
            value=${query}
            onChange=${setQuery}
            onToggleFilters=${() => setFiltersOpen((prev) => !prev)}
            filtersCount=${activeFiltersCount}
          />

          <${MarketAppNav} active="home" cartCount=${cartCount} />

          <div className="market-ui-tabs">
            <a href="#/marketplace/auto" className="market-ui-tab">
              <${Icon} name="car" size=${15} />
              Подбор по авто
            </a>
            <a href="#/marketplace/auto" className="market-ui-tab">
              <${Icon} name="scan" size=${15} />
              По VIN
            </a>
          </div>

          <${CategoryRow}
            categories=${marketCategories.filter((category) => category.id !== "all")}
            activeCategoryId=${activeCategoryId}
            onSelectCategory=${setActiveCategoryId}
          />

        ${filtersOpen
          ? html`
              <div className="market-ui-filter-panel">
                  <div className="market-ui-section-head">
                    <div>
                      <h2>
                        Быстрые фильтры
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick=${resetMarketplaceFilters}
                    >
                      Сбросить
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs mb-2" style=${{ color: "var(--drivex-silver)" }}>
                      Город
                    </p>
                    <div className="market-ui-chip-row">
                      ${cityOptions.map((city) => {
                        const isActive = selectedCity === city;
                        const label = city === "all" ? "Все города" : city;
                        return html`
                          <button
                            key=${city}
                            type="button"
                            className=${`market-ui-chip ${isActive ? "is-active" : ""}`}
                            onClick=${() => setSelectedCity(city)}
                          >
                            ${label}
                          </button>
                        `;
                      })}
                    </div>
                  </div>

                  <div className="market-ui-chip-grid">
                    ${[
                      {
                        id: "delivery",
                        label: "С доставкой",
                        active: deliveryOnly,
                        toggle: () => setDeliveryOnly((prev) => !prev),
                        color: "var(--drivex-success)"
                      },
                      {
                        id: "sale",
                        label: "Со скидкой",
                        active: saleOnly,
                        toggle: () => setSaleOnly((prev) => !prev),
                        color: "var(--drivex-danger)"
                      },
                      {
                        id: "stock",
                        label: "В наличии",
                        active: inStockOnly,
                        toggle: () => setInStockOnly((prev) => !prev),
                        color: "var(--drivex-neon-cyan)"
                      },
                      {
                        id: "close",
                        label: "Скрыть фильтры",
                        active: false,
                        toggle: () => setFiltersOpen(false),
                        color: "var(--drivex-silver)"
                      }
                    ].map((filter) => html`
                      <button
                        key=${filter.id}
                        type="button"
                        className=${`market-ui-chip ${filter.active ? "is-active" : ""}`}
                        onClick=${filter.toggle}
                      >
                        ${filter.label}
                      </button>
                    `)}
                  </div>
              </div>
            `
          : null}

          <${PromoBanner} onShowDeals=${handlePromoClick} />

          <${MarketSectionTitle} title="Популярные товары" actionLabel="Все" actionPath="/marketplace/catalog" />

          <${MemoProductGrid}
            products=${highlightedProducts}
            onAddToCart=${onAddToCart}
            onReset=${resetMarketplaceFilters}
            emptyTitle="Товары не найдены"
            emptyBody="Измените поиск, категорию или фильтры — каталог подстроится сразу."
          />

          <${MarketSectionTitle} title="Магазины" />
          <div className="market-ui-store-list no-scrollbar">
            ${featuredStores.map((store) => html`
              <a key=${store.id} href=${getMarketStorePath(store.id)} className="market-ui-store-card">
                <${MarketStoreAvatar} store=${store} size=${44} rounded="8px" />
                <div>
                  <h3>${store.name}</h3>
                  <p>${store.rating} (${store.reviews}) • ${store.productsCount} товаров</p>
                </div>
              </a>
            `)}
          </div>
        </main>
      </div>
    `;
  }

  function MarketScreen({ cartCount, onAddToCart }) {
    return html`<${MarketplacePage} cartCount=${cartCount} onAddToCart=${onAddToCart} />`;
  }

  function MarketCatalogScreen({ cartCount, onAddToCart }) {
    const [query, setQuery] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState("all");

    const filteredProducts = useMemo(() => {
      return filterMarketProducts(marketplaceData.products, {
        query,
        categoryId: activeCategoryId
      });
    }, [activeCategoryId, query]);

    return html`
      <div className="market-ui-page">
        <${MarketTopBar}
          title="Каталог"
          subtitle="Список категорий и фильтры"
          cartCount=${cartCount}
          backPath="/market"
          compact=${true}
        />
        <main className="market-ui-content">
          <${SearchBar}
            value=${query}
            onChange=${setQuery}
            onToggleFilters=${() => setActiveCategoryId("all")}
            filtersCount=${activeCategoryId !== "all" ? 1 : 0}
          />
          <${MarketAppNav} active="catalog" cartCount=${cartCount} />
          <div className="market-ui-catalog-list">
            ${marketCategories
              .filter((category) => category.id !== "all")
              .map((category) => {
                const isActive = activeCategoryId === category.id;
                const productsCount = marketplaceData.products.filter((product) => product.categoryId === category.id).length;
                return html`
                  <button
                    key=${category.id}
                    type="button"
                    className=${`market-ui-catalog-row ${isActive ? "is-active" : ""}`}
                    style=${{ "--market-accent": category.color }}
                    onClick=${() => setActiveCategoryId(isActive ? "all" : category.id)}
                  >
                    <span><${Icon} name=${category.icon} size=${18} /></span>
                    <b>${category.name}</b>
                    <small>${productsCount}</small>
                  </button>
                `;
              })}
          </div>

          <${MarketSectionTitle}
            title=${activeCategoryId === "all" ? "Все товары" : marketCategories.find((item) => item.id === activeCategoryId)?.name}
          />
          <${MemoProductGrid}
            products=${filteredProducts}
            onAddToCart=${onAddToCart}
            emptyTitle="В категории пока нет товаров"
          />
        </main>
      </div>
    `;
  }

  function MarketAutoPickerScreen({ cartCount, onAddToCart }) {
    const [mode, setMode] = useState("car");
    const [brand, setBrand] = useState("BMW");
    const [model, setModel] = useState("X5 (F15)");
    const [year, setYear] = useState("2019");
    const [modification, setModification] = useState("xDrive 30d 3.0d");
    const activeCar = garageCars[0] || null;
    const selectedProducts = useMemo(() => {
      return marketplaceData.products
        .filter((product) => ["oil", "parts", "battery"].includes(product.categoryId))
        .slice(0, 6);
    }, []);

    return html`
      <div className="market-ui-page">
        <${MarketTopBar}
          title="Подбор по авто"
          subtitle="По авто или VIN"
          cartCount=${cartCount}
          backPath="/market"
          compact=${true}
        />
        <main className="market-ui-content">
          <${MarketAppNav} active="auto" cartCount=${cartCount} />
          <div className="market-ui-mode-switch">
            <button type="button" className=${mode === "car" ? "is-active" : ""} onClick=${() => setMode("car")}>
              По авто
            </button>
            <button type="button" className=${mode === "vin" ? "is-active" : ""} onClick=${() => setMode("vin")}>
              По VIN
            </button>
          </div>

          ${mode === "car"
            ? html`
                <div className="market-ui-form-list">
                  ${[
                    ["Марка", brand, setBrand, ["BMW", "Toyota", "Mercedes-Benz"]],
                    ["Модель", model, setModel, ["X5 (F15)", "Camry", "E-Class"]],
                    ["Год выпуска", year, setYear, ["2019", "2021", "2018"]],
                    ["Модификация", modification, setModification, ["xDrive 30d 3.0d", "2.5 Hybrid", "2.0 бензин"]]
                  ].map(([label, value, setter, options]) => html`
                    <label key=${label} className="market-ui-select">
                      <span>${label}</span>
                      <select value=${value} onInput=${(event) => setter(event.target.value)}>
                        ${options.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                      </select>
                    </label>
                  `)}
                </div>
                <button type="button" className="market-ui-primary-btn">Показать запчасти</button>
              `
            : html`
                <div className="market-ui-filter-panel">
                  <label className="market-ui-select">
                    <span>VIN</span>
                    <input className="dx-input" placeholder="Введите VIN" />
                  </label>
                  <button type="button" className="market-ui-primary-btn">Проверить VIN</button>
                </div>
              `}

          <div className="market-ui-car-preview">
            <img
              src="./assets/marketplace/bmw-x5.jpg"
              alt="BMW X5"
              loading="eager"
              decoding="async"
            />
          </div>

          <${MarketSectionTitle} title="Сохранённые авто" />
          <div className="market-ui-saved-cars">
            <button type="button">
              <b>${activeCar?.brand || "BMW"} ${activeCar?.model || "X5"}</b>
              <span>${activeCar?.year || "2019"}</span>
            </button>
            <button type="button">
              <b>Toyota Camry</b>
              <span>2021</span>
            </button>
          </div>

          <${MarketSectionTitle} title="Подходящие товары" />
          <${MemoProductGrid} products=${selectedProducts} onAddToCart=${onAddToCart} />
        </main>
      </div>
    `;
  }

  function MarketOrdersScreen({ orders, orderChats, cartCount }) {
    const safeOrders = normalizeBuyerOrdersList(orders);

    return html`
      <div className="market-ui-page">
        <${MarketTopBar}
          title="Заказы"
          subtitle="Статусы и история покупок"
          cartCount=${cartCount}
          backPath="/market"
          compact=${true}
        />
        <main className="market-ui-content">
          <${MarketAppNav} active="orders" cartCount=${cartCount} />
          ${safeOrders.length
            ? safeOrders.map((order) => html`
                <div key=${order.id} className="market-ui-order-card">
                  <div className="market-ui-order-head">
                    <div className="min-w-0">
                      <h3>${order.id}</h3>
                      <p>${formatRuDate(order.date)} • ${order.storeName}</p>
                    </div>
                    <span style=${{ color: order.statusColor, background: alphaBg(order.statusColor, 0.14) }}>
                      ${order.statusLabel}
                    </span>
                  </div>

                  <div className="market-ui-order-items">
                    ${order.items.map((item) => html`
                      <div key=${`${order.id}-${item.title}`}>
                        <p>${item.title} × ${item.qty}</p>
                        <b>${formatTjsPrice((Number(item.qty) || 0) * (Number(item.price) || 0))}</b>
                      </div>
                    `)}
                  </div>

                  <div className="market-ui-order-foot">
                    <div>
                      <p>${order.deliveryMethod}</p>
                      <small>${order.address || "Адрес будет подтверждён продавцом"}</small>
                    </div>
                    <strong>${formatTjsPrice(order.amount)}</strong>
                  </div>

                  <${OrderChatSummaryCard}
                    order=${order}
                    orderChats=${orderChats}
                    viewerRole="buyer"
                    actionLabel="Написать"
                    actionPath=${getBuyerOrderChatPath(order.id)}
                  />
                </div>
              `)
            : html`
                <div className="market-ui-filter-panel">
                  <div className="text-center">
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Заказов пока нет
                    </p>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      После оформления покупки заказ появится здесь.
                    </p>
                    <a href="#/market" className="inline-flex mt-4 market-ui-primary-btn">
                      Открыть маркет
                    </a>
                  </div>
                </div>
              `}
        </main>
      </div>
    `;
  }

  function BuyerAuthScreen({ mode = "register", authStatus, onLogin, onRegister }) {
    const toast = useToast();
    const isLogin = mode === "login";
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const providerLabel = authStatus?.mode === "supabase" && authStatus?.configured ? "Supabase" : "Локальный режим";

    const submit = useCallback(
      async (event) => {
        event.preventDefault();
        if (busy) return;

        const payload = {
          name: String(fullName || "").trim(),
          phone: String(phone || "").trim(),
          email: String(email || "").trim().toLowerCase(),
          password: String(password || "")
        };

        if (!payload.email) {
          toast.push("Введите email");
          return;
        }
        if (!payload.password || payload.password.length < 6) {
          toast.push("Пароль должен быть от 6 символов");
          return;
        }
        if (!isLogin && !payload.name) {
          toast.push("Введите имя");
          return;
        }
        if (!isLogin && payload.password !== confirmPassword) {
          toast.push("Пароли не совпадают");
          return;
        }

        setBusy(true);
        try {
          if (isLogin) {
            await onLogin(payload);
            toast.push("Вход выполнен");
          } else {
            await onRegister(payload);
            toast.push("Регистрация завершена");
          }
        } catch (error) {
          toast.push(error?.message || "Не удалось выполнить действие");
        } finally {
          setBusy(false);
        }
      },
      [busy, confirmPassword, email, fullName, isLogin, onLogin, onRegister, password, phone, toast]
    );

    return html`
      <div className="min-h-screen flex items-center px-6 py-10" style=${{ background: "var(--drivex-black)" }}>
        <div className="w-full space-y-5">
          <div className="text-center">
            <p
              className="text-xs font-semibold"
              style=${{ color: "var(--drivex-neon-cyan)", letterSpacing: "0.18em" }}
            >
              DRIVEX USER
            </p>
            <h1 className="text-3xl font-bold mt-3" style=${{ color: "var(--drivex-white)" }}>
              ${isLogin ? "Вход в аккаунт" : "Регистрация"}
            </h1>
            <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
              ${isLogin
                ? "Введите данные, чтобы открыть свой профиль, гараж и заказы."
                : "Создайте аккаунт пользователя. После регистрации откроется ваш DRIVEX-проект."}
            </p>
          </div>

          <form className="glass-card-light rounded-3xl p-5 space-y-4" onSubmit=${submit}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>
                Авторизация
              </span>
              <span
                className="text-xs px-3 py-1 rounded-full"
                style=${{
                  color: "var(--drivex-neon-cyan)",
                  background: "rgba(6, 182, 212, 0.12)",
                  border: "1px solid rgba(6, 182, 212, 0.16)"
                }}
              >
                ${providerLabel}
              </span>
            </div>

            ${!isLogin
              ? html`
                  <label className="block">
                    <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>Имя</span>
                    <input
                      className="w-full mt-2 p-4 rounded-2xl dx-input"
                      value=${fullName}
                      onInput=${(e) => setFullName(e.target.value)}
                      placeholder="Ваше имя"
                      autocomplete="name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>Телефон</span>
                    <input
                      className="w-full mt-2 p-4 rounded-2xl dx-input"
                      value=${phone}
                      onInput=${(e) => setPhone(e.target.value)}
                      placeholder="+992 ..."
                      autocomplete="tel"
                    />
                  </label>
                `
              : null}

            <label className="block">
              <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>Email</span>
              <input
                type="email"
                className="w-full mt-2 p-4 rounded-2xl dx-input"
                value=${email}
                onInput=${(e) => setEmail(e.target.value)}
                placeholder="mail@example.com"
                autocomplete="email"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>Пароль</span>
              <input
                type="password"
                className="w-full mt-2 p-4 rounded-2xl dx-input"
                value=${password}
                onInput=${(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                autocomplete=${isLogin ? "current-password" : "new-password"}
              />
            </label>

            ${!isLogin
              ? html`
                  <label className="block">
                    <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>
                      Повторите пароль
                    </span>
                    <input
                      type="password"
                      className="w-full mt-2 p-4 rounded-2xl dx-input"
                      value=${confirmPassword}
                      onInput=${(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите пароль"
                      autocomplete="new-password"
                    />
                  </label>
                `
              : null}

            <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy}>
              ${busy ? "Подождите..." : isLogin ? "Войти" : "Зарегистрироваться"}
            </button>

            <a
              className="block text-center text-sm font-semibold"
              style=${{ color: "var(--drivex-neon-cyan)" }}
              href=${isLogin ? "#/register" : "#/login"}
            >
              ${isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
            </a>
          </form>
        </div>
      </div>
    `;
  }

  function ProfileScreen({ notificationsCount, profile, documents, documentsTotalCount, maintenance, ordersCount, onLogout }) {
    const fallbackProfile = createDefaultBuyerProfile();
    const name = profile?.name || fallbackProfile.name;
    const phone = profile?.phone || fallbackProfile.phone;
    const email = profile?.email || fallbackProfile.email;
    const avatar = profile?.avatar || "";

    const docs = documents && typeof documents === "object" ? documents : {};
    const licenseReady = docs.license ? 1 : 0;
    const vehicleDocsCount = garageCars.reduce((sum, car) => {
      const carDocs = docs.cars && docs.cars[car.id] ? docs.cars[car.id] : {};
      return sum + (carDocs.registration ? 1 : 0) + (carDocs.inspection ? 1 : 0);
    }, 0);
    const maintenanceRecordsCount = countMaintenanceRecords(maintenance);
    const smartCareTasks = buildSmartCareTasks(maintenance);

    const sections = [
      {
        title: "Мой автопарк",
        items: [
          { icon: "car", label: "Мои автомобили", path: "/garage", badge: String(garageCars.length) },
          {
            icon: "folder",
            label: "Документы",
            path: "/documents",
            badge: documentsTotalCount ? String(documentsTotalCount) : null
          },
          {
            icon: "wrench",
            label: "Журнал обслуживания",
            path: "/maintenance",
            badge: maintenanceRecordsCount ? String(maintenanceRecordsCount) : null
          },
          { icon: "scan", label: "Умный уход", path: "/smart-care", badge: smartCareTasks.length ? String(smartCareTasks.length) : null }
        ]
      },
      {
        title: "Заказы и услуги",
        items: [
          {
            icon: "bag",
            label: "История заказов",
            path: "/orders",
            badge: ordersCount ? String(ordersCount) : null
          },
          { icon: "map", label: "История поездок", path: "/trips", badge: null },
          {
            icon: "map",
            label: "Сохранённые места",
            path: "/saved-locations",
            badge: String(savedPlaces.length)
          }
        ]
      },
      {
        title: "Аккаунт",
        items: [
          {
            icon: "bell",
            label: "Уведомления",
            path: "/notifications",
            badge: String(notificationsCount)
          },
          { icon: "card", label: "Платёжные данные", path: "/payment", badge: null },
          { icon: "star", label: "Бонусная программа", path: "/bonus", badge: null },
          { icon: "copy", label: "Пригласить друзей", path: "/invite", badge: null },
          { icon: "lock", label: "Профиль и безопасность", path: "/profile-security", badge: null },
          { icon: "settings", label: "Настройки приложения", path: "/settings", badge: null },
          { icon: "wrench", label: "Помощь и поддержка", path: "/help", badge: null }
        ]
      }
    ];

    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <div
          className="relative pt-12 pb-8 px-6 overflow-hidden"
          style=${{ background: "var(--gradient-dark)" }}
        >
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl"
              style=${{ background: "var(--drivex-neon-cyan)" }}
            ></div>
          </div>

          <div className="relative z-10">
            <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                  style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
                >
                  ${avatar
                    ? html`<img
                        src=${avatar}
                        alt="Аватар"
                        style=${{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />`
                    : html`<${Icon} name="user" size=${40} />`}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1" style=${{ color: "var(--drivex-white)" }}>
                    ${name}
                  </h2>
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    ${phone}
                  </p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    ${email}
                  </p>
                  <a
                    href="#/profile-edit"
                    className="inline-flex items-center gap-2 mt-3 text-xs font-semibold"
                    style=${{ color: "var(--drivex-neon-cyan)" }}
                  >
                    <${Icon} name="edit" size=${16} /> Редактировать
                  </a>
                </div>
                <a
                  href="#/settings"
                  className="p-2 rounded-xl"
                  style=${{ color: "var(--drivex-neon-cyan)" }}
                  aria-label="Настройки"
                >
                  <${Icon} name="settings" size=${24} />
                </a>
              </div>

              <a
                href="#/documents"
                className="glass-card-light rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01]"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.18)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="folder" size=${26} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                      Документы
                    </p>
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-bold"
                      style=${{
                        background: "rgba(14, 165, 233, 0.16)",
                        color: "var(--drivex-electric-blue)"
                      }}
                    >
                      ${documentsTotalCount}
                    </span>
                  </div>

                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                    Права: ${licenseReady ? "загружены" : "не добавлены"} • На машины: ${vehicleDocsCount}
                  </p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Техпаспорт и техосмотр хранятся отдельно по каждой машине
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          ${sections.map(
            (section, sectionIdx) => html`
              <div key=${sectionIdx} className="mb-6">
                <h3 className="text-sm font-semibold mb-3 px-2" style=${{ color: "var(--drivex-silver)" }}>
                  ${section.title}
                </h3>
                <div className="glass-card-light rounded-2xl overflow-hidden">
                  ${section.items.map((item, idx) => {
                    const divider =
                      idx < section.items.length - 1
                        ? { borderBottom: "1px solid var(--glass-border)" }
                        : null;
                    return html`
                      <a
                        key=${item.path}
                        href=${`#${item.path}`}
                        className="flex items-center gap-4 p-4 transition-all hover:bg-opacity-80"
                        style=${divider}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style=${{
                            background: "rgba(14, 165, 233, 0.2)",
                            color: "var(--drivex-electric-blue)"
                          }}
                        >
                          <${Icon} name=${item.icon} size=${20} />
                        </div>
                        <span className="flex-1" style=${{ color: "var(--drivex-white)" }}>
                          ${item.label}
                        </span>
                        ${item.badge
                          ? html`<span
                              className="px-2 py-1 rounded-lg text-xs font-bold"
                              style=${{
                                background: "rgba(239, 68, 68, 0.2)",
                                color: "var(--drivex-danger)"
                              }}
                            >
                              ${item.badge}
                            </span>`
                          : null}
                      </a>
                    `;
                  })}
                </div>
              </div>
            `
          )}
          ${onLogout
            ? html`
                <button
                  type="button"
                  className="w-full py-4 rounded-2xl font-bold"
                  style=${{ background: "rgba(239, 68, 68, 0.14)", color: "var(--drivex-danger)" }}
                  onClick=${onLogout}
                >
                  Выйти
                </button>
              `
            : null}
        </div>
      </div>
    `;
  }

  function DocumentsVaultScreen({ documents, totalCount, authStatus }) {
    const docs = documents && typeof documents === "object" ? documents : {};
    const safeTotal = Number.isFinite(Number(totalCount)) ? Number(totalCount) : 0;
    const licenseReady = Boolean(docs.license);
    const cloudEnabled = authStatus && authStatus.mode === "supabase";

    return html`
      <${SimplePage} title="Документы" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              Хранилище документов водителя
            </p>
            <p className="text-3xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
              ${safeTotal}
            </p>
            <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                ${cloudEnabled
                  ? "Документы сохраняются в облаке и доступны под вашей учётной записью."
                  : "Фото документов сохранено на этом устройстве"}
            </p>
          </div>

          <a
            href="#/documents/license"
            className="glass-card-light rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.01]"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style=${{
                background: "rgba(6, 182, 212, 0.2)",
                color: "var(--drivex-neon-cyan)"
              }}
            >
              <${Icon} name="user" size=${22} />
            </div>
            <div className="flex-1">
              <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                Права
              </p>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Один общий документ водителя
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-xl text-xs font-bold"
              style=${{
                background: licenseReady ? "rgba(16, 185, 129, 0.16)" : "rgba(148, 163, 184, 0.16)",
                color: licenseReady ? "var(--drivex-success)" : "var(--drivex-silver)"
              }}
            >
              ${licenseReady ? "Есть" : "Пусто"}
            </span>
          </a>

          <div>
            <h2 className="text-xl font-bold mb-3" style=${{ color: "var(--drivex-white)" }}>
              По машинам
            </h2>
            <div className="space-y-3">
              ${garageCars.map((car) => {
                const carDocs = docs.cars && docs.cars[car.id] ? docs.cars[car.id] : {};
                const registrationReady = Boolean(carDocs.registration);
                const inspectionReady = Boolean(carDocs.inspection);
                const readyCount = (registrationReady ? 1 : 0) + (inspectionReady ? 1 : 0);

                return html`
                  <a
                    key=${car.id}
                    href=${`#/documents/car/${car.id}`}
                    className="glass-card-light rounded-2xl p-4 block transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style=${{
                          background: "rgba(14, 165, 233, 0.2)",
                          color: "var(--drivex-electric-blue)"
                        }}
                      >
                        <${Icon} name="car" size=${22} />
                      </div>

                      <div className="flex-1">
                        <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                          ${car.name}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${car.plate} • ${car.year}
                        </p>
                      </div>

                      <span
                        className="px-3 py-1 rounded-xl text-xs font-bold"
                        style=${{
                          background: "rgba(14, 165, 233, 0.16)",
                          color: "var(--drivex-electric-blue)"
                        }}
                      >
                        ${readyCount}/2
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2 flex-wrap">
                      <span
                        className="px-3 py-1 rounded-xl text-xs font-bold"
                        style=${{
                          background: registrationReady ? "rgba(14, 165, 233, 0.16)" : "rgba(148, 163, 184, 0.12)",
                          color: registrationReady ? "var(--drivex-electric-blue)" : "var(--drivex-silver)"
                        }}
                      >
                        Техпаспорт: ${registrationReady ? "есть" : "нет"}
                      </span>
                      <span
                        className="px-3 py-1 rounded-xl text-xs font-bold"
                        style=${{
                          background: inspectionReady ? "rgba(245, 158, 11, 0.16)" : "rgba(148, 163, 184, 0.12)",
                          color: inspectionReady ? "var(--drivex-warning)" : "var(--drivex-silver)"
                        }}
                      >
                        Техосмотр: ${inspectionReady ? "есть" : "нет"}
                      </span>
                    </div>
                  </a>
                `;
              })}
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-4">
            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
              ${cloudEnabled
                ? "Документы сохраняются в облаке через Supabase и привязаны к вашему аккаунту."
                : "Данные сохраняются локально. Если очистить данные браузера, документы нужно будет загрузить заново."}
            </p>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function LicenseDocumentScreen({ document, onSave, onRemove }) {
    const toast = useToast();
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);

    const openPicker = useCallback(() => {
      if (busy) return;
      inputRef.current && inputRef.current.click();
    }, [busy]);

    const onFileChange = useCallback(
      async (e) => {
        const file = e?.target?.files && e.target.files[0];
        if (e && e.target) e.target.value = "";
        if (!file) return;

        setBusy(true);
        try {
          const image = await prepareDocumentDataUrl(file, { maxSize: 1400, quality: 0.86 });
          if (!image) {
            toast.push("Не удалось загрузить фото");
            setBusy(false);
            return;
          }

          onSave &&
            onSave({
              id: genId("doc"),
              name: String(file.name || "Права"),
              image,
              addedAt: Date.now()
            });
          toast.push("Права сохранены");
        } catch (err) {
          if (String(err && err.message) === "File too large") {
            toast.push("Файл слишком большой (до 8 МБ)");
          } else if (String(err && err.message) === "Image too large") {
            toast.push("Изображение слишком большое после сжатия");
          } else {
            toast.push("Не удалось загрузить фото");
          }
        }
        setBusy(false);
      },
      [onSave, toast]
    );

    const removeDocument = useCallback(() => {
      onRemove && onRemove();
      toast.push("Документ удалён");
    }, [onRemove, toast]);

    return html`
      <${SimplePage} title="Права" backPath="/documents">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style=${{
                  background: "rgba(6, 182, 212, 0.2)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                <${Icon} name="user" size=${22} />
              </div>
              <div>
                <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Водительское удостоверение
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Один общий документ для профиля водителя
                </p>
              </div>
            </div>
          </div>

          ${document
            ? html`
                <div className="glass-card-light rounded-2xl p-4">
                  <img
                    src=${document.image}
                    alt=${document.name || "Права"}
                    style=${{ width: "100%", borderRadius: "16px", display: "block" }}
                  />
                  <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                    ${document.name || "Права"}
                  </p>
                </div>
              `
            : html`
                <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
                  Здесь можно хранить одно фото прав.
                </div>
              `}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="py-4 rounded-2xl font-bold dx-btn"
              onClick=${openPicker}
              disabled=${busy}
            >
              ${document ? "Заменить" : "Добавить"}
            </button>
            ${document
              ? html`
                  <button
                    type="button"
                    className="py-4 rounded-2xl font-bold"
                    style=${{
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "var(--drivex-danger)"
                    }}
                    onClick=${removeDocument}
                  >
                    Удалить
                  </button>
                `
              : html`
                  <div
                    className="py-4 rounded-2xl font-bold text-center"
                    style=${{ background: "var(--glass-bg)", color: "var(--drivex-silver)" }}
                  >
                    Пока пусто
                  </div>
                `}
          </div>

          <input
            ref=${inputRef}
            type="file"
            accept="image/*"
            style=${{ display: "none" }}
            onChange=${onFileChange}
          />
        </div>
      </${SimplePage}>
    `;
  }

  function CarDocumentsScreen({ carId, documents, onSaveDocument, onRemoveDocument, onSelectCar }) {
    const toast = useToast();
    const car = findGarageCar(carId);
    const docs = documents && typeof documents === "object" ? documents : {};
    const carDocs = car && docs.cars && docs.cars[car.id] ? docs.cars[car.id] : {};
    const inputRefs = useRef({});
    const [busyKind, setBusyKind] = useState("");

    useEffect(() => {
      if (car && onSelectCar) onSelectCar(car.id);
    }, [car, onSelectCar]);

    if (!car) {
      return html`
        <${SimplePage} title="Машина не найдена" backPath="/documents">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Попробуйте открыть документы другой машины.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const openPicker = useCallback(
      (kind) => {
        if (busyKind) return;
        if (inputRefs.current[kind]) inputRefs.current[kind].click();
      },
      [busyKind]
    );

    const saveKind = useCallback(
      async (kind, e) => {
        const file = e?.target?.files && e.target.files[0];
        if (e && e.target) e.target.value = "";
        if (!file) return;

        setBusyKind(kind);
        try {
          const image = await prepareDocumentDataUrl(file, { maxSize: 1400, quality: 0.86 });
          if (!image) {
            toast.push("Не удалось загрузить фото");
            setBusyKind("");
            return;
          }

          onSaveDocument &&
            onSaveDocument(car.id, kind, {
              id: genId("doc"),
              name: String(file.name || `${kind}-${car.name}`),
              image,
              addedAt: Date.now()
            });
          toast.push("Документ сохранён");
        } catch (err) {
          if (String(err && err.message) === "File too large") {
            toast.push("Файл слишком большой (до 8 МБ)");
          } else {
            toast.push("Не удалось загрузить фото");
          }
        }
        setBusyKind("");
      },
      [car.id, car.name, onSaveDocument, toast]
    );

    return html`
      <${SimplePage} title=${car.name} backPath="/documents">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style=${{
                  background: "rgba(14, 165, 233, 0.2)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                <${Icon} name="car" size=${22} />
              </div>
              <div>
                <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                  ${car.name}
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  ${car.plate} • ${car.year} • ${car.mileage}
                </p>
              </div>
            </div>
          </div>

          ${vehicleDocumentKinds.map((kind) => {
            const doc = carDocs[kind.id] || null;
            const isBusy = busyKind === kind.id;

            return html`
              <div key=${kind.id} className="glass-card-light rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style=${{ background: alphaBg(kind.color, 0.2), color: kind.color }}
                    >
                      <${Icon} name=${kind.icon} size=${22} />
                    </div>
                    <div>
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${kind.title}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        ${kind.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className="px-3 py-1 rounded-xl text-xs font-bold"
                    style=${{
                      background: doc ? alphaBg(kind.color, 0.18) : "rgba(148, 163, 184, 0.12)",
                      color: doc ? kind.color : "var(--drivex-silver)"
                    }}
                  >
                    ${doc ? "Есть" : "Нет"}
                  </span>
                </div>

                ${doc
                  ? html`
                      <div className="mt-4">
                        <img
                          src=${doc.image}
                          alt=${doc.name || kind.title}
                          style=${{ width: "100%", borderRadius: "16px", display: "block" }}
                        />
                        <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                          ${doc.name || kind.title}
                        </p>
                      </div>
                    `
                  : html`
                      <div className="mt-4 rounded-2xl p-4" style=${{ background: "var(--glass-bg)" }}>
                        <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                          Фото ещё не добавлено.
                        </p>
                      </div>
                    `}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    className="py-3 rounded-2xl font-bold dx-btn"
                    onClick=${() => openPicker(kind.id)}
                    disabled=${Boolean(busyKind)}
                  >
                    ${doc ? "Заменить" : "Добавить"}
                  </button>

                  ${doc
                    ? html`
                        <button
                          type="button"
                          className="py-3 rounded-2xl font-bold"
                          style=${{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "var(--drivex-danger)"
                          }}
                          onClick=${() => {
                            onRemoveDocument && onRemoveDocument(car.id, kind.id);
                            toast.push("Документ удалён");
                          }}
                        >
                          Удалить
                        </button>
                      `
                    : html`
                        <div
                          className="py-3 rounded-2xl font-bold text-center"
                          style=${{ background: "var(--glass-bg)", color: "var(--drivex-silver)" }}
                        >
                          ${isBusy ? "Загрузка..." : "Пока пусто"}
                        </div>
                      `}
                </div>

                <input
                  ref=${(node) => {
                    inputRefs.current[kind.id] = node;
                  }}
                  type="file"
                  accept="image/*"
                  style=${{ display: "none" }}
                  onChange=${(e) => saveKind(kind.id, e)}
                />
              </div>
            `;
          })}
        </div>
      </${SimplePage}>
    `;
  }

  function ServiceBookingScreen({
    serviceId,
    serviceDirectory,
    profile,
    activeCarId,
    onSelectCar,
    currentCenter,
    appointments,
    onSubmitBooking
  }) {
    const toast = useToast();
    const runtimeServices =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item));
    const service = runtimeServices.find((item) => String(item.id) === String(serviceId)) || null;
    const safeProfile = profile && typeof profile === "object" ? profile : createDefaultBuyerProfile();
    const fallbackCar = findGarageCar(activeCarId) || garageCars[0] || null;
    const currentCatalogService = createCatalogServiceFromCenter(currentCenter, {
      appointments
    });
    const isCrmBacked =
      Boolean(service?.isRegisteredCenter) &&
      Boolean(currentCatalogService) &&
      String(currentCatalogService.id) === String(service?.id);
    const safeCenter = isCrmBacked ? normalizeServiceCenter(currentCenter) : null;
    const appointmentPool = isCrmBacked
      ? normalizeServiceAppointmentsList(appointments, safeCenter?.id).filter((item) => !isDemoServiceAppointment(item))
      : [];
    const defaultDate = getFutureLocalISODate(1);
    const [clientName, setClientName] = useState(() => safeProfile.name || "");
    const [clientPhone, setClientPhone] = useState(() => safeProfile.phone || "");
    const [carId, setCarId] = useState(() => fallbackCar?.id || (garageCars[0]?.id || ""));
    const [day, setDay] = useState(defaultDate);
    const [workLabel, setWorkLabel] = useState(() => service?.type || service?.category || "Диагностика");
    const [note, setNote] = useState("");
    const [submittedRequest, setSubmittedRequest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inlineError, setInlineError] = useState("");
    const selectedCar = findGarageCar(carId) || fallbackCar || garageCars[0] || null;
    const availableSlotOptions = buildServiceBookingSlotOptions({
      service,
      center: safeCenter,
      appointments: appointmentPool,
      day
    }).filter((slot) => slot.available);
    const [time, setTime] = useState(() => availableSlotOptions[0]?.value || "10:00");

    useEffect(() => {
      const nextCar = findGarageCar(activeCarId) || garageCars[0] || null;
      setClientName(safeProfile.name || "");
      setClientPhone(safeProfile.phone || "");
      setCarId(nextCar?.id || (garageCars[0]?.id || ""));
      setDay(getFutureLocalISODate(1));
      setWorkLabel(service?.type || service?.category || "Диагностика");
      setNote("");
      setSubmittedRequest(null);
      setInlineError("");
    }, [activeCarId, safeProfile.name, safeProfile.phone, service?.id, service?.type, service?.category]);

    useEffect(() => {
      if (!availableSlotOptions.length) {
        setTime("");
        return;
      }

      if (!availableSlotOptions.some((slot) => slot.value === time)) {
        setTime(availableSlotOptions[0].value);
      }
    }, [availableSlotOptions, time]);

    if (!service) {
      return html`
        <${SimplePage} title="Запись не найдена" backPath="/services">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Сервис не найден. Попробуйте открыть запись из каталога заново.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const handleSubmit = async (event) => {
      event.preventDefault();

      if (!clientName.trim() || !clientPhone.trim()) {
        setInlineError("Укажите имя и телефон для записи.");
        return;
      }

      if (!workLabel.trim()) {
        setInlineError("Напишите, что нужно сделать по машине.");
        return;
      }

      if (!day || !parseISODate(day)) {
        setInlineError("Выберите дату записи.");
        return;
      }

      if (!time) {
        setInlineError("На этот день нет свободных слотов. Выберите другую дату.");
        return;
      }

      setInlineError("");
      setIsSubmitting(true);

      try {
        const request = await onSubmitBooking?.({
          serviceId: String(service.id),
          serviceName: service.name,
          city: service.city,
          address: service.address || service.locationLabel,
          phone: service.phone,
          day,
          time,
          clientName,
          clientPhone,
          carId: selectedCar?.id || "",
          carLabel: [
            selectedCar?.name,
            selectedCar?.plate
          ].filter(Boolean).join(" • "),
          workLabel,
          note
        });

        if (request?.carId && onSelectCar) {
          onSelectCar(request.carId);
        }
        navigateToHash("/maintenance");
      } catch (error) {
        const message = error?.message || "Не удалось отправить запись";
        setInlineError(message);
        toast.push(message);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (submittedRequest) {
      return html`
        <${SimplePage} title="Запись принята" backPath=${`/service/${service.id}`}>
          <div className="px-6 py-6 space-y-4">
            <div className="glass-card-light rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style=${{
                    background: "rgba(16, 185, 129, 0.18)",
                    color: "var(--drivex-success)"
                  }}
                >
                  <${Icon} name="check" size=${26} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                    ${service.name}
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                    Сервис принял запись на ${formatRuDate(submittedRequest.day)} в ${submittedRequest.time}.
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                    ${submittedRequest.clientName}${submittedRequest.carLabel ? ` • ${submittedRequest.carLabel}` : ""}
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-4 mt-5">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${submittedRequest.workLabel}
                </p>
                ${submittedRequest.note
                  ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                      ${submittedRequest.note}
                    </p>`
                  : null}
              </div>

              <div className="glass-card rounded-3xl p-4 mt-4">
                <p className="text-xs font-semibold tracking-[0.16em]" style=${{ color: "var(--drivex-silver)" }}>
                  СТАТУС РЕМОНТА
                </p>
                <div className="mt-4">
                  <${ServiceRequestStatusTimeline} status=${submittedRequest.status} />
                </div>
              </div>

              <div className="mt-5 flex gap-3 flex-wrap">
                <a href=${`#/service/${service.id}`} className="px-5 py-3 rounded-2xl text-sm font-semibold dx-btn">
                  К сервису
                </a>
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl text-sm font-semibold"
                  style=${{
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "var(--drivex-white)"
                  }}
                  onClick=${() => setSubmittedRequest(null)}
                >
                  Изменить запись
                </button>
              </div>
            </div>

            ${isCrmBacked
              ? html`<div className="glass-card rounded-3xl p-5">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                    Эта запись уже появилась у сервиса в CRM: в расписании и в списке ремонтов.
                  </p>
                </div>`
              : null}
          </div>
        </${SimplePage}>
      `;
    }

    return html`
      <${SimplePage} title="Запись в сервис" backPath=${`/service/${service.id}`}>
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                  ${service.name}
                </p>
                ${service.city || service.address
                  ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      ${[service.city, service.address || service.locationLabel].filter(Boolean).join(" • ")}
                    </p>`
                  : null}
              </div>
              ${service.phone
                ? html`<${ServicePhoneButton} phone=${service.phone} compact=${true} label="Позвонить в сервис" />`
                : null}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              ${[
                service.type || service.category,
                service.workingHours,
                service.distance
              ]
                .filter(Boolean)
                .map((chip) => html`
                  <span
                    key=${chip}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style=${{
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--drivex-silver)"
                    }}
                  >
                    ${chip}
                  </span>
                `)}
            </div>
          </div>

          <form className="space-y-4" onSubmit=${handleSubmit}>
            <div className="glass-card-light rounded-3xl p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <${SellerField} label="Ваше имя">
                  <${SellerInput}
                    value=${clientName}
                    placeholder="Как к вам обращаться"
                    onInput=${(e) => setClientName(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Телефон">
                  <${SellerInput}
                    value=${clientPhone}
                    placeholder="+992 ..."
                    onInput=${(e) => setClientPhone(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Машина">
                  <${SellerSelect}
                    value=${carId}
                    onChange=${(e) => setCarId(e.target.value)}
                  >
                    ${garageCars.map((car) => html`
                      <option key=${car.id} value=${car.id}>
                        ${car.name}${car.plate ? ` • ${car.plate}` : ""}
                      </option>
                    `)}
                  </${SellerSelect}>
                </${SellerField}>
              </div>
            </div>

            <div className="glass-card-light rounded-3xl p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <${SellerField} label="Дата записи">
                  <${SellerInput}
                    type="date"
                    value=${day}
                    min=${toLocalISODate()}
                    onInput=${(e) => setDay(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField}
                  label="Время"
                  note=${availableSlotOptions.length ? `${availableSlotOptions.length} свободных слотов` : "Свободных слотов нет"}
                >
                  <${SellerSelect}
                    value=${time}
                    onChange=${(e) => setTime(e.target.value)}
                    disabled=${!availableSlotOptions.length}
                  >
                    ${availableSlotOptions.length
                      ? availableSlotOptions.map((slot) => html`
                          <option key=${slot.value} value=${slot.value}>
                            ${slot.label}
                          </option>
                        `)
                      : html`<option value="">Выберите другую дату</option>`}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Что нужно сделать">
                  <${SellerInput}
                    value=${workLabel}
                    placeholder="Например: замена масла и диагностика"
                    onInput=${(e) => setWorkLabel(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Комментарий" note="Необязательно">
                  <${SellerTextarea}
                    value=${note}
                    placeholder="Что важно учесть по машине или по времени"
                    onInput=${(e) => setNote(e.target.value)}
                  />
                </${SellerField}>
              </div>
            </div>

            ${inlineError
              ? html`<div className="glass-card rounded-3xl p-4" style=${{ color: "var(--drivex-warning)" }}>
                  ${inlineError}
                </div>`
              : null}

            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    Подтверждение
                  </p>
                  <p className="text-lg font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                    ${day && time ? `${formatRuDate(day)} • ${time}` : "Выберите дату и время"}
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                    Сервис получит имя, телефон, машину и описание работ.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled=${isSubmitting || !availableSlotOptions.length}
                  className="px-6 py-3 rounded-full text-sm font-semibold"
                  style=${{
                    minWidth: "172px",
                    background: isSubmitting || !availableSlotOptions.length
                      ? "rgba(14, 165, 233, 0.22)"
                      : "linear-gradient(135deg, #1fb7f3 0%, #0ea5e9 100%)",
                    color: "var(--drivex-white)",
                    opacity: isSubmitting || !availableSlotOptions.length ? 0.72 : 1
                  }}
                >
                  ${isSubmitting ? "Отправляем..." : "Подтвердить запись"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </${SimplePage}>
    `;
  }

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

  function createSellerProductFormState(product, storeId = sellerPrimaryStoreId) {
    const isExistingProduct = Boolean(product && typeof product === "object");
    const normalized = normalizeSellerProduct(
      product || { storeId, status: "active", stockQty: 1 },
      storeId
    );

    return {
      id: normalized.id,
      title: normalized.title,
      categoryId: normalized.categoryId,
      price: String(normalized.price || ""),
      oldPrice: normalized.oldPrice ? String(normalized.oldPrice) : "",
      stockQty: String(normalized.stockQty || 0),
      description: normalized.description,
      brand: normalized.brand,
      sku: normalized.sku,
      badge: normalized.badge,
      image: normalized.image,
      deliveryAvailable: Boolean(normalized.deliveryAvailable),
      status: isExistingProduct ? normalized.status : "active"
    };
  }

  function createSellerStoreFormState(store) {
    const normalized = normalizeSellerStore(store);

    return {
      ownerName: normalized.ownerName,
      name: normalized.name,
      city: normalized.city,
      address: normalized.address,
      locationLabel: normalized.locationLabel,
      geolocation: normalized.geolocation,
      storeCategory: normalized.storeCategory,
      businessType: normalized.businessType,
      phone: normalized.phone,
      deliveryAvailable: Boolean(normalized.deliveryAvailable),
      pickupAvailable: Boolean(normalized.pickupAvailable),
      deliveryRadius: normalized.deliveryRadius,
      workingHours: normalized.workingHours,
      description: normalized.description,
      logo: normalized.logo,
      status: normalized.status
    };
  }

  function SellerLogo({ store, size = 52, rounded = "18px" }) {
    const safeStore = store && typeof store === "object" ? store : {};
    const logo = String(safeStore.logo || "").trim();
    const accent = safeStore.accent || "var(--drivex-electric-blue)";
    const fallback = String(logo || safeStore.name || "DX")
      .replace(/[^A-Za-zА-Яа-яЁё0-9]/g, "")
      .slice(0, 2)
      .toUpperCase() || "DX";

    if (logo.startsWith("data:image/") || /^https?:/i.test(logo)) {
      return html`<img
        src=${logo}
        alt=${safeStore.name || "Store"}
        className="object-cover flex-shrink-0"
        style=${{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: rounded,
          border: `1px solid ${alphaBg(accent, 0.35)}`
        }}
      />`;
    }

    return html`<div
      className="flex items-center justify-center font-bold flex-shrink-0"
      style=${{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: rounded,
        background: `linear-gradient(135deg, ${alphaBg(accent, 0.35)} 0%, rgba(15, 23, 42, 0.92) 100%)`,
        color: "var(--drivex-white)",
        border: `1px solid ${alphaBg(accent, 0.4)}`
      }}
    >
      ${fallback}
    </div>`;
  }

  function SellerField({ label, note, children }) {
    return html`
      <label className="block">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
            ${label}
          </span>
          ${note
            ? html`<span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                ${note}
              </span>`
            : null}
        </div>
        ${children}
      </label>
    `;
  }

  function SellerInput(props) {
    return html`<input
      ...${props}
      className="w-full px-4 py-3 rounded-2xl glass-card-light outline-none dx-input"
      style=${{
        color: "var(--drivex-white)",
        minHeight: "52px"
      }}
    />`;
  }

  function SellerTextarea(props) {
    return html`<textarea
      ...${props}
      className="w-full px-4 py-3 rounded-2xl glass-card-light outline-none dx-input"
      style=${{
        color: "var(--drivex-white)",
        minHeight: "120px",
        resize: "vertical"
      }}
    ></textarea>`;
  }

  function SellerSelect({ children, ...props }) {
    return html`<select
      ...${props}
      className="w-full px-4 py-3 rounded-2xl glass-card-light outline-none dx-input"
      style=${{
        color: "var(--drivex-white)",
        minHeight: "52px"
      }}
    >
      ${children}
    </select>`;
  }

  function SellerLayout({
    title,
    subtitle,
    activeItem,
    currentUser,
    store,
    primaryAction,
    showStoreSummary = true,
    showNavigation = true,
    children
  }) {
    const safeStore = store && typeof store === "object" ? store : createSellerStoreSeed();
    const safeUser = currentUser && typeof currentUser === "object" ? currentUser : createDefaultSellerSession();

    return html`
      <div className="min-h-screen" style=${{ background: "var(--drivex-black)" }}>
        <div
          className="pt-8 pb-6 px-5"
          style=${{
            background: "linear-gradient(180deg, rgba(10, 16, 30, 0.98) 0%, rgba(10, 10, 15, 1) 100%)"
          }}
        >
          <a
            href="#/market"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style=${{ color: "var(--drivex-silver)" }}
          >
            <${Icon} name="chevron-left" size=${16} />
            В клиентский маркет
          </a>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                DRIVEX SELLER
              </p>
              <h1 className="text-3xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${title}
              </h1>
              <p className="text-sm mt-2 max-w-[240px]" style=${{ color: "var(--drivex-silver)" }}>
                ${subtitle}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              ${showNavigation && isSellerRole(safeUser.role)
                ? html`<a
                    href="#/partner/login?logout=1"
                    className="px-3 py-2 rounded-2xl text-xs font-semibold"
                    style=${{
                      background: "rgba(239, 68, 68, 0.14)",
                      color: "var(--drivex-danger)"
                    }}
                  >
                    Выйти
                  </a>`
                : null}
              <${SellerLogo} store=${safeStore} size=${60} rounded="20px" />
            </div>
          </div>

          ${showStoreSummary
            ? html`<div className="glass-card-light rounded-3xl p-4 mt-5">
                <div className="flex items-center gap-3">
                  <${SellerLogo} store=${safeStore} size=${44} rounded="16px" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                      ${safeStore.name || "Новый магазин"}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${(safeUser.name || "Новый партнёр") + " • " + (safeUser.role === "admin" ? "Администратор" : "Владелец магазина")}
                    </p>
                  </div>
                  ${primaryAction
                    ? html`<a
                        href=${`#${primaryAction.path}`}
                        className="px-4 py-3 rounded-2xl text-sm font-semibold dx-btn whitespace-nowrap"
                      >
                        ${primaryAction.label}
                      </a>`
                    : null}
                </div>
              </div>`
            : null}

          ${showNavigation
            ? html`<div className="flex gap-2 overflow-x-auto pb-1 mt-5 no-scrollbar">
                ${sellerNavigationItems.map((item) => {
                  const isActive = item.id === activeItem;
                  return html`
                    <a
                      key=${item.id}
                      href=${`#${item.path}`}
                      className="px-4 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap flex items-center gap-2"
                      style=${{
                        background: isActive ? "rgba(6, 182, 212, 0.18)" : "var(--glass-bg)",
                        color: isActive ? "var(--drivex-neon-cyan)" : "var(--drivex-white)",
                        border: isActive
                          ? "1px solid rgba(6, 182, 212, 0.32)"
                          : "1px solid var(--glass-border)"
                      }}
                    >
                      <${Icon} name=${item.icon} size=${16} />
                      ${item.label}
                    </a>
                  `;
                })}
              </div>`
            : null}
        </div>

        <div className="px-5 py-5 space-y-4">${children}</div>
      </div>
    `;
  }

  function SellerMetricCard({ label, value, hint, color, icon, path = "", actionLabel = "" }) {
    const content = html`
      <div
        className="glass-card-light rounded-3xl p-4"
        style=${{
          minHeight: "100%"
        }}
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style=${{
            background: alphaBg(color, 0.18),
            color
          }}
        >
          <${Icon} name=${icon} size=${20} />
        </div>
        <p className="text-2xl font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
          ${value}
        </p>
        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
          ${label}
        </p>
        ${hint
          ? html`<p className="text-xs mt-3" style=${{ color }}>
              ${hint}
            </p>`
          : null}
        ${path
          ? html`<div
              className="mt-4 pt-3 flex items-center justify-between gap-3"
              style=${{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <span className="text-xs font-semibold" style=${{ color: "var(--drivex-white)" }}>
                ${actionLabel || "Открыть"}
              </span>
              <span
                className="w-8 h-8 rounded-full inline-flex items-center justify-center"
                style=${{
                  background: alphaBg(color, 0.18),
                  color
                }}
              >
                <${Icon} name="chevron-left" size=${14} style=${{ transform: "rotate(180deg)" }} />
              </span>
            </div>`
          : null}
      </div>
    `;

    if (!path) {
      return content;
    }

    return html`
      <a
        href=${`#${path}`}
        className="block transition-transform hover:scale-[1.01]"
        style=${{ textDecoration: "none" }}
      >
        ${content}
      </a>
    `;
  }

  function SellerAccessDeniedScreen({ onActivateSeller }) {
    return html`
      <div className="min-h-screen flex items-center justify-center px-5" style=${{ background: "var(--drivex-black)" }}>
        <div className="glass-card-light rounded-3xl p-6 w-full">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style=${{
              background: "rgba(239, 68, 68, 0.14)",
              color: "var(--drivex-danger)"
            }}
          >
            <${Icon} name="lock" size=${24} />
          </div>
          <h1 className="text-2xl font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
            Доступ закрыт
          </h1>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
            Кабинет продавца изолирован от клиентской части DRIVEX. Для входа нужен seller/admin доступ.
          </p>
          <div className="flex gap-3 flex-wrap mt-5">
            <button
              type="button"
              className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn"
              onClick=${() => onActivateSeller && onActivateSeller()}
            >
              Зарегистрировать магазин
            </button>
            <a
              href="#/partner/login"
              className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold"
              style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
            >
              Войти как партнёр
            </a>
            <a href="#/market" className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
              Вернуться в маркет
            </a>
            <a
              href="./seller.html"
              className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold"
              style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
            >
              Ссылка для партнёра
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function PartnerLoginScreen({ onLogin, onGoRegister, onResetPassword, authStatus, message = "" }) {
    const toast = useToast();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [rememberSession, setRememberSession] = useState(true);
    const [resetOpen, setResetOpen] = useState(false);
    const [resetIdentifier, setResetIdentifier] = useState("");
    const [resetPassword, setResetPassword] = useState("");
    const [resetSubmitting, setResetSubmitting] = useState(false);
    const backendModeLabel =
      authStatus?.mode === "supabase" && authStatus?.configured ? "Supabase CRM" : "DRIVEX Seller Login";

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        if (!String(identifier || "").trim()) {
          toast.push("Введите email или телефон");
          return;
        }
        if (!String(password || "").trim()) {
          toast.push("Введите пароль");
          return;
        }

        try {
          setSubmitting(true);
          await onLogin({
            email: identifier,
            phone: identifier,
            password,
            remember: rememberSession
          });
        } finally {
          setSubmitting(false);
        }
      },
      [identifier, onLogin, password, rememberSession, toast]
    );

    const handleResetPassword = useCallback(
      async (event) => {
        event.preventDefault();
        if (!String(resetIdentifier || "").trim()) {
          toast.push("Введите email или телефон для восстановления");
          return;
        }
        if (!String(resetPassword || "").trim() || String(resetPassword || "").trim().length < 6) {
          toast.push("Новый пароль должен быть не короче 6 символов");
          return;
        }
        if (!onResetPassword) {
          toast.push("Восстановление пароля пока недоступно");
          return;
        }

        try {
          setResetSubmitting(true);
          await onResetPassword({
            identifier: resetIdentifier,
            email: resetIdentifier,
            phone: resetIdentifier,
            newPassword: resetPassword
          });
          setIdentifier(resetIdentifier);
          setPassword(resetPassword);
          setRememberSession(true);
          setResetOpen(false);
          toast.push("Пароль обновлён. Теперь войдите в seller CRM.");
        } finally {
          setResetSubmitting(false);
        }
      },
      [onResetPassword, resetIdentifier, resetPassword, toast]
    );

    return html`
      <${SellerLayout}
        title="Вход в seller CRM"
        subtitle="Для уже зарегистрированного магазина: откройте seller-ссылку, войдите и сразу попадёте в свой кабинет."
        activeItem="store"
        currentUser=${createDefaultSellerSession()}
        store=${createSellerStoreSeed("partner-login")}
        showStoreSummary=${false}
        showNavigation=${false}
      >
        <div className="glass-card-light rounded-[32px] p-6 text-center">
          <div
            className="mx-auto w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
            style=${{
              background: "linear-gradient(135deg, rgba(79, 125, 255, 0.95) 0%, rgba(111, 77, 255, 0.95) 100%)",
              color: "var(--drivex-white)",
              boxShadow: "0 18px 36px rgba(79, 125, 255, 0.24)"
            }}
          >
            <${Icon} name="bag" size=${32} />
          </div>

          <p className="text-xs font-semibold mt-4 tracking-[0.22em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
            ${backendModeLabel}
          </p>
          <h2 className="text-[34px] font-bold mt-3" style=${{ color: "var(--drivex-white)", lineHeight: "1.1" }}>
            Рад вас видеть!
          </h2>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
            Войдите по email или телефону и продолжайте управлять магазином без повторной регистрации.
          </p>
        </div>

        ${message
          ? html`<div className="glass-card-light rounded-3xl p-4">
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                ${message}
              </p>
            </div>`
          : null}

        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="space-y-4">
              <${SellerField} label="Логин (email или телефон)">
                <${SellerInput}
                  type="text"
                  placeholder="Email или номер телефона"
                  value=${identifier}
                  onInput=${(e) => setIdentifier(e.target.value)}
                />
              </${SellerField}>

              <${SellerField} label="Пароль">
                <${SellerInput}
                  type="password"
                  placeholder="Ваш пароль"
                  value=${password}
                  onInput=${(e) => setPassword(e.target.value)}
                />
              </${SellerField}>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-3"
                style=${{
                  background: rememberSession ? "rgba(79, 125, 255, 0.16)" : "var(--glass-bg)",
                  color: rememberSession ? "var(--drivex-electric-blue)" : "var(--drivex-white)"
                }}
                onClick=${() => setRememberSession((prev) => !prev)}
              >
                <span
                  className="w-9 h-5 rounded-full flex items-center px-1"
                  style=${{
                    background: rememberSession ? "rgba(79, 125, 255, 0.32)" : "rgba(148, 163, 184, 0.18)",
                    justifyContent: rememberSession ? "flex-end" : "flex-start"
                  }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style=${{
                      background: rememberSession ? "var(--drivex-electric-blue)" : "var(--drivex-silver)"
                    }}
                  ></span>
                </span>
                Запомнить вход
              </button>

              <button
                type="button"
                className="text-sm font-semibold"
                style=${{ color: "var(--drivex-neon-cyan)" }}
                onClick=${() => {
                  setResetIdentifier(identifier);
                  setResetPassword("");
                  setResetOpen((prev) => !prev);
                }}
              >
                ${resetOpen ? "Скрыть восстановление" : "Забыли пароль?"}
              </button>
            </div>

            <div
              className="mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
              style=${{
                background: "rgba(79, 125, 255, 0.08)",
                border: "1px solid rgba(79, 125, 255, 0.12)"
              }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style=${{
                  background: "rgba(79, 125, 255, 0.14)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                <${Icon} name="sparkles" size=${18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Уже зарегистрированы?
                </p>
                <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  После входа seller CRM сам откроет разделы Dashboard, Товары, Заказы и Магазин.
                </p>
              </div>
            </div>
          </div>

          ${resetOpen
            ? html`<div className="glass-card-light rounded-3xl p-5">
                <form className="space-y-4" onSubmit=${handleResetPassword}>
                  <${SellerField} label="Email или телефон">
                    <${SellerInput}
                      type="text"
                      placeholder="Введите email или номер"
                      value=${resetIdentifier}
                      onInput=${(e) => setResetIdentifier(e.target.value)}
                    />
                  </${SellerField}>

                  <${SellerField} label="Новый пароль">
                    <${SellerInput}
                      type="password"
                      placeholder="Новый пароль"
                      value=${resetPassword}
                      onInput=${(e) => setResetPassword(e.target.value)}
                    />
                  </${SellerField}>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl text-sm font-semibold"
                    style=${{
                      background: "var(--glass-bg)",
                      color: "var(--drivex-white)"
                    }}
                    disabled=${resetSubmitting}
                  >
                    ${resetSubmitting ? "Обновляем пароль..." : "Обновить пароль"}
                  </button>
                </form>
              </div>`
            : null}

          <button type="submit" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
            ${submitting ? "Входим..." : "Войти"}
          </button>

          <button
            type="button"
            className="w-full py-4 rounded-2xl text-sm font-semibold"
            style=${{
              background: "transparent",
              color: "var(--drivex-white)",
              border: "1px solid var(--glass-border)"
            }}
            onClick=${() => toast.push("Вход через Google подготовим следующим шагом")}
          >
            Войти через Google
          </button>
        </form>

        <div className="glass-card-light rounded-3xl p-5">
          <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
            Нет аккаунта?
          </p>
          <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
            Зарегистрируйте магазин один раз, затем дальше входите только через seller CRM.
          </p>
          <button
            type="button"
            className="mt-4 w-full py-3 rounded-2xl text-sm font-semibold"
            style=${{
              background: "var(--glass-bg)",
              color: "var(--drivex-white)"
            }}
            onClick=${() => onGoRegister && onGoRegister()}
          >
            Зарегистрироваться
          </button>
        </div>
      </${SellerLayout}>
    `;
  }

  // PartnerQuickRegisterScreen был временным и удалён для отката к исходному flow

  function PartnerRegisterIntroScreen({ onStart }) {
    return html`
      <${SellerLayout}
        title="Регистрация партнёра"
        subtitle="Сначала откройте пустую форму, заполните данные магазина и только потом завершите регистрацию."
        activeItem="store"
        currentUser=${createFreshSellerSession()}
        store=${createSellerStoreSeed(createPendingSellerStoreId())}
        showStoreSummary=${false}
        showNavigation=${false}
      >
        <div className="glass-card-light rounded-3xl p-6 text-center">
          <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
            По партнёрской ссылке форма открывается пустой — все данные о магазине вы заполняете сами.
          </p>

          <button
            type="button"
            className="mt-6 w-full py-4 rounded-[24px] text-lg font-semibold"
            style=${{
              background: "linear-gradient(135deg, #4f7dff 0%, #6f4dff 100%)",
              color: "var(--drivex-white)",
              boxShadow: "0 12px 32px rgba(79, 125, 255, 0.28)"
            }}
            onClick=${() => onStart && onStart()}
          >
            Регистрация
          </button>
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerRegistrationScreen({ currentUser, profile, store, onRegister }) {
    const toast = useToast();
    const [profileForm, setProfileForm] = useState(() => normalizeSellerProfile(profile, currentUser));
    const [storeForm, setStoreForm] = useState(() => createSellerStoreFormState(store));
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    useEffect(() => {
      setProfileForm(normalizeSellerProfile(profile, currentUser));
    }, [currentUser?.id, profile?.id]);

    useEffect(() => {
      setStoreForm(createSellerStoreFormState(store));
    }, [store?.id]);

    const updateProfileField = useCallback((key, value) => {
      setFormError("");
      setProfileForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const updateStoreField = useCallback((key, value) => {
      setFormError("");
      setStoreForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleLogoPick = useCallback(
      async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareAvatarDataUrl(file, { size: 320, quality: 0.9 });
          if (!dataUrl) {
            toast.push("Логотип не удалось загрузить");
            return;
          }
          updateStoreField("logo", dataUrl);
          toast.push("Логотип добавлен");
        } catch {
          toast.push("Файл не подходит");
        }
      },
      [toast, updateStoreField]
    );

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        const requiredFields = [
          [profileForm.ownerFullName, "Введите ФИО владельца"],
          [profileForm.email, "Введите email"],
          [profileForm.phone, "Введите телефон"],
          [profileForm.password, "Введите пароль"],
          [storeForm.name, "Введите название магазина"],
          [storeForm.city, "Выберите город"],
          [storeForm.address, "Введите адрес"]
        ];

        const firstMissing = requiredFields.find(([value]) => !String(value || "").trim());
        if (firstMissing) {
          setFormError(firstMissing[1]);
          toast.push(firstMissing[1]);
          return;
        }

        try {
          setSubmitting(true);
          setFormError("");
          const resolvedDeliveryAvailable = Boolean(storeForm.deliveryAvailable);
          const resolvedPickupAvailable = resolvedDeliveryAvailable
            ? Boolean(storeForm.pickupAvailable)
            : Boolean(storeForm.pickupAvailable) || true;
          const resolvedBusinessType =
            storeForm.businessType ||
            (resolvedDeliveryAvailable && resolvedPickupAvailable
              ? "Доставка и самовывоз"
              : resolvedDeliveryAvailable
                ? "Только доставка"
                : "Только самовывоз");
          const resolvedStoreCategory = storeForm.storeCategory || "Автозапчасти";
          const resolvedLocationLabel = storeForm.locationLabel || storeForm.address;
          const resolvedWorkingHours = storeForm.workingHours || "09:00 — 19:00";
          const resolvedDescription =
            storeForm.description || `${storeForm.name || "Магазин"} — товары и услуги для авто.`;

          await onRegister({
            profile: {
              ...profileForm,
              registrationCompleted: true
            },
            store: {
              ...storeForm,
              storeCategory: resolvedStoreCategory,
              businessType: resolvedBusinessType,
              deliveryAvailable: resolvedDeliveryAvailable,
              pickupAvailable: resolvedPickupAvailable,
              locationLabel: resolvedLocationLabel,
              workingHours: resolvedWorkingHours,
              description: resolvedDescription,
              ownerName: profileForm.ownerFullName,
              phone: profileForm.phone,
              registrationCompleted: true,
              profileCompleted: false,
              status: "pending-setup"
            }
          });
          toast.push("Регистрация завершена, открываем CRM");
        } catch (error) {
          const nextError = error?.message || "Не удалось зарегистрировать партнёра";
          setFormError(nextError);
          toast.push(nextError);
        } finally {
          setSubmitting(false);
        }
      },
      [onRegister, profileForm, storeForm, toast]
    );

    return html`
      <${SellerLayout}
        title="Регистрация магазина"
        subtitle="Сначала оформите магазин и данные владельца. До завершения регистрации публикация товаров недоступна."
        activeItem="store"
        currentUser=${currentUser}
        store=${store}
        showStoreSummary=${false}
        showNavigation=${false}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Владелец магазина
            </h2>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <${SellerField} label="ФИО владельца">
                <${SellerInput}
                  type="text"
                  placeholder="Саиджон Каримов"
                  value=${profileForm.ownerFullName}
                  onInput=${(e) => updateProfileField("ownerFullName", e.target.value)}
                />
              </${SellerField}>

              <${SellerField} label="Email">
                <${SellerInput}
                  type="email"
                  placeholder="partner@drivex.tj"
                  value=${profileForm.email}
                  onInput=${(e) => updateProfileField("email", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Телефон">
                  <${SellerInput}
                    type="tel"
                    placeholder="+992 92 777 00 77"
                    value=${profileForm.phone}
                    onInput=${(e) => updateProfileField("phone", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Пароль">
                  <${SellerInput}
                    type="password"
                    placeholder="Минимум 6 символов"
                    value=${profileForm.password}
                    onInput=${(e) => updateProfileField("password", e.target.value)}
                  />
                </${SellerField}>
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Магазин
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Базовая информация для подключения seller кабинета
                </p>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Логотип
                <input type="file" accept="image/*" className="hidden" onChange=${handleLogoPick} />
              </label>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <${SellerLogo} store=${{ ...store, logo: storeForm.logo, name: storeForm.name }} size=${72} rounded="22px" />
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${storeForm.name || "Название магазина появится здесь"}
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  ${storeForm.storeCategory || "Категория пока не выбрана"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-5">
              <${SellerField} label="Название магазина">
                <${SellerInput}
                  type="text"
                  placeholder="AutoParts Khujand"
                  value=${storeForm.name}
                  onInput=${(e) => updateStoreField("name", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Категория магазина">
                  <${SellerSelect}
                    value=${storeForm.storeCategory}
                    onChange=${(e) => updateStoreField("storeCategory", e.target.value)}
                  >
                    <option value="">Выберите категорию</option>
                    ${sellerStoreCategoryOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Тип продаж">
                  <${SellerSelect}
                    value=${storeForm.businessType}
                    onChange=${(e) => updateStoreField("businessType", e.target.value)}
                  >
                    <option value="">Выберите тип продаж</option>
                    ${sellerBusinessTypeOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Город">
                  <${SellerInput}
                    type="text"
                    placeholder="Худжанд"
                    value=${storeForm.city}
                    onInput=${(e) => updateStoreField("city", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Часы работы">
                  <${SellerInput}
                    type="text"
                    placeholder="09:00 — 20:00"
                    value=${storeForm.workingHours}
                    onInput=${(e) => updateStoreField("workingHours", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Точный адрес">
                <${SellerInput}
                  type="text"
                  placeholder="Худжанд, 8 мкр, дом 12"
                  value=${storeForm.address}
                  onInput=${(e) => updateStoreField("address", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style=${{
                  background: "rgba(14, 165, 233, 0.16)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                <${Icon} name="map" size=${20} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Локация магазина
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Аккуратный блок адреса и геоточки для будущего подключения карты
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
              <${SellerField} label="Ориентир / метка на карте">
                <${SellerInput}
                  type="text"
                  placeholder="Рядом с кольцом 8 мкр"
                  value=${storeForm.locationLabel}
                  onInput=${(e) => updateStoreField("locationLabel", e.target.value)}
                />
              </${SellerField}>

              <${SellerField} label="Геолокация / координаты">
                <${SellerInput}
                  type="text"
                  placeholder="40.2837, 69.6222"
                  value=${storeForm.geolocation}
                  onInput=${(e) => updateStoreField("geolocation", e.target.value)}
                />
              </${SellerField}>

              <div
                className="rounded-3xl p-4"
                style=${{
                  background: "linear-gradient(145deg, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.88) 100%)",
                  border: "1px solid rgba(14, 165, 233, 0.18)"
                }}
              >
                <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Preview location
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  ${storeForm.city || "Город"} • ${storeForm.address || "Адрес пока не указан"}
                </p>
                <p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  ${storeForm.locationLabel || "Добавьте ориентир"}${storeForm.geolocation ? ` • ${storeForm.geolocation}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Доставка и описание
            </h2>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                style=${{
                  background: storeForm.deliveryAvailable ? "rgba(16, 185, 129, 0.16)" : "var(--glass-bg)",
                  color: storeForm.deliveryAvailable ? "var(--drivex-success)" : "var(--drivex-white)"
                }}
                onClick=${() => updateStoreField("deliveryAvailable", !storeForm.deliveryAvailable)}
              >
                Доставка ${storeForm.deliveryAvailable ? "включена" : "выключена"}
              </button>
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                style=${{
                  background: storeForm.pickupAvailable ? "rgba(14, 165, 233, 0.16)" : "var(--glass-bg)",
                  color: storeForm.pickupAvailable ? "var(--drivex-electric-blue)" : "var(--drivex-white)"
                }}
                onClick=${() => updateStoreField("pickupAvailable", !storeForm.pickupAvailable)}
              >
                Самовывоз ${storeForm.pickupAvailable ? "включен" : "выключен"}
              </button>
            </div>

            <div className="mt-4">
              <${SellerField} label="Радиус доставки">
                <${SellerInput}
                  type="text"
                  placeholder="15 км"
                  value=${storeForm.deliveryRadius}
                  onInput=${(e) => updateStoreField("deliveryRadius", e.target.value)}
                />
              </${SellerField}>
            </div>

            <div className="mt-4">
              <${SellerField} label="Описание магазина">
                <${SellerTextarea}
                  value=${storeForm.description}
                  onInput=${(e) => updateStoreField("description", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          ${formError
            ? html`<div
                className="px-4 py-3 rounded-2xl text-sm"
                style=${{
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "var(--drivex-danger)",
                  border: "1px solid rgba(239, 68, 68, 0.2)"
                }}
              >
                ${formError}
              </div>`
            : null}

          <button type="submit" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
            ${submitting ? "Создаём магазин..." : "Продолжить к настройке магазина"}
          </button>
        </form>

        <div className="glass-card-light rounded-3xl p-5">
          <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
            Уже есть партнёрский аккаунт?
          </p>
          <a
            href="#/seller"
            className="inline-flex mt-4 px-4 py-3 rounded-2xl text-sm font-semibold"
            style=${{
              background: "var(--glass-bg)",
              color: "var(--drivex-white)"
            }}
          >
            Войти в seller CRM
          </a>
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerOnboardingScreen({ currentUser, store, profile, setupState, notifications, onCompleteSetup }) {
    const toast = useToast();
    const safeSetup = setupState || getSellerSetupState(store, profile);
    const canComplete = safeSetup.isRegistrationComplete && safeSetup.completedCount === safeSetup.totalCount;
    const safeStore = normalizeSellerStore(store);
    const safeProfile = normalizeSellerProfile(profile, currentUser);

    return html`
      <${SellerLayout}
        title="Профиль магазина"
        subtitle="Проверьте карточку магазина, статус подключения и только потом переходите к публикации товаров."
        activeItem="store"
        currentUser=${currentUser}
        store=${safeStore}
        primaryAction=${{ path: "/seller/store", label: "Редактировать" }}
      >
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                Статус профиля
              </p>
              <p className="text-2xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${safeSetup.isProfileComplete ? "Готов к публикации" : "Нужно завершить setup"}
              </p>
            </div>
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style=${{
                background: safeSetup.isProfileComplete ? "rgba(16, 185, 129, 0.16)" : "rgba(245, 158, 11, 0.16)",
                color: safeSetup.isProfileComplete ? "var(--drivex-success)" : "var(--drivex-warning)"
              }}
            >
              ${safeStore.status || "pending-setup"}
            </span>
          </div>

          <div className="mt-4">
            <div
              className="h-3 rounded-full"
              style=${{ background: "rgba(148, 163, 184, 0.12)" }}
            >
              <div
                className="h-full rounded-full"
                style=${{
                  width: `${safeSetup.progressPercent}%`,
                  background: "var(--gradient-primary)"
                }}
              ></div>
            </div>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
              Заполнено ${safeSetup.completedCount} из ${safeSetup.totalCount} пунктов
            </p>
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
            Сводка магазина
          </h2>
          <div className="grid grid-cols-2 gap-3 mt-4">
            ${[
              { label: "Владелец", value: safeProfile.ownerFullName || "—" },
              { label: "Телефон", value: safeProfile.phone || "—" },
              { label: "Категория", value: safeStore.storeCategory || "—" },
              { label: "Тип продаж", value: safeStore.businessType || "—" },
              { label: "Самовывоз", value: safeStore.pickupAvailable ? "Да" : "Нет" },
              { label: "Доставка", value: safeStore.deliveryAvailable ? "Да" : "Нет" }
            ].map((item) => html`
              <div key=${item.label} className="glass-card rounded-2xl p-3">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  ${item.label}
                </p>
                <p className="font-semibold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${item.value}
                </p>
              </div>
            `)}
          </div>
          <div className="glass-card rounded-2xl p-4 mt-4">
            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
              Локация
            </p>
            <p className="font-semibold mt-2" style=${{ color: "var(--drivex-white)" }}>
              ${safeStore.city} • ${safeStore.address}
            </p>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
              ${safeStore.locationLabel}${safeStore.geolocation ? ` • ${safeStore.geolocation}` : ""}
            </p>
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Чеклист подключения
            </h2>
            <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              ${safeSetup.progressPercent}%
            </span>
          </div>
          <div className="space-y-3 mt-4">
            ${safeSetup.checklist.map((item) => html`
              <div key=${item.id} className="flex items-center justify-between gap-3 glass-card rounded-2xl p-3">
                <span style=${{ color: "var(--drivex-white)" }}>${item.label}</span>
                <span
                  className="px-3 py-1 rounded-xl text-xs font-semibold"
                  style=${{
                    background: item.done ? "rgba(16, 185, 129, 0.16)" : "rgba(245, 158, 11, 0.16)",
                    color: item.done ? "var(--drivex-success)" : "var(--drivex-warning)"
                  }}
                >
                  ${item.done ? "Готово" : "Нужно заполнить"}
                </span>
              </div>
            `)}
          </div>
        </div>

        ${notifications && notifications.length
          ? html`<div className="glass-card-light rounded-3xl p-5">
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Активность seller кабинета
              </h2>
              <div className="space-y-3 mt-4">
                ${notifications.map((item) => html`
                  <div key=${item.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style=${{
                          background: alphaBg(item.color, 0.18),
                          color: item.color
                        }}
                      >
                        <${Icon} name=${item.icon} size=${18} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${item.title}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${item.body}
                        </p>
                      </div>
                    </div>
                  </div>
                `)}
              </div>
            </div>`
          : null}

        <div className="grid grid-cols-2 gap-3">
          <a
            href="#/seller/store"
            className="py-3 rounded-2xl text-center font-semibold"
            style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
          >
            Редактировать профиль
          </a>
          <button
            type="button"
            className="py-3 rounded-2xl text-sm font-bold dx-btn"
            disabled=${!canComplete}
            onClick=${async () => {
              if (!canComplete) {
                toast.push("Заполните все поля профиля магазина");
                return;
              }
              await onCompleteSetup();
              navigateToHash("/seller/dashboard");
            }}
          >
            Завершить setup
          </button>
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerDashboardScreen({ currentUser, store, products, orders, notifications, setupState }) {
    const stats = useMemo(() => buildSellerDashboardStats(products, orders), [products, orders]);
    const recentOrders = useMemo(() => {
      return [...(Array.isArray(orders) ? orders : [])]
        .sort((left, right) => String(right.date).localeCompare(String(left.date)))
        .slice(0, 4);
    }, [orders]);
    const lowStockProducts = useMemo(() => {
      return (Array.isArray(products) ? products : [])
        .filter((product) => product.stockQty > 0 && product.stockQty <= 3)
        .slice(0, 3);
    }, [products]);

    return html`
      <${SellerLayout}
        title="Seller Dashboard"
        subtitle="Управляйте витриной, остатками и заказами без смешивания с клиентским интерфейсом."
        activeItem="dashboard"
        currentUser=${currentUser}
        store=${store}
        primaryAction=${{ path: "/seller/products/new", label: "Добавить товар" }}
      >
        <div className="grid grid-cols-2 gap-4">
          <${SellerMetricCard}
            label="Всего товаров"
            value=${stats.totalProducts}
            hint="В каталоге магазина"
            color="var(--drivex-electric-blue)"
            icon="bag"
          />
          <${SellerMetricCard}
            label="Опубликованы"
            value=${stats.publishedProducts}
            hint="Доступны покупателям"
            color="var(--drivex-success)"
            icon="sparkles"
          />
          <${SellerMetricCard}
            label="Всего заказов"
            value=${stats.totalOrders}
            hint="Текущая очередь"
            color="var(--drivex-warning)"
            icon="folder"
          />
          <${SellerMetricCard}
            label="Новые заказы"
            value=${stats.newOrders}
            hint="Требуют реакции"
            color="var(--drivex-neon-cyan)"
            icon="bell"
          />
        </div>

        <${SellerMetricCard}
          label="Мало на складе"
          value=${stats.lowStockProducts}
          hint="Нужно пополнить"
          color="var(--drivex-danger)"
          icon="scan"
        />

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                Seller статус
              </p>
              <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${setupState?.isProfileComplete ? "Профиль завершён" : "Setup продолжается"}
              </p>
            </div>
            <a href="#/seller/onboarding" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Открыть onboarding
            </a>
          </div>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
            ${setupState ? `${setupState.completedCount} из ${setupState.totalCount} пунктов профиля заполнено.` : "Профиль продавца готовится."}
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                Выручка
              </p>
              <p className="text-3xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${formatTjsPrice(stats.revenue)}
              </p>
            </div>
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style=${{
                background: "rgba(16, 185, 129, 0.16)",
                color: "var(--drivex-success)"
              }}
            >
              mock revenue
            </span>
          </div>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
            Структура готова для подключения Supabase заказов и реальных платежных статусов.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          ${[
            { path: "/seller/products/new", label: "Добавить товар", icon: "plus" },
            { path: "/seller/products", label: "Управлять товарами", icon: "edit" },
            { path: "/seller/orders", label: "Смотреть заказы", icon: "folder" },
            { path: "/seller/store", label: "Редактировать магазин", icon: "settings" }
          ].map((action) => html`
            <a key=${action.path} href=${`#${action.path}`} className="glass-card-light rounded-3xl p-4 block">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                <${Icon} name=${action.icon} size=${20} />
              </div>
              <p className="font-semibold mt-4" style=${{ color: "var(--drivex-white)" }}>
                ${action.label}
              </p>
            </a>
          `)}
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Последние заказы
            </h2>
            <a href="#/seller/orders" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Все заказы
            </a>
          </div>
          <div className="space-y-3 mt-4">
            ${recentOrders.map((order) => {
              const statusMeta = getSellerOrderStatusMeta(order.status);
              return html`
                <div key=${order.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        ${order.id}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        ${order.customerName} • ${formatRuDate(order.date)}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-semibold"
                      style=${{
                        background: alphaBg(statusMeta.color, 0.18),
                        color: statusMeta.color
                      }}
                    >
                      ${statusMeta.label}
                    </span>
                  </div>
                  <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                    ${order.items.map((item) => `${item.title} × ${item.qty}`).join(" • ")}
                  </p>
                  <p className="font-semibold mt-3" style=${{ color: "var(--drivex-white)" }}>
                    ${formatTjsPrice(order.amount)}
                  </p>
                </div>
              `;
            })}
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Низкий остаток
            </h2>
            <a href="#/seller/products" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Управлять
            </a>
          </div>
          ${lowStockProducts.length
            ? html`<div className="space-y-3 mt-4">
                ${lowStockProducts.map((product) => html`
                  <div key=${product.id} className="flex items-center gap-3">
                    <img src=${product.image} alt=${product.title} className="w-14 h-14 rounded-2xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                        ${product.title}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        Осталось ${product.stockQty} шт.
                      </p>
                    </div>
                    <a
                      href=${`#/seller/products/${product.id}/edit`}
                      className="px-3 py-2 rounded-xl text-sm font-semibold"
                      style=${{
                        background: "var(--glass-bg)",
                        color: "var(--drivex-white)"
                      }}
                    >
                      Пополнить
                    </a>
                  </div>
                `)}
              </div>`
            : html`<p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)" }}>
                Все активные позиции имеют комфортный остаток.
              </p>`}
        </div>

        ${notifications && notifications.length
          ? html`<div className="glass-card-light rounded-3xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Уведомления
                </h2>
                <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  seller feed
                </span>
              </div>
              <div className="space-y-3 mt-4">
                ${notifications.map((item) => html`
                  <div key=${item.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style=${{
                          background: alphaBg(item.color, 0.18),
                          color: item.color
                        }}
                      >
                        <${Icon} name=${item.icon} size=${18} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${item.title}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${item.body}
                        </p>
                      </div>
                    </div>
                  </div>
                `)}
              </div>
            </div>`
          : null}
      </${SellerLayout}>
    `;
  }

  function SellerProductsScreen({ currentUser, store, products, onDeleteProduct }) {
    const toast = useToast();
    const [query, setQuery] = useState("");
    const [categoryId, setCategoryId] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");

    const filteredProducts = useMemo(() => {
      const normalizedQuery = normalizeMarketSearchText(query);
      const queryTokens = normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : [];

      return (Array.isArray(products) ? products : []).filter((product) => {
        const haystack = normalizeMarketSearchText(
          [product.title, product.category, product.brand, product.sku, product.badge].filter(Boolean).join(" ")
        );

        const matchesQuery =
          !queryTokens.length || queryTokens.every((token) => haystack.includes(token));
        const matchesCategory = categoryId === "all" || product.categoryId === categoryId;

        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "in-stock" && product.stockQty > 3) ||
          (stockFilter === "low-stock" && product.stockQty > 0 && product.stockQty <= 3) ||
          (stockFilter === "out-of-stock" && product.stockQty <= 0) ||
          (stockFilter === "draft" && product.status === "draft");

        return matchesQuery && matchesCategory && matchesStock;
      });
    }, [categoryId, products, query, stockFilter]);

    return html`
      <${SellerLayout}
        title="Товары магазина"
        subtitle="Поиск, фильтры, удаление и переход к редактированию без влияния на клиентскую навигацию."
        activeItem="products"
        currentUser=${currentUser}
        store=${store}
        primaryAction=${{ path: "/seller/products/new", label: "Новый товар" }}
      >
        <div className="glass-card-light rounded-3xl p-5">
          <div className="grid grid-cols-1 gap-3">
            <${SellerField} label="Поиск товаров">
              <${SellerInput}
                type="search"
                placeholder="Название, бренд, SKU..."
                value=${query}
                onInput=${(e) => setQuery(e.target.value)}
              />
            </${SellerField}>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Категория">
                <${SellerSelect} value=${categoryId} onChange=${(e) => setCategoryId(e.target.value)}>
                  <option value="all">Все категории</option>
                  ${marketCategories
                    .filter((category) => category.id !== "all")
                    .map((category) => html`<option key=${category.id} value=${category.id}>${category.name}</option>`)}
                </${SellerSelect}>
              </${SellerField}>

              <${SellerField} label="Остатки">
                <${SellerSelect} value=${stockFilter} onChange=${(e) => setStockFilter(e.target.value)}>
                  <option value="all">Все позиции</option>
                  <option value="in-stock">В наличии</option>
                  <option value="low-stock">Мало на складе</option>
                  <option value="out-of-stock">Нет на складе</option>
                  <option value="draft">Черновики</option>
                </${SellerSelect}>
              </${SellerField}>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
            Найдено ${filteredProducts.length} позиций
          </p>
          <button
            type="button"
            className="text-sm font-semibold"
            style=${{ color: "var(--drivex-neon-cyan)" }}
            onClick=${() => {
              setQuery("");
              setCategoryId("all");
              setStockFilter("all");
            }}
          >
            Сбросить
          </button>
        </div>

        <div className="space-y-4">
          ${filteredProducts.length
            ? filteredProducts.map((product) => {
                const statusMeta = getSellerProductStatusMeta(product.status);
                return html`
                  <div key=${product.id} className="glass-card-light rounded-3xl p-4">
                    <div className="flex gap-4">
                      <img src=${product.image} alt=${product.title} className="w-20 h-20 rounded-2xl object-cover" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                              ${product.title}
                            </p>
                            <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                              ${product.category} • ${product.brand} • ${product.sku}
                            </p>
                          </div>
                          <span
                            className="px-3 py-1 rounded-xl text-xs font-semibold"
                            style=${{
                              background: alphaBg(statusMeta.color, 0.18),
                              color: statusMeta.color
                            }}
                          >
                            ${statusMeta.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <div>
                            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                              Цена
                            </p>
                            <p className="font-semibold mt-1" style=${{ color: "var(--drivex-white)" }}>
                              ${formatTjsPrice(product.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                              Остаток
                            </p>
                            <p className="font-semibold mt-1" style=${{ color: "var(--drivex-white)" }}>
                              ${product.stockQty} шт.
                            </p>
                          </div>
                          <div>
                            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                              Badge
                            </p>
                            <p className="font-semibold mt-1 truncate" style=${{ color: "var(--drivex-white)" }}>
                              ${product.badge || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <a
                            href=${`#/seller/products/${product.id}/edit`}
                            className="px-4 py-2.5 rounded-2xl text-sm font-semibold"
                            style=${{
                              background: "rgba(14, 165, 233, 0.16)",
                              color: "var(--drivex-electric-blue)"
                            }}
                          >
                            Редактировать
                          </a>
                          <button
                            type="button"
                            className="px-4 py-2.5 rounded-2xl text-sm font-semibold"
                            style=${{
                              background: "rgba(239, 68, 68, 0.14)",
                              color: "var(--drivex-danger)"
                            }}
                            onClick=${async () => {
                              const confirmed =
                                typeof window === "undefined" ? true : window.confirm(`Удалить ${product.title}?`);
                              if (!confirmed) return;
                              await onDeleteProduct(product.id);
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              })
            : html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Ничего не найдено
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  Попробуйте изменить фильтры или добавить новую позицию.
                </p>
              </div>`}
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerProductEditorScreen({ mode = "new", currentUser, store, product, onSaveProduct }) {
    const toast = useToast();
    const isEdit = mode === "edit";
    const [form, setForm] = useState(() => createSellerProductFormState(product, store?.id));
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      setForm(createSellerProductFormState(product, store?.id));
    }, [product?.id, store?.id]);

    const updateField = useCallback((key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleImagePick = useCallback(
      async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareDocumentDataUrl(file, { maxSize: 1200, quality: 0.88 });
          if (!dataUrl) {
            toast.push("Не удалось обработать изображение");
            return;
          }
          updateField("image", dataUrl);
          toast.push("Изображение загружено");
        } catch {
          toast.push("Файл не подходит");
        }
      },
      [toast, updateField]
    );

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        const payload = normalizeSellerProduct(
          {
            ...(product || {}),
            id: isEdit && product ? product.id : undefined,
            storeId: store?.id,
            title: form.title,
            categoryId: form.categoryId,
            price: form.price,
            oldPrice: form.oldPrice,
            stockQty: form.stockQty,
            description: form.description,
            brand: form.brand,
            sku: form.sku,
            badge: form.badge,
            image: form.image,
            deliveryAvailable: form.deliveryAvailable,
            status: form.status
          },
          store?.id
        );

        try {
          setSubmitting(true);
          await onSaveProduct(payload);
          navigateToHash("/seller/products");
        } finally {
          setSubmitting(false);
        }
      },
      [form, isEdit, onSaveProduct, product, store?.id]
    );

    if (isEdit && !product) {
      return html`
        <${SellerLayout}
          title="Товар не найден"
          subtitle="Проверьте ссылку или вернитесь к списку товаров."
          activeItem="products"
          currentUser=${currentUser}
          store=${store}
        >
          <div className="glass-card-light rounded-3xl p-6">
            <a href="#/seller/products" className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
              Вернуться к товарам
            </a>
          </div>
        </${SellerLayout}>
      `;
    }

    return html`
      <${SellerLayout}
        title=${isEdit ? "Редактирование товара" : "Добавить товар"}
        subtitle="Заполните карточку товара в seller кабинете. Структура готова для будущего backend API."
        activeItem="products"
        currentUser=${currentUser}
        store=${store}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="space-y-4">
              <${SellerField} label="Название товара">
                <${SellerInput}
                  type="text"
                  placeholder="Например, Michelin Pilot Sport 4"
                  value=${form.title}
                  onInput=${(e) => updateField("title", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Категория">
                  <${SellerSelect} value=${form.categoryId} onChange=${(e) => updateField("categoryId", e.target.value)}>
                    ${marketCategories
                      .filter((category) => category.id !== "all")
                      .map((category) => html`<option key=${category.id} value=${category.id}>${category.name}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>

                <${SellerField} label="Статус">
                  <${SellerSelect} value=${form.status} onChange=${(e) => updateField("status", e.target.value)}>
                    ${sellerProductStatusOptions.map((status) => html`<option key=${status.id} value=${status.id}>${status.label}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Цена, TJS">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value=${form.price}
                    onInput=${(e) => updateField("price", e.target.value)}
                  />
                </${SellerField}>

                <${SellerField} label="Старая цена" note="необязательно">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value=${form.oldPrice}
                    onInput=${(e) => updateField("oldPrice", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Остаток, шт.">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value=${form.stockQty}
                    onInput=${(e) => updateField("stockQty", e.target.value)}
                  />
                </${SellerField}>

                <${SellerField} label="Доставка">
                  <${SellerSelect}
                    value=${form.deliveryAvailable ? "yes" : "no"}
                    onChange=${(e) => updateField("deliveryAvailable", e.target.value === "yes")}
                  >
                    <option value="yes">Есть доставка</option>
                    <option value="no">Только самовывоз</option>
                  </${SellerSelect}>
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Бренд">
                  <${SellerInput}
                    type="text"
                    placeholder="Bosch"
                    value=${form.brand}
                    onInput=${(e) => updateField("brand", e.target.value)}
                  />
                </${SellerField}>

                <${SellerField} label="SKU / артикул">
                  <${SellerInput}
                    type="text"
                    placeholder="AK-0001"
                    value=${form.sku}
                    onInput=${(e) => updateField("sku", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Badge / подпись">
                <${SellerInput}
                  type="text"
                  placeholder="Хит продаж"
                  value=${form.badge}
                  onInput=${(e) => updateField("badge", e.target.value)}
                />
              </${SellerField}>

              <${SellerField} label="Описание">
                <${SellerTextarea}
                  value=${form.description}
                  onInput=${(e) => updateField("description", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Изображение товара
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Можно оставить текущий mock image или загрузить новый
                </p>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Загрузить
                <input type="file" accept="image/*" className="hidden" onChange=${handleImagePick} />
              </label>
            </div>

            <div className="mt-4 glass-card rounded-3xl p-3">
              <img src=${form.image} alt="Preview" className="w-full h-48 object-cover rounded-2xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="#/seller/products"
              className="py-3 rounded-2xl text-center font-semibold"
              style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
            >
              Отмена
            </a>
            <button type="submit" className="py-3 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
              ${submitting ? "Сохраняем..." : isEdit ? "Сохранить изменения" : "Создать товар"}
            </button>
          </div>
        </form>
      </${SellerLayout}>
    `;
  }

  function OrderChatSummaryCard({
    order,
    orderChats,
    viewerRole = "buyer",
    actionLabel,
    actionPath
  }) {
    const lastMessage = getOrderChatLastMessage(orderChats, order?.id);
    const unreadCount = getOrderChatUnreadCount(orderChats, order?.id, viewerRole);
    const previewText = lastMessage
      ? getOrderChatPreviewText(lastMessage, viewerRole)
      : viewerRole === "seller"
        ? "Напишите покупателю по заказу"
        : "Напишите продавцу по заказу";
    const contactName =
      viewerRole === "seller"
        ? order?.customerName || "Покупатель"
        : order?.storeName || "Продавец";
    const contactMeta =
      viewerRole === "seller"
        ? order?.customerPhone || "Номер не указан"
        : order?.id || "Заказ";
    const avatarLabel = (
      String(contactName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("") || (viewerRole === "seller" ? "PK" : "DX")
    )
      .slice(0, 2)
      .toUpperCase();
    const phoneHref =
      viewerRole === "seller" && order?.customerPhone && String(order.customerPhone).trim()
        ? `tel:${String(order.customerPhone).replace(/[^\d+]/g, "")}`
        : "";

    return html`
      <div
        className="rounded-[26px] p-4 mt-4"
        style=${{
          background: "linear-gradient(180deg, rgba(20, 25, 37, 0.95) 0%, rgba(13, 16, 25, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.06)"
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-[16px] flex items-center justify-center text-sm font-bold flex-shrink-0"
            style=${{
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(15, 23, 42, 0.92) 100%)",
              border: "1px solid rgba(6, 182, 212, 0.12)",
              color: "var(--drivex-neon-cyan)"
            }}
          >
            ${avatarLabel}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                  ${contactName}
                </p>
                <p className="text-xs mt-1 truncate" style=${{ color: "var(--drivex-silver)" }}>
                  ${contactMeta}
                </p>
              </div>

              ${unreadCount
                ? html`<span
                    className="min-w-[28px] h-7 px-2 rounded-full text-xs font-semibold inline-flex items-center justify-center flex-shrink-0"
                    style=${{
                      background: "rgba(6, 182, 212, 0.16)",
                      color: "var(--drivex-neon-cyan)",
                      border: "1px solid rgba(6, 182, 212, 0.14)"
                    }}
                  >
                    ${unreadCount}
                  </span>`
                : null}
            </div>

            <p
              className="text-sm mt-3"
              style=${{
                color: "var(--drivex-white)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.45
              }}
            >
              ${previewText}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
            ${lastMessage ? formatChatTime(lastMessage.sentAt) : "Диалог ещё не начат"}
          </p>
          <div className="flex items-center gap-2">
            ${phoneHref
              ? html`<a
                  href=${phoneHref}
                  aria-label="Позвонить покупателю"
                  className="w-11 h-11 rounded-[16px] inline-flex items-center justify-center flex-shrink-0"
                  style=${{
                    background: "rgba(255, 255, 255, 0.04)",
                    color: "var(--drivex-neon-cyan)",
                    border: "1px solid rgba(255, 255, 255, 0.06)"
                  }}
                >
                  <${Icon} name="phone" size=${18} />
                </a>`
              : null}
            <a
              href=${`#${actionPath}`}
              className="px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap"
              style=${{
                background: "rgba(6, 182, 212, 0.16)",
                color: "var(--drivex-neon-cyan)",
                border: "1px solid rgba(6, 182, 212, 0.12)"
              }}
            >
              ${actionLabel}
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function OrderChatScreen({
    order,
    orderChats,
    viewerRole = "buyer",
    backPath = "/orders",
    currentUser,
    store,
    onSendMessage,
    onMarkRead
  }) {
    const toast = useToast();
    const [draftMessage, setDraftMessage] = useState("");
    const messagesEndRef = useRef(null);
    const safeViewerRole = viewerRole === "seller" ? "seller" : "buyer";
    const thread = useMemo(() => getOrderChatThread(orderChats, order?.id), [orderChats, order?.id]);
    const messages = thread.messages;

    useEffect(() => {
      setDraftMessage("");
    }, [order?.id, safeViewerRole]);

    useEffect(() => {
      if (!order?.id) return;
      onMarkRead && onMarkRead(order.id, safeViewerRole);
    }, [messages.length, onMarkRead, order?.id, safeViewerRole]);

    useEffect(() => {
      if (!messagesEndRef.current || typeof messagesEndRef.current.scrollIntoView !== "function") return;

      try {
        messagesEndRef.current.scrollIntoView({
          behavior: messages.length > 1 ? "smooth" : "auto",
          block: "end"
        });
      } catch {
        messagesEndRef.current.scrollIntoView();
      }
    }, [messages.length]);

    const handleSubmit = useCallback(
      (event) => {
        event.preventDefault();
        const text = String(draftMessage || "").trim();
        if (!text) {
          toast.push("Введите сообщение");
          return;
        }
        if (!order?.id) {
          toast.push("Заказ не найден");
          return;
        }
        onSendMessage && onSendMessage(order.id, safeViewerRole, text);
        setDraftMessage("");
      },
      [draftMessage, onSendMessage, order?.id, safeViewerRole, toast]
    );

    const statusMeta = order
      ? safeViewerRole === "seller"
        ? getSellerOrderStatusMeta(order.status)
        : getBuyerOrderStatusMeta(order.status)
      : getBuyerOrderStatusMeta("new");
    const itemsLabel =
      order && Array.isArray(order.items) && order.items.length
        ? order.items.map((item) => `${item.title} × ${item.qty}`).join(" • ")
        : "Состав заказа недоступен";
    const backLabel = safeViewerRole === "seller" ? "Назад к заказам магазина" : "Назад к истории заказов";
    const contactName =
      safeViewerRole === "seller"
        ? order?.customerName || "Покупатель"
        : order?.storeName || "Магазин DRIVEX";
    const contactMeta =
      safeViewerRole === "seller"
        ? order?.customerPhone || "Номер не указан"
        : formatRuDate(order?.date);
    const contactInitials = (
      String(contactName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("") || (safeViewerRole === "seller" ? "PK" : "DX")
    )
      .slice(0, 2)
      .toUpperCase();
    const phoneHref =
      order?.customerPhone && String(order.customerPhone).trim()
        ? `tel:${String(order.customerPhone).replace(/[^\d+]/g, "")}`
        : "";
    const metaChips = [order?.id || "Заказ", order?.deliveryMethod || "Доставка", formatTjsPrice(order?.amount)];
    const pageContent = order
      ? html`
          <div className=${safeViewerRole === "seller" ? "space-y-4" : "px-6 py-6 space-y-4"}>
            ${safeViewerRole === "seller"
              ? html`<a
                  href=${`#${backPath}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                  style=${{ color: "var(--drivex-neon-cyan)" }}
                >
                  <${Icon} name="chevron-left" size=${16} />
                  ${backLabel}
                </a>`
              : null}

            <div
              className="rounded-[30px] p-5"
              style=${{
                background: "linear-gradient(180deg, rgba(18, 24, 38, 0.92) 0%, rgba(10, 13, 20, 0.98) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.14)"
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-[18px] flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style=${{
                    background: "linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(15, 23, 42, 0.92) 100%)",
                    border: "1px solid rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  ${contactInitials}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold truncate" style=${{ color: "var(--drivex-white)" }}>
                        ${contactName}
                      </h2>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        ${contactMeta}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      ${safeViewerRole === "seller" && phoneHref
                        ? html`<a
                            href=${phoneHref}
                            aria-label="Позвонить покупателю"
                            className="w-10 h-10 rounded-[16px] inline-flex items-center justify-center"
                            style=${{
                              background: "rgba(255, 255, 255, 0.04)",
                              color: "var(--drivex-neon-cyan)",
                              border: "1px solid rgba(255, 255, 255, 0.06)"
                            }}
                          >
                            <${Icon} name="phone" size=${18} />
                          </a>`
                        : null}
                      <span
                        className="px-3 py-1 rounded-xl text-xs font-semibold"
                        style=${{
                          background: alphaBg(statusMeta.color, 0.18),
                          color: statusMeta.color
                        }}
                      >
                        ${statusMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    ${metaChips.map((chip, index) => html`
                      <span
                        key=${`${order.id}-chat-meta-${index}`}
                        className="px-3 py-1.5 rounded-full text-xs"
                        style=${{
                          background: "rgba(255, 255, 255, 0.04)",
                          color: "var(--drivex-silver)",
                          border: "1px solid rgba(255, 255, 255, 0.05)"
                        }}
                      >
                        ${chip}
                      </span>
                    `)}
                  </div>

                  <p
                    className="text-sm mt-4"
                    style=${{
                      color: "var(--drivex-white)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    ${itemsLabel}
                  </p>

                  <p
                    className="text-xs mt-4"
                    style=${{
                      color: "var(--drivex-silver)",
                      lineHeight: 1.45
                    }}
                  >
                    ${order.address || "Адрес уточняется"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="px-1 py-1"
              style=${{
                background: "transparent",
                border: "none"
              }}
            >
              <div className="space-y-3">
                ${messages.length
                  ? messages.map((message) => {
                      const isOwnMessage = message.senderRole === safeViewerRole;
                      return html`
                        <div
                          key=${message.id}
                          className=${`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div className="max-w-[76%]">
                            <div
                              className="px-4"
                              style=${{
                                paddingTop: "14px",
                                paddingBottom: "10px",
                                borderRadius: isOwnMessage ? "26px 26px 12px 26px" : "26px 26px 26px 12px",
                                background: isOwnMessage ? "rgba(6, 182, 212, 0.13)" : "rgba(255, 255, 255, 0.035)",
                                border: isOwnMessage
                                  ? "1px solid rgba(6, 182, 212, 0.14)"
                                  : "1px solid rgba(255, 255, 255, 0.06)",
                                boxShadow: isOwnMessage
                                  ? "0 12px 26px rgba(6, 182, 212, 0.06)"
                                  : "0 10px 22px rgba(0, 0, 0, 0.12)"
                              }}
                            >
                              <p
                                className="whitespace-pre-wrap"
                                style=${{
                                  color: "var(--drivex-white)",
                                  wordBreak: "break-word",
                                  fontSize: "15px",
                                  lineHeight: 1.58
                                }}
                              >
                                ${message.text}
                              </p>
                              <div className=${`mt-1.5 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                <span
                                  className="text-[11px]"
                                  style=${{
                                    color: "var(--drivex-silver)",
                                    lineHeight: 1,
                                    transform: "translateY(-1px)"
                                  }}
                                >
                                  ${formatChatTime(message.sentAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      `;
                    })
                  : html`<div className="py-12 text-center">
                      <div
                        className="w-14 h-14 rounded-[18px] mx-auto flex items-center justify-center text-sm font-bold"
                        style=${{
                          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(15, 23, 42, 0.9) 100%)",
                          border: "1px solid rgba(6, 182, 212, 0.12)",
                          color: "var(--drivex-neon-cyan)"
                        }}
                      >
                        ${contactInitials}
                      </div>
                      <p className="font-semibold mt-4" style=${{ color: "var(--drivex-white)" }}>
                        Пока сообщений нет
                      </p>
                      <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                        ${safeViewerRole === "seller" ? "Напишите покупателю первым." : "Напишите продавцу первым."}
                      </p>
                    </div>`}
                <div ref=${messagesEndRef}></div>
              </div>
            </div>

            <form
              className="rounded-full p-2"
              onSubmit=${handleSubmit}
              style=${{
                background: "rgba(12, 15, 22, 0.97)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "0 12px 28px rgba(0, 0, 0, 0.12)"
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style=${{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    color: "var(--drivex-silver)"
                  }}
                >
                  <${Icon} name="smile" size=${20} />
                </div>
                <div
                  className="flex-1 rounded-full px-5 py-3.5"
                  style=${{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.04)"
                  }}
                >
                  <textarea
                    rows="1"
                    value=${draftMessage}
                    onInput=${(event) => setDraftMessage(event.target.value)}
                    placeholder=${safeViewerRole === "seller" ? "Ответить покупателю..." : "Написать продавцу..."}
                    className="w-full outline-none dx-input"
                    style=${{
                      color: "var(--drivex-white)",
                      minHeight: "26px",
                      maxHeight: "120px",
                      resize: "none",
                      background: "transparent",
                      padding: 0,
                      lineHeight: 1.45
                    }}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="px-8 h-14 rounded-full text-sm font-semibold whitespace-nowrap"
                  disabled=${!draftMessage.trim()}
                  style=${{
                    background: draftMessage.trim()
                      ? "linear-gradient(135deg, rgba(6, 182, 212, 0.92) 0%, rgba(8, 145, 178, 0.96) 100%)"
                      : "linear-gradient(135deg, rgba(6, 182, 212, 0.48) 0%, rgba(8, 145, 178, 0.54) 100%)",
                    color: "var(--drivex-white)",
                    border: "1px solid rgba(6, 182, 212, 0.22)",
                    opacity: draftMessage.trim() ? 1 : 0.6,
                    boxShadow: draftMessage.trim() ? "0 14px 30px rgba(6, 182, 212, 0.16)" : "none"
                  }}
                >
                  Отправить
                </button>
              </div>
            </form>
          </div>
        `
      : html`
          <div className=${safeViewerRole === "seller" ? "space-y-4" : "px-6 py-6 space-y-4"}>
            <a
              href=${`#${backPath}`}
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style=${{ color: "var(--drivex-neon-cyan)" }}
            >
              <${Icon} name="chevron-left" size=${16} />
              ${backLabel}
            </a>
            <div className="glass-card-light rounded-3xl p-6 text-center">
              <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                Заказ для чата не найден
              </p>
              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                Вернитесь к списку заказов и откройте чат из карточки нужного заказа.
              </p>
            </div>
          </div>
        `;

    return safeViewerRole === "seller"
        ? html`
          <${SellerLayout}
            title="Чат по заказу"
            subtitle="Связь с покупателем по заказу."
            activeItem="orders"
            currentUser=${currentUser}
            store=${store}
            showStoreSummary=${false}
          >
            ${pageContent}
          </${SellerLayout}>
        `
      : html`
          <${SimplePage} title="Чат по заказу" backPath=${backPath}>
            ${pageContent}
          </${SimplePage}>
        `;
  }

  function SellerOrdersScreen({ currentUser, store, orders, orderChats, onUpdateOrderStatus }) {
    const toast = useToast();
    const [updatingOrderIds, setUpdatingOrderIds] = useState({});
    const sortedOrders = useMemo(() => {
      return [...(Array.isArray(orders) ? orders : [])].sort((left, right) =>
        String(right.date).localeCompare(String(left.date))
      );
    }, [orders]);
    const handleOrderAction = useCallback(
      async (order, action) => {
        if (!order?.id || !action?.status || updatingOrderIds[order.id]) return;

        setUpdatingOrderIds((prev) => ({
          ...prev,
          [order.id]: true
        }));

        try {
          await onUpdateOrderStatus(order.id, action.status);
          toast.push(action.successMessage || "Статус заказа обновлён");
        } finally {
          setUpdatingOrderIds((prev) => {
            const next = { ...prev };
            delete next[order.id];
            return next;
          });
        }
      },
      [onUpdateOrderStatus, toast, updatingOrderIds]
    );

    return html`
      <${SellerLayout}
        title="Заказы магазина"
        subtitle="Меняйте статусы, отслеживайте суммы и держите команду в курсе по каждому заказу."
        activeItem="orders"
        currentUser=${currentUser}
        store=${store}
      >
        <div className="space-y-4">
          ${sortedOrders.length
            ? sortedOrders.map((order) => {
                const statusMeta = getSellerOrderStatusMeta(order.status);
                const isPickupOrder = isPickupSellerOrder(order);
                const nextActions = getSellerOrderActions(order);
                const isStatusLocked = nextActions.length === 0;
                const isUpdating = Boolean(updatingOrderIds[order.id]);
                const orderPhoneHref =
                  order?.customerPhone && String(order.customerPhone).trim()
                    ? `tel:${String(order.customerPhone).replace(/[^\d+]/g, "")}`
                    : "";
                const itemsCount = (Array.isArray(order.items) ? order.items : []).reduce(
                  (sum, item) => sum + (Number(item.qty) || 0),
                  0
                );
                const statusHint = isStatusLocked
                  ? order.status === "completed"
                    ? "Заказ завершён"
                    : "Заказ закрыт"
                  : isPickupOrder
                    ? "Ожидает следующий шаг по самовывозу"
                    : "Ожидает следующий шаг по доставке";

                return html`
                  <div
                    key=${order.id}
                    className="rounded-[30px] p-5"
                    style=${{
                      background: "linear-gradient(180deg, rgba(20, 25, 37, 0.94) 0%, rgba(12, 16, 24, 0.98) 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.14)"
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${order.id}
                        </p>
                        <p className="text-sm mt-1 truncate" style=${{ color: "var(--drivex-silver)" }}>
                          ${order.customerName} • ${order.customerPhone}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          ${[formatRuDate(order.date), order.deliveryMethod, `${itemsCount} товара`].map((chip, index) => html`
                            <span
                              key=${`${order.id}-seller-chip-${index}`}
                              className="px-3 py-1.5 rounded-full text-xs"
                              style=${{
                                background: "rgba(255, 255, 255, 0.04)",
                                color: "var(--drivex-silver)",
                                border: "1px solid rgba(255, 255, 255, 0.05)"
                              }}
                            >
                              ${chip}
                            </span>
                          `)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        ${orderPhoneHref
                          ? html`<a
                              href=${orderPhoneHref}
                              aria-label="Позвонить покупателю"
                              className="w-10 h-10 rounded-[16px] inline-flex items-center justify-center"
                              style=${{
                                background: "rgba(255, 255, 255, 0.04)",
                                color: "var(--drivex-neon-cyan)",
                                border: "1px solid rgba(255, 255, 255, 0.06)"
                              }}
                            >
                              <${Icon} name="phone" size=${18} />
                            </a>`
                          : null}
                        <span
                          className="px-3 py-1 rounded-xl text-xs font-semibold"
                          style=${{
                            background: alphaBg(statusMeta.color, 0.18),
                            color: statusMeta.color
                          }}
                        >
                          ${statusMeta.label}
                        </span>
                      </div>
                    </div>

                    <div
                      className="rounded-[24px] p-4 mt-4"
                      style=${{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.05)"
                      }}
                    >
                      <div className="space-y-2">
                        ${order.items.map((item) => html`
                          <div key=${`${order.id}-${item.title}`} className="flex items-center justify-between gap-3">
                            <span className="text-sm" style=${{ color: "var(--drivex-white)" }}>
                              ${item.title} × ${item.qty}
                            </span>
                            <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                              ${formatTjsPrice(item.qty * item.price)}
                            </span>
                          </div>
                        `)}
                      </div>
                    </div>

                    <${OrderStatusTimeline} order=${order} variant="seller" />

                    <p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)", lineHeight: 1.5 }}>
                      ${order.address || "Адрес будет уточнён"}${order.notes ? ` • ${order.notes}` : ""}
                    </p>

                    <${OrderChatSummaryCard}
                      order=${order}
                      orderChats=${orderChats}
                      viewerRole="seller"
                      actionLabel="Ответить покупателю"
                      actionPath=${getSellerOrderChatPath(order.id)}
                    />

                    <div className="flex items-center justify-between gap-3 mt-4">
                      <div>
                        <p className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                          ${formatTjsPrice(order.amount)}
                        </p>
                        <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                          ${cloudEnabled
                            ? "Документы сохраняются в облаке и доступны под вашей учётной записью."
                            : "Фото документов сохранено на этом устройстве"}
                        </p>
                      </div>
                      <div className="min-w-[180px] text-right">
                        <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                          ${isUpdating
                            ? "Сохраняем статус..."
                            : isStatusLocked
                              ? "Финальный статус"
                              : "Следующий шаг заказа"}
                        </p>
                        <p className="font-semibold mt-2" style=${{ color: statusMeta.color }}>
                          ${statusMeta.label}
                        </p>
                      </div>
                    </div>

                    ${nextActions.length
                      ? html`<div className="flex gap-2 mt-4 flex-wrap">
                          ${nextActions.map((action) => {
                            const isCancelAction = action.status === "cancelled";

                            return html`<button
                              key=${`${order.id}-${action.id}`}
                              type="button"
                              className="px-5 h-12 rounded-full text-sm font-semibold inline-flex items-center justify-center"
                              disabled=${isUpdating}
                              style=${{
                                minWidth: isCancelAction ? "132px" : "164px",
                                background: isCancelAction
                                  ? alphaBg(action.color, 0.12)
                                  : `linear-gradient(135deg, ${alphaBg(action.color, 0.26)} 0%, ${alphaBg(action.color, 0.12)} 100%)`,
                                color: action.color,
                                border: `1px solid ${alphaBg(action.color, isCancelAction ? 0.16 : 0.2)}`,
                                boxShadow: isCancelAction ? "none" : `0 14px 28px ${alphaBg(action.color, 0.12)}`,
                                opacity: isUpdating ? 0.6 : 1
                              }}
                              onClick=${() => handleOrderAction(order, action)}
                            >
                              ${isUpdating ? "Сохраняем..." : action.label}
                            </button>`;
                          })}
                        </div>`
                      : html`<div className="mt-4">
                          <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                            ${order.status === "completed"
                              ? "Заказ завершён и закрыт."
                              : "Заказ отменён. Дальнейшие действия не требуются."}
                          </p>
                        </div>`}
                  </div>
                `;
              })
            : html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Заказов пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  Когда покупатели оформят товары, новые заказы появятся здесь.
                </p>
              </div>`}
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerStoreSettingsScreen({ currentUser, store, onSaveStore }) {
    const toast = useToast();
    const [form, setForm] = useState(() => createSellerStoreFormState(store));
    const [submitting, setSubmitting] = useState(false);
    const safeStore = normalizeSellerStore(store);
    const setupState = getSellerSetupState(store, {
      ownerFullName: form.ownerName || safeStore.ownerName,
      phone: form.phone,
      registrationCompleted: safeStore.registrationCompleted
    });

    useEffect(() => {
      setForm(createSellerStoreFormState(store));
    }, [store?.id]);

    const updateField = useCallback((key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleLogoPick = useCallback(
      async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareAvatarDataUrl(file, { size: 320, quality: 0.9 });
          if (!dataUrl) {
            toast.push("Логотип не удалось загрузить");
            return;
          }
          updateField("logo", dataUrl);
          toast.push("Логотип обновлён");
        } catch {
          toast.push("Файл не подходит");
        }
      },
      [toast, updateField]
    );

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        try {
          setSubmitting(true);
          await onSaveStore(
            normalizeSellerStore(
              {
                ...(store || {}),
                ...form
              },
              store?.id
            )
          );
          toast.push("Настройки магазина сохранены");
        } finally {
          setSubmitting(false);
        }
      },
      [form, onSaveStore, store, toast]
    );

    return html`
      <${SellerLayout}
        title="Настройки магазина"
        subtitle="Профиль магазина редактируется отдельно от клиентской витрины. Адрес, локация и выдача выровнены под быстрый seller setup."
        activeItem="store"
        currentUser=${currentUser}
        store=${store}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center gap-4">
              <${SellerLogo} store=${{ ...store, logo: form.logo, name: form.name }} size=${72} rounded="22px" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Логотип магазина
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Можно загрузить новый логотип или оставить текущий placeholder.
                </p>
                <div className="flex gap-2 flex-wrap mt-3">
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style=${{
                      background: setupState.isProfileComplete ? "rgba(16, 185, 129, 0.16)" : "rgba(245, 158, 11, 0.16)",
                      color: setupState.isProfileComplete ? "var(--drivex-success)" : "var(--drivex-warning)"
                    }}
                  >
                    ${setupState.isProfileComplete ? "Профиль завершён" : "Setup продолжается"}
                  </span>
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style=${{
                      background: "rgba(6, 182, 212, 0.16)",
                      color: "var(--drivex-neon-cyan)"
                    }}
                  >
                    ${setupState.completedCount}/${setupState.totalCount} пунктов
                  </span>
                </div>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Загрузить
                <input type="file" accept="image/*" className="hidden" onChange=${handleLogoPick} />
              </label>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Профиль магазина
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Основная информация о магазине и владельце
                </p>
              </div>
              <span
                className="px-3 py-1 rounded-xl text-xs font-semibold"
                style=${{
                  background: "rgba(14, 165, 233, 0.16)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                ${form.storeCategory || "Категория"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Название магазина">
                <${SellerInput} type="text" value=${form.name} onInput=${(e) => updateField("name", e.target.value)} />
              </${SellerField}>
              <${SellerField} label="Владелец">
                <${SellerInput}
                  type="text"
                  value=${form.ownerName}
                  onInput=${(e) => updateField("ownerName", e.target.value)}
                />
              </${SellerField}>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Город">
                <${SellerInput} type="text" value=${form.city} onInput=${(e) => updateField("city", e.target.value)} />
              </${SellerField}>
              <${SellerField} label="Телефон">
                <${SellerInput} type="tel" value=${form.phone} onInput=${(e) => updateField("phone", e.target.value)} />
              </${SellerField}>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Категория магазина">
                  <${SellerSelect}
                    value=${form.storeCategory}
                    onChange=${(e) => updateField("storeCategory", e.target.value)}
                  >
                    <option value="">Выберите категорию</option>
                    ${sellerStoreCategoryOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Тип продаж">
                  <${SellerSelect}
                    value=${form.businessType}
                    onChange=${(e) => updateField("businessType", e.target.value)}
                  >
                    <option value="">Выберите тип продаж</option>
                    ${sellerBusinessTypeOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style=${{
                  background: "rgba(14, 165, 233, 0.16)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                <${Icon} name="map" size=${19} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Адрес и локация
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Аккуратный блок адреса для карты, доставки и самовывоза
                </p>
              </div>
            </div>

            <${SellerField} label="Точный адрес">
              <${SellerInput} type="text" value=${form.address} onInput=${(e) => updateField("address", e.target.value)} />
            </${SellerField}>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Ориентир / метка">
                <${SellerInput}
                  type="text"
                  value=${form.locationLabel}
                  onInput=${(e) => updateField("locationLabel", e.target.value)}
                />
              </${SellerField}>
              <${SellerField} label="Геолокация">
                <${SellerInput}
                  type="text"
                  value=${form.geolocation}
                  onInput=${(e) => updateField("geolocation", e.target.value)}
                />
              </${SellerField}>
            </div>

            <div
              className="rounded-3xl p-4"
              style=${{
                background: "linear-gradient(145deg, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.88) 100%)",
                border: "1px solid rgba(14, 165, 233, 0.18)"
              }}
            >
              <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                Preview location
              </p>
              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                ${form.city || "Город"} • ${form.address || "Адрес пока не указан"}
              </p>
              <p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                ${form.locationLabel || "Добавьте ориентир"}${form.geolocation ? ` • ${form.geolocation}` : ""}
              </p>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Формат продаж
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Настройте выдачу, доставку и часы работы магазина
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                style=${{
                  background: form.deliveryAvailable ? "rgba(16, 185, 129, 0.16)" : "var(--glass-bg)",
                  color: form.deliveryAvailable ? "var(--drivex-success)" : "var(--drivex-white)"
                }}
                onClick=${() => updateField("deliveryAvailable", !form.deliveryAvailable)}
              >
                Доставка ${form.deliveryAvailable ? "включена" : "выключена"}
              </button>
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                style=${{
                  background: form.pickupAvailable ? "rgba(14, 165, 233, 0.16)" : "var(--glass-bg)",
                  color: form.pickupAvailable ? "var(--drivex-electric-blue)" : "var(--drivex-white)"
                }}
                onClick=${() => updateField("pickupAvailable", !form.pickupAvailable)}
              >
                Самовывоз ${form.pickupAvailable ? "включен" : "выключен"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Радиус доставки">
                <${SellerInput}
                  type="text"
                  value=${form.deliveryRadius}
                  onInput=${(e) => updateField("deliveryRadius", e.target.value)}
                />
              </${SellerField}>
              <${SellerField} label="Часы работы">
                <${SellerInput}
                  type="text"
                  value=${form.workingHours}
                  onInput=${(e) => updateField("workingHours", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5 space-y-4">
            <${SellerField} label="Описание магазина">
              <${SellerTextarea}
                value=${form.description}
                onInput=${(e) => updateField("description", e.target.value)}
              />
            </${SellerField}>

            <div className="flex items-center justify-between gap-3">
              <a
                href=${setupState.isProfileComplete ? "#/seller/products" : "#/seller/onboarding"}
                className="py-3 px-4 rounded-2xl text-center font-semibold"
                style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
              >
                ${setupState.isProfileComplete ? "К товарам" : "К onboarding"}
              </a>
              <button type="submit" className="px-5 py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
                ${submitting ? "Сохраняем..." : "Сохранить настройки"}
              </button>
            </div>
          </div>
        </form>
      </${SellerLayout}>
    `;
  }

  function SellerNotFoundScreen({ currentUser, store }) {
    return html`
      <${SellerLayout}
        title="Страница не найдена"
        subtitle="Проверьте seller route или вернитесь в основные разделы кабинета."
        activeItem="dashboard"
        currentUser=${currentUser}
        store=${store}
      >
        <div className="glass-card-light rounded-3xl p-6">
          <a href="#/seller/dashboard" className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
            В dashboard
          </a>
        </div>
      </${SellerLayout}>
    `;
  }

  function getServicePhoneHref(phone = "") {
    const safePhone = String(phone || "").trim().replace(/[^\d+]/g, "");
    return safePhone ? `tel:${safePhone}` : "";
  }

  function ServiceStatusChip({ label, color }) {
    return html`<span
      className="px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-2"
      style=${{
        background: alphaBg(color, 0.16),
        color,
        border: `1px solid ${alphaBg(color, 0.24)}`
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style=${{ background: color }}
      ></span>
      ${label}
    </span>`;
  }

  function ServicePhoneButton({ phone, label = "Позвонить", compact = false }) {
    const href = getServicePhoneHref(phone);
    if (!href) return null;

    return html`<a
      href=${href}
      className=${compact
        ? "w-12 h-12 rounded-2xl inline-flex items-center justify-center flex-shrink-0"
        : "px-4 py-3 rounded-2xl inline-flex items-center justify-center gap-2 text-sm font-semibold"}
      style=${{
        background: compact ? "rgba(14, 165, 233, 0.12)" : "rgba(14, 165, 233, 0.14)",
        color: "var(--drivex-electric-blue)",
        border: "1px solid rgba(14, 165, 233, 0.18)",
        boxShadow: compact ? "0 10px 20px rgba(14, 165, 233, 0.12)" : "none"
      }}
      aria-label=${label}
    >
      <${Icon} name="phone" size=${compact ? 18 : 16} />
      ${compact ? null : label}
    </a>`;
  }

  function ServiceCrmLayout({
    title,
    subtitle,
    activeItem,
    currentUser,
    center,
    primaryAction,
    showCenterSummary = true,
    showNavigation = true,
    children
  }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeUser = normalizeServiceSession(currentUser);
    const logoStore = {
      ...safeCenter,
      accent: "var(--drivex-electric-blue)"
    };

    return html`
      <div className="min-h-screen" style=${{ background: "var(--drivex-black)" }}>
        <div
          className="pt-8 pb-6 px-5"
          style=${{
            background: "linear-gradient(180deg, rgba(7, 17, 31, 0.98) 0%, rgba(10, 10, 15, 1) 100%)"
          }}
        >
          <a
            href="#/services"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style=${{ color: "var(--drivex-silver)" }}
          >
            <${Icon} name="chevron-left" size=${16} />
            В сервисы
          </a>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                DRIVEX SERVICE CRM
              </p>
              <h1 className="text-3xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${title}
              </h1>
              <p className="text-sm mt-2 max-w-[260px]" style=${{ color: "var(--drivex-silver)" }}>
                ${subtitle}
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2">
                <a
                  href="#/services"
                  className="px-3 py-2 rounded-2xl text-xs font-semibold"
                  style=${{
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "var(--drivex-white)"
                  }}
                >
                  Каталог
                </a>
                ${showNavigation
                  ? html`<a
                      href="#/service-crm/login?logout=1"
                      className="px-3 py-2 rounded-2xl text-xs font-semibold"
                      style=${{
                        background: "rgba(239, 68, 68, 0.14)",
                        color: "var(--drivex-danger)"
                      }}
                    >
                      Выйти
                    </a>`
                  : null}
              </div>
              <${SellerLogo} store=${logoStore} size=${60} rounded="20px" />
            </div>
          </div>

          ${showCenterSummary
            ? html`<div className="glass-card-light rounded-3xl p-4 mt-5">
                <div className="flex items-center gap-3">
                  <${SellerLogo} store=${logoStore} size=${46} rounded="16px" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                      ${safeCenter.name || "Новый сервис"}
                    </p>
                    <p className="text-sm mt-1 truncate" style=${{ color: "var(--drivex-silver)" }}>
                      ${safeCenter.serviceType || "Тип сервиса"} • ${safeCenter.city || "Город"} • ${safeCenter.boxesCount} бокса
                    </p>
                    <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${safeUser.name || "Владелец сервиса"}${safeCenter.phone ? ` • ${safeCenter.phone}` : ""}
                    </p>
                  </div>
                  ${primaryAction
                    ? html`<a
                        href=${`#${primaryAction.path}`}
                        className="px-4 py-3 rounded-2xl text-sm font-semibold dx-btn whitespace-nowrap"
                      >
                        ${primaryAction.label}
                      </a>`
                    : null}
                </div>
              </div>`
            : null}

          ${showNavigation
            ? html`<div className="flex gap-2 overflow-x-auto pb-1 mt-5 no-scrollbar">
                ${serviceCrmNavigationItems.map((item) => {
                  const isActive = item.id === activeItem;
                  return html`
                    <a
                      key=${item.id}
                      href=${`#${item.path}`}
                      className="px-4 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap flex items-center gap-2"
                      style=${{
                        background: isActive ? "rgba(6, 182, 212, 0.18)" : "var(--glass-bg)",
                        color: isActive ? "var(--drivex-neon-cyan)" : "var(--drivex-white)",
                        border: isActive
                          ? "1px solid rgba(6, 182, 212, 0.32)"
                          : "1px solid var(--glass-border)"
                      }}
                    >
                      <${Icon} name=${item.icon} size=${16} />
                      ${item.label}
                    </a>
                  `;
                })}
              </div>`
            : null}
        </div>

        <div className="px-5 py-5 space-y-4">${children}</div>
      </div>
    `;
  }

  function ServicePartnerRegisterIntroScreen({ onStart }) {
    const highlights = [
      {
        title: "Клиенты и машины",
        body: "База клиентов, история визитов, номера телефонов и автомобили в одной ленте.",
        color: "var(--drivex-electric-blue)",
        icon: "user"
      },
      {
        title: "Ремонты по статусам",
        body: "Онлайн статусы ремонта: в очереди, в работе и готово без путаницы по бумажкам.",
        color: "var(--drivex-warning)",
        icon: "wrench"
      },
      {
        title: "Склад и финансы",
        body: "Остатки запчастей, выручка, расходы и отчёты прямо внутри CRM.",
        color: "var(--drivex-success)",
        icon: "card"
      }
    ];

    return html`
      <${ServiceCrmLayout}
        title="Отдельный CRM для сервиса"
        subtitle="Сначала заполняем карточку автосервиса, затем сразу открываем рабочий кабинет мастера и администратора."
        activeItem="dashboard"
        currentUser=${createDefaultServiceSession()}
        center=${createServiceCenterSeed()}
        showCenterSummary=${false}
        showNavigation=${false}
      >
        <div
          className="rounded-[32px] p-6"
          style=${{
            background: "linear-gradient(145deg, rgba(6, 182, 212, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)",
            border: "1px solid rgba(6, 182, 212, 0.18)"
          }}
        >
          <p className="text-xs font-semibold tracking-[0.22em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
            SERVICE FIRST
          </p>
          <h2 className="text-[34px] font-bold mt-3" style=${{ color: "var(--drivex-white)", lineHeight: "1.08" }}>
            Современный digital-кабинет
            <br />
            для автосервиса
          </h2>
          <p className="text-sm mt-4 max-w-[320px]" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
            Регистрируете сервис один раз, после чего получаете удобную платформу: запись, ремонты, клиенты,
            склад и финансы на русском языке.
          </p>

          <div className="flex flex-wrap gap-2 mt-5">
            ${["Онлайн статусы ремонта", "Телефон под рукой", "Боксы и загрузка", "Отчёты без Excel"].map((chip) => html`
              <span
                key=${chip}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style=${{
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "var(--drivex-white)"
                }}
              >
                ${chip}
              </span>
            `)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          ${highlights.map((item) => html`
            <div key=${item.title} className="glass-card-light rounded-3xl p-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style=${{
                  background: alphaBg(item.color, 0.18),
                  color: item.color
                }}
              >
                <${Icon} name=${item.icon} size=${22} />
              </div>
              <p className="text-lg font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                ${item.title}
              </p>
              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                ${item.body}
              </p>
            </div>
          `)}
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
            Что будет сразу после регистрации
          </p>
          <div className="space-y-3 mt-4">
            ${[
              "Учет клиентов и машин",
              "Заказы на ремонт с живыми статусами",
              "Склад запчастей и минимальные остатки",
              "Финансы и отчёты по выручке",
              "Расписание по боксам: кто занят, кто свободен"
            ].map((line) => html`
              <div key=${line} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style=${{
                    background: "rgba(6, 182, 212, 0.14)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="check" size=${14} />
                </div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  ${line}
                </p>
              </div>
            `)}
          </div>
        </div>

        <button type="button" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" onClick=${() => onStart && onStart()}>
          Зарегистрировать сервис
        </button>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceLoginScreen({ onLogin, onGoRegister, message = "" }) {
    const toast = useToast();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        if (!String(identifier || "").trim()) {
          toast.push("Введите email или телефон");
          return;
        }
        if (!String(password || "").trim()) {
          toast.push("Введите пароль");
          return;
        }

        try {
          setSubmitting(true);
          setFormError("");
          await onLogin?.({
            identifier,
            email: identifier,
            phone: identifier,
            password
          });
        } catch (error) {
          const nextError = error?.message || "Не удалось войти в Service CRM";
          setFormError(nextError);
          toast.push(nextError);
        } finally {
          setSubmitting(false);
        }
      },
      [identifier, onLogin, password, toast]
    );

    return html`
      <${ServiceCrmLayout}
        title="Вход в Service CRM"
        subtitle="Войдите по email или телефону и продолжайте работу с клиентами, ремонтом, записью и финансами."
        activeItem="dashboard"
        currentUser=${createDefaultServiceSession()}
        center=${createServiceCenterSeed("service-login")}
        showCenterSummary=${false}
        showNavigation=${false}
      >
        <div className="glass-card-light rounded-[32px] p-6 text-center">
          <div
            className="mx-auto w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
            style=${{
              background: "linear-gradient(135deg, rgba(14, 165, 233, 0.94) 0%, rgba(6, 182, 212, 0.96) 100%)",
              color: "var(--drivex-white)",
              boxShadow: "0 18px 36px rgba(14, 165, 233, 0.24)"
            }}
          >
            <${Icon} name="wrench" size=${32} />
          </div>

          <p className="text-xs font-semibold mt-4 tracking-[0.22em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
            DRIVEX SERVICE LOGIN
          </p>
          <h2 className="text-[34px] font-bold mt-3" style=${{ color: "var(--drivex-white)", lineHeight: "1.1" }}>
            Добро пожаловать
          </h2>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
            Используйте email или телефон владельца и пароль, который задали при регистрации сервиса.
          </p>
        </div>

        ${message
          ? html`<div className="glass-card-light rounded-3xl p-4">
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                ${message}
              </p>
            </div>`
          : null}

        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="space-y-4">
              <${SellerField} label="Email или телефон">
                <${SellerInput}
                  type="text"
                  placeholder="Например: service@drivex.app или +992..."
                  value=${identifier}
                  onInput=${(e) => {
                    setFormError("");
                    setIdentifier(e.target.value);
                  }}
                />
              </${SellerField}>

              <${SellerField} label="Пароль">
                <${SellerInput}
                  type="password"
                  placeholder="Ваш пароль"
                  value=${password}
                  onInput=${(e) => {
                    setFormError("");
                    setPassword(e.target.value);
                  }}
                />
              </${SellerField}>
            </div>

            ${formError
              ? html`<div className="glass-card rounded-2xl p-4 mt-4">
                  <p className="text-sm" style=${{ color: "var(--drivex-warning)" }}>
                    ${formError}
                  </p>
                </div>`
              : null}

            <button
              type="submit"
              className="w-full mt-5 py-4 rounded-2xl text-sm font-bold dx-btn"
              disabled=${submitting}
            >
              ${submitting ? "Входим..." : "Войти в CRM"}
            </button>
          </div>
        </form>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                Ещё не зарегистрировали сервис?
              </p>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Сначала создайте сервис, потом входите в кабинет по своим данным.
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-3 rounded-2xl text-sm font-semibold"
              style=${{
                background: "rgba(6, 182, 212, 0.16)",
                color: "var(--drivex-neon-cyan)"
              }}
              onClick=${() => onGoRegister && onGoRegister()}
            >
              Регистрация
            </button>
          </div>
        </div>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceRegistrationScreen({ currentUser, profile, center, onRegister }) {
    const toast = useToast();
    const [profileForm, setProfileForm] = useState(() => normalizeServiceProfile(profile, currentUser));
    const [centerForm, setCenterForm] = useState(() => createServiceCenterFormState(center));
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const updateProfileField = useCallback((key, value) => {
      setFormError("");
      setProfileForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const updateCenterField = useCallback((key, value) => {
      setFormError("");
      setCenterForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleLogoPick = useCallback(
      async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareAvatarDataUrl(file, { size: 320, quality: 0.9 });
          if (!dataUrl) {
            toast.push("Логотип не удалось загрузить");
            return;
          }
          updateCenterField("logo", dataUrl);
          toast.push("Логотип добавлен");
        } catch {
          toast.push("Файл не подходит");
        }
      },
      [toast, updateCenterField]
    );

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        const requiredFields = [
          [profileForm.ownerFullName, "Введите ФИО владельца"],
          [profileForm.phone, "Введите телефон владельца"],
          [profileForm.email, "Введите email"],
          [profileForm.password, "Введите пароль"],
          [centerForm.name, "Введите название сервиса"],
          [centerForm.serviceType, "Выберите тип сервиса"],
          [centerForm.city, "Введите город"],
          [centerForm.address, "Введите адрес сервиса"]
        ];

        const firstMissing = requiredFields.find(([value]) => !String(value || "").trim());
        if (firstMissing) {
          setFormError(firstMissing[1]);
          toast.push(firstMissing[1]);
          return;
        }

        if (!isCompleteTjPhone(profileForm.phone)) {
          const phoneError = "Введите полный номер владельца после +992";
          setFormError(phoneError);
          toast.push(phoneError);
          return;
        }

        try {
          setSubmitting(true);
          setFormError("");
          const ownerPhone = normalizeTjPhoneInput(profileForm.phone);
          const centerPhone = isCompleteTjPhone(centerForm.phone)
            ? normalizeTjPhoneInput(centerForm.phone)
            : ownerPhone;

          await onRegister({
            profile: {
              ...profileForm,
              phone: ownerPhone,
              registrationCompleted: true
            },
            center: {
              ...centerForm,
              boxesCount: Math.max(1, Math.floor(Number(centerForm.boxesCount) || 1)),
              phone: centerPhone,
              email: centerForm.email || profileForm.email,
              description:
                centerForm.description || `${centerForm.name || "Сервис"} — цифровой сервисный центр DRIVEX.`,
              registrationCompleted: true,
              status: "active"
            }
          });
        } catch (error) {
          const nextError = error?.message || "Не удалось зарегистрировать сервис";
          setFormError(nextError);
          toast.push(nextError);
        } finally {
          setSubmitting(false);
        }
      },
      [centerForm, onRegister, profileForm, toast]
    );

    const previewCenter = {
      ...center,
      ...centerForm,
      boxesCount: Math.max(1, Math.floor(Number(centerForm.boxesCount) || 1))
    };

    return html`
      <${ServiceCrmLayout}
        title="Регистрация сервиса"
        subtitle="Заполните базовую информацию о сервисе. После этого сразу откроется отдельная CRM-платформа."
        activeItem="settings"
        currentUser=${currentUser}
        center=${center}
        showCenterSummary=${false}
        showNavigation=${false}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Владелец сервиса
            </h2>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <${SellerField} label="ФИО владельца">
                <${SellerInput}
                  type="text"
                  placeholder="Шохрух Махкамов"
                  value=${profileForm.ownerFullName}
                  onInput=${(e) => updateProfileField("ownerFullName", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Телефон">
                  <${SellerInput}
                    type="tel"
                    placeholder="+992 92 000 00 00"
                    value=${profileForm.phone}
                    onInput=${(e) => updateProfileField("phone", normalizeTjPhoneInput(e.target.value))}
                  />
                </${SellerField}>
                <${SellerField} label="Должность">
                  <${SellerInput}
                    type="text"
                    placeholder="Владелец сервиса"
                    value=${profileForm.position}
                    onInput=${(e) => updateProfileField("position", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Email">
                  <${SellerInput}
                    type="email"
                    placeholder="service@drivex.tj"
                    value=${profileForm.email}
                    onInput=${(e) => updateProfileField("email", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Пароль">
                  <${SellerInput}
                    type="password"
                    placeholder="Минимум 6 символов"
                    value=${profileForm.password}
                    onInput=${(e) => updateProfileField("password", e.target.value)}
                  />
                </${SellerField}>
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Карточка сервиса
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Тип сервиса, местоположение, боксы и контакты
                </p>
              </div>

              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Логотип
                <input type="file" accept="image/*" className="hidden" onChange=${handleLogoPick} />
              </label>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <${SellerLogo}
                store=${{
                  ...previewCenter,
                  accent: "var(--drivex-electric-blue)"
                }}
                size=${72}
                rounded="22px"
              />
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${centerForm.name || "Название сервиса"}
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  ${centerForm.serviceType || "Тип сервиса"}${centerForm.city ? ` • ${centerForm.city}` : ""}
                </p>
                <p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  ${Math.max(1, Math.floor(Number(centerForm.boxesCount) || 1))} бокса • ${centerForm.workingHours || "08:00 — 19:00"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-5">
              <${SellerField} label="Название сервиса">
                <${SellerInput}
                  type="text"
                  placeholder="Khujand Auto Hub"
                  value=${centerForm.name}
                  onInput=${(e) => updateCenterField("name", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Тип сервиса">
                  <${SellerSelect}
                    value=${centerForm.serviceType}
                    onChange=${(e) => updateCenterField("serviceType", e.target.value)}
                  >
                    <option value="">Выберите тип</option>
                    ${serviceCenterTypeOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Количество боксов">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="3"
                    value=${centerForm.boxesCount}
                    onInput=${(e) => updateCenterField("boxesCount", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Город">
                  <${SellerInput}
                    type="text"
                    placeholder="Худжанд"
                    value=${centerForm.city}
                    onInput=${(e) => updateCenterField("city", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Часы работы">
                  <${SellerInput}
                    type="text"
                    placeholder="08:00 — 19:00"
                    value=${centerForm.workingHours}
                    onInput=${(e) => updateCenterField("workingHours", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Точный адрес">
                <${SellerInput}
                  type="text"
                  placeholder="Худжанд, 8 мкр, ул. Сомони 12"
                  value=${centerForm.address}
                  onInput=${(e) => updateCenterField("address", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Ориентир">
                  <${SellerInput}
                    type="text"
                    placeholder="Рядом с кольцом 8 мкр"
                    value=${centerForm.locationLabel}
                    onInput=${(e) => updateCenterField("locationLabel", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Геолокация">
                  <${SellerInput}
                    type="text"
                    placeholder="40.2837, 69.6222"
                    value=${centerForm.geolocation}
                    onInput=${(e) => updateCenterField("geolocation", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Телефон сервиса">
                  <${SellerInput}
                    type="tel"
                    placeholder="+992 92 777 00 77"
                    value=${centerForm.phone}
                    onInput=${(e) => updateCenterField("phone", normalizeTjPhoneInput(e.target.value))}
                  />
                </${SellerField}>
                <${SellerField} label="Email сервиса">
                  <${SellerInput}
                    type="email"
                    placeholder="info@service.tj"
                    value=${centerForm.email}
                    onInput=${(e) => updateCenterField("email", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Описание сервиса">
                <${SellerTextarea}
                  value=${centerForm.description}
                  onInput=${(e) => updateCenterField("description", e.target.value)}
                  placeholder="Какие услуги оказывает сервис, чем он отличается и как работает."
                />
              </${SellerField}>
            </div>
          </div>

          ${formError
            ? html`<div
                className="px-4 py-3 rounded-2xl text-sm"
                style=${{
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "var(--drivex-danger)",
                  border: "1px solid rgba(239, 68, 68, 0.2)"
                }}
              >
                ${formError}
              </div>`
            : null}

          <button type="submit" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
            ${submitting ? "Создаём сервис..." : "Открыть Service CRM"}
          </button>
        </form>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceDashboardScreen({ currentUser, center, clients, orders, finance, appointments }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeClients = normalizeServiceClientsList(clients, safeCenter.id).filter((item) => !isDemoServiceClient(item));
    const safeOrders = normalizeServiceRepairOrdersList(orders, safeCenter.id).filter((item) => !isDemoServiceOrder(item));
    const safeFinance = normalizeServiceFinanceList(finance, safeCenter.id).filter((item) => !isDemoServiceFinanceEntry(item));
    const safeAppointments = normalizeServiceAppointmentsList(appointments, safeCenter.id)
      .filter((item) => !isDemoServiceAppointment(item))
      .sort((a, b) => `${a.day} ${a.startTime}`.localeCompare(`${b.day} ${b.startTime}`));
    const stats = buildServiceDashboardStats(safeCenter, safeClients, safeOrders, safeFinance, safeAppointments);
    const activeRepairs = safeOrders.filter((item) => item.status === "queued" || item.status === "progress").slice(0, 4);
    const todayAppointments = safeAppointments.filter((item) => item.day === toLocalISODate()).slice(0, 4);
    const latestClients = [...safeClients]
      .sort((a, b) => String(b.lastVisit || "").localeCompare(String(a.lastVisit || "")))
      .slice(0, 3);

    return html`
      <${ServiceCrmLayout}
        title="CRM сервиса"
        subtitle="Клиенты, ремонты, боксы и деньги в одном отдельном рабочем кабинете."
        activeItem="dashboard"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/orders", label: "Ремонты" }}
      >
        <div
          className="rounded-[32px] p-6"
          style=${{
            background: "linear-gradient(145deg, rgba(6, 182, 212, 0.14) 0%, rgba(15, 23, 42, 0.96) 100%)",
            border: "1px solid rgba(6, 182, 212, 0.16)"
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.18em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                DIGITAL FORMAT
              </p>
              <h2 className="text-2xl font-bold mt-3" style=${{ color: "var(--drivex-white)" }}>
                ${safeCenter.name || "Ваш сервис"}
              </h2>
              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                ${safeCenter.serviceType || "Тип сервиса"} • ${safeCenter.city || "Город"} • ${safeCenter.address || "Адрес добавите в настройках"}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                ${[
                  `${safeCenter.boxesCount} бокса`,
                  safeCenter.workingHours || "08:00 — 19:00",
                  `${stats.freeBoxes} свободно сейчас`
                ].map((chip) => html`
                  <span
                    key=${chip}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style=${{
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--drivex-white)"
                    }}
                  >
                    ${chip}
                  </span>
                `)}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <${ServicePhoneButton} phone=${safeCenter.phone} compact=${true} label="Позвонить в сервис" />
              <a
                href="#/service-crm/settings"
                className="w-11 h-11 rounded-full inline-flex items-center justify-center"
                style=${{
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "var(--drivex-white)",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
                aria-label="Настройки сервиса"
              >
                <${Icon} name="settings" size=${18} />
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <${SellerMetricCard}
            label="Клиенты"
            value=${String(stats.clients)}
            hint=${`${stats.vehicles} машин`}
            color="var(--drivex-electric-blue)"
            icon="user"
            path="/service-crm/clients"
            actionLabel="Открыть базу"
          />
          <${SellerMetricCard}
            label="Активные ремонты"
            value=${String(stats.activeRepairs)}
            hint=${`${stats.readyRepairs} готовы`}
            color="var(--drivex-warning)"
            icon="wrench"
            path="/service-crm/orders"
            actionLabel="К ремонтам"
          />
          <${SellerMetricCard}
            label="Свободные боксы"
            value=${String(stats.freeBoxes)}
            hint=${`${stats.busyBoxes} заняты`}
            color="var(--drivex-success)"
            icon="layers"
            path="/service-crm/schedule"
            actionLabel="Смотреть запись"
          />
          <${SellerMetricCard}
            label="Выручка месяца"
            value=${formatTjsPrice(stats.monthRevenue)}
            hint=${`${stats.todayBookings} записи сегодня`}
            color="var(--drivex-neon-cyan)"
            icon="card"
            path="/service-crm/finance"
            actionLabel="К финансам"
          />
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Ремонты в работе
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Всё, что требует внимания прямо сейчас
              </p>
            </div>
            <a href="#/service-crm/orders" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Все ремонты
            </a>
          </div>

          ${activeRepairs.length
            ? html`<div className="space-y-3 mt-4">
                ${activeRepairs.map((order) => html`
                  <div key=${order.id} className="glass-card rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${order.clientName}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${order.carLabel} • ${order.problem}
                        </p>
                        <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                          ${order.id} • ${order.boxLabel} • ${order.estimate}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <${ServiceStatusChip} label=${order.statusLabel} color=${order.statusColor} />
                        <${ServicePhoneButton} phone=${order.clientPhone} compact=${true} label="Позвонить клиенту" />
                      </div>
                    </div>
                  </div>
                `)}
              </div>`
            : html`<div className="glass-card rounded-3xl p-4 mt-4">
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Сейчас активных ремонтов нет. Можно принимать новые записи.
                </p>
              </div>`}
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Сегодня по записи
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Кто занят, кто ждёт и где свободное окно
              </p>
            </div>
            <a href="#/service-crm/schedule" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Расписание
            </a>
          </div>

          ${todayAppointments.length
            ? html`<div className="space-y-3 mt-4">
                ${todayAppointments.map((slot) => html`
                  <div key=${slot.id} className="glass-card rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${slot.startTime} — ${slot.endTime} • ${slot.boxLabel}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${slot.clientName || "Свободное окно"}${slot.workLabel ? ` • ${slot.workLabel}` : ""}
                        </p>
                      </div>
                      <${ServiceStatusChip} label=${slot.statusLabel} color=${slot.statusColor} />
                    </div>
                  </div>
                `)}
              </div>`
            : html`<div className="glass-card rounded-3xl p-4 mt-4">
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  На сегодня записи ещё не заполнены.
                </p>
              </div>`}
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Последние клиенты
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Телефон и машины под рукой
              </p>
            </div>
            <a href="#/service-crm/clients" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              База клиентов
            </a>
          </div>

          <div className="space-y-3 mt-4">
            ${latestClients.length
              ? latestClients.map((client) => html`
                  <div key=${client.id} className="glass-card rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${client.name}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${client.vehicles.map((vehicle) => `${vehicle.brand} ${vehicle.model}`).join(" • ") || "Машина пока не добавлена"}
                        </p>
                        <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                          Последний визит: ${formatRuDate(client.lastVisit)}
                        </p>
                      </div>
                      <${ServicePhoneButton} phone=${client.phone} compact=${true} label="Позвонить клиенту" />
                    </div>
                  </div>
                `)
              : html`<div className="glass-card rounded-3xl p-4">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    Клиенты появятся после реальной записи или ремонта.
                  </p>
                </div>`}
          </div>
        </div>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceClientsScreen({ currentUser, center, clients, orders, appointments }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeClients = normalizeServiceClientsList(clients, safeCenter.id)
      .filter((item) => !isDemoServiceClient(item))
      .sort((a, b) => String(b.lastVisit || "").localeCompare(String(a.lastVisit || "")));
    const safeOrders = normalizeServiceRepairOrdersList(orders, safeCenter.id).filter((item) => !isDemoServiceOrder(item));
    const safeAppointments = normalizeServiceAppointmentsList(appointments, safeCenter.id)
      .filter((item) => !isDemoServiceAppointment(item));
    const vehicleCount = countServiceVehicles(safeClients);
    const [selectedClientId, setSelectedClientId] = useState("");
    const selectedClient = safeClients.find((client) => client.id === selectedClientId) || null;
    const selectedPhoneDigits = String(selectedClient?.phone || "").replace(/\D/g, "");
    const selectedHistory = selectedClient
      ? [
          ...safeAppointments
            .filter((slot) => {
              const phoneDigits = String(slot.phone || "").replace(/\D/g, "");
              return phoneDigits && phoneDigits === selectedPhoneDigits;
            })
            .map((slot) => ({
              id: `slot-${slot.id}`,
              type: "Запись",
              title: slot.workLabel || "Запись в сервис",
              meta: `${formatRuDate(slot.day)} • ${slot.startTime} — ${slot.endTime} • ${slot.boxLabel}`,
              statusLabel: slot.statusLabel,
              statusColor: slot.statusColor
            })),
          ...safeOrders
            .filter((order) => order.clientId === selectedClient.id || String(order.clientPhone || "").replace(/\D/g, "") === selectedPhoneDigits)
            .map((order) => ({
              id: `order-${order.id}`,
              type: "Ремонт",
              title: order.problem || order.completedWork || "Ремонт",
              meta: `${order.id} • ${order.carLabel || "Авто"} • ${formatTjsPrice(order.total)}`,
              statusLabel: order.statusLabel,
              statusColor: order.statusColor
            }))
        ]
      : [];

    const getLoyaltyColor = (loyalty) => {
      if (/vip/i.test(loyalty)) return "var(--drivex-warning)";
      if (/постоян/i.test(loyalty)) return "var(--drivex-success)";
      return "var(--drivex-silver)";
    };

    return html`
      <${ServiceCrmLayout}
        title="Клиенты и машины"
        subtitle="Здесь удобный учёт клиентской базы, телефонов и автомобилей по каждому визиту."
        activeItem="clients"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/orders", label: "Ремонты" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <${SellerMetricCard}
            label="Клиенты"
            value=${String(safeClients.length)}
            hint="Живая база сервиса"
            color="var(--drivex-electric-blue)"
            icon="user"
          />
          <${SellerMetricCard}
            label="Машины"
            value=${String(vehicleCount)}
            hint="Закреплены за клиентами"
            color="var(--drivex-neon-cyan)"
            icon="car"
          />
        </div>

        <div className="space-y-4">
          ${safeClients.map((client) => {
            const loyaltyColor = getLoyaltyColor(client.loyalty);
            return html`
              <div
                key=${client.id}
                role="button"
                tabIndex="0"
                className="glass-card-light rounded-3xl p-5 w-full text-left cursor-pointer"
                onClick=${() => setSelectedClientId(client.id)}
                onKeyDown=${(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedClientId(client.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${client.name}
                      </p>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style=${{
                          background: alphaBg(loyaltyColor, 0.16),
                          color: loyaltyColor
                        }}
                      >
                        ${client.loyalty}
                      </span>
                    </div>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${client.phone}
                    </p>
                    <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      Последний визит: ${formatRuDate(client.lastVisit)}
                    </p>
                  </div>
                  <${ServicePhoneButton} phone=${client.phone} compact=${true} label="Позвонить клиенту" />
                </div>

                ${client.note
                  ? html`<div className="glass-card rounded-3xl p-4 mt-4">
                      <p className="text-sm" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                        ${client.note}
                      </p>
                    </div>`
                  : null}

                <div className="space-y-3 mt-4">
                  ${client.vehicles.map((vehicle) => html`
                    <div key=${vehicle.id} className="glass-card rounded-3xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                            ${vehicle.brand} ${vehicle.model}
                          </p>
                          <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                            ${vehicle.year}${vehicle.plate ? ` • ${vehicle.plate}` : ""}${vehicle.mileage ? ` • ${vehicle.mileage}` : ""}
                          </p>
                        </div>
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center"
                          style=${{
                            background: "rgba(6, 182, 212, 0.14)",
                            color: "var(--drivex-neon-cyan)"
                          }}
                        >
                          <${Icon} name="car" size=${18} />
                        </div>
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            `;
          })}
          ${!safeClients.length
            ? html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="user" size=${22} />
                </div>
                <p className="font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                  Клиентов пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                  Здесь будет только реальная база клиентов, без демо-записей.
                </p>
              </div>`
            : null}
        </div>

        ${selectedClient
          ? html`<div
              className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4"
              style=${{ background: "rgba(2, 6, 23, 0.72)", backdropFilter: "blur(14px)" }}
            >
              <div
                className="w-full max-w-md rounded-3xl p-5"
                style=${{
                  background: "linear-gradient(180deg, rgba(18, 27, 43, 0.98), rgba(8, 13, 24, 0.98))",
                  border: "1px solid rgba(6, 182, 212, 0.22)",
                  boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.45)"
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      ИСТОРИЯ КЛИЕНТА
                    </p>
                    <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      ${selectedClient.name}
                    </h3>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${selectedClient.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center"
                    style=${{ color: "var(--drivex-silver)" }}
                    onClick=${() => setSelectedClientId("")}
                  >
                    <${Icon} name="x" size=${18} />
                  </button>
                </div>

                <div className="space-y-3 mt-5">
                  ${selectedHistory.length
                    ? selectedHistory.map((entry) => html`
                        <div key=${entry.id} className="glass-card rounded-3xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
                                ${entry.type}
                              </p>
                              <p className="font-semibold mt-1" style=${{ color: "var(--drivex-white)" }}>
                                ${entry.title}
                              </p>
                              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                                ${entry.meta}
                              </p>
                            </div>
                            <${ServiceStatusChip} label=${entry.statusLabel} color=${entry.statusColor} />
                          </div>
                        </div>
                      `)
                    : html`<div className="glass-card rounded-3xl p-4">
                        <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                          История появится после первой записи или ремонта.
                        </p>
                      </div>`}
                </div>
              </div>
            </div>`
          : null}
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceOrdersScreen({ currentUser, center, orders, onUpdateStatus }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeOrders = normalizeServiceRepairOrdersList(orders, safeCenter.id)
      .filter((item) => !isDemoServiceOrder(item))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const queuedCount = safeOrders.filter((item) => item.status === "queued").length;
    const progressCount = safeOrders.filter((item) => item.status === "progress").length;
    const readyCount = safeOrders.filter((item) => item.status === "ready").length;
    const [completionDraft, setCompletionDraft] = useState(null);

    const openCompletionDraft = (order) => {
      setCompletionDraft({
        orderId: order.id,
        clientName: order.clientName,
        carLabel: order.carLabel,
        workSummary: order.completedWork || order.problem || "",
        total: order.total ? String(order.total) : ""
      });
    };

    const updateCompletionDraft = (field, value) => {
      setCompletionDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const submitCompletionDraft = () => {
      if (!completionDraft) return;
      const workSummary = String(completionDraft.workSummary || "").trim();
      const total = Math.max(0, Math.floor(Number(String(completionDraft.total || "").replace(/[^\d.]/g, "")) || 0));
      if (!workSummary || total <= 0) return;

      onUpdateStatus &&
        onUpdateStatus(completionDraft.orderId, "ready", {
          workSummary,
          total
        });
      setCompletionDraft(null);
    };

    return html`
      <${ServiceCrmLayout}
        title="Ремонты и статусы"
        subtitle="Заказы на ремонт, статусы, телефон клиента и состав работ без лишнего шума."
        activeItem="orders"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/schedule", label: "Запись" }}
      >
        <div className="grid grid-cols-3 gap-3">
          <${SellerMetricCard}
            label="В очереди"
            value=${String(queuedCount)}
            color="var(--drivex-warning)"
            icon="calendar"
          />
          <${SellerMetricCard}
            label="В работе"
            value=${String(progressCount)}
            color="var(--drivex-neon-cyan)"
            icon="wrench"
          />
          <${SellerMetricCard}
            label="Готово"
            value=${String(readyCount)}
            color="var(--drivex-success)"
            icon="check"
          />
        </div>

        <div className="space-y-4">
          ${safeOrders.map((order) => {
            const actions = getServiceRepairActions(order);
            return html`
              <div key=${order.id} className="glass-card-light rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${order.id}
                    </p>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${order.clientName} • ${order.carLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <${ServicePhoneButton} phone=${order.clientPhone} compact=${true} label="Позвонить клиенту" />
                    <${ServiceStatusChip} label=${order.statusLabel} color=${order.statusColor} />
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-4 mt-4">
                  <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    ${order.problem}
                  </p>
                  ${order.note
                    ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                        ${order.note}
                      </p>`
                    : null}
                  ${order.completedWork
                    ? html`<div
                        className="mt-4 p-3 rounded-2xl"
                        style=${{
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.18)"
                        }}
                      >
                        <p className="text-xs font-semibold" style=${{ color: "var(--drivex-success)" }}>
                          Выполнено
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-white)", lineHeight: 1.6 }}>
                          ${order.completedWork}
                        </p>
                        ${order.completedAt
                          ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                              ${formatRuDate(order.completedAt)}
                            </p>`
                          : null}
                      </div>`
                    : null}

                  <div className="flex flex-wrap gap-2 mt-4">
                    ${[
                      order.boxLabel,
                      order.estimate,
                      order.appointmentTime ? `Запись ${order.appointmentTime}` : `Создан ${formatChatTime(order.createdAt)}`
                    ].map((chip) => html`
                      <span
                        key=${`${order.id}-${chip}`}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style=${{
                          background: "rgba(255, 255, 255, 0.05)",
                          color: "var(--drivex-silver)"
                        }}
                      >
                        ${chip}
                      </span>
                    `)}
                  </div>
                </div>

                ${order.parts.length
                  ? html`<div className="space-y-2 mt-4">
                      ${order.parts.map((part) => html`
                        <div key=${part.id} className="glass-card rounded-3xl p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                              ${part.name}
                            </p>
                            <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                              ${part.qty} шт.
                            </p>
                          </div>
                          <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                            ${formatTjsPrice(part.price * part.qty)}
                          </span>
                        </div>
                      `)}
                    </div>`
                  : null}

                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Сумма ремонта
                    </p>
                    <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                      ${formatTjsPrice(order.total)}
                    </p>
                  </div>

                  ${actions.length
                    ? html`<div className="flex gap-2 flex-wrap justify-end">
                        ${actions.map((action) => html`
                          <button
                            key=${action.id}
                            type="button"
                            className="px-4 py-3 rounded-full text-sm font-semibold"
                            style=${{
                              background: alphaBg(action.color, 0.18),
                              color: action.color,
                              border: `1px solid ${alphaBg(action.color, 0.26)}`
                            }}
                            onClick=${() =>
                              action.status === "ready"
                                ? openCompletionDraft(order)
                                : onUpdateStatus && onUpdateStatus(order.id, action.status)}
                          >
                            ${action.label}
                          </button>
                        `)}
                      </div>`
                    : html`<p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                        Ремонт завершён, можно выдавать клиенту.
                      </p>`}
                </div>
              </div>
            `;
          })}
          ${!safeOrders.length
            ? html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="wrench" size=${22} />
                </div>
                <p className="font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                  Ремонтов пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                  Реальные заказы появятся здесь после записи клиента в ваш сервис.
                </p>
              </div>`
            : null}
        </div>

        ${completionDraft
          ? html`<div
              className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4"
              style=${{ background: "rgba(2, 6, 23, 0.72)", backdropFilter: "blur(14px)" }}
            >
              <div
                className="w-full max-w-md rounded-3xl p-5"
                style=${{
                  background: "linear-gradient(180deg, rgba(18, 27, 43, 0.98), rgba(8, 13, 24, 0.98))",
                  border: "1px solid rgba(6, 182, 212, 0.22)",
                  boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.45)"
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      ГОТОВЫЙ РЕМОНТ
                    </p>
                    <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      Что сделали?
                    </h3>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${completionDraft.clientName} • ${completionDraft.carLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center"
                    style=${{ color: "var(--drivex-silver)" }}
                    onClick=${() => setCompletionDraft(null)}
                  >
                    <${Icon} name="x" size=${18} />
                  </button>
                </div>

                <div className="space-y-4 mt-5">
                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Работа мастера
                    </span>
                    <${SellerTextarea}
                      rows="4"
                      value=${completionDraft.workSummary}
                      placeholder="Например: заменили масло, фильтр и сделали диагностику"
                      onInput=${(event) => updateCompletionDraft("workSummary", event.target.value)}
                    />
                    ${!String(completionDraft.workSummary || "").trim()
                      ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>
                          Напишите, что именно было сделано
                        </p>`
                      : null}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Сумма, TJS
                    </span>
                    <${SellerInput}
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value=${completionDraft.total}
                      placeholder="Например: 250"
                      onInput=${(event) => updateCompletionDraft("total", event.target.value)}
                    />
                    ${Math.floor(Number(String(completionDraft.total || "").replace(/[^\d.]/g, "")) || 0) <= 0
                      ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>
                          Укажите реальную сумму ремонта
                        </p>`
                      : null}
                  </label>
                </div>

                <button
                  type="button"
                  className="w-full py-4 rounded-2xl font-bold mt-5"
                  style=${{
                    background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                    color: "white",
                    boxShadow: "0 18px 38px rgba(6, 182, 212, 0.22)"
                  }}
                  onClick=${submitCompletionDraft}
                >
                  Отметить готовым
                </button>
              </div>
            </div>`
          : null}
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceInventoryScreen({ currentUser, center, inventory, onSaveItem }) {
    const toast = useToast();
    const safeCenter = normalizeServiceCenter(center);
    const safeInventory = normalizeServiceInventoryList(inventory, safeCenter.id)
      .filter((item) => !isDemoServiceInventoryItem(item))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
    const lowStockCount = safeInventory.filter((item) => item.stockQty <= item.minQty).length;
    const stockValue = safeInventory.reduce((sum, item) => sum + item.stockQty * item.price, 0);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState(() => ({
      name: "",
      sku: "",
      unit: "шт.",
      stockQty: "",
      minQty: "",
      price: "",
      location: "Основной склад"
    }));
    const [errors, setErrors] = useState({});

    const updateField = (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const resetForm = () => {
      setForm({
        name: "",
        sku: "",
        unit: "шт.",
        stockQty: "",
        minQty: "",
        price: "",
        location: "Основной склад"
      });
      setErrors({});
    };

    const submitInventoryItem = (event) => {
      event.preventDefault();
      const nextErrors = {};
      const stockQty = Math.max(0, Math.floor(Number(form.stockQty) || 0));
      const minQty = Math.max(0, Math.floor(Number(form.minQty) || 0));
      const price = Math.max(0, Math.floor(Number(form.price) || 0));

      if (!String(form.name || "").trim()) nextErrors.name = "Введите название товара";
      if (stockQty <= 0) nextErrors.stockQty = "Укажите остаток";
      if (price <= 0) nextErrors.price = "Укажите цену";

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return;
      }

      onSaveItem &&
        onSaveItem({
          ...form,
          stockQty,
          minQty,
          price
        });
      toast.push("Товар добавлен на склад");
      resetForm();
      setFormOpen(false);
    };

    return html`
      <${ServiceCrmLayout}
        title="Склад запчастей"
        subtitle="Остатки, минимальные уровни и себестоимость запчастей в сервисе."
        activeItem="parts"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/finance", label: "Финансы" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <${SellerMetricCard}
            label="Позиции"
            value=${String(safeInventory.length)}
            hint="На складе сервиса"
            color="var(--drivex-electric-blue)"
            icon="bag"
          />
          <${SellerMetricCard}
            label="Низкий остаток"
            value=${String(lowStockCount)}
            hint="Нужно дозаказать"
            color="var(--drivex-warning)"
            icon="bell"
          />
          <div className="col-span-2">
            <${SellerMetricCard}
              label="Стоимость склада"
              value=${formatTjsPrice(stockValue)}
              hint="По текущим остаткам"
              color="var(--drivex-neon-cyan)"
              icon="card"
            />
          </div>
        </div>

        <button
          type="button"
          className="w-full py-4 rounded-2xl font-bold"
          style=${{
            background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
            color: "white",
            boxShadow: "0 18px 38px rgba(6, 182, 212, 0.2)"
          }}
          onClick=${() => setFormOpen(true)}
        >
          + Добавить товар
        </button>

        <div className="space-y-4">
          ${safeInventory.map((item) => {
            const isLow = item.stockQty <= item.minQty;
            const stockColor = isLow ? "var(--drivex-warning)" : "var(--drivex-success)";
            return html`
              <div key=${item.id} className="glass-card-light rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${item.name}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${item.sku} • ${item.location}
                    </p>
                  </div>
                  <${ServiceStatusChip}
                    label=${isLow ? "Пора пополнить" : "Остаток нормальный"}
                    color=${stockColor}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="glass-card rounded-3xl p-4">
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Остаток
                    </p>
                    <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      ${item.stockQty} ${item.unit}
                    </p>
                  </div>
                  <div className="glass-card rounded-3xl p-4">
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Мин. уровень
                    </p>
                    <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      ${item.minQty} ${item.unit}
                    </p>
                  </div>
                  <div className="glass-card rounded-3xl p-4">
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Цена
                    </p>
                    <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      ${formatTjsPrice(item.price)}
                    </p>
                  </div>
                </div>
              </div>
            `;
          })}
          ${!safeInventory.length
            ? html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="bag" size=${22} />
                </div>
                <p className="font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                  Склад пока пустой
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                  Добавьте реальные товары, запчасти и расходники вашего сервиса.
                </p>
              </div>`
            : null}
        </div>

        ${formOpen
          ? html`<div
              className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4"
              style=${{ background: "rgba(2, 6, 23, 0.72)", backdropFilter: "blur(14px)" }}
            >
              <form
                className="w-full max-w-md rounded-3xl p-5"
                style=${{
                  background: "linear-gradient(180deg, rgba(18, 27, 43, 0.98), rgba(8, 13, 24, 0.98))",
                  border: "1px solid rgba(6, 182, 212, 0.22)",
                  boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.45)"
                }}
                onSubmit=${submitInventoryItem}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      СКЛАД
                    </p>
                    <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      Новый товар
                    </h3>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      Запчасть, масло, фильтр или расходник
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center"
                    style=${{ color: "var(--drivex-silver)" }}
                    onClick=${() => {
                      resetForm();
                      setFormOpen(false);
                    }}
                  >
                    <${Icon} name="x" size=${18} />
                  </button>
                </div>

                <div className="space-y-4 mt-5">
                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Название</span>
                    <${SellerInput}
                      value=${form.name}
                      placeholder="Например: Масло 5W-30 Toyota"
                      onInput=${(event) => updateField("name", event.target.value)}
                    />
                    ${errors.name ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.name}</p>` : null}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Артикул</span>
                      <${SellerInput}
                        value=${form.sku}
                        placeholder="SKU"
                        onInput=${(event) => updateField("sku", event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Ед.</span>
                      <${SellerInput}
                        value=${form.unit}
                        placeholder="шт."
                        onInput=${(event) => updateField("unit", event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Остаток</span>
                      <${SellerInput}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value=${form.stockQty}
                        onInput=${(event) => updateField("stockQty", event.target.value)}
                      />
                      ${errors.stockQty ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.stockQty}</p>` : null}
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Мин.</span>
                      <${SellerInput}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value=${form.minQty}
                        onInput=${(event) => updateField("minQty", event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Цена</span>
                      <${SellerInput}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value=${form.price}
                        onInput=${(event) => updateField("price", event.target.value)}
                      />
                      ${errors.price ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.price}</p>` : null}
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Место хранения</span>
                    <${SellerInput}
                      value=${form.location}
                      placeholder="Основной склад"
                      onInput=${(event) => updateField("location", event.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl font-bold mt-5"
                  style=${{
                    background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                    color: "white"
                  }}
                >
                  Сохранить товар
                </button>
              </form>
            </div>`
          : null}
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceFinanceScreen({ currentUser, center, orders, finance }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeOrders = normalizeServiceRepairOrdersList(orders, safeCenter.id).filter((item) => !isDemoServiceOrder(item));
    const safeFinance = normalizeServiceFinanceList(finance, safeCenter.id)
      .filter((item) => !isDemoServiceFinanceEntry(item))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const summary = buildServiceFinanceSummary(safeOrders, safeFinance);

    return html`
      <${ServiceCrmLayout}
        title="Финансы и отчёты"
        subtitle="Выручка, расходы и средний чек сервиса без отдельной таблицы."
        activeItem="finance"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/parts", label: "Склад" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <${SellerMetricCard}
            label="Доход"
            value=${formatTjsPrice(summary.income)}
            hint="Все готовые ремонты"
            color="var(--drivex-success)"
            icon="card"
          />
          <${SellerMetricCard}
            label="Расход"
            value=${formatTjsPrice(summary.expenses)}
            hint="Склад и персонал"
            color="var(--drivex-warning)"
            icon="bag"
          />
          <${SellerMetricCard}
            label="Прибыль"
            value=${formatTjsPrice(summary.profit)}
            hint="Доход минус расход"
            color="var(--drivex-electric-blue)"
            icon="layers"
          />
          <${SellerMetricCard}
            label="Средний чек"
            value=${formatTjsPrice(summary.averageTicket)}
            hint="На один готовый ремонт"
            color="var(--drivex-neon-cyan)"
            icon="wrench"
          />
        </div>

        <div className="space-y-4">
          ${safeFinance.map((entry) => {
            const isExpense = entry.type === "expense";
            const accent = isExpense ? "var(--drivex-warning)" : "var(--drivex-success)";
            return html`
              <div key=${entry.id} className="glass-card-light rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${entry.title}
                      </p>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style=${{
                          background: alphaBg(accent, 0.16),
                          color: accent
                        }}
                      >
                        ${isExpense ? "Расход" : "Доход"}
                      </span>
                    </div>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${entry.category} • ${formatRuDate(entry.date)}
                    </p>
                    ${entry.sourceOrderId
                      ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                          Заказ: ${entry.sourceOrderId}
                        </p>`
                      : null}
                  </div>
                  <p className="text-xl font-bold" style=${{ color: accent }}>
                    ${isExpense ? "-" : "+"}${formatTjsPrice(entry.amount)}
                  </p>
                </div>
              </div>
            `;
          })}
        </div>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceScheduleScreen({ currentUser, center, appointments, onCreateAppointment }) {
    const toast = useToast();
    const safeCenter = normalizeServiceCenter(center);
    const safeAppointments = normalizeServiceAppointmentsList(appointments, safeCenter.id)
      .filter((item) => !isDemoServiceAppointment(item))
      .sort((a, b) => `${a.day} ${a.startTime}`.localeCompare(`${b.day} ${b.startTime}`));
    const [selectedDay, setSelectedDay] = useState(toLocalISODate());
    const [formOpen, setFormOpen] = useState(false);
    const scheduleSlots = buildServiceScheduleSlots(safeCenter, safeAppointments, selectedDay);
    const availableSlots = scheduleSlots.filter((slot) => slot.available);
    const [form, setForm] = useState(() => ({
      day: toLocalISODate(),
      time: "",
      clientName: "",
      clientPhone: "+992 ",
      carLabel: "",
      workLabel: "",
      note: ""
    }));
    const [errors, setErrors] = useState({});

    useEffect(() => {
      setForm((prev) => ({
        ...prev,
        day: selectedDay,
        time: availableSlots.some((slot) => slot.startTime === prev.time) ? prev.time : (availableSlots[0]?.startTime || "")
      }));
    }, [selectedDay, availableSlots.map((slot) => slot.startTime).join("|")]);

    const updateField = (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const resetManualForm = () => {
      setForm({
        day: selectedDay,
        time: availableSlots[0]?.startTime || "",
        clientName: "",
        clientPhone: "+992 ",
        carLabel: "",
        workLabel: "",
        note: ""
      });
      setErrors({});
    };

    const submitManualAppointment = (event) => {
      event.preventDefault();
      const nextErrors = {};
      if (!String(form.clientName || "").trim()) nextErrors.clientName = "Введите имя клиента";
      if (String(form.clientPhone || "").replace(/\D/g, "").length < 12) nextErrors.clientPhone = "Введите телефон";
      if (!String(form.workLabel || "").trim()) nextErrors.workLabel = "Напишите цель обращения";
      if (!form.time) nextErrors.time = "Выберите свободное время";

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return;
      }

      onCreateAppointment &&
        onCreateAppointment({
          ...form,
          day: selectedDay,
          time: form.time
        });
      toast.push("Запись добавлена в расписание");
      resetManualForm();
      setFormOpen(false);
    };

    return html`
      <${ServiceCrmLayout}
        title="Запись и загрузка"
        subtitle="Кто занят, когда свободен и как загружены боксы по времени."
        activeItem="schedule"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/orders", label: "Ремонты" }}
      >
        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                День: ${formatRuDate(selectedDay)}
              </p>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                ${safeCenter.boxesCount} бокса • ${safeCenter.workingHours || "08:00 — 19:00"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              ${serviceAppointmentStatusOptions.map((status) => html`
                <${ServiceStatusChip} key=${status.id} label=${status.label} color=${status.color} />
              `)}
            </div>
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                Дата
              </span>
              <${SellerInput}
                type="date"
                value=${selectedDay}
                onInput=${(event) => setSelectedDay(event.target.value || toLocalISODate())}
              />
            </label>
            <button
              type="button"
              className="self-end py-3 rounded-2xl font-bold"
              style=${{
                background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                color: "white"
              }}
              onClick=${() => {
                resetManualForm();
                setFormOpen(true);
              }}
              disabled=${!availableSlots.length}
            >
              + Записать
            </button>
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Окна дня
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Свободное время и занятые боксы
              </p>
            </div>
            <${ServiceStatusChip}
              label=${`${availableSlots.length} свободно`}
              color=${availableSlots.length ? "var(--drivex-success)" : "var(--drivex-warning)"}
            />
          </div>

          <div className="space-y-3 mt-4">
            ${scheduleSlots.map((slot) => html`
              <div key=${slot.id} className="glass-card rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${slot.startTime} — ${slot.endTime}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${slot.available ? `${slot.freeBoxes} свободно из ${slot.boxCount}` : "Все боксы заняты"}
                    </p>
                    ${slot.booked.length
                      ? html`<div className="space-y-2 mt-3">
                          ${slot.booked.map((booked) => html`
                            <div key=${booked.id} className="rounded-2xl p-3" style=${{ background: "rgba(255,255,255,0.05)" }}>
                              <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                                ${booked.boxLabel} • ${booked.clientName}
                              </p>
                              <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                                ${booked.carLabel || "Авто не указано"} • ${booked.workLabel || "Цель не указана"}
                              </p>
                            </div>
                          `)}
                        </div>`
                      : null}
                  </div>
                  <${ServiceStatusChip}
                    label=${slot.available ? "Свободно" : "Занято"}
                    color=${slot.available ? "var(--drivex-success)" : "var(--drivex-warning)"}
                  />
                </div>
              </div>
            `)}
            ${!scheduleSlots.length
              ? html`<div className="glass-card rounded-3xl p-4">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    Проверьте рабочее время сервиса в настройках.
                  </p>
                </div>`
              : null}
          </div>
        </div>

        <div className="space-y-4">
          ${safeAppointments.filter((slot) => slot.day === selectedDay).map((slot) => html`
            <div key=${slot.id} className="glass-card-light rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                    ${formatRuDate(slot.day)} • ${slot.startTime} — ${slot.endTime}
                  </p>
                  <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    ${slot.boxLabel}
                  </p>
                </div>
                <${ServiceStatusChip} label=${slot.statusLabel} color=${slot.statusColor} />
              </div>

              <div className="glass-card rounded-3xl p-4 mt-4">
                ${slot.status === "free"
                  ? html`<p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      Это окно свободно. Можно записать нового клиента по телефону.
                    </p>`
                  : html`
                      <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        ${slot.clientName}
                      </p>
                      <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                        ${slot.carLabel}${slot.workLabel ? ` • ${slot.workLabel}` : ""}
                      </p>
                      <div className="mt-4">
                        <${ServicePhoneButton} phone=${slot.phone} label="Позвонить клиенту" />
                      </div>
                    `}
              </div>
            </div>
          `)}
          ${!safeAppointments.filter((slot) => slot.day === selectedDay).length
            ? html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="calendar" size=${22} />
                </div>
                <p className="font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                  Записей пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                  Реальные записи появятся здесь после онлайн-записи или ручного добавления из CRM.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-2xl font-bold mt-5"
                  style=${{
                    background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                    color: "white"
                  }}
                  onClick=${() => {
                    resetManualForm();
                    setFormOpen(true);
                  }}
                >
                  Записать клиента
                </button>
              </div>`
            : null}
        </div>

        ${formOpen
          ? html`<div
              className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4"
              style=${{ background: "rgba(2, 6, 23, 0.72)", backdropFilter: "blur(14px)" }}
            >
              <form
                className="w-full max-w-md rounded-3xl p-5"
                style=${{
                  background: "linear-gradient(180deg, rgba(18, 27, 43, 0.98), rgba(8, 13, 24, 0.98))",
                  border: "1px solid rgba(6, 182, 212, 0.22)",
                  boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.45)"
                }}
                onSubmit=${submitManualAppointment}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      РУЧНАЯ ЗАПИСЬ
                    </p>
                    <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      Занять очередь
                    </h3>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      Для клиента, который позвонил или написал
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center"
                    style=${{ color: "var(--drivex-silver)" }}
                    onClick=${() => {
                      resetManualForm();
                      setFormOpen(false);
                    }}
                  >
                    <${Icon} name="x" size=${18} />
                  </button>
                </div>

                <div className="space-y-4 mt-5">
                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Время</span>
                    <select
                      className="w-full px-4 py-3 rounded-2xl glass-card-light outline-none dx-input"
                      value=${form.time}
                      onInput=${(event) => updateField("time", event.target.value)}
                    >
                      ${availableSlots.map((slot) => html`
                        <option key=${slot.id} value=${slot.startTime}>
                          ${slot.startTime} — свободно ${slot.freeBoxes}
                        </option>
                      `)}
                    </select>
                    ${errors.time ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.time}</p>` : null}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Клиент</span>
                      <${SellerInput}
                        value=${form.clientName}
                        placeholder="Имя клиента"
                        onInput=${(event) => updateField("clientName", event.target.value)}
                      />
                      ${errors.clientName ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.clientName}</p>` : null}
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Телефон</span>
                      <${SellerInput}
                        value=${form.clientPhone}
                        placeholder="+992"
                        onInput=${(event) => updateField("clientPhone", normalizeTjPhoneInput(event.target.value))}
                      />
                      ${errors.clientPhone ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.clientPhone}</p>` : null}
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Авто</span>
                    <${SellerInput}
                      value=${form.carLabel}
                      placeholder="Например: Toyota Camry"
                      onInput=${(event) => updateField("carLabel", event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Что нужно сделать</span>
                    <${SellerTextarea}
                      rows="3"
                      value=${form.workLabel}
                      placeholder="Например: диагностика, замена масла, электрика"
                      onInput=${(event) => updateField("workLabel", event.target.value)}
                    />
                    ${errors.workLabel ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.workLabel}</p>` : null}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Комментарий</span>
                    <${SellerTextarea}
                      rows="2"
                      value=${form.note}
                      placeholder="Дополнительно"
                      onInput=${(event) => updateField("note", event.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl font-bold mt-5"
                  style=${{
                    background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                    color: "white"
                  }}
                >
                  Сохранить запись
                </button>
              </form>
            </div>`
          : null}
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceSettingsScreen({ currentUser, center, onSaveCenter }) {
    const toast = useToast();
    const [form, setForm] = useState(() => createServiceCenterFormState(center));
    const [submitting, setSubmitting] = useState(false);
    const centerSyncToken = useMemo(() => JSON.stringify(createServiceCenterFormState(center)), [center]);

    useEffect(() => {
      try {
        setForm(JSON.parse(centerSyncToken));
      } catch {
        setForm(createServiceCenterFormState(center));
      }
    }, [centerSyncToken]);

    const updateField = useCallback((key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleLogoPick = useCallback(
      async (event) => {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareAvatarDataUrl(file, { size: 320, quality: 0.9 });
          if (!dataUrl) {
            toast.push("Логотип не удалось загрузить");
            return;
          }
          setForm((prev) => ({
            ...prev,
            logo: dataUrl
          }));
          toast.push("Логотип обновлён");
        } catch (error) {
          toast.push(
            String(error && error.message) === "File too large"
              ? "Логотип слишком большой. Выберите фото поменьше"
              : "Файл не подходит"
          );
        } finally {
          if (input) input.value = "";
        }
      },
      [toast]
    );

    const handleCoverPick = useCallback(
      async (event) => {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareDocumentDataUrl(file, { maxSize: 960, quality: 0.78 });
          if (!dataUrl) {
            toast.push("Главное фото не удалось загрузить");
            return;
          }
          updateField("coverImage", dataUrl);
          toast.push("Главное фото обновлено");
        } catch (error) {
          toast.push(
            String(error && error.message) === "File too large"
              ? "Главное фото слишком большое. Выберите фото поменьше"
              : "Файл не подходит"
          );
        } finally {
          if (input) input.value = "";
        }
      },
      [toast, updateField]
    );

    const handleGalleryPick = useCallback(
      async (event) => {
        const input = event.target;
        const files = Array.from(input.files || []).slice(0, 6);
        if (!files.length) return;

        try {
          const prepared = await Promise.all(
            files.map((file) => prepareDocumentDataUrl(file, { maxSize: 960, quality: 0.8 }).catch(() => ""))
          );
          const nextPhotos = prepared.filter(Boolean);
          if (!nextPhotos.length) {
            toast.push("Фото работ не удалось загрузить");
            return;
          }

          setForm((prev) => ({
            ...prev,
            gallery: [...normalizeServiceGalleryList(prev.gallery), ...nextPhotos].filter(Boolean).slice(0, 6)
          }));
          toast.push(`Добавлено фото: ${nextPhotos.length}`);
        } catch (error) {
          toast.push(
            String(error && error.message) === "File too large"
              ? "Одно из фото слишком большое. Выберите фото поменьше"
              : "Файлы не подходят"
          );
        } finally {
          if (input) input.value = "";
        }
      },
      [toast]
    );

    const removeGalleryPhoto = useCallback((index) => {
      setForm((prev) => ({
        ...prev,
        gallery: normalizeServiceGalleryList(prev.gallery).filter((_, photoIndex) => photoIndex !== index)
      }));
    }, []);

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        if (!String(form.name || "").trim()) {
          toast.push("Введите название сервиса");
          return;
        }
        if (!String(form.serviceType || "").trim()) {
          toast.push("Выберите тип сервиса");
          return;
        }
        if (!String(form.city || "").trim()) {
          toast.push("Введите город");
          return;
        }

        try {
          setSubmitting(true);
          await onSaveCenter({
            ...form,
            boxesCount: Math.max(1, Math.floor(Number(form.boxesCount) || 1)),
            coverImage: normalizeServiceImageAsset(form.coverImage),
            gallery: normalizeServiceGalleryList(form.gallery),
            videoUrl: normalizeServiceVideoUrl(form.videoUrl),
            description: form.description || `${form.name || "Сервис"} — обновлённая карточка сервиса DRIVEX.`
          });
          navigateToHash("/service-crm/dashboard");
        } catch (error) {
          toast.push(error?.message || "Не удалось сохранить сервис");
        } finally {
          setSubmitting(false);
        }
      },
      [form, onSaveCenter, toast]
    );

    const previewCenter = {
      ...center,
      ...form,
      boxesCount: Math.max(1, Math.floor(Number(form.boxesCount) || 1))
    };
    const galleryPreview = normalizeServiceGalleryList(form.gallery);
    const coverPreview =
      form.coverImage ||
      galleryPreview[0] ||
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
    const videoPreviewUrl = normalizeServiceVideoUrl(form.videoUrl);

    return html`
      <${ServiceCrmLayout}
        title="Настройки сервиса"
        subtitle="Карточка сервиса, контакты и медиа, которые увидят клиенты в каталоге."
        activeItem="settings"
        currentUser=${currentUser}
        center=${center}
        primaryAction=${{ path: "/service-crm/dashboard", label: "Дашборд" }}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Основная информация
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Это видят сотрудники сервиса внутри CRM
                </p>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Логотип
                <input type="file" accept="image/*" className="hidden" onChange=${handleLogoPick} />
              </label>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <${SellerLogo}
                store=${{
                  ...previewCenter,
                  accent: "var(--drivex-electric-blue)"
                }}
                size=${72}
                rounded="22px"
              />
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${form.name || "Название сервиса"}
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  ${form.serviceType || "Тип сервиса"}${form.city ? ` • ${form.city}` : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-5">
              <${SellerField} label="Название сервиса">
                <${SellerInput}
                  type="text"
                  value=${form.name}
                  onInput=${(e) => updateField("name", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Тип сервиса">
                  <${SellerSelect}
                    value=${form.serviceType}
                    onChange=${(e) => updateField("serviceType", e.target.value)}
                  >
                    <option value="">Выберите тип</option>
                    ${serviceCenterTypeOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Боксы">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value=${form.boxesCount}
                    onInput=${(e) => updateField("boxesCount", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Город">
                  <${SellerInput}
                    type="text"
                    value=${form.city}
                    onInput=${(e) => updateField("city", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Часы работы">
                  <${SellerInput}
                    type="text"
                    value=${form.workingHours}
                    onInput=${(e) => updateField("workingHours", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Адрес">
                <${SellerInput}
                  type="text"
                  value=${form.address}
                  onInput=${(e) => updateField("address", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Ориентир">
                  <${SellerInput}
                    type="text"
                    value=${form.locationLabel}
                    onInput=${(e) => updateField("locationLabel", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Геолокация">
                  <${SellerInput}
                    type="text"
                    value=${form.geolocation}
                    onInput=${(e) => updateField("geolocation", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Телефон сервиса">
                  <${SellerInput}
                    type="tel"
                    value=${form.phone}
                    onInput=${(e) => updateField("phone", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Email">
                  <${SellerInput}
                    type="email"
                    value=${form.email}
                    onInput=${(e) => updateField("email", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Описание">
                <${SellerTextarea}
                  value=${form.description}
                  onInput=${(e) => updateField("description", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Медиа для клиентов
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Главное фото, реальные фото работ и видео появятся в карточке сервиса.
                </p>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Добавить фото работ
                <input type="file" accept="image/*" multiple className="hidden" onChange=${handleGalleryPick} />
              </label>
            </div>

            <div
              className="relative rounded-[28px] overflow-hidden h-56 mt-4"
              style=${{
                border: "1px solid rgba(6, 182, 212, 0.14)",
                background: "rgba(255, 255, 255, 0.04)"
              }}
            >
              <img src=${coverPreview} alt="Главное фото сервиса" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style=${{
                  background: "linear-gradient(180deg, rgba(8, 15, 26, 0.08) 0%, rgba(8, 15, 26, 0.82) 100%)"
                }}
              ></div>
              <div className="absolute left-4 right-4 bottom-4">
                <p className="text-[11px] uppercase tracking-[0.12em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  Главное фото карточки
                </p>
                <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${form.name || "Ваш сервис"}
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)" }}>
                  ${form.city || "Город"}${form.address ? ` • ${form.address}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap mt-4">
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Изменить главное фото
                <input type="file" accept="image/*" className="hidden" onChange=${handleCoverPick} />
              </label>
              ${form.coverImage
                ? html`<button
                    type="button"
                    className="px-4 py-3 rounded-2xl text-sm font-semibold"
                    style=${{
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--drivex-light-silver)"
                    }}
                    onClick=${() => updateField("coverImage", "")}
                  >
                    Убрать фото
                  </button>`
                : null}
            </div>

            <div className="mt-5">
              <${SellerField} label="Видео сервиса" note="Пока добавляем ссылкой">
                <${SellerInput}
                  type="url"
                  placeholder="https://youtube.com/..."
                  value=${form.videoUrl}
                  onInput=${(e) => updateField("videoUrl", e.target.value)}
                />
              </${SellerField}>
              <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                Можно вставить ссылку на YouTube, Instagram, TikTok или Google Drive.
              </p>
              ${videoPreviewUrl
                ? html`<a
                    href=${videoPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-semibold"
                    style=${{ color: "var(--drivex-neon-cyan)" }}
                  >
                    <${Icon} name="play" size=${14} />
                    Открыть видео
                  </a>`
                : null}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    Фото работ
                  </p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Показываем клиентам зону сервиса, процессы и реальные кейсы.
                  </p>
                </div>
                <span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  ${galleryPreview.length}/6
                </span>
              </div>

              ${galleryPreview.length
                ? html`<div className="grid grid-cols-3 gap-3">
                    ${galleryPreview.map((photo, index) => html`
                      <div
                        key=${`service-gallery-photo-${index}`}
                        className="relative h-28 overflow-hidden rounded-[22px]"
                        style=${{ border: "1px solid rgba(6, 182, 212, 0.14)" }}
                      >
                        <img src=${photo} alt=${`Фото работы ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                          style=${{
                            background: "rgba(8, 15, 26, 0.78)",
                            color: "var(--drivex-white)"
                          }}
                          onClick=${() => removeGalleryPhoto(index)}
                        >
                          ×
                        </button>
                      </div>
                    `)}
                  </div>`
                : html`<div
                    className="rounded-[24px] p-5"
                    style=${{
                      background: "rgba(255, 255, 255, 0.035)",
                      border: "1px dashed rgba(148, 163, 184, 0.22)"
                    }}
                  >
                    <p className="text-sm" style=${{ color: "var(--drivex-light-silver)" }}>
                      Пока нет фото работ. Добавьте несколько кадров, и они появятся в карточке сервиса вместо demo-галереи.
                    </p>
                  </div>`}
            </div>
          </div>

          <button type="submit" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
            ${submitting ? "Сохраняем сервис..." : "Сохранить настройки"}
          </button>
        </form>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceNotFoundScreen({ currentUser, center }) {
    return html`
      <${ServiceCrmLayout}
        title="Страница не найдена"
        subtitle="Проверьте route Service CRM или вернитесь в основные разделы сервиса."
        activeItem="dashboard"
        currentUser=${currentUser}
        center=${center}
      >
        <div className="glass-card-light rounded-3xl p-6">
          <a href="#/service-crm/dashboard" className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
            В дашборд сервиса
          </a>
        </div>
      </${ServiceCrmLayout}>
    `;
  }

  function NotificationsScreen({ serviceRequests }) {
    const notifications = [
      {
        id: "promo-oil",
        title: "Скидка 15% на замену масла",
        body: "Акция действует до конца недели в партнёрских сервисах.",
        time: "2 часа назад",
        color: "var(--drivex-warning)",
        icon: "star"
      },
      {
        id: "inspection-reminder",
        title: "Напоминание: техосмотр",
        body: "До планового техосмотра осталось 30 дней.",
        time: "Вчера",
        color: "var(--drivex-electric-blue)",
        icon: "scan"
      },
      {
        id: "market-order",
        title: "Ваш заказ в пути",
        body: "Товар ‘Shell Helix Ultra 5W-40’ будет доставлен сегодня.",
        time: "Сегодня",
        color: "var(--drivex-neon-cyan)",
        icon: "bag"
      }
    ];
    const dynamicNotifications = buildBuyerServiceNotifications(serviceRequests);
    const mergedNotifications = [...dynamicNotifications, ...notifications];

    return html`
      <${SimplePage} title="Уведомления" backPath="/profile">
        <div className="px-6 py-6">
          <div className="space-y-3">
            ${mergedNotifications.map((n, idx) => html`
              <div key=${n.id || idx} className="glass-card-light rounded-2xl p-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style=${{ background: alphaBg(n.color, 0.2), color: n.color }}
                  >
                    <${Icon} name=${n.icon} size=${22} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${n.title}
                      </h3>
                      <span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                        ${n.time}
                      </span>
                    </div>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${n.body}
                    </p>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function SettingsScreen() {
    const initial = useMemo(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem("drivex.settings.v1") : null;
        if (!raw) return { pushEnabled: true, geoEnabled: true };
        const parsed = JSON.parse(raw);
        return {
          pushEnabled: typeof parsed?.pushEnabled === "boolean" ? parsed.pushEnabled : true,
          geoEnabled: typeof parsed?.geoEnabled === "boolean" ? parsed.geoEnabled : true
        };
      } catch {
        return { pushEnabled: true, geoEnabled: true };
      }
    }, []);

    const [pushEnabled, setPushEnabled] = useState(initial.pushEnabled);
    const [geoEnabled, setGeoEnabled] = useState(initial.geoEnabled);

    useEffect(() => {
      // lightweight demo persistence
      try {
        window.localStorage &&
          window.localStorage.setItem(
            "drivex.settings.v1",
            JSON.stringify({ pushEnabled, geoEnabled })
          );
      } catch {
        // ignore
      }
    }, [pushEnabled, geoEnabled]);

    return html`
      <${SimplePage} title="Настройки" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Приложение
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(6, 182, 212, 0.2)", color: "var(--drivex-neon-cyan)" }}
                  >
                    <${Icon} name="bell" size=${20} />
                  </div>
                  <div>
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Push-уведомления
                    </p>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Акции и статусы заказов
                    </p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2" style=${{ color: "var(--drivex-white)" }}>
                  <input
                    type="checkbox"
                    checked=${pushEnabled}
                    onChange=${(e) => setPushEnabled(Boolean(e.target.checked))}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(14, 165, 233, 0.2)", color: "var(--drivex-electric-blue)" }}
                  >
                    <${Icon} name="crosshair" size=${20} />
                  </div>
                  <div>
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Геолокация
                    </p>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Для карты и сервисов рядом
                    </p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2" style=${{ color: "var(--drivex-white)" }}>
                  <input
                    type="checkbox"
                    checked=${geoEnabled}
                    onChange=${(e) => setGeoEnabled(Boolean(e.target.checked))}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl overflow-hidden">
            ${[
              { label: "Платёжные данные", path: "/payment", icon: "card" },
              { label: "Бонусная программа", path: "/bonus", icon: "star" },
              { label: "Пригласить друзей", path: "/invite", icon: "copy" }
            ].map((item, idx, arr) => {
              const divider = idx < arr.length - 1 ? { borderBottom: "1px solid var(--glass-border)" } : null;
              return html`
                <a
                  key=${item.path}
                  href=${`#${item.path}`}
                  className="flex items-center gap-4 p-4"
                  style=${divider}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}>
                    <${Icon} name=${item.icon} size=${20} />
                  </div>
                  <span className="flex-1" style=${{ color: "var(--drivex-white)" }}>${item.label}</span>
                  <span style=${{ color: "var(--drivex-silver)" }}>›</span>
                </a>
              `;
            })}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function HelpScreen() {
    const toast = useToast();

    const faqs = [
      {
        q: "Как записаться в сервис?",
        a: "Откройте вкладку “Сервисы”, выберите СТО и нажмите “Записаться”."
      },
      {
        q: "Как работает доставка из Маркета?",
        a: "Добавьте товары в корзину и оформите заказ. Сейчас это демо."
      },
      {
        q: "Что такое “Умный уход”?",
        a: "Раздел с задачами по обслуживанию и напоминаниями. Сейчас в разработке."
      }
    ];

    const contacts = [
      { icon: "bell", label: "Чат поддержки", value: "24/7", toast: "Открыть чат (демо)" },
      { icon: "phone", label: "Телефон", value: "+7 (800) 555-35-35", toast: "Звонок (демо)" },
      { icon: "user", label: "Email", value: "support@drivex.app", toast: "Письмо (демо)" }
    ];

    return html`
      <${SimplePage} title="Помощь и поддержка" backPath="/profile">
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
            Часто задаваемые вопросы
          </h2>

          <div className="space-y-3 mb-8">
            ${faqs.map((f, idx) => html`
              <div key=${idx} className="glass-card-light rounded-2xl p-5">
                <h3 className="font-bold mb-2" style=${{ color: "var(--drivex-white)" }}>
                  ${f.q}
                </h3>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  ${f.a}
                </p>
              </div>
            `)}
          </div>

          <h2 className="text-xl font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
            Связаться с нами
          </h2>

          <div className="space-y-3">
            ${contacts.map((c, idx) => {
              const iconName = c.icon === "phone" ? "sos" : c.icon;
              return html`
                <button
                  key=${idx}
                  type="button"
                  className="w-full glass-card-light rounded-2xl p-5 flex items-center gap-4 text-left"
                  onClick=${() => toast.push(c.toast)}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
                  >
                    <${Icon} name=${iconName} size=${24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1" style=${{ color: "var(--drivex-white)" }}>
                      ${c.label}
                    </p>
                    <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      ${c.value}
                    </p>
                  </div>
                </button>
              `;
            })}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function PaymentDataScreen() {
    const toast = useToast();
    const cards = [
      { id: "card-1", brand: "Visa", last4: "4242", exp: "09/28" },
      { id: "card-2", brand: "Mastercard", last4: "1067", exp: "02/27" }
    ];

    const [defaultCardId, setDefaultCardId] = useState(cards[0]?.id || "card-1");

    return html`
      <${SimplePage} title="Платёжные данные" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Основная карта
                </p>
                <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                  ${cards.find((c) => c.id === defaultCardId)?.brand || "Карта"} •• ${cards.find((c) => c.id === defaultCardId)?.last4 || "----"}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                <${Icon} name="card" size=${28} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                Управление картами — демо.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium dx-btn"
                onClick=${() => toast.push("Добавление карты (демо)")}
              >
                Добавить
              </button>
            </div>
          </div>

          <div className="space-y-3">
            ${cards.map((c) => {
              const isDefault = c.id === defaultCardId;
              return html`
                <div key=${c.id} className="glass-card-light rounded-2xl p-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style=${{
                      background: isDefault ? "rgba(6, 182, 212, 0.2)" : "var(--glass-bg)",
                      color: isDefault ? "var(--drivex-neon-cyan)" : "var(--drivex-white)"
                    }}
                  >
                    <${Icon} name="card" size=${22} />
                  </div>

                  <div className="flex-1">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${c.brand} •• ${c.last4}
                    </p>
                    <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      Действует до ${c.exp}
                    </p>
                  </div>

                  ${isDefault
                    ? html`<span
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style=${{
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "var(--drivex-success)"
                        }}
                      >
                        Основная
                      </span>`
                    : html`<button
                        type="button"
                        className="px-3 py-2 rounded-xl text-xs font-bold"
                        style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                        onClick=${() => {
                          setDefaultCardId(c.id);
                          toast.push("Карта выбрана (демо)");
                        }}
                      >
                        Выбрать
                      </button>`}
                </div>
              `;
            })}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function BonusProgramScreen() {
    const toast = useToast();

    const points = 1250;
    const tier = "Silver";
    const nextTier = "Gold";
    const progress = 0.62;

    const perks = [
      { title: "Кэшбэк баллами", body: "До 3% на услуги и покупки" },
      { title: "Персональные скидки", body: "Предложения от партнёров" },
      { title: "Приоритетная поддержка", body: "Быстрее ответы в чате" }
    ];

    return html`
      <${SimplePage} title="Бонусная программа" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Баланс
                </p>
                <p className="text-4xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                  ${formatPrice(points)} баллов
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  Уровень: <span style=${{ color: "var(--drivex-white)" }}>${tier}</span>
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                <${Icon} name="star" size=${28} />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs mb-2" style=${{ color: "var(--drivex-silver)" }}>
                <span>До уровня ${nextTier}</span>
                <span>${Math.round(progress * 100)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style=${{ background: "rgba(148, 163, 184, 0.2)" }}>
                <div
                  className="h-full rounded-full"
                  style=${{ width: `${Math.round(progress * 100)}%`, background: "var(--gradient-primary)" }}
                ></div>
              </div>

              <button
                type="button"
                className="w-full mt-5 py-4 rounded-2xl font-bold"
                style=${{ background: "rgba(26, 26, 36, 0.35)", color: "var(--drivex-white)" }}
                onClick=${() => toast.push("Список наград (демо)")}
              >
                Посмотреть награды
              </button>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Привилегии
            </h2>
            <div className="space-y-3">
              ${perks.map(
                (p, idx) => html`
                  <div key=${idx} className="glass-card rounded-2xl p-4">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>${p.title}</p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>${p.body}</p>
                  </div>
                `
              )}
            </div>
          </div>

          <button
            type="button"
            className="w-full py-4 rounded-2xl font-bold text-lg dx-btn"
            onClick=${() => toast.push("Списание баллов (демо)")}
          >
            Потратить баллы
          </button>
        </div>
      </${SimplePage}>
    `;
  }

  function InviteFriendsScreen() {
    const toast = useToast();
    const inviteStateKey = drivexStorageKeys.buyerInvite;

    const inviteCode = useMemo(() => {
      const safeId = String(buyerSession?.id || "guest");
      const cleaned = safeId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
      return `DRIVEX-${cleaned || "2026"}`;
    }, [buyerSession?.id]);

    const createDefaultInviteState = useCallback(
      () => ({
        code: inviteCode,
        copiedCount: 0,
        sharedCount: 0,
        lastCopiedAt: null,
        lastSharedAt: null,
        createdAt: new Date().toISOString()
      }),
      [inviteCode]
    );

    const [inviteState, setInviteState] = useState(() => {
      try {
        const raw = readBuyerLocalStorage(inviteStateKey, buyerSession);
        if (!raw) return createDefaultInviteState();
        const parsed = raw;
        if (!parsed || typeof parsed !== "object") return createDefaultInviteState();
        return {
          ...createDefaultInviteState(),
          ...parsed,
          code: String(parsed.code || inviteCode)
        };
      } catch {
        return createDefaultInviteState();
      }
    });

    useEffect(() => {
      if (inviteState.code !== inviteCode) {
        const nextState = { ...inviteState, code: inviteCode };
        setInviteState(nextState);
        pushBuyerState(inviteStateKey, nextState);
      }
    }, [inviteCode, inviteState, pushBuyerState, inviteStateKey]);

    const persistInviteState = useCallback(
      (nextState) => {
        setInviteState(nextState);
        pushBuyerState(inviteStateKey, nextState);
      },
      [inviteStateKey]
    );

    const formatTimestamp = useCallback((timestamp) => {
      if (!timestamp) return "—";
      try {
        return new Date(timestamp).toLocaleString("ru-RU", {
          dateStyle: "short",
          timeStyle: "short"
        });
      } catch {
        return String(timestamp);
      }
    }, []);

    const onCopy = useCallback(async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(inviteCode);
          const nextState = {
            ...inviteState,
            code: inviteCode,
            copiedCount: Number(inviteState.copiedCount || 0) + 1,
            lastCopiedAt: new Date().toISOString()
          };
          persistInviteState(nextState);
          toast.push("Код скопирован");
        } else {
          toast.push("Копирование недоступно");
        }
      } catch {
        toast.push("Не удалось скопировать код");
      }
    }, [inviteCode, inviteState, persistInviteState, toast]);

    const onShare = useCallback(async () => {
      const shareText = `Присоединяйся к DRIVEX и используй код ${inviteCode} для бонусов!`;
      const shareUrl = `${window.location.href.split("#")[0]}#/profile?invite=1`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: "Приглашение в DRIVEX",
            text: shareText,
            url: shareUrl
          });
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        } else {
          toast.push("Поделиться не поддерживается в этом браузере");
          return;
        }

        const nextState = {
          ...inviteState,
          code: inviteCode,
          sharedCount: Number(inviteState.sharedCount || 0) + 1,
          lastSharedAt: new Date().toISOString()
        };
        persistInviteState(nextState);
        toast.push("Приглашение отправлено");
      } catch {
        toast.push("Не удалось отправить приглашение");
      }
    }, [inviteCode, inviteState, persistInviteState, toast]);

    return html`
      <${SimplePage} title="Пригласить друзей" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              Ваш реферальный код
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
              <p className="text-3xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                ${inviteCode}
              </p>
              <button
                type="button"
                className="p-3 rounded-xl glass-card-light"
                style=${{ color: "var(--drivex-neon-cyan)" }}
                onClick=${onCopy}
                aria-label="Копировать"
              >
                <${Icon} name="copy" size=${22} />
              </button>
            </div>

            <p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)" }}>
              Пригласите друга и получите бонусы после первой покупки. Ваш статус сохраняется в Supabase.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                className="py-3 rounded-2xl font-bold"
                style=${{ background: "rgba(26, 26, 36, 0.35)", color: "var(--drivex-white)" }}
                onClick=${onCopy}
              >
                Копировать
              </button>
              <button
                type="button"
                className="py-3 rounded-2xl font-bold dx-btn"
                onClick=${onShare}
              >
                Поделиться
              </button>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Статистика приглашений
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              ${[
                { label: "Копий кода", value: inviteState.copiedCount || 0 },
                { label: "Отправлено приглашений", value: inviteState.sharedCount || 0 },
                {
                  label: "Последнее действие",
                  value:
                    inviteState.lastSharedAt || inviteState.lastCopiedAt
                      ? formatTimestamp(inviteState.lastSharedAt || inviteState.lastCopiedAt)
                      : "—"
                }
              ].map(
                (item) => html`
                  <div key=${item.label} className="rounded-2xl p-4 bg-[#11151e]">
                    <p className="text-sm text-silver">${item.label}</p>
                    <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>${item.value}</p>
                  </div>
                `
              )}
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Как это работает
            </h2>
            <div className="space-y-3">
              ${[
                { n: "1", t: "Отправьте код другу", d: "Любым удобным способом" },
                { n: "2", t: "Друг зарегистрируется", d: "и сделает первую покупку" },
                { n: "3", t: "Вы получите бонусы", d: "на баланс DRIVEX" }
              ].map(
                (s) => html`
                  <div key=${s.n} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style=${{ background: "rgba(6, 182, 212, 0.2)", color: "var(--drivex-neon-cyan)" }}
                    >
                      <span className="text-sm font-bold">${s.n}</span>
                    </div>
                    <div>
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>${s.t}</p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>${s.d}</p>
                    </div>
                  </div>
                `
              )}
            </div>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function ProfileSecurityScreen({ profile }) {
    const toast = useToast();

    const initial = useMemo(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem("drivex.security.v1") : null;
        if (!raw) return { twoFactor: false, biometric: false };
        const parsed = JSON.parse(raw);
        return {
          twoFactor: typeof parsed?.twoFactor === "boolean" ? parsed.twoFactor : false,
          biometric: typeof parsed?.biometric === "boolean" ? parsed.biometric : false
        };
      } catch {
        return { twoFactor: false, biometric: false };
      }
    }, []);

    const [twoFactor, setTwoFactor] = useState(initial.twoFactor);
    const [biometric, setBiometric] = useState(initial.biometric);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem("drivex.security.v1", JSON.stringify({ twoFactor, biometric }));
      } catch {
        // ignore
      }
    }, [twoFactor, biometric]);

    const fallbackProfile = createDefaultBuyerProfile();
    const name = profile?.name || fallbackProfile.name;
    const phone = profile?.phone || fallbackProfile.phone;
    const email = profile?.email || fallbackProfile.email;

    return html`
      <${SimplePage} title="Профиль и безопасность" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Личные данные
                </h2>
                <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                  Имя
                </p>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${name}
                </p>

                <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                  Телефон
                </p>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${phone}
                </p>

                <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                  Email
                </p>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${email}
                </p>
              </div>

              <a
                href="#/profile-edit"
                className="p-3 rounded-xl glass-card"
                style=${{ color: "var(--drivex-neon-cyan)" }}
                aria-label="Редактировать"
              >
                <${Icon} name="edit" size=${22} />
              </a>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Безопасность
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(14, 165, 233, 0.2)", color: "var(--drivex-electric-blue)" }}
                  >
                    <${Icon} name="lock" size=${20} />
                  </div>
                  <div>
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Двухфакторная защита
                    </p>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Дополнительная проверка входа
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked=${twoFactor}
                  onChange=${(e) => setTwoFactor(Boolean(e.target.checked))}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(6, 182, 212, 0.2)", color: "var(--drivex-neon-cyan)" }}
                  >
                    <${Icon} name="scan" size=${20} />
                  </div>
                  <div>
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Биометрия
                    </p>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Touch ID / Face ID (демо)
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked=${biometric}
                  onChange=${(e) => setBiometric(Boolean(e.target.checked))}
                />
              </div>

              <button
                type="button"
                className="w-full py-3 rounded-2xl font-bold"
                style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                onClick=${() => toast.push("Смена пароля (демо)")}
              >
                Сменить пароль
              </button>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Сессии
            </h2>
            <button
              type="button"
              className="w-full py-3 rounded-2xl font-bold"
              style=${{ background: "rgba(239, 68, 68, 0.15)", color: "var(--drivex-danger)" }}
              onClick=${() => toast.push("Выход на всех устройствах (демо)")}
            >
              Выйти на всех устройствах
            </button>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function ProfileEditScreen({ profile, onSave }) {
    const toast = useToast();
    const fallbackProfile = createDefaultBuyerProfile();

    const avatarInputRef = useRef(null);
    const [avatar, setAvatar] = useState(profile?.avatar || "");
    const [name, setName] = useState(profile?.name || fallbackProfile.name);
    const [phone, setPhone] = useState(profile?.phone || fallbackProfile.phone);
    const [email, setEmail] = useState(profile?.email || fallbackProfile.email);

    const openAvatarPicker = useCallback(() => {
      avatarInputRef.current && avatarInputRef.current.click();
    }, []);

    const onAvatarChange = useCallback(
      async (e) => {
        const file = e?.target?.files && e.target.files[0];
        if (e && e.target) e.target.value = "";
        if (!file) return;

        try {
          const nextAvatar = await prepareAvatarDataUrl(file);
          if (!nextAvatar) {
            toast.push("Не удалось загрузить фото");
            return;
          }
          setAvatar(nextAvatar);
          toast.push("Фото обновлено");
        } catch (err) {
          if (String(err && err.message) === "File too large") {
            toast.push("Файл слишком большой (до 5 МБ)");
          } else {
            toast.push("Не удалось загрузить фото");
          }
        }
      },
      [toast]
    );

    const removeAvatar = useCallback(() => {
      setAvatar("");
      toast.push("Фото удалено");
    }, [toast]);

    const submit = useCallback(() => {
      const next = {
        avatar,
        name: String(name || "").trim(),
        phone: String(phone || "").trim(),
        email: String(email || "").trim()
      };

      if (!next.name) {
        toast.push("Введите имя");
        return;
      }

      onSave && onSave(next);
      toast.push("Сохранено");
      window.location.hash = "#/profile-security";
    }, [avatar, email, name, onSave, phone, toast]);

    return html`
      <${SimplePage} title="Редактировать профиль" backPath="/profile-security">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
              Эти данные подставляются в корзину
            </p>
            <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
              Имя и телефон из профиля автоматически переходят в оформление заказа. В корзине их можно временно поменять только для одного заказа.
            </p>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Фото профиля
            </h2>
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                ${avatar
                  ? html`<img
                      src=${avatar}
                      alt="Аватар"
                      style=${{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block"
                      }}
                    />`
                  : html`<${Icon} name="user" size=${36} />`}
              </div>

              <div className="flex-1">
                <button
                  type="button"
                  className="w-full py-3 rounded-2xl font-bold dx-btn"
                  onClick=${openAvatarPicker}
                >
                  Выбрать фото
                </button>

                ${avatar
                  ? html`<button
                      type="button"
                      className="w-full mt-2 py-3 rounded-2xl font-bold"
                      style=${{
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "var(--drivex-danger)"
                      }}
                      onClick=${removeAvatar}
                    >
                      Удалить фото
                    </button>`
                  : null}

                <p className="text-xs mt-3" style=${{ color: "var(--drivex-silver)" }}>
                  JPG/PNG, до 5 МБ. Фото сохраняется на этом устройстве.
                </p>
              </div>
            </div>

            <input
              ref=${avatarInputRef}
              type="file"
              accept="image/*"
              style=${{ display: "none" }}
              onChange=${onAvatarChange}
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Имя
            </label>
            <input
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${name}
              onInput=${(e) => setName(e.target.value)}
              placeholder="Имя и фамилия"
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Телефон
            </label>
            <input
              type="tel"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${phone}
              onInput=${(e) => setPhone(e.target.value)}
              placeholder="+992 00 000 00 00"
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Email
            </label>
            <input
              type="email"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${email}
              onInput=${(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <button
            type="button"
            className="w-full py-4 rounded-2xl font-bold text-lg dx-btn"
            onClick=${submit}
          >
            Сохранить
          </button>
        </div>
      </${SimplePage}>
    `;
  }

  function GarageScreen({ activeCarId, onSelectCar, onAddCar, onRemoveCar }) {
    const toast = useToast();
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [plate, setPlate] = useState("");
    const [year, setYear] = useState("");
    const [mileage, setMileage] = useState("");

    const cars = garageCars;
    const activeCar = findGarageCar(activeCarId) || cars[0];
    const submitCar = useCallback(() => {
      const nextCar = normalizeGarageCar({
        name,
        plate,
        year,
        mileageValue: mileage,
        mileage: mileage ? `${Number(mileage).toLocaleString("ru-RU")} км` : ""
      });
      if (!nextCar) {
        toast.push("Введите марку и модель");
        return;
      }
      onAddCar && onAddCar(nextCar);
      setName("");
      setPlate("");
      setYear("");
      setMileage("");
      setShowForm(false);
      toast.push("Автомобиль добавлен");
    }, [mileage, name, onAddCar, plate, toast, year]);

    return html`
      <${SimplePage} title="Мой гараж" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Активный автомобиль
                </p>
                <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                  ${activeCar?.name || "Не выбран"}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                <${Icon} name="car" size=${28} />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 text-sm" style=${{ color: "var(--drivex-silver)" }}>
              <span>${activeCar?.plate || "—"}</span>
              <span>•</span>
              <span>${activeCar?.year || "—"}</span>
              <span>•</span>
              <span>${activeCar?.mileage || "—"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Автопарк
            </h2>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-sm font-medium dx-btn"
              onClick=${() => setShowForm((value) => !value)}
            >
              Добавить
            </button>
          </div>

          ${showForm
            ? html`
                <div className="glass-card-light rounded-2xl p-4 space-y-3">
                  <input
                    className="w-full p-3 rounded-xl dx-input"
                    value=${name}
                    onInput=${(e) => setName(e.target.value)}
                    placeholder="Марка и модель, например Toyota Camry"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="w-full p-3 rounded-xl dx-input"
                      value=${plate}
                      onInput=${(e) => setPlate(e.target.value)}
                      placeholder="Госномер"
                    />
                    <input
                      type="number"
                      className="w-full p-3 rounded-xl dx-input"
                      value=${year}
                      onInput=${(e) => setYear(e.target.value)}
                      placeholder="Год"
                    />
                  </div>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl dx-input"
                    value=${mileage}
                    onInput=${(e) => setMileage(e.target.value)}
                    placeholder="Пробег, км"
                  />
                  <button type="button" className="w-full py-3 rounded-2xl font-bold dx-btn" onClick=${submitCar}>
                    Сохранить автомобиль
                  </button>
                </div>
              `
            : null}

          <div className="space-y-3">
            ${cars.length
              ? cars.map((car) => html`
                <button
                  key=${car.id}
                  type="button"
                  className="w-full glass-card-light rounded-2xl p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02]"
                  onClick=${() => {
                    onSelectCar && onSelectCar(car.id);
                    toast.push(`Активная машина: ${car.name}`);
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(14, 165, 233, 0.2)", color: "var(--drivex-electric-blue)" }}
                  >
                    <${Icon} name="car" size=${22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${car.name}
                    </p>
                    <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      ${car.plate} • ${car.year} • ${car.mileage}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-bold"
                    style=${{
                      background: car.id === activeCar?.id ? "rgba(6, 182, 212, 0.18)" : "rgba(148, 163, 184, 0.12)",
                      color: car.id === activeCar?.id ? "var(--drivex-neon-cyan)" : "var(--drivex-silver)"
                    }}
                  >
                    ${car.id === activeCar?.id ? "Активна" : "Выбрать"}
                  </span>
                  <span
                    role="button"
                    className="px-3 py-1 rounded-xl text-xs font-bold"
                    style=${{ background: "rgba(239, 68, 68, 0.12)", color: "var(--drivex-danger)" }}
                    onClick=${(event) => {
                      event.stopPropagation();
                      onRemoveCar && onRemoveCar(car.id);
                      toast.push("Автомобиль удалён");
                    }}
                  >
                    Удалить
                  </span>
                </button>
              `)
              : html`
                  <div className="glass-card-light rounded-2xl p-5 text-center">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>Гараж пуст</p>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      Добавьте свой автомобиль, и журнал, документы и умный уход будут работать именно под ним.
                    </p>
                  </div>
                `}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function SmartCareScreen({ maintenance, activeCarId }) {
    const toast = useToast();
    const activeCar = findGarageCar(activeCarId) || garageCars[0] || null;
    const tasks = buildSmartCareTasks(maintenance, activeCarId);
    const nextTask = tasks[0] || null;

    return html`
      <${SimplePage} title="Умный уход" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <p className="text-sm mb-2" style=${{ color: "var(--drivex-silver)" }}>
              Следующее обслуживание
            </p>
            <p className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              ${nextTask?.title || (activeCar ? "Всё спокойно" : "Добавьте автомобиль")}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                ${nextTask?.dueDate || (activeCar ? "Срочных задач нет. Добавляйте записи в журнал обслуживания." : "После добавления машины появятся персональные рекомендации.")}
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium dx-btn"
                onClick=${() => {
                  window.location.hash = activeCar ? "#/maintenance-add" : "#/garage";
                }}
              >
                ${activeCar ? "Добавить запись" : "Добавить авто"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Задачи
            </h2>
            <button
              type="button"
              className="text-sm font-medium"
              style=${{ color: "var(--drivex-neon-cyan)" }}
              onClick=${() => {
                window.location.hash = activeCar ? "#/maintenance-add" : "#/garage";
              }}
            >
              Добавить
            </button>
          </div>

          <div className="space-y-3">
            ${tasks.length
              ? tasks.map((t) => html`
                <div key=${t.id} className="glass-card-light rounded-2xl p-4 flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style=${{ background: alphaBg(t.color, 0.2), color: t.color }}
                  >
                    <${Icon} name="scan" size=${20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      ${t.title}
                    </p>
                    <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      ${t.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-xs font-bold"
                    style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                    onClick=${() => {
                      window.location.hash = "#/maintenance";
                    }}
                  >
                    Подробнее
                  </button>
                </div>
              `)
              : html`
                  <div className="glass-card-light rounded-2xl p-5 text-center">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${activeCar ? "Нет задач" : "Нет автомобиля"}
                    </p>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${activeCar
                        ? "Добавьте записи обслуживания или дату техосмотра, и DRIVEX начнёт считать рекомендации."
                        : "Добавьте машину в гараж, чтобы включить умный уход."}
                    </p>
                  </div>
                `}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function MaintenanceScreen({ maintenance, spentTotal, activeCarId, onSelectCar, onRemoveRecord, serviceRequests }) {
    const toast = useToast();
    const safeCarId = ensureCarId(activeCarId);
    const activeCar = findGarageCar(safeCarId) || garageCars[0];
    const carState = getMaintenanceCarState(maintenance, safeCarId);
    const records = carState.records;
    const inspection = carState.inspection;
    const relatedServiceRequests = normalizeServiceRequestsList(serviceRequests)
      .filter((item) => item.carId === safeCarId)
      .sort((left, right) =>
        String(right.statusUpdatedAt || right.createdAt || "").localeCompare(
          String(left.statusUpdatedAt || left.createdAt || "")
        )
      );

    const safeSpentTotal = Number.isFinite(Number(spentTotal)) ? Number(spentTotal) : getMaintenanceSpentTotal(maintenance);
    const currentCarSpent = getMaintenanceSpentTotal(maintenance, safeCarId);

    const daysLeft = inspection?.validUntil ? daysUntil(inspection.validUntil) : null;
    const inspectionLabel =
      typeof daysLeft === "number"
        ? daysLeft < 0
          ? "Просрочен"
          : daysLeft === 0
            ? "Сегодня"
            : `${daysLeft} дн`
        : "Не задан";
    const inspectionColor =
      typeof daysLeft === "number"
        ? daysLeft < 0
          ? "var(--drivex-danger)"
          : daysLeft <= 14
            ? "var(--drivex-warning)"
            : "var(--drivex-success)"
        : "var(--drivex-silver)";
    const inspectionSubtitle = inspection?.validUntil
      ? `Действует до ${formatRuDate(inspection.validUntil)}`
      : "Укажите дату окончания техосмотра";

    return html`
      <${SimplePage} title="Журнал обслуживания" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Текущая машина
                </p>
                <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                  ${activeCar?.name || "Не выбрано"}
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  ${activeCar ? `${activeCar.plate} • ${activeCar.year} • ${activeCar.mileage}` : "Выберите авто"}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                <${Icon} name="car" size=${28} />
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
              ${garageCars.map((car) => html`
                <button
                  key=${car.id}
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap"
                  style=${{
                    background: car.id === safeCarId ? "rgba(6, 182, 212, 0.18)" : "var(--glass-bg)",
                    color: car.id === safeCarId ? "var(--drivex-neon-cyan)" : "var(--drivex-white)"
                  }}
                  onClick=${() => onSelectCar && onSelectCar(car.id)}
                >
                  ${car.name}
                </button>
              `)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-5 neon-glow-blue">
              <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                По машине
              </p>
              <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${formatTjsPrice(currentCarSpent)}
              </p>
              <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                расходы ${activeCar?.name || "по машине"}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 neon-glow-cyan">
              <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                Всего в системе
              </p>
              <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${formatTjsPrice(safeSpentTotal)}
              </p>
              <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                по всем машинам
              </p>
            </div>
          </div>

          <a
            href="#/inspection"
            className="glass-card-light rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02]"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style=${{ background: alphaBg(inspectionColor, 0.2), color: inspectionColor }}
            >
              <${Icon} name="scan" size=${22} />
            </div>
            <div className="flex-1">
              <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                Техосмотр
              </p>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                ${inspectionSubtitle}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-xl text-xs font-bold"
              style=${{ background: alphaBg(inspectionColor, 0.2), color: inspectionColor }}
            >
              ${inspectionLabel}
            </span>
          </a>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="#/maintenance-add"
              className="py-4 rounded-2xl font-bold text-center dx-btn inline-flex items-center justify-center gap-2"
            >
              <${Icon} name="plus" size=${18} /> Добавить
            </a>
            <button
              type="button"
              className="py-4 rounded-2xl font-bold"
              style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
              onClick=${() => navigateToHash("/services")}
            >
              Онлайн запись
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              История и записи ${activeCar?.name || ""}
            </h2>
            <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              ${records.length} записей
            </span>
          </div>

          ${records.length === 0
            ? html`<div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
                Для ${activeCar?.name || "этой машины"} пока нет записей. Добавьте первую работу вручную или создайте онлайн-запись в сервис.
              </div>`
            : html`<div className="space-y-3">
                ${records.map((r) => {
                  const dateLabel = r.date ? formatRuDate(r.date) : "Без даты";
                  const mileageLabel =
                    typeof r.mileage === "number" ? `${formatPrice(r.mileage)} км` : null;
                  const isBooking = r.type === "booking";
                  const linkedRequest = isBooking
                    ? relatedServiceRequests.find((request) => request.id === r.id) || null
                    : null;
                  const linkedStatusMeta = getServiceRequestStatusMeta(linkedRequest?.status);
                  const iconName = isBooking ? "calendar" : "wrench";
                  const accentColor = isBooking ? "var(--drivex-neon-cyan)" : "var(--drivex-electric-blue)";
                  const badgeLabel = isBooking ? "Запись" : "Работа";
                  const amountLabel = isBooking
                    ? r.cost > 0
                      ? formatTjsPrice(r.cost)
                      : linkedRequest
                        ? linkedStatusMeta.label
                        : "Запланировано"
                    : formatTjsPrice(r.cost || 0);
                  return html`
                    <div key=${r.id} className="glass-card-light rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style=${{
                              background: alphaBg(accentColor, 0.2),
                              color: accentColor
                            }}
                          >
                            <${Icon} name=${iconName} size=${22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                                ${r.title}
                              </p>
                              <span
                                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                style=${{
                                  background: alphaBg(accentColor, 0.16),
                                  color: accentColor
                                }}
                              >
                                ${badgeLabel}
                              </span>
                            </div>
                            <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                              ${dateLabel}${mileageLabel ? ` • ${mileageLabel}` : ""}
                            </p>
                            ${r.service
                              ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                                  ${r.service}
                                </p>`
                              : null}
                            ${linkedRequest
                              ? html`<p className="text-xs mt-2" style=${{ color: linkedStatusMeta.color }}>
                                  Онлайн-статус: ${linkedStatusMeta.label}
                                </p>`
                              : null}
                            ${r.notes
                              ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-white)" }}>
                                  ${r.notes}
                                </p>`
                              : null}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold" style=${{ color: linkedRequest ? linkedStatusMeta.color : "var(--drivex-white)" }}>
                            ${amountLabel}
                          </p>
                          <button
                            type="button"
                            className="mt-3 p-2 rounded-xl glass-card"
                            style=${{ color: "var(--drivex-danger)" }}
                            onClick=${() => {
                              onRemoveRecord && onRemoveRecord(safeCarId, r.id);
                              toast.push("Удалено");
                            }}
                            aria-label="Удалить запись"
                          >
                            <${Icon} name="trash" size=${18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                })}
              </div>`}
        </div>
      </${SimplePage}>
    `;
  }

  function MaintenanceAddScreen({ activeCarId, onSelectCar, onAddRecord }) {
    const toast = useToast();
    const [carId, setCarId] = useState(() => ensureCarId(activeCarId));

    const [type, setType] = useState("oil");
    const [date, setDate] = useState(toLocalISODate());
    const [mileage, setMileage] = useState("");
    const [cost, setCost] = useState("");
    const [service, setService] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
      setCarId(ensureCarId(activeCarId));
    }, [activeCarId]);

    const submit = useCallback(() => {
      const option = maintenanceTypeOptions.find((o) => o.id === type);
      const title = option ? option.title : "Обслуживание";
      const dateValue = parseISODate(date) ? date : toLocalISODate();

      const mileageNum = mileage === "" ? null : Number(mileage);
      const costNum = cost === "" ? 0 : Number(cost);

      if (!Number.isFinite(costNum) || costNum < 0) {
        toast.push("Проверьте сумму");
        return;
      }
      if (mileageNum !== null && (!Number.isFinite(mileageNum) || mileageNum < 0)) {
        toast.push("Проверьте пробег");
        return;
      }

      onAddRecord &&
        onAddRecord(carId, {
          id: genId("svc"),
          type,
          title,
          date: dateValue,
          mileage: mileageNum === null ? null : Math.floor(mileageNum),
          cost: Math.floor(costNum),
          service: String(service || "").trim(),
          notes: String(notes || "").trim()
        });

      toast.push("Добавлено");
      window.location.hash = "#/maintenance";
    }, [carId, cost, date, mileage, notes, onAddRecord, service, toast, type]);

    return html`
      <${SimplePage} title="Новая запись" backPath="/maintenance">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Машина
            </label>
            <select
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${carId}
              onChange=${(e) => {
                setCarId(e.target.value);
                onSelectCar && onSelectCar(e.target.value);
              }}
            >
              ${garageCars.map((car) => html`<option key=${car.id} value=${car.id}>${car.name} • ${car.plate}</option>`)}
            </select>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Тип работ
            </label>
            <select
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${type}
              onChange=${(e) => setType(e.target.value)}
            >
              ${maintenanceTypeOptions.map((o) => html`<option key=${o.id} value=${o.id}>${o.title}</option>`)}
            </select>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Дата
            </label>
            <input
              type="date"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${date}
              onInput=${(e) => setDate(e.target.value)}
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Пробег (км)
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${mileage}
              onInput=${(e) => setMileage(e.target.value)}
              placeholder="Например: 54200"
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Сумма (₽)
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${cost}
              onInput=${(e) => setCost(e.target.value)}
              placeholder="Например: 6500"
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Мастер / Сервис
            </label>
            <input
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${service}
              onInput=${(e) => setService(e.target.value)}
              placeholder="Название или контакты (опционально)"
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Заметка
            </label>
            <textarea
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)", minHeight: "96px" }}
              value=${notes}
              onInput=${(e) => setNotes(e.target.value)}
              placeholder="Какие запчасти, масло, детали и т.д."
            ></textarea>
          </div>

          <button type="button" className="w-full py-4 rounded-2xl font-bold text-lg dx-btn" onClick=${submit}>
            Сохранить
          </button>
        </div>
      </${SimplePage}>
    `;
  }

  function InspectionScreen({ maintenance, activeCarId, onSelectCar, onSave }) {
    const toast = useToast();
    const safeCarId = ensureCarId(activeCarId);
    const activeCar = findGarageCar(safeCarId) || garageCars[0];
    const inspection = getMaintenanceCarState(maintenance, safeCarId).inspection;

    const initialDoneAt = typeof inspection?.doneAt === "string" ? inspection.doneAt : "";
    const initialValidUntil = typeof inspection?.validUntil === "string" ? inspection.validUntil : "";

    const [doneAt, setDoneAt] = useState(parseISODate(initialDoneAt) ? initialDoneAt : toLocalISODate());
    const [validUntil, setValidUntil] = useState(parseISODate(initialValidUntil) ? initialValidUntil : "");

    useEffect(() => {
      setDoneAt(parseISODate(initialDoneAt) ? initialDoneAt : toLocalISODate());
      setValidUntil(parseISODate(initialValidUntil) ? initialValidUntil : "");
    }, [initialDoneAt, initialValidUntil, safeCarId]);

    const submit = useCallback(() => {
      if (!parseISODate(validUntil)) {
        toast.push("Укажите дату окончания");
        return;
      }

      if (!parseISODate(doneAt)) {
        toast.push("Укажите дату прохождения");
        return;
      }

      const dDone = parseISODate(doneAt);
      const dUntil = parseISODate(validUntil);
      if (dDone && dUntil && dUntil.getTime() < dDone.getTime()) {
        toast.push("Окончание не может быть раньше даты прохождения");
        return;
      }

      onSave && onSave(safeCarId, { doneAt, validUntil });
      toast.push("Сохранено");
      window.location.hash = "#/maintenance";
    }, [doneAt, onSave, safeCarId, toast, validUntil]);

    return html`
      <${SimplePage} title="Техосмотр" backPath="/maintenance">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              Для машины
            </p>
            <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
              ${activeCar?.name || "Не выбрано"}
            </p>
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
              ${garageCars.map((car) => html`
                <button
                  key=${car.id}
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap"
                  style=${{
                    background: car.id === safeCarId ? "rgba(14, 165, 233, 0.18)" : "var(--glass-bg)",
                    color: car.id === safeCarId ? "var(--drivex-electric-blue)" : "var(--drivex-white)"
                  }}
                  onClick=${() => onSelectCar && onSelectCar(car.id)}
                >
                  ${car.name}
                </button>
              `)}
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Даты
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
                  Дата прохождения
                </label>
                <input
                  type="date"
                  className="w-full p-3 rounded-xl outline-none dx-input"
                  style=${{ background: "var(--glass-bg)" }}
                  value=${doneAt}
                  onInput=${(e) => setDoneAt(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
                  Действует до
                </label>
                <input
                  type="date"
                  className="w-full p-3 rounded-xl outline-none dx-input"
                  style=${{ background: "var(--glass-bg)" }}
                  value=${validUntil}
                  onInput=${(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-4">
            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
              Подсказка: мы покажем напоминание, когда срок начнёт подходить к концу.
            </p>
          </div>

          <button type="button" className="w-full py-4 rounded-2xl font-bold text-lg dx-btn" onClick=${submit}>
            Сохранить
          </button>
        </div>
      </${SimplePage}>
    `;
  }

  function OrdersScreen({ orders, orderChats }) {
    const safeOrders = normalizeBuyerOrdersList(orders);
    return html`
      <${SimplePage} title="История заказов" backPath="/profile">
        <div className="px-6 py-6 space-y-3">
          ${safeOrders.length
            ? safeOrders.map((order) => html`
                <div
                  key=${order.id}
                  className="rounded-[28px] p-5"
                  style=${{
                    background: "linear-gradient(180deg, rgba(20, 25, 37, 0.94) 0%, rgba(12, 16, 24, 0.98) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.14)"
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${order.id}
                      </p>
                      <p className="text-sm mt-1 truncate" style=${{ color: "var(--drivex-silver)" }}>
                        ${formatRuDate(order.date)} • ${order.storeName}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        ${[order.deliveryMethod, `${order.itemsCount} товара`].map((chip, index) => html`
                          <span
                            key=${`${order.id}-buyer-chip-${index}`}
                            className="px-3 py-1.5 rounded-full text-xs"
                            style=${{
                              background: "rgba(255, 255, 255, 0.04)",
                              color: "var(--drivex-silver)",
                              border: "1px solid rgba(255, 255, 255, 0.05)"
                            }}
                          >
                            ${chip}
                          </span>
                        `)}
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold"
                      style=${{
                        background: alphaBg(order.statusColor, 0.2),
                        color: order.statusColor
                      }}
                    >
                      ${order.statusLabel}
                    </span>
                  </div>

                  <div
                    className="rounded-[24px] p-4 mt-4"
                    style=${{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.05)"
                    }}
                  >
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      ${order.statusNote}
                    </p>
                    <div className="space-y-2 mt-3">
                      ${order.items.map((item) => html`
                        <div key=${`${order.id}-${item.title}`} className="flex items-center justify-between gap-3">
                          <span className="text-sm" style=${{ color: "var(--drivex-white)" }}>
                            ${item.title} × ${item.qty}
                          </span>
                          <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                            ${formatTjsPrice((Number(item.qty) || 0) * (Number(item.price) || 0))}
                          </span>
                        </div>
                      `)}
                    </div>
                  </div>

                  <${OrderStatusTimeline} order=${order} variant="buyer" />

                  <${OrderChatSummaryCard}
                    order=${order}
                    orderChats=${orderChats}
                    viewerRole="buyer"
                    actionLabel="Написать продавцу"
                    actionPath=${getBuyerOrderChatPath(order.id)}
                  />

                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm" style=${{ color: "var(--drivex-silver)", lineHeight: 1.5 }}>
                        ${order.address || "Адрес будет подтверждён продавцом"}
                      </p>
                    </div>
                    <p className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${formatTjsPrice(order.amount)}
                    </p>
                  </div>
                </div>
              `)
            : html`<div className="glass-card-light rounded-2xl p-6 text-center">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Заказов пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  После оформления товары появятся здесь, и статусы будут обновляться от продавца.
                </p>
                <a href="#/market" className="inline-flex mt-4 px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
                  Открыть маркет
                </a>
              </div>`}
        </div>
      </${SimplePage}>
    `;
  }

  function TripsScreen() {
    const trips = [
      { id: 1, date: "Сегодня", from: "Дом", to: "Работа", distance: "12.4 км", time: "18 мин" },
      { id: 2, date: "Вчера", from: "Работа", to: "СТО Премиум", distance: "7.8 км", time: "14 мин" },
      { id: 3, date: "10 марта", from: "Дом", to: "ТЦ Галерея", distance: "5.1 км", time: "11 мин" }
    ];

    return html`
      <${SimplePage} title="История поездок" backPath="/profile">
        <div className="px-6 py-6 space-y-3">
          ${trips.map((t) => html`
            <div key=${t.id} className="glass-card-light rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>${t.date}</p>
                <span className="text-xs" style=${{ color: "var(--drivex-neon-cyan)" }}>${t.time}</span>
              </div>
              <p className="font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${t.from} → ${t.to}
              </p>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Дистанция: ${t.distance}
              </p>
            </div>
          `)}
        </div>
      </${SimplePage}>
    `;
  }

  function SavedLocationsScreen({ places = [], onAddPlace, onRemovePlace }) {
    const toast = useToast();
    const [title, setTitle] = useState("");
    const [address, setAddress] = useState("");
    const safePlaces = normalizeSavedPlacesList(places);
    const addPlace = useCallback(() => {
      const place = normalizeSavedPlace({ title, address });
      if (!place) {
        toast.push("Введите название или адрес");
        return;
      }
      onAddPlace && onAddPlace(place);
      setTitle("");
      setAddress("");
      toast.push("Место сохранено");
    }, [address, onAddPlace, title, toast]);

    return html`
      <${SimplePage} title="Сохранённые места" backPath="/profile">
        <div className="px-6 py-6 space-y-3">
          <div className="glass-card-light rounded-2xl p-4 space-y-3">
            <input
              className="w-full p-3 rounded-xl dx-input"
              value=${title}
              onInput=${(e) => setTitle(e.target.value)}
              placeholder="Название: дом, работа, любимый сервис"
            />
            <input
              className="w-full p-3 rounded-xl dx-input"
              value=${address}
              onInput=${(e) => setAddress(e.target.value)}
              placeholder="Адрес"
            />
            <button type="button" className="w-full py-3 rounded-2xl font-bold dx-btn" onClick=${addPlace}>
              Сохранить место
            </button>
          </div>

          ${safePlaces.length
            ? safePlaces.map((p) => html`
            <button
              key=${p.id}
              type="button"
              className="w-full glass-card-light rounded-2xl p-4 flex items-center gap-4 text-left"
              onClick=${() => toast.push(`Сохранённое место: ${p.title}`)}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style=${{ background: alphaBg(p.color, 0.2), color: p.color }}
              >
                <${Icon} name=${p.icon} size=${22} />
              </div>
              <div className="flex-1">
                <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                  ${p.title}
                </p>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  ${p.address}
                </p>
              </div>
              <span
                role="button"
                style=${{ color: "var(--drivex-danger)" }}
                onClick=${(event) => {
                  event.stopPropagation();
                  onRemovePlace && onRemovePlace(p.id);
                  toast.push("Место удалено");
                }}
              >
                ×
              </span>
            </button>
          `)
            : html`
                <div className="glass-card-light rounded-2xl p-5 text-center">
                  <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>Список пуст</p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                    Сохраните свои адреса, чтобы быстро использовать их в заказах и маршрутах.
                  </p>
                </div>
              `}
        </div>
      </${SimplePage}>
    `;
  }

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
        const avatar =
          avatarRaw === ""
            ? ""
            : avatarRaw.startsWith("data:image/") && avatarRaw.length <= 500000
              ? avatarRaw
              : prev.avatar;

        const nextProfile = {
          name: String(name || "").trim() || prev.name,
          phone: String(phone || "").trim() || prev.phone,
          email: String(email || "").trim() || prev.email,
          avatar
        };

        pushBuyerState(drivexStorageKeys.profile, nextProfile);
        return nextProfile;
      });
    }, [pushBuyerState]);

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

    const registerBuyer = useCallback(
      async (payload) => {
        const email = String(payload?.email || "").trim().toLowerCase();
        const password = String(payload?.password || "");
        const name = String(payload?.name || "").trim();
        const phone = String(payload?.phone || "").trim();
        if (!email || !password || !name) throw new Error("Заполните имя, email и пароль");

        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: "buyer",
                full_name: name,
                phone
              }
            }
          });
          if (error) throw error;
          const session = makeBuyerSessionFromSupabaseUser(data?.user);
          applyBuyerSession(session);
          buyerStateReadyRef.current = true;
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
          role: "buyer",
          createdAt: new Date().toISOString()
        };
        writeLocalBuyerUsers([user, ...users]);
        const session = makeBuyerSessionFromLocalUser(user);
        applyBuyerSession(session);
        navigateToHash("/profile");
        return session;
      },
      [applyBuyerSession]
    );

    const loginBuyer = useCallback(
      async (payload) => {
        const email = String(payload?.email || "").trim().toLowerCase();
        const password = String(payload?.password || "");
        if (!email || !password) throw new Error("Введите email и пароль");

        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const session = makeBuyerSessionFromSupabaseUser(data?.user);
          applyBuyerSession(session);
          const state = await fetchBuyerAppState(session).catch(() => null);
          if (state) {
            applyBuyerAppState(state);
          } else {
            buyerStateReadyRef.current = true;
          }
          navigateToHash("/profile");
          return session;
        }

        const user = readLocalBuyerUsers().find(
          (entry) => String(entry.email || "").toLowerCase() === email && String(entry.password || "") === password
        );
        if (!user) throw new Error("Неверный email или пароль");

        const session = makeBuyerSessionFromLocalUser(user);
        applyBuyerSession(session);
        navigateToHash("/profile");
        return session;
      },
      [applyBuyerAppState, applyBuyerSession]
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
          />`;
    } else if (!buyerIsAuthenticated && !isPartnerRoute && !isSellerRoute && !isServiceCrmRoute) {
      activePath = "/profile";
      content = html`<${BuyerAuthScreen}
        mode="register"
        authStatus=${buyerAuthStatus}
        onLogin=${loginBuyer}
        onRegister=${registerBuyer}
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
    } else if (normalized === "/") {
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
        content = html`<${ProfileEditScreen} profile=${profile} onSave=${updateProfile} />`;
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

  function Root() {
    return html`<${ToastProvider}><${App} /></${ToastProvider}>`;
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



