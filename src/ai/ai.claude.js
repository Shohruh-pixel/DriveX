"use strict";

// ─────────────────────────────────────────────────────────────────────────────
//  DriveX AI — Claude (Anthropic) Provider  v2
//  Умный помощник: знает машину, историю ТО, контекст разговора
// ─────────────────────────────────────────────────────────────────────────────

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL   = "claude-sonnet-4-6";
const MAX_TOKENS     = 1400;
const MAX_HISTORY    = 8; // последних сообщений в контексте

// ── Формирование системного промпта ──────────────────────────────────────────
function buildSystemPrompt(vehicle, maintenanceSummary, userId) {
  // Данные авто
  const hasVehicle = vehicle && (vehicle.make || vehicle.model);
  const carLine = hasVehicle
    ? [
        vehicle.make, vehicle.model,
        vehicle.year  ? `(${vehicle.year})` : "",
        vehicle.mileage ? `— пробег ${Number(vehicle.mileage).toLocaleString("ru-RU")} км` : "",
        vehicle.fuelType ? `· ${vehicle.fuelType}` : ""
      ].filter(Boolean).join(" ")
    : null;

  // История обслуживания
  const historyLine = maintenanceSummary
    ? `\nИСТОРИЯ ТО (последние работы): ${maintenanceSummary}`
    : "";

  const carSection = carLine
    ? `\n🚗 АВТОМОБИЛЬ ПОЛЬЗОВАТЕЛЯ: ${carLine}${historyLine}

ВАЖНО: В каждом ответе явно упоминай эту конкретную машину ("Для твоего ${carLine}...", "На этой модели...", "При пробеге...").
Советы давай именно под эту марку/модель/год/пробег — не общие слова.`
    : `\n⚠️ АВТОМОБИЛЬ НЕ УКАЗАН.
В конце каждого ответа пиши: "Добавь свой автомобиль в Гараж — тогда дам совет именно для твоей машины 🚗"
Отвечай в общем, без привязки к конкретной марке.`;

  return `Ты — DriveX AI, персональный автопомощник мобильного приложения DriveX (Таджикистан).
${carSection}

═══ ТВОИ РОЛИ ═══
🔧 Мастер-диагност — знаешь все болезни авто, причины симптомов, стоимость работ в Таджикистане
🤝 Друг-автолюбитель — говоришь просто, честно, без лишних слов
🛒 Эксперт по запчастям — знаешь оригиналы, аналоги, где купить не переплатив
📚 Ментор — объясняешь технические термины простым языком
💡 Универсал — отвечаешь на ЛЮБЫЕ вопросы, не только про авто

═══ ПРАВИЛА ═══
• Если есть данные об авто — ВСЕГДА учитывай марку, модель, год, пробег в ответе
• Для пробега > 150к — проверяй актуальность замены ремня ГРМ, цепи, подшипников
• Не ставь диагноз как факт — "возможно", "скорее всего", "стоит проверить"
• Срочные проблемы (тормоза, дым, перегрев, потеря тяги) → urgency:"high" + предупреждай немедленно
• Давай конкретные практичные советы с учётом реалий Таджикистана (дороги, климат, доступность)
• Если спрашивают цену — давай диапазон по рынку Таджикистана/Худжанда
• Пиши по-русски живо и тепло, уместные таджикские слова приветствуются

═══ ФОРМАТ — ТОЛЬКО JSON ═══
{
  "type": "car_help" | "general" | "urgent",
  "title": "Краткий заголовок (макс 55 симв)",
  "answer": "Основной ответ — подробно, по делу, дружески",
  "tips": ["Конкретный совет 1", "Конкретный совет 2"],
  "urgency": "low" | "medium" | "high",
  "nextStep": "Что сделать прямо сейчас",
  "cta": {
    "type": "none" | "find_service" | "find_part" | "book_service" | "maintenance",
    "label": "Текст кнопки",
    "data": {}
  },
  "suggestions": ["Уточняющий вопрос 1", "Вопрос 2", "Вопрос 3"]
}

Правила CTA:
- Если нужен ремонт/диагностика → type:"find_service", label:"Найти сервис рядом"
- Если нужна запчасть → type:"find_part", label:"Найти запчасть"
- Если план ТО → type:"maintenance", label:"Добавить в журнал ТО"
- Общий вопрос → type:"none"

Верни ТОЛЬКО JSON без markdown, без комментариев.`;
}

// ── Форматирование истории для Claude ────────────────────────────────────────
function buildMessages(history, userMessage) {
  const recent = (history || []).slice(-MAX_HISTORY);
  const claudeMessages = [];

  for (const msg of recent) {
    if (msg.role === "user" && msg.text) {
      claudeMessages.push({ role: "user", content: String(msg.text) });
    } else if (msg.role === "assistant" || msg.role === "ai") {
      // Извлекаем текстовый ответ из разных форматов
      const content =
        msg.content ||
        msg.answer ||
        (msg.response && (msg.response.answer || msg.response.summary)) ||
        "";
      if (content) claudeMessages.push({ role: "assistant", content: String(content) });
    }
  }

  // Последнее сообщение пользователя
  claudeMessages.push({ role: "user", content: userMessage });

  // Убеждаемся что начинается с user и чередуется корректно
  return normalizeMessageRoles(claudeMessages);
}

function normalizeMessageRoles(msgs) {
  // Claude требует чередование user/assistant, начиная с user
  const result = [];
  let lastRole = null;
  for (const msg of msgs) {
    if (msg.role === lastRole) {
      // Склеиваем подряд идущие сообщения одной роли
      result[result.length - 1].content += "\n" + msg.content;
    } else {
      result.push({ ...msg });
      lastRole = msg.role;
    }
  }
  // Должно начинаться с user
  if (result.length && result[0].role !== "user") {
    result.unshift({ role: "user", content: "(начало диалога)" });
  }
  return result;
}

// ── Основная функция вызова Claude ───────────────────────────────────────────
async function askClaudeDriveX(context) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  // Извлекаем данные из контекста
  const userMessage       = String(context.input?.userMessage || context.userMessage || "").trim();
  const vehicle           = context.vehicle || context.input?.vehicle || null;
  const maintenanceSummary = context.input?.serviceHistorySummary || context.serviceHistorySummary || null;
  const history           = context.input?.history || context.history || [];
  const userId            = context.input?.userId || context.userId || null;

  if (!userMessage) throw new Error("Empty message");

  const systemPrompt = buildSystemPrompt(vehicle, maintenanceSummary, userId);
  const messages     = buildMessages(history, userMessage);

  const requestBody = {
    model:      process.env.CLAUDE_MODEL || CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system:     systemPrompt,
    messages
  };

  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01"
    },
    body:   JSON.stringify(requestBody),
    signal: AbortSignal.timeout(32000)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Claude API ${res.status}: ${errText}`);
  }

  const data    = await res.json();
  const rawText = data?.content?.[0]?.text || "";

  return { text: parseClaudeResponse(rawText, vehicle) };
}

// ── Парсинг ответа Claude → стандартный DriveX формат ────────────────────────
function parseClaudeResponse(raw, vehicle) {
  // Чистим markdown-обёртки если есть
  const cleaned = raw
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback — plain text ответ
    return buildFallbackResponse(raw);
  }

  // Нормализуем CTA для совместимости с обоими форматами экрана
  const ctaObj = parsed.cta || {};
  const ctaType = ctaObj.type || "none";

  let legacyCta;
  if (ctaType === "find_service") {
    legacyCta = {
      primary:   { label: ctaObj.label || "Найти сервис", action: "find_service" },
      secondary: { label: "Показать на карте",             action: "show_map" }
    };
  } else if (ctaType === "find_part") {
    legacyCta = {
      primary:   { label: ctaObj.label || "Найти запчасть", action: "find_part" },
      secondary: { label: "Найти сервис",                   action: "find_service" }
    };
  } else if (ctaType === "maintenance") {
    legacyCta = {
      primary:   { label: ctaObj.label || "Добавить в ТО", action: "open_maintenance" },
      secondary: { label: "Найти сервис",                  action: "find_service" }
    };
  } else {
    legacyCta = {
      primary:   { label: "Найти сервис",   action: "find_service" },
      secondary: { label: "Показать карту", action: "show_map" }
    };
  }

  return {
    // Новый формат
    type:        parsed.type      || "car_help",
    title:       parsed.title     || "Ответ DriveX AI",
    answer:      parsed.answer    || "",
    tips:        Array.isArray(parsed.tips) ? parsed.tips : [],
    urgency:     parsed.urgency   || "low",
    nextStep:    parsed.nextStep  || "",
    cta:         legacyCta,
    ctaRaw:      ctaObj,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    // Совместимость со старым форматом экрана
    label:          "AI ASSIST",
    summary:        parsed.answer || "",
    causes:         Array.isArray(parsed.tips) ? parsed.tips : [],
    actions:        Array.isArray(parsed.tips) ? parsed.tips : [],
    recommendation: parsed.nextStep || parsed.answer || "",
    sourcesUsed:    ["claude"],
    services:       []
  };
}

function buildFallbackResponse(rawText) {
  return {
    type:           "general",
    title:          "Ответ DriveX AI",
    answer:         rawText || "Не удалось получить ответ. Попробуй ещё раз.",
    tips:           [],
    urgency:        "low",
    nextStep:       "Задай уточняющий вопрос",
    cta:            { primary: { label: "Задать вопрос", action: "ask_question" }, secondary: { label: "Найти сервис", action: "find_service" } },
    ctaRaw:         { type: "none" },
    suggestions:    ["Расскажи подробнее", "Что ещё хочешь узнать?"],
    label:          "AI ASSIST",
    summary:        rawText,
    causes:         [],
    actions:        [],
    recommendation: rawText,
    sourcesUsed:    ["claude"],
    services:       []
  };
}

module.exports = { askClaudeDriveX };
