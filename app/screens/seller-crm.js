// Seller CRM
(() => {
  'use strict';
  window.DX = window.DX || {};
  const DX = window.DX;
  const html  = DX.html;
  const React = DX.React;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon    = function(p){ return DX.Icon ? DX.Icon(p) : null; };
  const alphaBg = function(){ return DX.alphaBg ? DX.alphaBg(...arguments) : arguments[0]; };
  function useToast(){ return DX.useToast ? DX.useToast() : {push: function(){}}; }
  const navigateToHash = function(p){ DX.navigateToHash && DX.navigateToHash(p); };
  const SimplePage = function(p){ var F=DX.SimplePage; return F ? F(p) : (p.children||null); };
  const formatTjsPrice = function(n){ return DX.formatTjsPrice ? DX.formatTjsPrice(n) : (String(n)+' сом.'); };
  const genId = function(p){ return DX.genId ? DX.genId(p) : (p+'-'+Date.now()); };

  function createSellerProductFormState(product, storeId = sellerPrimaryStoreId) {
    const isExistingProduct = Boolean(product && typeof product === "object");
    const normalized = normalizeSellerProduct(
      product || { storeId, status: "active", stockQty: 1 },
      storeId
    );

    return {
      id: normalized.id,
      title: normalized.title,
      categoryId: normalized.categoryId,
      price: String(normalized.price || ""),
      oldPrice: normalized.oldPrice ? String(normalized.oldPrice) : "",
      stockQty: String(normalized.stockQty || 0),
      description: normalized.description,
      brand: normalized.brand,
      sku: normalized.sku,
      badge: normalized.badge,
      image: normalized.image,
      deliveryAvailable: Boolean(normalized.deliveryAvailable),
      status: isExistingProduct ? normalized.status : "active"
    };
  }

  function createSellerStoreFormState(store) {
    const normalized = normalizeSellerStore(store);

    return {
      ownerName: normalized.ownerName,
      name: normalized.name,
      city: normalized.city,
      address: normalized.address,
      locationLabel: normalized.locationLabel,
      geolocation: normalized.geolocation,
      storeCategory: normalized.storeCategory,
      businessType: normalized.businessType,
      phone: normalized.phone,
      deliveryAvailable: Boolean(normalized.deliveryAvailable),
      pickupAvailable: Boolean(normalized.pickupAvailable),
      deliveryRadius: normalized.deliveryRadius,
      workingHours: normalized.workingHours,
      description: normalized.description,
      logo: normalized.logo,
      status: normalized.status
    };
  }

  function SellerLogo({ store, size = 52, rounded = "18px" }) {
    const safeStore = store && typeof store === "object" ? store : {};
    const logo = String(safeStore.logo || "").trim();
    const accent = safeStore.accent || "var(--drivex-electric-blue)";
    const fallback = String(logo || safeStore.name || "DX")
      .replace(/[^A-Za-zА-Яа-яЁё0-9]/g, "")
      .slice(0, 2)
      .toUpperCase() || "DX";

    if (logo.startsWith("data:image/") || /^https?:/i.test(logo)) {
      return html`<img
        src=${logo}
        alt=${safeStore.name || "Store"}
        className="object-cover flex-shrink-0"
        style=${{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: rounded,
          border: `1px solid ${alphaBg(accent, 0.35)}`
        }}
      />`;
    }

    return html`<div
      className="flex items-center justify-center font-bold flex-shrink-0"
      style=${{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: rounded,
        background: `linear-gradient(135deg, ${alphaBg(accent, 0.35)} 0%, rgba(15, 23, 42, 0.92) 100%)`,
        color: "var(--drivex-white)",
        border: `1px solid ${alphaBg(accent, 0.4)}`
      }}
    >
      ${fallback}
    </div>`;
  }

  function SellerField({ label, note, children }) {
    return html`
      <label className="block">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
            ${label}
          </span>
          ${note
            ? html`<span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                ${note}
              </span>`
            : null}
        </div>
        ${children}
      </label>
    `;
  }

  function SellerInput(props) {
    return html`<input
      ...${props}
      className="w-full px-4 py-3 rounded-2xl glass-card-light outline-none dx-input"
      style=${{
        color: "var(--drivex-white)",
        minHeight: "52px"
      }}
    />`;
  }

  function SellerTextarea(props) {
    return html`<textarea
      ...${props}
      className="w-full px-4 py-3 rounded-2xl glass-card-light outline-none dx-input"
      style=${{
        color: "var(--drivex-white)",
        minHeight: "120px",
        resize: "vertical"
      }}
    ></textarea>`;
  }

  function SellerSelect({ children, ...props }) {
    return html`<select
      ...${props}
      className="w-full px-4 py-3 rounded-2xl glass-card-light outline-none dx-input"
      style=${{
        color: "var(--drivex-white)",
        minHeight: "52px"
      }}
    >
      ${children}
    </select>`;
  }

  function SellerLayout({
    title,
    subtitle,
    activeItem,
    currentUser,
    store,
    primaryAction,
    showStoreSummary = true,
    showNavigation = true,
    children
  }) {
    const safeStore = store && typeof store === "object" ? store : createSellerStoreSeed();
    const safeUser = currentUser && typeof currentUser === "object" ? currentUser : createDefaultSellerSession();

    return html`
      <div className="min-h-screen" style=${{ background: "var(--drivex-black)" }}>
        <div
          className="pt-8 pb-6 px-5"
          style=${{
            background: "linear-gradient(180deg, rgba(10, 16, 30, 0.98) 0%, rgba(10, 10, 15, 1) 100%)"
          }}
        >
          <a
            href="#/market"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style=${{ color: "var(--drivex-silver)" }}
          >
            <${Icon} name="chevron-left" size=${16} />
            В клиентский маркет
          </a>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                DRIVEX SELLER
              </p>
              <h1 className="text-3xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${title}
              </h1>
              <p className="text-sm mt-2 max-w-[240px]" style=${{ color: "var(--drivex-silver)" }}>
                ${subtitle}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              ${showNavigation && isSellerRole(safeUser.role)
                ? html`<a
                    href="#/partner/login?logout=1"
                    className="px-3 py-2 rounded-2xl text-xs font-semibold"
                    style=${{
                      background: "rgba(239, 68, 68, 0.14)",
                      color: "var(--drivex-danger)"
                    }}
                  >
                    Выйти
                  </a>`
                : null}
              <${SellerLogo} store=${safeStore} size=${60} rounded="20px" />
            </div>
          </div>

          ${showStoreSummary
            ? html`<div className="glass-card-light rounded-3xl p-4 mt-5">
                <div className="flex items-center gap-3">
                  <${SellerLogo} store=${safeStore} size=${44} rounded="16px" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                      ${safeStore.name || "Новый магазин"}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${(safeUser.name || "Новый партнёр") + " • " + (safeUser.role === "admin" ? "Администратор" : "Владелец магазина")}
                    </p>
                  </div>
                  ${primaryAction
                    ? html`<a
                        href=${`#${primaryAction.path}`}
                        className="px-4 py-3 rounded-2xl text-sm font-semibold dx-btn whitespace-nowrap"
                      >
                        ${primaryAction.label}
                      </a>`
                    : null}
                </div>
              </div>`
            : null}

          ${showNavigation
            ? html`<div className="flex gap-2 overflow-x-auto pb-1 mt-5 no-scrollbar">
                ${sellerNavigationItems.map((item) => {
                  const isActive = item.id === activeItem;
                  return html`
                    <a
                      key=${item.id}
                      href=${`#${item.path}`}
                      className="px-4 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap flex items-center gap-2"
                      style=${{
                        background: isActive ? "rgba(6, 182, 212, 0.18)" : "var(--glass-bg)",
                        color: isActive ? "var(--drivex-neon-cyan)" : "var(--drivex-white)",
                        border: isActive
                          ? "1px solid rgba(6, 182, 212, 0.32)"
                          : "1px solid var(--glass-border)"
                      }}
                    >
                      <${Icon} name=${item.icon} size=${16} />
                      ${item.label}
                    </a>
                  `;
                })}
              </div>`
            : null}
        </div>

        <div className="px-5 py-5 space-y-4">${children}</div>
      </div>
    `;
  }

  function SellerMetricCard({ label, value, hint, color, icon, path = "", actionLabel = "" }) {
    const content = html`
      <div
        className="glass-card-light rounded-3xl p-4"
        style=${{
          minHeight: "100%"
        }}
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style=${{
            background: alphaBg(color, 0.18),
            color
          }}
        >
          <${Icon} name=${icon} size=${20} />
        </div>
        <p className="text-2xl font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
          ${value}
        </p>
        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
          ${label}
        </p>
        ${hint
          ? html`<p className="text-xs mt-3" style=${{ color }}>
              ${hint}
            </p>`
          : null}
        ${path
          ? html`<div
              className="mt-4 pt-3 flex items-center justify-between gap-3"
              style=${{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <span className="text-xs font-semibold" style=${{ color: "var(--drivex-white)" }}>
                ${actionLabel || "Открыть"}
              </span>
              <span
                className="w-8 h-8 rounded-full inline-flex items-center justify-center"
                style=${{
                  background: alphaBg(color, 0.18),
                  color
                }}
              >
                <${Icon} name="chevron-left" size=${14} style=${{ transform: "rotate(180deg)" }} />
              </span>
            </div>`
          : null}
      </div>
    `;

    if (!path) {
      return content;
    }

    return html`
      <a
        href=${`#${path}`}
        className="block transition-transform hover:scale-[1.01]"
        style=${{ textDecoration: "none" }}
      >
        ${content}
      </a>
    `;
  }

  function SellerAccessDeniedScreen({ onActivateSeller }) {
    return html`
      <div className="min-h-screen flex items-center justify-center px-5" style=${{ background: "var(--drivex-black)" }}>
        <div className="glass-card-light rounded-3xl p-6 w-full">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style=${{
              background: "rgba(239, 68, 68, 0.14)",
              color: "var(--drivex-danger)"
            }}
          >
            <${Icon} name="lock" size=${24} />
          </div>
          <h1 className="text-2xl font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
            Доступ закрыт
          </h1>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
            Кабинет продавца изолирован от клиентской части DRIVEX. Для входа нужен seller/admin доступ.
          </p>
          <div className="flex gap-3 flex-wrap mt-5">
            <button
              type="button"
              className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn"
              onClick=${() => onActivateSeller && onActivateSeller()}
            >
              Зарегистрировать магазин
            </button>
            <a
              href="#/partner/login"
              className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold"
              style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
            >
              Войти как партнёр
            </a>
            <a href="#/market" className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
              Вернуться в маркет
            </a>
            <a
              href="./seller.html"
              className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold"
              style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
            >
              Ссылка для партнёра
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function PartnerLoginScreen({ onLogin, onGoRegister, onResetPassword, authStatus, message = "" }) {
    const toast = useToast();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [rememberSession, setRememberSession] = useState(true);
    const [resetOpen, setResetOpen] = useState(false);
    const [resetIdentifier, setResetIdentifier] = useState("");
    const [resetPassword, setResetPassword] = useState("");
    const [resetSubmitting, setResetSubmitting] = useState(false);
    const backendModeLabel =
      authStatus?.mode === "supabase" && authStatus?.configured ? "Supabase CRM" : "DRIVEX Seller Login";

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        if (!String(identifier || "").trim()) {
          toast.push("Введите email или телефон");
          return;
        }
        if (!String(password || "").trim()) {
          toast.push("Введите пароль");
          return;
        }

        try {
          setSubmitting(true);
          await onLogin({
            email: identifier,
            phone: identifier,
            password,
            remember: rememberSession
          });
        } finally {
          setSubmitting(false);
        }
      },
      [identifier, onLogin, password, rememberSession, toast]
    );

    const handleResetPassword = useCallback(
      async (event) => {
        event.preventDefault();
        if (!String(resetIdentifier || "").trim()) {
          toast.push("Введите email или телефон для восстановления");
          return;
        }
        if (!String(resetPassword || "").trim() || String(resetPassword || "").trim().length < 6) {
          toast.push("Новый пароль должен быть не короче 6 символов");
          return;
        }
        if (!onResetPassword) {
          toast.push("Восстановление пароля пока недоступно");
          return;
        }

        try {
          setResetSubmitting(true);
          await onResetPassword({
            identifier: resetIdentifier,
            email: resetIdentifier,
            phone: resetIdentifier,
            newPassword: resetPassword
          });
          setIdentifier(resetIdentifier);
          setPassword(resetPassword);
          setRememberSession(true);
          setResetOpen(false);
          toast.push("Пароль обновлён. Теперь войдите в seller CRM.");
        } finally {
          setResetSubmitting(false);
        }
      },
      [onResetPassword, resetIdentifier, resetPassword, toast]
    );

    return html`
      <${SellerLayout}
        title="Вход в seller CRM"
        subtitle="Для уже зарегистрированного магазина: откройте seller-ссылку, войдите и сразу попадёте в свой кабинет."
        activeItem="store"
        currentUser=${createDefaultSellerSession()}
        store=${createSellerStoreSeed("partner-login")}
        showStoreSummary=${false}
        showNavigation=${false}
      >
        <div className="glass-card-light rounded-[32px] p-6 text-center">
          <div
            className="mx-auto w-[72px] h-[72px] rounded-[22px] flex items-center justify-center"
            style=${{
              background: "linear-gradient(135deg, rgba(79, 125, 255, 0.95) 0%, rgba(111, 77, 255, 0.95) 100%)",
              color: "var(--drivex-white)",
              boxShadow: "0 18px 36px rgba(79, 125, 255, 0.24)"
            }}
          >
            <${Icon} name="bag" size=${32} />
          </div>

          <p className="text-xs font-semibold mt-4 tracking-[0.22em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
            ${backendModeLabel}
          </p>
          <h2 className="text-[34px] font-bold mt-3" style=${{ color: "var(--drivex-white)", lineHeight: "1.1" }}>
            Рад вас видеть!
          </h2>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
            Войдите по email или телефону и продолжайте управлять магазином без повторной регистрации.
          </p>
        </div>

        ${message
          ? html`<div className="glass-card-light rounded-3xl p-4">
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                ${message}
              </p>
            </div>`
          : null}

        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="space-y-4">
              <${SellerField} label="Логин (email или телефон)">
                <${SellerInput}
                  type="text"
                  placeholder="Email или номер телефона"
                  value=${identifier}
                  onInput=${(e) => setIdentifier(e.target.value)}
                />
              </${SellerField}>

              <${SellerField} label="Пароль">
                <${SellerInput}
                  type="password"
                  placeholder="Ваш пароль"
                  value=${password}
                  onInput=${(e) => setPassword(e.target.value)}
                />
              </${SellerField}>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-3"
                style=${{
                  background: rememberSession ? "rgba(79, 125, 255, 0.16)" : "var(--glass-bg)",
                  color: rememberSession ? "var(--drivex-electric-blue)" : "var(--drivex-white)"
                }}
                onClick=${() => setRememberSession((prev) => !prev)}
              >
                <span
                  className="w-9 h-5 rounded-full flex items-center px-1"
                  style=${{
                    background: rememberSession ? "rgba(79, 125, 255, 0.32)" : "rgba(148, 163, 184, 0.18)",
                    justifyContent: rememberSession ? "flex-end" : "flex-start"
                  }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style=${{
                      background: rememberSession ? "var(--drivex-electric-blue)" : "var(--drivex-silver)"
                    }}
                  ></span>
                </span>
                Запомнить вход
              </button>

              <button
                type="button"
                className="text-sm font-semibold"
                style=${{ color: "var(--drivex-neon-cyan)" }}
                onClick=${() => {
                  setResetIdentifier(identifier);
                  setResetPassword("");
                  setResetOpen((prev) => !prev);
                }}
              >
                ${resetOpen ? "Скрыть восстановление" : "Забыли пароль?"}
              </button>
            </div>

            <div
              className="mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
              style=${{
                background: "rgba(79, 125, 255, 0.08)",
                border: "1px solid rgba(79, 125, 255, 0.12)"
              }}
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style=${{
                  background: "rgba(79, 125, 255, 0.14)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                <${Icon} name="sparkles" size=${18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Уже зарегистрированы?
                </p>
                <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  После входа seller CRM сам откроет разделы Dashboard, Товары, Заказы и Магазин.
                </p>
              </div>
            </div>
          </div>

          ${resetOpen
            ? html`<div className="glass-card-light rounded-3xl p-5">
                <form className="space-y-4" onSubmit=${handleResetPassword}>
                  <${SellerField} label="Email или телефон">
                    <${SellerInput}
                      type="text"
                      placeholder="Введите email или номер"
                      value=${resetIdentifier}
                      onInput=${(e) => setResetIdentifier(e.target.value)}
                    />
                  </${SellerField}>

                  <${SellerField} label="Новый пароль">
                    <${SellerInput}
                      type="password"
                      placeholder="Новый пароль"
                      value=${resetPassword}
                      onInput=${(e) => setResetPassword(e.target.value)}
                    />
                  </${SellerField}>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl text-sm font-semibold"
                    style=${{
                      background: "var(--glass-bg)",
                      color: "var(--drivex-white)"
                    }}
                    disabled=${resetSubmitting}
                  >
                    ${resetSubmitting ? "Обновляем пароль..." : "Обновить пароль"}
                  </button>
                </form>
              </div>`
            : null}

          <button type="submit" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
            ${submitting ? "Входим..." : "Войти"}
          </button>

          <button
            type="button"
            className="w-full py-4 rounded-2xl text-sm font-semibold"
            style=${{
              background: "transparent",
              color: "var(--drivex-white)",
              border: "1px solid var(--glass-border)"
            }}
            onClick=${() => toast.push("Вход через Google подготовим следующим шагом")}
          >
            Войти через Google
          </button>
        </form>

        <div className="glass-card-light rounded-3xl p-5">
          <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
            Нет аккаунта?
          </p>
          <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
            Зарегистрируйте магазин один раз, затем дальше входите только через seller CRM.
          </p>
          <button
            type="button"
            className="mt-4 w-full py-3 rounded-2xl text-sm font-semibold"
            style=${{
              background: "var(--glass-bg)",
              color: "var(--drivex-white)"
            }}
            onClick=${() => onGoRegister && onGoRegister()}
          >
            Зарегистрироваться
          </button>
        </div>
      </${SellerLayout}>
    `;
  }

  // PartnerQuickRegisterScreen был временным и удалён для отката к исходному flow

  function PartnerRegisterIntroScreen({ onStart }) {
    return html`
      <${SellerLayout}
        title="Регистрация партнёра"
        subtitle="Сначала откройте пустую форму, заполните данные магазина и только потом завершите регистрацию."
        activeItem="store"
        currentUser=${createFreshSellerSession()}
        store=${createSellerStoreSeed(createPendingSellerStoreId())}
        showStoreSummary=${false}
        showNavigation=${false}
      >
        <div className="glass-card-light rounded-3xl p-6 text-center">
          <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
            По партнёрской ссылке форма открывается пустой — все данные о магазине вы заполняете сами.
          </p>

          <button
            type="button"
            className="mt-6 w-full py-4 rounded-[24px] text-lg font-semibold"
            style=${{
              background: "linear-gradient(135deg, #4f7dff 0%, #6f4dff 100%)",
              color: "var(--drivex-white)",
              boxShadow: "0 12px 32px rgba(79, 125, 255, 0.28)"
            }}
            onClick=${() => onStart && onStart()}
          >
            Регистрация
          </button>
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerRegistrationScreen({ currentUser, profile, store, onRegister }) {
    const toast = useToast();
    const [profileForm, setProfileForm] = useState(() => normalizeSellerProfile(profile, currentUser));
    const [storeForm, setStoreForm] = useState(() => createSellerStoreFormState(store));
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    useEffect(() => {
      setProfileForm(normalizeSellerProfile(profile, currentUser));
    }, [currentUser?.id, profile?.id]);

    useEffect(() => {
      setStoreForm(createSellerStoreFormState(store));
    }, [store?.id]);

    const updateProfileField = useCallback((key, value) => {
      setFormError("");
      setProfileForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const updateStoreField = useCallback((key, value) => {
      setFormError("");
      setStoreForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleLogoPick = useCallback(
      async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareAvatarDataUrl(file, { size: 320, quality: 0.9 });
          if (!dataUrl) {
            toast.push("Логотип не удалось загрузить");
            return;
          }
          updateStoreField("logo", dataUrl);
          toast.push("Логотип добавлен");
        } catch {
          toast.push("Файл не подходит");
        }
      },
      [toast, updateStoreField]
    );

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        const requiredFields = [
          [profileForm.ownerFullName, "Введите ФИО владельца"],
          [profileForm.email, "Введите email"],
          [profileForm.phone, "Введите телефон"],
          [profileForm.password, "Введите пароль"],
          [storeForm.name, "Введите название магазина"],
          [storeForm.city, "Выберите город"],
          [storeForm.address, "Введите адрес"]
        ];

        const firstMissing = requiredFields.find(([value]) => !String(value || "").trim());
        if (firstMissing) {
          setFormError(firstMissing[1]);
          toast.push(firstMissing[1]);
          return;
        }

        try {
          setSubmitting(true);
          setFormError("");
          const resolvedDeliveryAvailable = Boolean(storeForm.deliveryAvailable);
          const resolvedPickupAvailable = resolvedDeliveryAvailable
            ? Boolean(storeForm.pickupAvailable)
            : Boolean(storeForm.pickupAvailable) || true;
          const resolvedBusinessType =
            storeForm.businessType ||
            (resolvedDeliveryAvailable && resolvedPickupAvailable
              ? "Доставка и самовывоз"
              : resolvedDeliveryAvailable
                ? "Только доставка"
                : "Только самовывоз");
          const resolvedStoreCategory = storeForm.storeCategory || "Автозапчасти";
          const resolvedLocationLabel = storeForm.locationLabel || storeForm.address;
          const resolvedWorkingHours = storeForm.workingHours || "09:00 — 19:00";
          const resolvedDescription =
            storeForm.description || `${storeForm.name || "Магазин"} — товары и услуги для авто.`;

          await onRegister({
            profile: {
              ...profileForm,
              registrationCompleted: true
            },
            store: {
              ...storeForm,
              storeCategory: resolvedStoreCategory,
              businessType: resolvedBusinessType,
              deliveryAvailable: resolvedDeliveryAvailable,
              pickupAvailable: resolvedPickupAvailable,
              locationLabel: resolvedLocationLabel,
              workingHours: resolvedWorkingHours,
              description: resolvedDescription,
              ownerName: profileForm.ownerFullName,
              phone: profileForm.phone,
              registrationCompleted: true,
              profileCompleted: false,
              status: "pending-setup"
            }
          });
          toast.push("Регистрация завершена, открываем CRM");
        } catch (error) {
          const nextError = error?.message || "Не удалось зарегистрировать партнёра";
          setFormError(nextError);
          toast.push(nextError);
        } finally {
          setSubmitting(false);
        }
      },
      [onRegister, profileForm, storeForm, toast]
    );

    return html`
      <${SellerLayout}
        title="Регистрация магазина"
        subtitle="Сначала оформите магазин и данные владельца. До завершения регистрации публикация товаров недоступна."
        activeItem="store"
        currentUser=${currentUser}
        store=${store}
        showStoreSummary=${false}
        showNavigation=${false}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Владелец магазина
            </h2>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <${SellerField} label="ФИО владельца">
                <${SellerInput}
                  type="text"
                  placeholder="Саиджон Каримов"
                  value=${profileForm.ownerFullName}
                  onInput=${(e) => updateProfileField("ownerFullName", e.target.value)}
                />
              </${SellerField}>

              <${SellerField} label="Email">
                <${SellerInput}
                  type="email"
                  placeholder="partner@drivex.tj"
                  value=${profileForm.email}
                  onInput=${(e) => updateProfileField("email", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Телефон">
                  <${SellerInput}
                    type="tel"
                    placeholder="+992 92 777 00 77"
                    value=${profileForm.phone}
                    onInput=${(e) => updateProfileField("phone", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Пароль">
                  <${SellerInput}
                    type="password"
                    placeholder="Минимум 6 символов"
                    value=${profileForm.password}
                    onInput=${(e) => updateProfileField("password", e.target.value)}
                  />
                </${SellerField}>
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Магазин
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Базовая информация для подключения seller кабинета
                </p>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Логотип
                <input type="file" accept="image/*" className="hidden" onChange=${handleLogoPick} />
              </label>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <${SellerLogo} store=${{ ...store, logo: storeForm.logo, name: storeForm.name }} size=${72} rounded="22px" />
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${storeForm.name || "Название магазина появится здесь"}
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  ${storeForm.storeCategory || "Категория пока не выбрана"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-5">
              <${SellerField} label="Название магазина">
                <${SellerInput}
                  type="text"
                  placeholder="AutoParts Khujand"
                  value=${storeForm.name}
                  onInput=${(e) => updateStoreField("name", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Категория магазина">
                  <${SellerSelect}
                    value=${storeForm.storeCategory}
                    onChange=${(e) => updateStoreField("storeCategory", e.target.value)}
                  >
                    <option value="">Выберите категорию</option>
                    ${sellerStoreCategoryOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Тип продаж">
                  <${SellerSelect}
                    value=${storeForm.businessType}
                    onChange=${(e) => updateStoreField("businessType", e.target.value)}
                  >
                    <option value="">Выберите тип продаж</option>
                    ${sellerBusinessTypeOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Город">
                  <${SellerInput}
                    type="text"
                    placeholder="Худжанд"
                    value=${storeForm.city}
                    onInput=${(e) => updateStoreField("city", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Часы работы">
                  <${SellerInput}
                    type="text"
                    placeholder="09:00 — 20:00"
                    value=${storeForm.workingHours}
                    onInput=${(e) => updateStoreField("workingHours", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Точный адрес">
                <${SellerInput}
                  type="text"
                  placeholder="Худжанд, 8 мкр, дом 12"
                  value=${storeForm.address}
                  onInput=${(e) => updateStoreField("address", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style=${{
                  background: "rgba(14, 165, 233, 0.16)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                <${Icon} name="map" size=${20} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Локация магазина
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Аккуратный блок адреса и геоточки для будущего подключения карты
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
              <${SellerField} label="Ориентир / метка на карте">
                <${SellerInput}
                  type="text"
                  placeholder="Рядом с кольцом 8 мкр"
                  value=${storeForm.locationLabel}
                  onInput=${(e) => updateStoreField("locationLabel", e.target.value)}
                />
              </${SellerField}>

              <${SellerField} label="Геолокация / координаты">
                <${SellerInput}
                  type="text"
                  placeholder="40.2837, 69.6222"
                  value=${storeForm.geolocation}
                  onInput=${(e) => updateStoreField("geolocation", e.target.value)}
                />
              </${SellerField}>

              <div
                className="rounded-3xl p-4"
                style=${{
                  background: "linear-gradient(145deg, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.88) 100%)",
                  border: "1px solid rgba(14, 165, 233, 0.18)"
                }}
              >
                <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Preview location
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  ${storeForm.city || "Город"} • ${storeForm.address || "Адрес пока не указан"}
                </p>
                <p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  ${storeForm.locationLabel || "Добавьте ориентир"}${storeForm.geolocation ? ` • ${storeForm.geolocation}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Доставка и описание
            </h2>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                style=${{
                  background: storeForm.deliveryAvailable ? "rgba(16, 185, 129, 0.16)" : "var(--glass-bg)",
                  color: storeForm.deliveryAvailable ? "var(--drivex-success)" : "var(--drivex-white)"
                }}
                onClick=${() => updateStoreField("deliveryAvailable", !storeForm.deliveryAvailable)}
              >
                Доставка ${storeForm.deliveryAvailable ? "включена" : "выключена"}
              </button>
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                style=${{
                  background: storeForm.pickupAvailable ? "rgba(14, 165, 233, 0.16)" : "var(--glass-bg)",
                  color: storeForm.pickupAvailable ? "var(--drivex-electric-blue)" : "var(--drivex-white)"
                }}
                onClick=${() => updateStoreField("pickupAvailable", !storeForm.pickupAvailable)}
              >
                Самовывоз ${storeForm.pickupAvailable ? "включен" : "выключен"}
              </button>
            </div>

            <div className="mt-4">
              <${SellerField} label="Радиус доставки">
                <${SellerInput}
                  type="text"
                  placeholder="15 км"
                  value=${storeForm.deliveryRadius}
                  onInput=${(e) => updateStoreField("deliveryRadius", e.target.value)}
                />
              </${SellerField}>
            </div>

            <div className="mt-4">
              <${SellerField} label="Описание магазина">
                <${SellerTextarea}
                  value=${storeForm.description}
                  onInput=${(e) => updateStoreField("description", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          ${formError
            ? html`<div
                className="px-4 py-3 rounded-2xl text-sm"
                style=${{
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "var(--drivex-danger)",
                  border: "1px solid rgba(239, 68, 68, 0.2)"
                }}
              >
                ${formError}
              </div>`
            : null}

          <button type="submit" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
            ${submitting ? "Создаём магазин..." : "Продолжить к настройке магазина"}
          </button>
        </form>

        <div className="glass-card-light rounded-3xl p-5">
          <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
            Уже есть партнёрский аккаунт?
          </p>
          <a
            href="#/seller"
            className="inline-flex mt-4 px-4 py-3 rounded-2xl text-sm font-semibold"
            style=${{
              background: "var(--glass-bg)",
              color: "var(--drivex-white)"
            }}
          >
            Войти в seller CRM
          </a>
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerOnboardingScreen({ currentUser, store, profile, setupState, notifications, onCompleteSetup }) {
    const toast = useToast();
    const safeSetup = setupState || getSellerSetupState(store, profile);
    const canComplete = safeSetup.isRegistrationComplete && safeSetup.completedCount === safeSetup.totalCount;
    const safeStore = normalizeSellerStore(store);
    const safeProfile = normalizeSellerProfile(profile, currentUser);

    return html`
      <${SellerLayout}
        title="Профиль магазина"
        subtitle="Проверьте карточку магазина, статус подключения и только потом переходите к публикации товаров."
        activeItem="store"
        currentUser=${currentUser}
        store=${safeStore}
        primaryAction=${{ path: "/seller/store", label: "Редактировать" }}
      >
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                Статус профиля
              </p>
              <p className="text-2xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${safeSetup.isProfileComplete ? "Готов к публикации" : "Нужно завершить setup"}
              </p>
            </div>
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style=${{
                background: safeSetup.isProfileComplete ? "rgba(16, 185, 129, 0.16)" : "rgba(245, 158, 11, 0.16)",
                color: safeSetup.isProfileComplete ? "var(--drivex-success)" : "var(--drivex-warning)"
              }}
            >
              ${safeStore.status || "pending-setup"}
            </span>
          </div>

          <div className="mt-4">
            <div
              className="h-3 rounded-full"
              style=${{ background: "rgba(148, 163, 184, 0.12)" }}
            >
              <div
                className="h-full rounded-full"
                style=${{
                  width: `${safeSetup.progressPercent}%`,
                  background: "var(--gradient-primary)"
                }}
              ></div>
            </div>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
              Заполнено ${safeSetup.completedCount} из ${safeSetup.totalCount} пунктов
            </p>
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
            Сводка магазина
          </h2>
          <div className="grid grid-cols-2 gap-3 mt-4">
            ${[
              { label: "Владелец", value: safeProfile.ownerFullName || "—" },
              { label: "Телефон", value: safeProfile.phone || "—" },
              { label: "Категория", value: safeStore.storeCategory || "—" },
              { label: "Тип продаж", value: safeStore.businessType || "—" },
              { label: "Самовывоз", value: safeStore.pickupAvailable ? "Да" : "Нет" },
              { label: "Доставка", value: safeStore.deliveryAvailable ? "Да" : "Нет" }
            ].map((item) => html`
              <div key=${item.label} className="glass-card rounded-2xl p-3">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  ${item.label}
                </p>
                <p className="font-semibold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${item.value}
                </p>
              </div>
            `)}
          </div>
          <div className="glass-card rounded-2xl p-4 mt-4">
            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
              Локация
            </p>
            <p className="font-semibold mt-2" style=${{ color: "var(--drivex-white)" }}>
              ${safeStore.city} • ${safeStore.address}
            </p>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
              ${safeStore.locationLabel}${safeStore.geolocation ? ` • ${safeStore.geolocation}` : ""}
            </p>
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Чеклист подключения
            </h2>
            <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              ${safeSetup.progressPercent}%
            </span>
          </div>
          <div className="space-y-3 mt-4">
            ${safeSetup.checklist.map((item) => html`
              <div key=${item.id} className="flex items-center justify-between gap-3 glass-card rounded-2xl p-3">
                <span style=${{ color: "var(--drivex-white)" }}>${item.label}</span>
                <span
                  className="px-3 py-1 rounded-xl text-xs font-semibold"
                  style=${{
                    background: item.done ? "rgba(16, 185, 129, 0.16)" : "rgba(245, 158, 11, 0.16)",
                    color: item.done ? "var(--drivex-success)" : "var(--drivex-warning)"
                  }}
                >
                  ${item.done ? "Готово" : "Нужно заполнить"}
                </span>
              </div>
            `)}
          </div>
        </div>

        ${notifications && notifications.length
          ? html`<div className="glass-card-light rounded-3xl p-5">
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Активность seller кабинета
              </h2>
              <div className="space-y-3 mt-4">
                ${notifications.map((item) => html`
                  <div key=${item.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style=${{
                          background: alphaBg(item.color, 0.18),
                          color: item.color
                        }}
                      >
                        <${Icon} name=${item.icon} size=${18} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${item.title}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${item.body}
                        </p>
                      </div>
                    </div>
                  </div>
                `)}
              </div>
            </div>`
          : null}

        <div className="grid grid-cols-2 gap-3">
          <a
            href="#/seller/store"
            className="py-3 rounded-2xl text-center font-semibold"
            style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
          >
            Редактировать профиль
          </a>
          <button
            type="button"
            className="py-3 rounded-2xl text-sm font-bold dx-btn"
            disabled=${!canComplete}
            onClick=${async () => {
              if (!canComplete) {
                toast.push("Заполните все поля профиля магазина");
                return;
              }
              await onCompleteSetup();
              navigateToHash("/seller/dashboard");
            }}
          >
            Завершить setup
          </button>
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerDashboardScreen({ currentUser, store, products, orders, notifications, setupState }) {
    const stats = useMemo(() => buildSellerDashboardStats(products, orders), [products, orders]);
    const recentOrders = useMemo(() => {
      return [...(Array.isArray(orders) ? orders : [])]
        .sort((left, right) => String(right.date).localeCompare(String(left.date)))
        .slice(0, 4);
    }, [orders]);
    const lowStockProducts = useMemo(() => {
      return (Array.isArray(products) ? products : [])
        .filter((product) => product.stockQty > 0 && product.stockQty <= 3)
        .slice(0, 3);
    }, [products]);

    return html`
      <${SellerLayout}
        title="Seller Dashboard"
        subtitle="Управляйте витриной, остатками и заказами без смешивания с клиентским интерфейсом."
        activeItem="dashboard"
        currentUser=${currentUser}
        store=${store}
        primaryAction=${{ path: "/seller/products/new", label: "Добавить товар" }}
      >
        <div className="grid grid-cols-2 gap-4">
          <${SellerMetricCard}
            label="Всего товаров"
            value=${stats.totalProducts}
            hint="В каталоге магазина"
            color="var(--drivex-electric-blue)"
            icon="bag"
          />
          <${SellerMetricCard}
            label="Опубликованы"
            value=${stats.publishedProducts}
            hint="Доступны покупателям"
            color="var(--drivex-success)"
            icon="sparkles"
          />
          <${SellerMetricCard}
            label="Всего заказов"
            value=${stats.totalOrders}
            hint="Текущая очередь"
            color="var(--drivex-warning)"
            icon="folder"
          />
          <${SellerMetricCard}
            label="Новые заказы"
            value=${stats.newOrders}
            hint="Требуют реакции"
            color="var(--drivex-neon-cyan)"
            icon="bell"
          />
        </div>

        <${SellerMetricCard}
          label="Мало на складе"
          value=${stats.lowStockProducts}
          hint="Нужно пополнить"
          color="var(--drivex-danger)"
          icon="scan"
        />

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                Seller статус
              </p>
              <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${setupState?.isProfileComplete ? "Профиль завершён" : "Setup продолжается"}
              </p>
            </div>
            <a href="#/seller/onboarding" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Открыть onboarding
            </a>
          </div>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
            ${setupState ? `${setupState.completedCount} из ${setupState.totalCount} пунктов профиля заполнено.` : "Профиль продавца готовится."}
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                Выручка
              </p>
              <p className="text-3xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${formatTjsPrice(stats.revenue)}
              </p>
            </div>
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style=${{
                background: "rgba(16, 185, 129, 0.16)",
                color: "var(--drivex-success)"
              }}
            >
              mock revenue
            </span>
          </div>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
            Структура готова для подключения Supabase заказов и реальных платежных статусов.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          ${[
            { path: "/seller/products/new", label: "Добавить товар", icon: "plus" },
            { path: "/seller/products", label: "Управлять товарами", icon: "edit" },
            { path: "/seller/orders", label: "Смотреть заказы", icon: "folder" },
            { path: "/seller/store", label: "Редактировать магазин", icon: "settings" }
          ].map((action) => html`
            <a key=${action.path} href=${`#${action.path}`} className="glass-card-light rounded-3xl p-4 block">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                <${Icon} name=${action.icon} size=${20} />
              </div>
              <p className="font-semibold mt-4" style=${{ color: "var(--drivex-white)" }}>
                ${action.label}
              </p>
            </a>
          `)}
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Последние заказы
            </h2>
            <a href="#/seller/orders" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Все заказы
            </a>
          </div>
          <div className="space-y-3 mt-4">
            ${recentOrders.map((order) => {
              const statusMeta = getSellerOrderStatusMeta(order.status);
              return html`
                <div key=${order.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        ${order.id}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        ${order.customerName} • ${formatRuDate(order.date)}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-semibold"
                      style=${{
                        background: alphaBg(statusMeta.color, 0.18),
                        color: statusMeta.color
                      }}
                    >
                      ${statusMeta.label}
                    </span>
                  </div>
                  <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                    ${order.items.map((item) => `${item.title} × ${item.qty}`).join(" • ")}
                  </p>
                  <p className="font-semibold mt-3" style=${{ color: "var(--drivex-white)" }}>
                    ${formatTjsPrice(order.amount)}
                  </p>
                </div>
              `;
            })}
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Низкий остаток
            </h2>
            <a href="#/seller/products" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Управлять
            </a>
          </div>
          ${lowStockProducts.length
            ? html`<div className="space-y-3 mt-4">
                ${lowStockProducts.map((product) => html`
                  <div key=${product.id} className="flex items-center gap-3">
                    <img src=${product.image} alt=${product.title} className="w-14 h-14 rounded-2xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                        ${product.title}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        Осталось ${product.stockQty} шт.
                      </p>
                    </div>
                    <a
                      href=${`#/seller/products/${product.id}/edit`}
                      className="px-3 py-2 rounded-xl text-sm font-semibold"
                      style=${{
                        background: "var(--glass-bg)",
                        color: "var(--drivex-white)"
                      }}
                    >
                      Пополнить
                    </a>
                  </div>
                `)}
              </div>`
            : html`<p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)" }}>
                Все активные позиции имеют комфортный остаток.
              </p>`}
        </div>

        ${notifications && notifications.length
          ? html`<div className="glass-card-light rounded-3xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Уведомления
                </h2>
                <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  seller feed
                </span>
              </div>
              <div className="space-y-3 mt-4">
                ${notifications.map((item) => html`
                  <div key=${item.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style=${{
                          background: alphaBg(item.color, 0.18),
                          color: item.color
                        }}
                      >
                        <${Icon} name=${item.icon} size=${18} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${item.title}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${item.body}
                        </p>
                      </div>
                    </div>
                  </div>
                `)}
              </div>
            </div>`
          : null}
      </${SellerLayout}>
    `;
  }

  function SellerProductsScreen({ currentUser, store, products, onDeleteProduct }) {
    const toast = useToast();
    const [query, setQuery] = useState("");
    const [categoryId, setCategoryId] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");

    const filteredProducts = useMemo(() => {
      const normalizedQuery = normalizeMarketSearchText(query);
      const queryTokens = normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : [];

      return (Array.isArray(products) ? products : []).filter((product) => {
        const haystack = normalizeMarketSearchText(
          [product.title, product.category, product.brand, product.sku, product.badge].filter(Boolean).join(" ")
        );

        const matchesQuery =
          !queryTokens.length || queryTokens.every((token) => haystack.includes(token));
        const matchesCategory = categoryId === "all" || product.categoryId === categoryId;

        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "in-stock" && product.stockQty > 3) ||
          (stockFilter === "low-stock" && product.stockQty > 0 && product.stockQty <= 3) ||
          (stockFilter === "out-of-stock" && product.stockQty <= 0) ||
          (stockFilter === "draft" && product.status === "draft");

        return matchesQuery && matchesCategory && matchesStock;
      });
    }, [categoryId, products, query, stockFilter]);

    return html`
      <${SellerLayout}
        title="Товары магазина"
        subtitle="Поиск, фильтры, удаление и переход к редактированию без влияния на клиентскую навигацию."
        activeItem="products"
        currentUser=${currentUser}
        store=${store}
        primaryAction=${{ path: "/seller/products/new", label: "Новый товар" }}
      >
        <div className="glass-card-light rounded-3xl p-5">
          <div className="grid grid-cols-1 gap-3">
            <${SellerField} label="Поиск товаров">
              <${SellerInput}
                type="search"
                placeholder="Название, бренд, SKU..."
                value=${query}
                onInput=${(e) => setQuery(e.target.value)}
              />
            </${SellerField}>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Категория">
                <${SellerSelect} value=${categoryId} onChange=${(e) => setCategoryId(e.target.value)}>
                  <option value="all">Все категории</option>
                  ${marketCategories
                    .filter((category) => category.id !== "all")
                    .map((category) => html`<option key=${category.id} value=${category.id}>${category.name}</option>`)}
                </${SellerSelect}>
              </${SellerField}>

              <${SellerField} label="Остатки">
                <${SellerSelect} value=${stockFilter} onChange=${(e) => setStockFilter(e.target.value)}>
                  <option value="all">Все позиции</option>
                  <option value="in-stock">В наличии</option>
                  <option value="low-stock">Мало на складе</option>
                  <option value="out-of-stock">Нет на складе</option>
                  <option value="draft">Черновики</option>
                </${SellerSelect}>
              </${SellerField}>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
            Найдено ${filteredProducts.length} позиций
          </p>
          <button
            type="button"
            className="text-sm font-semibold"
            style=${{ color: "var(--drivex-neon-cyan)" }}
            onClick=${() => {
              setQuery("");
              setCategoryId("all");
              setStockFilter("all");
            }}
          >
            Сбросить
          </button>
        </div>

        <div className="space-y-4">
          ${filteredProducts.length
            ? filteredProducts.map((product) => {
                const statusMeta = getSellerProductStatusMeta(product.status);
                return html`
                  <div key=${product.id} className="glass-card-light rounded-3xl p-4">
                    <div className="flex gap-4">
                      <img src=${product.image} alt=${product.title} className="w-20 h-20 rounded-2xl object-cover" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                              ${product.title}
                            </p>
                            <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                              ${product.category} • ${product.brand} • ${product.sku}
                            </p>
                          </div>
                          <span
                            className="px-3 py-1 rounded-xl text-xs font-semibold"
                            style=${{
                              background: alphaBg(statusMeta.color, 0.18),
                              color: statusMeta.color
                            }}
                          >
                            ${statusMeta.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <div>
                            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                              Цена
                            </p>
                            <p className="font-semibold mt-1" style=${{ color: "var(--drivex-white)" }}>
                              ${formatTjsPrice(product.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                              Остаток
                            </p>
                            <p className="font-semibold mt-1" style=${{ color: "var(--drivex-white)" }}>
                              ${product.stockQty} шт.
                            </p>
                          </div>
                          <div>
                            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                              Badge
                            </p>
                            <p className="font-semibold mt-1 truncate" style=${{ color: "var(--drivex-white)" }}>
                              ${product.badge || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <a
                            href=${`#/seller/products/${product.id}/edit`}
                            className="px-4 py-2.5 rounded-2xl text-sm font-semibold"
                            style=${{
                              background: "rgba(14, 165, 233, 0.16)",
                              color: "var(--drivex-electric-blue)"
                            }}
                          >
                            Редактировать
                          </a>
                          <button
                            type="button"
                            className="px-4 py-2.5 rounded-2xl text-sm font-semibold"
                            style=${{
                              background: "rgba(239, 68, 68, 0.14)",
                              color: "var(--drivex-danger)"
                            }}
                            onClick=${async () => {
                              const confirmed =
                                typeof window === "undefined" ? true : window.confirm(`Удалить ${product.title}?`);
                              if (!confirmed) return;
                              await onDeleteProduct(product.id);
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              })
            : html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Ничего не найдено
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  Попробуйте изменить фильтры или добавить новую позицию.
                </p>
              </div>`}
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerProductEditorScreen({ mode = "new", currentUser, store, product, onSaveProduct }) {
    const toast = useToast();
    const isEdit = mode === "edit";
    const [form, setForm] = useState(() => createSellerProductFormState(product, store?.id));
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      setForm(createSellerProductFormState(product, store?.id));
    }, [product?.id, store?.id]);

    const updateField = useCallback((key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleImagePick = useCallback(
      async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          // Попытка загрузить в Supabase Storage → product-images
          const client = getSupabaseClient();
          const cfg = window.DRIVEX_SUPABASE_CONFIG || {};
          const bucket = (cfg.buckets && cfg.buckets.productImages) || "product-images";
          if (client) {
            const storeId = store?.id || "unknown-store";
            const ext = file.name.split(".").pop() || "jpg";
            const filePath = `${storeId}/${Date.now()}.${ext}`;
            const { error } = await client.storage.from(bucket).upload(filePath, file, { upsert: true, contentType: file.type });
            if (!error) {
              const { data: urlData } = client.storage.from(bucket).getPublicUrl(filePath);
              updateField("image", urlData.publicUrl);
              updateField("imageUrl", urlData.publicUrl);
              toast.push("Фото загружено в облако");
              return;
            }
          }
          // Fallback: dataURL (локальный предпросмотр)
          const dataUrl = await prepareDocumentDataUrl(file, { maxSize: 1200, quality: 0.88 });
          if (!dataUrl) { toast.push("Не удалось обработать изображение"); return; }
          updateField("image", dataUrl);
          toast.push("Изображение загружено (локально)");
        } catch {
          toast.push("Файл не подходит");
        }
      },
      [store?.id, toast, updateField]
    );

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        const payload = normalizeSellerProduct(
          {
            ...(product || {}),
            id: isEdit && product ? product.id : undefined,
            storeId: store?.id,
            title: form.title,
            categoryId: form.categoryId,
            price: form.price,
            oldPrice: form.oldPrice,
            stockQty: form.stockQty,
            description: form.description,
            brand: form.brand,
            sku: form.sku,
            badge: form.badge,
            image: form.image,
            deliveryAvailable: form.deliveryAvailable,
            status: form.status
          },
          store?.id
        );

        try {
          setSubmitting(true);
          await onSaveProduct(payload);
          navigateToHash("/seller/products");
        } finally {
          setSubmitting(false);
        }
      },
      [form, isEdit, onSaveProduct, product, store?.id]
    );

    if (isEdit && !product) {
      return html`
        <${SellerLayout}
          title="Товар не найден"
          subtitle="Проверьте ссылку или вернитесь к списку товаров."
          activeItem="products"
          currentUser=${currentUser}
          store=${store}
        >
          <div className="glass-card-light rounded-3xl p-6">
            <a href="#/seller/products" className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
              Вернуться к товарам
            </a>
          </div>
        </${SellerLayout}>
      `;
    }

    return html`
      <${SellerLayout}
        title=${isEdit ? "Редактирование товара" : "Добавить товар"}
        subtitle="Заполните карточку товара в seller кабинете. Структура готова для будущего backend API."
        activeItem="products"
        currentUser=${currentUser}
        store=${store}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="space-y-4">
              <${SellerField} label="Название товара">
                <${SellerInput}
                  type="text"
                  placeholder="Например, Michelin Pilot Sport 4"
                  value=${form.title}
                  onInput=${(e) => updateField("title", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Категория">
                  <${SellerSelect} value=${form.categoryId} onChange=${(e) => updateField("categoryId", e.target.value)}>
                    ${marketCategories
                      .filter((category) => category.id !== "all")
                      .map((category) => html`<option key=${category.id} value=${category.id}>${category.name}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>

                <${SellerField} label="Статус">
                  <${SellerSelect} value=${form.status} onChange=${(e) => updateField("status", e.target.value)}>
                    ${sellerProductStatusOptions.map((status) => html`<option key=${status.id} value=${status.id}>${status.label}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Цена, TJS">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value=${form.price}
                    onInput=${(e) => updateField("price", e.target.value)}
                  />
                </${SellerField}>

                <${SellerField} label="Старая цена" note="необязательно">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value=${form.oldPrice}
                    onInput=${(e) => updateField("oldPrice", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Остаток, шт.">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value=${form.stockQty}
                    onInput=${(e) => updateField("stockQty", e.target.value)}
                  />
                </${SellerField}>

                <${SellerField} label="Доставка">
                  <${SellerSelect}
                    value=${form.deliveryAvailable ? "yes" : "no"}
                    onChange=${(e) => updateField("deliveryAvailable", e.target.value === "yes")}
                  >
                    <option value="yes">Есть доставка</option>
                    <option value="no">Только самовывоз</option>
                  </${SellerSelect}>
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Бренд">
                  <${SellerInput}
                    type="text"
                    placeholder="Bosch"
                    value=${form.brand}
                    onInput=${(e) => updateField("brand", e.target.value)}
                  />
                </${SellerField}>

                <${SellerField} label="SKU / артикул">
                  <${SellerInput}
                    type="text"
                    placeholder="AK-0001"
                    value=${form.sku}
                    onInput=${(e) => updateField("sku", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Badge / подпись">
                <${SellerInput}
                  type="text"
                  placeholder="Хит продаж"
                  value=${form.badge}
                  onInput=${(e) => updateField("badge", e.target.value)}
                />
              </${SellerField}>

              <${SellerField} label="Описание">
                <${SellerTextarea}
                  value=${form.description}
                  onInput=${(e) => updateField("description", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Изображение товара
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Можно оставить текущий mock image или загрузить новый
                </p>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Загрузить
                <input type="file" accept="image/*" className="hidden" onChange=${handleImagePick} />
              </label>
            </div>

            <div className="mt-4 glass-card rounded-3xl p-3">
              <img src=${form.image} alt="Preview" className="w-full h-48 object-cover rounded-2xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="#/seller/products"
              className="py-3 rounded-2xl text-center font-semibold"
              style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
            >
              Отмена
            </a>
            <button type="submit" className="py-3 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
              ${submitting ? "Сохраняем..." : isEdit ? "Сохранить изменения" : "Создать товар"}
            </button>
          </div>
        </form>
      </${SellerLayout}>
    `;
  }

  function OrderChatSummaryCard({
    order,
    orderChats,
    viewerRole = "buyer",
    actionLabel,
    actionPath
  }) {
    const lastMessage = getOrderChatLastMessage(orderChats, order?.id);
    const unreadCount = getOrderChatUnreadCount(orderChats, order?.id, viewerRole);
    const previewText = lastMessage
      ? getOrderChatPreviewText(lastMessage, viewerRole)
      : viewerRole === "seller"
        ? "Напишите покупателю по заказу"
        : "Напишите продавцу по заказу";
    const contactName =
      viewerRole === "seller"
        ? order?.customerName || "Покупатель"
        : order?.storeName || "Продавец";
    const contactMeta =
      viewerRole === "seller"
        ? order?.customerPhone || "Номер не указан"
        : order?.id || "Заказ";
    const avatarLabel = (
      String(contactName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("") || (viewerRole === "seller" ? "PK" : "DX")
    )
      .slice(0, 2)
      .toUpperCase();
    const phoneHref =
      viewerRole === "seller" && order?.customerPhone && String(order.customerPhone).trim()
        ? `tel:${String(order.customerPhone).replace(/[^\d+]/g, "")}`
        : "";

    return html`
      <div
        className="rounded-[26px] p-4 mt-4"
        style=${{
          background: "linear-gradient(180deg, rgba(20, 25, 37, 0.95) 0%, rgba(13, 16, 25, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.06)"
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-[16px] flex items-center justify-center text-sm font-bold flex-shrink-0"
            style=${{
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(15, 23, 42, 0.92) 100%)",
              border: "1px solid rgba(6, 182, 212, 0.12)",
              color: "var(--drivex-neon-cyan)"
            }}
          >
            ${avatarLabel}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                  ${contactName}
                </p>
                <p className="text-xs mt-1 truncate" style=${{ color: "var(--drivex-silver)" }}>
                  ${contactMeta}
                </p>
              </div>

              ${unreadCount
                ? html`<span
                    className="min-w-[28px] h-7 px-2 rounded-full text-xs font-semibold inline-flex items-center justify-center flex-shrink-0"
                    style=${{
                      background: "rgba(6, 182, 212, 0.16)",
                      color: "var(--drivex-neon-cyan)",
                      border: "1px solid rgba(6, 182, 212, 0.14)"
                    }}
                  >
                    ${unreadCount}
                  </span>`
                : null}
            </div>

            <p
              className="text-sm mt-3"
              style=${{
                color: "var(--drivex-white)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.45
              }}
            >
              ${previewText}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
            ${lastMessage ? formatChatTime(lastMessage.sentAt) : "Диалог ещё не начат"}
          </p>
          <div className="flex items-center gap-2">
            ${phoneHref
              ? html`<a
                  href=${phoneHref}
                  aria-label="Позвонить покупателю"
                  className="w-11 h-11 rounded-[16px] inline-flex items-center justify-center flex-shrink-0"
                  style=${{
                    background: "rgba(255, 255, 255, 0.04)",
                    color: "var(--drivex-neon-cyan)",
                    border: "1px solid rgba(255, 255, 255, 0.06)"
                  }}
                >
                  <${Icon} name="phone" size=${18} />
                </a>`
              : null}
            <a
              href=${`#${actionPath}`}
              className="px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap"
              style=${{
                background: "rgba(6, 182, 212, 0.16)",
                color: "var(--drivex-neon-cyan)",
                border: "1px solid rgba(6, 182, 212, 0.12)"
              }}
            >
              ${actionLabel}
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function OrderChatScreen({
    order,
    orderChats,
    viewerRole = "buyer",
    backPath = "/orders",
    currentUser,
    store,
    onSendMessage,
    onMarkRead
  }) {
    const toast = useToast();
    const [draftMessage, setDraftMessage] = useState("");
    const messagesEndRef = useRef(null);
    const safeViewerRole = viewerRole === "seller" ? "seller" : "buyer";
    const thread = useMemo(() => getOrderChatThread(orderChats, order?.id), [orderChats, order?.id]);
    const messages = thread.messages;

    useEffect(() => {
      setDraftMessage("");
    }, [order?.id, safeViewerRole]);

    useEffect(() => {
      if (!order?.id) return;
      onMarkRead && onMarkRead(order.id, safeViewerRole);
    }, [messages.length, onMarkRead, order?.id, safeViewerRole]);

    useEffect(() => {
      if (!messagesEndRef.current || typeof messagesEndRef.current.scrollIntoView !== "function") return;

      try {
        messagesEndRef.current.scrollIntoView({
          behavior: messages.length > 1 ? "smooth" : "auto",
          block: "end"
        });
      } catch {
        messagesEndRef.current.scrollIntoView();
      }
    }, [messages.length]);

    const handleSubmit = useCallback(
      (event) => {
        event.preventDefault();
        const text = String(draftMessage || "").trim();
        if (!text) {
          toast.push("Введите сообщение");
          return;
        }
        if (!order?.id) {
          toast.push("Заказ не найден");
          return;
        }
        onSendMessage && onSendMessage(order.id, safeViewerRole, text);
        setDraftMessage("");
      },
      [draftMessage, onSendMessage, order?.id, safeViewerRole, toast]
    );

    const handleKeyDown = useCallback(
      (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          const text = String(draftMessage || "").trim();
          if (!text || !order?.id) return;
          onSendMessage && onSendMessage(order.id, safeViewerRole, text);
          setDraftMessage("");
        }
      },
      [draftMessage, onSendMessage, order?.id, safeViewerRole]
    );

    const statusMeta = order
      ? safeViewerRole === "seller"
        ? getSellerOrderStatusMeta(order.status)
        : getBuyerOrderStatusMeta(order.status)
      : getBuyerOrderStatusMeta("new");
    const itemsLabel =
      order && Array.isArray(order.items) && order.items.length
        ? order.items.map((item) => `${item.title} × ${item.qty}`).join(" • ")
        : "Состав заказа недоступен";
    const backLabel = safeViewerRole === "seller" ? "Назад к заказам магазина" : "Назад к истории заказов";
    const contactName =
      safeViewerRole === "seller"
        ? order?.customerName || "Покупатель"
        : order?.storeName || "Магазин DRIVEX";
    const contactMeta =
      safeViewerRole === "seller"
        ? order?.customerPhone || "Номер не указан"
        : formatRuDate(order?.date);
    const contactInitials = (
      String(contactName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("") || (safeViewerRole === "seller" ? "PK" : "DX")
    )
      .slice(0, 2)
      .toUpperCase();
    const phoneHref =
      order?.customerPhone && String(order.customerPhone).trim()
        ? `tel:${String(order.customerPhone).replace(/[^\d+]/g, "")}`
        : "";
    const metaChips = [order?.id || "Заказ", order?.deliveryMethod || "Доставка", formatTjsPrice(order?.amount)];
    const pageContent = order
      ? html`
          <div className=${safeViewerRole === "seller" ? "space-y-4" : "px-6 py-6 space-y-4"}>
            ${safeViewerRole === "seller"
              ? html`<a
                  href=${`#${backPath}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                  style=${{ color: "var(--drivex-neon-cyan)" }}
                >
                  <${Icon} name="chevron-left" size=${16} />
                  ${backLabel}
                </a>`
              : null}

            <div
              className="rounded-[30px] p-5"
              style=${{
                background: "linear-gradient(180deg, rgba(18, 24, 38, 0.92) 0%, rgba(10, 13, 20, 0.98) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.14)"
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-[18px] flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style=${{
                    background: "linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(15, 23, 42, 0.92) 100%)",
                    border: "1px solid rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  ${contactInitials}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold truncate" style=${{ color: "var(--drivex-white)" }}>
                        ${contactName}
                      </h2>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        ${contactMeta}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      ${safeViewerRole === "seller" && phoneHref
                        ? html`<a
                            href=${phoneHref}
                            aria-label="Позвонить покупателю"
                            className="w-10 h-10 rounded-[16px] inline-flex items-center justify-center"
                            style=${{
                              background: "rgba(255, 255, 255, 0.04)",
                              color: "var(--drivex-neon-cyan)",
                              border: "1px solid rgba(255, 255, 255, 0.06)"
                            }}
                          >
                            <${Icon} name="phone" size=${18} />
                          </a>`
                        : null}
                      <span
                        className="px-3 py-1 rounded-xl text-xs font-semibold"
                        style=${{
                          background: alphaBg(statusMeta.color, 0.18),
                          color: statusMeta.color
                        }}
                      >
                        ${statusMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    ${metaChips.map((chip, index) => html`
                      <span
                        key=${`${order.id}-chat-meta-${index}`}
                        className="px-3 py-1.5 rounded-full text-xs"
                        style=${{
                          background: "rgba(255, 255, 255, 0.04)",
                          color: "var(--drivex-silver)",
                          border: "1px solid rgba(255, 255, 255, 0.05)"
                        }}
                      >
                        ${chip}
                      </span>
                    `)}
                  </div>

                  <p
                    className="text-sm mt-4"
                    style=${{
                      color: "var(--drivex-white)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    ${itemsLabel}
                  </p>

                  <p
                    className="text-xs mt-4"
                    style=${{
                      color: "var(--drivex-silver)",
                      lineHeight: 1.45
                    }}
                  >
                    ${order.address || "Адрес уточняется"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="px-1 py-1"
              style=${{
                background: "transparent",
                border: "none"
              }}
            >
              <div className="space-y-3">
                ${messages.length
                  ? messages.map((message) => {
                      const isOwnMessage = message.senderRole === safeViewerRole;
                      return html`
                        <div
                          key=${message.id}
                          className=${`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div className="max-w-[76%]">
                            <div
                              className="px-4"
                              style=${{
                                paddingTop: "14px",
                                paddingBottom: "10px",
                                borderRadius: isOwnMessage ? "26px 26px 12px 26px" : "26px 26px 26px 12px",
                                background: isOwnMessage ? "rgba(6, 182, 212, 0.13)" : "rgba(255, 255, 255, 0.035)",
                                border: isOwnMessage
                                  ? "1px solid rgba(6, 182, 212, 0.14)"
                                  : "1px solid rgba(255, 255, 255, 0.06)",
                                boxShadow: isOwnMessage
                                  ? "0 12px 26px rgba(6, 182, 212, 0.06)"
                                  : "0 10px 22px rgba(0, 0, 0, 0.12)"
                              }}
                            >
                              <p
                                className="whitespace-pre-wrap"
                                style=${{
                                  color: "var(--drivex-white)",
                                  wordBreak: "break-word",
                                  fontSize: "15px",
                                  lineHeight: 1.58
                                }}
                              >
                                ${message.text}
                              </p>
                              <div className=${`mt-1.5 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                <span
                                  className="text-[11px]"
                                  style=${{
                                    color: "var(--drivex-silver)",
                                    lineHeight: 1,
                                    transform: "translateY(-1px)"
                                  }}
                                >
                                  ${formatChatTime(message.sentAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      `;
                    })
                  : html`<div className="py-12 text-center">
                      <div
                        className="w-14 h-14 rounded-[18px] mx-auto flex items-center justify-center text-sm font-bold"
                        style=${{
                          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(15, 23, 42, 0.9) 100%)",
                          border: "1px solid rgba(6, 182, 212, 0.12)",
                          color: "var(--drivex-neon-cyan)"
                        }}
                      >
                        ${contactInitials}
                      </div>
                      <p className="font-semibold mt-4" style=${{ color: "var(--drivex-white)" }}>
                        Пока сообщений нет
                      </p>
                      <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                        ${safeViewerRole === "seller" ? "Напишите покупателю первым." : "Напишите продавцу первым."}
                      </p>
                    </div>`}
                <div ref=${messagesEndRef}></div>
              </div>
            </div>

            <div
              className="pt-4 mt-2"
              style=${{
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                background: "rgba(12, 15, 22, 0.97)"
              }}
            >
              <form onSubmit=${handleSubmit}>
                <div className="flex items-end gap-3">
                  <div
                    className="flex-1 rounded-[20px] px-4 py-3"
                    style=${{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)"
                    }}
                  >
                    <textarea
                      rows="1"
                      value=${draftMessage}
                      onInput=${(event) => {
                        setDraftMessage(event.target.value);
                        event.target.style.height = "auto";
                        event.target.style.height = Math.min(event.target.scrollHeight, 120) + "px";
                      }}
                      onKeyDown=${handleKeyDown}
                      placeholder=${safeViewerRole === "seller" ? "Ответить покупателю..." : "Написать продавцу..."}
                      className="w-full outline-none dx-input"
                      style=${{
                        color: "var(--drivex-white)",
                        minHeight: "24px",
                        maxHeight: "120px",
                        resize: "none",
                        background: "transparent",
                        padding: 0,
                        lineHeight: 1.5
                      }}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-12 h-12 rounded-[18px] flex-shrink-0 flex items-center justify-center"
                    disabled=${!draftMessage.trim()}
                    style=${{
                      background: draftMessage.trim()
                        ? "linear-gradient(135deg, rgba(6, 182, 212, 0.92) 0%, rgba(8, 145, 178, 0.96) 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                      color: draftMessage.trim() ? "var(--drivex-white)" : "var(--drivex-silver)",
                      border: "1px solid rgba(6, 182, 212, 0.22)",
                      opacity: draftMessage.trim() ? 1 : 0.5,
                      boxShadow: draftMessage.trim() ? "0 8px 20px rgba(6, 182, 212, 0.18)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    <${Icon} name="send" size=${20} />
                  </button>
                </div>
                <p className="text-xs mt-2 text-center" style=${{ color: "rgba(255,255,255,0.22)" }}>
                  Enter — отправить · Shift+Enter — новая строка
                </p>
              </form>
            </div>
          </div>
        `
      : html`
          <div className=${safeViewerRole === "seller" ? "space-y-4" : "px-6 py-6 space-y-4"}>
            <a
              href=${`#${backPath}`}
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style=${{ color: "var(--drivex-neon-cyan)" }}
            >
              <${Icon} name="chevron-left" size=${16} />
              ${backLabel}
            </a>
            <div className="glass-card-light rounded-3xl p-6 text-center">
              <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                Заказ для чата не найден
              </p>
              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                Вернитесь к списку заказов и откройте чат из карточки нужного заказа.
              </p>
            </div>
          </div>
        `;

    return safeViewerRole === "seller"
        ? html`
          <${SellerLayout}
            title="Чат по заказу"
            subtitle="Связь с покупателем по заказу."
            activeItem="orders"
            currentUser=${currentUser}
            store=${store}
            showStoreSummary=${false}
          >
            ${pageContent}
          </${SellerLayout}>
        `
      : html`
          <${SimplePage} title="Чат по заказу" backPath=${backPath}>
            ${pageContent}
          </${SimplePage}>
        `;
  }

  function SellerOrdersScreen({ currentUser, store, orders, orderChats, onUpdateOrderStatus }) {
    const toast = useToast();
    const [updatingOrderIds, setUpdatingOrderIds] = useState({});
    const sortedOrders = useMemo(() => {
      return [...(Array.isArray(orders) ? orders : [])].sort((left, right) =>
        String(right.date).localeCompare(String(left.date))
      );
    }, [orders]);
    const handleOrderAction = useCallback(
      async (order, action) => {
        if (!order?.id || !action?.status || updatingOrderIds[order.id]) return;

        setUpdatingOrderIds((prev) => ({
          ...prev,
          [order.id]: true
        }));

        try {
          await onUpdateOrderStatus(order.id, action.status);
          toast.push(action.successMessage || "Статус заказа обновлён");
        } finally {
          setUpdatingOrderIds((prev) => {
            const next = { ...prev };
            delete next[order.id];
            return next;
          });
        }
      },
      [onUpdateOrderStatus, toast, updatingOrderIds]
    );

    return html`
      <${SellerLayout}
        title="Заказы магазина"
        subtitle="Меняйте статусы, отслеживайте суммы и держите команду в курсе по каждому заказу."
        activeItem="orders"
        currentUser=${currentUser}
        store=${store}
      >
        <div className="space-y-4">
          ${sortedOrders.length
            ? sortedOrders.map((order) => {
                const statusMeta = getSellerOrderStatusMeta(order.status);
                const isPickupOrder = isPickupSellerOrder(order);
                const nextActions = getSellerOrderActions(order);
                const isStatusLocked = nextActions.length === 0;
                const isUpdating = Boolean(updatingOrderIds[order.id]);
                const orderPhoneHref =
                  order?.customerPhone && String(order.customerPhone).trim()
                    ? `tel:${String(order.customerPhone).replace(/[^\d+]/g, "")}`
                    : "";
                const itemsCount = (Array.isArray(order.items) ? order.items : []).reduce(
                  (sum, item) => sum + (Number(item.qty) || 0),
                  0
                );
                const statusHint = isStatusLocked
                  ? order.status === "completed"
                    ? "Заказ завершён"
                    : "Заказ закрыт"
                  : isPickupOrder
                    ? "Ожидает следующий шаг по самовывозу"
                    : "Ожидает следующий шаг по доставке";

                return html`
                  <div
                    key=${order.id}
                    className="rounded-[30px] p-5"
                    style=${{
                      background: "linear-gradient(180deg, rgba(20, 25, 37, 0.94) 0%, rgba(12, 16, 24, 0.98) 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.14)"
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${order.id}
                        </p>
                        <p className="text-sm mt-1 truncate" style=${{ color: "var(--drivex-silver)" }}>
                          ${order.customerName} • ${order.customerPhone}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          ${[formatRuDate(order.date), order.deliveryMethod, `${itemsCount} товара`].map((chip, index) => html`
                            <span
                              key=${`${order.id}-seller-chip-${index}`}
                              className="px-3 py-1.5 rounded-full text-xs"
                              style=${{
                                background: "rgba(255, 255, 255, 0.04)",
                                color: "var(--drivex-silver)",
                                border: "1px solid rgba(255, 255, 255, 0.05)"
                              }}
                            >
                              ${chip}
                            </span>
                          `)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        ${orderPhoneHref
                          ? html`<a
                              href=${orderPhoneHref}
                              aria-label="Позвонить покупателю"
                              className="w-10 h-10 rounded-[16px] inline-flex items-center justify-center"
                              style=${{
                                background: "rgba(255, 255, 255, 0.04)",
                                color: "var(--drivex-neon-cyan)",
                                border: "1px solid rgba(255, 255, 255, 0.06)"
                              }}
                            >
                              <${Icon} name="phone" size=${18} />
                            </a>`
                          : null}
                        <span
                          className="px-3 py-1 rounded-xl text-xs font-semibold"
                          style=${{
                            background: alphaBg(statusMeta.color, 0.18),
                            color: statusMeta.color
                          }}
                        >
                          ${statusMeta.label}
                        </span>
                      </div>
                    </div>

                    <div
                      className="rounded-[24px] p-4 mt-4"
                      style=${{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.05)"
                      }}
                    >
                      <div className="space-y-2">
                        ${order.items.map((item) => html`
                          <div key=${`${order.id}-${item.title}`} className="flex items-center justify-between gap-3">
                            <span className="text-sm" style=${{ color: "var(--drivex-white)" }}>
                              ${item.title} × ${item.qty}
                            </span>
                            <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                              ${formatTjsPrice(item.qty * item.price)}
                            </span>
                          </div>
                        `)}
                      </div>
                    </div>

                    <${OrderStatusTimeline} order=${order} variant="seller" />

                    <p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)", lineHeight: 1.5 }}>
                      ${order.address || "Адрес будет уточнён"}${order.notes ? ` • ${order.notes}` : ""}
                    </p>

                    <${OrderChatSummaryCard}
                      order=${order}
                      orderChats=${orderChats}
                      viewerRole="seller"
                      actionLabel="Ответить покупателю"
                      actionPath=${getSellerOrderChatPath(order.id)}
                    />

                    <div className="flex items-center justify-between gap-3 mt-4">
                      <div>
                        <p className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                          ${formatTjsPrice(order.amount)}
                        </p>
                        <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                          ${cloudEnabled
                            ? "Документы сохраняются в облаке и доступны под вашей учётной записью."
                            : "Фото документов сохранено на этом устройстве"}
                        </p>
                      </div>
                      <div className="min-w-[180px] text-right">
                        <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                          ${isUpdating
                            ? "Сохраняем статус..."
                            : isStatusLocked
                              ? "Финальный статус"
                              : "Следующий шаг заказа"}
                        </p>
                        <p className="font-semibold mt-2" style=${{ color: statusMeta.color }}>
                          ${statusMeta.label}
                        </p>
                      </div>
                    </div>

                    ${nextActions.length
                      ? html`<div className="flex gap-2 mt-4 flex-wrap">
                          ${nextActions.map((action) => {
                            const isCancelAction = action.status === "cancelled";

                            return html`<button
                              key=${`${order.id}-${action.id}`}
                              type="button"
                              className="px-5 h-12 rounded-full text-sm font-semibold inline-flex items-center justify-center"
                              disabled=${isUpdating}
                              style=${{
                                minWidth: isCancelAction ? "132px" : "164px",
                                background: isCancelAction
                                  ? alphaBg(action.color, 0.12)
                                  : `linear-gradient(135deg, ${alphaBg(action.color, 0.26)} 0%, ${alphaBg(action.color, 0.12)} 100%)`,
                                color: action.color,
                                border: `1px solid ${alphaBg(action.color, isCancelAction ? 0.16 : 0.2)}`,
                                boxShadow: isCancelAction ? "none" : `0 14px 28px ${alphaBg(action.color, 0.12)}`,
                                opacity: isUpdating ? 0.6 : 1
                              }}
                              onClick=${() => handleOrderAction(order, action)}
                            >
                              ${isUpdating ? "Сохраняем..." : action.label}
                            </button>`;
                          })}
                        </div>`
                      : html`<div className="mt-4">
                          <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                            ${order.status === "completed"
                              ? "Заказ завершён и закрыт."
                              : "Заказ отменён. Дальнейшие действия не требуются."}
                          </p>
                        </div>`}
                  </div>
                `;
              })
            : html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Заказов пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  Когда покупатели оформят товары, новые заказы появятся здесь.
                </p>
              </div>`}
        </div>
      </${SellerLayout}>
    `;
  }

  function SellerStoreSettingsScreen({ currentUser, store, onSaveStore }) {
    const toast = useToast();
    const [form, setForm] = useState(() => createSellerStoreFormState(store));
    const [submitting, setSubmitting] = useState(false);
    const safeStore = normalizeSellerStore(store);
    const setupState = getSellerSetupState(store, {
      ownerFullName: form.ownerName || safeStore.ownerName,
      phone: form.phone,
      registrationCompleted: safeStore.registrationCompleted
    });

    useEffect(() => {
      setForm(createSellerStoreFormState(store));
    }, [store?.id]);

    const updateField = useCallback((key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleLogoPick = useCallback(
      async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareAvatarDataUrl(file, { size: 320, quality: 0.9 });
          if (!dataUrl) {
            toast.push("Логотип не удалось загрузить");
            return;
          }
          updateField("logo", dataUrl);
          toast.push("Логотип обновлён");
        } catch {
          toast.push("Файл не подходит");
        }
      },
      [toast, updateField]
    );

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        try {
          setSubmitting(true);
          await onSaveStore(
            normalizeSellerStore(
              {
                ...(store || {}),
                ...form
              },
              store?.id
            )
          );
          toast.push("Настройки магазина сохранены");
        } finally {
          setSubmitting(false);
        }
      },
      [form, onSaveStore, store, toast]
    );

    return html`
      <${SellerLayout}
        title="Настройки магазина"
        subtitle="Профиль магазина редактируется отдельно от клиентской витрины. Адрес, локация и выдача выровнены под быстрый seller setup."
        activeItem="store"
        currentUser=${currentUser}
        store=${store}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center gap-4">
              <${SellerLogo} store=${{ ...store, logo: form.logo, name: form.name }} size=${72} rounded="22px" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Логотип магазина
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Можно загрузить новый логотип или оставить текущий placeholder.
                </p>
                <div className="flex gap-2 flex-wrap mt-3">
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style=${{
                      background: setupState.isProfileComplete ? "rgba(16, 185, 129, 0.16)" : "rgba(245, 158, 11, 0.16)",
                      color: setupState.isProfileComplete ? "var(--drivex-success)" : "var(--drivex-warning)"
                    }}
                  >
                    ${setupState.isProfileComplete ? "Профиль завершён" : "Setup продолжается"}
                  </span>
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style=${{
                      background: "rgba(6, 182, 212, 0.16)",
                      color: "var(--drivex-neon-cyan)"
                    }}
                  >
                    ${setupState.completedCount}/${setupState.totalCount} пунктов
                  </span>
                </div>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Загрузить
                <input type="file" accept="image/*" className="hidden" onChange=${handleLogoPick} />
              </label>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Профиль магазина
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Основная информация о магазине и владельце
                </p>
              </div>
              <span
                className="px-3 py-1 rounded-xl text-xs font-semibold"
                style=${{
                  background: "rgba(14, 165, 233, 0.16)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                ${form.storeCategory || "Категория"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Название магазина">
                <${SellerInput} type="text" value=${form.name} onInput=${(e) => updateField("name", e.target.value)} />
              </${SellerField}>
              <${SellerField} label="Владелец">
                <${SellerInput}
                  type="text"
                  value=${form.ownerName}
                  onInput=${(e) => updateField("ownerName", e.target.value)}
                />
              </${SellerField}>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Город">
                <${SellerInput} type="text" value=${form.city} onInput=${(e) => updateField("city", e.target.value)} />
              </${SellerField}>
              <${SellerField} label="Телефон">
                <${SellerInput} type="tel" value=${form.phone} onInput=${(e) => updateField("phone", e.target.value)} />
              </${SellerField}>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Категория магазина">
                  <${SellerSelect}
                    value=${form.storeCategory}
                    onChange=${(e) => updateField("storeCategory", e.target.value)}
                  >
                    <option value="">Выберите категорию</option>
                    ${sellerStoreCategoryOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Тип продаж">
                  <${SellerSelect}
                    value=${form.businessType}
                    onChange=${(e) => updateField("businessType", e.target.value)}
                  >
                    <option value="">Выберите тип продаж</option>
                    ${sellerBusinessTypeOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style=${{
                  background: "rgba(14, 165, 233, 0.16)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                <${Icon} name="map" size=${19} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Адрес и локация
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Аккуратный блок адреса для карты, доставки и самовывоза
                </p>
              </div>
            </div>

            <${SellerField} label="Точный адрес">
              <${SellerInput} type="text" value=${form.address} onInput=${(e) => updateField("address", e.target.value)} />
            </${SellerField}>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Ориентир / метка">
                <${SellerInput}
                  type="text"
                  value=${form.locationLabel}
                  onInput=${(e) => updateField("locationLabel", e.target.value)}
                />
              </${SellerField}>
              <${SellerField} label="Геолокация">
                <${SellerInput}
                  type="text"
                  value=${form.geolocation}
                  onInput=${(e) => updateField("geolocation", e.target.value)}
                />
              </${SellerField}>
            </div>

            <div
              className="rounded-3xl p-4"
              style=${{
                background: "linear-gradient(145deg, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.88) 100%)",
                border: "1px solid rgba(14, 165, 233, 0.18)"
              }}
            >
              <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                Preview location
              </p>
              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                ${form.city || "Город"} • ${form.address || "Адрес пока не указан"}
              </p>
              <p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                ${form.locationLabel || "Добавьте ориентир"}${form.geolocation ? ` • ${form.geolocation}` : ""}
              </p>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Формат продаж
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Настройте выдачу, доставку и часы работы магазина
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                style=${{
                  background: form.deliveryAvailable ? "rgba(16, 185, 129, 0.16)" : "var(--glass-bg)",
                  color: form.deliveryAvailable ? "var(--drivex-success)" : "var(--drivex-white)"
                }}
                onClick=${() => updateField("deliveryAvailable", !form.deliveryAvailable)}
              >
                Доставка ${form.deliveryAvailable ? "включена" : "выключена"}
              </button>
              <button
                type="button"
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                style=${{
                  background: form.pickupAvailable ? "rgba(14, 165, 233, 0.16)" : "var(--glass-bg)",
                  color: form.pickupAvailable ? "var(--drivex-electric-blue)" : "var(--drivex-white)"
                }}
                onClick=${() => updateField("pickupAvailable", !form.pickupAvailable)}
              >
                Самовывоз ${form.pickupAvailable ? "включен" : "выключен"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <${SellerField} label="Радиус доставки">
                <${SellerInput}
                  type="text"
                  value=${form.deliveryRadius}
                  onInput=${(e) => updateField("deliveryRadius", e.target.value)}
                />
              </${SellerField}>
              <${SellerField} label="Часы работы">
                <${SellerInput}
                  type="text"
                  value=${form.workingHours}
                  onInput=${(e) => updateField("workingHours", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5 space-y-4">
            <${SellerField} label="Описание магазина">
              <${SellerTextarea}
                value=${form.description}
                onInput=${(e) => updateField("description", e.target.value)}
              />
            </${SellerField}>

            <div className="flex items-center justify-between gap-3">
              <a
                href=${setupState.isProfileComplete ? "#/seller/products" : "#/seller/onboarding"}
                className="py-3 px-4 rounded-2xl text-center font-semibold"
                style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
              >
                ${setupState.isProfileComplete ? "К товарам" : "К onboarding"}
              </a>
              <button type="submit" className="px-5 py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
                ${submitting ? "Сохраняем..." : "Сохранить настройки"}
              </button>
            </div>
          </div>
        </form>
      </${SellerLayout}>
    `;
  }

  function SellerNotFoundScreen({ currentUser, store }) {
    return html`
      <${SellerLayout}
        title="Страница не найдена"
        subtitle="Проверьте seller route или вернитесь в основные разделы кабинета."
        activeItem="dashboard"
        currentUser=${currentUser}
        store=${store}
      >
        <div className="glass-card-light rounded-3xl p-6">
          <a href="#/seller/dashboard" className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
            В dashboard
          </a>
        </div>
      </${SellerLayout}>
    `;
  }


  // ── Export to DX.screens (chain: app-main.js читает отсюда) ──
  DX.screens = DX.screens || {};
  if (typeof createSellerProductFormState !== 'undefined') DX.screens['createSellerProductFormState'] = createSellerProductFormState;
  if (typeof createSellerStoreFormState !== 'undefined') DX.screens['createSellerStoreFormState'] = createSellerStoreFormState;
  if (typeof OrderChatScreen !== 'undefined') DX.screens['OrderChatScreen'] = OrderChatScreen;
  if (typeof OrderChatSummaryCard !== 'undefined') DX.screens['OrderChatSummaryCard'] = OrderChatSummaryCard;
  if (typeof PartnerLoginScreen !== 'undefined') DX.screens['PartnerLoginScreen'] = PartnerLoginScreen;
  if (typeof PartnerRegisterIntroScreen !== 'undefined') DX.screens['PartnerRegisterIntroScreen'] = PartnerRegisterIntroScreen;
  if (typeof SellerAccessDeniedScreen !== 'undefined') DX.screens['SellerAccessDeniedScreen'] = SellerAccessDeniedScreen;
  if (typeof SellerDashboardScreen !== 'undefined') DX.screens['SellerDashboardScreen'] = SellerDashboardScreen;
  if (typeof SellerField !== 'undefined') DX.screens['SellerField'] = SellerField;
  if (typeof SellerInput !== 'undefined') DX.screens['SellerInput'] = SellerInput;
  if (typeof SellerLayout !== 'undefined') DX.screens['SellerLayout'] = SellerLayout;
  if (typeof SellerLogo !== 'undefined') DX.screens['SellerLogo'] = SellerLogo;
  if (typeof SellerMetricCard !== 'undefined') DX.screens['SellerMetricCard'] = SellerMetricCard;
  if (typeof SellerNotFoundScreen !== 'undefined') DX.screens['SellerNotFoundScreen'] = SellerNotFoundScreen;
  if (typeof SellerOnboardingScreen !== 'undefined') DX.screens['SellerOnboardingScreen'] = SellerOnboardingScreen;
  if (typeof SellerOrdersScreen !== 'undefined') DX.screens['SellerOrdersScreen'] = SellerOrdersScreen;
  if (typeof SellerProductEditorScreen !== 'undefined') DX.screens['SellerProductEditorScreen'] = SellerProductEditorScreen;
  if (typeof SellerProductsScreen !== 'undefined') DX.screens['SellerProductsScreen'] = SellerProductsScreen;
  if (typeof SellerRegistrationScreen !== 'undefined') DX.screens['SellerRegistrationScreen'] = SellerRegistrationScreen;
  if (typeof SellerSelect !== 'undefined') DX.screens['SellerSelect'] = SellerSelect;
  if (typeof SellerStoreSettingsScreen !== 'undefined') DX.screens['SellerStoreSettingsScreen'] = SellerStoreSettingsScreen;
  if (typeof SellerTextarea !== 'undefined') DX.screens['SellerTextarea'] = SellerTextarea;
})();
