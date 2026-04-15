"use strict";

const { DEFAULT_CTA, URGENCY } = require("./ai.types");

function asArray(value, fallback) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String).slice(0, 6);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return fallback;
}

function normalizeUrgency(value, fallback = URGENCY.MEDIUM) {
  const text = String(value || "").toLowerCase();
  if (["low", "medium", "high"].includes(text)) return text;
  if (/низ|low/.test(text)) return URGENCY.LOW;
  if (/выс|сроч|опас|high/.test(text)) return URGENCY.HIGH;
  return fallback;
}

function normalizeIntent(value, fallback = "clarify") {
  const text = String(value || "").toLowerCase();
  if (["diagnostic", "explain_service", "maintenance", "find_service", "clarify"].includes(text)) return text;
  if (text === "unknown") return "clarify";
  return fallback === "unknown" ? "clarify" : fallback;
}

function normalizeCta(value) {
  return {
    primary: {
      label: value?.primary?.label || DEFAULT_CTA.primary.label,
      action: value?.primary?.action || DEFAULT_CTA.primary.action
    },
    secondary: {
      label: value?.secondary?.label || DEFAULT_CTA.secondary.label,
      action: value?.secondary?.action || DEFAULT_CTA.secondary.action
    }
  };
}

function mapToUiResponse(candidate = {}, fallback = {}) {
  const looseSummary = candidate.summary || candidate.answer || candidate.text || candidate.message || "";
  return {
    intent: normalizeIntent(candidate.intent, fallback.intent || "clarify"),
    label: candidate.label || "AI ANALYSIS",
    title: candidate.title || fallback.title || "AI Assist",
    summary: looseSummary || fallback.summary || "Я подготовил безопасный следующий шаг по вашему запросу.",
    causes: asArray(candidate.causes, fallback.causes || ["Возможны несколько причин, нужна уточняющая диагностика."]),
    actions: asArray(candidate.actions, fallback.actions || ["Опишите симптом подробнее", "При повторении лучше обратиться в сервис"]),
    urgency: normalizeUrgency(candidate.urgency, fallback.urgency || URGENCY.MEDIUM),
    recommendation: candidate.recommendation || fallback.recommendation || "Рекомендуется очная диагностика в сервисе.",
    causesTitle: candidate.causesTitle || fallback.causesTitle || "",
    actionsTitle: candidate.actionsTitle || fallback.actionsTitle || "",
    cta: normalizeCta(candidate.cta || fallback.cta),
    suggestions: asArray(candidate.suggestions, fallback.suggestions || ["Не заводится", "Стук в подвеске", "Что скоро обслужить?"]).slice(0, 5),
    sourcesUsed: asArray(candidate.sourcesUsed, fallback.sourcesUsed || []),
    services: Array.isArray(candidate.services) ? candidate.services.slice(0, 3) : fallback.services || []
  };
}

function parseModelResponse(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;

  const text = String(raw).trim();
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

module.exports = {
  mapToUiResponse,
  parseModelResponse
};
