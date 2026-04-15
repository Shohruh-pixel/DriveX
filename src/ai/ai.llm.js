"use strict";

const { askOpenAIDriveX } = require("./ai.openai");
const { askGeminiDriveX } = require("./ai.gemini");

function getProvider() {
  const provider = String(process.env.AI_PROVIDER || "").toLowerCase();
  if (provider) return provider;
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

async function askDriveXLLM(context) {
  const provider = getProvider();
  if (provider === "gemini") return askGeminiDriveX(context);
  if (provider === "openai") return askOpenAIDriveX(context);
  throw new Error("No LLM provider configured");
}

module.exports = {
  askDriveXLLM,
  getProvider
};
