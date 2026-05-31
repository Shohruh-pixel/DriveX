// Supabase configuration. Вставлен публичный anon key.
window.DRIVEX_SUPABASE_CONFIG = window.DRIVEX_SUPABASE_CONFIG || {
  url: "https://fppczriwvbflrhnorgqv.supabase.co",
  anonKey: "sb_publishable_NmqZT7hxynolWR00ux_hkA_mEpzEKFg",
  // Бакеты Supabase Storage
  storageBucket: "seller-assets",
  buckets: {
    productImages: "product-images",
    servicePhotos: "service-photos",
    userAvatars:   "user-avatars",
    documents:     "documents"
  }
};

// ──────────────────────────────────────────────────────
// Firebase Cloud Messaging (замените на ваши значения)
// Firebase Console → Project settings → General → Web app
// ──────────────────────────────────────────────────────
window.DRIVEX_FIREBASE_API_KEY            = "AIzaSyDG0m8-mofXLV3UAlHUlYYn-BRMP5TyMEc";
window.DRIVEX_FIREBASE_AUTH_DOMAIN        = "drivex-5cb79.firebaseapp.com";
window.DRIVEX_FIREBASE_PROJECT_ID         = "drivex-5cb79";
window.DRIVEX_FIREBASE_STORAGE_BUCKET     = "drivex-5cb79.firebasestorage.app";
window.DRIVEX_FIREBASE_MESSAGING_SENDER_ID = "452007655844";
window.DRIVEX_FIREBASE_APP_ID             = "1:452007655844:web:c5ca911a2248448cd52931";
window.DRIVEX_FIREBASE_VAPID_KEY          = "BNuSaNngyluJtHBhuTji5Vr42SMl3YyvEve-JE-uDwZojQ3Tvx1D4_HbtiwGWCWOox9UEmvTIblTAJd2ouxuKRk"; // Web Push certificate → Key pair

// ──────────────────────────────────────────────────────
// Платёжные шлюзы (замените на ваши ключи)
// PAYNET: https://merchant.paynet.tj → API настройки
// Alif:   запрос через отдел API Alif Bank
// ──────────────────────────────────────────────────────
window.DRIVEX_PAYMENT_CONFIG = {
  // PAYNET
  paynetUrl:        "https://api.paynet.tj/v1",
  paynetMerchantId: "",
  paynetSecretKey:  "",
  // Alif Pay
  alifUrl:          "https://alif.tj/api/pay",
  alifMerchantId:   "",
  alifSecretKey:    "",
  // Telegram Bot (для OTP)
  // telegramBotToken must NOT be set here — set TELEGRAM_BOT_TOKEN in .env on the server only
  telegramBotToken: "",
  telegramBotName:  "DriiiveX_Bot"
};
