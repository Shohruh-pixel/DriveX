"use strict";

// ─────────────────────────────────────────────────────────────────────────────
//  DriveX AI — Groq Provider (бесплатный, быстрый)
//  Groq API совместим с OpenAI — используем chat/completions
//  Модели: llama-3.3-70b-versatile (рекомендуется), mixtral-8x7b-32768
//  Получить ключ: https://console.groq.com/keys
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile";
const MAX_TOKENS   = 1024;
const MAX_HISTORY  = 8;

// Используем тот же системный промпт что и для Claude
function buildSystemPrompt(vehicle, maintenanceSummary) {
  const hasVehicle = vehicle && (vehicle.make || vehicle.model);
  const carLine = hasVehicle
    ? [
        vehicle.make, vehicle.model,
        vehicle.year  ? `(${vehicle.year})` : "",
        vehicle.mileage ? `— пробег ${Number(vehicle.mileage).toLocaleString("ru-RU")} км` : "",
        vehicle.fuelType ? `· ${vehicle.fuelType}` : ""
      ].filter(Boolean).join(" ")
    : null;

  const historyLine = maintenanceSummary
    ? `\nИСТОРИЯ ТО: ${maintenanceSummary}`
    : "";

  const carSection = carLine
    ? `\n🚗 АВТОМОБИЛЬ ПОЛЬЗОВАТЕЛЯ: ${carLine}${historyLine}

ВАЖНО: В каждом ответе явно упоминай эту конкретную машину ("Для твоего ${carLine}...", "На W210...", "При таком пробеге...").
Давай советы именно под эту марку/модель/год/пробег — не общие фразы.`
    : `\n⚠️ АВТОМОБИЛЬ НЕ УКАЗАН.
Пользователь ещё не добавил свой автомобиль в гараж.
В конце ответа ВСЕГДА добавляй: "Добавь свой автомобиль в Гараж — тогда смогу дать совет именно для твоей машины 🚗"
Отвечай в общем, без привязки к конкретной марке.`;

  return `Ты — DriveX AI, персональный автопомощник приложения DriveX (Таджикистан).
${carSection}

РОЛИ:
- 🔧 Мастер-диагност — знаешь все проблемы авто, причины симптомов, цены на работы в Таджикистане
- 🤝 Друг-автолюбитель — говоришь просто, честно, без лишних слов
- 🛒 Эксперт по запчастям — знаешь оригиналы, аналоги, где купить
- 📚 Ментор — объясняешь технические термины простым языком

ПРАВИЛА:
- Если есть данные об авто — учитывай марку, модель, год, пробег в ответе
- Не ставь диагноз как факт — "возможно", "скорее всего", "стоит проверить"
- Срочные проблемы (тормоза, дым, перегрев) → urgency:"high"
- Давай конкретные советы с учётом реалий Таджикистана (дороги, климат, цены)
- Отвечай по-русски живо и тепло

ФОРМАТ — ТОЛЬКО JSON без markdown:
{
  "type": "car_help",
  "title": "Краткий заголовок (макс 55 символов)",
  "answer": "Основной ответ — подробно, по делу",
  "tips": ["Совет 1", "Совет 2", "Совет 3"],
  "urgency": "low | medium | high",
  "nextStep": "Что сделать прямо сейчас",
  "cta": { "type": "find_service | find_part | maintenance | none", "label": "Текст кнопки" },
  "suggestions": ["Вопрос 1", "Вопрос 2", "Вопрос 3"]
}`;
}

function buildMessages(history, userMessage, systemPrompt) {
  const msgs = [{ role: "system", content: systemPrompt }];

  const recent = (history || []).slice(-MAX_HISTORY);
  for (const msg of recent) {
    if (msg.role === "user" && msg.text) {
      msgs.push({ role: "user", content: String(msg.text) });
    } else if ((msg.role === "assistant" || msg.role === "ai")) {
      const content = msg.content || msg.answer ||
        (msg.response && (msg.response.answer || msg.response.summary)) || "";
      if (content) msgs.push({ role: "assistant", content: String(content) });
    }
  }

  msgs.push({ role: "user", content: userMessage });
  return msgs;
}

async function askGroqDriveX(context) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error("GROQ_API_KEY not configured");
  }

  const userMessage        = String(context.input?.userMessage || context.userMessage || "").trim();
  const vehicle            = context.vehicle || context.input?.vehicle || null;
  const maintenanceSummary = context.input?.serviceHistorySummary || null;
  const history            = context.input?.history || context.history || [];

  if (!userMessage) throw new Error("Empty message");

  const systemPrompt = buildSystemPrompt(vehicle, maintenanceSummary);
  const messages     = buildMessages(history, userMessage, systemPrompt);

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model:       process.env.GROQ_MODEL || GROQ_MODEL,
      messages,
      max_tokens:  MAX_TOKENS,
      temperature: 0.7,
      stream:      false
    }),
    signal: AbortSignal.timeout(25000)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Groq API ${res.status}: ${errText}`);
  }

  const data    = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || "";

  return { text: parseGroqResponse(rawText) };
}

function parseGroqResponse(raw) {
  const cleaned = raw.replace(/^```json\s*/m, "").replace(/^```\s*/m, "").replace(/\s*```$/m, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Groq иногда отдаёт текст — оборачиваем
    return buildFallback(raw);
  }

  const ctaObj  = parsed.cta || {};
  const ctaType = ctaObj.type || "none";

  let legacyCta;
  if (ctaType === "find_service") {
    legacyCta = { primary: { label: ctaObj.label || "Найти сервис", action: "find_service" }, secondary: { label: "На карте", action: "show_map" } };
  } else if (ctaType === "find_part") {
    legacyCta = { primary: { label: ctaObj.label || "Найти запчасть", action: "find_part" }, secondary: { label: "Найти сервис", action: "find_service" } };
  } else if (ctaType === "maintenance") {
    legacyCta = { primary: { label: ctaObj.label || "Добавить в ТО", action: "open_maintenance" }, secondary: { label: "Найти сервис", action: "find_service" } };
  } else {
    legacyCta = { primary: { label: "Найти сервис", action: "find_service" }, secondary: { label: "На карте", action: "show_map" } };
  }

  return {
    type:           parsed.type      || "car_help",
    title:          parsed.title     || "Ответ DriveX AI",
    answer:         parsed.answer    || "",
    tips:           Array.isArray(parsed.tips) ? parsed.tips : [],
    urgency:        parsed.urgency   || "low",
    nextStep:       parsed.nextStep  || "",
    cta:            legacyCta,
    ctaRaw:         ctaObj,
    suggestions:    Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    // Совместимость со старым форматом
    label:          "AI ASSIST",
    summary:        parsed.answer    || "",
    causes:         Array.isArray(parsed.tips) ? parsed.tips : [],
    actions:        Array.isArray(parsed.tips) ? parsed.tips : [],
    recommendation: parsed.nextStep  || parsed.answer || "",
    sourcesUsed:    ["groq"],
    services:       []
  };
}

function buildFallback(rawText) {
  return {
    type: "general", title: "Ответ DriveX AI",
    answer: rawText || "Не удалось получить ответ.",
    tips: [], urgency: "low", nextStep: "Задай уточняющий вопрос",
    cta: { primary: { label: "Найти сервис", action: "find_service" }, secondary: { label: "На карте", action: "show_map" } },
    ctaRaw: { type: "none" }, suggestions: ["Расскажи подробнее"],
    label: "AI ASSIST", summary: rawText, causes: [], actions: [],
    recommendation: rawText, sourcesUsed: ["groq"], services: []
  };
}

module.exports = { askGroqDriveX };
