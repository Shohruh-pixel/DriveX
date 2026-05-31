// DRIVEX — Phone + Telegram OTP auth service
// Бот: @DriiiveX_Bot
// window.DrivexPhoneAuth
(() => {
  const BOT_NAME = "DriiiveX_Bot";

  function getSupabaseClient() {
    if (window.__DRIVEX_SUPABASE_CLIENT__) return window.__DRIVEX_SUPABASE_CLIENT__;
    const cfg = window.DRIVEX_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || !window.supabase) return null;
    window.__DRIVEX_SUPABASE_CLIENT__ = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return window.__DRIVEX_SUPABASE_CLIENT__;
  }

  function normalizePhone(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    if (!digits) return "";
    // Таджикистан +992XXXXXXXXX (12 цифр с кодом страны)
    if (digits.startsWith("992") && digits.length === 12) return `+${digits}`;
    // Россия +7XXXXXXXXXX (11 цифр)
    if ((digits.startsWith("7") || digits.startsWith("8")) && digits.length === 11)
      return `+7${digits.slice(1)}`;
    // Узбекистан +998
    if (digits.startsWith("998") && digits.length === 12) return `+${digits}`;
    // 9-значный номер → добавляем +992
    if (digits.length === 9) return `+992${digits}`;
    // Уже с кодом страны
    if (digits.length >= 11) return `+${digits}`;
    return `+${digits}`;
  }

  // ─── Шаг 1: Отправить OTP ────────────────────────────────────────────
  async function sendOtp(phoneRaw) {
    const phone = normalizePhone(phoneRaw);
    if (!phone || phone.replace(/\D/g, "").length < 9) {
      throw new Error("Введите корректный номер телефона");
    }

    const client = getSupabaseClient();

    // Пробуем Supabase Phone OTP (требует Twilio в настройках Supabase)
    if (client) {
      try {
        const { error } = await client.auth.signInWithOtp({ phone });
        if (!error) {
          return { phone, method: "supabase", botName: BOT_NAME };
        }
        // Если phone provider не включён — игнорируем и идём дальше
        if (error.message && (
          error.message.includes("Unsupported") ||
          error.message.includes("provider") ||
          error.message.includes("not enabled") ||
          error.message.includes("SMS")
        )) {
          console.info("[auth-phone] Supabase phone not enabled, trying server OTP");
        } else {
          throw new Error(error.message);
        }
      } catch (err) {
        // Если это ошибка сети или phone не настроен — идём к серверному OTP
        if (!err.message?.includes("Unsupported") &&
            !err.message?.includes("provider") &&
            !err.message?.includes("not enabled") &&
            !err.message?.includes("SMS") &&
            !err.message?.includes("fetch")) {
          throw err;
        }
      }
    }

    // Серверный OTP (/api/otp/send) — работает когда запущен npm start
    const isFileProtocol = window.location.protocol === "file:";
    if (isFileProtocol) {
      // В режиме file:// сервер недоступен — используем dev-код
      return sendDevOtp(phone);
    }

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Не удалось отправить код");

      return {
        phone,
        method: "server",
        botName: BOT_NAME,
        needTelegram: payload.needTelegram || false,
        testCode: payload.testCode,    // только в dev-режиме сервера
        message: payload.message
      };
    } catch (err) {
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        // Сервер не запущен — dev-fallback
        return sendDevOtp(phone);
      }
      throw err;
    }
  }

  // Dev-режим: генерируем код прямо на клиенте (только для разработки!)
  function sendDevOtp(phone) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    // Сохраняем в sessionStorage для последующей проверки
    try { sessionStorage.setItem(`drivex_dev_otp_${phone.replace(/\D/g,"")}`, code); } catch {}
    console.info(`[auth-phone] DEV OTP for ${phone}: ${code}`);
    return {
      phone,
      method: "dev",
      botName: BOT_NAME,
      testCode: code,
      dev: true,
      message: "DEV: сервер не запущен. Запустите: npm start"
    };
  }

  // ─── Шаг 2: Проверить OTP ────────────────────────────────────────────
  async function verifyOtp(phoneRaw, code, method) {
    const phone = normalizePhone(phoneRaw);
    const client = getSupabaseClient();

    if (method === "supabase" && client) {
      const { data, error } = await client.auth.verifyOtp({
        phone,
        token: code,
        type: "sms"
      });
      if (error) throw new Error(error.message || "Неверный код");
      return { userId: data?.user?.id, session: data?.session };
    }

    if (method === "dev") {
      // Dev-режим: проверяем sessionStorage
      const stored = sessionStorage.getItem(`drivex_dev_otp_${phone.replace(/\D/g,"")}`);
      if (!stored || stored !== code) throw new Error("Неверный код");
      sessionStorage.removeItem(`drivex_dev_otp_${phone.replace(/\D/g,"")}`);

      // Создаём анонимную Supabase-сессию или пропускаем
      if (client) {
        // Пробуем создать пользователя через email (временное решение для dev)
        const tempEmail = `phone_${phone.replace(/\D/g, "")}@drivex.app`;
        const tempPassword = `dx_${phone.replace(/\D/g, "")}_2026`;
        let userId = null;

        // Пробуем зарегистрироваться
        const { data: signUpData } = await client.auth.signUp({
          email: tempEmail,
          password: tempPassword,
          options: {
            data: { phone, role: "buyer", full_name: "" }
          }
        });

        if (signUpData?.user) {
          userId = signUpData.user.id;
        } else {
          // Уже есть — логинимся
          const { data: signInData } = await client.auth.signInWithPassword({
            email: tempEmail,
            password: tempPassword
          });
          userId = signInData?.user?.id;
        }

        return { userId, session: null, devMode: true };
      }
      return { userId: `dev-${phone.replace(/\D/g, "")}`, session: null, devMode: true };
    }

    // Серверная проверка
    if (window.location.protocol === "file:") {
      throw new Error("Запустите сервер: npm start (или node server.js)");
    }

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || "Неверный код");

    // Если сервер вернул Supabase-сессию — устанавливаем
    if (payload.access_token && client) {
      const { data: sessionData } = await client.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token || ""
      }).catch(() => ({ data: {} }));
      return { userId: sessionData?.user?.id, session: sessionData?.session };
    }

    return { userId: payload.userId, session: null };
  }

  // ─── Сохранить машину пользователя ───────────────────────────────────
  async function saveCarToProfile(userId, car) {
    const client = getSupabaseClient();
    if (!client || !userId) return;
    const { data: profile } = await client.from("users").select("cars").eq("id", userId).single();
    const existingCars = Array.isArray(profile?.cars) ? profile.cars : [];
    const newCar = {
      id: car.id || `car-${Date.now()}`,
      make: car.make || "",
      model: car.model || "",
      year: car.year || "",
      color: car.color || "",
      plate: car.plate || "",
      addedAt: new Date().toISOString()
    };
    const updatedCars = [newCar, ...existingCars.filter((c) => c.id !== newCar.id)];
    await client.from("users").upsert(
      { id: userId, cars: updatedCars, active_car_id: newCar.id, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    ).catch(() => {});
    return newCar;
  }

  window.DrivexPhoneAuth = {
    normalizePhone,
    sendOtp,
    verifyOtp,
    saveCarToProfile,
    BOT_NAME
  };
})();
