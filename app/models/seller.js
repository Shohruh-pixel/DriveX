// app/models/seller.js — Seller normalization and marketplace bridge functions
(() => {
  'use strict';
  const DX = window.DX;
  // Pull deps from DX namespace
  const slugifyText = DX.slugifyText;
  const genId = DX.genId;
  const toLocalISODate = DX.toLocalISODate;
  const parseISODate = DX.parseISODate;
  const formatTjsPrice = DX.formatTjsPrice;
  const sellerPrimaryStoreId = DX.sellerPrimaryStoreId;
  const sellerProductStatusOptions = DX.sellerProductStatusOptions;
  const sellerOrderStatusOptions = DX.sellerOrderStatusOptions;
  const buyerOrderStatusOptions = DX.buyerOrderStatusOptions;
  const marketCategories = DX.marketCategories;
  const marketplaceBaseData = DX.marketplaceBaseData;
  const marketplaceData = DX.marketplaceData;

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

  // Export to DX namespace
  DX.isSellerRole = isSellerRole;
  DX.getSellerProductCategoryMeta = getSellerProductCategoryMeta;
  DX.getSellerOrderStatusMeta = getSellerOrderStatusMeta;
  DX.getBuyerOrderStatusMeta = getBuyerOrderStatusMeta;
  DX.getSellerProductStatusMeta = getSellerProductStatusMeta;
  DX.isPickupSellerOrder = isPickupSellerOrder;
  DX.getAllowedSellerOrderStatusIds = getAllowedSellerOrderStatusIds;
  DX.getAllowedSellerOrderStatuses = getAllowedSellerOrderStatuses;
  DX.canTransitionSellerOrder = canTransitionSellerOrder;
  DX.getSellerOrderActions = getSellerOrderActions;
  DX.getOrderTimelineStepIds = getOrderTimelineStepIds;
  DX.getOrderTimelineSteps = getOrderTimelineSteps;
  DX.getOrderTimelineCompactLabel = getOrderTimelineCompactLabel;
  DX.OrderStatusTimeline = OrderStatusTimeline;
  DX.getSellerFallbackProductImage = getSellerFallbackProductImage;
  DX.deriveBrandFromTitle = deriveBrandFromTitle;
  DX.createPendingSellerStoreId = createPendingSellerStoreId;
  DX.createDefaultSellerSession = createDefaultSellerSession;
  DX.createFreshSellerSession = createFreshSellerSession;
  DX.createSellerRegistrationDraft = createSellerRegistrationDraft;
  DX.normalizeSellerSession = normalizeSellerSession;
  DX.resolveSellerBackendSnapshot = resolveSellerBackendSnapshot;
  DX.createSellerProfileSeed = createSellerProfileSeed;
  DX.normalizeSellerProfile = normalizeSellerProfile;
  DX.createSellerStoreSeed = createSellerStoreSeed;
  DX.normalizeSellerStore = normalizeSellerStore;
  DX.getSellerSetupChecklist = getSellerSetupChecklist;
  DX.getSellerSetupState = getSellerSetupState;
  DX.createGeneratedMarketProductId = createGeneratedMarketProductId;
  DX.normalizeSellerProduct = normalizeSellerProduct;
  DX.mapSellerStoreToMarketplaceStore = mapSellerStoreToMarketplaceStore;
  DX.mapSellerProductToMarketplaceProduct = mapSellerProductToMarketplaceProduct;
  DX.normalizeMarketplacePartnerProduct = normalizeMarketplacePartnerProduct;
  DX.buildMarketplaceRuntimeData = buildMarketplaceRuntimeData;
  DX.compactSellerProductForSync = compactSellerProductForSync;
  DX.compactSellerProductsForSync = compactSellerProductsForSync;
  DX.normalizeSellerProductsList = normalizeSellerProductsList;
  DX.normalizeSellerOrdersList = normalizeSellerOrdersList;
  DX.applySellerOrderStatus = applySellerOrderStatus;
  DX.normalizeBuyerOrder = normalizeBuyerOrder;
  DX.normalizeBuyerOrdersList = normalizeBuyerOrdersList;
  DX.createBuyerOrdersFromCheckout = createBuyerOrdersFromCheckout;
  DX.mergeBuyerOrders = mergeBuyerOrders;
  DX.syncBuyerOrdersWithSellerOrders = syncBuyerOrdersWithSellerOrders;
  DX.normalizeOrderChatMessage = normalizeOrderChatMessage;
  DX.normalizeOrderChatMessagesList = normalizeOrderChatMessagesList;
  DX.normalizeOrderChatThread = normalizeOrderChatThread;
  DX.normalizeOrderChatsMap = normalizeOrderChatsMap;
  DX.getOrderChatThread = getOrderChatThread;
  DX.getOrderChatLastMessage = getOrderChatLastMessage;
  DX.getOrderChatUnreadCount = getOrderChatUnreadCount;
  DX.appendOrderChatMessage = appendOrderChatMessage;
  DX.markOrderChatAsRead = markOrderChatAsRead;
  DX.normalizeSellerOrder = normalizeSellerOrder;
  DX.createDefaultBuyerProfile = createDefaultBuyerProfile;
  DX.resolveSellerProductsState = resolveSellerProductsState;
  DX.createSellerProductsSeed = createSellerProductsSeed;
  DX.createSellerOrdersFromCart = createSellerOrdersFromCart;
  DX.createMarketplaceCheckoutDraft = createMarketplaceCheckoutDraft;
  DX.syncMarketplaceCheckoutDraft = syncMarketplaceCheckoutDraft;
  DX.getMarketProductPath = getMarketProductPath;
  DX.getMarketStorePath = getMarketStorePath;
  DX.getMarketCartPath = getMarketCartPath;
  DX.normalizeMarketProductId = normalizeMarketProductId;
  DX.createMarketCartKey = createMarketCartKey;
  DX.parseMarketCartKey = parseMarketCartKey;
  DX.getMarketStore = getMarketStore;
  DX.getMarketProduct = getMarketProduct;
  DX.getMarketProductsByStore = getMarketProductsByStore;
  DX.filterMarketProducts = filterMarketProducts;
  DX.getRelatedMarketProducts = getRelatedMarketProducts;
  DX.getMarketDiscountPercent = getMarketDiscountPercent;
  DX.getMarketBadgeColor = getMarketBadgeColor;
  DX.resolveProductCategoryId = typeof resolveProductCategoryId !== 'undefined' ? resolveProductCategoryId : DX.resolveServiceCategoryId;
})();
