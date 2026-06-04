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
  sendJson
};
