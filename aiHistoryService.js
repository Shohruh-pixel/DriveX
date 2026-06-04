// aiHistoryService.js — клиентская сторона истории AI чатов
// Загрузка/сохранение чатов с сервера + локальный кэш
(() => {
  const CACHE_KEY  = "drivex.ai.history.v1";
  const MAX_LOCAL  = 50; // максимум сообщений в локальном кэше

  // ── Локальный кэш в sessionStorage ──────────────────────────────────────────
  function loadLocalHistory(chatId) {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY + "." + chatId);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveLocalHistory(chatId, messages) {
    try {
      const trimmed = (messages || []).slice(-MAX_LOCAL);
      sessionStorage.setItem(CACHE_KEY + "." + chatId, JSON.stringify(trimmed));
    } catch { /* storage full */ }
  }

  // Текущий активный chatId в сессии
  let _activeChatId = null;
  let _userId       = null;
  let _chatsCache   = null;

  function setUser(userId) {
    _userId = userId || null;
    if (!userId) {
      _activeChatId = null;
      _chatsCache   = null;
    }
  }

  function getActiveChatId() { return _activeChatId; }

  // ── Получить список чатов пользователя ───────────────────────────────────────
  async function loadUserChats(userId) {
    const uid = userId || _userId;
    if (!uid) return [];

    try {
      const res = await fetch(`/api/ai/chats?userId=${encodeURIComponent(uid)}`);
      if (!res.ok) return [];
      const data = await res.json();
      _chatsCache = Array.isArray(data.chats) ? data.chats : [];
      return _chatsCache;
    } catch {
      return _chatsCache || [];
    }
  }

  // ── Загрузить сообщения чата ────────────────────────────────────────────────
  async function loadChatMessages(chatId, userId) {
    const uid = userId || _userId;
    if (!chatId || !uid) return loadLocalHistory(chatId);

    // Сначала отдаём из локального кэша (быстро)
    const local = loadLocalHistory(chatId);

    try {
      const res = await fetch(`/api/ai/chats/${chatId}?userId=${encodeURIComponent(uid)}`);
      if (!res.ok) return local;
      const data = await res.json();
      const messages = Array.isArray(data.messages) ? data.messages : [];
      // Обновляем локальный кэш
      if (messages.length) saveLocalHistory(chatId, messages);
      return messages;
    } catch {
      return local;
    }
  }

  // ── Удалить чат ─────────────────────────────────────────────────────────────
  async function deleteChat(chatId, userId) {
    const uid = userId || _userId;
    if (!chatId || !uid) return false;

    try {
      const res = await fetch(`/api/ai/chats/${chatId}?userId=${encodeURIComponent(uid)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        sessionStorage.removeItem(CACHE_KEY + "." + chatId);
        if (_chatsCache) {
          _chatsCache = _chatsCache.filter(c => c.id !== chatId);
        }
        if (_activeChatId === chatId) _activeChatId = null;
      }
      return res.ok;
    } catch {
      return false;
    }
  }

  // ── Добавить сообщение в локальный кэш ──────────────────────────────────────
  function addLocalMessage(chatId, message) {
    if (!chatId) return;
    const history = loadLocalHistory(chatId);
    history.push(message);
    saveLocalHistory(chatId, history);
  }

  // ── Установить активный чат ─────────────────────────────────────────────────
  function setActiveChat(chatId) {
    _activeChatId = chatId || null;
  }

  // ── Получить историю для контекста Claude (последние N сообщений) ───────────
  function getContextHistory(chatId, limit = 8) {
    const msgs = loadLocalHistory(chatId);
    return msgs.slice(-limit);
  }

  window.DrivexAIHistoryService = {
    setUser,
    getActiveChatId,
    setActiveChat,
    loadUserChats,
    loadChatMessages,
    deleteChat,
    addLocalMessage,
    getContextHistory
  };
})();
