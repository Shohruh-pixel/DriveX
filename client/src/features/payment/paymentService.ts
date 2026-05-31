/**
 * Платёжная интеграция: Alif Pay / PAYNET (Таджикистан)
 * - PAYNET:   https://merchant.paynet.tj → API настройки
 * - Alif Pay: запрос в отдел API Alif Bank
 */

const PAYNET_URL      = import.meta.env.VITE_PAYNET_URL       || "https://api.paynet.tj/v1";
const PAYNET_MERCHANT = import.meta.env.VITE_PAYNET_MERCHANT  || "";
const PAYNET_SECRET   = import.meta.env.VITE_PAYNET_SECRET    || "";

const ALIF_URL        = import.meta.env.VITE_ALIF_URL         || "https://alif.tj/api/pay";
const ALIF_MERCHANT   = import.meta.env.VITE_ALIF_MERCHANT    || "";
const ALIF_SECRET     = import.meta.env.VITE_ALIF_SECRET      || "";

export const isPaynetConfigured = Boolean(PAYNET_MERCHANT && PAYNET_SECRET);
export const isAlifConfigured   = Boolean(ALIF_MERCHANT   && ALIF_SECRET);
export const isPaymentAvailable = isPaynetConfigured || isAlifConfigured;

export interface PaymentPayload {
  orderId:     string;
  amount:      number;        // сомони
  description: string;
  phone?:      string;
  returnUrl?:  string;
}

export interface PaymentResult {
  method:  "paynet" | "alif" | "mock";
  url?:    string;
  transactionId?: string;
  mock?:   boolean;
  message?: string;
}

// HMAC-SHA256 подпись через Web Crypto API
async function sign(payload: string, secret: string): Promise<string> {
  if (!window.crypto?.subtle) return "";
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await window.crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Создать платёж PAYNET
export async function createPaynetPayment(p: PaymentPayload): Promise<PaymentResult> {
  if (!isPaynetConfigured) return { method: "paynet", mock: true, message: "PAYNET не настроен" };

  const body = {
    merchant_id: PAYNET_MERCHANT,
    order_id: p.orderId,
    amount: Math.round(p.amount * 100), // тийины
    currency: "TJS",
    description: p.description,
    return_url: p.returnUrl || `${window.location.origin}/?payment=success`,
    cancel_url:  `${window.location.origin}/?payment=cancel`,
  };
  const signature = await sign(JSON.stringify(body), PAYNET_SECRET);

  const res = await fetch(`${PAYNET_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Merchant-Id": PAYNET_MERCHANT, "X-Signature": signature },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "PAYNET: ошибка");
  return { method: "paynet", url: data.payment_url, transactionId: data.payment_id };
}

// Создать платёж Alif Pay
export async function createAlifPayment(p: PaymentPayload): Promise<PaymentResult> {
  if (!isAlifConfigured) return { method: "alif", mock: true, message: "Alif Pay не настроен" };

  const res = await fetch(`${ALIF_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ALIF_SECRET}` },
    body: JSON.stringify({ merchant_id: ALIF_MERCHANT, order_id: p.orderId, amount: p.amount, currency: "TJS", description: p.description, customer_phone: p.phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Alif Pay: ошибка");
  return { method: "alif", url: data.redirect_url, transactionId: data.transaction_id };
}

// Универсальный checkout — выбирает доступный шлюз
export async function startCheckout(payload: PaymentPayload): Promise<PaymentResult> {
  // 1. Пробуем Alif Pay
  if (isAlifConfigured) {
    const result = await createAlifPayment(payload);
    if (result.url) { window.open(result.url, "_blank", "width=480,height=640"); return result; }
  }
  // 2. Пробуем PAYNET
  if (isPaynetConfigured) {
    const result = await createPaynetPayment(payload);
    if (result.url) { window.open(result.url, "_blank", "width=480,height=640"); return result; }
  }
  // 3. Mock-режим
  console.info("[payment] Mock checkout:", payload);
  return {
    method: "mock", mock: true,
    message: `Оплата в тестовом режиме. Сумма: ${payload.amount} сомони. Настройте PAYNET или Alif Pay в .env`,
  };
}
