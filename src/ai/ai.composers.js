"use strict";

const { DEFAULT_CTA, PARTS_CTA, CLARIFY_CTA, INTENTS, URGENCY } = require("./ai.types");
const { getFallbackSuggestions } = require("./ai.tools");

function responseBase(intent, payload) {
  return {
    intent,
    label: "AI ANALYSIS",
    title: payload.title,
    summary: payload.summary,
    causes: payload.causes || [],
    actions: payload.actions || [],
    causesTitle: payload.causesTitle || "",
    actionsTitle: payload.actionsTitle || "",
    urgency: payload.urgency || URGENCY.MEDIUM,
    recommendation: payload.recommendation || "Если симптом повторяется, лучше пройти очную диагностику.",
    cta: payload.cta || DEFAULT_CTA,
    suggestions: payload.suggestions || getFallbackSuggestions(intent),
    sourcesUsed: payload.sourcesUsed || ["fallback"],
    services: payload.services || []
  };
}

function hasPartsContext(record = {}) {
  const text = [
    record.topic,
    record.title,
    record.summary,
    record.term,
    ...(record.causes || []),
    ...(record.keywords || []),
    ...(record.tags || [])
  ].join(" ").toLowerCase();
  return /свеч|колод|амортиз|радиатор|термостат|форсунк|катушк|аккумулятор|генератор|ремень|грм|сайлент|подшипник|диск|суппорт|запчаст|детал/.test(text);
}

function composeGreetingResponse(context = {}) {
  return responseBase(INTENTS.UNKNOWN, {
    title: "Привет, я AI Assist DriveX",
    summary: "Помогу понять симптом, объяснить слова мастера, подсказать обслуживание или подобрать сервис рядом.",
    causesTitle: "Что можно спросить",
    actionsTitle: "Попробуй так",
    causes: [
      "Что значит деталь или термин",
      "Почему машина ведёт себя странно",
      "Что скоро проверить по пробегу"
    ],
    actions: [
      "Напиши симптом простыми словами",
      "Вставь фразу мастера из сервиса",
      "Спроси, где лучше сделать нужную работу"
    ],
    urgency: URGENCY.LOW,
    recommendation: "Например: “машина тупит после заправки” или “для чего нужна свеча”.",
    cta: CLARIFY_CTA,
    sourcesUsed: ["fallback"],
    suggestions: ["Для чего нужна свеча?", "Машина тупит", "Что скоро обслужить?"],
    services: context.retrieval?.services || []
  });
}

function composeExplainResponse(glossaryMatches = [], context = {}) {
  const term = glossaryMatches[0];
  if (!term) return composeExplainFallback(context);

  const symptoms = Array.isArray(term.symptomsIfBad) && term.symptomsIfBad.length
    ? term.symptomsIfBad
    : term.whyImportant
      ? [term.whyImportant]
      : [];

  return responseBase(INTENTS.EXPLAIN_SERVICE, {
    title: term.term || "Автомобильный термин",
    summary: term.simpleExplanation || "Это автомобильная деталь или узел, который стоит понимать перед ремонтом.",
    causes: symptoms,
    actions: [
      `Проверить ${term.term || "деталь"} при похожих симптомах`,
      "Попросить мастера показать состояние детали",
      "Не менять деталь без диагностики, если симптомов нет"
    ],
    urgency: term.urgency || URGENCY.LOW,
    recommendation: term.whyImportant || "Если есть симптомы, лучше подтвердить проблему диагностикой.",
    cta: PARTS_CTA,
    sourcesUsed: ["glossary"],
    services: context.retrieval?.services || []
  });
}

function composeDiagnosticResponse(symptomMatches = [], context = {}) {
  const symptom = symptomMatches[0];
  if (!symptom && context.retrieval?.glossary?.length) return composeComponentIssueResponse(context.retrieval.glossary, context);
  if (!symptom) return composeClarifyResponse(context);

  const high = context.classification?.risk === URGENCY.HIGH || symptom.urgency === URGENCY.HIGH;
  return responseBase(INTENTS.DIAGNOSTIC, {
    title: symptom.title || symptom.topic || "Возможная проблема",
    summary: symptom.summary || "Симптом может быть связан с несколькими узлами автомобиля.",
    causes: symptom.causes || ["Нужна диагностика по симптомам"],
    actions: symptom.actions || ["Опиши симптом подробнее", "Запишись на диагностику"],
    urgency: high ? URGENCY.HIGH : symptom.urgency || URGENCY.MEDIUM,
    recommendation: high
      ? "Лучше не продолжать поездку при опасных симптомах и обратиться в сервис."
      : "Если симптом повторяется, лучше проверить машину в сервисе.",
    cta: hasPartsContext(symptom) ? PARTS_CTA : DEFAULT_CTA,
    sourcesUsed: ["symptoms"],
    services: context.retrieval?.services || []
  });
}

function composeComponentIssueResponse(glossaryMatches = [], context = {}) {
  const term = glossaryMatches[0];
  return responseBase(INTENTS.DIAGNOSTIC, {
    title: `${term.term || "Деталь"}: возможная проблема`,
    summary: `${term.simpleExplanation || "Это автомобильный узел."} Если кажется, что деталь работает хуже обычного, лучше проверить её состояние вместе со связанными узлами.`,
    causes: [
      term.whyImportant || "Износ детали может ухудшить комфорт или безопасность.",
      ...(term.symptomsIfBad || []).slice(0, 3)
    ].filter(Boolean),
    actions: [
      "Опиши, как именно проявляется проблема: стук, шум, вибрация, течь или поведение на дороге",
      "Не менять деталь без осмотра и диагностики",
      "Проверить связанный узел в сервисе"
    ],
    urgency: term.urgency || URGENCY.MEDIUM,
    recommendation: "Если симптом повторяется, лучше пройти диагностику именно этого узла.",
    cta: PARTS_CTA,
    sourcesUsed: ["glossary"],
    services: context.retrieval?.services || []
  });
}

function composeMaintenanceResponse(rules = [], vehicle = {}, context = {}) {
  const selected = rules.length ? rules.slice(0, 4) : [];
  if (!selected.length) {
    return responseBase(INTENTS.MAINTENANCE, {
      title: "План обслуживания",
      summary: `По пробегу ${vehicle.mileage || 0} км стоит проверить базовые расходники.`,
      causes: ["Масло двигателя", "Фильтры", "Тормоза"],
      actions: ["Проверить дату последнего ТО", "Сравнить пробег с регламентом", "Запланировать диагностику"],
      urgency: URGENCY.MEDIUM,
      recommendation: "Начни с масла, фильтров и тормозов.",
      sourcesUsed: ["fallback"]
    });
  }

  return responseBase(INTENTS.MAINTENANCE, {
    title: "Что скоро нужно обслужить",
    summary: `Я проверил пробег ${vehicle.mileage || 0} км и базовые интервалы обслуживания.`,
    causes: selected.map((rule) => rule.label || rule.item),
    actions: selected.map((rule) => rule.advice || `Проверить ${rule.label || rule.item}`),
    urgency: URGENCY.MEDIUM,
    recommendation: "Лучше закрывать регламентные работы до появления симптомов.",
    sourcesUsed: ["maintenance"],
    services: context.retrieval?.services || []
  });
}

function composeServiceResponse(services = [], context = {}) {
  if (!services.length) {
    return responseBase(INTENTS.FIND_SERVICE, {
      title: "Подбор сервиса",
      summary: "Я не нашёл точного совпадения в локальной базе, но могу помочь выбрать тип сервиса.",
      causes: ["Нужен сервис по диагностике или обслуживанию"],
      actions: ["Уточни район", "Опиши работу: масло, ходовая, тормоза или диагностика", "Открой карту сервисов"],
      urgency: URGENCY.LOW,
      recommendation: "Лучше выбирать сервис по специализации, а не только по цене.",
      sourcesUsed: ["fallback"],
      cta: DEFAULT_CTA
    });
  }

  return responseBase(INTENTS.FIND_SERVICE, {
    title: "Подходящий сервис рядом",
    summary: "По запросу подобраны сервисы DriveX с релевантными специализациями.",
    causes: services.map((service) => `${service.title} · рейтинг ${service.rating}`),
    actions: ["Сравнить рейтинг и специализацию", "Открыть на карте", "Уточнить время записи"],
    urgency: URGENCY.LOW,
    recommendation: "Выбирай сервис, который специализируется именно на нужной работе.",
    sourcesUsed: ["services"],
    services
  });
}

function composeExplainFallback(context = {}) {
  return responseBase(INTENTS.EXPLAIN_SERVICE, {
    title: "Уточни термин",
    summary: "Я понял, что ты хочешь объяснение детали или слов мастера, но не нашёл точный термин в базе.",
    causes: [],
    actions: ["Напиши название детали одним словом", "Можно вставить фразу мастера полностью", "Если есть цена, укажи работу и сумму"],
    urgency: URGENCY.LOW,
    recommendation: "Например: “что такое сайлентблок” или “для чего нужна свеча”.",
    cta: CLARIFY_CTA,
    sourcesUsed: ["fallback"],
    suggestions: getFallbackSuggestions(INTENTS.EXPLAIN_SERVICE),
    services: context.retrieval?.services || []
  });
}

function composeClarifyResponse(context = {}) {
  if (context.classification?.subtype === "greeting") return composeGreetingResponse(context);

  return responseBase(INTENTS.UNKNOWN, {
    title: "Нужно уточнить проблему",
    summary: "Я могу помочь, но по одному сообщению тема пока неясна.",
    causes: ["Это может быть вопрос о симптоме, детали, обслуживании или подборе сервиса."],
    actions: [
      "Уточни, что именно происходит: звук, запах, вибрация, дым или ошибка на панели.",
      "Если спрашиваешь про деталь, напиши: “что такое ...” или “для чего нужен ...”.",
      "Если нужен сервис, напиши район и тип работы."
    ],
    urgency: context.classification?.risk === URGENCY.HIGH ? URGENCY.HIGH : URGENCY.MEDIUM,
    recommendation: "Выбери ближайший сценарий или опиши вопрос подробнее.",
    cta: CLARIFY_CTA,
    causesTitle: "Что это может быть",
    actionsTitle: "Что написать дальше",
    sourcesUsed: ["fallback"],
    suggestions: getFallbackSuggestions(INTENTS.UNKNOWN),
    services: context.retrieval?.services || []
  });
}

function composeLocalResponse(context) {
  const { classification, retrieval, vehicle } = context;
  if (classification.intent === INTENTS.EXPLAIN_SERVICE) return composeExplainResponse(retrieval.glossary, context);
  if (classification.intent === INTENTS.DIAGNOSTIC) return composeDiagnosticResponse(retrieval.symptoms, context);
  if (classification.intent === INTENTS.MAINTENANCE) return composeMaintenanceResponse(retrieval.maintenance, vehicle, context);
  if (classification.intent === INTENTS.FIND_SERVICE) return composeServiceResponse(retrieval.services, context);
  return composeClarifyResponse(context);
}

module.exports = {
  composeLocalResponse,
  composeExplainResponse,
  composeDiagnosticResponse,
  composeMaintenanceResponse,
  composeServiceResponse,
  composeComponentIssueResponse,
  composeGreetingResponse,
  composeClarifyResponse
};
