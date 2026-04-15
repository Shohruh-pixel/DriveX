"use strict";

const { systemPrompt, buildPromptContext } = require("./ai.prompts");

function extractOutputText(response) {
  const parts = [];
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.text) parts.push(part.text);
    }
  }
  return parts.join("\n").trim();
}

function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  if (key.includes("replace_this") || key.includes("your_gemini_api_key_here")) {
    throw new Error("GEMINI_API_KEY placeholder is not configured");
  }
  return key;
}

async function askGeminiDriveX(context) {
  const apiKey = getGeminiApiKey();
  if (typeof fetch !== "function") throw new Error("Global fetch is unavailable. Use Node.js 18+.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_TIMEOUT_MS) || 15000);
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Return only valid JSON. Do not use markdown.",
                  "The JSON must match this exact contract:",
                  JSON.stringify({
                    intent: "diagnostic | explain_service | maintenance | find_service | clarify",
                    label: "AI ANALYSIS",
                    title: "short title",
                    summary: "short helpful summary",
                    causes: ["item"],
                    actions: ["item"],
                    urgency: "low | medium | high",
                    recommendation: "next best step",
                    cta: {
                      primary: { label: "Найти сервис", action: "find_service" },
                      secondary: { label: "Найти запчасть", action: "find_part" }
                    },
                    suggestions: ["short follow-up"],
                    sourcesUsed: ["llm"],
                    services: []
                  }),
                  "CTA rule: if the topic is about a concrete part/spare part, use secondary CTA exactly {\"label\":\"Найти запчасть\",\"action\":\"find_part\"}. If the topic is only about service selection, use secondary CTA {\"label\":\"Показать на карте\",\"action\":\"show_map\"}.",
                  "Do not use keys like answer, text, message, or response.",
                  "All required fields must be present.",
                  "DriveX context:",
                  JSON.stringify(buildPromptContext(context))
                ].join("\n")
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.25,
          topP: 0.9,
          responseMimeType: "application/json"
        }
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.error?.message || `Gemini request failed with ${response.status}`;
      throw new Error(message);
    }

    return {
      provider: "gemini",
      raw: payload,
      text: extractOutputText(payload)
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  askGeminiDriveX
};
