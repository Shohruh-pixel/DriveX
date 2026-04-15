"use strict";

const { INTENTS, URGENCY } = require("./ai.types");

const explicitIntents = new Set(Object.values(INTENTS));

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function includesAny(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

function countMatches(text, keywords) {
  const normalized = normalizeText(text);
  const words = new Set(tokens(normalized));
  return keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) return score;
    if (normalizedKeyword.length <= 2) return score + (words.has(normalizedKeyword) ? 1 : 0);
    return score + (normalized.includes(normalizedKeyword) ? 1 : 0);
  }, 0);
}

const dangerousKeywords = [
  "тормоз",
  "тормоза",
  "плохо тормозит",
  "дым",
  "черный дым",
  "белый дым",
  "густой дым",
  "запах гари",
  "горит",
  "перегрев",
  "греется",
  "кипит",
  "потеря тяги",
  "руль заклинил",
  "течь топлива",
  "запах бензина"
];

const termQuestionKeywords = [
  "что такое",
  "для чего",
  "зачем",
  "зачем нужен",
  "зачем нужна",
  "для чего нужен",
  "для чего нужна",
  "что значит",
  "объясни",
  "объяснить",
  "мастер сказал",
  "нужно ли менять",
  "нормальная цена",
  "цена нормальная",
  "это дорого",
  "сколько стоит"
];

const serviceKeywords = [
  "найди сервис",
  "сервис рядом",
  "сто рядом",
  "где заменить",
  "где поменять",
  "кто делает",
  "шиномонтаж",
  "на карте",
  "подобрать сервис",
  "найди сто",
  "где диагностика"
];

const maintenanceKeywords = [
  "когда менять",
  "что скоро обслужить",
  "что обслужить",
  "что проверить",
  "по пробегу",
  "обслуживание",
  "техосмотр",
  "плановое то",
  "регламент",
  "пора менять",
  "замена масла",
  "заменить масло"
];

const diagnosticKeywords = [
  "не заводится",
  "не запускается",
  "не схватывает",
  "стук",
  "стучит",
  "скрип",
  "звук",
  "звуки",
  "выходит звук",
  "дым",
  "греется",
  "перегрев",
  "температура",
  "кипит",
  "вибрация",
  "троит",
  "жрет бензин",
  "расход топлива",
  "течь масла",
  "запах гари",
  "шум",
  "гул",
  "дергается",
  "пинается",
  "плохо тормозит",
  "горит чек",
  "check engine",
  "аккумулятор сел",
  "стартер крутит",
  "тупит",
  "плохо едет",
  "плохо работает",
  "не очень работает",
  "не держат",
  "плохо держат",
  "течет",
  "течёт",
  "не тот",
  "плохие"
];

const componentKeywords = [
  "амортизатор",
  "свеча",
  "свечи",
  "сайлентблок",
  "радиатор",
  "термостат",
  "форсунка",
  "катушка",
  "тормоза",
  "колодки",
  "колодка",
  "колотка",
  "калодка",
  "задние колодки",
  "аккумулятор",
  "генератор",
  "коробка",
  "ремень",
  "грм"
];

const componentProblemKeywords = [
  "не работает",
  "плохо работает",
  "не очень",
  "уже не тот",
  "плохие",
  "плохая",
  "плохой",
  "не держит",
  "не держат",
  "течет",
  "течёт",
  "тупит",
  "пинает",
  "шумит",
  "стучит"
];

const vagueKeywords = [
  "как-то",
  "что-то",
  "странно",
  "не так",
  "непонятно",
  "плохо работает",
  "непонятно работает"
];

const greetingKeywords = [
  "привет",
  "салам",
  "здравствуй",
  "здравствуйте",
  "добрый день",
  "доброе утро",
  "добрый вечер",
  "hello",
  "hi"
];

function classifyIntent(message, scenario) {
  const normalizedMessage = normalizeText(message);
  const explicit = normalizeText(scenario);
  const explicitIntent = explicitIntents.has(explicit) ? explicit : "";

  if (!normalizedMessage) {
    return {
      intent: explicitIntent || INTENTS.UNKNOWN,
      confidence: explicitIntent ? 0.9 : 0.2,
      normalizedMessage,
      risk: URGENCY.MEDIUM
    };
  }

  if (includesAny(normalizedMessage, greetingKeywords) && tokens(normalizedMessage).length <= 3) {
    return buildResult(INTENTS.UNKNOWN, 0.88, normalizedMessage, "greeting");
  }

  const scores = {
    [INTENTS.EXPLAIN_SERVICE]: countMatches(normalizedMessage, termQuestionKeywords),
    [INTENTS.FIND_SERVICE]: countMatches(normalizedMessage, serviceKeywords),
    [INTENTS.MAINTENANCE]: countMatches(normalizedMessage, maintenanceKeywords),
    [INTENTS.DIAGNOSTIC]: countMatches(normalizedMessage, diagnosticKeywords),
    [INTENTS.UNKNOWN]: countMatches(normalizedMessage, vagueKeywords)
  };

  // Term/explanation questions have absolute priority over diagnostic words.
  // Example: "для чего нужна свеча" must explain the part, not diagnose ignition.
  if (scores[INTENTS.EXPLAIN_SERVICE] > 0) {
    return buildResult(INTENTS.EXPLAIN_SERVICE, 0.92, normalizedMessage);
  }

  if (scores[INTENTS.FIND_SERVICE] > 0) return buildResult(INTENTS.FIND_SERVICE, 0.9, normalizedMessage);

  // "где заменить масло" is service intent, but "когда менять масло" is maintenance.
  if (scores[INTENTS.MAINTENANCE] > 0) return buildResult(INTENTS.MAINTENANCE, 0.86, normalizedMessage);
  if (includesAny(normalizedMessage, componentKeywords) && includesAny(normalizedMessage, componentProblemKeywords)) {
    return buildResult(INTENTS.DIAGNOSTIC, 0.78, normalizedMessage);
  }
  if (scores[INTENTS.DIAGNOSTIC] > 0) return buildResult(INTENTS.DIAGNOSTIC, 0.84, normalizedMessage);

  if (explicitIntent && explicitIntent !== INTENTS.DIAGNOSTIC) {
    return buildResult(explicitIntent, 0.72, normalizedMessage);
  }

  if (scores[INTENTS.UNKNOWN] > 0 || tokens(normalizedMessage).length <= 2) {
    return buildResult(INTENTS.UNKNOWN, 0.55, normalizedMessage);
  }

  return buildResult(INTENTS.UNKNOWN, 0.45, normalizedMessage);
}

function buildResult(intent, confidence, normalizedMessage, subtype = "") {
  return {
    intent,
    confidence,
    normalizedMessage,
    subtype,
    risk: includesAny(normalizedMessage, dangerousKeywords) ? URGENCY.HIGH : URGENCY.MEDIUM
  };
}

module.exports = {
  classifyIntent,
  normalizeText,
  includesAny,
  tokens
};
