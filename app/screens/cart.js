// cart.js
(() => {
  'use strict';
  const DX = window.DX;
  const html = DX.html;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon = DX.Icon;
  const alphaBg = DX.alphaBg;

  function CartScreen({ items, total, profile, onSetQty, onRemove, onCheckout }) {
    const toast = useToast();
    const storesCount = new Set(items.map((item) => item.storeId).filter(Boolean)).size;
    const [checkoutDraft, setCheckoutDraft] = useState(() => createMarketplaceCheckoutDraft(items, profile));

    useEffect(() => {
      setCheckoutDraft((prev) => syncMarketplaceCheckoutDraft(prev, items, profile));
    }, [items, profile]);

    const groupedItems = useMemo(() => {
      return Object.entries(
        (Array.isArray(items) ? items : []).reduce((acc, item) => {
          const storeId = item.storeId || "unknown-store";
          if (!acc[storeId]) acc[storeId] = [];
          acc[storeId].push(item);
          return acc;
        }, {})
      );
    }, [items]);

    const updateCheckoutField = useCallback((key, value) => {
      setCheckoutDraft((prev) => ({
        ...(prev || createMarketplaceCheckoutDraft(items, profile)),
        [key]: value
      }));
    }, [items, profile]);

    const updateStoreCheckoutField = useCallback((storeId, key, value) => {
      setCheckoutDraft((prev) => {
        const nextDraft = syncMarketplaceCheckoutDraft(prev, items, profile);
        return {
          ...nextDraft,
          deliveryByStore: {
            ...nextDraft.deliveryByStore,
            [storeId]: {
              ...nextDraft.deliveryByStore[storeId],
              [key]: value
            }
          }
        };
      });
    }, [items, profile]);

    return html`
      <${SimplePage} title="Корзина" backPath="/market">
        <div className="px-6 py-6 space-y-4">
          ${items.length === 0
            ? html`<div className="glass-card-light rounded-2xl p-6 text-center">
                <p className="font-semibold mb-2" style=${{ color: "var(--drivex-white)" }}>
                  Корзина пуста
                </p>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Добавьте товары из Маркета.
                </p>
              </div>`
            : html`
                <div className="glass-card rounded-2xl p-5 neon-glow-blue">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                        В корзине
                      </p>
                      <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                        ${items.length} товара
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                        Магазинов
                      </p>
                      <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                        ${storesCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  ${groupedItems.map(([storeId, storeItems]) => {
                    const store = getMarketStore(storeId);
                    const storeSubtotal = storeItems.reduce(
                      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
                      0
                    );

                    return html`
                      <div key=${`cart-group-${storeId}`} className="market-cart-store">
                        <div className="market-cart-store-head">
                          <div className="min-w-0">
                            <h3>${store?.name || storeItems[0]?.storeName || "Магазин DRIVEX"}</h3>
                            <p>${store?.city || "Marketplace"} • ${storeItems.length} поз.</p>
                          </div>
                          <strong>${formatTjsPrice(storeSubtotal)}</strong>
                        </div>

                        <div className="market-cart-items">
                          ${storeItems.map((item) => html`
                            <div key=${`${storeId}-${item.id}`} className="market-cart-item">
                              <img src=${item.image} alt=${item.name} loading="lazy" decoding="async" />

                              <div className="min-w-0 flex-1">
                                <div className="market-cart-item-top">
                                  <div className="min-w-0">
                                    <h4>${item.name}</h4>
                                    <p>${formatTjsPrice(item.price)}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick=${() => onRemove(item.cartKey || item.id, item.storeId)}
                                    aria-label="Удалить"
                                  >
                                    ×
                                  </button>
                                </div>

                                <div className="market-cart-item-bottom">
                                  <div className="market-cart-qty">
                                    <button
                                      type="button"
                                      onClick=${() => onSetQty(item.cartKey || item.id, item.qty - 1, item.storeId)}
                                    >
                                      -
                                    </button>
                                    <span>${item.qty}</span>
                                    <button
                                      type="button"
                                      onClick=${() => onSetQty(item.cartKey || item.id, item.qty + 1, item.storeId)}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <strong>${formatTjsPrice(item.price * item.qty)}</strong>
                                </div>
                              </div>
                            </div>
                          `)}
                        </div>
                      </div>
                    `;
                  })}
                </div>

                <div className="glass-card-light rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        Оформление заказа
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        Покупатель выбирает способ получения, а продавец получает заказ именно в таком виде.
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-semibold"
                      style=${{
                        background: "rgba(14, 165, 233, 0.16)",
                        color: "var(--drivex-electric-blue)"
                      }}
                    >
                      ${storesCount} магазина
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        Имя получателя
                      </span>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl outline-none dx-input mt-2"
                        style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                        value=${checkoutDraft.customerName}
                        onInput=${(e) => updateCheckoutField("customerName", e.target.value)}
                        placeholder="Введите имя"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        Телефон
                      </span>
                      <input
                        type="tel"
                        className="w-full p-3 rounded-xl outline-none dx-input mt-2"
                        style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                        value=${checkoutDraft.customerPhone}
                        onInput=${(e) => updateCheckoutField("customerPhone", e.target.value)}
                        placeholder="+992 00 000 00 00"
                      />
                    </label>
                  </div>

                  <div className="space-y-4 mt-5">
                    ${groupedItems.map(([storeId, storeItems]) => {
                      const store = getMarketStore(storeId);
                      const storeDraft = checkoutDraft.deliveryByStore?.[storeId] || {
                        deliveryMode: store?.deliveryAvailable ? "delivery" : "pickup",
                        address: "",
                        comment: ""
                      };
                      const storeSubtotal = storeItems.reduce(
                        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
                        0
                      );

                      return html`
                        <div key=${storeId} className="glass-card rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                                ${store?.name || "Магазин DRIVEX"}
                              </p>
                              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                                ${storeItems.length} поз. • ${formatTjsPrice(storeSubtotal)}
                              </p>
                            </div>
                            <span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                              ${store?.city || ""}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                              type="button"
                              className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                              style=${{
                                background:
                                  storeDraft.deliveryMode === "pickup"
                                    ? "rgba(14, 165, 233, 0.16)"
                                    : "var(--glass-bg)",
                                color:
                                  storeDraft.deliveryMode === "pickup"
                                    ? "var(--drivex-electric-blue)"
                                    : "var(--drivex-white)",
                                opacity: 1
                              }}
                              onClick=${() => updateStoreCheckoutField(storeId, "deliveryMode", "pickup")}
                            >
                              Самовывоз
                            </button>
                            <button
                              type="button"
                              className="px-4 py-3 rounded-2xl text-sm font-semibold text-left"
                              style=${{
                                background:
                                  storeDraft.deliveryMode === "delivery"
                                    ? "rgba(6, 182, 212, 0.16)"
                                    : "var(--glass-bg)",
                                color:
                                  storeDraft.deliveryMode === "delivery"
                                    ? "var(--drivex-neon-cyan)"
                                    : "var(--drivex-white)",
                                opacity: store?.deliveryAvailable ? 1 : 0.55
                              }}
                              onClick=${() => {
                                if (!store?.deliveryAvailable) {
                                  toast.push("У этого магазина сейчас только самовывоз");
                                  return;
                                }
                                updateStoreCheckoutField(storeId, "deliveryMode", "delivery");
                              }}
                            >
                              Доставка
                            </button>
                          </div>

                          ${storeDraft.deliveryMode === "delivery"
                            ? html`<label className="block mt-4">
                                <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                                  Адрес доставки
                                </span>
                                <input
                                  type="text"
                                  className="w-full p-3 rounded-xl outline-none dx-input mt-2"
                                  style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                                  value=${storeDraft.address}
                                  onInput=${(e) => updateStoreCheckoutField(storeId, "address", e.target.value)}
                                  placeholder="Например: Зарафшон, ул. Сомони 15, кв. 8"
                                />
                              </label>`
                            : html`<div className="glass-card-light rounded-2xl p-4 mt-4">
                                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                                  Адрес самовывоза
                                </p>
                                <p className="text-sm mt-2" style=${{ color: "var(--drivex-white)" }}>
                                  ${store?.pickup || store?.address || "Магазин сообщит адрес самовывоза"}
                                </p>
                              </div>`}

                          <label className="block mt-4">
                            <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                              Комментарий продавцу
                            </span>
                            <textarea
                              className="w-full p-3 rounded-xl outline-none dx-input mt-2"
                              style=${{
                                background: "var(--glass-bg)",
                                color: "var(--drivex-white)",
                                minHeight: "88px"
                              }}
                              value=${storeDraft.comment}
                              onInput=${(e) => updateStoreCheckoutField(storeId, "comment", e.target.value)}
                              placeholder="Например: позвоните перед доставкой"
                            ></textarea>
                          </label>
                        </div>
                      `;
                    })}
                  </div>
                </div>
              `}

          ${items.length > 0
            ? html`<div className="glass-card rounded-2xl p-5 neon-glow-blue">
                <div className="flex items-center justify-between mb-3">
                  <span style=${{ color: "var(--drivex-silver)" }}>Итого</span>
                  <span className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                    ${formatTjsPrice(total)}
                  </span>
                </div>
                <p className="text-xs mb-4" style=${{ color: "var(--drivex-silver)" }}>
                  После оформления продавец увидит выбранный способ получения, адрес доставки или самовывоз и комментарий покупателя.
                </p>
                <button
                  type="button"
                  className="w-full py-4 rounded-2xl font-bold text-lg"
                  style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
                  onClick=${() => {
                    if (!items.length) {
                      toast.push("Корзина пуста");
                      return;
                    }
                    if (!checkoutDraft.customerName.trim()) {
                      toast.push("Введите имя получателя");
                      return;
                    }
                    if (!checkoutDraft.customerPhone.trim()) {
                      toast.push("Введите телефон");
                      return;
                    }

                    const missingAddressStore = groupedItems.find(([storeId]) => {
                      const storeDraft = checkoutDraft.deliveryByStore?.[storeId];
                      return storeDraft?.deliveryMode === "delivery" && !String(storeDraft.address || "").trim();
                    });
                    if (missingAddressStore) {
                      const store = getMarketStore(missingAddressStore[0]);
                      toast.push(`Введите адрес доставки для ${store?.name || "магазина"}`);
                      return;
                    }

                    onCheckout && onCheckout(checkoutDraft);
                  }}
                >
                  Оформить заказ
                </button>
              </div>`
            : null}
        </div>
      </${SimplePage}>
    `;
  }

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

  // ── Экспорт в DX.screens для app.js ──────────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.CartScreen = CartScreen;
  DX.screens.createSellerProductFormState = createSellerProductFormState;
  DX.screens.createSellerStoreFormState = createSellerStoreFormState;
  DX.screens.SellerLogo = SellerLogo;
  DX.screens.SellerField = SellerField;
  DX.screens.SellerInput = SellerInput;
  DX.screens.SellerTextarea = SellerTextarea;
  DX.screens.SellerSelect = SellerSelect;
  DX.screens.SellerLayout = SellerLayout;
  DX.screens.SellerMetricCard = SellerMetricCard;
})();
