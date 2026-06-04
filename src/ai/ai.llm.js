"use strict";

const { askOpenAIDriveX } = require("./ai.openai");
const { askGeminiDriveX } = require("./ai.gemini");
const { askClaudeDriveX } = require("./ai.claude");
const { askGroqDriveX }   = require("./ai.groq");

function getProvider() {
  const provider = String(process.env.AI_PROVIDER || "").toLowerCase();
  if (provider && provider !== "auto") return provider;

  // Авто-определение по наличию ключей (приоритет: claude → groq → gemini → openai)
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your_anthropic_api_key_here") return "claude";
  if (process.env.GROQ_API_KEY      && process.env.GROQ_API_KEY      !== "your_groq_api_key_here")      return "groq";
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

async function askDriveXLLM(context) {
  const provider = getProvider();
  if (provider === "claude")  return askClaudeDriveX(context);
  if (provider === "groq")    return askGroqDriveX(context);
  if (provider === "gemini")  return askGeminiDriveX(context);
  if (provider === "openai")  return askOpenAIDriveX(context);
  throw new Error("No LLM provider configured. Set GROQ_API_KEY (free) or ANTHROPIC_API_KEY");
}

module.exports = { askDriveXLLM, getProvider };
