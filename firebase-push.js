// DRIVEX — Firebase Cloud Messaging (Push-уведомления)
// Настройка: замените FIREBASE_CONFIG на ваш проект из Firebase Console
// https://console.firebase.google.com → Project settings → General → Your apps → Web app

(() => {
  const FIREBASE_CONFIG = {
    apiKey: window.DRIVEX_FIREBASE_API_KEY || "",
    authDomain: window.DRIVEX_FIREBASE_AUTH_DOMAIN || "",
    projectId: window.DRIVEX_FIREBASE_PROJECT_ID || "",
    storageBucket: window.DRIVEX_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: window.DRIVEX_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: window.DRIVEX_FIREBASE_APP_ID || "",
    vapidKey: window.DRIVEX_FIREBASE_VAPID_KEY || ""  // Web push certificate key
  };

  const isConfigured = Boolean(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.messagingSenderId &&
    FIREBASE_CONFIG.apiKey !== "" // убедимся что не пустая строка
  );

  let messagingInstance = null;
  let currentToken = null;

  async function initFirebase() {
    if (!isConfigured) {
      console.info("[firebase-push] Firebase не настроен. Добавьте конфиг в supabase-config.js");
      return null;
    }

    if (typeof firebase === "undefined") {
      console.warn("[firebase-push] Firebase SDK не загружен (нет CDN скрипта)");
      return null;
    }

    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp({
          apiKey:            FIREBASE_CONFIG.apiKey,
          authDomain:        FIREBASE_CONFIG.authDomain,
          projectId:         FIREBASE_CONFIG.projectId,
          storageBucket:     FIREBASE_CONFIG.storageBucket,
          messagingSenderId: FIREBASE_CONFIG.messagingSenderId,
          appId:             FIREBASE_CONFIG.appId
        });
      }
      if (!firebase.messaging) {
        console.warn("[firebase-push] firebase.messaging недоступен — проверьте firebase-messaging-compat.js");
        return null;
      }
      messagingInstance = firebase.messaging();

      // Регистрируем service worker для фоновых уведомлений
      if ("serviceWorker" in navigator) {
        const sw = await navigator.serviceWorker.register("/firebase-sw.js").catch(() => null);
        if (sw && messagingInstance.useServiceWorker) {
          messagingInstance.useServiceWorker(sw);
        }
      }

      return messagingInstance;
    } catch (err) {
      console.warn("[firebase-push] initFirebase error:", err.message);
      return null;
    }
  }

  async function requestPermissionAndGetToken() {
    if (!("Notification" in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = messagingInstance || (await initFirebase());
    if (!messaging) return null;

    try {
      const token = await messaging.getToken({ vapidKey: FIREBASE_CONFIG.vapidKey });
      currentToken = token;
      window.dispatchEvent(new CustomEvent("drivex:fcm-token", { detail: { token } }));
      return token;
    } catch (err) {
      console.warn("[firebase-push] getToken error:", err.message);
      return null;
    }
  }

  function onForegroundMessage(callback) {
    if (!messagingInstance) return () => {};
    const unsubscribe = messagingInstance.onMessage((payload) => {
      const notification = payload.notification || {};
      callback({
        title: notification.title || "DRIVEX",
        body: notification.body || "",
        data: payload.data || {}
      });
    });
    return unsubscribe;
  }

  // Показывает браузерное уведомление (fallback когда Firebase недоступен)
  function showLocalNotification(title, body, data = {}) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const note = new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: data.tag || "drivex",
      data
    });
    if (data.url) {
      note.onclick = () => { window.focus(); window.location.href = data.url; };
    }
  }

  // Отправляет токен в Supabase для хранения
  async function registerTokenForUser(userId) {
    if (!userId) return;
    let token = currentToken || (await requestPermissionAndGetToken());
    if (!token) return;

    const supa = window.DrivexSupabaseData;
    if (supa) {
      await supa.saveFcmToken(userId, token).catch(() => {});
    } else {
      // Прямой запрос
      const client = window.__DRIVEX_SUPABASE_CLIENT__;
      if (client) {
        await client
          .from("users")
          .update({ fcm_token: token })
          .eq("id", userId)
          .catch(() => {});
      }
    }
  }

  window.DrivexPush = {
    isConfigured,
    init: initFirebase,
    requestPermission: requestPermissionAndGetToken,
    onForegroundMessage,
    showLocalNotification,
    registerTokenForUser,
    getToken: () => currentToken
  };

  // Авто-инициализация когда DOM готов
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initFirebase());
  } else {
    initFirebase();
  }
})();
