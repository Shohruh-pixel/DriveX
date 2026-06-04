// app/screens/seller-store.js
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

            <form
              className="rounded-full p-2"
              onSubmit=${handleSubmit}
              style=${{
                background: "rgba(12, 15, 22, 0.97)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                boxShadow: "0 12px 28px rgba(0, 0, 0, 0.12)"
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style=${{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    color: "var(--drivex-silver)"
                  }}
                >
                  <${Icon} name="smile" size=${20} />
                </div>
                <div
                  className="flex-1 rounded-full px-5 py-3.5"
                  style=${{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.04)"
                  }}
                >
                  <textarea
                    rows="1"
                    value=${draftMessage}
                    onInput=${(event) => setDraftMessage(event.target.value)}
                    placeholder=${safeViewerRole === "seller" ? "Ответить покупателю..." : "Написать продавцу..."}
                    className="w-full outline-none dx-input"
                    style=${{
                      color: "var(--drivex-white)",
                      minHeight: "26px",
                      maxHeight: "120px",
                      resize: "none",
                      background: "transparent",
                      padding: 0,
                      lineHeight: 1.45
                    }}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="px-8 h-14 rounded-full text-sm font-semibold whitespace-nowrap"
                  disabled=${!draftMessage.trim()}
                  style=${{
                    background: draftMessage.trim()
                      ? "linear-gradient(135deg, rgba(6, 182, 212, 0.92) 0%, rgba(8, 145, 178, 0.96) 100%)"
                      : "linear-gradient(135deg, rgba(6, 182, 212, 0.48) 0%, rgba(8, 145, 178, 0.54) 100%)",
                    color: "var(--drivex-white)",
                    border: "1px solid rgba(6, 182, 212, 0.22)",
                    opacity: draftMessage.trim() ? 1 : 0.6,
                    boxShadow: draftMessage.trim() ? "0 14px 30px rgba(6, 182, 212, 0.16)" : "none"
                  }}
                >
                  Отправить
                </button>
              </div>
            </form>
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

  DX.screens = DX.screens || {};
  DX.screens.OrderChatScreen = OrderChatScreen;
  DX.screens.SellerOrdersScreen = SellerOrdersScreen;
  DX.screens.SellerStoreSettingsScreen = SellerStoreSettingsScreen;
})();

