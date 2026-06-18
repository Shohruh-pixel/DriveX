// DRIVEX Seller CRM — редизайн кабинета (handoff design_handoff_drivex_crm)
// Загружается ПОСЛЕ seller-crm.js → переопределяет экраны кабинета в DX.screens.
// Те же props/данные/обработчики, новый UI: нижняя навигация · FAB · чистые состояния.
// Дизайн-система scoped под .cx (см. app/seller-crm-redesign.css).
(() => {
  'use strict';
  window.DX = window.DX || {};
  const DX = window.DX;
  const html = DX.html;
  const React = DX.React;
  const { useState, useEffect, useMemo, useRef, useCallback } = DX;
  function useToast() { return DX.useToast ? DX.useToast() : { push() {} }; }
  const navigateToHash = (p) => DX.navigateToHash && DX.navigateToHash(p);

  // ── Хелперы из общего ядра ───────────────────────────────────────────
  const formatTjsPrice = (n) => (DX.formatTjsPrice ? DX.formatTjsPrice(n) : `${Number(n) || 0} TJS`);
  const formatNum = (n) => new Intl.NumberFormat("ru-RU").format(Number(n) || 0);
  const buildSellerDashboardStats = DX.buildSellerDashboardStats || (() => ({ totalProducts: 0, publishedProducts: 0, totalOrders: 0, newOrders: 0, lowStockProducts: 0, revenue: 0 }));
  const buildSellerClientsFromOrders = DX.buildSellerClientsFromOrders || (() => []);
  const getSellerProductCategoryMeta = DX.getSellerProductCategoryMeta || (() => ({ name: "Запчасти" }));
  const getSellerOrderStatusMeta = DX.getSellerOrderStatusMeta || ((id) => ({ id: id || "new", label: "Новый", color: "var(--cx-warn)" }));
  const getAllowedSellerOrderStatuses = DX.getAllowedSellerOrderStatuses || (() => []);
  const sellerOrderStatusOptions = DX.sellerOrderStatusOptions || [];
  const sellerProductStatusOptions = DX.sellerProductStatusOptions || [{ id: "active", label: "Активен" }, { id: "draft", label: "Черновик" }, { id: "archived", label: "Архив" }];
  const marketCategories = DX.marketCategories || [];
  const normalizeProductCompatibility = DX.normalizeProductCompatibility || (() => null);
  const formatRuDate = DX.formatRuDate || ((d) => String(d || ""));
  const formatTjs = (n) => (DX.formatTjsPrice ? DX.formatTjsPrice(n) : `${formatNum(n)} TJS`);
  const getSellerOrderChatPath = DX.getSellerOrderChatPath || ((id) => `/seller/orders/${encodeURIComponent(id)}/chat`);
  const getOrderChatUnreadCount = DX.getOrderChatUnreadCount || (() => 0);

  // Дата (+ реальное время, если есть) заказа человекочитаемо
  function formatOrderWhen(order) {
    const raw = order.createdAt || order.created_at || order.date || "";
    const ts = Date.parse(raw);
    if (!Number.isNaN(ts)) {
      const d = new Date(ts);
      const datePart = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
      // Показываем время только если оно «настоящее» (не синтетические 00:00 / 10:00)
      const hasTime = /T\d/.test(String(raw));
      const synthetic = (d.getHours() === 10 && d.getMinutes() === 0) || (d.getHours() === 0 && d.getMinutes() === 0);
      const timePart = hasTime && !synthetic ? `, ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "";
      return `${datePart}${timePart}`;
    }
    return formatRuDate(order.date);
  }

  // Карта статус заказа → тон pill
  function orderPillTone(statusId) {
    switch (statusId) {
      case "completed": return "accent";
      case "cancelled": return "danger";
      case "new": return "warn";
      default: return "accent";
    }
  }

  // ── Иконки (stroke-SVG из crm-chrome.jsx) ────────────────────────────
  const ICON_PATHS = {
    grid: "M3.5 3.5h6v6h-6zM14.5 3.5h6v6h-6zM3.5 14.5h6v6h-6zM14.5 14.5h6v6h-6z",
    box: "M12 2.5 21 7v10l-9 4.5L3 17V7zM3 7l9 4.5M21 7l-9 4.5M12 11.5V21",
    bag: "M6 7h12l-1 13.5H7zM8.5 7a3.5 3.5 0 0 1 7 0",
    users: "M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19M9.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.7a3 3 0 0 1 0 5.6",
    bell: "M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5M13.5 19.5a2 2 0 0 1-3.5 0",
    plus: "M12 5v14M5 12h14",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-4-4",
    edit: "M14.5 4.5 19.5 9.5M4 20l1-4L16 5l3 3L8 19z",
    trash: "M4 6.5h16M9 6.5V4.5h6v2M6 6.5 7 20h10l1-13.5",
    chev: "M9 5l7 7-7 7",
    chevD: "M5 8.5 12 15l7-6.5",
    sliders: "M4 7h11M19 7h1M4 17h1M9 17h11M14 4.5v5M7 14.5v5",
    coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v10M14.5 9.5C14.5 8.1 13.4 7 12 7s-2.5 1.1-2.5 2.5S10.6 12 12 12s2.5 1.1 2.5 2.5S13.4 17 12 17s-2.5-1.1-2.5-2.5",
    truck: "M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7zM6 18.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6M17 18.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6",
    spark: "M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z",
    arrowUp: "M12 19V5M6 11l6-6 6 6",
    arrowR: "M4 12h15M13 6l6 6-6 6",
    close: "M6 6l12 12M18 6 6 18",
    back: "M15 5l-7 7 7 7",
    exit: "M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 16l4-4-4-4M20 12H9",
    image: "M4 5h16v14H4zM4 16l4.5-4.5 4 4L16 12l4 4M9 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0",
    check: "M4.5 12.5 9.5 17.5 19.5 6.5",
    tag: "M3.5 11.5V4.5h7l9.5 9.5-7 7zM7.5 8a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6",
    star: "M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.7l1-5.8-4.2-4.1 5.9-.9z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3.5 2",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6a7 7 0 0 0 .1-1"
  };
  function Icon({ name, size = 20, color = "currentColor", sw = 1.7 }) {
    return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" style=${{ flexShrink: 0 }}>
      <path d=${ICON_PATHS[name] || ICON_PATHS.box} stroke=${color} stroke-width=${sw} stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`;
  }

  // ── Каркас: контент + FAB + нижняя навигация ─────────────────────────
  const NAV_ITEMS = [
    { id: "home", icon: "grid", label: "Дашборд", path: "/seller" },
    { id: "products", icon: "box", label: "Товары", path: "/seller/products" },
    { id: "orders", icon: "bag", label: "Заказы", path: "/seller/orders" },
    { id: "clients", icon: "users", label: "Клиенты", path: "/seller/clients" }
  ];

  function CxNav({ active }) {
    return html`
      <nav className="cx-nav">
        ${NAV_ITEMS.map((it) => {
          const on = it.id === active;
          return html`
            <button
              key=${it.id}
              type="button"
              className=${`cx-nav-item ${on ? "is-active" : ""}`}
              onClick=${() => navigateToHash(it.path)}
            >
              <span className="cx-nav-cap">
                <${Icon} name=${it.icon} size=${21} color=${on ? "var(--cx-link)" : "var(--cx-faint)"} sw=${on ? 2 : 1.7} />
              </span>
              <span className="cx-nav-label">${it.label}</span>
            </button>
          `;
        })}
      </nav>
    `;
  }

  function CxShell({ nav = "home", fab = false, children }) {
    return html`
      <div className="cx">
        <div className="cx-content">${children}</div>
        ${fab
          ? html`<button type="button" className="cx-fab" aria-label="Добавить товар" onClick=${() => navigateToHash("/seller/products/new")}>
              <${Icon} name="plus" size=${26} color="#fff" sw=${2.2} />
            </button>`
          : null}
        <${CxNav} active=${nav} />
      </div>
    `;
  }

  // Аватар магазина: лого-картинка или инициалы
  function storeAvatarText(store) {
    const name = String(store?.name || "DX").trim();
    return name.replace(/[^A-Za-zА-Яа-яЁё0-9]/g, "").slice(0, 2).toUpperCase() || "DX";
  }
  function isImageLogo(logo) {
    const v = String(logo || "").trim();
    return v.startsWith("data:image/") || /^https?:/i.test(v);
  }

  function CxTopBar({ store }) {
    const subParts = [store?.businessType || store?.storeCategory, store?.city].filter(Boolean);
    return html`
      <div className="cx-topbar">
        ${isImageLogo(store?.logo)
          ? html`<img className="cx-avatar" src=${store.logo} alt=${store?.name || "Магазин"} />`
          : html`<div className="cx-avatar">${storeAvatarText(store)}</div>`}
        <div style=${{ flex: 1, minWidth: 0 }}>
          <div style=${{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span className="cx-topbar-name" style=${{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              ${store?.name || "Мой магазин"}
            </span>
            <span className="cx-online-dot"></span>
          </div>
          <div className="cx-topbar-sub">${subParts.join(" · ") || "Магазин на DRIVEX"}</div>
        </div>
        <button type="button" className="cx-icon-btn" title="В клиентский маркет" aria-label="В клиентский маркет" onClick=${() => navigateToHash("/market")}>
          <${Icon} name="back" size=${19} />
        </button>
        <button type="button" className="cx-icon-btn" onClick=${() => navigateToHash("/seller/orders")}>
          <${Icon} name="bell" size=${19} />
          <span className="cx-bell-dot"></span>
        </button>
        <button type="button" className="cx-icon-btn" title="Выйти из кабинета" aria-label="Выйти из кабинета" onClick=${() => navigateToHash("/partner/login?logout=1")}>
          <${Icon} name="exit" size=${19} color="var(--cx-danger, #ef4444)" />
        </button>
      </div>
    `;
  }

  function CxPill({ tone = "neutral", dot = false, children }) {
    return html`<span className=${`cx-pill is-${tone}`}>
      ${dot ? html`<span className="cx-pill-dot"></span>` : null}${children}
    </span>`;
  }

  function CxStatTile({ icon, value, label }) {
    return html`
      <div className="cx-tile">
        <div className="cx-tile-ico"><${Icon} name=${icon} size=${18} color="var(--cx-link)" /></div>
        <div>
          <div className="cx-tile-val">${value}</div>
          <div className="cx-tile-label">${label}</div>
        </div>
      </div>
    `;
  }

  function CxMiniStat({ icon, value, label }) {
    return html`
      <div className="cx-mini">
        <div className="cx-mini-ico"><${Icon} name=${icon} size=${16} color="var(--cx-link)" /></div>
        <div className="cx-mini-val">${value}</div>
        <div className="cx-mini-label">${label}</div>
      </div>
    `;
  }

  function CxSectionHead({ title, action, onAction }) {
    return html`
      <div className="cx-section-head">
        <span className="cx-section-title">${title}</span>
        ${action ? html`<button type="button" className="cx-section-action" onClick=${onAction}>${action}</button>` : null}
      </div>
    `;
  }

  // ── Экран 1: Дашборд ─────────────────────────────────────────────────
  function MiniBars({ values }) {
    const data = Array.isArray(values) && values.length ? values : [22, 34, 28, 46, 40, 58, 72];
    const max = Math.max(...data, 1);
    return html`
      <div className="cx-bars">
        ${data.map((v, i) => html`
          <div
            key=${i}
            className=${`cx-bar ${i === data.length - 1 ? "is-last" : ""}`}
            style=${{ height: `${Math.max(8, Math.round((v / max) * 56))}px` }}
          ></div>
        `)}
      </div>
    `;
  }

  function SellerDashboardScreen({ currentUser, store, products, orders, notifications, setupState }) {
    const stats = useMemo(() => buildSellerDashboardStats(products, orders), [products, orders]);
    const greetName = (currentUser?.name || store?.ownerName || "Продавец").split(" ")[0] || "Продавец";
    const totalStock = useMemo(
      () => (Array.isArray(products) ? products : []).reduce((sum, p) => sum + (Number(p.stockQty) || 0), 0),
      [products]
    );
    const recentOrders = useMemo(() => {
      return [...(Array.isArray(orders) ? orders : [])]
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .slice(0, 4);
    }, [orders]);

    // Мини-чарт: суммы 7 последних заказов (или плейсхолдер)
    const chartValues = useMemo(() => {
      const amounts = recentOrders.map((o) => Number(o.amount) || 0).reverse();
      return amounts.length ? amounts : null;
    }, [recentOrders]);

    const notifList = useMemo(() => {
      const list = Array.isArray(notifications) ? notifications.slice(0, 4) : [];
      if (list.length) return list;
      return [{ id: "welcome", icon: "check", tone: "accent", title: "Магазин зарегистрирован", body: "Онбординг завершён", time: "" }];
    }, [notifications]);

    return html`
      <${CxShell} nav="home" fab=${true}>
        <${CxTopBar} store=${store} />

        <div style=${{ marginTop: "18px" }}>
          <div className="cx-greet">С возвращением, ${greetName}</div>
          <div className="cx-screen-sub">Вот что происходит в магазине сегодня</div>
        </div>

        <div className="cx-hero">
          <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="cx-hero-label">Выручка за месяц</div>
              <div className="cx-hero-value">${formatNum(stats.revenue)} <span>TJS</span></div>
            </div>
            <${CxPill} tone="accent">
              <${Icon} name="spark" size=${13} color="var(--cx-link)" />${stats.revenue > 0 ? "Растёт" : "Старт"}
            </${CxPill}>
          </div>
          <${MiniBars} values=${chartValues} />
          <div className="cx-hero-hint">
            ${stats.totalOrders > 0
              ? "Сумма по завершённым и активным заказам магазина."
              : "Первая продажа отразится здесь — добавьте товары и поделитесь витриной."}
          </div>
        </div>

        <div className="cx-grid2" style=${{ marginTop: "14px" }}>
          <${CxStatTile} icon="box" value=${formatNum(stats.totalProducts)} label="Товаров в каталоге" />
          <${CxStatTile} icon="bag" value=${formatNum(stats.newOrders)} label="Новых заказов" />
          <${CxStatTile} icon="users" value=${formatNum(buildSellerClientsFromOrders(orders).length)} label="Клиентов" />
          <${CxStatTile} icon="tag" value=${formatNum(totalStock)} label="Единиц на складе" />
        </div>

        <div style=${{ marginTop: "22px" }}>
          <${CxSectionHead} title="Последние заказы" action=${recentOrders.length ? "Все" : ""} onAction=${() => navigateToHash("/seller/orders")} />
          ${recentOrders.length
            ? html`<div className="cx-list">
                ${recentOrders.map((order) => {
                  const meta = getSellerOrderStatusMeta(order.status);
                  return html`
                    <div key=${order.id} className="cx-order" style=${{ padding: "13px 15px" }}>
                      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <div style=${{ minWidth: 0 }}>
                          <div className="cx-order-id" style=${{ fontSize: "14px" }}>${order.customerName || "Клиент"}</div>
                          <div className="cx-order-time">${order.id} · ${formatRuDate(order.date)}</div>
                        </div>
                        <div style=${{ textAlign: "right", flexShrink: 0 }}>
                          <div className="cx-order-total" style=${{ fontSize: "15px" }}>${formatNum(order.amount)} <span>TJS</span></div>
                          <${CxPill} tone=${orderPillTone(meta.id)}>${meta.label}</${CxPill}>
                        </div>
                      </div>
                    </div>
                  `;
                })}
              </div>`
            : html`<div className="cx-empty-card">
                <div className="cx-empty-ico"><${Icon} name="bag" size=${22} color="var(--cx-faint)" /></div>
                <div style=${{ fontSize: "14px", fontWeight: 700, marginTop: "12px" }}>Заказов пока нет</div>
                <div style=${{ fontSize: "12.5px", color: "var(--cx-dim)", marginTop: "4px" }}>Появятся, как только купят товар</div>
              </div>`}
        </div>

        <div style=${{ marginTop: "22px", paddingBottom: "8px" }}>
          <${CxSectionHead} title="Уведомления" />
          <div className="cx-list">
            ${notifList.map((n) => {
              const accent = n.tone === "accent" || /зарегистр|опубликов|заказ/i.test(n.title || "");
              return html`
                <div key=${n.id} className="cx-notif">
                  <div className=${`cx-notif-ico ${accent ? "is-accent" : ""}`}>
                    <${Icon} name=${n.icon || "box"} size=${18} color=${accent ? "var(--cx-link)" : "var(--cx-dim)"} />
                  </div>
                  <div style=${{ flex: 1, minWidth: 0 }}>
                    <div className="cx-notif-title">${n.title}</div>
                    <div className="cx-notif-sub">${n.body || n.sub || ""}</div>
                  </div>
                  ${n.time ? html`<span className="cx-notif-time">${n.time}</span>` : null}
                </div>
              `;
            })}
          </div>
        </div>
      </${CxShell}>
    `;
  }

  // ── Экран 2: Товары ──────────────────────────────────────────────────
  function ProductRow({ product, onEdit, onDelete }) {
    const categoryMeta = getSellerProductCategoryMeta(product.categoryId);
    const statusMeta = sellerProductStatusOptions.find((s) => s.id === product.status) || sellerProductStatusOptions[0];
    const tone = statusMeta.id === "active" ? "accent" : statusMeta.id === "archived" ? "neutral" : "warn";
    return html`
      <div className="cx-prow">
        ${isImageLogo(product.image)
          ? html`<img className="cx-prow-img" src=${product.image} alt=${product.title} />`
          : html`<div className="cx-prow-img">${storeAvatarText({ name: product.title })}</div>`}
        <div style=${{ flex: 1, minWidth: 0 }}>
          <div style=${{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <span className="cx-prow-title">${product.title}</span>
            <${CxPill} tone=${tone} dot=${product.status === "active"}>${statusMeta.label}</${CxPill}>
          </div>
          <div className="cx-prow-meta">${categoryMeta?.name || product.category || "Запчасти"} · ${product.sku || "—"}</div>
          <div style=${{ display: "flex", alignItems: "center", gap: "14px", marginTop: "11px" }}>
            <span className="cx-prow-price">${formatNum(product.price)} <span>TJS</span></span>
            <span className="cx-prow-stock">${formatNum(product.stockQty)} шт.</span>
            <span style=${{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              <button type="button" className="cx-sq-btn" onClick=${() => onEdit(product)} aria-label="Изменить">
                <${Icon} name="edit" size=${16} />
              </button>
              <button type="button" className="cx-sq-btn is-danger" onClick=${() => onDelete(product)} aria-label="Удалить">
                <${Icon} name="trash" size=${16} color="var(--cx-danger)" />
              </button>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  function SellerProductsScreen({ currentUser, store, products, onDeleteProduct }) {
    const toast = useToast();
    const [query, setQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [pendingDelete, setPendingDelete] = useState(null);
    const safeProducts = Array.isArray(products) ? products : [];

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return safeProducts.filter((p) => {
        if (activeFilter === "instock" && !(Number(p.stockQty) > 0)) return false;
        if (activeFilter === "sale" && !(p.oldPrice && Number(p.oldPrice) > Number(p.price))) return false;
        if (!q) return true;
        return `${p.title} ${p.brand} ${p.sku} ${p.category}`.toLowerCase().includes(q);
      });
    }, [safeProducts, query, activeFilter]);

    const handleEdit = useCallback((product) => navigateToHash(`/seller/products/${product.id}/edit`), []);
    const confirmDelete = useCallback(async () => {
      const product = pendingDelete;
      setPendingDelete(null);
      if (!product) return;
      try {
        await onDeleteProduct(product.id);
        toast.push("Товар удалён");
      } catch (e) {
        toast.push(e?.message || "Не удалось удалить товар");
      }
    }, [pendingDelete, onDeleteProduct, toast]);

    const filters = [
      { id: "all", label: "Все" },
      { id: "instock", label: "В наличии" },
      { id: "sale", label: "Акция" }
    ];

    return html`
      <${CxShell} nav="products" fab=${true}>
        <div style=${{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 className="cx-h1">Товары</h1>
            <div className="cx-screen-sub">${safeProducts.length} ${pluralize(safeProducts.length, "позиция", "позиции", "позиций")} в каталоге</div>
          </div>
          <button type="button" className="cx-icon-btn" onClick=${() => toast.push("Фильтры скоро будут расширены")}>
            <${Icon} name="sliders" size=${19} />
          </button>
        </div>

        <div className="cx-search" style=${{ marginTop: "16px" }}>
          <${Icon} name="search" size=${18} color="var(--cx-faint)" />
          <input
            placeholder="Название, бренд, SKU…"
            value=${query}
            onInput=${(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="cx-chips" style=${{ marginTop: "12px" }}>
          ${filters.map((f) => html`
            <button
              key=${f.id}
              type="button"
              className=${`cx-chip ${activeFilter === f.id ? "is-active" : ""}`}
              onClick=${() => setActiveFilter(f.id)}
            >${f.label}</button>
          `)}
        </div>

        <div className="cx-scroll-area" style=${{ marginTop: "16px" }}>
          ${filtered.length
            ? html`<div className="cx-list">
                ${filtered.map((p) => html`<${ProductRow} key=${p.id} product=${p} onEdit=${handleEdit} onDelete=${setPendingDelete} />`)}
                <div className="cx-list-end">Это все товары</div>
              </div>`
            : html`<div className="cx-empty-center">
                <div className="cx-empty-badge"><${Icon} name="box" size=${32} color="var(--cx-faint)" /></div>
                <div className="cx-empty-title">${safeProducts.length ? "Ничего не найдено" : "Товаров пока нет"}</div>
                <div className="cx-empty-sub">${safeProducts.length ? "Измените поиск или фильтр." : "Нажмите «+», чтобы добавить первый товар в каталог."}</div>
                ${!safeProducts.length ? html`<button type="button" className="cx-ghost-btn" style=${{ marginTop: "18px" }} onClick=${() => navigateToHash("/seller/products/new")}>
                  <${Icon} name="plus" size=${17} color="var(--cx-link)" />Добавить товар
                </button>` : null}
              </div>`}
        </div>

        ${pendingDelete
          ? html`<${ConfirmSheet}
              title="Удалить товар?"
              message=${`«${pendingDelete.title}» исчезнет из каталога и маркетплейса.`}
              confirmLabel="Удалить"
              onConfirm=${confirmDelete}
              onCancel=${() => setPendingDelete(null)}
            />`
          : null}
      </${CxShell}>
    `;
  }

  function pluralize(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
  }

  // Боттом-шит подтверждения
  function ConfirmSheet({ title, message, confirmLabel, onConfirm, onCancel }) {
    return html`
      <div
        style=${{ position: "fixed", inset: 0, maxWidth: "480px", margin: "0 auto", zIndex: 40, background: "rgba(2,6,23,0.6)", display: "flex", alignItems: "flex-end" }}
        onClick=${onCancel}
      >
        <div
          style=${{ width: "100%", background: "var(--cx-card)", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", border: "1px solid var(--cx-border)", padding: "22px 20px calc(22px + env(safe-area-inset-bottom, 0))" }}
          onClick=${(e) => e.stopPropagation()}
        >
          <div style=${{ fontSize: "18px", fontWeight: 800, color: "var(--cx-text)" }}>${title}</div>
          <div style=${{ fontSize: "14px", color: "var(--cx-dim)", marginTop: "8px", lineHeight: 1.5 }}>${message}</div>
          <div style=${{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button type="button" className="cx-secondary-btn" style=${{ flex: 1 }} onClick=${onCancel}>Отмена</button>
            <button type="button" className="cx-primary-btn" style=${{ flex: 1, background: "linear-gradient(95deg, #ef4444, #b91c1c)", boxShadow: "none" }} onClick=${onConfirm}>${confirmLabel}</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Экран 3: Заказы ──────────────────────────────────────────────────
  // Недавно сменённые заказы → вспышка (модульная карта переживает ре-рендер/ремоунт)
  const orderFlashAt = new Map();
  function isOrderFlashing(orderId) {
    const ts = orderFlashAt.get(orderId);
    return Boolean(ts) && Date.now() - ts < 1200;
  }

  function OrderCard({ order, onUpdateStatus, orderChats }) {
    const justFlash = isOrderFlashing(order.id);
    const meta = getSellerOrderStatusMeta(order.status);
    const allowed = getAllowedSellerOrderStatuses(order).filter((s) => s.id !== order.status && s.id !== "cancelled");
    const cancelOption = getAllowedSellerOrderStatuses(order).find((s) => s.id === "cancelled" && order.status !== "cancelled");
    const items = Array.isArray(order.items) ? order.items.filter(Boolean) : [];
    const itemsCount = items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0);
    const unread = getOrderChatUnreadCount(orderChats, order.id, "seller");
    const isFinal = order.status === "completed" || order.status === "cancelled";

    return html`
      <div className=${`cx-order ${justFlash ? "is-flash" : ""}`} data-order-id=${order.id}>
        <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
          <div style=${{ minWidth: 0 }}>
            <div className="cx-order-id">${order.id}</div>
            <div className="cx-order-time">Заказан ${formatOrderWhen(order)} · ${order.deliveryMethod || "Доставка"}</div>
          </div>
          <${CxPill} tone=${orderPillTone(meta.id)}>${meta.label}</${CxPill}>
        </div>

        <div className="cx-order-cust">${order.customerName || "Клиент"} · ${order.customerPhone || ""}</div>

        <!-- Состав заказа: что заказали -->
        <div className="cx-order-goods">
          <div className="cx-order-goods-head">
            <span>Состав заказа</span>
            <span>${itemsCount} ${pluralize(itemsCount, "товар", "товара", "товаров")}</span>
          </div>
          ${items.length
            ? items.map((it, i) => html`
                <div key=${i} className="cx-order-good">
                  <span className="cx-order-good-name">${it.title} ${Number(it.qty) > 1 ? html`<b>× ${it.qty}</b>` : ""}</span>
                  <span className="cx-order-good-price">${formatTjs((Number(it.qty) || 1) * (Number(it.price) || 0))}</span>
                </div>
              `)
            : html`<div className="cx-order-good-empty">Состав не сохранён</div>`}
        </div>

        <div style=${{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
          <span className="cx-order-total">Итого: ${formatNum(order.amount)} <span>TJS</span></span>
          ${order.address ? html`<span style=${{ fontSize: "12px", color: "var(--cx-faint)", textAlign: "right", maxWidth: "52%" }}>${order.address}</span>` : null}
        </div>

        <!-- Действия: статусы + чат -->
        <div className="cx-order-actions">
          ${allowed.map((s) => html`
            <button
              key=${s.id}
              type="button"
              className="cx-status-btn is-next"
              onClick=${() => onUpdateStatus(order.id, s.id)}
            >${s.label}</button>
          `)}
          <a href=${`#${getSellerOrderChatPath(order.id)}`} className="cx-chat-btn">
            <${Icon} name="bell" size=${15} color="var(--cx-link)" />
            Чат
            ${unread ? html`<span className="cx-chat-badge">${unread}</span>` : null}
          </a>
          ${!isFinal && cancelOption
            ? html`<button type="button" className="cx-status-btn cx-cancel-btn" onClick=${() => onUpdateStatus(order.id, "cancelled")}>Отменить</button>`
            : null}
        </div>
      </div>
    `;
  }

  function SellerOrdersScreen({ currentUser, store, orders, orderChats, onUpdateOrderStatus }) {
    const toast = useToast();
    const [statusFilter, setStatusFilter] = useState("all");
    const [, forceTick] = useState(0);
    const safeOrders = Array.isArray(orders) ? orders : [];

    const monthRevenue = useMemo(
      () => safeOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (Number(o.amount) || 0), 0),
      [safeOrders]
    );
    const activeCount = useMemo(
      () => safeOrders.filter((o) => !["completed", "cancelled"].includes(o.status)).length,
      [safeOrders]
    );

    const chips = [
      { id: "all", label: "Все" },
      { id: "new", label: "Новые" },
      { id: "confirmed", label: "В сборке" },
      { id: "delivery", label: "В доставке" },
      { id: "completed", label: "Готово" }
    ];
    const filtered = useMemo(() => {
      if (statusFilter === "all") return safeOrders;
      if (statusFilter === "confirmed") return safeOrders.filter((o) => ["confirmed", "pickup_ready"].includes(o.status));
      if (statusFilter === "completed") return safeOrders.filter((o) => o.status === "completed");
      return safeOrders.filter((o) => o.status === statusFilter);
    }, [safeOrders, statusFilter]);

    const handleUpdate = useCallback(async (orderId, status) => {
      // Метим ДО await — ре-рендер от смены статуса сразу применит вспышку
      orderFlashAt.set(orderId, Date.now());
      forceTick((t) => t + 1);
      window.setTimeout(() => { orderFlashAt.delete(orderId); forceTick((t) => t + 1); }, 1250);
      try {
        await onUpdateOrderStatus(orderId, status);
        const meta = getSellerOrderStatusMeta(status);
        toast.push(`Статус: ${meta.label}`);
      } catch (e) {
        orderFlashAt.delete(orderId);
        toast.push(e?.message || "Не удалось обновить заказ");
      }
    }, [onUpdateOrderStatus, toast]);

    return html`
      <${CxShell} nav="orders">
        <h1 className="cx-h1">Заказы</h1>
        <div className="cx-screen-sub">Меняйте статусы и следите за суммой</div>

        <div className="cx-chips" style=${{ marginTop: "16px" }}>
          ${chips.map((c) => html`
            <button
              key=${c.id}
              type="button"
              className=${`cx-chip ${statusFilter === c.id ? "is-active" : ""}`}
              onClick=${() => setStatusFilter(c.id)}
            >${c.label}</button>
          `)}
        </div>

        <div className="cx-grid2" style=${{ marginTop: "16px" }}>
          <${CxStatTile} icon="bag" value=${formatNum(activeCount)} label="Активных заказов" />
          <${CxStatTile} icon="coin" value=${`${formatNum(monthRevenue)} TJS`} label="Сумма за месяц" />
        </div>

        ${filtered.length
          ? html`<div className="cx-scroll-area" style=${{ marginTop: "16px" }}>
              <div className="cx-list">
                ${filtered.map((o) => html`<${OrderCard} key=${o.id} order=${o} onUpdateStatus=${handleUpdate} orderChats=${orderChats} />`)}
                <div className="cx-list-end">Это все заказы</div>
              </div>
            </div>`
          : html`<div className="cx-empty-center">
              <div className="cx-empty-badge"><${Icon} name="bag" size=${32} color="var(--cx-faint)" /></div>
              <div className="cx-empty-title">Заказов пока нет</div>
              <div className="cx-empty-sub">Когда покупатель оформит товар, заказ появится здесь — с покупателем, суммой и статусом</div>
              <button type="button" className="cx-ghost-btn" style=${{ marginTop: "20px" }} onClick=${() => navigateToHash("/seller/products")}>
                <${Icon} name="box" size=${17} color="var(--cx-link)" />Поделиться витриной
              </button>
            </div>`}
      </${CxShell}>
    `;
  }

  // ── Экран 4: Клиенты ─────────────────────────────────────────────────
  function ClientRow({ client }) {
    const initials = String(client.name || "К").replace(/[^A-Za-zА-Яа-яЁё0-9]/g, "").slice(0, 2).toUpperCase() || "К";
    return html`
      <div className="cx-client">
        <div className="cx-client-ava">${initials}</div>
        <div style=${{ flex: 1, minWidth: 0 }}>
          <div className="cx-client-name">${client.name}</div>
          <div className="cx-client-phone">${client.phone || "Телефон не указан"}</div>
        </div>
        <div style=${{ textAlign: "right", flexShrink: 0 }}>
          <div className="cx-client-total">${formatNum(client.totalAmount)} <span>TJS</span></div>
          <div className="cx-client-orders">${client.ordersCount} ${pluralize(client.ordersCount, "заказ", "заказа", "заказов")}</div>
        </div>
      </div>
    `;
  }

  function SellerClientsScreen({ currentUser, store, orders }) {
    const [query, setQuery] = useState("");
    const clients = useMemo(() => buildSellerClientsFromOrders(orders), [orders]);
    const stats = useMemo(() => ({
      total: clients.length,
      repeat: clients.filter((c) => c.ordersCount > 1).length,
      revenue: clients.reduce((s, c) => s + (Number(c.totalAmount) || 0), 0)
    }), [clients]);
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return clients;
      return clients.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q));
    }, [clients, query]);

    return html`
      <${CxShell} nav="clients">
        <h1 className="cx-h1">Клиенты</h1>
        <div className="cx-screen-sub">База формируется из заказов автоматически</div>

        <div className="cx-grid3" style=${{ marginTop: "18px" }}>
          <${CxMiniStat} icon="users" value=${formatNum(stats.total)} label="Клиентов" />
          <${CxMiniStat} icon="star" value=${formatNum(stats.repeat)} label="Повторных" />
          <${CxMiniStat} icon="coin" value=${formatNum(stats.revenue)} label="Сумма, TJS" />
        </div>

        <div className="cx-search" style=${{ marginTop: "16px" }}>
          <${Icon} name="search" size=${18} color="var(--cx-faint)" />
          <input placeholder="Имя или телефон…" value=${query} onInput=${(e) => setQuery(e.target.value)} />
        </div>

        ${filtered.length
          ? html`<div className="cx-scroll-area" style=${{ marginTop: "16px" }}>
              <div className="cx-list">
                ${filtered.map((c) => html`<${ClientRow} key=${c.id} client=${c} />`)}
              </div>
            </div>`
          : html`<div className="cx-empty-center">
              <div className="cx-empty-badge"><${Icon} name="users" size=${32} color="var(--cx-faint)" /></div>
              <div className="cx-empty-title">${clients.length ? "Никого не нашли" : "Клиентов пока нет"}</div>
              <div className="cx-empty-sub">${clients.length ? "Измените поисковый запрос." : "Как только покупатель оформит заказ, он появится в этой базе"}</div>
            </div>`}
      </${CxShell}>
    `;
  }

  // ── Экран 5: Добавить / редактировать товар ──────────────────────────
  const ADD_DRAFT_KEY = "drivex.seller.product.draft.v1";

  // Совместимость из полей формы: пусто → универсальный товар
  function buildCompatFromForm(form) {
    const parseList = (v) => String(v || "").split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    const brands = parseList(form.compatBrands);
    const models = parseList(form.compatModels);
    const yearFrom = Math.floor(Number(form.compatYearFrom));
    const yearTo = Math.floor(Number(form.compatYearTo));
    const hasFrom = Number.isFinite(yearFrom) && yearFrom > 1950;
    const hasTo = Number.isFinite(yearTo) && yearTo > 1950;
    const years = hasFrom ? [yearFrom, hasTo && yearTo >= yearFrom ? yearTo : new Date().getFullYear()] : [];
    if (!brands.length && !models.length && !years.length) {
      return { universal: true, brands: [], models: [], years: [] };
    }
    return { universal: false, brands, models, years };
  }

  function makeFormState(product, store) {
    const factory = (DX.screens && DX.screens.createSellerProductFormState) || DX.createSellerProductFormState;
    const base = factory
      ? factory(product, store?.id)
      : {
          id: product?.id, title: product?.title || "", categoryId: product?.categoryId || "parts",
          price: String(product?.price || ""), oldPrice: product?.oldPrice ? String(product.oldPrice) : "",
          stockQty: String(product?.stockQty || 0), description: product?.description || "",
          brand: product?.brand || "", sku: product?.sku || "", badge: product?.badge || "",
          image: product?.image || "", deliveryAvailable: Boolean(product?.deliveryAvailable),
          status: product?.status || "active",
          compatBrands: "", compatModels: "", compatYearFrom: "", compatYearTo: ""
        };
    return base;
  }

  function SellerProductEditorScreen({ mode = "new", currentUser, store, product, onSaveProduct }) {
    const toast = useToast();
    const isEdit = mode === "edit";
    const [form, setForm] = useState(() => {
      if (!isEdit) {
        try {
          const raw = window.localStorage ? window.localStorage.getItem(ADD_DRAFT_KEY) : null;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") return { ...makeFormState(null, store), ...parsed };
          }
        } catch { /* ignore */ }
      }
      return makeFormState(product, store);
    });
    const [submitting, setSubmitting] = useState(false);
    const [compatOpen, setCompatOpen] = useState(() =>
      Boolean(form.compatBrands || form.compatModels || form.compatYearFrom)
    );
    const [touched, setTouched] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
      if (isEdit) setForm(makeFormState(product, store));
    }, [product?.id, store?.id, isEdit]);

    // Автосохранение черновика (только для нового товара)
    useEffect(() => {
      if (isEdit) return;
      try { window.localStorage && window.localStorage.setItem(ADD_DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
    }, [form, isEdit]);

    const set = useCallback((patch) => setForm((prev) => ({ ...prev, ...patch })), []);

    const errors = useMemo(() => {
      const e = {};
      if (!String(form.title).trim()) e.title = "Введите название";
      if (!(Number(form.price) > 0)) e.price = "Цена больше 0";
      if (Number(form.stockQty) < 0 || form.stockQty === "") e.stockQty = "Остаток ≥ 0";
      return e;
    }, [form.title, form.price, form.stockQty]);
    const isValid = Object.keys(errors).length === 0;

    const handlePhoto = useCallback(async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        const client = window.__DRIVEX_SUPABASE_SELLER_CLIENT__ || (DX.getSupabaseClient && DX.getSupabaseClient());
        const cfg = window.DRIVEX_SUPABASE_CONFIG || {};
        const bucket = (cfg.buckets && cfg.buckets.productImages) || "product-images";
        if (client) {
          const storeId = store?.id || "store";
          const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
          const path = `${storeId}/${Date.now()}.${ext}`;
          const { error } = await client.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
          if (!error) {
            const { data } = client.storage.from(bucket).getPublicUrl(path);
            set({ image: data.publicUrl });
            toast.push("Фото загружено");
            return;
          }
        }
        const dataUrl = DX.prepareDocumentDataUrl ? await DX.prepareDocumentDataUrl(file, { maxSize: 1200, quality: 0.85 }) : "";
        if (dataUrl) { set({ image: dataUrl }); toast.push("Фото добавлено"); }
        else toast.push("Не удалось обработать фото");
      } catch {
        toast.push("Файл не подходит");
      }
    }, [store?.id, set, toast]);

    const handleClose = useCallback(() => {
      navigateToHash(isEdit ? "/seller/products" : "/seller");
    }, [isEdit]);

    const handleSave = useCallback(async () => {
      setTouched(true);
      if (!isValid) { toast.push("Заполните обязательные поля"); return; }
      const compatibility = buildCompatFromForm(form);
      const payload = (DX.normalizeSellerProduct || ((x) => x))(
        {
          ...(product || {}),
          id: isEdit && product ? product.id : undefined,
          storeId: store?.id,
          title: form.title, categoryId: form.categoryId, price: form.price, oldPrice: form.oldPrice,
          stockQty: form.stockQty, description: form.description, brand: form.brand, sku: form.sku,
          badge: form.badge, image: form.image, deliveryAvailable: form.deliveryAvailable, status: form.status,
          compatibility
        },
        store?.id
      );
      try {
        setSubmitting(true);
        await onSaveProduct(payload);
        if (!isEdit) { try { window.localStorage && window.localStorage.removeItem(ADD_DRAFT_KEY); } catch { /* ignore */ } }
        toast.push(isEdit ? "Товар обновлён" : "Товар опубликован");
        navigateToHash("/seller/products");
      } catch (e) {
        toast.push(e?.message || "Не удалось сохранить товар");
      } finally {
        setSubmitting(false);
      }
    }, [form, isValid, isEdit, product, store?.id, onSaveProduct, toast]);

    const categoryOptions = (marketCategories || []).filter((c) => c.id !== "all");
    const photoIsImg = isImageLogo(form.image);

    return html`
      <div className="cx cx-modal">
        <div className="cx-modal-head">
          <button type="button" className="cx-icon-btn" style=${{ width: "38px", height: "38px", borderRadius: "12px" }} onClick=${handleClose}>
            <${Icon} name="close" size=${18} />
          </button>
          <span className="cx-modal-title">${isEdit ? "Редактировать товар" : "Новый товар"}</span>
          <span className="cx-modal-tag">${isEdit ? "" : "Черновик"}</span>
        </div>

        <div className="cx-modal-body">
          <div style=${{ marginTop: "20px", display: "flex", gap: "14px", alignItems: "center" }}>
            ${photoIsImg
              ? html`<img className="cx-photo-box" src=${form.image} alt="Фото товара" />`
              : html`<div className="cx-photo-box">DX</div>`}
            <div style=${{ flex: 1 }}>
              <div style=${{ fontSize: "14.5px", fontWeight: 700 }}>Фото товара</div>
              <div style=${{ fontSize: "12.5px", color: "var(--cx-dim)", marginTop: "2px", lineHeight: 1.4 }}>Квадрат, до 5 МБ. Хорошее фото повышает продажи.</div>
              <button type="button" className="cx-upload-btn" onClick=${() => fileRef.current && fileRef.current.click()}>
                <${Icon} name="image" size=${15} color="var(--cx-link)" />Загрузить
              </button>
              <input ref=${fileRef} type="file" accept="image/*" style=${{ display: "none" }} onChange=${handlePhoto} />
            </div>
          </div>

          <div className="cx-form-section">
            <div className="cx-form-section-title">Основное</div>
            <div className="cx-form-rows">
              <${CxFormField} label="Название товара" value=${form.title} placeholder="Например, Тормозные колодки"
                error=${touched ? errors.title : ""} onInput=${(v) => set({ title: v })} />
              <div className="cx-grid2">
                <${CxFormSelect} label="Категория" value=${form.categoryId} onChange=${(v) => set({ categoryId: v })}
                  options=${categoryOptions.map((c) => ({ value: c.id, label: c.name }))} />
                <${CxFormSelect} label="Статус" value=${form.status} onChange=${(v) => set({ status: v })}
                  options=${sellerProductStatusOptions.map((s) => ({ value: s.id, label: s.label }))} />
              </div>
              <${CxFormField} label="Бренд" value=${form.brand} placeholder="Bosch, KYB…" onInput=${(v) => set({ brand: v })} />
            </div>
          </div>

          <div className="cx-form-section">
            <div className="cx-form-section-title">Цена и склад</div>
            <div className="cx-form-rows">
              <div className="cx-grid2">
                <${CxFormField} label="Цена, TJS" type="number" value=${form.price} placeholder="0"
                  error=${touched ? errors.price : ""} onInput=${(v) => set({ price: v })} />
                <${CxFormField} label="Старая цена" hint="необяз." type="number" value=${form.oldPrice} placeholder="—" onInput=${(v) => set({ oldPrice: v })} />
              </div>
              <div className="cx-grid2">
                <${CxFormField} label="Остаток, шт." type="number" value=${form.stockQty} placeholder="0"
                  error=${touched ? errors.stockQty : ""} onInput=${(v) => set({ stockQty: v })} />
                <${CxFormSelect} label="Доставка" value=${form.deliveryAvailable ? "yes" : "no"} onChange=${(v) => set({ deliveryAvailable: v === "yes" })}
                  options=${[{ value: "yes", label: "Есть" }, { value: "no", label: "Самовывоз" }]} />
              </div>
              <${CxFormField} label="SKU / артикул" value=${form.sku} placeholder="DX-0001" onInput=${(v) => set({ sku: v })} />
            </div>
          </div>

          <div className="cx-collapse" onClick=${() => setCompatOpen((v) => !v)}>
            <div>
              <div className="cx-collapse-title">Совместимость с авто</div>
              <div className="cx-collapse-sub">Марка, модель, годы — необязательно</div>
            </div>
            <span className=${`cx-collapse-chev ${compatOpen ? "is-open" : ""}`}><${Icon} name="chev" size=${18} color="var(--cx-faint)" /></span>
          </div>
          ${compatOpen
            ? html`<div className="cx-collapse-body cx-form-rows">
                <${CxFormField} label="Марки авто" hint="через запятую" value=${form.compatBrands} placeholder="Toyota, BMW" onInput=${(v) => set({ compatBrands: v })} />
                <${CxFormField} label="Модели" hint="необяз." value=${form.compatModels} placeholder="Camry, Corolla" onInput=${(v) => set({ compatModels: v })} />
                <div className="cx-grid2">
                  <${CxFormField} label="Годы: с" type="number" value=${form.compatYearFrom} placeholder="2005" onInput=${(v) => set({ compatYearFrom: v })} />
                  <${CxFormField} label="Годы: по" type="number" value=${form.compatYearTo} placeholder="2024" onInput=${(v) => set({ compatYearTo: v })} />
                </div>
              </div>`
            : null}

          <div className="cx-form-section">
            <div className="cx-form-section-title">Описание</div>
            <div className="cx-form-rows">
              <textarea
                className="cx-textarea"
                placeholder="Коротко о товаре — что это, для чего, особенности…"
                value=${form.description}
                onInput=${(e) => set({ description: e.target.value })}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="cx-modal-foot">
          <button type="button" className="cx-secondary-btn" style=${{ width: "110px" }} onClick=${handleClose}>Отмена</button>
          <button type="button" className="cx-primary-btn" style=${{ flex: 1 }} disabled=${submitting || !isValid} onClick=${handleSave}>
            <${Icon} name="check" size=${18} color="#fff" sw=${2.2} />${submitting ? "Сохраняем…" : "Сохранить товар"}
          </button>
        </div>
      </div>
    `;
  }

  function CxFormField({ label, value, placeholder, hint, type = "text", error, onInput }) {
    return html`
      <div className="cx-field">
        <div className="cx-field-head">
          <label className="cx-field-label">${label}</label>
          ${hint ? html`<span className="cx-field-hint">${hint}</span>` : null}
        </div>
        <div className=${`cx-field-box ${error ? "is-error" : ""}`}>
          <input
            className="cx-input"
            type=${type}
            inputMode=${type === "number" ? "decimal" : "text"}
            placeholder=${placeholder || ""}
            value=${value == null ? "" : value}
            onInput=${(e) => onInput(e.target.value)}
          />
        </div>
        ${error ? html`<span className="cx-field-err">${error}</span>` : null}
      </div>
    `;
  }

  function CxFormSelect({ label, value, options, onChange }) {
    return html`
      <div className="cx-field">
        <div className="cx-field-head"><label className="cx-field-label">${label}</label></div>
        <div className="cx-field-box">
          <select className="cx-input cx-select" value=${value} onChange=${(e) => onChange(e.target.value)}>
            ${(options || []).map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
          </select>
          <${Icon} name="chevD" size=${14} color="var(--cx-dim)" />
        </div>
      </div>
    `;
  }

  // ── Экспорт: переопределяем экраны кабинета ──────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.SellerDashboardScreen = SellerDashboardScreen;
  DX.screens.SellerProductsScreen = SellerProductsScreen;
  DX.screens.SellerOrdersScreen = SellerOrdersScreen;
  DX.screens.SellerClientsScreen = SellerClientsScreen;
  DX.screens.SellerProductEditorScreen = SellerProductEditorScreen;
})();
