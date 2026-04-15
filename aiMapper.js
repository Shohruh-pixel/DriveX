(() => {
  const defaultCta = [
    { type: "find_service", label: "Найти сервис" },
    { type: "map", label: "Показать на карте" },
    { type: "save", label: "Сохранить" }
  ];

  const urgencyTextMap = {
    low: "Низкая. Можно спокойно запланировать проверку.",
    medium: "Средняя. Лучше не откладывать, особенно если симптом повторяется.",
    high: "Высокая. Рекомендуется очная диагностика в сервисе как можно скорее."
  };

  function asArray(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
  }

  function normalizeCta(value) {
    if (Array.isArray(value) && value.length) return value;
    if (value && typeof value === "object") {
      const mapped = [value.primary, value.secondary]
        .filter(Boolean)
        .map((item) => ({
          type: item.type || item.action || "action",
          label: item.label || "Открыть"
        }));
      if (mapped.length) return mapped;
    }
    return defaultCta;
  }

  function normalizeIntent(value, fallback = "clarify") {
    const raw = String(value || "").toLowerCase();
    if (["diagnostic", "explain_service", "maintenance", "find_service", "clarify"].includes(raw)) return raw;
    if (raw === "unknown") return "clarify";
    return fallback === "unknown" ? "clarify" : fallback;
  }

  function normalizeUrgency(value, input = {}) {
    const raw = String(value || "").toLowerCase();
    if (["low", "medium", "high"].includes(raw)) return raw;

    const text = `${input.userMessage || ""} ${input.summary || ""}`.toLowerCase();
    if (/тормоз|перегрев|гар[ьи]|дым|горит|теч[ье]|запах/.test(text)) return "high";
    if (/стук|не завод|стартер|аккумулятор|подвес/.test(text)) return "medium";
    return "low";
  }

  function safeResponse(input = {}, reason = "") {
    const urgency = normalizeUrgency("", input);
    return toDriveXResponse({
      title: "Нужна очная диагностика",
      summary: reason || "Не удалось надежно разобрать ответ AI. Лучше проверить машину в сервисе.",
      causes: ["симптом может быть связан с несколькими узлами", "по описанию нельзя поставить точный диагноз"],
      actions: ["не продолжайте поездку при опасных симптомах", "запишитесь на диагностику", "сохраните описание проблемы для мастера"],
      urgency,
      recommendation: "Рекомендуется очная диагностика в сервисе",
      cta: defaultCta
    }, input);
  }

  function toDriveXResponse(raw = {}, input = {}) {
    const causes = asArray(raw.causes || raw.possibleCauses);
    const actions = asArray(raw.actions || raw.nextSteps);
    const intent = normalizeIntent(raw.intent, input.scenarioType || "clarify");
    const urgency = normalizeUrgency(raw.urgency, {
      ...input,
      summary: raw.summary
    });
    const cta = normalizeCta(raw.cta);
    const suggestions = asArray(raw.suggestions);
    const sourcesUsed = asArray(raw.sourcesUsed);

    return {
      intent,
      title: String(raw.title || "AI рекомендация DriveX").trim(),
      summary: String(raw.summary || "AI подготовил предварительную рекомендацию по описанию.").trim(),
      causes,
      actions,
      urgency,
      urgencyText: raw.urgencyText || urgencyTextMap[urgency],
      recommendation: String(raw.recommendation || "Рекомендуется очная диагностика в сервисе").trim(),
      cta,
      sections: [
        {
          title: raw.causesTitle || (intent === "clarify" ? "Чем могу помочь" : "Возможные причины"),
          items: causes.length ? causes : intent === "clarify" ? ["Опиши вопрос про машину простыми словами"] : ["требуется дополнительная диагностика"]
        },
        {
          title: raw.actionsTitle || (intent === "clarify" ? "Что написать дальше" : "Что делать сейчас"),
          items: actions.length ? actions : intent === "clarify" ? ["Напиши симптом, термин или нужный сервис"] : ["описать симптом подробнее", "обратиться в сервис при повторении"]
        }
      ],
      recommendationLabel: cta[0]?.label || "Найти сервис",
      suggestions,
      sourcesUsed,
      services: Array.isArray(raw.services) ? raw.services : [],
      raw
    };
  }

  function parseJsonFromText(text) {
    if (!text || typeof text !== "string") return null;
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
  }

  function mapApiResponse(payload, input = {}) {
    if (!payload) return safeResponse(input, "AI API не вернул данные.");

    if (payload.title || payload.summary || payload.causes || payload.actions) {
      return toDriveXResponse(payload, input);
    }

    const content =
      payload.content ||
      payload.text ||
      payload.message ||
      payload.choices?.[0]?.message?.content ||
      payload.choices?.[0]?.text ||
      "";
    const parsed = parseJsonFromText(content);

    if (parsed) return toDriveXResponse(parsed, input);

    if (content) {
      return toDriveXResponse({
        title: "AI рекомендация DriveX",
        summary: String(content).slice(0, 700),
        causes: ["AI вернул текстовый ответ без структуры"],
        actions: ["уточнить детали симптома", "при повторении обратиться в сервис"],
        urgency: "medium",
        recommendation: "Рекомендуется очная диагностика в сервисе"
      }, input);
    }

    return safeResponse(input, "Не удалось получить понятный ответ AI.");
  }

  window.DrivexAIMapper = {
    defaultCta,
    urgencyTextMap,
    toDriveXResponse,
    mapApiResponse,
    safeResponse
  };
})();
