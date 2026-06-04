// app/models/buyer.js — Buyer/garage model functions
(() => {
  'use strict';
  const DX = window.DX;
  const { genId } = DX;
  const { parseISODate } = DX;
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

  // Export to DX namespace
  DX.normalizeGarageCar = normalizeGarageCar;
  DX.normalizeGarageList = normalizeGarageList;
  DX.normalizeSavedPlace = normalizeSavedPlace;
  DX.normalizeSavedPlacesList = normalizeSavedPlacesList;
  DX.normalizeMaintenanceRecord = normalizeMaintenanceRecord;
  DX.normalizeInspection = normalizeInspection;
  DX.isImageDataUrl = isImageDataUrl;
  DX.normalizeDocumentItem = normalizeDocumentItem;
  DX.createEmptyDocumentsState = createEmptyDocumentsState;
  DX.countDocumentsState = countDocumentsState;
  DX.createEmptyMaintenanceState = createEmptyMaintenanceState;
  DX.findGarageCar = findGarageCar;
  DX.ensureCarId = ensureCarId;
})();
