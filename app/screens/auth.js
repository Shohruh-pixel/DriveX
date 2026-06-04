// auth.js
(() => {
  'use strict';
  const DX = window.DX;
  const html = DX.html;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon = DX.Icon;
  const alphaBg = DX.alphaBg;

  function BuyerAuthScreen({ mode = "register", authStatus, onLogin, onRegister, onPhoneAuth, onGuest }) {
    const toast = useToast();
    const phoneAuth = window.DrivexPhoneAuth;
    const botName = (phoneAuth && phoneAuth.BOT_NAME) || "DriiiveX_Bot";

    // step: "role" | "phone" | "otp" | "profile" | "car"
    const [step, setStep] = useState("role");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpMethod, setOtpMethod] = useState("server");
    const [otpTestCode, setOtpTestCode] = useState("");
    const [needTelegram, setNeedTelegram] = useState(false);
    const [botNameState, setBotNameState] = useState(botName);
    const [fullName, setFullName] = useState("");
    const [carMake, setCarMake] = useState("");
    const [carModel, setCarModel] = useState("");
    const [carYear, setCarYear] = useState("");
    const [busy, setBusy] = useState(false);
    const [verifiedPhone, setVerifiedPhone] = useState("");
    const [verifiedUserId, setVerifiedUserId] = useState("");

    const carOptions = [
      { make: "Toyota",  models: ["Camry", "Corolla", "RAV4", "Prius", "Land Cruiser"] },
      { make: "Chevrolet", models: ["Nexia", "Cobalt", "Lacetti", "Captiva"] },
      { make: "Hyundai", models: ["Elantra", "Tucson", "Santa Fe", "Accent", "Sonata"] },
      { make: "Kia",     models: ["Rio", "Sportage", "Ceed", "Optima"] },
      { make: "Daewoo",  models: ["Matiz", "Nexia", "Lacetti"] },
      { make: "BMW",     models: ["3 Series", "5 Series", "7 Series", "X5"] },
      { make: "Mercedes",models: ["C-Class", "E-Class", "S-Class", "GLE"] },
      { make: "Другое",  models: ["Другая модель"] }
    ];

    const selectedMakeModels = (carOptions.find((o) => o.make === carMake) || carOptions[0]).models;

    const handleSendOtp = useCallback(async (e) => {
      e.preventDefault();
      if (busy) return;
      const cleanPhone = String(phone || "").trim();
      if (!cleanPhone || cleanPhone.replace(/\D/g, "").length < 9) {
        toast.push("Введите корректный номер");
        return;
      }
      setBusy(true);
      try {
        const result = phoneAuth
          ? await phoneAuth.sendOtp(cleanPhone)
          : await fetch("/api/otp/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: cleanPhone })
            }).then((r) => r.json());

        if (result.needTelegram) {
          setNeedTelegram(true);
          setBotNameState(result.botName || botName);
        }
        if (result.testCode) {
          setOtpTestCode(result.testCode);
          toast.push(`DEV: код ${result.testCode}`);
        }
        setOtpMethod(result.method || "server");
        setStep("otp");
      } catch (err) {
        toast.push(err?.message || "Не удалось отправить код");
      } finally {
        setBusy(false);
      }
    }, [busy, phone, phoneAuth, toast]);

    const handleVerifyOtp = useCallback(async (e) => {
      e.preventDefault();
      if (busy) return;
      const code = String(otp || "").trim();
      if (code.length !== 6) { toast.push("Введите 6-значный код"); return; }
      setBusy(true);
      try {
        const result = phoneAuth
          ? await phoneAuth.verifyOtp(phone, code, otpMethod)
          : await fetch("/api/otp/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone, code })
            }).then((r) => r.json().then((d) => { if (!r.ok) throw new Error(d.error); return d; }));

        setVerifiedPhone(phone);
        setVerifiedUserId(result.userId || "");

        // Если Supabase вернул сессию — применяем через loginBuyer-callback
        if (result.session || result.access_token) {
          const client = getSupabaseClient();
          if (client && result.session) {
            const { data } = await client.auth.setSession({
              access_token: result.session.access_token,
              refresh_token: result.session.refresh_token
            });
            const session = makeBuyerSessionFromSupabaseUser(data?.user);
            if (onLogin) await onLogin({ _supabaseSession: session }).catch(() => {});
            navigateToHash("/");
            return;
          }
        }
        setStep("profile");
      } catch (err) {
        toast.push(err?.message || "Неверный код");
      } finally {
        setBusy(false);
      }
    }, [busy, otp, otpMethod, phone, phoneAuth, onLogin, toast]);

    const handleSaveProfile = useCallback(async (e) => {
      e.preventDefault();
      if (busy) return;
      const name = String(fullName || "").trim();
      if (!name) { toast.push("Введите ваше имя"); return; }
      setBusy(true);
      try {
        if (onPhoneAuth) {
          const res = await onPhoneAuth({ phone: verifiedPhone, name, userId: verifiedUserId });
          // Если onPhoneAuth выполнил вход и вернул сессию/идентификатор — не продолжаем шаги
          if (res && (res._supabaseSession || res.session || res.userId || res.user?.id)) {
            return;
          }
        } else if (onRegister) {
          await onRegister({ phone: verifiedPhone, name, email: "", password: "", role: "buyer" });
        }
        setStep("car");
      } catch (err) {
        toast.push(err?.message || "Не удалось сохранить профиль");
      } finally {
        setBusy(false);
      }
    }, [busy, fullName, onPhoneAuth, onRegister, verifiedPhone, verifiedUserId, toast]);

    const handleSkipCar = useCallback(() => navigateToHash("/"), []);

    const handleAddCar = useCallback(async (e) => {
      e.preventDefault();
      if (busy) return;
      if (!carMake || !carModel) { toast.push("Выберите марку и модель"); return; }
      setBusy(true);
      try {
        if (onPhoneAuth) {
          const res = await onPhoneAuth({
            phone: verifiedPhone,
            name: fullName,
            userId: verifiedUserId,
            car: { make: carMake, model: carModel, year: carYear }
          });
          // Если вход произошёл внутри onPhoneAuth — не выполняем дополнительную навигацию
          if (res && (res._supabaseSession || res.session || res.userId || res.user?.id)) {
            return;
          }
        }
        navigateToHash("/garage");
      } catch (err) {
        toast.push(err?.message || "Не удалось добавить авто");
      } finally {
        setBusy(false);
      }
    }, [busy, carMake, carModel, carYear, fullName, onPhoneAuth, verifiedPhone, verifiedUserId, toast]);

    const stepDots = ["role", "phone", "otp", "profile", "car"];
    const stepIndex = stepDots.indexOf(step);

    return html`
      <div className="min-h-screen flex items-center px-6 py-10" style=${{ background: "var(--drivex-black)" }}>
        <div className="w-full space-y-5">
          <!-- Header -->
          <div className="text-center">
            <p className="text-xs font-semibold" style=${{ color: "var(--drivex-neon-cyan)", letterSpacing: "0.18em" }}>
              DRIVEX
            </p>
            <h1 className="text-3xl font-bold mt-3" style=${{ color: "var(--drivex-white)" }}>
              ${step === "role"    ? "Добро пожаловать"
                : step === "phone" ? "Вход по телефону"
                : step === "otp" ? "Введите код"
                : step === "profile" ? "Ваш профиль"
                : "Добавить авто"}
            </h1>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
              ${step === "role"    ? "Выберите как вы хотите продолжить"
                : step === "phone" ? "Введите номер — получите код в @DriiiveX_Bot"
                : step === "otp"   ? `Код отправлен на ${phone}`
                : step === "profile" ? "Как вас зовут?"
                : "Укажите ваш автомобиль (или пропустите)"}
            </p>
            <!-- Stepper dots -->
            <div className="flex justify-center gap-2 mt-4">
              ${stepDots.map((s, i) => html`
                <div key=${s} style=${{
                  width: i === stepIndex ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i <= stepIndex ? "var(--drivex-neon-cyan)" : "rgba(255,255,255,0.15)",
                  transition: "all 0.3s"
                }} />
              `)}
            </div>
          </div>

          <!-- Step: Role — выбор роли + гость -->
          ${step === "role" ? html`
            <div className="glass-card-light rounded-3xl p-5 space-y-3">
              <!-- Войти как пользователь -->
              <button
                type="button"
                className="w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all"
                style=${{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)" }}
                onClick=${() => setStep("phone")}
              >
                <span style=${{ fontSize: "28px" }}>🚗</span>
                <div>
                  <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>Я автовладелец</p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Маркетплейс, сервисы, гараж, документы
                  </p>
                </div>
              </button>

              <!-- Войти как продавец -->
              <button
                type="button"
                className="w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all"
                style=${{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)" }}
                onClick=${() => navigateToHash("/partner/register")}
              >
                <span style=${{ fontSize: "28px" }}>🏪</span>
                <div>
                  <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>Я продавец</p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Открыть магазин в маркетплейсе DRIVEX
                  </p>
                </div>
              </button>

              <!-- Войти как сервисный центр -->
              <button
                type="button"
                className="w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all"
                style=${{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
                onClick=${() => navigateToHash("/partner/login")}
              >
                <span style=${{ fontSize: "28px" }}>🔧</span>
                <div>
                  <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>Я сервисный центр</p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    СТО, мойка, детейлинг — партнёрский кабинет
                  </p>
                </div>
              </button>

              <!-- Гость -->
              <button
                type="button"
                className="w-full py-3 rounded-2xl text-sm font-semibold"
                style=${{ color: "var(--drivex-silver)", background: "transparent", border: "1px solid rgba(255,255,255,0.08)" }}
                onClick=${() => {
                  if (onGuest) onGuest();
                  else navigateToHash("/");
                }}
              >
                Войти как гость →
              </button>

              <p className="text-center text-xs pt-1" style=${{ color: "var(--drivex-silver)", opacity: 0.6 }}>
                Гость может смотреть каталог и сервисы. Регистрация нужна для заказов и гаража.
              </p>
            </div>
          ` : null}

          <!-- Step: Phone -->
          ${step === "phone" ? html`
            <form className="glass-card-light rounded-3xl p-5 space-y-4" onSubmit=${handleSendOtp}>
              <label className="block">
                <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>Номер телефона</span>
                <input
                  type="tel"
                  className="w-full mt-2 p-4 rounded-2xl dx-input text-xl tracking-wider"
                  value=${phone}
                  onInput=${(e) => setPhone(e.target.value)}
                  placeholder="+992 XX XXX XXXX"
                  autocomplete="tel"
                  autofocus
                />
              </label>
              <div className="flex items-center gap-3 px-1">
                <span style=${{ fontSize: "22px" }}>✈️</span>
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  Код придёт в <strong style=${{ color: "var(--drivex-neon-cyan)" }}>Telegram</strong> —
                  напишите боту <strong>@${botNameState}</strong> свой номер заранее
                </p>
              </div>
              <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy}>
                ${busy ? "Отправляем..." : "Получить код"}
              </button>
            </form>
          ` : null}

          <!-- Step: OTP -->
          ${step === "otp" ? html`
            <form className="glass-card-light rounded-3xl p-5 space-y-4" onSubmit=${handleVerifyOtp}>
              ${needTelegram ? html`
                <div className="rounded-2xl p-4" style=${{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
                  <p className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
                    Напишите @${botNameState} в Telegram
                  </p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Отправьте боту номер <strong>${phone}</strong> — он пришлёт код сюда.
                  </p>
                </div>
              ` : null}
              ${otpTestCode ? html`
                <div className="rounded-2xl p-3 text-center" style=${{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                  <p className="text-xs" style=${{ color: "#fbbf24" }}>DEV-режим: код <strong>${otpTestCode}</strong></p>
                </div>
              ` : null}
              <label className="block">
                <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>6-значный код</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  className="w-full mt-2 p-4 rounded-2xl dx-input text-3xl text-center tracking-[0.5em] font-bold"
                  value=${otp}
                  onInput=${(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  autofocus
                />
              </label>
              <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy || otp.length < 6}>
                ${busy ? "Проверяем..." : "Подтвердить"}
              </button>
              <button type="button"
                className="w-full py-3 rounded-2xl text-sm font-semibold"
                style=${{ color: "var(--drivex-silver)", background: "transparent" }}
                onClick=${() => { setStep("phone"); setOtp(""); setOtpTestCode(""); setNeedTelegram(false); }}
              >
                ← Изменить номер
              </button>
            </form>
          ` : null}

          <!-- Step: Profile -->
          ${step === "profile" ? html`
            <form className="glass-card-light rounded-3xl p-5 space-y-4" onSubmit=${handleSaveProfile}>
              <label className="block">
                <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>Ваше имя</span>
                <input
                  type="text"
                  className="w-full mt-2 p-4 rounded-2xl dx-input"
                  value=${fullName}
                  onInput=${(e) => setFullName(e.target.value)}
                  placeholder="Имя и фамилия"
                  autocomplete="name"
                  autofocus
                />
              </label>
              <p className="text-xs px-1" style=${{ color: "var(--drivex-silver)" }}>
                Телефон: <strong style=${{ color: "var(--drivex-white)" }}>${verifiedPhone}</strong> подтверждён ✓
              </p>
              <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy || !fullName.trim()}>
                ${busy ? "Сохраняем..." : "Продолжить →"}
              </button>
            </form>
          ` : null}

          <!-- Step: Car -->
          ${step === "car" ? html`
            <form className="glass-card-light rounded-3xl p-5 space-y-4" onSubmit=${handleAddCar}>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>Марка</span>
                  <select
                    className="w-full mt-2 p-4 rounded-2xl dx-input"
                    value=${carMake}
                    onChange=${(e) => { setCarMake(e.target.value); setCarModel(""); }}
                  >
                    <option value="">Выбрать...</option>
                    ${carOptions.map((o) => html`<option key=${o.make} value=${o.make}>${o.make}</option>`)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>Модель</span>
                  <select
                    className="w-full mt-2 p-4 rounded-2xl dx-input"
                    value=${carModel}
                    onChange=${(e) => setCarModel(e.target.value)}
                    disabled=${!carMake}
                  >
                    <option value="">Выбрать...</option>
                    ${selectedMakeModels.map((m) => html`<option key=${m} value=${m}>${m}</option>`)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)" }}>Год выпуска</span>
                <input
                  type="number"
                  className="w-full mt-2 p-4 rounded-2xl dx-input"
                  value=${carYear}
                  onInput=${(e) => setCarYear(e.target.value)}
                  placeholder="2018"
                  min="1990"
                  max=${new Date().getFullYear()}
                />
              </label>
              <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy || !carMake || !carModel}>
                ${busy ? "Добавляем..." : "Добавить авто"}
              </button>
              <button type="button"
                className="w-full py-3 rounded-2xl text-sm font-semibold"
                style=${{ color: "var(--drivex-silver)", background: "transparent" }}
                onClick=${handleSkipCar}
              >
                Пропустить →
              </button>
            </form>
          ` : null}
        </div>
      </div>
    `;
  }

  // Псевдоним для совместимости с кодом где используется BuyerPhoneAuthScreen
  const BuyerPhoneAuthScreen = BuyerAuthScreen;

  // ── Экспорт в DX.screens для app.js ──────────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.BuyerAuthScreen = BuyerAuthScreen;
})();
