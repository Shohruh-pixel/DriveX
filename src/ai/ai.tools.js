"use strict";

const path = require("path");
const { INTENTS } = require("./ai.types");
const { normalizeText, tokens } = require("./ai.classifier");
const { searchServices } = require("../services/services.repository");

const symptoms = require(path.join("..", "knowledge", "symptoms.json"));
const glossary = require(path.join("..", "knowledge", "glossary.json"));
const maintenanceRules = require(path.join("..", "knowledge", "maintenance-rules.json"));

const aliasMap = {
  свеча: ["свеча", "свечи", "свеча зажигания", "свечи зажигания"],
  сайлентблок: ["сайлентблок", "сайлент блок"],
  амортизатор: ["амортизатор", "стойка"],
  греется: ["греется", "перегрев", "температура", "кипит"],
  ходовая: ["ходовая", "подвеска"],
  масло: ["масло", "замена масла", "поменять масло"],
  тормоза: ["тормоза", "тормоз", "колодки", "колодка", "колотка", "калодка", "задние колодки", "звук тормозов", "abs"],
  колотка: ["колотка", "колодка", "колодки", "задние колодки", "звук задних колодок", "скрип задних колодок"],
  калодка: ["калодка", "колодка", "колодки", "задние колодки", "звук задних колодок"],
  аккумулятор: ["аккумулятор", "акб", "батарея"]
};

function expandQuery(query) {
  const normalized = normalizeText(query);
  const aliases = [];
  for (const [key, values] of Object.entries(aliasMap)) {
    if (normalized.includes(key) || values.some((value) => normalized.includes(normalizeText(value)))) {
      aliases.push(...values);
    }
  }
  return [normalized, ...aliases].join(" ");
}

function recordText(record) {
  return normalizeText([
    record.topic,
    record.term,
    record.label,
    record.title,
    record.summary,
    record.simpleExplanation,
    record.whyImportant,
    ...(record.symptomsIfBad || []),
    ...(record.keywords || []),
    ...(record.tags || [])
  ].join(" "));
}

function scoreRecord(record, query) {
  const expanded = expandQuery(query);
  const searchable = recordText(record);
  let score = 0;

  for (const keyword of record.keywords || []) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;
    if (expanded.includes(normalizedKeyword)) score += 20;
    if (normalizedKeyword.includes(expanded) && expanded.length > 3) score += 10;
  }

  for (const token of tokens(expanded)) {
    if (token.length <= 2) continue;
    if (searchable.includes(token)) score += 3;
  }

  const term = normalizeText(record.term || record.topic || record.label || "");
  if (term && expanded.includes(term)) score += 30;

  return score;
}

function searchCollection(collection, query, limit = 4, minScore = 3) {
  return collection
    .map((item) => ({ ...item, score: scoreRecord(item, query) }))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function searchSymptoms(query, options = {}) {
  return searchCollection(symptoms, query, options.limit || 4, options.minScore || 6);
}

function searchGlossary(query, options = {}) {
  return searchCollection(glossary, query, options.limit || 5, options.minScore || 5);
}

function searchMaintenance(vehicle, query, options = {}) {
  const mileage = Number(vehicle?.mileage) || 0;
  const direct = searchCollection(maintenanceRules, query, options.limit || 6, 3);
  const maintenanceQuery = /когда|менять|замен|обслуж|провер|пробег|то|регламент/.test(normalizeText(query));

  const dueByMileage = maintenanceRules
    .map((rule) => {
      const interval = Number(rule.recommendedMileageInterval) || 0;
      const remainder = interval ? mileage % interval : 0;
      const kmLeft = interval ? interval - remainder : null;
      return { ...rule, kmLeft, score: kmLeft !== null && kmLeft <= 1500 ? 8 : 2 };
    })
    .filter((rule) => maintenanceQuery || rule.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit || 6);

  const merged = [...direct, ...dueByMileage];
  return Array.from(new Map(merged.map((item) => [item.item, item])).values()).slice(0, options.limit || 6);
}

function findNearbyServices(query, location, context = {}) {
  const tags = [
    ...(context.symptoms || []).flatMap((item) => item.tags || []),
    ...(context.maintenance || []).flatMap((item) => item.tags || []),
    ...(context.glossary || []).flatMap((item) => item.tags || [])
  ];
  return searchServices(query, location, tags);
}

function sourcesUsedFrom(retrieval) {
  const sources = [];
  if (retrieval.glossary?.length) sources.push("glossary");
  if (retrieval.symptoms?.length) sources.push("symptoms");
  if (retrieval.maintenance?.length) sources.push("maintenance");
  if (retrieval.services?.length) sources.push("services");
  if (!sources.length) sources.push("fallback");
  return sources;
}

function searchByIntent(query, intent, vehicle, location) {
  const retrieval = { glossary: [], symptoms: [], maintenance: [], services: [], sourcesUsed: [] };

  if (intent === INTENTS.EXPLAIN_SERVICE) {
    retrieval.glossary = searchGlossary(query, { limit: 3, minScore: 4 });
    retrieval.services = findNearbyServices(query, location, { glossary: retrieval.glossary });
  } else if (intent === INTENTS.DIAGNOSTIC) {
    retrieval.symptoms = searchSymptoms(query, { limit: 3, minScore: 6 });
    retrieval.glossary = searchGlossary(query, { limit: 2, minScore: 12 });
    retrieval.services = findNearbyServices(query, location, { symptoms: retrieval.symptoms });
  } else if (intent === INTENTS.MAINTENANCE) {
    retrieval.maintenance = searchMaintenance(vehicle, query, { limit: 5 });
    retrieval.glossary = searchGlossary(query, { limit: 2, minScore: 12 });
    retrieval.services = findNearbyServices(query, location, { maintenance: retrieval.maintenance });
  } else if (intent === INTENTS.FIND_SERVICE) {
    retrieval.symptoms = searchSymptoms(query, { limit: 2, minScore: 10 });
    retrieval.maintenance = searchMaintenance(vehicle, query, { limit: 3 });
    retrieval.services = findNearbyServices(query, location, retrieval);
  }

  retrieval.sourcesUsed = sourcesUsedFrom(retrieval);
  return retrieval;
}

function searchKnowledgeBase(query, vehicle, location, intent = INTENTS.UNKNOWN) {
  return searchByIntent(query, intent, vehicle, location);
}

function searchLLMContext(query, vehicle, location, intentHint = INTENTS.UNKNOWN) {
  const glossaryMatches = searchGlossary(query, { limit: 6, minScore: 3 });
  const symptomMatches = searchSymptoms(query, { limit: 6, minScore: 4 });
  const maintenanceMatches = searchMaintenance(vehicle, query, { limit: 6 });
  const serviceMatches = findNearbyServices(query, location, {
    glossary: glossaryMatches,
    symptoms: symptomMatches,
    maintenance: maintenanceMatches
  });

  const retrieval = {
    intentHint,
    glossary: glossaryMatches,
    symptoms: symptomMatches,
    maintenance: maintenanceMatches,
    services: serviceMatches
  };
  retrieval.sourcesUsed = sourcesUsedFrom(retrieval);
  return retrieval;
}

function getFallbackSuggestions(intent) {
  const byIntent = {
    diagnostic: ["Не заводится утром", "Стук в подвеске", "Появился дым", "Машина троит"],
    explain_service: ["Для чего нужна свеча?", "Что такое сайлентблок?", "Нормальная ли цена?"],
    maintenance: ["Что скоро обслужить?", "Когда менять масло?", "Проверить по пробегу"],
    find_service: ["Где заменить масло?", "Найди диагностику", "Шиномонтаж рядом"],
    unknown: ["Не заводится утром", "Стук в подвеске", "Появился дым", "Жрет бензин"]
  };
  return byIntent[intent] || byIntent.unknown;
}

module.exports = {
  searchSymptoms,
  searchGlossary,
  searchMaintenance,
  findNearbyServices,
  searchByIntent,
  searchKnowledgeBase,
  searchLLMContext,
  getFallbackSuggestions
};
