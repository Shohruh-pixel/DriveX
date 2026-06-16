// DRIVEX Seller — редизайн онбординга, входа и регистрации (handoff design_handoff_drivex_seller)
// Загружается ПОСЛЕ seller-crm.js и переопределяет одноимённые экраны в DX.screens.
// Дизайн-система: Manrope + зелёный акцент, всё scoped под .sx (см. .sx-* в app.css).
(() => {
  'use strict';
  window.DX = window.DX || {};
  const DX = window.DX;
  const html = DX.html;
  const React = DX.React;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  function useToast() { return DX.useToast ? DX.useToast() : { push() {} }; }
  const navigateToHash = function (p) { DX.navigateToHash && DX.navigateToHash(p); };

  const KHUJAND_CENTER = [40.2837, 69.6222];
  const DRAFT_KEY = "drivex.seller.reg.draft.v2";

  // Города: Согдийская область + Душанбе
  const CITY_OPTIONS = [
    "Худжанд",
    "Душанбе",
    "Зафаробод",
    "Спитамен",
    "Джаббор-Расулов",
    "Истаравшан",
    "Деваштич",
    "Конибодом",
    "Исфара",
    "Мастчох",
    "Ашт",
    "Шахристон",
    "Айни"
  ];

  // ── Иконки (stroke-SVG, 1.6–2px) ────────────────────────────────────
  function IconBack() {
    return html`<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2.5 4.5 7 9 11.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`;
  }
  function IconArrow() {
    return html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`;
  }
  function IconChevronDown() {
    return html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="#9AA3B5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`;
  }
  function IconPlus() {
    return html`<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
    </svg>`;
  }
  function IconCheck() {
    return html`<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5 5.5 10.5 11.5 3.5" stroke="var(--sx-acc1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`;
  }

  // ── Общие элементы ──────────────────────────────────────────────────
  function SxLogo({ size = 56 }) {
    return html`<div className="sx-logo" style=${{ width: `${size}px`, height: `${size}px`, borderRadius: `${size * 0.3}px`, fontSize: `${size * 0.34}px` }}>DX</div>`;
  }

  function SxBack({ label, onClick }) {
    return html`<button type="button" className="sx-back" onClick=${onClick}>
      <${IconBack} /><span>${label}</span>
    </button>`;
  }

  function SxCta({ children, onClick, type = "button", disabled = false }) {
    return html`<button type=${type} className="sx-cta" disabled=${disabled} onClick=${onClick}>
      <span>${children}</span><${IconArrow} />
    </button>`;
  }

  function SxField({ label, value, onInput, placeholder = "", type = "text", trailing, inputMode, maxLength }) {
    return html`
      <div className="sx-field">
        <label>${label}</label>
        <div className="sx-field-box">
          <input
            className="sx-input"
            type=${type}
            inputMode=${inputMode}
            maxLength=${maxLength}
            placeholder=${placeholder}
            value=${value}
            onInput=${onInput}
          />
          ${trailing}
        </div>
      </div>
    `;
  }

  function SxSelect({ label, value, onChange, options }) {
    return html`
      <div className="sx-field">
        <label>${label}</label>
        <div className="sx-field-box">
          <select className="sx-input sx-select" value=${value} onChange=${onChange}>
            ${options.map((opt) => html`<option key=${opt} value=${opt}>${opt}</option>`)}
          </select>
          <${IconChevronDown} />
        </div>
      </div>
    `;
  }

  function SxFootLink({ question, action, onAction }) {
    return html`<div className="sx-foot">
      ${question} ${" "}
      <span className="sx-foot-action" onClick=${onAction}>${action}</span>
    </div>`;
  }

  function SxError({ text }) {
    if (!text) return null;
    return html`<p className="sx-error">${text}</p>`;
  }

  // ── Экран 1: Онбординг ──────────────────────────────────────────────
  const ONBOARDING_STEPS = [
    { n: 1, title: "Зарегистрируйтесь", desc: "Телефон, email и пароль" },
    { n: 2, title: "Заполните магазин", desc: "Название, город, логотип" },
    { n: 3, title: "Добавьте товары", desc: "Фото, цена и остаток" },
    { n: 4, title: "Получайте заказы", desc: "Всё — в вашей CRM" }
  ];

  function PartnerRegisterIntroScreen({ onStart }) {
    return html`
      <div className="sx sx-screen">
        <${SxBack} label="Клиентский маркет" onClick=${() => navigateToHash("/market")} />

        <div className="sx-hero">
          <${SxLogo} size=${60} />
          <div className="sx-eyebrow">DRIVEX SELLER</div>
          <h1 className="sx-h1 sx-h1-onb">Откройте магазин<br/>на DRIVEX</h1>
          <p className="sx-sub" style=${{ maxWidth: "280px" }}>
            Бесплатно для магазинов автозапчастей, масел и шин
          </p>
        </div>

        <div className="sx-steps-card">
          ${ONBOARDING_STEPS.map((step, index) => html`
            <div key=${step.n} className="sx-step-row">
              <div className="sx-step-rail">
                <div className="sx-step-num">${step.n}</div>
                ${index < ONBOARDING_STEPS.length - 1 ? html`<div className="sx-step-line"></div>` : null}
              </div>
              <div className=${index < ONBOARDING_STEPS.length - 1 ? "sx-step-body" : "sx-step-body sx-step-body-last"}>
                <div className="sx-step-title">${step.title}</div>
                <div className="sx-step-desc">${step.desc}</div>
              </div>
            </div>
          `)}
        </div>

        <div className="sx-bottom">
          <${SxCta} onClick=${() => navigateToHash("/seller")}>Открыть магазин</${SxCta}>
          <div className="sx-hint-center">Войдите или зарегистрируйтесь на следующем шаге</div>
        </div>
      </div>
    `;
  }

  // ── Экран 2: Вход в Seller CRM ──────────────────────────────────────
  function PartnerLoginScreen({ onLogin, onGoRegister, onResetPassword, authStatus, message = "" }) {
    const toast = useToast();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = useCallback(async () => {
      if (!String(identifier).trim()) { setError("Введите email или телефон"); return; }
      if (!String(password).trim()) { setError("Введите пароль"); return; }
      setError("");
      try {
        setSubmitting(true);
        await onLogin({ email: identifier, phone: identifier, password, remember });
      } catch (e) {
        setError(e?.message || "Не удалось войти");
      } finally {
        setSubmitting(false);
      }
    }, [identifier, password, remember, onLogin]);

    const handleForgot = useCallback(async () => {
      if (!onResetPassword) { toast.push("Восстановление пароля пока недоступно"); return; }
      const next = window.prompt && window.prompt("Новый пароль (минимум 6 символов):", "");
      if (!next || String(next).trim().length < 6) { toast.push("Пароль слишком короткий"); return; }
      try {
        await onResetPassword({ identifier, email: identifier, phone: identifier, newPassword: next });
        setPassword(next);
        toast.push("Пароль обновлён — войдите");
      } catch (e) {
        toast.push(e?.message || "Не удалось сбросить пароль");
      }
    }, [identifier, onResetPassword, toast]);

    return html`
      <div className="sx sx-screen">
        <${SxBack} label="Назад" onClick=${() => navigateToHash("/market")} />

        <div className="sx-hero">
          <${SxLogo} size=${56} />
          <h1 className="sx-h1 sx-h1-login">Вход в Seller CRM</h1>
          <p className="sx-sub" style=${{ maxWidth: "280px" }}>
            Рады видеть снова! Войдите, чтобы управлять магазином
          </p>
        </div>

        ${message ? html`<p className="sx-sub" style=${{ marginTop: "14px" }}>${message}</p>` : null}

        <div className="sx-form" style=${{ marginTop: "28px" }}>
          <${SxField}
            label="Телефон или email"
            placeholder="+992 92 712 59 89"
            value=${identifier}
            onInput=${(e) => { setIdentifier(e.target.value); setError(""); }}
          />
          <${SxField}
            label="Пароль"
            type=${showPassword ? "text" : "password"}
            placeholder="••••••••"
            value=${password}
            onInput=${(e) => { setPassword(e.target.value); setError(""); }}
            trailing=${html`<span className="sx-link-btn" onClick=${() => setShowPassword((v) => !v)}>${showPassword ? "Скрыть" : "Показать"}</span>`}
          />
        </div>

        <${SxError} text=${error} />

        <div className="sx-row-between" style=${{ marginTop: "16px" }}>
          <div className="sx-switch-row" onClick=${() => setRemember((v) => !v)}>
            <div className=${`sx-switch ${remember ? "is-on" : ""}`}><div className="sx-switch-knob"></div></div>
            <span>Запомнить</span>
          </div>
          <span className="sx-link-btn" onClick=${handleForgot}>Забыли пароль?</span>
        </div>

        <div style=${{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <${SxCta} onClick=${handleSubmit} disabled=${submitting}>${submitting ? "Входим…" : "Войти"}</${SxCta}>
          <div className="sx-divider"><span></span>или<span></span></div>
          <button type="button" className="sx-ghost" onClick=${() => toast.push("Вход через Google скоро будет доступен")}>
            <span className="sx-google-g">G</span>Войти через Google
          </button>
        </div>

        <div className="sx-bottom">
          <div className="sx-reg-prompt">Нет аккаунта? Откройте магазин за пару минут</div>
          <button
            type="button"
            className="sx-ghost sx-ghost-accent"
            onClick=${() => (onGoRegister ? onGoRegister() : navigateToHash("/partner/register"))}
          >
            Зарегистрировать магазин
          </button>
        </div>
      </div>
    `;
  }

  // ── Шаги регистрации: прогресс-бар + шапка ──────────────────────────
  function SxStepper({ step, label }) {
    return html`
      <div className="sx-stepper">
        <div className="sx-stepper-bars">
          ${[1, 2, 3].map((i) => html`<div key=${i} className=${`sx-stepper-bar ${i <= step ? "is-done" : ""}`}></div>`)}
        </div>
        <div className="sx-stepper-label">Шаг ${step} из 3 · <b>${label}</b></div>
      </div>
    `;
  }

  function SxRegHeader({ title, sub, step, stepLabel, onBack }) {
    return html`
      <div>
        <div className="sx-row-between">
          <${SxBack} label="Назад" onClick=${onBack} />
          <${SxLogo} size=${34} />
        </div>
        <h1 className="sx-h1 sx-h1-step">${title}</h1>
        <p className="sx-sub" style=${{ marginTop: "7px" }}>${sub}</p>
        <${SxStepper} step=${step} label=${stepLabel} />
      </div>
    `;
  }

  // ── Шаг 3: интерактивная Leaflet-карта выбора точки ─────────────────
  function SxLocationPicker({ location, onPick }) {
    const mapRef = useRef(null);
    const instanceRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
      const leaflet = window.L;
      const node = mapRef.current;
      if (!leaflet || !node || instanceRef.current) return undefined;

      const start = location && Number.isFinite(location.lat) && Number.isFinite(location.lng)
        ? [location.lat, location.lng]
        : KHUJAND_CENTER;

      const map = leaflet.map(node, {
        center: start,
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });
      instanceRef.current = map;

      leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, crossOrigin: true }).addTo(map);

      const placeMarker = (lat, lng) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = leaflet.circleMarker([lat, lng], {
            radius: 9,
            fillColor: "#10B981",
            fillOpacity: 1,
            color: "#6EE7B7",
            weight: 3
          }).addTo(map);
        }
      };

      if (location && Number.isFinite(location.lat)) placeMarker(location.lat, location.lng);

      map.on("click", (event) => {
        const { lat, lng } = event.latlng;
        placeMarker(lat, lng);
        onPick && onPick({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
      });

      // стартовый центр — по геолокации пользователя
      if (!location || !Number.isFinite(location.lat)) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              map.setView([lat, lng], 15);
            },
            () => {},
            { enableHighAccuracy: true, timeout: 4000 }
          );
        }
      }

      window.setTimeout(() => map.invalidateSize(), 120);

      return () => {
        map.remove();
        instanceRef.current = null;
        markerRef.current = null;
      };
    }, []);

    const hasPoint = location && Number.isFinite(location.lat);

    return html`
      <div className="sx-map-wrap">
        <div ref=${mapRef} className="sx-map"></div>
        ${!hasPoint
          ? html`<div className="sx-map-hint"><span>Нажмите на карту, чтобы поставить точку магазина</span></div>`
          : null}
      </div>
    `;
  }

  function SxPickupChip({ label, active, onClick }) {
    return html`
      <button type="button" className=${`sx-chip ${active ? "is-active" : ""}`} onClick=${onClick}>
        ${active ? html`<${IconCheck} />` : null}${label}
      </button>
    `;
  }

  // ── Мастер регистрации (3 шага) ─────────────────────────────────────
  function emptyDraft() {
    return {
      step: 1,
      ownerFullName: "",
      phone: "", // национальная часть, без +992
      email: "",
      password: "",
      logo: "",
      name: "",
      storeCategory: (DX.sellerStoreCategoryOptions || ["Автозапчасти"])[0],
      businessType: "",
      city: "Худжанд",
      workOpen: "09:00",
      workClose: "20:00",
      address: "",
      landmark: "",
      location: null,
      delivery: true,
      pickup: true,
      deliveryRadius: "",
      description: ""
    };
  }

  function loadDraft() {
    try {
      const raw = window.localStorage ? window.localStorage.getItem(DRAFT_KEY) : null;
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return null;

      const draft = { ...emptyDraft(), ...parsed };
      // Старые черновики: телефон с +992 → оставляем только национальную часть
      draft.phone = String(draft.phone || "").replace(/^\+?992\s*/, "");
      // Старые черновики: workingHours "09:00 — 20:00" → workOpen/workClose
      if (parsed.workingHours && (!parsed.workOpen || !parsed.workClose)) {
        const match = String(parsed.workingHours).match(/(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/);
        if (match) {
          draft.workOpen = match[1];
          draft.workClose = match[2];
        }
      }
      return draft;
    } catch {
      return null;
    }
  }

  function SellerRegistrationScreen({ currentUser, profile, store, onRegister }) {
    const toast = useToast();
    const [draft, setDraft] = useState(() => loadDraft() || emptyDraft());
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const step = draft.step || 1;

    // Персист черновика
    useEffect(() => {
      try {
        window.localStorage && window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch { /* ignore */ }
    }, [draft]);

    const set = useCallback((patch) => {
      setError("");
      setDraft((prev) => ({ ...prev, ...patch }));
    }, []);

    const goStep = useCallback((next) => {
      setError("");
      setDraft((prev) => ({ ...prev, step: next }));
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    }, []);

    // Категории магазина: «Автосервис» здесь не предлагаем (для сервисов — отдельная CRM)
    const categoryOptions = (DX.sellerStoreCategoryOptions || ["Автозапчасти", "Масла и жидкости", "Шины", "АКБ", "Аксессуары"])
      .filter((option) => option !== "Автосервис");
    const salesTypeOptions = ["Розница", "Опт", "Розница и опт"];

    const handleLogoPick = useCallback(async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const dataUrl = DX.prepareAvatarDataUrl
          ? await DX.prepareAvatarDataUrl(file, { size: 320, quality: 0.9 })
          : null;
        if (dataUrl) { set({ logo: dataUrl }); toast.push("Логотип добавлен"); }
        else toast.push("Логотип не удалось загрузить");
      } catch {
        toast.push("Файл не подходит");
      }
    }, [set, toast]);

    // Валидация по шагам
    const validateStep1 = () => {
      if (!draft.ownerFullName.trim()) return "Введите ФИО владельца";
      if (draft.phone.replace(/\D/g, "").length !== 9) return "Введите 9 цифр номера после +992";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim())) return "Введите корректный email";
      if (draft.password.trim().length < 6) return "Пароль — минимум 6 символов";
      return "";
    };
    const validateStep2 = () => {
      if (!draft.name.trim()) return "Введите название магазина";
      if (!draft.city.trim()) return "Укажите город";
      if (!draft.address.trim()) return "Введите адрес";
      return "";
    };
    const validateStep3 = () => {
      if (!draft.delivery && !draft.pickup) return "Выберите хотя бы один способ получения";
      return "";
    };

    const handleNext = useCallback(() => {
      const err = step === 1 ? validateStep1() : validateStep2();
      if (err) { setError(err); return; }
      goStep(step + 1);
    }, [step, draft, goStep]);

    const handleFinish = useCallback(async () => {
      const err = validateStep3();
      if (err) { setError(err); return; }

      const delivery = Boolean(draft.delivery);
      const pickup = Boolean(draft.pickup);
      const businessType = delivery && pickup
        ? "Доставка и самовывоз"
        : delivery ? "Только доставка" : "Только самовывоз";
      const loc = draft.location;
      const geolocation = loc && Number.isFinite(loc.lat) ? `${loc.lat}, ${loc.lng}` : "";
      const fullPhone = `+992 ${draft.phone.trim()}`.trim();
      const workingHours = `${draft.workOpen || "09:00"} — ${draft.workClose || "20:00"}`;

      const storePayload = {
        ...(store || {}),
        name: draft.name.trim(),
        storeCategory: draft.storeCategory || "Автозапчасти",
        businessType,
        city: draft.city.trim(),
        workingHours,
        address: draft.address.trim(),
        locationLabel: draft.landmark.trim() || draft.address.trim(),
        geolocation,
        lat: loc && Number.isFinite(loc.lat) ? loc.lat : null,
        lng: loc && Number.isFinite(loc.lng) ? loc.lng : null,
        logo: draft.logo || "",
        deliveryAvailable: delivery,
        pickupAvailable: pickup,
        deliveryRadius: delivery ? (draft.deliveryRadius.trim() || "") : "",
        description: draft.description.trim() || `${draft.name.trim() || "Магазин"} — товары и услуги для авто.`,
        registrationCompleted: true,
        profileCompleted: true,
        status: "active"
      };

      try {
        setSubmitting(true);
        setError("");
        await onRegister({
          profile: {
            ...(profile || {}),
            ownerFullName: draft.ownerFullName.trim(),
            phone: fullPhone,
            email: draft.email.trim(),
            password: draft.password,
            registrationCompleted: true
          },
          store: storePayload
        });

        // Магазин с координатами — в общий каталог/на карту (для всех покупателей)
        if (loc && Number.isFinite(loc.lat)) {
          const storeId = (DX.slugifyText ? DX.slugifyText : (s) => s)(
            [storePayload.name, storePayload.city].filter(Boolean).join("-"),
            `store-${Date.now()}`
          );
          fetch("/api/market/stores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ store: { ...storePayload, id: storeId } })
          }).catch(() => {});
        }

        try { window.localStorage && window.localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        toast.push("Регистрация завершена, открываем CRM");
      } catch (e) {
        const msg = e?.message || "Не удалось зарегистрировать магазин";
        setError(msg);
        toast.push(msg);
      } finally {
        setSubmitting(false);
      }
    }, [draft, onRegister, profile, store, toast]);

    const handleBack = useCallback(() => {
      if (step > 1) goStep(step - 1);
      else navigateToHash("/market");
    }, [step, goStep]);

    return html`
      <div className="sx sx-screen">
        ${step === 1
          ? html`
            <${SxRegHeader} title="Регистрация магазина" sub="Пара минут — и кабинет продавца готов" step=${1} stepLabel="Владелец" onBack=${handleBack} />
            <div className="sx-form" style=${{ marginTop: "24px" }}>
              <${SxField} label="ФИО владельца" placeholder="Имя и фамилия" value=${draft.ownerFullName} onInput=${(e) => set({ ownerFullName: e.target.value })} />
              <div className="sx-field">
                <label>Телефон</label>
                <div className="sx-field-box">
                  <span className="sx-phone-prefix">+992</span>
                  <input
                    className="sx-input"
                    type="tel"
                    inputMode="tel"
                    maxLength=${12}
                    placeholder="12 345 67 89"
                    value=${draft.phone}
                    onInput=${(e) => set({ phone: e.target.value.replace(/[^\d\s]/g, "") })}
                  />
                </div>
              </div>
              <${SxField} label="Email" type="email" inputMode="email" placeholder="you@mail.com" value=${draft.email} onInput=${(e) => set({ email: e.target.value })} />
              <${SxField} label="Пароль" type="password" placeholder="Минимум 6 символов" value=${draft.password} onInput=${(e) => set({ password: e.target.value })} />
            </div>
            <${SxError} text=${error} />
            <div className="sx-bottom">
              <${SxCta} onClick=${handleNext}>Продолжить</${SxCta}>
              <${SxFootLink} question="Уже есть аккаунт?" action="Войти" onAction=${() => navigateToHash("/seller")} />
            </div>
          `
          : null}

        ${step === 2
          ? html`
            <${SxRegHeader} title="О магазине" sub="Это увидят покупатели в маркетплейсе" step=${2} stepLabel="Магазин" onBack=${handleBack} />
            <label className="sx-logo-pick" style=${{ marginTop: "24px" }}>
              <input type="file" accept="image/*" onChange=${handleLogoPick} style=${{ display: "none" }} />
              <div className="sx-logo-drop" style=${draft.logo ? { backgroundImage: `url(${draft.logo})`, backgroundSize: "cover", border: "none" } : null}>
                ${draft.logo ? null : html`<${IconPlus} />`}
              </div>
              <div>
                <div className="sx-logo-title">Логотип</div>
                <div className="sx-logo-hint">PNG или JPG, до 5 МБ</div>
              </div>
            </label>
            <div className="sx-form" style=${{ marginTop: "22px" }}>
              <${SxField} label="Название магазина" placeholder="Название вашего магазина" value=${draft.name} onInput=${(e) => set({ name: e.target.value })} />
              <div className="sx-grid2">
                <${SxSelect} label="Категория" value=${draft.storeCategory} onChange=${(e) => set({ storeCategory: e.target.value })} options=${categoryOptions} />
                <${SxSelect} label="Тип продаж" value=${draft.businessType || salesTypeOptions[0]} onChange=${(e) => set({ businessType: e.target.value })} options=${salesTypeOptions} />
              </div>
              <${SxSelect} label="Город" value=${draft.city} onChange=${(e) => set({ city: e.target.value })} options=${CITY_OPTIONS} />
              <div className="sx-field">
                <label>Часы работы</label>
                <div className="sx-field-box sx-time-box">
                  <input
                    className="sx-input sx-time"
                    type="time"
                    value=${draft.workOpen}
                    onInput=${(e) => set({ workOpen: e.target.value })}
                  />
                  <span className="sx-time-dash">—</span>
                  <input
                    className="sx-input sx-time"
                    type="time"
                    value=${draft.workClose}
                    onInput=${(e) => set({ workClose: e.target.value })}
                  />
                </div>
              </div>
              <${SxField} label="Адрес" placeholder="Улица, дом или микрорайон" value=${draft.address} onInput=${(e) => set({ address: e.target.value })} />
            </div>
            <${SxError} text=${error} />
            <div className="sx-bottom">
              <${SxCta} onClick=${handleNext}>Продолжить</${SxCta}>
              <div className="sx-hint-center">Доставка и описание — на следующем шаге</div>
            </div>
          `
          : null}

        ${step === 3
          ? html`
            <${SxRegHeader} title="Локация и доставка" sub="Последний шаг — и магазин готов" step=${3} stepLabel="Доставка" onBack=${handleBack} />
            <div style=${{ marginTop: "24px" }}>
              <${SxLocationPicker} location=${draft.location} onPick=${(loc) => set({ location: loc })} />
              <div className="sx-row-between" style=${{ marginTop: "12px" }}>
                <input
                  className="sx-landmark"
                  placeholder="Ориентир: рядом с кольцом, 8 мкр"
                  value=${draft.landmark}
                  onInput=${(e) => set({ landmark: e.target.value })}
                />
              </div>
            </div>

            <div style=${{ marginTop: "22px" }}>
              <div className="sx-field-label">Способ получения</div>
              <div className="sx-chips">
                <${SxPickupChip} label="Доставка" active=${draft.delivery} onClick=${() => set({ delivery: !draft.delivery })} />
                <${SxPickupChip} label="Самовывоз" active=${draft.pickup} onClick=${() => set({ pickup: !draft.pickup })} />
              </div>
            </div>

            ${draft.delivery
              ? html`<div style=${{ marginTop: "18px" }}>
                  <${SxField} label="Радиус доставки" placeholder="Например, 10 км" value=${draft.deliveryRadius} onInput=${(e) => set({ deliveryRadius: e.target.value })} />
                </div>`
              : null}

            <div className="sx-field" style=${{ marginTop: "18px" }}>
              <label>О магазине · необязательно</label>
              <textarea
                className="sx-textarea"
                placeholder="Пара слов для покупателей…"
                value=${draft.description}
                onInput=${(e) => set({ description: e.target.value })}
              ></textarea>
            </div>

            <${SxError} text=${error} />
            <div className="sx-bottom">
              <${SxCta} onClick=${handleFinish} disabled=${submitting}>${submitting ? "Создаём магазин…" : "Завершить регистрацию"}</${SxCta}>
              <div className="sx-hint-center">Товары добавите уже в вашей CRM</div>
            </div>
          `
          : null}
      </div>
    `;
  }

  // ── Экспорт (переопределяет seller-crm.js) ──────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.PartnerRegisterIntroScreen = PartnerRegisterIntroScreen;
  DX.screens.PartnerLoginScreen = PartnerLoginScreen;
  DX.screens.SellerRegistrationScreen = SellerRegistrationScreen;
})();
