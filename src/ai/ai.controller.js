"use strict";

const { askAssistant } = require("./ai.service");
const { responseFromContext } = require("./ai.fallback");
const { mapToUiResponse } = require("./ai.mapper");

async function assistantController(body) {
  try {
    return await askAssistant(body);
  } catch {
    return mapToUiResponse(responseFromContext({
      input: { userMessage: body?.message || body?.userMessage || "", locale: body?.locale || "ru" },
      classification: { intent: "unknown", risk: "medium" },
      retrieval: { sourcesUsed: [], services: [] }
    }));
  }
}

module.exports = {
  assistantController
};
