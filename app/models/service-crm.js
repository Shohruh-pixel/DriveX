// app/models/service-crm.js — Service CRM model functions
(() => {
  'use strict';
  const DX = window.DX;
  const { genId, toLocalISODate, slugifyText, ensureCarId } = DX;
  const sellerPrimaryStoreId  = DX.sellerPrimaryStoreId  || 'auto-parts-khujand';
  const servicePrimaryCenterId = DX.servicePrimaryCenterId || 'service-center-1';
  const serviceRepairStatusOptions     = DX.serviceRepairStatusOptions     || [];
  const serviceRequestStatusOptions    = DX.serviceRequestStatusOptions    || [];
  const serviceAppointmentStatusOptions= DX.serviceAppointmentStatusOptions|| [];

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
    const effectiveRecommended = _liveRecommendedServices || recommendedServices;
    const featuredServices = catalogService
      ? dedupeServicesById([...catalogServices, ...effectiveRecommended]).map((item) => decorateServiceRecord(item))
      : sharedCatalogServices.length
        ? dedupeServicesById([...sharedCatalogServices, ...effectiveRecommended]).map((item) => decorateServiceRecord(item))
        : effectiveRecommended.map((item) => decorateServiceRecord(item));
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
    const effectiveNearby = _liveNearbyServices || nearbyServices;
    const nearbyRuntimeServices = nearbyCatalogCards.length
      ? dedupeServicesById([...nearbyCatalogCards, ...effectiveNearby]).map((item) => decorateServiceRecord(item))
      : effectiveNearby.map((item) => decorateServiceRecord(item));
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

  // Export to DX namespace
  Object.assign(DX, {
    createDefaultServiceSession, createFreshServiceSession, normalizeServiceSession,
    normalizeTjPhoneInput, isCompleteTjPhone, normalizeServiceProfile,
    createDefaultServiceAuthState, normalizeServiceAuthState,
    createServiceCenterSeed, normalizeServiceImageAsset, normalizeServiceGalleryList,
    normalizeServiceVideoUrl, normalizeServiceCenter, createServiceCenterFormState,
    extractServiceCenterMedia, serializeServiceCenterForStorage,
    getLatestPersistedServiceCenter, persistServiceCenterToLocalStorage,
    createServiceRegistrationDraft, normalizeServiceClient, normalizeServiceClientsList,
    isDemoServiceClient, createServiceClientsSeed, getServiceRepairStatusMeta,
    normalizeServiceRepairOrder, normalizeServiceRepairOrdersList, isDemoServiceOrder,
    createServiceOrdersSeed, getServiceRepairActions, normalizeServiceInventoryItem,
    normalizeServiceInventoryList, isDemoServiceInventoryItem, createServiceInventorySeed,
    normalizeServiceFinanceEntry, normalizeServiceFinanceList, isDemoServiceFinanceEntry,
    createServiceFinanceSeed, getServiceAppointmentStatusMeta, normalizeServiceAppointment,
    normalizeServiceAppointmentsList, isDemoServiceAppointment, createServiceAppointmentsSeed,
    normalizeServiceRequestStatusId, getServiceRequestStatusMeta,
    mapRepairStatusToServiceRequestStatus, normalizeServiceRequest,
    normalizeServiceRequestsList, parseClockMinutes, formatClockMinutes,
    addMinutesToClock, getFutureLocalISODate, getServiceBoxesCount,
    parseServiceWorkingHoursRange, buildServiceBookingSlotOptions, buildServiceScheduleSlots,
    pickServiceBookingBox, createServiceVehicleSnapshot, upsertServiceClientFromBooking,
    createServiceOrderCode, countServiceVehicles, buildServiceDashboardStats,
    buildServiceFinanceSummary, dedupeServicesById, clampServiceMetric,
    normalizeServiceBrands, estimateServiceDurationMinutes, formatServiceAverageTime,
    getServicePrimaryBadges, decorateServiceRecord, getPersonalizedServices,
    getServiceImageRenderKey, buildBuyerServiceNotifications, createCatalogServiceFromCenter,
    mergeServiceCenterList, buildServiceDirectoryData
  });
})();
