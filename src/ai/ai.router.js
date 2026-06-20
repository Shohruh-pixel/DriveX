"use strict";

const { assistantController } = require("./ai.controller");
const { getUserChats, getChatHistory, deleteChat } = require("./ai.history");

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req, limitBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > limitBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

async function handleAiRoute(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return true;
  }

  try {
    const body = await readJsonBody(req);
    const result = await assistantController(body);
    sendJson(res, 200, result);
  } catch {
    sendJson(res, 200, {
      label: "AI ANALYSIS",
      title: "AI Assist временно недоступен",
      summary: "Не удалось получить ответ. Попробуй ещё раз или опиши симптом подробнее.",
      causes: ["Возможна временная ошибка соединения."],
      actions: ["Повтори запрос", "Если проблема срочная, обратись в ближайший сервис"],
      urgency: "medium",
      recommendation: "Рекомендуется очная диагностика в сервисе.",
      cta: {
        primary: { label: "Найти сервис", action: "find_service" },
        secondary: { label: "Показать на карте", action: "show_map" }
      },
      suggestions: ["Не заводится", "Стук в подвеске", "Что скоро обслужить?"],
      sourcesUsed: []
    });
  }

  return true;
}

// ── Генерация карточки товара по фото (seller CRM) ────────────────────────────
// POST /api/ai/product-card  { image, title, ocrText, categories[] }
async function handleProductCardRoute(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return true;
  }

  try {
    // До 8 МБ: base64-фото крупнее обычного JSON-запроса
    const body = await readJsonBody(req, 8 * 1024 * 1024);
    const { generateProductCard } = require("./ai.vision");
    const card = await generateProductCard(body);
    sendJson(res, 200, card);
  } catch (err) {
    sendJson(res, 200, {
      title: "",
      category: "",
      brand: "",
      sku: "",
      description: "",
      specs: [],
      tags: [],
      _error: err && err.message ? err.message : String(err)
    });
  }

  return true;
}

// ── Расшифровка VIN для подбора запчастей ─────────────────────────────────────
// POST /api/ai/vin  { vin }  →  { vin, brand, model, year, valid }
async function handleVinRoute(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return true;
  }

  try {
    const body = await readJsonBody(req);
    const { decodeVin } = require("./ai.vin");
    const result = await decodeVin(body.vin);
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 200, {
      vin: "",
      brand: "",
      model: "",
      year: "",
      valid: false,
      _error: err && err.message ? err.message : String(err)
    });
  }

  return true;
}

// ── История чатов ─────────────────────────────────────────────────────────────
// GET  /api/ai/chats?userId=xxx         — список чатов пользователя
// GET  /api/ai/chats/:chatId?userId=xxx — сообщения чата
// DELETE /api/ai/chats/:chatId?userId=xxx — удалить чат
async function handleAiHistoryRoute(req, res, urlParts) {
  const url    = new URL(req.url, "http://localhost");
  const userId = url.searchParams.get("userId") || url.searchParams.get("user_id") || "";

  if (!userId) {
    sendJson(res, 400, { error: "userId required" });
    return true;
  }

  // /api/ai/chats/:chatId
  const chatId = urlParts[4] || ""; // ['', 'api', 'ai', 'chats', '<chatId>']

  if (req.method === "GET" && !chatId) {
    // Список чатов
    const chats = await getUserChats(userId).catch(() => []);
    sendJson(res, 200, { chats });
    return true;
  }

  if (req.method === "GET" && chatId) {
    // Сообщения конкретного чата
    const messages = await getChatHistory(chatId, userId).catch(() => []);
    sendJson(res, 200, { messages });
    return true;
  }

  if (req.method === "DELETE" && chatId) {
    const ok = await deleteChat(chatId, userId).catch(() => false);
    sendJson(res, 200, { ok });
    return true;
  }

  sendJson(res, 405, { error: "Method not allowed" });
  return true;
}

module.exports = {
  handleAiRoute,
  handleAiHistoryRoute,
  handleProductCardRoute,
  handleVinRoute,
  sendJson
};
