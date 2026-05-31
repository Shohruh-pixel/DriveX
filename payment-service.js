// DRIVEX — Платёжная интеграция: Alif Pay / PAYNET (Таджикистан)
// Документация PAYNET: https://docs.paynet.tj
// Alif Pay API: запросить у отдела API Alif Bank

(() => {
  const cfg = window.DRIVEX_PAYMENT_CONFIG || {};

  // ──────────────────────────────────────────
  // PAYNET
  // ──────────────────────────────────────────
  const PAYNET = {
    baseUrl: cfg.paynetUrl || "https://api.paynet.tj/v1",
    merchantId: cfg.paynetMerchantId || "",
    secretKey: cfg.paynetSecretKey || "",
    isConfigured: Boolean(cfg.paynetMerchantId && cfg.paynetSecretKey)
  };

  // ──────────────────────────────────────────
  // ALIF PAY
  // ──────────────────────────────────────────
  const ALIF = {
    baseUrl: cfg.alifUrl || "https://alif.tj/api/pay",
    merchantId: cfg.alifMerchantId || "",
    secretKey: cfg.alifSecretKey || "",
    isConfigured: Boolean(cfg.alifMerchantId && cfg.alifSecretKey)
  };

  // Создать платёж через PAYNET
  async function createPaynetPayment({ orderId, amount, description, returnUrl }) {
    if (!PAYNET.isConfigured) {
      console.warn("[payment] PAYNET не настроен");
      return null;
    }
    const body = {
      merchant_id: PAYNET.merchantId,
      order_id: orderId,
      amount: Math.round(amount * 100), // в тийинах
      currency: "TJS",
      description: description || `Заказ DRIVEX #${orderId}`,
      return_url: returnUrl || window.location.origin + "/payment/success",
      cancel_url: returnUrl || window.location.origin + "/payment/cancel"
    };

    const res = await fetch(`${PAYNET.baseUrl}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": PAYNET.merchantId,
        "X-Signature": await signPayload(JSON.stringify(body), PAYNET.secretKey)
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "PAYNET: ошибка создания платежа");
    return data; // { payment_url, payment_id }
  }

  // Создать платёж через ALIF PAY
  async function createAlifPayment({ orderId, amount, description, phone }) {
    if (!ALIF.isConfigured) {
      console.warn("[payment] Alif Pay не настроен");
      return null;
    }
    const body = {
      merchant_id: ALIF.merchantId,
      order_id: orderId,
      amount,
      currency: "TJS",
      description: description || `DRIVEX заказ #${orderId}`,
      customer_phone: phone || ""
    };

    const res = await fetch(`${ALIF.baseUrl}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ALIF.secretKey}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Alif Pay: ошибка");
    return data; // { redirect_url, transaction_id }
  }

  // Открывает checkout попап/редирект
  async function startCheckout({ orderId, amount, description, phone, method = "auto" }) {
    const supa = window.DrivexSupabaseData;

    // Пробуем подходящий метод
    let paymentData = null;
    const preferredMethod = method === "auto"
      ? (ALIF.isConfigured ? "alif" : PAYNET.isConfigured ? "paynet" : "mock")
      : method;

    if (preferredMethod === "alif") {
      paymentData = await createAlifPayment({ orderId, amount, description, phone });
    } else if (preferredMethod === "paynet") {
      paymentData = await createPaynetPayment({ orderId, amount, description });
    }

    if (paymentData?.redirect_url || paymentData?.payment_url) {
      const url = paymentData.redirect_url || paymentData.payment_url;
      window.open(url, "_blank", "width=480,height=640");
      return { method: preferredMethod, url, transactionId: paymentData.transaction_id || paymentData.payment_id };
    }

    // Мок-режим для разработки
    console.info(`[payment] Мок checkout: orderId=${orderId}, amount=${amount} TJS`);
    return {
      method: "mock",
      mock: true,
      orderId,
      amount,
      message: "Оплата в тестовом режиме. Настройте PAYNET или Alif Pay в DRIVEX_PAYMENT_CONFIG."
    };
  }

  // Проверить статус платежа
  async function checkPaymentStatus(paymentId, provider = "paynet") {
    if (provider === "alif") {
      if (!ALIF.isConfigured) return null;
      const res = await fetch(`${ALIF.baseUrl}/status/${paymentId}`, {
        headers: { Authorization: `Bearer ${ALIF.secretKey}` }
      });
      return await res.json();
    }
    if (!PAYNET.isConfigured) return null;
    const res = await fetch(`${PAYNET.baseUrl}/status/${paymentId}`, {
      headers: { "X-Merchant-Id": PAYNET.merchantId }
    });
    return await res.json();
  }

  // HMAC-SHA256 подпись (простая реализация для фронтенда)
  async function signPayload(payload, secret) {
    if (!window.crypto?.subtle) return "";
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await window.crypto.subtle.sign("HMAC", key, enc.encode(payload));
    return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  window.DrivexPayment = {
    startCheckout,
    createPaynetPayment,
    createAlifPayment,
    checkPaymentStatus,
    isAlifConfigured: ALIF.isConfigured,
    isPaynetConfigured: PAYNET.isConfigured,
    isAnyConfigured: ALIF.isConfigured || PAYNET.isConfigured
  };
})();
