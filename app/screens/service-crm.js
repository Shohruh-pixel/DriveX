// Service CRM
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

  function getServicePhoneHref(phone = "") {
    const safePhone = String(phone || "").trim().replace(/[^\d+]/g, "");
    return safePhone ? `tel:${safePhone}` : "";
  }

  function ServiceStatusChip({ label, color }) {
    return html`<span
      className="px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-2"
      style=${{
        background: alphaBg(color, 0.16),
        color,
        border: `1px solid ${alphaBg(color, 0.24)}`
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style=${{ background: color }}
      ></span>
      ${label}
    </span>`;
  }

  function ServicePhoneButton({ phone, label = "Позвонить", compact = false }) {
    const href = getServicePhoneHref(phone);
    if (!href) return null;

    return html`<a
      href=${href}
      className=${compact
        ? "w-12 h-12 rounded-2xl inline-flex items-center justify-center flex-shrink-0"
        : "px-4 py-3 rounded-2xl inline-flex items-center justify-center gap-2 text-sm font-semibold"}
      style=${{
        background: compact ? "rgba(14, 165, 233, 0.12)" : "rgba(14, 165, 233, 0.14)",
        color: "var(--drivex-electric-blue)",
        border: "1px solid rgba(14, 165, 233, 0.18)",
        boxShadow: compact ? "0 10px 20px rgba(14, 165, 233, 0.12)" : "none"
      }}
      aria-label=${label}
    >
      <${Icon} name="phone" size=${compact ? 18 : 16} />
      ${compact ? null : label}
    </a>`;
  }

  function ServiceCrmLayout({
    title,
    subtitle,
    activeItem,
    currentUser,
    center,
    primaryAction,
    showCenterSummary = true,
    showNavigation = true,
    children
  }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeUser = normalizeServiceSession(currentUser);
    const logoStore = {
      ...safeCenter,
      accent: "var(--drivex-electric-blue)"
    };
    // Выход — только через подтверждение: случайный тап не должен выкидывать
    // владельца из кабинета.
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    return html`
      <div className="scx-shell">
        <header className="scx-header">
          <div className="scx-header-row">
            ${showCenterSummary
              ? html`<${SellerLogo} store=${logoStore} size=${44} rounded="14px" />
                  <div className="scx-header-id">
                    <p className="scx-header-name">${safeCenter.name || "Новый сервис"}</p>
                    <p className="scx-header-meta">
                      ${[safeCenter.serviceType, safeCenter.city].filter(Boolean).join(" • ") || "Service CRM"}
                    </p>
                  </div>`
              : html`<div className="scx-header-id">
                    <p className="scx-header-name">DRIVEX Service CRM</p>
                    <p className="scx-header-meta">Кабинет автосервиса</p>
                  </div>`}
            <div className="scx-header-actions">
              <a href="#/services" className="scx-chip-btn" aria-label="Каталог сервисов">
                <${Icon} name="layers" size=${15} />
              </a>
              ${showNavigation
                ? html`<button
                    type="button"
                    className="scx-chip-btn is-danger"
                    aria-label="Выйти из кабинета"
                    onClick=${() => setLogoutConfirmOpen(true)}
                  >
                    <${Icon} name="logout" size=${15} />
                  </button>`
                : null}
            </div>
          </div>

          ${logoutConfirmOpen
            ? html`<div className="scx-modal-backdrop" onClick=${() => setLogoutConfirmOpen(false)}>
                <div className="scx-modal" onClick=${(event) => event.stopPropagation()}>
                  <p className="scx-modal-title">Выйти из кабинета?</p>
                  <p className="scx-modal-text">
                    Данные сервиса сохранены. Для входа понадобятся email и пароль владельца.
                  </p>
                  <div className="scx-modal-actions">
                    <button
                      type="button"
                      className="scx-modal-btn is-danger"
                      onClick=${() => {
                        setLogoutConfirmOpen(false);
                        navigateToHash("/service-crm/login?logout=1");
                      }}
                    >
                      <${Icon} name="logout" size=${15} />
                      Выйти
                    </button>
                    <button
                      type="button"
                      className="scx-modal-btn"
                      onClick=${() => setLogoutConfirmOpen(false)}
                    >
                      Остаться
                    </button>
                  </div>
                </div>
              </div>`
            : null}

          ${showNavigation
            ? html`<nav className="scx-nav no-scrollbar" aria-label="Разделы CRM">
                ${serviceCrmNavigationItems.map((item) => {
                  const isActive = item.id === activeItem;
                  return html`
                    <a
                      key=${item.id}
                      href=${`#${item.path}`}
                      className=${`scx-nav-item ${isActive ? "is-active" : ""}`}
                      aria-current=${isActive ? "page" : "false"}
                    >
                      <${Icon} name=${item.icon} size=${15} />
                      ${item.label}
                    </a>
                  `;
                })}
              </nav>`
            : null}
        </header>

        <div className="scx-title-row">
          <div className="min-w-0">
            <h1 className="scx-title">${title}</h1>
            ${subtitle ? html`<p className="scx-subtitle">${subtitle}</p>` : null}
          </div>
          ${primaryAction && showNavigation
            ? html`<a href=${`#${primaryAction.path}`} className="scx-primary-link">
                ${primaryAction.label}
              </a>`
            : null}
        </div>

        <div className="scx-content">${children}</div>
      </div>
    `;
  }

  function ServicePartnerRegisterIntroScreen({ onStart }) {
    const highlights = [
      {
        title: "Клиенты и машины",
        body: "База клиентов, история визитов, номера телефонов и автомобили в одной ленте.",
        color: "var(--drivex-electric-blue)",
        icon: "user"
      },
      {
        title: "Ремонты по статусам",
        body: "Онлайн статусы ремонта: в очереди, в работе и готово без путаницы по бумажкам.",
        color: "var(--drivex-warning)",
        icon: "wrench"
      },
      {
        title: "Склад и финансы",
        body: "Остатки запчастей, выручка, расходы и отчёты прямо внутри CRM.",
        color: "var(--drivex-success)",
        icon: "card"
      }
    ];

    return html`
      <${ServiceCrmLayout}
        title="Отдельный CRM для сервиса"
        subtitle="Сначала заполняем карточку автосервиса, затем сразу открываем рабочий кабинет мастера и администратора."
        activeItem="dashboard"
        currentUser=${createDefaultServiceSession()}
        center=${createServiceCenterSeed()}
        showCenterSummary=${false}
        showNavigation=${false}
      >
        <div
          className="rounded-[32px] p-6"
          style=${{
            background: "linear-gradient(145deg, rgba(6, 182, 212, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)",
            border: "1px solid rgba(6, 182, 212, 0.18)"
          }}
        >
          <p className="text-xs font-semibold tracking-[0.22em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
            SERVICE FIRST
          </p>
          <h2 className="text-[34px] font-bold mt-3" style=${{ color: "var(--drivex-white)", lineHeight: "1.08" }}>
            Современный digital-кабинет
            <br />
            для автосервиса
          </h2>
          <p className="text-sm mt-4 max-w-[320px]" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
            Регистрируете сервис один раз, после чего получаете удобную платформу: запись, ремонты, клиенты,
            склад и финансы на русском языке.
          </p>

          <div className="flex flex-wrap gap-2 mt-5">
            ${["Онлайн статусы ремонта", "Телефон под рукой", "Боксы и загрузка", "Отчёты без Excel"].map((chip) => html`
              <span
                key=${chip}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style=${{
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "var(--drivex-white)"
                }}
              >
                ${chip}
              </span>
            `)}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          ${highlights.map((item) => html`
            <div key=${item.title} className="glass-card-light rounded-3xl p-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style=${{
                  background: alphaBg(item.color, 0.18),
                  color: item.color
                }}
              >
                <${Icon} name=${item.icon} size=${22} />
              </div>
              <p className="text-lg font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                ${item.title}
              </p>
              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                ${item.body}
              </p>
            </div>
          `)}
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
            Что будет сразу после регистрации
          </p>
          <div className="space-y-3 mt-4">
            ${[
              "Учет клиентов и машин",
              "Заказы на ремонт с живыми статусами",
              "Склад запчастей и минимальные остатки",
              "Финансы и отчёты по выручке",
              "Расписание по боксам: кто занят, кто свободен"
            ].map((line) => html`
              <div key=${line} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style=${{
                    background: "rgba(6, 182, 212, 0.14)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="check" size=${14} />
                </div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  ${line}
                </p>
              </div>
            `)}
          </div>
        </div>

        <button type="button" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" onClick=${() => onStart && onStart()}>
          Зарегистрировать сервис
        </button>

        <p className="text-sm text-center" style=${{ color: "var(--drivex-silver)" }}>
          Уже есть кабинет?${" "}
          <a href="#/service-crm/login" style=${{ color: "var(--drivex-neon-cyan)", fontWeight: 600 }}>Войти</a>
        </p>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceLoginScreen({ onLogin, onGoRegister, message = "" }) {
    const toast = useToast();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

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
          setFormError("");
          await onLogin?.({
            identifier,
            email: identifier,
            phone: identifier,
            password
          });
        } catch (error) {
          const nextError = error?.message || "Не удалось войти в Service CRM";
          setFormError(nextError);
          toast.push(nextError);
        } finally {
          setSubmitting(false);
        }
      },
      [identifier, onLogin, password, toast]
    );

    return html`
      <${ServiceCrmLayout}
        title="Вход в Service CRM"
        subtitle=${message || "Email или телефон владельца — и вы в кабинете"}
        activeItem="dashboard"
        currentUser=${createDefaultServiceSession()}
        center=${createServiceCenterSeed("service-login")}
        showCenterSummary=${false}
        showNavigation=${false}
      >
        <form className="scx-login-card" onSubmit=${handleSubmit}>
          <div className="scx-login-logo">
            <${Icon} name="wrench" size=${26} />
          </div>

          <${SellerField} label="Email или телефон">
            <${SellerInput}
              type="text"
              placeholder="service@mail.com или +992…"
              value=${identifier}
              onInput=${(e) => {
                setFormError("");
                setIdentifier(e.target.value);
              }}
            />
          </${SellerField}>

          <${SellerField} label="Пароль">
            <div className="scx-pass-wrap">
              <${SellerInput}
                type=${showPassword ? "text" : "password"}
                placeholder="Ваш пароль"
                value=${password}
                onInput=${(e) => {
                  setFormError("");
                  setPassword(e.target.value);
                }}
              />
              <button
                type="button"
                className="scx-pass-toggle"
                onClick=${() => setShowPassword((v) => !v)}
              >
                ${showPassword ? "Скрыть" : "Показать"}
              </button>
            </div>
          </${SellerField}>

          ${formError
            ? html`<p className="scx-form-error">${formError}</p>`
            : null}

          <button type="submit" className="scx-login-submit" disabled=${submitting}>
            ${submitting ? "Входим…" : "Войти в CRM"}
          </button>

          <p className="scx-login-alt">
            Нет сервиса?
            <button type="button" onClick=${() => onGoRegister && onGoRegister()}>
              Зарегистрировать
            </button>
          </p>
        </form>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceRegistrationScreen({ currentUser, profile, center, onRegister }) {
    const toast = useToast();
    // password живёт ТОЛЬКО в состоянии формы: он уходит в Supabase Auth
    // при регистрации и нигде не сохраняется (normalizeServiceProfile его режет).
    const [profileForm, setProfileForm] = useState(() => ({
      ...normalizeServiceProfile(profile, currentUser),
      password: ""
    }));
    const [centerForm, setCenterForm] = useState(() => createServiceCenterFormState(center));
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const updateProfileField = useCallback((key, value) => {
      setFormError("");
      setProfileForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const updateCenterField = useCallback((key, value) => {
      setFormError("");
      setCenterForm((prev) => ({ ...prev, [key]: value }));
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
          updateCenterField("logo", dataUrl);
          toast.push("Логотип добавлен");
        } catch {
          toast.push("Файл не подходит");
        }
      },
      [toast, updateCenterField]
    );

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        const requiredFields = [
          [profileForm.ownerFullName, "Введите ФИО владельца"],
          [profileForm.phone, "Введите телефон владельца"],
          [profileForm.email, "Введите email"],
          [profileForm.password, "Введите пароль"],
          [centerForm.name, "Введите название сервиса"],
          [centerForm.serviceType, "Выберите тип сервиса"],
          [centerForm.city, "Введите город"],
          [centerForm.address, "Введите адрес сервиса"]
        ];

        const firstMissing = requiredFields.find(([value]) => !String(value || "").trim());
        if (firstMissing) {
          setFormError(firstMissing[1]);
          toast.push(firstMissing[1]);
          return;
        }

        if (!isCompleteTjPhone(profileForm.phone)) {
          const phoneError = "Введите полный номер владельца после +992";
          setFormError(phoneError);
          toast.push(phoneError);
          return;
        }

        try {
          setSubmitting(true);
          setFormError("");
          const ownerPhone = normalizeTjPhoneInput(profileForm.phone);
          const centerPhone = isCompleteTjPhone(centerForm.phone)
            ? normalizeTjPhoneInput(centerForm.phone)
            : ownerPhone;

          await onRegister({
            profile: {
              ...profileForm,
              phone: ownerPhone,
              registrationCompleted: true
            },
            center: {
              ...centerForm,
              boxesCount: Math.max(1, Math.floor(Number(centerForm.boxesCount) || 1)),
              phone: centerPhone,
              email: centerForm.email || profileForm.email,
              description:
                centerForm.description || `${centerForm.name || "Сервис"} — цифровой сервисный центр DRIVEX.`,
              registrationCompleted: true,
              status: "active"
            }
          });
        } catch (error) {
          const nextError = error?.message || "Не удалось зарегистрировать сервис";
          setFormError(nextError);
          toast.push(nextError);
        } finally {
          setSubmitting(false);
        }
      },
      [centerForm, onRegister, profileForm, toast]
    );

    const previewCenter = {
      ...center,
      ...centerForm,
      boxesCount: Math.max(1, Math.floor(Number(centerForm.boxesCount) || 1))
    };

    return html`
      <${ServiceCrmLayout}
        title="Регистрация сервиса"
        subtitle="Заполните базовую информацию о сервисе. После этого сразу откроется отдельная CRM-платформа."
        activeItem="settings"
        currentUser=${currentUser}
        center=${center}
        showCenterSummary=${false}
        showNavigation=${false}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Владелец сервиса
            </h2>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <${SellerField} label="ФИО владельца">
                <${SellerInput}
                  type="text"
                  placeholder="Шохрух Махкамов"
                  value=${profileForm.ownerFullName}
                  onInput=${(e) => updateProfileField("ownerFullName", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Телефон">
                  <${SellerInput}
                    type="tel"
                    placeholder="+992 92 000 00 00"
                    value=${profileForm.phone}
                    onInput=${(e) => updateProfileField("phone", normalizeTjPhoneInput(e.target.value))}
                  />
                </${SellerField}>
                <${SellerField} label="Должность">
                  <${SellerInput}
                    type="text"
                    placeholder="Владелец сервиса"
                    value=${profileForm.position}
                    onInput=${(e) => updateProfileField("position", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Email">
                  <${SellerInput}
                    type="email"
                    placeholder="service@drivex.tj"
                    value=${profileForm.email}
                    onInput=${(e) => updateProfileField("email", e.target.value)}
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
                  Карточка сервиса
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Тип сервиса, местоположение, боксы и контакты
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
              <${SellerLogo}
                store=${{
                  ...previewCenter,
                  accent: "var(--drivex-electric-blue)"
                }}
                size=${72}
                rounded="22px"
              />
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${centerForm.name || "Название сервиса"}
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  ${centerForm.serviceType || "Тип сервиса"}${centerForm.city ? ` • ${centerForm.city}` : ""}
                </p>
                <p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  ${Math.max(1, Math.floor(Number(centerForm.boxesCount) || 1))} бокса • ${centerForm.workingHours || "08:00 — 19:00"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-5">
              <${SellerField} label="Название сервиса">
                <${SellerInput}
                  type="text"
                  placeholder="Khujand Auto Hub"
                  value=${centerForm.name}
                  onInput=${(e) => updateCenterField("name", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Тип сервиса">
                  <${SellerSelect}
                    value=${centerForm.serviceType}
                    onChange=${(e) => updateCenterField("serviceType", e.target.value)}
                  >
                    <option value="">Выберите тип</option>
                    ${serviceCenterTypeOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Количество боксов">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="3"
                    value=${centerForm.boxesCount}
                    onInput=${(e) => updateCenterField("boxesCount", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Город">
                  <${SellerInput}
                    type="text"
                    placeholder="Худжанд"
                    value=${centerForm.city}
                    onInput=${(e) => updateCenterField("city", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Часы работы">
                  <${SellerInput}
                    type="text"
                    placeholder="08:00 — 19:00"
                    value=${centerForm.workingHours}
                    onInput=${(e) => updateCenterField("workingHours", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Точный адрес">
                <${SellerInput}
                  type="text"
                  placeholder="Худжанд, 8 мкр, ул. Сомони 12"
                  value=${centerForm.address}
                  onInput=${(e) => updateCenterField("address", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Ориентир">
                  <${SellerInput}
                    type="text"
                    placeholder="Рядом с кольцом 8 мкр"
                    value=${centerForm.locationLabel}
                    onInput=${(e) => updateCenterField("locationLabel", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Геолокация">
                  <${SellerInput}
                    type="text"
                    placeholder="40.2837, 69.6222"
                    value=${centerForm.geolocation}
                    onInput=${(e) => updateCenterField("geolocation", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Телефон сервиса">
                  <${SellerInput}
                    type="tel"
                    placeholder="+992 92 777 00 77"
                    value=${centerForm.phone}
                    onInput=${(e) => updateCenterField("phone", normalizeTjPhoneInput(e.target.value))}
                  />
                </${SellerField}>
                <${SellerField} label="Email сервиса">
                  <${SellerInput}
                    type="email"
                    placeholder="info@service.tj"
                    value=${centerForm.email}
                    onInput=${(e) => updateCenterField("email", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Описание сервиса">
                <${SellerTextarea}
                  value=${centerForm.description}
                  onInput=${(e) => updateCenterField("description", e.target.value)}
                  placeholder="Какие услуги оказывает сервис, чем он отличается и как работает."
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
            ${submitting ? "Создаём сервис..." : "Открыть Service CRM"}
          </button>
        </form>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceDashboardScreen({ currentUser, center, clients, orders, finance, appointments, newRequestsCount = 0 }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeClients = normalizeServiceClientsList(clients, safeCenter.id).filter((item) => !isDemoServiceClient(item));
    const safeOrders = normalizeServiceRepairOrdersList(orders, safeCenter.id).filter((item) => !isDemoServiceOrder(item));
    const safeFinance = normalizeServiceFinanceList(finance, safeCenter.id).filter((item) => !isDemoServiceFinanceEntry(item));
    const safeAppointments = normalizeServiceAppointmentsList(appointments, safeCenter.id)
      .filter((item) => !isDemoServiceAppointment(item))
      .sort((a, b) => `${a.day} ${a.startTime}`.localeCompare(`${b.day} ${b.startTime}`));
    const stats = buildServiceDashboardStats(safeCenter, safeClients, safeOrders, safeFinance, safeAppointments);
    const activeRepairs = safeOrders.filter((item) => item.status === "queued" || item.status === "progress").slice(0, 4);
    const todayAppointments = safeAppointments.filter((item) => item.day === toLocalISODate()).slice(0, 4);
    const latestClients = [...safeClients]
      .sort((a, b) => String(b.lastVisit || "").localeCompare(String(a.lastVisit || "")))
      .slice(0, 3);

    return html`
      <${ServiceCrmLayout}
        title="CRM сервиса"
        subtitle="Клиенты, ремонты, боксы и деньги в одном отдельном рабочем кабинете."
        activeItem="dashboard"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/orders", label: "Ремонты" }}
      >
        ${newRequestsCount > 0
          ? html`<a
              href="#/service-crm/requests"
              className="flex items-center justify-between gap-3 rounded-3xl p-4"
              style=${{
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)"
              }}
            >
              <div>
                <p className="font-bold" style=${{ color: "var(--drivex-warning)" }}>
                  ${newRequestsCount} ${pluralize(newRequestsCount, "новая заявка", "новые заявки", "новых заявок")}
                </p>
                <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Клиенты ждут подтверждения записи
                </p>
              </div>
              <span className="px-4 py-2 rounded-2xl text-sm font-bold" style=${{ background: "var(--drivex-warning)", color: "#1a1206" }}>
                Открыть
              </span>
            </a>`
          : null}
        <div className="scx-status-strip">
          ${[
            `${safeCenter.boxesCount} ${pluralize(Number(safeCenter.boxesCount) || 1, "бокс", "бокса", "боксов")}`,
            safeCenter.workingHours || "08:00 — 19:00",
            `свободно сейчас: ${stats.freeBoxes}`
          ].map((chip) => html`<span key=${chip} className="scx-status-chip">${chip}</span>`)}
          <a href="#/service-crm/settings" className="scx-status-chip is-link" aria-label="Настройки сервиса">
            <${Icon} name="settings" size=${13} />
            Настройки
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <${SellerMetricCard}
            label="Клиенты"
            value=${String(stats.clients)}
            hint=${`${stats.vehicles} ${pluralize(stats.vehicles, "машина", "машины", "машин")}`}
            color="var(--drivex-electric-blue)"
            icon="user"
            path="/service-crm/clients"
            actionLabel="Открыть базу"
          />
          <${SellerMetricCard}
            label="Активные ремонты"
            value=${String(stats.activeRepairs)}
            hint=${`готово: ${stats.readyRepairs}`}
            color="var(--drivex-warning)"
            icon="wrench"
            path="/service-crm/orders"
            actionLabel="К ремонтам"
          />
          <${SellerMetricCard}
            label="Свободные боксы"
            value=${String(stats.freeBoxes)}
            hint=${`занято: ${stats.busyBoxes}`}
            color="var(--drivex-success)"
            icon="layers"
            path="/service-crm/schedule"
            actionLabel="Смотреть запись"
          />
          <${SellerMetricCard}
            label="Выручка месяца"
            value=${formatTjsPrice(stats.monthRevenue)}
            hint=${`сегодня: ${stats.todayBookings} ${pluralize(stats.todayBookings, "запись", "записи", "записей")}`}
            color="var(--drivex-neon-cyan)"
            icon="card"
            path="/service-crm/finance"
            actionLabel="К финансам"
          />
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Ремонты в работе
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Всё, что требует внимания прямо сейчас
              </p>
            </div>
            <a href="#/service-crm/orders" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Все ремонты
            </a>
          </div>

          ${activeRepairs.length
            ? html`<div className="space-y-3 mt-4">
                ${activeRepairs.map((order) => html`
                  <div key=${order.id} className="glass-card rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${order.clientName}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${order.carLabel} • ${order.problem}
                        </p>
                        <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                          ${order.id} • ${order.boxLabel} • ${order.estimate}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <${ServiceStatusChip} label=${order.statusLabel} color=${order.statusColor} />
                        <${ServicePhoneButton} phone=${order.clientPhone} compact=${true} label="Позвонить клиенту" />
                      </div>
                    </div>
                  </div>
                `)}
              </div>`
            : html`<div className="glass-card rounded-3xl p-4 mt-4">
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Сейчас активных ремонтов нет. Можно принимать новые записи.
                </p>
              </div>`}
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Сегодня по записи
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Кто занят, кто ждёт и где свободное окно
              </p>
            </div>
            <a href="#/service-crm/schedule" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              Расписание
            </a>
          </div>

          ${todayAppointments.length
            ? html`<div className="space-y-3 mt-4">
                ${todayAppointments.map((slot) => html`
                  <div key=${slot.id} className="glass-card rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${slot.startTime} — ${slot.endTime} • ${slot.boxLabel}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${slot.clientName || "Свободное окно"}${slot.workLabel ? ` • ${slot.workLabel}` : ""}
                        </p>
                      </div>
                      <${ServiceStatusChip} label=${slot.statusLabel} color=${slot.statusColor} />
                    </div>
                  </div>
                `)}
              </div>`
            : html`<div className="glass-card rounded-3xl p-4 mt-4">
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  На сегодня записи ещё не заполнены.
                </p>
              </div>`}
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Последние клиенты
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Телефон и машины под рукой
              </p>
            </div>
            <a href="#/service-crm/clients" className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
              База клиентов
            </a>
          </div>

          <div className="space-y-3 mt-4">
            ${latestClients.length
              ? latestClients.map((client) => html`
                  <div key=${client.id} className="glass-card rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                          ${client.name}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${client.vehicles.map((vehicle) => `${vehicle.brand} ${vehicle.model}`).join(" • ") || "Машина пока не добавлена"}
                        </p>
                        <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                          Последний визит: ${formatRuDate(client.lastVisit)}
                        </p>
                      </div>
                      <${ServicePhoneButton} phone=${client.phone} compact=${true} label="Позвонить клиенту" />
                    </div>
                  </div>
                `)
              : html`<div className="glass-card rounded-3xl p-4">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    Клиенты появятся после реальной записи или ремонта.
                  </p>
                </div>`}
          </div>
        </div>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceClientsScreen({ currentUser, center, clients, orders, appointments }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeClients = normalizeServiceClientsList(clients, safeCenter.id)
      .filter((item) => !isDemoServiceClient(item))
      .sort((a, b) => String(b.lastVisit || "").localeCompare(String(a.lastVisit || "")));
    const safeOrders = normalizeServiceRepairOrdersList(orders, safeCenter.id).filter((item) => !isDemoServiceOrder(item));
    const safeAppointments = normalizeServiceAppointmentsList(appointments, safeCenter.id)
      .filter((item) => !isDemoServiceAppointment(item));
    const vehicleCount = countServiceVehicles(safeClients);
    const [selectedClientId, setSelectedClientId] = useState("");
    const selectedClient = safeClients.find((client) => client.id === selectedClientId) || null;
    const selectedPhoneDigits = String(selectedClient?.phone || "").replace(/\D/g, "");
    const selectedHistory = selectedClient
      ? [
          ...safeAppointments
            .filter((slot) => {
              const phoneDigits = String(slot.phone || "").replace(/\D/g, "");
              return phoneDigits && phoneDigits === selectedPhoneDigits;
            })
            .map((slot) => ({
              id: `slot-${slot.id}`,
              type: "Запись",
              title: slot.workLabel || "Запись в сервис",
              meta: `${formatRuDate(slot.day)} • ${slot.startTime} — ${slot.endTime} • ${slot.boxLabel}`,
              statusLabel: slot.statusLabel,
              statusColor: slot.statusColor
            })),
          ...safeOrders
            .filter((order) => order.clientId === selectedClient.id || String(order.clientPhone || "").replace(/\D/g, "") === selectedPhoneDigits)
            .map((order) => ({
              id: `order-${order.id}`,
              type: "Ремонт",
              title: order.problem || order.completedWork || "Ремонт",
              meta: `${order.id} • ${order.carLabel || "Авто"} • ${formatTjsPrice(order.total)}`,
              statusLabel: order.statusLabel,
              statusColor: order.statusColor
            }))
        ]
      : [];

    const getLoyaltyColor = (loyalty) => {
      if (/vip/i.test(loyalty)) return "var(--drivex-warning)";
      if (/постоян/i.test(loyalty)) return "var(--drivex-success)";
      return "var(--drivex-silver)";
    };

    return html`
      <${ServiceCrmLayout}
        title="Клиенты и машины"
        subtitle="Здесь удобный учёт клиентской базы, телефонов и автомобилей по каждому визиту."
        activeItem="clients"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/orders", label: "Ремонты" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <${SellerMetricCard}
            label="Клиенты"
            value=${String(safeClients.length)}
            hint="Живая база сервиса"
            color="var(--drivex-electric-blue)"
            icon="user"
          />
          <${SellerMetricCard}
            label="Машины"
            value=${String(vehicleCount)}
            hint="Закреплены за клиентами"
            color="var(--drivex-neon-cyan)"
            icon="car"
          />
        </div>

        <div className="space-y-4">
          ${safeClients.map((client) => {
            const loyaltyColor = getLoyaltyColor(client.loyalty);
            return html`
              <div
                key=${client.id}
                role="button"
                tabIndex="0"
                className="glass-card-light rounded-3xl p-5 w-full text-left cursor-pointer"
                onClick=${() => setSelectedClientId(client.id)}
                onKeyDown=${(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedClientId(client.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${client.name}
                      </p>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style=${{
                          background: alphaBg(loyaltyColor, 0.16),
                          color: loyaltyColor
                        }}
                      >
                        ${client.loyalty}
                      </span>
                    </div>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${client.phone}
                    </p>
                    <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      Последний визит: ${formatRuDate(client.lastVisit)}
                    </p>
                  </div>
                  <${ServicePhoneButton} phone=${client.phone} compact=${true} label="Позвонить клиенту" />
                </div>

                ${client.note
                  ? html`<div className="glass-card rounded-3xl p-4 mt-4">
                      <p className="text-sm" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                        ${client.note}
                      </p>
                    </div>`
                  : null}

                <div className="space-y-3 mt-4">
                  ${client.vehicles.map((vehicle) => html`
                    <div key=${vehicle.id} className="glass-card rounded-3xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                            ${vehicle.brand} ${vehicle.model}
                          </p>
                          <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                            ${vehicle.year}${vehicle.plate ? ` • ${vehicle.plate}` : ""}${vehicle.mileage ? ` • ${vehicle.mileage}` : ""}
                          </p>
                        </div>
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center"
                          style=${{
                            background: "rgba(6, 182, 212, 0.14)",
                            color: "var(--drivex-neon-cyan)"
                          }}
                        >
                          <${Icon} name="car" size=${18} />
                        </div>
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            `;
          })}
          ${!safeClients.length
            ? html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="user" size=${22} />
                </div>
                <p className="font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                  Клиентов пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                  Здесь будет только реальная база клиентов, без демо-записей.
                </p>
              </div>`
            : null}
        </div>

        ${selectedClient
          ? html`<div
              className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4"
              style=${{ background: "rgba(2, 6, 23, 0.72)", backdropFilter: "blur(14px)" }}
            >
              <div
                className="w-full max-w-md rounded-3xl p-5"
                style=${{
                  background: "linear-gradient(180deg, rgba(18, 27, 43, 0.98), rgba(8, 13, 24, 0.98))",
                  border: "1px solid rgba(6, 182, 212, 0.22)",
                  boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.45)"
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      ИСТОРИЯ КЛИЕНТА
                    </p>
                    <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      ${selectedClient.name}
                    </h3>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${selectedClient.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center"
                    style=${{ color: "var(--drivex-silver)" }}
                    onClick=${() => setSelectedClientId("")}
                  >
                    <${Icon} name="x" size=${18} />
                  </button>
                </div>

                <div className="space-y-3 mt-5">
                  ${selectedHistory.length
                    ? selectedHistory.map((entry) => html`
                        <div key=${entry.id} className="glass-card rounded-3xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>
                                ${entry.type}
                              </p>
                              <p className="font-semibold mt-1" style=${{ color: "var(--drivex-white)" }}>
                                ${entry.title}
                              </p>
                              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                                ${entry.meta}
                              </p>
                            </div>
                            <${ServiceStatusChip} label=${entry.statusLabel} color=${entry.statusColor} />
                          </div>
                        </div>
                      `)
                    : html`<div className="glass-card rounded-3xl p-4">
                        <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                          История появится после первой записи или ремонта.
                        </p>
                      </div>`}
                </div>
              </div>
            </div>`
          : null}
      </${ServiceCrmLayout}>
    `;
  }

  // ── Входящие заявки: клиент записался онлайн → сервис подтверждает ──
  function ServiceRequestsScreen({ currentUser, center, requests, onAcceptRequest, onDeclineRequest }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeRequests = normalizeServiceRequestsList(requests)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const newRequests = safeRequests.filter((item) => item.status === "new");
    const acceptedCount = safeRequests.filter((item) => ["accepted", "progress", "ready"].includes(item.status)).length;
    const declinedCount = safeRequests.filter((item) => item.status === "declined").length;
    const [declineDraftId, setDeclineDraftId] = useState("");
    const [declineReason, setDeclineReason] = useState("");

    const submitDecline = (requestId) => {
      onDeclineRequest && onDeclineRequest(requestId, declineReason);
      setDeclineDraftId("");
      setDeclineReason("");
    };

    return html`
      <${ServiceCrmLayout}
        title="Входящие заявки"
        subtitle="Онлайн-записи клиентов. Подтвердите — и заявка превратится в клиента, слот и ремонтный заказ."
        activeItem="requests"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/schedule", label: "Запись" }}
      >
        <div className="grid grid-cols-3 gap-3">
          <${SellerMetricCard}
            label="Новые"
            value=${String(newRequests.length)}
            color="var(--drivex-warning)"
            icon="bell"
          />
          <${SellerMetricCard}
            label="Подтверждено"
            value=${String(acceptedCount)}
            color="var(--drivex-electric-blue)"
            icon="check"
          />
          <${SellerMetricCard}
            label="Отклонено"
            value=${String(declinedCount)}
            color="var(--drivex-danger)"
            icon="close"
          />
        </div>

        ${safeRequests.length
          ? html`<div className="space-y-4">
              ${safeRequests.map((request) => html`
                <div key=${request.id} className="glass-card-light rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${request.clientName}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        ${[request.carLabel, request.clientPhone].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <${ServicePhoneButton} phone=${request.clientPhone} compact=${true} label="Позвонить клиенту" />
                      <${ServiceStatusChip} label=${request.statusLabel} color=${request.statusColor} />
                    </div>
                  </div>

                  <div className="glass-card rounded-3xl p-4 mt-4">
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      ${request.workLabel || "Работы уточняются"}
                    </p>
                    ${request.note
                      ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                          ${request.note}
                        </p>`
                      : null}
                    <div className="flex flex-wrap gap-2 mt-4">
                      ${[
                        `${formatRuDate(request.day)} • ${request.time}`,
                        request.carLabel || "Машина не указана"
                      ].map((chip) => html`
                        <span
                          key=${`${request.id}-${chip}`}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style=${{ background: "rgba(255, 255, 255, 0.05)", color: "var(--drivex-silver)" }}
                        >
                          ${chip}
                        </span>
                      `)}
                    </div>
                    ${request.status === "declined" && request.declineReason
                      ? html`<p className="text-sm mt-3" style=${{ color: "var(--drivex-danger)" }}>
                          Причина: ${request.declineReason}
                        </p>`
                      : null}
                  </div>

                  ${request.status === "new"
                    ? declineDraftId === request.id
                      ? html`<div className="mt-4 space-y-3">
                          <input
                            className="dx-input w-full"
                            placeholder="Причина отказа (клиент увидит её)"
                            value=${declineReason}
                            onInput=${(event) => setDeclineReason(event.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold"
                              style=${{ background: "rgba(239, 68, 68, 0.16)", color: "var(--drivex-danger)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                              onClick=${() => submitDecline(request.id)}
                            >
                              Отклонить заявку
                            </button>
                            <button
                              type="button"
                              className="px-4 py-3 rounded-2xl text-sm font-semibold"
                              style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)", border: "1px solid var(--glass-border)" }}
                              onClick=${() => { setDeclineDraftId(""); setDeclineReason(""); }}
                            >
                              Отмена
                            </button>
                          </div>
                        </div>`
                      : html`<div className="flex gap-2 mt-4">
                          <button
                            type="button"
                            className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold dx-btn"
                            onClick=${() => onAcceptRequest && onAcceptRequest(request.id)}
                          >
                            Подтвердить запись
                          </button>
                          <button
                            type="button"
                            className="px-4 py-3 rounded-2xl text-sm font-semibold"
                            style=${{ background: "rgba(239, 68, 68, 0.12)", color: "var(--drivex-danger)", border: "1px solid rgba(239, 68, 68, 0.24)" }}
                            onClick=${() => { setDeclineDraftId(request.id); setDeclineReason(""); }}
                          >
                            Отклонить
                          </button>
                        </div>`
                    : null}
                </div>
              `)}
            </div>`
          : html`<div className="glass-card-light rounded-3xl p-8 text-center">
              <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>Заявок пока нет</p>
              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                Когда клиент запишется к вам через DRIVEX, заявка появится здесь —
                подтвердите её, и она превратится в клиента, слот и ремонтный заказ.
              </p>
            </div>`}
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceOrdersScreen({ currentUser, center, orders, onUpdateStatus }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeOrders = normalizeServiceRepairOrdersList(orders, safeCenter.id)
      .filter((item) => !isDemoServiceOrder(item))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    const queuedCount = safeOrders.filter((item) => item.status === "queued").length;
    const progressCount = safeOrders.filter((item) => item.status === "progress").length;
    const readyCount = safeOrders.filter((item) => item.status === "ready").length;
    const [completionDraft, setCompletionDraft] = useState(null);

    const openCompletionDraft = (order) => {
      setCompletionDraft({
        orderId: order.id,
        clientName: order.clientName,
        carLabel: order.carLabel,
        workSummary: order.completedWork || order.problem || "",
        total: order.total ? String(order.total) : ""
      });
    };

    const updateCompletionDraft = (field, value) => {
      setCompletionDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const submitCompletionDraft = () => {
      if (!completionDraft) return;
      const workSummary = String(completionDraft.workSummary || "").trim();
      const total = Math.max(0, Math.floor(Number(String(completionDraft.total || "").replace(/[^\d.]/g, "")) || 0));
      if (!workSummary || total <= 0) return;

      onUpdateStatus &&
        onUpdateStatus(completionDraft.orderId, "ready", {
          workSummary,
          total
        });
      setCompletionDraft(null);
    };

    return html`
      <${ServiceCrmLayout}
        title="Ремонты и статусы"
        subtitle="Заказы на ремонт, статусы, телефон клиента и состав работ без лишнего шума."
        activeItem="orders"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/schedule", label: "Запись" }}
      >
        <div className="grid grid-cols-3 gap-3">
          <${SellerMetricCard}
            label="В очереди"
            value=${String(queuedCount)}
            color="var(--drivex-warning)"
            icon="calendar"
          />
          <${SellerMetricCard}
            label="В работе"
            value=${String(progressCount)}
            color="var(--drivex-neon-cyan)"
            icon="wrench"
          />
          <${SellerMetricCard}
            label="Готово"
            value=${String(readyCount)}
            color="var(--drivex-success)"
            icon="check"
          />
        </div>

        <div className="space-y-4">
          ${safeOrders.map((order) => {
            const actions = getServiceRepairActions(order);
            return html`
              <div key=${order.id} className="glass-card-light rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${order.id}
                    </p>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${order.clientName} • ${order.carLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <${ServicePhoneButton} phone=${order.clientPhone} compact=${true} label="Позвонить клиенту" />
                    <${ServiceStatusChip} label=${order.statusLabel} color=${order.statusColor} />
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-4 mt-4">
                  <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    ${order.problem}
                  </p>
                  ${order.note
                    ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                        ${order.note}
                      </p>`
                    : null}
                  ${order.completedWork
                    ? html`<div
                        className="mt-4 p-3 rounded-2xl"
                        style=${{
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.18)"
                        }}
                      >
                        <p className="text-xs font-semibold" style=${{ color: "var(--drivex-success)" }}>
                          Выполнено
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-white)", lineHeight: 1.6 }}>
                          ${order.completedWork}
                        </p>
                        ${order.completedAt
                          ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                              ${formatRuDate(order.completedAt)}
                            </p>`
                          : null}
                      </div>`
                    : null}

                  <div className="flex flex-wrap gap-2 mt-4">
                    ${[
                      order.boxLabel,
                      order.estimate,
                      order.appointmentTime ? `Запись ${order.appointmentTime}` : `Создан ${formatChatTime(order.createdAt)}`
                    ].map((chip) => html`
                      <span
                        key=${`${order.id}-${chip}`}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style=${{
                          background: "rgba(255, 255, 255, 0.05)",
                          color: "var(--drivex-silver)"
                        }}
                      >
                        ${chip}
                      </span>
                    `)}
                  </div>
                </div>

                ${order.parts.length
                  ? html`<div className="space-y-2 mt-4">
                      ${order.parts.map((part) => html`
                        <div key=${part.id} className="glass-card rounded-3xl p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                              ${part.name}
                            </p>
                            <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                              ${part.qty} шт.
                            </p>
                          </div>
                          <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                            ${formatTjsPrice(part.price * part.qty)}
                          </span>
                        </div>
                      `)}
                    </div>`
                  : null}

                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Сумма ремонта
                    </p>
                    <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                      ${formatTjsPrice(order.total)}
                    </p>
                  </div>

                  ${actions.length
                    ? html`<div className="flex gap-2 flex-wrap justify-end">
                        ${actions.map((action) => html`
                          <button
                            key=${action.id}
                            type="button"
                            className="px-4 py-3 rounded-full text-sm font-semibold"
                            style=${{
                              background: alphaBg(action.color, 0.18),
                              color: action.color,
                              border: `1px solid ${alphaBg(action.color, 0.26)}`
                            }}
                            onClick=${() =>
                              action.status === "ready"
                                ? openCompletionDraft(order)
                                : onUpdateStatus && onUpdateStatus(order.id, action.status)}
                          >
                            ${action.label}
                          </button>
                        `)}
                      </div>`
                    : html`<p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                        Ремонт завершён, можно выдавать клиенту.
                      </p>`}
                </div>
              </div>
            `;
          })}
          ${!safeOrders.length
            ? html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="wrench" size=${22} />
                </div>
                <p className="font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                  Ремонтов пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                  Реальные заказы появятся здесь после записи клиента в ваш сервис.
                </p>
              </div>`
            : null}
        </div>

        ${completionDraft
          ? html`<div
              className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4"
              style=${{ background: "rgba(2, 6, 23, 0.72)", backdropFilter: "blur(14px)" }}
            >
              <div
                className="w-full max-w-md rounded-3xl p-5"
                style=${{
                  background: "linear-gradient(180deg, rgba(18, 27, 43, 0.98), rgba(8, 13, 24, 0.98))",
                  border: "1px solid rgba(6, 182, 212, 0.22)",
                  boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.45)"
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      ГОТОВЫЙ РЕМОНТ
                    </p>
                    <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      Что сделали?
                    </h3>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${completionDraft.clientName} • ${completionDraft.carLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center"
                    style=${{ color: "var(--drivex-silver)" }}
                    onClick=${() => setCompletionDraft(null)}
                  >
                    <${Icon} name="x" size=${18} />
                  </button>
                </div>

                <div className="space-y-4 mt-5">
                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Работа мастера
                    </span>
                    <${SellerTextarea}
                      rows="4"
                      value=${completionDraft.workSummary}
                      placeholder="Например: заменили масло, фильтр и сделали диагностику"
                      onInput=${(event) => updateCompletionDraft("workSummary", event.target.value)}
                    />
                    ${!String(completionDraft.workSummary || "").trim()
                      ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>
                          Напишите, что именно было сделано
                        </p>`
                      : null}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Сумма, TJS
                    </span>
                    <${SellerInput}
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value=${completionDraft.total}
                      placeholder="Например: 250"
                      onInput=${(event) => updateCompletionDraft("total", event.target.value)}
                    />
                    ${Math.floor(Number(String(completionDraft.total || "").replace(/[^\d.]/g, "")) || 0) <= 0
                      ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>
                          Укажите реальную сумму ремонта
                        </p>`
                      : null}
                  </label>
                </div>

                <button
                  type="button"
                  className="w-full py-4 rounded-2xl font-bold mt-5"
                  style=${{
                    background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                    color: "white",
                    boxShadow: "0 18px 38px rgba(6, 182, 212, 0.22)"
                  }}
                  onClick=${submitCompletionDraft}
                >
                  Отметить готовым
                </button>
              </div>
            </div>`
          : null}
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceInventoryScreen({ currentUser, center, inventory, onSaveItem }) {
    const toast = useToast();
    const safeCenter = normalizeServiceCenter(center);
    const safeInventory = normalizeServiceInventoryList(inventory, safeCenter.id)
      .filter((item) => !isDemoServiceInventoryItem(item))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
    const lowStockCount = safeInventory.filter((item) => item.stockQty <= item.minQty).length;
    const stockValue = safeInventory.reduce((sum, item) => sum + item.stockQty * item.price, 0);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState(() => ({
      name: "",
      sku: "",
      unit: "шт.",
      stockQty: "",
      minQty: "",
      price: "",
      location: "Основной склад"
    }));
    const [errors, setErrors] = useState({});

    const updateField = (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const resetForm = () => {
      setForm({
        name: "",
        sku: "",
        unit: "шт.",
        stockQty: "",
        minQty: "",
        price: "",
        location: "Основной склад"
      });
      setErrors({});
    };

    const submitInventoryItem = (event) => {
      event.preventDefault();
      const nextErrors = {};
      const stockQty = Math.max(0, Math.floor(Number(form.stockQty) || 0));
      const minQty = Math.max(0, Math.floor(Number(form.minQty) || 0));
      const price = Math.max(0, Math.floor(Number(form.price) || 0));

      if (!String(form.name || "").trim()) nextErrors.name = "Введите название товара";
      if (stockQty <= 0) nextErrors.stockQty = "Укажите остаток";
      if (price <= 0) nextErrors.price = "Укажите цену";

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return;
      }

      onSaveItem &&
        onSaveItem({
          ...form,
          stockQty,
          minQty,
          price
        });
      toast.push("Товар добавлен на склад");
      resetForm();
      setFormOpen(false);
    };

    return html`
      <${ServiceCrmLayout}
        title="Склад запчастей"
        subtitle="Остатки, минимальные уровни и себестоимость запчастей в сервисе."
        activeItem="parts"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/finance", label: "Финансы" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <${SellerMetricCard}
            label="Позиции"
            value=${String(safeInventory.length)}
            hint="На складе сервиса"
            color="var(--drivex-electric-blue)"
            icon="bag"
          />
          <${SellerMetricCard}
            label="Низкий остаток"
            value=${String(lowStockCount)}
            hint="Нужно дозаказать"
            color="var(--drivex-warning)"
            icon="bell"
          />
          <div className="col-span-2">
            <${SellerMetricCard}
              label="Стоимость склада"
              value=${formatTjsPrice(stockValue)}
              hint="По текущим остаткам"
              color="var(--drivex-neon-cyan)"
              icon="card"
            />
          </div>
        </div>

        <button
          type="button"
          className="w-full py-4 rounded-2xl font-bold"
          style=${{
            background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
            color: "white",
            boxShadow: "0 18px 38px rgba(6, 182, 212, 0.2)"
          }}
          onClick=${() => setFormOpen(true)}
        >
          + Добавить товар
        </button>

        <div className="space-y-4">
          ${safeInventory.map((item) => {
            const isLow = item.stockQty <= item.minQty;
            const stockColor = isLow ? "var(--drivex-warning)" : "var(--drivex-success)";
            return html`
              <div key=${item.id} className="glass-card-light rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${item.name}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${item.sku} • ${item.location}
                    </p>
                  </div>
                  <${ServiceStatusChip}
                    label=${isLow ? "Пора пополнить" : "Остаток нормальный"}
                    color=${stockColor}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="glass-card rounded-3xl p-4">
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Остаток
                    </p>
                    <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      ${item.stockQty} ${item.unit}
                    </p>
                  </div>
                  <div className="glass-card rounded-3xl p-4">
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Мин. уровень
                    </p>
                    <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      ${item.minQty} ${item.unit}
                    </p>
                  </div>
                  <div className="glass-card rounded-3xl p-4">
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Цена
                    </p>
                    <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      ${formatTjsPrice(item.price)}
                    </p>
                  </div>
                </div>
              </div>
            `;
          })}
          ${!safeInventory.length
            ? html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="bag" size=${22} />
                </div>
                <p className="font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                  Склад пока пустой
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                  Добавьте реальные товары, запчасти и расходники вашего сервиса.
                </p>
              </div>`
            : null}
        </div>

        ${formOpen
          ? html`<div
              className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4"
              style=${{ background: "rgba(2, 6, 23, 0.72)", backdropFilter: "blur(14px)" }}
            >
              <form
                className="w-full max-w-md rounded-3xl p-5"
                style=${{
                  background: "linear-gradient(180deg, rgba(18, 27, 43, 0.98), rgba(8, 13, 24, 0.98))",
                  border: "1px solid rgba(6, 182, 212, 0.22)",
                  boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.45)"
                }}
                onSubmit=${submitInventoryItem}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      СКЛАД
                    </p>
                    <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      Новый товар
                    </h3>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      Запчасть, масло, фильтр или расходник
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center"
                    style=${{ color: "var(--drivex-silver)" }}
                    onClick=${() => {
                      resetForm();
                      setFormOpen(false);
                    }}
                  >
                    <${Icon} name="x" size=${18} />
                  </button>
                </div>

                <div className="space-y-4 mt-5">
                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Название</span>
                    <${SellerInput}
                      value=${form.name}
                      placeholder="Например: Масло 5W-30 Toyota"
                      onInput=${(event) => updateField("name", event.target.value)}
                    />
                    ${errors.name ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.name}</p>` : null}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Артикул</span>
                      <${SellerInput}
                        value=${form.sku}
                        placeholder="SKU"
                        onInput=${(event) => updateField("sku", event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Ед.</span>
                      <${SellerInput}
                        value=${form.unit}
                        placeholder="шт."
                        onInput=${(event) => updateField("unit", event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Остаток</span>
                      <${SellerInput}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value=${form.stockQty}
                        onInput=${(event) => updateField("stockQty", event.target.value)}
                      />
                      ${errors.stockQty ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.stockQty}</p>` : null}
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Мин.</span>
                      <${SellerInput}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value=${form.minQty}
                        onInput=${(event) => updateField("minQty", event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Цена</span>
                      <${SellerInput}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value=${form.price}
                        onInput=${(event) => updateField("price", event.target.value)}
                      />
                      ${errors.price ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.price}</p>` : null}
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Место хранения</span>
                    <${SellerInput}
                      value=${form.location}
                      placeholder="Основной склад"
                      onInput=${(event) => updateField("location", event.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl font-bold mt-5"
                  style=${{
                    background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                    color: "white"
                  }}
                >
                  Сохранить товар
                </button>
              </form>
            </div>`
          : null}
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceFinanceScreen({ currentUser, center, orders, finance }) {
    const safeCenter = normalizeServiceCenter(center);
    const safeOrders = normalizeServiceRepairOrdersList(orders, safeCenter.id).filter((item) => !isDemoServiceOrder(item));
    const safeFinance = normalizeServiceFinanceList(finance, safeCenter.id)
      .filter((item) => !isDemoServiceFinanceEntry(item))
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const summary = buildServiceFinanceSummary(safeOrders, safeFinance);

    return html`
      <${ServiceCrmLayout}
        title="Финансы и отчёты"
        subtitle="Выручка, расходы и средний чек сервиса без отдельной таблицы."
        activeItem="finance"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/parts", label: "Склад" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <${SellerMetricCard}
            label="Доход"
            value=${formatTjsPrice(summary.income)}
            hint="Все готовые ремонты"
            color="var(--drivex-success)"
            icon="card"
          />
          <${SellerMetricCard}
            label="Расход"
            value=${formatTjsPrice(summary.expenses)}
            hint="Склад и персонал"
            color="var(--drivex-warning)"
            icon="bag"
          />
          <${SellerMetricCard}
            label="Прибыль"
            value=${formatTjsPrice(summary.profit)}
            hint="Доход минус расход"
            color="var(--drivex-electric-blue)"
            icon="layers"
          />
          <${SellerMetricCard}
            label="Средний чек"
            value=${formatTjsPrice(summary.averageTicket)}
            hint="На один готовый ремонт"
            color="var(--drivex-neon-cyan)"
            icon="wrench"
          />
        </div>

        <div className="space-y-4">
          ${safeFinance.map((entry) => {
            const isExpense = entry.type === "expense";
            const accent = isExpense ? "var(--drivex-warning)" : "var(--drivex-success)";
            return html`
              <div key=${entry.id} className="glass-card-light rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${entry.title}
                      </p>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style=${{
                          background: alphaBg(accent, 0.16),
                          color: accent
                        }}
                      >
                        ${isExpense ? "Расход" : "Доход"}
                      </span>
                    </div>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${entry.category} • ${formatRuDate(entry.date)}
                    </p>
                    ${entry.sourceOrderId
                      ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                          Заказ: ${entry.sourceOrderId}
                        </p>`
                      : null}
                  </div>
                  <p className="text-xl font-bold" style=${{ color: accent }}>
                    ${isExpense ? "-" : "+"}${formatTjsPrice(entry.amount)}
                  </p>
                </div>
              </div>
            `;
          })}
        </div>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceScheduleScreen({ currentUser, center, appointments, onCreateAppointment }) {
    const toast = useToast();
    const safeCenter = normalizeServiceCenter(center);
    const safeAppointments = normalizeServiceAppointmentsList(appointments, safeCenter.id)
      .filter((item) => !isDemoServiceAppointment(item))
      .sort((a, b) => `${a.day} ${a.startTime}`.localeCompare(`${b.day} ${b.startTime}`));
    const [selectedDay, setSelectedDay] = useState(toLocalISODate());
    const [formOpen, setFormOpen] = useState(false);
    const scheduleSlots = buildServiceScheduleSlots(safeCenter, safeAppointments, selectedDay);
    const availableSlots = scheduleSlots.filter((slot) => slot.available);
    const [form, setForm] = useState(() => ({
      day: toLocalISODate(),
      time: "",
      clientName: "",
      clientPhone: "+992 ",
      carLabel: "",
      workLabel: "",
      note: ""
    }));
    const [errors, setErrors] = useState({});

    useEffect(() => {
      setForm((prev) => ({
        ...prev,
        day: selectedDay,
        time: availableSlots.some((slot) => slot.startTime === prev.time) ? prev.time : (availableSlots[0]?.startTime || "")
      }));
    }, [selectedDay, availableSlots.map((slot) => slot.startTime).join("|")]);

    const updateField = (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const resetManualForm = () => {
      setForm({
        day: selectedDay,
        time: availableSlots[0]?.startTime || "",
        clientName: "",
        clientPhone: "+992 ",
        carLabel: "",
        workLabel: "",
        note: ""
      });
      setErrors({});
    };

    const submitManualAppointment = (event) => {
      event.preventDefault();
      const nextErrors = {};
      if (!String(form.clientName || "").trim()) nextErrors.clientName = "Введите имя клиента";
      if (String(form.clientPhone || "").replace(/\D/g, "").length < 12) nextErrors.clientPhone = "Введите телефон";
      if (!String(form.workLabel || "").trim()) nextErrors.workLabel = "Напишите цель обращения";
      if (!form.time) nextErrors.time = "Выберите свободное время";

      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        return;
      }

      onCreateAppointment &&
        onCreateAppointment({
          ...form,
          day: selectedDay,
          time: form.time
        });
      toast.push("Запись добавлена в расписание");
      resetManualForm();
      setFormOpen(false);
    };

    return html`
      <${ServiceCrmLayout}
        title="Запись и загрузка"
        subtitle="Кто занят, когда свободен и как загружены боксы по времени."
        activeItem="schedule"
        currentUser=${currentUser}
        center=${safeCenter}
        primaryAction=${{ path: "/service-crm/orders", label: "Ремонты" }}
      >
        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                День: ${formatRuDate(selectedDay)}
              </p>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                ${safeCenter.boxesCount} бокса • ${safeCenter.workingHours || "08:00 — 19:00"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              ${serviceAppointmentStatusOptions.map((status) => html`
                <${ServiceStatusChip} key=${status.id} label=${status.label} color=${status.color} />
              `)}
            </div>
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                Дата
              </span>
              <${SellerInput}
                type="date"
                value=${selectedDay}
                onInput=${(event) => setSelectedDay(event.target.value || toLocalISODate())}
              />
            </label>
            <button
              type="button"
              className="self-end py-3 rounded-2xl font-bold"
              style=${{
                background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                color: "white"
              }}
              onClick=${() => {
                resetManualForm();
                setFormOpen(true);
              }}
              disabled=${!availableSlots.length}
            >
              + Записать
            </button>
          </div>
        </div>

        <div className="glass-card-light rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Окна дня
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Свободное время и занятые боксы
              </p>
            </div>
            <${ServiceStatusChip}
              label=${`${availableSlots.length} свободно`}
              color=${availableSlots.length ? "var(--drivex-success)" : "var(--drivex-warning)"}
            />
          </div>

          <div className="space-y-3 mt-4">
            ${scheduleSlots.map((slot) => html`
              <div key=${slot.id} className="glass-card rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${slot.startTime} — ${slot.endTime}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${slot.available ? `${slot.freeBoxes} свободно из ${slot.boxCount}` : "Все боксы заняты"}
                    </p>
                    ${slot.booked.length
                      ? html`<div className="space-y-2 mt-3">
                          ${slot.booked.map((booked) => html`
                            <div key=${booked.id} className="rounded-2xl p-3" style=${{ background: "rgba(255,255,255,0.05)" }}>
                              <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                                ${booked.boxLabel} • ${booked.clientName}
                              </p>
                              <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                                ${booked.carLabel || "Авто не указано"} • ${booked.workLabel || "Цель не указана"}
                              </p>
                            </div>
                          `)}
                        </div>`
                      : null}
                  </div>
                  <${ServiceStatusChip}
                    label=${slot.available ? "Свободно" : "Занято"}
                    color=${slot.available ? "var(--drivex-success)" : "var(--drivex-warning)"}
                  />
                </div>
              </div>
            `)}
            ${!scheduleSlots.length
              ? html`<div className="glass-card rounded-3xl p-4">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    Проверьте рабочее время сервиса в настройках.
                  </p>
                </div>`
              : null}
          </div>
        </div>

        <div className="space-y-4">
          ${safeAppointments.filter((slot) => slot.day === selectedDay).map((slot) => html`
            <div key=${slot.id} className="glass-card-light rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                    ${formatRuDate(slot.day)} • ${slot.startTime} — ${slot.endTime}
                  </p>
                  <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    ${slot.boxLabel}
                  </p>
                </div>
                <${ServiceStatusChip} label=${slot.statusLabel} color=${slot.statusColor} />
              </div>

              <div className="glass-card rounded-3xl p-4 mt-4">
                ${slot.status === "free"
                  ? html`<p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      Это окно свободно. Можно записать нового клиента по телефону.
                    </p>`
                  : html`
                      <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        ${slot.clientName}
                      </p>
                      <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                        ${slot.carLabel}${slot.workLabel ? ` • ${slot.workLabel}` : ""}
                      </p>
                      <div className="mt-4">
                        <${ServicePhoneButton} phone=${slot.phone} label="Позвонить клиенту" />
                      </div>
                    `}
              </div>
            </div>
          `)}
          ${!safeAppointments.filter((slot) => slot.day === selectedDay).length
            ? html`<div className="glass-card-light rounded-3xl p-6 text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.12)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="calendar" size=${22} />
                </div>
                <p className="font-bold mt-4" style=${{ color: "var(--drivex-white)" }}>
                  Записей пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.6 }}>
                  Реальные записи появятся здесь после онлайн-записи или ручного добавления из CRM.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-2xl font-bold mt-5"
                  style=${{
                    background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                    color: "white"
                  }}
                  onClick=${() => {
                    resetManualForm();
                    setFormOpen(true);
                  }}
                >
                  Записать клиента
                </button>
              </div>`
            : null}
        </div>

        ${formOpen
          ? html`<div
              className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4"
              style=${{ background: "rgba(2, 6, 23, 0.72)", backdropFilter: "blur(14px)" }}
            >
              <form
                className="w-full max-w-md rounded-3xl p-5"
                style=${{
                  background: "linear-gradient(180deg, rgba(18, 27, 43, 0.98), rgba(8, 13, 24, 0.98))",
                  border: "1px solid rgba(6, 182, 212, 0.22)",
                  boxShadow: "0 -20px 60px rgba(0, 0, 0, 0.45)"
                }}
                onSubmit=${submitManualAppointment}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      РУЧНАЯ ЗАПИСЬ
                    </p>
                    <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                      Занять очередь
                    </h3>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      Для клиента, который позвонил или написал
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center"
                    style=${{ color: "var(--drivex-silver)" }}
                    onClick=${() => {
                      resetManualForm();
                      setFormOpen(false);
                    }}
                  >
                    <${Icon} name="x" size=${18} />
                  </button>
                </div>

                <div className="space-y-4 mt-5">
                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Время</span>
                    <select
                      className="w-full px-4 py-3 rounded-2xl glass-card-light outline-none dx-input"
                      value=${form.time}
                      onInput=${(event) => updateField("time", event.target.value)}
                    >
                      ${availableSlots.map((slot) => html`
                        <option key=${slot.id} value=${slot.startTime}>
                          ${slot.startTime} — свободно ${slot.freeBoxes}
                        </option>
                      `)}
                    </select>
                    ${errors.time ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.time}</p>` : null}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Клиент</span>
                      <${SellerInput}
                        value=${form.clientName}
                        placeholder="Имя клиента"
                        onInput=${(event) => updateField("clientName", event.target.value)}
                      />
                      ${errors.clientName ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.clientName}</p>` : null}
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Телефон</span>
                      <${SellerInput}
                        value=${form.clientPhone}
                        placeholder="+992"
                        onInput=${(event) => updateField("clientPhone", normalizeTjPhoneInput(event.target.value))}
                      />
                      ${errors.clientPhone ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.clientPhone}</p>` : null}
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Авто</span>
                    <${SellerInput}
                      value=${form.carLabel}
                      placeholder="Например: Toyota Camry"
                      onInput=${(event) => updateField("carLabel", event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Что нужно сделать</span>
                    <${SellerTextarea}
                      rows="3"
                      value=${form.workLabel}
                      placeholder="Например: диагностика, замена масла, электрика"
                      onInput=${(event) => updateField("workLabel", event.target.value)}
                    />
                    ${errors.workLabel ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-danger)" }}>${errors.workLabel}</p>` : null}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>Комментарий</span>
                    <${SellerTextarea}
                      rows="2"
                      value=${form.note}
                      placeholder="Дополнительно"
                      onInput=${(event) => updateField("note", event.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl font-bold mt-5"
                  style=${{
                    background: "linear-gradient(135deg, var(--drivex-neon-cyan), var(--drivex-electric-blue))",
                    color: "white"
                  }}
                >
                  Сохранить запись
                </button>
              </form>
            </div>`
          : null}
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceSettingsScreen({ currentUser, center, onSaveCenter }) {
    const toast = useToast();
    const [form, setForm] = useState(() => createServiceCenterFormState(center));
    const [submitting, setSubmitting] = useState(false);
    const centerSyncToken = useMemo(() => JSON.stringify(createServiceCenterFormState(center)), [center]);

    // Черновики для добавления новой услуги / нового мастера — сама услуга
    // и сам мастер живут в form.priceList / form.masters (сохраняются вместе
    // с остальной карточкой сервиса по кнопке «Сохранить настройки»).
    const [priceDraft, setPriceDraft] = useState({ title: "", price: "", durationMinutes: "" });
    const [masterDraft, setMasterDraft] = useState({ name: "", specialty: "", experience: "" });

    const addPriceItem = useCallback(() => {
      const title = String(priceDraft.title || "").trim();
      if (!title) {
        toast.push("Введите название услуги");
        return;
      }
      setForm((prev) => ({
        ...prev,
        priceList: [
          ...normalizeServicePriceList(prev.priceList),
          {
            id: genId("service-price"),
            title,
            price: Math.max(0, Math.floor(Number(priceDraft.price) || 0)),
            durationMinutes: Math.max(0, Math.floor(Number(priceDraft.durationMinutes) || 0))
          }
        ]
      }));
      setPriceDraft({ title: "", price: "", durationMinutes: "" });
    }, [priceDraft, toast]);

    const removePriceItem = useCallback((id) => {
      setForm((prev) => ({
        ...prev,
        priceList: normalizeServicePriceList(prev.priceList).filter((item) => item.id !== id)
      }));
    }, []);

    const addMaster = useCallback(() => {
      const name = String(masterDraft.name || "").trim();
      if (!name) {
        toast.push("Введите имя мастера");
        return;
      }
      setForm((prev) => ({
        ...prev,
        masters: [
          ...normalizeServiceMastersList(prev.masters),
          {
            id: genId("service-master"),
            name,
            specialty: String(masterDraft.specialty || "").trim(),
            experience: String(masterDraft.experience || "").trim()
          }
        ]
      }));
      setMasterDraft({ name: "", specialty: "", experience: "" });
    }, [masterDraft, toast]);

    const removeMaster = useCallback((id) => {
      setForm((prev) => ({
        ...prev,
        masters: normalizeServiceMastersList(prev.masters).filter((item) => item.id !== id)
      }));
    }, []);

    useEffect(() => {
      try {
        setForm(JSON.parse(centerSyncToken));
      } catch {
        setForm(createServiceCenterFormState(center));
      }
    }, [centerSyncToken]);

    const updateField = useCallback((key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleLogoPick = useCallback(
      async (event) => {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareAvatarDataUrl(file, { size: 320, quality: 0.9 });
          if (!dataUrl) {
            toast.push("Логотип не удалось загрузить");
            return;
          }
          setForm((prev) => ({
            ...prev,
            logo: dataUrl
          }));
          toast.push("Логотип обновлён");
        } catch (error) {
          toast.push(
            String(error && error.message) === "File too large"
              ? "Логотип слишком большой. Выберите фото поменьше"
              : "Файл не подходит"
          );
        } finally {
          if (input) input.value = "";
        }
      },
      [toast]
    );

    const handleCoverPick = useCallback(
      async (event) => {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareDocumentDataUrl(file, { maxSize: 960, quality: 0.78 });
          if (!dataUrl) {
            toast.push("Главное фото не удалось загрузить");
            return;
          }
          updateField("coverImage", dataUrl);
          toast.push("Главное фото обновлено");
        } catch (error) {
          toast.push(
            String(error && error.message) === "File too large"
              ? "Главное фото слишком большое. Выберите фото поменьше"
              : "Файл не подходит"
          );
        } finally {
          if (input) input.value = "";
        }
      },
      [toast, updateField]
    );

    const handleGalleryPick = useCallback(
      async (event) => {
        const input = event.target;
        const files = Array.from(input.files || []).slice(0, 6);
        if (!files.length) return;

        try {
          const prepared = await Promise.all(
            files.map((file) => prepareDocumentDataUrl(file, { maxSize: 960, quality: 0.8 }).catch(() => ""))
          );
          const nextPhotos = prepared.filter(Boolean);
          if (!nextPhotos.length) {
            toast.push("Фото работ не удалось загрузить");
            return;
          }

          setForm((prev) => ({
            ...prev,
            gallery: [...normalizeServiceGalleryList(prev.gallery), ...nextPhotos].filter(Boolean).slice(0, 6)
          }));
          toast.push(`Добавлено фото: ${nextPhotos.length}`);
        } catch (error) {
          toast.push(
            String(error && error.message) === "File too large"
              ? "Одно из фото слишком большое. Выберите фото поменьше"
              : "Файлы не подходят"
          );
        } finally {
          if (input) input.value = "";
        }
      },
      [toast]
    );

    const removeGalleryPhoto = useCallback((index) => {
      setForm((prev) => ({
        ...prev,
        gallery: normalizeServiceGalleryList(prev.gallery).filter((_, photoIndex) => photoIndex !== index)
      }));
    }, []);

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        if (!String(form.name || "").trim()) {
          toast.push("Введите название сервиса");
          return;
        }
        if (!String(form.serviceType || "").trim()) {
          toast.push("Выберите тип сервиса");
          return;
        }
        if (!String(form.city || "").trim()) {
          toast.push("Введите город");
          return;
        }

        try {
          setSubmitting(true);
          await onSaveCenter({
            ...form,
            boxesCount: Math.max(1, Math.floor(Number(form.boxesCount) || 1)),
            coverImage: normalizeServiceImageAsset(form.coverImage),
            gallery: normalizeServiceGalleryList(form.gallery),
            videoUrl: normalizeServiceVideoUrl(form.videoUrl),
            description: form.description || `${form.name || "Сервис"} — обновлённая карточка сервиса DRIVEX.`
          });
          navigateToHash("/service-crm/dashboard");
        } catch (error) {
          toast.push(error?.message || "Не удалось сохранить сервис");
        } finally {
          setSubmitting(false);
        }
      },
      [form, onSaveCenter, toast]
    );

    const previewCenter = {
      ...center,
      ...form,
      boxesCount: Math.max(1, Math.floor(Number(form.boxesCount) || 1))
    };
    const galleryPreview = normalizeServiceGalleryList(form.gallery);
    const coverPreview =
      form.coverImage ||
      galleryPreview[0] ||
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
    const videoPreviewUrl = normalizeServiceVideoUrl(form.videoUrl);

    return html`
      <${ServiceCrmLayout}
        title="Настройки сервиса"
        subtitle="Карточка сервиса, контакты и медиа, которые увидят клиенты в каталоге."
        activeItem="settings"
        currentUser=${currentUser}
        center=${center}
        primaryAction=${{ path: "/service-crm/dashboard", label: "Дашборд" }}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Основная информация
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Это видят сотрудники сервиса внутри CRM
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
              <${SellerLogo}
                store=${{
                  ...previewCenter,
                  accent: "var(--drivex-electric-blue)"
                }}
                size=${72}
                rounded="22px"
              />
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${form.name || "Название сервиса"}
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  ${form.serviceType || "Тип сервиса"}${form.city ? ` • ${form.city}` : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-5">
              <${SellerField} label="Название сервиса">
                <${SellerInput}
                  type="text"
                  value=${form.name}
                  onInput=${(e) => updateField("name", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Тип сервиса">
                  <${SellerSelect}
                    value=${form.serviceType}
                    onChange=${(e) => updateField("serviceType", e.target.value)}
                  >
                    <option value="">Выберите тип</option>
                    ${serviceCenterTypeOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Боксы">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value=${form.boxesCount}
                    onInput=${(e) => updateField("boxesCount", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Город">
                  <${SellerInput}
                    type="text"
                    value=${form.city}
                    onInput=${(e) => updateField("city", e.target.value)}
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

              <${SellerField} label="Адрес">
                <${SellerInput}
                  type="text"
                  value=${form.address}
                  onInput=${(e) => updateField("address", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Ориентир">
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

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Телефон сервиса">
                  <${SellerInput}
                    type="tel"
                    value=${form.phone}
                    onInput=${(e) => updateField("phone", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Email">
                  <${SellerInput}
                    type="email"
                    value=${form.email}
                    onInput=${(e) => updateField("email", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Описание">
                <${SellerTextarea}
                  value=${form.description}
                  onInput=${(e) => updateField("description", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Медиа для клиентов
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Главное фото, реальные фото работ и видео появятся в карточке сервиса.
                </p>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Добавить фото работ
                <input type="file" accept="image/*" multiple className="hidden" onChange=${handleGalleryPick} />
              </label>
            </div>

            <div
              className="relative rounded-[28px] overflow-hidden h-56 mt-4"
              style=${{
                border: "1px solid rgba(6, 182, 212, 0.14)",
                background: "rgba(255, 255, 255, 0.04)"
              }}
            >
              <img src=${coverPreview} alt="Главное фото сервиса" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style=${{
                  background: "linear-gradient(180deg, rgba(8, 15, 26, 0.08) 0%, rgba(8, 15, 26, 0.82) 100%)"
                }}
              ></div>
              <div className="absolute left-4 right-4 bottom-4">
                <p className="text-[11px] uppercase tracking-[0.12em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  Главное фото карточки
                </p>
                <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${form.name || "Ваш сервис"}
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)" }}>
                  ${form.city || "Город"}${form.address ? ` • ${form.address}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap mt-4">
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Изменить главное фото
                <input type="file" accept="image/*" className="hidden" onChange=${handleCoverPick} />
              </label>
              ${form.coverImage
                ? html`<button
                    type="button"
                    className="px-4 py-3 rounded-2xl text-sm font-semibold"
                    style=${{
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--drivex-light-silver)"
                    }}
                    onClick=${() => updateField("coverImage", "")}
                  >
                    Убрать фото
                  </button>`
                : null}
            </div>

            <div className="mt-5">
              <${SellerField} label="Видео сервиса" note="Пока добавляем ссылкой">
                <${SellerInput}
                  type="url"
                  placeholder="https://youtube.com/..."
                  value=${form.videoUrl}
                  onInput=${(e) => updateField("videoUrl", e.target.value)}
                />
              </${SellerField}>
              <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                Можно вставить ссылку на YouTube, Instagram, TikTok или Google Drive.
              </p>
              ${videoPreviewUrl
                ? html`<a
                    href=${videoPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-semibold"
                    style=${{ color: "var(--drivex-neon-cyan)" }}
                  >
                    <${Icon} name="play" size=${14} />
                    Открыть видео
                  </a>`
                : null}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    Фото работ
                  </p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Показываем клиентам зону сервиса, процессы и реальные кейсы.
                  </p>
                </div>
                <span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  ${galleryPreview.length}/6
                </span>
              </div>

              ${galleryPreview.length
                ? html`<div className="grid grid-cols-3 gap-3">
                    ${galleryPreview.map((photo, index) => html`
                      <div
                        key=${`service-gallery-photo-${index}`}
                        className="relative h-28 overflow-hidden rounded-[22px]"
                        style=${{ border: "1px solid rgba(6, 182, 212, 0.14)" }}
                      >
                        <img src=${photo} alt=${`Фото работы ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                          style=${{
                            background: "rgba(8, 15, 26, 0.78)",
                            color: "var(--drivex-white)"
                          }}
                          onClick=${() => removeGalleryPhoto(index)}
                        >
                          ×
                        </button>
                      </div>
                    `)}
                  </div>`
                : html`<div
                    className="rounded-[24px] p-5"
                    style=${{
                      background: "rgba(255, 255, 255, 0.035)",
                      border: "1px dashed rgba(148, 163, 184, 0.22)"
                    }}
                  >
                    <p className="text-sm" style=${{ color: "var(--drivex-light-silver)" }}>
                      Пока нет фото работ. Добавьте несколько кадров, и они появятся в карточке сервиса вместо demo-галереи.
                    </p>
                  </div>`}
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Услуги и цены
            </h2>
            <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
              Список появится в карточке сервиса. Без цены клиент увидит «цена по запросу».
            </p>

            ${form.priceList.length
              ? html`<div className="space-y-2 mt-4">
                  ${form.priceList.map((item) => html`
                    <div
                      key=${item.id}
                      className="rounded-2xl p-3 flex items-center gap-3"
                      style=${{ background: "rgba(255, 255, 255, 0.035)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                          ${item.title}
                        </p>
                        <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${[
                            item.price > 0 ? formatTjsPrice(item.price) : "цена по запросу",
                            item.durationMinutes > 0 ? `${item.durationMinutes} мин` : ""
                          ].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style=${{ background: "rgba(239, 68, 68, 0.12)", color: "var(--drivex-danger)" }}
                        onClick=${() => removePriceItem(item.id)}
                        aria-label=${`Удалить «${item.title}»`}
                      >
                        <${Icon} name="close" size=${15} />
                      </button>
                    </div>
                  `)}
                </div>`
              : html`<p className="text-sm mt-4" style=${{ color: "var(--drivex-light-silver)" }}>
                  Пока нет ни одной услуги — добавьте первую ниже.
                </p>`}

            <div className="rounded-2xl p-3 mt-4 space-y-3" style=${{ background: "rgba(255, 255, 255, 0.03)", border: "1px dashed rgba(148, 163, 184, 0.22)" }}>
              <${SellerField} label="Название услуги">
                <${SellerInput}
                  type="text"
                  placeholder="Например: Замена масла"
                  value=${priceDraft.title}
                  onInput=${(e) => setPriceDraft((prev) => ({ ...prev, title: e.target.value }))}
                />
              </${SellerField}>
              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Цена, TJS" note="необяз.">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                    value=${priceDraft.price}
                    onInput=${(e) => setPriceDraft((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </${SellerField}>
                <${SellerField} label="Минут" note="необяз.">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                    value=${priceDraft.durationMinutes}
                    onInput=${(e) => setPriceDraft((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                  />
                </${SellerField}>
              </div>
              <button
                type="button"
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style=${{ background: "rgba(6, 182, 212, 0.16)", color: "var(--drivex-neon-cyan)" }}
                onClick=${addPriceItem}
              >
                + Добавить услугу
              </button>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Мастера
            </h2>
            <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
              Команда, которую увидят клиенты в карточке сервиса.
            </p>

            ${form.masters.length
              ? html`<div className="space-y-2 mt-4">
                  ${form.masters.map((master) => html`
                    <div
                      key=${master.id}
                      className="rounded-2xl p-3 flex items-center gap-3"
                      style=${{ background: "rgba(255, 255, 255, 0.035)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                          ${master.name}
                        </p>
                        <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${[master.specialty, master.experience].filter(Boolean).join(" • ") || "Без описания"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style=${{ background: "rgba(239, 68, 68, 0.12)", color: "var(--drivex-danger)" }}
                        onClick=${() => removeMaster(master.id)}
                        aria-label=${`Удалить «${master.name}»`}
                      >
                        <${Icon} name="close" size=${15} />
                      </button>
                    </div>
                  `)}
                </div>`
              : html`<p className="text-sm mt-4" style=${{ color: "var(--drivex-light-silver)" }}>
                  Пока никого не добавили — команда не будет показана клиентам.
                </p>`}

            <div className="rounded-2xl p-3 mt-4 space-y-3" style=${{ background: "rgba(255, 255, 255, 0.03)", border: "1px dashed rgba(148, 163, 184, 0.22)" }}>
              <${SellerField} label="Имя мастера">
                <${SellerInput}
                  type="text"
                  placeholder="Например: Фарход Азимов"
                  value=${masterDraft.name}
                  onInput=${(e) => setMasterDraft((prev) => ({ ...prev, name: e.target.value }))}
                />
              </${SellerField}>
              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Специализация" note="необяз.">
                  <${SellerInput}
                    type="text"
                    placeholder="Ходовая, тормоза"
                    value=${masterDraft.specialty}
                    onInput=${(e) => setMasterDraft((prev) => ({ ...prev, specialty: e.target.value }))}
                  />
                </${SellerField}>
                <${SellerField} label="Опыт / роль" note="необяз.">
                  <${SellerInput}
                    type="text"
                    placeholder="9 лет"
                    value=${masterDraft.experience}
                    onInput=${(e) => setMasterDraft((prev) => ({ ...prev, experience: e.target.value }))}
                  />
                </${SellerField}>
              </div>
              <button
                type="button"
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style=${{ background: "rgba(6, 182, 212, 0.16)", color: "var(--drivex-neon-cyan)" }}
                onClick=${addMaster}
              >
                + Добавить мастера
              </button>
            </div>
          </div>

          <button type="submit" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
            ${submitting ? "Сохраняем сервис..." : "Сохранить настройки"}
          </button>
        </form>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceNotFoundScreen({ currentUser, center }) {
    return html`
      <${ServiceCrmLayout}
        title="Страница не найдена"
        subtitle="Проверьте route Service CRM или вернитесь в основные разделы сервиса."
        activeItem="dashboard"
        currentUser=${currentUser}
        center=${center}
      >
        <div className="glass-card-light rounded-3xl p-6">
          <a href="#/service-crm/dashboard" className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
            В дашборд сервиса
          </a>
        </div>
      </${ServiceCrmLayout}>
    `;
  }


  // ── Export to DX.screens (chain: app-main.js читает отсюда) ──
  DX.screens = DX.screens || {};
  if (typeof getServicePhoneHref !== 'undefined') DX.screens['getServicePhoneHref'] = getServicePhoneHref;
  if (typeof ServiceClientsScreen !== 'undefined') DX.screens['ServiceClientsScreen'] = ServiceClientsScreen;
  if (typeof ServiceCrmLayout !== 'undefined') DX.screens['ServiceCrmLayout'] = ServiceCrmLayout;
  if (typeof ServiceDashboardScreen !== 'undefined') DX.screens['ServiceDashboardScreen'] = ServiceDashboardScreen;
  if (typeof ServiceFinanceScreen !== 'undefined') DX.screens['ServiceFinanceScreen'] = ServiceFinanceScreen;
  if (typeof ServiceInventoryScreen !== 'undefined') DX.screens['ServiceInventoryScreen'] = ServiceInventoryScreen;
  if (typeof ServiceLoginScreen !== 'undefined') DX.screens['ServiceLoginScreen'] = ServiceLoginScreen;
  if (typeof ServiceNotFoundScreen !== 'undefined') DX.screens['ServiceNotFoundScreen'] = ServiceNotFoundScreen;
  if (typeof ServiceOrdersScreen !== 'undefined') DX.screens['ServiceOrdersScreen'] = ServiceOrdersScreen;
  if (typeof ServiceRequestsScreen !== 'undefined') DX.screens['ServiceRequestsScreen'] = ServiceRequestsScreen;
  if (typeof ServicePartnerRegisterIntroScreen !== 'undefined') DX.screens['ServicePartnerRegisterIntroScreen'] = ServicePartnerRegisterIntroScreen;
  if (typeof ServicePhoneButton !== 'undefined') DX.screens['ServicePhoneButton'] = ServicePhoneButton;
  if (typeof ServiceRegistrationScreen !== 'undefined') DX.screens['ServiceRegistrationScreen'] = ServiceRegistrationScreen;
  if (typeof ServiceScheduleScreen !== 'undefined') DX.screens['ServiceScheduleScreen'] = ServiceScheduleScreen;
  if (typeof ServiceSettingsScreen !== 'undefined') DX.screens['ServiceSettingsScreen'] = ServiceSettingsScreen;
  if (typeof ServiceStatusChip !== 'undefined') DX.screens['ServiceStatusChip'] = ServiceStatusChip;
})();
