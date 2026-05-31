/**
 * Firebase Cloud Messaging — Push уведомления
 * Использует firebase-compat API (тот же что в firebase-push.js)
 */

declare global {
  interface Window {
    firebase?: {
      apps: unknown[];
      initializeApp: (config: object) => void;
      messaging?: () => {
        getToken: (opts: object) => Promise<string>;
        onMessage: (cb: (payload: unknown) => void) => () => void;
      };
    };
  }
}

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyDG0m8-mofXLV3UAlHUlYYn-BRMP5TyMEc",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "drivex-5cb79.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "drivex-5cb79",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "drivex-5cb79.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| "452007655844",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:452007655844:web:c5ca911a2248448cd52931",
  vapidKey:          import.meta.env.VITE_FIREBASE_VAPID_KEY          || "BNuSaNngyluJtHBhuTji5Vr42SMl3YyvEve-JE-uDwZojQ3Tvx1D4_HbtiwGWCWOox9UEmvTIblTAJd2ouxuKRk",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let messaging: any = null;

export async function initPush(): Promise<boolean> {
  if (!window.firebase) return false;
  try {
    if (!window.firebase.apps?.length) {
      window.firebase.initializeApp(FIREBASE_CONFIG);
    }
    if (!window.firebase.messaging) return false;
    messaging = window.firebase.messaging();
    return true;
  } catch (err) {
    console.warn("[push] Firebase init error:", err);
    return false;
  }
}

export async function requestPushPermission(): Promise<string | null> {
  if (!("Notification" in window)) return null;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return null;

  if (!messaging) await initPush();
  if (!messaging) return null;

  try {
    const token = await messaging.getToken({ vapidKey: FIREBASE_CONFIG.vapidKey });
    return token;
  } catch (err) {
    console.warn("[push] getToken error:", err);
    return null;
  }
}

export function onForegroundMessage(callback: (title: string, body: string) => void): () => void {
  if (!messaging) return () => {};
  return messaging.onMessage((payload: unknown) => {
    const p = payload as { notification?: { title?: string; body?: string } };
    callback(p.notification?.title ?? "DRIVEX", p.notification?.body ?? "");
  });
}

// Локальное уведомление (без Firebase)
export function showLocalNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/icons/icon-192.png", tag: "drivex" });
}

// Сохранить FCM токен в Supabase
export async function saveFcmToken(userId: string, token: string) {
  if (!userId || !token) return;
  const { getSupabase, isSupabaseConfigured } = await import("@shared/api/supabase");
  if (!isSupabaseConfigured) return;
  try {
    await getSupabase().from("users").update({ fcm_token: token }).eq("id", userId);
  } catch { /* ignore */ }
}
