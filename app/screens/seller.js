// app/screens/seller.js
(() => {
  'use strict';
  const DX = window.DX;
  const html = DX.html;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon = DX.Icon;
  const alphaBg = DX.alphaBg;
  const SellerLayout    = function(p) { var F=(window.DX.screens||{}).SellerLayout;    return F?F(p):(p.children||null); };
  const SellerField     = function(p) { var F=(window.DX.screens||{}).SellerField;     return F?F(p):(p.children||null); };
  const SellerInput     = function(p) { var F=(window.DX.screens||{}).SellerInput;     return F?F(p):null; };
  const SellerTextarea  = function(p) { var F=(window.DX.screens||{}).SellerTextarea;  return F?F(p):null; };
  const SellerSelect    = function(p) { var F=(window.DX.screens||{}).SellerSelect;    return F?F(p):null; };
  const SellerMetricCard= function(p) { var F=(window.DX.screens||{}).SellerMetricCard;return F?F(p):null; };
  const OrderChatSummaryCard = function(p) { var F=(window.DX.screens||{}).OrderChatSummaryCard; return F?F(p):null; };
  const OrderStatusTimeline  = function(p) { var F=(window.DX.screens||{}).OrderStatusTimeline||window.DX.OrderStatusTimeline; return F?F(p):null; };
  const SellerNotFoundScreen = function(p) { var F=(window.DX.screens||{}).SellerNotFoundScreen; return F?F(p):null; };
  function useToast() { return (window.DX.useToast||function(){return{push:function(){}};})(); }
  const navigateToHash = function(path) { window.DX.navigateToHash && window.DX.navigateToHash(path); };
  const SimplePage = function(p) { var F=(window.DX.screens||{}).SimplePage||window.DX.SimplePage; return F?F(p):(p.children||null); };
  const formatTjsPrice = function(n) { return window.DX.formatTjsPrice?window.DX.formatTjsPrice(n):(String(n)+' сом.'); };
  const genId = function(p) { return window.DX.genId?window.DX.genId(p):(p+'-'+Date.now()); };
  const slugifyText = function(s,f) { return window.DX.slugifyText?window.DX.slugifyText(s,f):String(s||f||'x'); };
  const normalizeSellerStore = function(s,id) { return window.DX.normalizeSellerStore?window.DX.normalizeSellerStore(s,id):s||{}; };
  const normalizeSellerProfile = function(p,s) { return window.DX.normalizeSellerProfile?window.DX.normalizeSellerProfile(p,s):p||{}; };
  const getSellerSetupState = function(s,p) { return window.DX.getSellerSetupState?window.DX.getSellerSetupState(s,p):{isProfileComplete:false,completedCount:0,totalCount:1}; };
  const buildSellerDashboardStats = function(p,o) { return window.DX.buildSellerDashboardStats?window.DX.buildSellerDashboardStats(p,o):{}; };
  const prepareDocumentDataUrl = function(f,o) { return window.DX.prepareDocumentDataUrl?window.DX.prepareDocumentDataUrl(f,o):Promise.resolve(''); };
  const prepareAvatarDataUrl = function(f,o) { return window.DX.prepareAvatarDataUrl?window.DX.prepareAvatarDataUrl(f,o):Promise.resolve(''); };

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

  DX.screens = DX.screens || {};
  DX.screens.createSellerProductFormState = createSellerProductFormState;
  DX.screens.createSellerStoreFormState = createSellerStoreFormState;
  DX.screens.SellerLogo = SellerLogo;
  DX.screens.SellerField = SellerField;
  DX.screens.SellerInput = SellerInput;
  DX.screens.SellerTextarea = SellerTextarea;
  DX.screens.SellerSelect = SellerSelect;
  DX.screens.SellerLayout = SellerLayout;
  DX.screens.SellerMetricCard = SellerMetricCard;
  DX.screens.SellerAccessDeniedScreen = SellerAccessDeniedScreen;
  DX.screens.PartnerLoginScreen = PartnerLoginScreen;
  DX.screens.PartnerRegisterIntroScreen = PartnerRegisterIntroScreen;
  DX.screens.SellerRegistrationScreen = SellerRegistrationScreen;
  DX.screens.SellerOnboardingScreen = SellerOnboardingScreen;
  DX.screens.SellerDashboardScreen = SellerDashboardScreen;
})();

