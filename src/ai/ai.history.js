"use strict";

// ─────────────────────────────────────────────────────────────────────────────
//  DriveX AI — История чатов (per user_id)
//  Хранение: Supabase ai_chats + ai_messages
//  Fallback: если Supabase недоступен — пустая история
// ─────────────────────────────────────────────────────────────────────────────

const MAX_MESSAGES_RETURNED = 30; // последних сообщений в чате
const MAX_CHATS_PER_USER    = 20; // максимум чатов на юзера

// ── Получаем Supabase клиент ──────────────────────────────────────────────────
function getSupabase() {
  // Используем supabase-js на сервере (service role)
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const { createClient } = require("@supabase/supabase-js");
    return createClient(url, key);
  } catch {
    return null;
  }
}

// ── Создать или найти активный чат для пользователя ───────────────────────────
async function getOrCreateChat(userId, carContext = null) {
  const sb = getSupabase();
  if (!sb || !userId) return { id: null, isNew: true };

  try {
    // Ищем последний чат за сегодня
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { data: existing } = await sb
      .from("ai_chats")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .gte("created_at", today + "T00:00:00Z")
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      return { id: existing[0].id, isNew: false };
    }

    // Создаём новый чат
    const { data: created, error } = await sb
      .from("ai_chats")
      .insert({
        user_id:     userId,
        title:       "Чат " + new Date().toLocaleDateString("ru-RU"),
        car_context: carContext || null,
        message_count: 0
      })
      .select("id")
      .single();

    if (error || !created) return { id: null, isNew: true };
    return { id: created.id, isNew: true };
  } catch {
    return { id: null, isNew: true };
  }
}

// ── Сохранить сообщение пользователя ─────────────────────────────────────────
async function saveUserMessage(chatId, userId, text) {
  const sb = getSupabase();
  if (!sb || !chatId || !userId || !text) return null;

  try {
    const { data } = await sb
      .from("ai_messages")
      .insert({
        chat_id: chatId,
        user_id: userId,
        role:    "user",
        content: text
      })
      .select("id")
      .single();

    // Обновляем счётчик
    await sb.from("ai_chats")
      .update({ message_count: sb.rpc("increment") || undefined, updated_at: new Date().toISOString() })
      .eq("id", chatId)
      .catch(() => {});

    return data?.id || null;
  } catch {
    return null;
  }
}

// ── Сохранить ответ AI ────────────────────────────────────────────────────────
async function saveAIMessage(chatId, userId, responseObj, scenarioType) {
  const sb = getSupabase();
  if (!sb || !chatId || !userId) return null;

  const answer = responseObj?.answer || responseObj?.summary || "";
  if (!answer) return null;

  try {
    const { data } = await sb
      .from("ai_messages")
      .insert({
        chat_id:       chatId,
        user_id:       userId,
        role:          "assistant",
        content:       answer,
        response_json: responseObj,
        scenario_type: scenarioType || null
      })
      .select("id")
      .single();

    await sb.from("ai_chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId)
      .catch(() => {});

    return data?.id || null;
  } catch {
    return null;
  }
}

// ── Получить историю сообщений чата ──────────────────────────────────────────
async function getChatHistory(chatId, userId) {
  const sb = getSupabase();
  if (!sb || !chatId || !userId) return [];

  try {
    const { data } = await sb
      .from("ai_messages")
      .select("id, role, content, response_json, scenario_type, created_at")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(MAX_MESSAGES_RETURNED);

    return (data || []).map(msg => ({
      id:           msg.id,
      role:         msg.role,
      text:         msg.role === "user" ? msg.content : undefined,
      answer:       msg.role === "assistant" ? msg.content : undefined,
      response:     msg.response_json || undefined,
      scenarioType: msg.scenario_type,
      createdAt:    msg.created_at
    }));
  } catch {
    return [];
  }
}

// ── Получить список чатов пользователя ────────────────────────────────────────
async function getUserChats(userId) {
  const sb = getSupabase();
  if (!sb || !userId) return [];

  try {
    const { data } = await sb
      .from("ai_chats")
      .select("id, title, car_context, message_count, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(MAX_CHATS_PER_USER);

    return data || [];
  } catch {
    return [];
  }
}

// ── Обновить заголовок чата (берём из первого вопроса) ───────────────────────
async function updateChatTitle(chatId, userId, firstMessage) {
  const sb = getSupabase();
  if (!sb || !chatId || !userId) return;

  // Короткий заголовок из первого сообщения
  const title = String(firstMessage || "").slice(0, 60).trim() || "Новый чат";

  try {
    await sb.from("ai_chats")
      .update({ title })
      .eq("id", chatId)
      .eq("user_id", userId);
  } catch { /* ignore */ }
}

// ── Удалить чат ───────────────────────────────────────────────────────────────
async function deleteChat(chatId, userId) {
  const sb = getSupabase();
  if (!sb || !chatId || !userId) return false;

  try {
    // ai_messages удаляются каскадно (ON DELETE CASCADE)
    const { error } = await sb
      .from("ai_chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}

// ── Полный цикл: сохранить запрос + ответ ────────────────────────────────────
async function saveConversationTurn(userId, userText, aiResponse, carContext, scenarioType) {
  if (!userId || !userText) return { chatId: null };

  const { id: chatId, isNew } = await getOrCreateChat(userId, carContext);
  if (!chatId) return { chatId: null };

  // Если чат новый — обновляем заголовок по первому сообщению
  if (isNew) {
    await updateChatTitle(chatId, userId, userText);
  }

  await saveUserMessage(chatId, userId, userText);
  if (aiResponse) {
    await saveAIMessage(chatId, userId, aiResponse, scenarioType);
  }

  return { chatId, isNew };
}

module.exports = {
  getOrCreateChat,
  saveUserMessage,
  saveAIMessage,
  getChatHistory,
  getUserChats,
  updateChatTitle,
  deleteChat,
  saveConversationTurn
};
