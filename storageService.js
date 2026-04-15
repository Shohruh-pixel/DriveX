(() => {
  const KEY = "serviceHistory";

  function safeParse(json, fallback = []) {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeRecord(value = {}) {
    if (!value || typeof value !== "object") return null;
    const now = Date.now();
    const idRaw = value.id || now;
    const id = typeof idRaw === "string" || typeof idRaw === "number" ? String(idRaw) : String(now);
    const date =
      typeof value.date === "string" && value.date.length >= 10 ? value.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const mileageNum = Number.isFinite(Number(value.mileage)) ? Math.max(0, Math.floor(Number(value.mileage))) : null;
    const priceNum = Number.isFinite(Number(value.price)) ? Math.max(0, Math.floor(Number(value.price))) : 0;
    const nextServiceAt = Number.isFinite(Number(value.nextServiceAt))
      ? Math.max(0, Math.floor(Number(value.nextServiceAt)))
      : null;

    return {
      id,
      carId: typeof value.carId === "string" ? value.carId : "",
      serviceName: typeof value.serviceName === "string" ? value.serviceName : "Сервис",
      category: typeof value.category === "string" ? value.category : "Обслуживание",
      date,
      mileage: mileageNum,
      price: priceNum,
      description: typeof value.description === "string" ? value.description : "",
      source: value.source === "service_booking" ? "service_booking" : "manual",
      nextServiceAt
    };
  }

  function readHistory() {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(KEY);
    const parsed = safeParse(raw, []);
    return parsed.map(normalizeRecord).filter(Boolean);
  }

  function writeHistory(list) {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      // ignore write errors
    }
  }

  function getHistory() {
    return readHistory();
  }

  function saveRecord(record) {
    const normalized = normalizeRecord(record);
    if (!normalized) return null;
    const current = readHistory();
    const next = [normalized, ...current.filter((r) => r.id !== normalized.id)].slice(0, 500);
    writeHistory(next);
    return normalized;
  }

  function getByCar(carId) {
    const safeId = typeof carId === "string" ? carId : "";
    return readHistory().filter((r) => r.carId === safeId);
  }

  window.DrivexStorageService = {
    getHistory,
    saveRecord,
    getByCar
  };
})();
