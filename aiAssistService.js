(() => {
  function parseCarName(name = "") {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    return {
      make: parts[0] || "",
      model: parts.slice(1).join(" ") || ""
    };
  }

  function parseMileage(value = "") {
    const digits = String(value || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }

  function toVehicleContext(activeCar = {}) {
    const parsed = parseCarName(activeCar.name);
    return {
      make: activeCar.make || parsed.make,
      model: activeCar.model || parsed.model,
      year: activeCar.year || "",
      mileage: parseMileage(activeCar.mileage),
      mileageLabel: activeCar.mileage || "",
      fuelType: activeCar.fuelType || ""
    };
  }

  function summarizeMaintenance(maintenance) {
    if (!maintenance || typeof maintenance !== "object") return "";
    const cars = maintenance.cars && typeof maintenance.cars === "object" ? maintenance.cars : {};
    const records = Object.values(cars).flatMap((carState) => {
      return Array.isArray(carState?.records) ? carState.records : [];
    });

    if (!records.length) return "История обслуживания пока не заполнена.";

    const latest = records
      .slice()
      .sort((a, b) => (new Date(b.date || 0).getTime() || 0) - (new Date(a.date || 0).getTime() || 0))
      .slice(0, 5)
      .map((record) => `${record.date || "без даты"}: ${record.title || record.service || "обслуживание"}`)
      .join("; ");

    return latest;
  }

  function normalizeScenarioType(value) {
    const raw = String(value || "").trim();
    const map = {
      symptoms: "diagnostic",
      diagnostic: "diagnostic",
      explain: "explain_service",
      explain_service: "explain_service",
      "service-soon": "maintenance",
      maintenance: "maintenance",
      "nearby-service": "find_service",
      find_service: "find_service"
    };
    return map[raw] || "diagnostic";
  }

  function buildInput({
    userMessage = "",
    scenarioType = "diagnostic",
    activeCar,
    maintenance,
    location,
    locale = "ru-RU",
    serviceHistorySummary
  } = {}) {
    return {
      userMessage: String(userMessage || ""),
      scenarioType: normalizeScenarioType(scenarioType),
      vehicle: toVehicleContext(activeCar || {}),
      location: location || { city: "Худжанд" },
      serviceHistorySummary: serviceHistorySummary || summarizeMaintenance(maintenance),
      locale
    };
  }

  async function askDriveXAI(input = {}) {
    const provider = window.DrivexAIProvider;
    if (!provider || typeof provider.ask !== "function") {
      return window.DrivexAIMapper.safeResponse(input, "AI слой временно недоступен.");
    }
    return provider.ask(input);
  }

  function analyzeQuery(query, context = {}) {
    const provider = window.DrivexAIProvider;
    const input = buildInput({
      userMessage: query,
      scenarioType: context.scenarioType || "diagnostic",
      activeCar: context.activeCar,
      maintenance: context.maintenance,
      location: context.location,
      locale: context.locale
    });

    return provider && typeof provider.mockAsk === "function"
      ? provider.mockAsk(input)
      : window.DrivexAIMapper.safeResponse(input);
  }

  function runScenario(scenarioId, context = {}) {
    const input = buildInput({
      userMessage: context.userMessage || "",
      scenarioType: normalizeScenarioType(scenarioId),
      activeCar: context.activeCar,
      maintenance: context.maintenance,
      location: context.location,
      locale: context.locale
    });
    return askDriveXAI(input);
  }

  window.DrivexAIAssistService = {
    getMode() {
      return window.DrivexAIProvider?.getConfig?.().mode || "mock";
    },
    buildInput,
    askDriveXAI,
    analyzeQuery,
    runScenario,
    getPopularPrompts() {
      return window.DrivexAIProvider?.getPopularPrompts?.() || [];
    },
    getQuickScenarios() {
      return window.DrivexAIProvider?.getQuickScenarios?.() || [];
    }
  };
})();
