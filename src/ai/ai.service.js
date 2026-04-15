"use strict";

const { classifyIntent } = require("./ai.classifier");
const { searchKnowledgeBase, searchLLMContext } = require("./ai.tools");
const { composeLocalResponse } = require("./ai.composers");
const { mapToUiResponse, parseModelResponse } = require("./ai.mapper");
const { askDriveXLLM, getProvider } = require("./ai.llm");
const { getVehicleContext } = require("../vehicle/vehicle.repository");

function uniqueList(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function isPartsTopic(response = {}, retrieval = {}) {
  const text = [
    response.title,
    response.summary,
    response.recommendation,
    ...(response.causes || []),
    ...(response.actions || []),
    ...(retrieval.glossary || []).map((item) => item.term).filter(Boolean),
    ...(retrieval.symptoms || []).flatMap((item) => [item.topic, item.title, ...(item.causes || [])])
  ].join(" ").toLowerCase();
  return /свеч|колод|амортиз|радиатор|термостат|форсунк|катушк|аккумулятор|генератор|ремень|грм|сайлент|подшипник|диск|суппорт|запчаст|детал/.test(text);
}

function applyCtaPolicy(response, retrieval) {
  if (response?.intent === "find_service") {
    return {
      ...response,
      cta: {
        primary: { label: "Найти сервис", action: "find_service" },
        secondary: { label: "Показать на карте", action: "show_map" }
      }
    };
  }
  if (!isPartsTopic(response, retrieval)) return response;
  return {
    ...response,
    cta: {
      primary: response.cta?.primary || { label: "Найти сервис", action: "find_service" },
      secondary: { label: "Найти запчасть", action: "find_part" }
    }
  };
}

function normalizeInput(body = {}) {
  return {
    userMessage: String(body.message || body.userMessage || "").trim(),
    scenarioType: body.scenario || body.scenarioType || "",
    vehicle: body.vehicle || {},
    location: body.location || { city: "Khujand" },
    locale: body.locale || "ru",
    serviceHistorySummary: body.serviceHistorySummary || body.serviceHistory || null
  };
}

function getMode() {
  const mode = String(process.env.AI_MODE || "llm_first").toLowerCase();
  if (mode === "mock") return "local";
  if (mode === "real") return "openai";
  return ["local", "hybrid", "openai", "llm_first"].includes(mode) ? mode : "llm_first";
}

function devLog(label, payload) {
  if (process.env.NODE_ENV === "production" || process.env.AI_DEBUG !== "true") return;
  const safe = JSON.parse(JSON.stringify(payload || {}));
  if (safe.openAiRaw) safe.openAiRaw = "[hidden raw output]";
  console.info(`[DriveX AI] ${label}`, safe);
}

async function askAssistant(body = {}) {
  const input = normalizeInput(body);
  const vehicle = getVehicleContext(input.vehicle);
  const classification = classifyIntent(input.userMessage, input.scenarioType);
  const mode = getMode();
  const retrieval = mode === "local"
    ? searchKnowledgeBase(input.userMessage, vehicle, input.location, classification.intent)
    : searchLLMContext(input.userMessage, vehicle, input.location, classification.intent);
  const context = { input, vehicle, classification, retrieval };
  const localResponse = composeLocalResponse(context);

  devLog("context", {
    message: input.userMessage,
    mode,
    classification,
    sourcesUsed: retrieval.sourcesUsed
  });

  if (mode === "local") {
    return mapToUiResponse(localResponse, localResponse);
  }

  try {
    const shouldCallOpenAI = mode === "openai" || mode === "hybrid" || mode === "llm_first";
    if (!shouldCallOpenAI) return mapToUiResponse(localResponse, localResponse);

    const llmResult = await askDriveXLLM(context);
    const parsed = parseModelResponse(llmResult.text);
    const policyResponse = applyCtaPolicy(parsed || {}, retrieval);
    const mapped = mapToUiResponse(
      {
        ...policyResponse,
        intent: policyResponse?.intent || classification.intent,
        sourcesUsed: uniqueList(["llm", getProvider(), ...(policyResponse?.sourcesUsed?.length ? policyResponse.sourcesUsed : retrieval.sourcesUsed)]),
        services: policyResponse?.services?.length ? policyResponse.services : retrieval.services
      },
      localResponse
    );

    devLog("response", {
      title: mapped.title,
      urgency: mapped.urgency,
      sourcesUsed: mapped.sourcesUsed
    });

    return mapped;
  } catch (error) {
    devLog("fallback", { reason: error.message });
    return mapToUiResponse({
      ...localResponse,
      recommendation: mode === "hybrid"
        ? `${localResponse.recommendation} Ответ собран локально по базе DriveX.`
        : localResponse.recommendation
    }, localResponse);
  }
}

module.exports = {
  askAssistant,
  normalizeInput
};
