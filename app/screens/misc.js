// Misc Screens + Profile
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

  function NotificationsScreen({ serviceRequests }) {
    const notifications = [
      {
        id: "promo-oil",
        title: "Скидка 15% на замену масла",
        body: "Акция действует до конца недели в партнёрских сервисах.",
        time: "2 часа назад",
        color: "var(--drivex-warning)",
        icon: "star"
      },
      {
        id: "inspection-reminder",
        title: "Напоминание: техосмотр",
        body: "До планового техосмотра осталось 30 дней.",
        time: "Вчера",
        color: "var(--drivex-electric-blue)",
        icon: "scan"
      },
      {
        id: "market-order",
        title: "Ваш заказ в пути",
        body: "Товар ‘Shell Helix Ultra 5W-40’ будет доставлен сегодня.",
        time: "Сегодня",
        color: "var(--drivex-neon-cyan)",
        icon: "bag"
      }
    ];
    const dynamicNotifications = buildBuyerServiceNotifications(serviceRequests);
    const mergedNotifications = [...dynamicNotifications, ...notifications];

    return html`
      <${SimplePage} title="Уведомления" backPath="/profile">
        <div className="px-6 py-6">
          <div className="space-y-3">
            ${mergedNotifications.map((n, idx) => html`
              <div key=${n.id || idx} className="glass-card-light rounded-2xl p-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style=${{ background: alphaBg(n.color, 0.2), color: n.color }}
                  >
                    <${Icon} name=${n.icon} size=${22} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${n.title}
                      </h3>
                      <span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                        ${n.time}
                      </span>
                    </div>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${n.body}
                    </p>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function SettingsScreen() {
    const initial = useMemo(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem("drivex.settings.v1") : null;
        if (!raw) return { pushEnabled: true, geoEnabled: true };
        const parsed = JSON.parse(raw);
        return {
          pushEnabled: typeof parsed?.pushEnabled === "boolean" ? parsed.pushEnabled : true,
          geoEnabled: typeof parsed?.geoEnabled === "boolean" ? parsed.geoEnabled : true
        };
      } catch {
        return { pushEnabled: true, geoEnabled: true };
      }
    }, []);

    const [pushEnabled, setPushEnabled] = useState(initial.pushEnabled);
    const [geoEnabled, setGeoEnabled] = useState(initial.geoEnabled);

    useEffect(() => {
      // lightweight demo persistence
      try {
        window.localStorage &&
          window.localStorage.setItem(
            "drivex.settings.v1",
            JSON.stringify({ pushEnabled, geoEnabled })
          );
      } catch {
        // ignore
      }
    }, [pushEnabled, geoEnabled]);

    return html`
      <${SimplePage} title="Настройки" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Приложение
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(6, 182, 212, 0.2)", color: "var(--drivex-neon-cyan)" }}
                  >
                    <${Icon} name="bell" size=${20} />
                  </div>
                  <div>
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Push-уведомления
                    </p>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Акции и статусы заказов
                    </p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2" style=${{ color: "var(--drivex-white)" }}>
                  <input
                    type="checkbox"
                    checked=${pushEnabled}
                    onChange=${(e) => setPushEnabled(Boolean(e.target.checked))}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(14, 165, 233, 0.2)", color: "var(--drivex-electric-blue)" }}
                  >
                    <${Icon} name="crosshair" size=${20} />
                  </div>
                  <div>
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Геолокация
                    </p>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Для карты и сервисов рядом
                    </p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2" style=${{ color: "var(--drivex-white)" }}>
                  <input
                    type="checkbox"
                    checked=${geoEnabled}
                    onChange=${(e) => setGeoEnabled(Boolean(e.target.checked))}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl overflow-hidden">
            ${[
              { label: "Платёжные данные", path: "/payment", icon: "card" },
              { label: "Бонусная программа", path: "/bonus", icon: "star" },
              { label: "Пригласить друзей", path: "/invite", icon: "copy" }
            ].map((item, idx, arr) => {
              const divider = idx < arr.length - 1 ? { borderBottom: "1px solid var(--glass-border)" } : null;
              return html`
                <a
                  key=${item.path}
                  href=${`#${item.path}`}
                  className="flex items-center gap-4 p-4"
                  style=${divider}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}>
                    <${Icon} name=${item.icon} size=${20} />
                  </div>
                  <span className="flex-1" style=${{ color: "var(--drivex-white)" }}>${item.label}</span>
                  <span style=${{ color: "var(--drivex-silver)" }}>›</span>
                </a>
              `;
            })}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function HelpScreen() {
    const toast = useToast();

    const faqs = [
      {
        q: "Как записаться в сервис?",
        a: "Откройте вкладку “Сервисы”, выберите СТО и нажмите “Записаться”."
      },
      {
        q: "Как работает доставка из Маркета?",
        a: "Добавьте товары в корзину и оформите заказ. Сейчас это демо."
      },
      {
        q: "Что такое “Умный уход”?",
        a: "Раздел с задачами по обслуживанию и напоминаниями. Сейчас в разработке."
      }
    ];

    const contacts = [
      { icon: "bell", label: "Чат поддержки", value: "24/7", toast: "Открыть чат (демо)" },
      { icon: "phone", label: "Телефон", value: "+7 (800) 555-35-35", toast: "Звонок (демо)" },
      { icon: "user", label: "Email", value: "support@drivex.app", toast: "Письмо (демо)" }
    ];

    return html`
      <${SimplePage} title="Помощь и поддержка" backPath="/profile">
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
            Часто задаваемые вопросы
          </h2>

          <div className="space-y-3 mb-8">
            ${faqs.map((f, idx) => html`
              <div key=${idx} className="glass-card-light rounded-2xl p-5">
                <h3 className="font-bold mb-2" style=${{ color: "var(--drivex-white)" }}>
                  ${f.q}
                </h3>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  ${f.a}
                </p>
              </div>
            `)}
          </div>

          <h2 className="text-xl font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
            Связаться с нами
          </h2>

          <div className="space-y-3">
            ${contacts.map((c, idx) => {
              const iconName = c.icon === "phone" ? "sos" : c.icon;
              return html`
                <button
                  key=${idx}
                  type="button"
                  className="w-full glass-card-light rounded-2xl p-5 flex items-center gap-4 text-left"
                  onClick=${() => toast.push(c.toast)}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
                  >
                    <${Icon} name=${iconName} size=${24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1" style=${{ color: "var(--drivex-white)" }}>
                      ${c.label}
                    </p>
                    <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      ${c.value}
                    </p>
                  </div>
                </button>
              `;
            })}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function PaymentDataScreen() {
    const toast = useToast();
    const cards = [
      { id: "card-1", brand: "Visa", last4: "4242", exp: "09/28" },
      { id: "card-2", brand: "Mastercard", last4: "1067", exp: "02/27" }
    ];

    const [defaultCardId, setDefaultCardId] = useState(cards[0]?.id || "card-1");

    return html`
      <${SimplePage} title="Платёжные данные" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Основная карта
                </p>
                <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                  ${cards.find((c) => c.id === defaultCardId)?.brand || "Карта"} •• ${cards.find((c) => c.id === defaultCardId)?.last4 || "----"}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                <${Icon} name="card" size=${28} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                Управление картами — демо.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium dx-btn"
                onClick=${() => toast.push("Добавление карты (демо)")}
              >
                Добавить
              </button>
            </div>
          </div>

          <div className="space-y-3">
            ${cards.map((c) => {
              const isDefault = c.id === defaultCardId;
              return html`
                <div key=${c.id} className="glass-card-light rounded-2xl p-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style=${{
                      background: isDefault ? "rgba(6, 182, 212, 0.2)" : "var(--glass-bg)",
                      color: isDefault ? "var(--drivex-neon-cyan)" : "var(--drivex-white)"
                    }}
                  >
                    <${Icon} name="card" size=${22} />
                  </div>

                  <div className="flex-1">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${c.brand} •• ${c.last4}
                    </p>
                    <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      Действует до ${c.exp}
                    </p>
                  </div>

                  ${isDefault
                    ? html`<span
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style=${{
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "var(--drivex-success)"
                        }}
                      >
                        Основная
                      </span>`
                    : html`<button
                        type="button"
                        className="px-3 py-2 rounded-xl text-xs font-bold"
                        style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                        onClick=${() => {
                          setDefaultCardId(c.id);
                          toast.push("Карта выбрана (демо)");
                        }}
                      >
                        Выбрать
                      </button>`}
                </div>
              `;
            })}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function BonusProgramScreen() {
    const toast = useToast();

    const points = 1250;
    const tier = "Silver";
    const nextTier = "Gold";
    const progress = 0.62;

    const perks = [
      { title: "Кэшбэк баллами", body: "До 3% на услуги и покупки" },
      { title: "Персональные скидки", body: "Предложения от партнёров" },
      { title: "Приоритетная поддержка", body: "Быстрее ответы в чате" }
    ];

    return html`
      <${SimplePage} title="Бонусная программа" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Баланс
                </p>
                <p className="text-4xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                  ${formatPrice(points)} баллов
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  Уровень: <span style=${{ color: "var(--drivex-white)" }}>${tier}</span>
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                <${Icon} name="star" size=${28} />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs mb-2" style=${{ color: "var(--drivex-silver)" }}>
                <span>До уровня ${nextTier}</span>
                <span>${Math.round(progress * 100)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style=${{ background: "rgba(148, 163, 184, 0.2)" }}>
                <div
                  className="h-full rounded-full"
                  style=${{ width: `${Math.round(progress * 100)}%`, background: "var(--gradient-primary)" }}
                ></div>
              </div>

              <button
                type="button"
                className="w-full mt-5 py-4 rounded-2xl font-bold"
                style=${{ background: "rgba(26, 26, 36, 0.35)", color: "var(--drivex-white)" }}
                onClick=${() => toast.push("Список наград (демо)")}
              >
                Посмотреть награды
              </button>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Привилегии
            </h2>
            <div className="space-y-3">
              ${perks.map(
                (p, idx) => html`
                  <div key=${idx} className="glass-card rounded-2xl p-4">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>${p.title}</p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>${p.body}</p>
                  </div>
                `
              )}
            </div>
          </div>

          <button
            type="button"
            className="w-full py-4 rounded-2xl font-bold text-lg dx-btn"
            onClick=${() => toast.push("Списание баллов (демо)")}
          >
            Потратить баллы
          </button>
        </div>
      </${SimplePage}>
    `;
  }

  function InviteFriendsScreen() {
    const toast = useToast();
    const inviteStateKey = drivexStorageKeys.buyerInvite;

    const inviteCode = useMemo(() => {
      const safeId = String(buyerSession?.id || "guest");
      const cleaned = safeId.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
      return `DRIVEX-${cleaned || "2026"}`;
    }, [buyerSession?.id]);

    const createDefaultInviteState = useCallback(
      () => ({
        code: inviteCode,
        copiedCount: 0,
        sharedCount: 0,
        lastCopiedAt: null,
        lastSharedAt: null,
        createdAt: new Date().toISOString()
      }),
      [inviteCode]
    );

    const [inviteState, setInviteState] = useState(() => {
      try {
        const raw = readBuyerLocalStorage(inviteStateKey, buyerSession);
        if (!raw) return createDefaultInviteState();
        const parsed = raw;
        if (!parsed || typeof parsed !== "object") return createDefaultInviteState();
        return {
          ...createDefaultInviteState(),
          ...parsed,
          code: String(parsed.code || inviteCode)
        };
      } catch {
        return createDefaultInviteState();
      }
    });

    useEffect(() => {
      if (inviteState.code !== inviteCode) {
        const nextState = { ...inviteState, code: inviteCode };
        setInviteState(nextState);
        pushBuyerState(inviteStateKey, nextState);
      }
    }, [inviteCode, inviteState, pushBuyerState, inviteStateKey]);

    const persistInviteState = useCallback(
      (nextState) => {
        setInviteState(nextState);
        pushBuyerState(inviteStateKey, nextState);
      },
      [inviteStateKey]
    );

    const formatTimestamp = useCallback((timestamp) => {
      if (!timestamp) return "—";
      try {
        return new Date(timestamp).toLocaleString("ru-RU", {
          dateStyle: "short",
          timeStyle: "short"
        });
      } catch {
        return String(timestamp);
      }
    }, []);

    const onCopy = useCallback(async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(inviteCode);
          const nextState = {
            ...inviteState,
            code: inviteCode,
            copiedCount: Number(inviteState.copiedCount || 0) + 1,
            lastCopiedAt: new Date().toISOString()
          };
          persistInviteState(nextState);
          toast.push("Код скопирован");
        } else {
          toast.push("Копирование недоступно");
        }
      } catch {
        toast.push("Не удалось скопировать код");
      }
    }, [inviteCode, inviteState, persistInviteState, toast]);

    const onShare = useCallback(async () => {
      const shareText = `Присоединяйся к DRIVEX и используй код ${inviteCode} для бонусов!`;
      const shareUrl = `${window.location.href.split("#")[0]}#/profile?invite=1`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: "Приглашение в DRIVEX",
            text: shareText,
            url: shareUrl
          });
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        } else {
          toast.push("Поделиться не поддерживается в этом браузере");
          return;
        }

        const nextState = {
          ...inviteState,
          code: inviteCode,
          sharedCount: Number(inviteState.sharedCount || 0) + 1,
          lastSharedAt: new Date().toISOString()
        };
        persistInviteState(nextState);
        toast.push("Приглашение отправлено");
      } catch {
        toast.push("Не удалось отправить приглашение");
      }
    }, [inviteCode, inviteState, persistInviteState, toast]);

    return html`
      <${SimplePage} title="Пригласить друзей" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              Ваш реферальный код
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
              <p className="text-3xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                ${inviteCode}
              </p>
              <button
                type="button"
                className="p-3 rounded-xl glass-card-light"
                style=${{ color: "var(--drivex-neon-cyan)" }}
                onClick=${onCopy}
                aria-label="Копировать"
              >
                <${Icon} name="copy" size=${22} />
              </button>
            </div>

            <p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)" }}>
              Пригласите друга и получите бонусы после первой покупки. Ваш статус сохраняется в Supabase.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                className="py-3 rounded-2xl font-bold"
                style=${{ background: "rgba(26, 26, 36, 0.35)", color: "var(--drivex-white)" }}
                onClick=${onCopy}
              >
                Копировать
              </button>
              <button
                type="button"
                className="py-3 rounded-2xl font-bold dx-btn"
                onClick=${onShare}
              >
                Поделиться
              </button>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Статистика приглашений
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              ${[
                { label: "Копий кода", value: inviteState.copiedCount || 0 },
                { label: "Отправлено приглашений", value: inviteState.sharedCount || 0 },
                {
                  label: "Последнее действие",
                  value:
                    inviteState.lastSharedAt || inviteState.lastCopiedAt
                      ? formatTimestamp(inviteState.lastSharedAt || inviteState.lastCopiedAt)
                      : "—"
                }
              ].map(
                (item) => html`
                  <div key=${item.label} className="rounded-2xl p-4 bg-[#11151e]">
                    <p className="text-sm text-silver">${item.label}</p>
                    <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>${item.value}</p>
                  </div>
                `
              )}
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Как это работает
            </h2>
            <div className="space-y-3">
              ${[
                { n: "1", t: "Отправьте код другу", d: "Любым удобным способом" },
                { n: "2", t: "Друг зарегистрируется", d: "и сделает первую покупку" },
                { n: "3", t: "Вы получите бонусы", d: "на баланс DRIVEX" }
              ].map(
                (s) => html`
                  <div key=${s.n} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style=${{ background: "rgba(6, 182, 212, 0.2)", color: "var(--drivex-neon-cyan)" }}
                    >
                      <span className="text-sm font-bold">${s.n}</span>
                    </div>
                    <div>
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>${s.t}</p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>${s.d}</p>
                    </div>
                  </div>
                `
              )}
            </div>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function ProfileSecurityScreen({ profile }) {
    const toast = useToast();

    const initial = useMemo(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem("drivex.security.v1") : null;
        if (!raw) return { twoFactor: false, biometric: false };
        const parsed = JSON.parse(raw);
        return {
          twoFactor: typeof parsed?.twoFactor === "boolean" ? parsed.twoFactor : false,
          biometric: typeof parsed?.biometric === "boolean" ? parsed.biometric : false
        };
      } catch {
        return { twoFactor: false, biometric: false };
      }
    }, []);

    const [twoFactor, setTwoFactor] = useState(initial.twoFactor);
    const [biometric, setBiometric] = useState(initial.biometric);

    useEffect(() => {
      try {
        window.localStorage &&
          window.localStorage.setItem("drivex.security.v1", JSON.stringify({ twoFactor, biometric }));
      } catch {
        // ignore
      }
    }, [twoFactor, biometric]);

    const fallbackProfile = createDefaultBuyerProfile();
    const name = profile?.name || fallbackProfile.name;
    const phone = profile?.phone || fallbackProfile.phone;
    const email = profile?.email || fallbackProfile.email;

    return html`
      <${SimplePage} title="Профиль и безопасность" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Личные данные
                </h2>
                <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                  Имя
                </p>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${name}
                </p>

                <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                  Телефон
                </p>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${phone}
                </p>

                <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                  Email
                </p>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${email}
                </p>
              </div>

              <a
                href="#/profile-edit"
                className="p-3 rounded-xl glass-card"
                style=${{ color: "var(--drivex-neon-cyan)" }}
                aria-label="Редактировать"
              >
                <${Icon} name="edit" size=${22} />
              </a>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Безопасность
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(14, 165, 233, 0.2)", color: "var(--drivex-electric-blue)" }}
                  >
                    <${Icon} name="lock" size=${20} />
                  </div>
                  <div>
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Двухфакторная защита
                    </p>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Дополнительная проверка входа
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked=${twoFactor}
                  onChange=${(e) => setTwoFactor(Boolean(e.target.checked))}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(6, 182, 212, 0.2)", color: "var(--drivex-neon-cyan)" }}
                  >
                    <${Icon} name="scan" size=${20} />
                  </div>
                  <div>
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Биометрия
                    </p>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      Touch ID / Face ID (демо)
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked=${biometric}
                  onChange=${(e) => setBiometric(Boolean(e.target.checked))}
                />
              </div>

              <button
                type="button"
                className="w-full py-3 rounded-2xl font-bold"
                style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                onClick=${() => toast.push("Смена пароля (демо)")}
              >
                Сменить пароль
              </button>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Сессии
            </h2>
            <button
              type="button"
              className="w-full py-3 rounded-2xl font-bold"
              style=${{ background: "rgba(239, 68, 68, 0.15)", color: "var(--drivex-danger)" }}
              onClick=${() => toast.push("Выход на всех устройствах (демо)")}
            >
              Выйти на всех устройствах
            </button>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function ProfileEditScreen({ profile, onSave, buyerSession, onUploadAvatar }) {
    const toast = useToast();
    const fallbackProfile = createDefaultBuyerProfile();

    const avatarInputRef = useRef(null);
    // avatarFile хранит оригинальный File для загрузки в Storage
    const avatarFileRef = useRef(null);
    const [avatar, setAvatar] = useState(profile?.avatar || "");
    const [name, setName] = useState(profile?.name || fallbackProfile.name);
    const [phone, setPhone] = useState(profile?.phone || fallbackProfile.phone);
    const [email, setEmail] = useState(profile?.email || fallbackProfile.email);
    const [saving, setSaving] = useState(false);

    const isSupabaseUser = buyerSession?.provider === "supabase" && buyerSession?.authenticated;

    const openAvatarPicker = useCallback(() => {
      avatarInputRef.current && avatarInputRef.current.click();
    }, []);

    const onAvatarChange = useCallback(
      async (e) => {
        const file = e?.target?.files && e.target.files[0];
        if (e && e.target) e.target.value = "";
        if (!file) return;

        try {
          const nextAvatar = await prepareAvatarDataUrl(file);
          if (!nextAvatar) {
            toast.push("Не удалось загрузить фото");
            return;
          }
          avatarFileRef.current = file;
          setAvatar(nextAvatar);
          toast.push("Фото выбрано");
        } catch (err) {
          if (String(err && err.message) === "File too large") {
            toast.push("Файл слишком большой (до 5 МБ)");
          } else {
            toast.push("Не удалось загрузить фото");
          }
        }
      },
      [toast]
    );

    const removeAvatar = useCallback(() => {
      avatarFileRef.current = null;
      setAvatar("");
      toast.push("Фото удалено");
    }, [toast]);

    const submit = useCallback(async () => {
      const trimmedName = String(name || "").trim();
      if (!trimmedName) {
        toast.push("Введите имя");
        return;
      }

      setSaving(true);
      try {
        let finalAvatar = avatar;

        // Если выбрано новое фото (data URL) и пользователь в Supabase — грузим в Storage
        if (
          avatar && avatar.startsWith("data:image/") &&
          isSupabaseUser && typeof onUploadAvatar === "function"
        ) {
          toast.push("Загрузка фото...");
          const uploadedUrl = await onUploadAvatar(buyerSession, avatar);
          if (uploadedUrl) {
            finalAvatar = uploadedUrl;
            toast.push("Фото загружено в облако");
          }
          // Если загрузка не удалась — оставляем data URL как fallback
        }

        const next = {
          avatar: finalAvatar,
          name: trimmedName,
          phone: String(phone || "").trim(),
          email: String(email || "").trim()
        };

        onSave && onSave(next);
        toast.push("Сохранено");
        window.location.hash = "#/profile-security";
      } catch {
        toast.push("Ошибка при сохранении");
      } finally {
        setSaving(false);
      }
    }, [avatar, email, name, onSave, phone, toast, isSupabaseUser, onUploadAvatar, buyerSession]);

    return html`
      <${SimplePage} title="Редактировать профиль" backPath="/profile-security">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
              Эти данные подставляются в корзину
            </p>
            <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
              Имя и телефон из профиля автоматически переходят в оформление заказа. В корзине их можно временно поменять только для одного заказа.
            </p>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
              Фото профиля
            </h2>
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                ${avatar
                  ? html`<img
                      src=${avatar}
                      alt="Аватар"
                      style=${{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block"
                      }}
                    />`
                  : html`<${Icon} name="user" size=${36} />`}
              </div>

              <div className="flex-1">
                <button
                  type="button"
                  className="w-full py-3 rounded-2xl font-bold dx-btn"
                  onClick=${openAvatarPicker}
                  disabled=${saving}
                >
                  Выбрать фото
                </button>

                ${avatar
                  ? html`<button
                      type="button"
                      className="w-full mt-2 py-3 rounded-2xl font-bold"
                      style=${{
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "var(--drivex-danger)"
                      }}
                      onClick=${removeAvatar}
                      disabled=${saving}
                    >
                      Удалить фото
                    </button>`
                  : null}

                <p className="text-xs mt-3" style=${{ color: "var(--drivex-silver)" }}>
                  ${isSupabaseUser
                    ? "JPG/PNG, до 5 МБ. Фото сохраняется в облаке."
                    : "JPG/PNG, до 5 МБ. Фото сохраняется на этом устройстве."}
                </p>
              </div>
            </div>

            <input
              ref=${avatarInputRef}
              type="file"
              accept="image/*"
              style=${{ display: "none" }}
              onChange=${onAvatarChange}
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Имя
            </label>
            <input
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${name}
              onInput=${(e) => setName(e.target.value)}
              placeholder="Имя и фамилия"
              disabled=${saving}
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Телефон
            </label>
            <input
              type="tel"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${phone}
              onInput=${(e) => setPhone(e.target.value)}
              placeholder="+992 00 000 00 00"
              disabled=${saving}
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Email
            </label>
            <input
              type="email"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${email}
              onInput=${(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled=${saving}
            />
          </div>

          <button
            type="button"
            className="w-full py-4 rounded-2xl font-bold text-lg dx-btn"
            onClick=${submit}
            disabled=${saving}
            style=${{ opacity: saving ? 0.6 : 1 }}
          >
            ${saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </${SimplePage}>
    `;
  }


  // ── Export to DX.screens (chain: app-main.js читает отсюда) ──
  DX.screens = DX.screens || {};
  if (typeof BonusProgramScreen !== 'undefined') DX.screens['BonusProgramScreen'] = BonusProgramScreen;
  if (typeof HelpScreen !== 'undefined') DX.screens['HelpScreen'] = HelpScreen;
  if (typeof InviteFriendsScreen !== 'undefined') DX.screens['InviteFriendsScreen'] = InviteFriendsScreen;
  if (typeof NotificationsScreen !== 'undefined') DX.screens['NotificationsScreen'] = NotificationsScreen;
  if (typeof PaymentDataScreen !== 'undefined') DX.screens['PaymentDataScreen'] = PaymentDataScreen;
  if (typeof ProfileEditScreen !== 'undefined') DX.screens['ProfileEditScreen'] = ProfileEditScreen;
  if (typeof ProfileSecurityScreen !== 'undefined') DX.screens['ProfileSecurityScreen'] = ProfileSecurityScreen;
  if (typeof SettingsScreen !== 'undefined') DX.screens['SettingsScreen'] = SettingsScreen;
})();
