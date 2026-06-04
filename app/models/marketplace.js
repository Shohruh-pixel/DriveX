// app/models/marketplace.js — Products, marketplace data, and cart functions
(() => {
  'use strict';
  const DX = window.DX;

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
  // Export to DX namespace
  DX.products = products;
  DX.marketplaceBaseData = marketplaceBaseData;
  DX.marketplaceRuntime = marketplaceRuntime;
  DX.drivexSyncChannelName = drivexSyncChannelName;
  DX.drivexStorageKeys = drivexStorageKeys;
  DX.liveSharedAppStateKeys = liveSharedAppStateKeys;
  DX.buyerPersonalStorageKeys = buyerPersonalStorageKeys;
  DX.drivexMediaDbName = drivexMediaDbName;
  DX.drivexMediaStoreName = drivexMediaStoreName;
  DX.marketplaceData = marketplaceData;
  DX.setMarketplaceRuntime = setMarketplaceRuntime;
  DX.normalizeMarketplacePartnerCatalog = normalizeMarketplacePartnerCatalog;
})();
