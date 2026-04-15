"use strict";

const INTENTS = Object.freeze({
  DIAGNOSTIC: "diagnostic",
  EXPLAIN_SERVICE: "explain_service",
  MAINTENANCE: "maintenance",
  FIND_SERVICE: "find_service",
  UNKNOWN: "clarify"
});

const URGENCY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
});

const DEFAULT_CTA = Object.freeze({
  primary: { label: "Найти сервис", action: "find_service" },
  secondary: { label: "Показать на карте", action: "show_map" }
});

const PARTS_CTA = Object.freeze({
  primary: { label: "Найти сервис", action: "find_service" },
  secondary: { label: "Найти запчасть", action: "find_part" }
});

const CLARIFY_CTA = Object.freeze({
  primary: { label: "Уточнить симптом", action: "clarify" },
  secondary: { label: "Найти сервис", action: "find_service" }
});

module.exports = {
  INTENTS,
  URGENCY,
  DEFAULT_CTA,
  PARTS_CTA,
  CLARIFY_CTA
};
