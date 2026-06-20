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
  function useConfirm(){ return DX.ConfirmContext && React.useContext ? React.useContext(DX.ConfirmContext) : { confirm: function(){ return Promise.resolve(true); } }; }
  const Toggle = function(p){ var F=DX.Toggle; return F ? F(p) : null; };
  const navigateToHash = function(p){ DX.navigateToHash && DX.navigateToHash(p); };
  const SimplePage = function(p){ var F=DX.SimplePage; return F ? F(p) : (p.children||null); };
  const formatTjsPrice = function(n){ return DX.formatTjsPrice ? DX.formatTjsPrice(n) : (String(n)+' сом.'); };
  const genId = function(p){ return DX.genId ? DX.genId(p) : (p+'-'+Date.now()); };

  // ── Уведомления: только РЕАЛЬНЫЕ события (заказы, чаты, записи в сервис) ──
  // Демо-уведомления убраны: новый пользователь видит «Нет уведомлений», пока
  // не появятся реальные события (статус заказа, сообщение продавца, запись).
  const NOTIF_STORE_KEY = "drivex.notifications.v1";
  const _dxFn = (name) =>
    (typeof DX !== "undefined" && DX[name]) ||
    (typeof window !== "undefined" && window[name]) ||
    null;

  function readNotifState() {
    try {
      const raw = window.localStorage ? window.localStorage.getItem(NOTIF_STORE_KEY) : null;
      if (!raw) return { read: [], dismissed: [] };
      const p = JSON.parse(raw);
      return { read: Array.isArray(p.read) ? p.read : [], dismissed: Array.isArray(p.dismissed) ? p.dismissed : [] };
    } catch { return { read: [], dismissed: [] }; }
  }
  function writeNotifState(state) {
    try {
      window.localStorage && window.localStorage.setItem(
        NOTIF_STORE_KEY,
        JSON.stringify({ read: state.read || [], dismissed: state.dismissed || [] })
      );
    } catch { /* ignore */ }
  }

  // Короткий код заказа — единый общий хелпер (DX-7158E9)
  const shortOrderId = (id) => (_dxFn("formatOrderShortId") || ((x) => String(x || "")))(id);

  // Уведомления по статусам заказов покупателя
  function buildBuyerOrderNotifications(orders) {
    const normalize = _dxFn("normalizeBuyerOrdersList");
    const list = normalize ? normalize(orders) : (Array.isArray(orders) ? orders : []);
    const statusMeta = _dxFn("getBuyerOrderStatusMeta");
    const fmt = _dxFn("formatChatTime");
    return list
      .slice()
      .sort((a, b) => String(b.statusUpdatedAt || b.date || "").localeCompare(String(a.statusUpdatedAt || a.date || "")))
      .slice(0, 10)
      .map((order) => {
        const meta = statusMeta ? statusMeta(order.status) : { label: "Обновление заказа", color: "var(--drivex-neon-cyan)" };
        const firstItem = Array.isArray(order.items) && order.items.length ? order.items[0].title : "";
        const store = order.storeName ? ` • ${order.storeName}` : "";
        return {
          // id содержит статус → при смене статуса это новое (непрочитанное) событие
          id: `order-${order.id}-${order.status || "new"}`,
          title: `Заказ ${shortOrderId(order.id)} · ${meta.label || "обновление"}`,
          body: (firstItem || "Ваш заказ") + store,
          time: fmt ? fmt(order.statusUpdatedAt || order.date) : "",
          color: meta.color || "var(--drivex-neon-cyan)",
          icon: "bag"
        };
      });
  }

  // Уведомления о новых сообщениях продавца по заказам
  function buildBuyerChatNotifications(orders, orderChats) {
    const unreadCount = _dxFn("getOrderChatUnreadCount");
    if (!orderChats || !unreadCount) return [];
    const normalize = _dxFn("normalizeBuyerOrdersList");
    const list = normalize ? normalize(orders) : (Array.isArray(orders) ? orders : []);
    const lastMsg = _dxFn("getOrderChatLastMessage");
    const preview = _dxFn("getOrderChatPreviewText");
    const fmt = _dxFn("formatChatTime");
    const out = [];
    list.forEach((order) => {
      if (unreadCount(orderChats, order.id, "buyer") <= 0) return;
      const last = lastMsg ? lastMsg(orderChats, order.id) : null;
      out.push({
        id: `chat-${order.id}-${(last && (last.id || last.sentAt)) || "msg"}`,
        title: `Новое сообщение • ${order.storeName || "Продавец"}`,
        body: last ? (preview ? preview(last, "buyer") : (last.text || "Сообщение по заказу")) : `Сообщение по заказу ${order.id}`,
        time: (last && fmt) ? fmt(last.sentAt) : "",
        color: "var(--drivex-electric-blue)",
        icon: "bell"
      });
    });
    return out;
  }

  function visibleBuyerNotifications(serviceRequests, buyerOrders, orderChats) {
    const service = (typeof buildBuyerServiceNotifications === "function") ? buildBuyerServiceNotifications(serviceRequests) : [];
    const orders = buildBuyerOrderNotifications(buyerOrders);
    const chats = buildBuyerChatNotifications(buyerOrders, orderChats);
    const st = readNotifState();
    return [...chats, ...orders, ...service].filter((n) => n && n.id && !st.dismissed.includes(n.id));
  }
  function countUnreadBuyerNotifications(serviceRequests, buyerOrders, orderChats) {
    const st = readNotifState();
    return visibleBuyerNotifications(serviceRequests, buyerOrders, orderChats).filter((n) => !st.read.includes(n.id)).length;
  }
  try { DX.visibleBuyerNotifications = visibleBuyerNotifications; } catch (e) {}
  try { DX.countUnreadBuyerNotifications = countUnreadBuyerNotifications; } catch (e) {}

  function NotificationsScreen({ serviceRequests, buyerOrders, orderChats }) {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [, setTick] = useState(0);
    const items = visibleBuyerNotifications(serviceRequests, buyerOrders, orderChats);

    // Какие были непрочитаны на момент открытия — для значка «новое»
    const unreadOnOpenRef = useRef(null);
    if (unreadOnOpenRef.current === null) {
      const st = readNotifState();
      unreadOnOpenRef.current = new Set(items.filter((n) => !st.read.includes(n.id)).map((n) => n.id));
    }

    // Отметить все видимые как прочитанные при открытии экрана
    useEffect(() => {
      const st = readNotifState();
      const ids = visibleBuyerNotifications(serviceRequests, buyerOrders, orderChats).map((n) => n.id);
      const merged = Array.from(new Set([...st.read, ...ids]));
      if (merged.length !== st.read.length) writeNotifState({ read: merged, dismissed: st.dismissed });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClear = useCallback(async () => {
      if (!visibleBuyerNotifications(serviceRequests, buyerOrders, orderChats).length) return;
      const ok = await confirm({
        title: "Очистить уведомления?",
        message: "Все текущие уведомления будут скрыты.",
        confirmLabel: "Очистить",
        danger: true
      });
      if (!ok) return;
      const st = readNotifState();
      const ids = visibleBuyerNotifications(serviceRequests, buyerOrders, orderChats).map((n) => n.id);
      writeNotifState({ read: st.read, dismissed: Array.from(new Set([...st.dismissed, ...ids])) });
      setTick((t) => t + 1);
      toast.push("Уведомления очищены");
    }, [confirm, serviceRequests, buyerOrders, orderChats, toast]);

    return html`
      <${SimplePage} title="Уведомления" backPath="/profile">
        <div className="px-6 py-6">
          ${items.length
            ? html`
                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    onClick=${handleClear}
                    className="text-sm font-semibold"
                    style=${{ color: "var(--drivex-silver)" }}
                  >
                    Очистить
                  </button>
                </div>
                <div className="space-y-3">
                  ${items.map((n, idx) => html`
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
                            <h3 className="font-bold flex items-center gap-2" style=${{ color: "var(--drivex-white)" }}>
                              ${n.title}
                              ${unreadOnOpenRef.current.has(n.id)
                                ? html`<span style=${{ width: "8px", height: "8px", borderRadius: "9999px", background: "var(--drivex-neon-cyan)", display: "inline-block", flexShrink: 0 }}></span>`
                                : null}
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
              `
            : html`
                <div className="glass-card-light rounded-2xl text-center" style=${{ padding: "48px" }}>
                  <div style=${{ fontSize: "48px", marginBottom: "12px" }}>🔔</div>
                  <p className="font-semibold" style=${{ color: "var(--drivex-white)", marginBottom: "6px" }}>
                    Нет уведомлений
                  </p>
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    Здесь появятся акции, статусы заказов и напоминания
                  </p>
                </div>
              `}
        </div>
      </${SimplePage}>
    `;
  }

  function SettingsScreen({ session }) {
    const toast = useToast();
    const userId = session && session.id ? session.id : "";

    const initial = useMemo(() => {
      try {
        const raw = window.localStorage ? window.localStorage.getItem("drivex.settings.v1") : null;
        if (!raw) return { pushEnabled: false, geoEnabled: true };
        const parsed = JSON.parse(raw);
        return {
          pushEnabled: typeof parsed?.pushEnabled === "boolean" ? parsed.pushEnabled : false,
          geoEnabled: typeof parsed?.geoEnabled === "boolean" ? parsed.geoEnabled : true
        };
      } catch {
        return { pushEnabled: false, geoEnabled: true };
      }
    }, []);

    const [pushEnabled, setPushEnabled] = useState(initial.pushEnabled);
    const [geoEnabled, setGeoEnabled] = useState(initial.geoEnabled);
    const [busy, setBusy] = useState(false);

    const persist = useCallback((next) => {
      try {
        window.localStorage &&
          window.localStorage.setItem("drivex.settings.v1", JSON.stringify(next));
      } catch {
        // ignore
      }
      // Best-effort синхронизация в Supabase users.preferences
      try {
        const client = window.__DRIVEX_SUPABASE_CLIENT__;
        if (client && userId) {
          client.from("users").update({ preferences: next }).eq("id", userId).then(function(){}, function(){});
        }
      } catch {
        // ignore
      }
    }, [userId]);

    const handlePushToggle = useCallback(async (next) => {
      if (busy) return;
      if (!next) {
        setPushEnabled(false);
        persist({ pushEnabled: false, geoEnabled });
        toast.push("Push-уведомления выключены");
        return;
      }
      const push = window.DrivexPush;
      if (!push || !push.isConfigured) {
        toast.push("Push недоступны в этой сборке");
        return;
      }
      setBusy(true);
      try {
        const token = await push.requestPermission();
        if (!token) {
          setPushEnabled(false);
          toast.push("Разрешите уведомления в браузере");
          return;
        }
        if (userId && push.registerTokenForUser) {
          await push.registerTokenForUser(userId);
        }
        setPushEnabled(true);
        persist({ pushEnabled: true, geoEnabled });
        toast.push("Push-уведомления включены");
      } catch (e) {
        setPushEnabled(false);
        toast.push("Не удалось включить уведомления");
      } finally {
        setBusy(false);
      }
    }, [busy, geoEnabled, persist, toast, userId]);

    const handleGeoToggle = useCallback((next) => {
      setGeoEnabled(next);
      persist({ pushEnabled, geoEnabled: next });
      toast.push(next ? "Геолокация включена" : "Геолокация выключена");
    }, [persist, pushEnabled, toast]);

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
                      ${busy ? "Запрашиваем разрешение…" : "Акции и статусы заказов"}
                    </p>
                  </div>
                </div>
                <${Toggle} checked=${pushEnabled} disabled=${busy} onChange=${handlePushToggle} />
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
                <${Toggle} checked=${geoEnabled} onChange=${handleGeoToggle} />
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl overflow-hidden">
            ${[
              { label: "Профиль и безопасность", path: "/profile-security", icon: "lock" },
              { label: "Платёжные данные", path: "/payment", icon: "card" },
              { label: "Бонусная программа", path: "/bonus", icon: "star" },
              { label: "Пригласить друзей", path: "/invite", icon: "copy" },
              { label: "Помощь и поддержка", path: "/help", icon: "bell" }
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
      {
        label: "Телефон", value: "+992 92 712 59 89", href: "tel:+992927125989",
        color: "var(--drivex-neon-cyan)", bg: "rgba(6, 182, 212, 0.16)",
        path: "M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
      },
      {
        label: "Telegram", value: "@shoxrux15080", href: "https://t.me/shoxrux15080", external: true,
        color: "#2AABEE", bg: "rgba(42, 171, 238, 0.16)",
        path: "M21.94 4.66a1.2 1.2 0 0 0-1.2-.18L3.4 11.2c-.86.33-.85 1.57.02 1.88l4.27 1.5 1.65 5.24c.2.62.97.83 1.46.4l2.38-2.07 4.2 3.1c.5.36 1.2.1 1.35-.5l3.27-15.2a1.2 1.2 0 0 0-.46-1.39zM9.5 14.3l8.2-5.05c.16-.1.33.12.19.25l-6.66 6.03c-.2.18-.32.43-.36.7l-.23 1.66-1.14-3.59z"
      },
      {
        label: "WhatsApp", value: "+992 92 712 59 89", href: "https://wa.me/992927125989", external: true,
        color: "#25D366", bg: "rgba(37, 211, 102, 0.16)",
        path: "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.86 9.86 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.13c-.24.68-1.42 1.31-1.96 1.36-.5.05-1.14.07-1.84-.12-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.23-5.01-4.42-.15-.2-1.2-1.59-1.2-3.03 0-1.44.76-2.15 1.03-2.44.27-.29.58-.36.77-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.82 2.03.89 2.18.07.15.12.32.02.51-.34.68-.7.65-.51.98.29.5 1.28 2.11 2.76 2.96.42.24.86.45 1.16.27.29-.18.73-.85.92-1.14.19-.29.39-.24.66-.15.27.1 1.71.81 2 .96.29.15.49.22.56.34.07.12.07.7-.17 1.38z"
      },
      {
        label: "Email", value: "shohruh15082006@gmail.com", href: "mailto:shohruh15082006@gmail.com",
        color: "#cbd5e1", bg: "rgba(148, 163, 184, 0.16)",
        path: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
      }
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
              const inner = html`
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style=${{ background: c.bg || "var(--gradient-primary)" }}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill=${c.color || "var(--drivex-white)"} aria-hidden="true">
                    <path d=${c.path}></path>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold mb-1" style=${{ color: "var(--drivex-white)" }}>
                    ${c.label}
                  </p>
                  <p className="text-sm truncate" style=${{ color: "var(--drivex-silver)" }}>
                    ${c.value}
                  </p>
                </div>
                <span style=${{ color: "var(--drivex-silver)" }}>›</span>
              `;
              const extraProps = c.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
              return c.href
                ? html`<a key=${idx} href=${c.href} ...${extraProps} className="w-full glass-card-light rounded-2xl p-4 flex items-center gap-4 text-left">${inner}</a>`
                : html`<button key=${idx} type="button" className="w-full glass-card-light rounded-2xl p-4 flex items-center gap-4 text-left" onClick=${() => toast.push(c.toast)}>${inner}</button>`;
            })}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  // Универсальный экран-заглушка «Скоро» — честная замена демо-разделов
  function ComingSoonScreen({ title, emoji, subtitle }) {
    return html`
      <${SimplePage} title=${title || "Скоро"} backPath="/profile">
        <div className="px-4 py-6">
          <div
            className="glass-card-light rounded-2xl text-center"
            style=${{ margin: "24px 16px", padding: "48px" }}
          >
            <div style=${{ fontSize: "56px", marginBottom: "16px" }}>${emoji || "🚧"}</div>
            <p
              className="font-semibold"
              style=${{ color: "var(--drivex-white)", marginBottom: "8px" }}
            >
              Скоро
            </p>
            <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              ${subtitle || "Раздел в разработке"}
            </p>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function FavoritesScreen({ favorites = [], onRemove }) {
    const toast = useToast();
    const { confirm } = useConfirm();
    const list = Array.isArray(favorites) ? favorites : [];
    const services = list.filter((f) => f.type === "service");
    const products = list.filter((f) => f.type === "product");

    const handleRemove = useCallback(async (item) => {
      const ok = await confirm({
        title: "Убрать из избранного?",
        message: item.title,
        confirmLabel: "Убрать",
        cancelLabel: "Отмена",
        danger: true,
        icon: "star"
      });
      if (!ok) return;
      onRemove && onRemove(item.type, item.id);
      toast.push("Убрано из избранного");
    }, [confirm, onRemove, toast]);

    const renderItem = (item) => html`
      <div key=${item.type + ":" + item.id} className="glass-card-light rounded-2xl p-4 flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-3 flex-1 text-left min-w-0"
          onClick=${() => { if (item.path) navigateToHash(item.path); }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style=${{ background: "rgba(6, 182, 212, 0.15)", color: "var(--drivex-neon-cyan)" }}
          >
            ${item.image
              ? html`<img src=${item.image} alt="" style=${{ width: "100%", height: "100%", objectFit: "cover" }} />`
              : html`<${Icon} name=${item.type === "product" ? "bag" : "wrench"} size=${22} />`}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate" style=${{ color: "var(--drivex-white)" }}>${item.title}</p>
            ${item.subtitle ? html`<p className="text-sm truncate" style=${{ color: "var(--drivex-silver)" }}>${item.subtitle}</p>` : null}
          </div>
        </button>
        <button
          type="button"
          className="px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap"
          style=${{ background: "rgba(239, 68, 68, 0.12)", color: "var(--drivex-danger)" }}
          onClick=${() => handleRemove(item)}
          aria-label="Убрать из избранного"
        >
          Убрать
        </button>
      </div>
    `;

    return html`
      <${SimplePage} title="Избранное" backPath="/profile">
        <div className="px-6 py-6 space-y-5">
          ${!list.length
            ? html`
                <div className="glass-card-light rounded-2xl text-center" style=${{ padding: "48px" }}>
                  <div style=${{ fontSize: "56px", marginBottom: "16px" }}>⭐</div>
                  <p className="font-semibold" style=${{ color: "var(--drivex-white)", marginBottom: "8px" }}>
                    Пока пусто
                  </p>
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    Добавляйте сервисы и товары в избранное кнопкой ♡ на карточке
                  </p>
                </div>
              `
            : html`
                ${services.length
                  ? html`<div className="space-y-3">
                      <h3 className="text-sm font-semibold px-2" style=${{ color: "var(--drivex-silver)" }}>Сервисы</h3>
                      ${services.map(renderItem)}
                    </div>`
                  : null}
                ${products.length
                  ? html`<div className="space-y-3">
                      <h3 className="text-sm font-semibold px-2" style=${{ color: "var(--drivex-silver)" }}>Товары</h3>
                      ${products.map(renderItem)}
                    </div>`
                  : null}
              `}
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

    const { confirm } = useConfirm();

    const handleLogoutEverywhere = useCallback(async () => {
      const ok = await confirm({
        title: "Выйти на всех устройствах?",
        message: "Активные сессии будут завершены на всех устройствах.",
        confirmLabel: "Выйти",
        cancelLabel: "Отмена",
        danger: true,
        icon: "lock"
      });
      if (!ok) return;
      try {
        const client = window.__DRIVEX_SUPABASE_CLIENT__;
        if (client && client.auth && client.auth.signOut) {
          await client.auth.signOut({ scope: "global" });
        }
      } catch (e) {
        // ignore
      }
      toast.push("Сессии завершены");
      navigateToHash("/login");
      window.setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 300);
    }, [confirm, toast]);

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

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style=${{ background: "rgba(14, 165, 233, 0.2)", color: "var(--drivex-electric-blue)" }}
              >
                <${Icon} name="lock" size=${20} />
              </div>
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Вход по одноразовому коду
                </p>
                <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Аккаунт защищён OTP-кодом на телефон. Биометрия и 2FA — скоро.
                </p>
              </div>
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
              onClick=${handleLogoutEverywhere}
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
  if (typeof ComingSoonScreen !== 'undefined') DX.screens['ComingSoonScreen'] = ComingSoonScreen;
  if (typeof FavoritesScreen !== 'undefined') DX.screens['FavoritesScreen'] = FavoritesScreen;
  if (typeof HelpScreen !== 'undefined') DX.screens['HelpScreen'] = HelpScreen;
  if (typeof InviteFriendsScreen !== 'undefined') DX.screens['InviteFriendsScreen'] = InviteFriendsScreen;
  if (typeof NotificationsScreen !== 'undefined') DX.screens['NotificationsScreen'] = NotificationsScreen;
  if (typeof PaymentDataScreen !== 'undefined') DX.screens['PaymentDataScreen'] = PaymentDataScreen;
  if (typeof ProfileEditScreen !== 'undefined') DX.screens['ProfileEditScreen'] = ProfileEditScreen;
  if (typeof ProfileSecurityScreen !== 'undefined') DX.screens['ProfileSecurityScreen'] = ProfileSecurityScreen;
  if (typeof SettingsScreen !== 'undefined') DX.screens['SettingsScreen'] = SettingsScreen;
})();
