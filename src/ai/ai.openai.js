"use strict";

const { systemPrompt, responseSchema, buildPromptContext } = require("./ai.prompts");

function extractOutputText(response) {
  if (response.output_text) return response.output_text;
  const parts = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
      if (content.type === "text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

async function askOpenAIDriveX(context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  if (apiKey.includes("replace_this") || apiKey.includes("your_openai_api_key_here")) {
    throw new Error("OPENAI_API_KEY placeholder is not configured");
  }
  if (typeof fetch !== "function") throw new Error("Global fetch is unavailable. Use Node.js 18+.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_TIMEOUT_MS) || 12000);
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(buildPromptContext(context)) }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "drivex_ai_response",
            strict: true,
            schema: responseSchema
          }
        }
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.error?.message || `OpenAI request failed with ${response.status}`;
      throw new Error(message);
    }

    return {
      raw: payload,
      text: extractOutputText(payload)
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  askOpenAIDriveX
};
