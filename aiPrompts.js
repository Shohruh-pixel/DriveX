(() => {
  const scenarioTemplates = {
    diagnostic: {
      title: "Диагностика по симптомам",
      system: [
        "Ты AI помощник DriveX для автомобильного приложения.",
        "Пользователь описывает симптомы машины.",
        "Нельзя утверждать точный диагноз. Используй формулировки: возможные причины, может быть связано.",
        "Если есть опасные симптомы: тормоза, перегрев, запах гари, густой дым, повышай urgency до high.",
        "Верни только JSON под контракт DriveX."
      ].join(" ")
    },
    explain_service: {
      title: "Объяснение слов мастера",
      system: [
        "Ты объясняешь слова мастера простым языком.",
        "Не выдумывай цены и не утверждай стоимость как факт.",
        "Объясни, что значит фраза, насколько срочно, что уточнить у сервиса.",
        "Верни только JSON под контракт DriveX."
      ].join(" ")
    },
    maintenance: {
      title: "Подсказка по обслуживанию",
      system: [
        "Ты анализируешь пробег, год машины и историю обслуживания.",
        "Сформируй короткий action plan: что скоро проверить и почему.",
        "Не делай точных утверждений без данных, рекомендуй очную диагностику при сомнениях.",
        "Верни только JSON под контракт DriveX."
      ].join(" ")
    },
    find_service: {
      title: "Подбор сервиса",
      system: [
        "Ты определяешь тип сервиса, который нужен пользователю.",
        "Не придумывай конкретные станции, если база сервисов не передана.",
        "Верни рекомендацию для UI слоя: какой тип сервиса искать и почему.",
        "Верни только JSON под контракт DriveX."
      ].join(" ")
    }
  };

  const responseContract = {
    title: "string",
    summary: "string",
    causes: ["string"],
    actions: ["string"],
    urgency: "low | medium | high",
    recommendation: "string",
    cta: [
      { type: "find_service", label: "Найти сервис" },
      { type: "map", label: "Показать на карте" },
      { type: "save", label: "Сохранить" }
    ]
  };

  function buildPrompt(input = {}) {
    const scenario = scenarioTemplates[input.scenarioType] || scenarioTemplates.diagnostic;
    const vehicle = input.vehicle || {};
    const location = input.location || {};

    return {
      scenarioTitle: scenario.title,
      system: scenario.system,
      user: {
        message: input.userMessage || "",
        scenarioType: input.scenarioType || "diagnostic",
        locale: input.locale || "ru-RU",
        vehicle: {
          make: vehicle.make || "",
          model: vehicle.model || "",
          year: vehicle.year || "",
          mileage: vehicle.mileage || "",
          fuelType: vehicle.fuelType || ""
        },
        location: {
          city: location.city || "Худжанд",
          district: location.district || "",
          coordinates: location.coordinates || null
        },
        serviceHistorySummary: input.serviceHistorySummary || "",
        expectedResponseContract: responseContract
      }
    };
  }

  window.DrivexAIPrompts = {
    buildPrompt,
    scenarioTemplates,
    responseContract
  };
})();
