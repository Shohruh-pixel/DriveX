// market.js
(() => {
  'use strict';
  const DX = window.DX;
  // AppContext helpers для доступа к state когда не в замыкании app.js
  const useAppCtx = (window.DX && window.DX.useAppCtx) ? window.DX.useAppCtx : function() { return window.DX && window.DX._appState ? window.DX._appState : {}; };
  const getCtx = function() { return (window.DX && window.DX._appState) || {}; };
  const html = DX.html;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon = DX.Icon;
  const alphaBg = DX.alphaBg;

  function MarketScreen({ cartCount, onAddToCart }) {
    return html`<${MarketplacePage} cartCount=${cartCount} onAddToCart=${onAddToCart} />`;
  }

  function MarketCatalogScreen({ cartCount, onAddToCart }) {
    const [query, setQuery] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState("all");

    const filteredProducts = useMemo(() => {
      return filterMarketProducts(marketplaceData.products, {
        query,
        categoryId: activeCategoryId
      });
    }, [activeCategoryId, query]);

    return html`
      <div className="market-ui-page">
        <${MarketTopBar}
          title="Каталог"
          subtitle="Список категорий и фильтры"
          cartCount=${cartCount}
          backPath="/market"
          compact=${true}
        />
        <main className="market-ui-content">
          <${SearchBar}
            value=${query}
            onChange=${setQuery}
            onToggleFilters=${() => setActiveCategoryId("all")}
            filtersCount=${activeCategoryId !== "all" ? 1 : 0}
          />
          <${MarketAppNav} active="catalog" cartCount=${cartCount} />
          <div className="market-ui-catalog-list">
            ${marketCategories
              .filter((category) => category.id !== "all")
              .map((category) => {
                const isActive = activeCategoryId === category.id;
                const productsCount = marketplaceData.products.filter((product) => product.categoryId === category.id).length;
                return html`
                  <button
                    key=${category.id}
                    type="button"
                    className=${`market-ui-catalog-row ${isActive ? "is-active" : ""}`}
                    style=${{ "--market-accent": category.color }}
                    onClick=${() => setActiveCategoryId(isActive ? "all" : category.id)}
                  >
                    <span><${Icon} name=${category.icon} size=${18} /></span>
                    <b>${category.name}</b>
                    <small>${productsCount}</small>
                  </button>
                `;
              })}
          </div>

          <${MarketSectionTitle}
            title=${activeCategoryId === "all" ? "Все товары" : marketCategories.find((item) => item.id === activeCategoryId)?.name}
          />
          <${MemoProductGrid}
            products=${filteredProducts}
            onAddToCart=${onAddToCart}
            emptyTitle="В категории пока нет товаров"
          />
        </main>
      </div>
    `;
  }

  function MarketAutoPickerScreen({ cartCount, onAddToCart }) {
    const [mode, setMode] = useState("car");
    const [brand, setBrand] = useState("BMW");
    const [model, setModel] = useState("X5 (F15)");
    const [year, setYear] = useState("2019");
    const [modification, setModification] = useState("xDrive 30d 3.0d");
    const activeCar = garageCars[0] || null;
    const selectedProducts = useMemo(() => {
      return marketplaceData.products
        .filter((product) => ["oil", "parts", "battery"].includes(product.categoryId))
        .slice(0, 6);
    }, []);

    return html`
      <div className="market-ui-page">
        <${MarketTopBar}
          title="Подбор по авто"
          subtitle="По авто или VIN"
          cartCount=${cartCount}
          backPath="/market"
          compact=${true}
        />
        <main className="market-ui-content">
          <${MarketAppNav} active="auto" cartCount=${cartCount} />
          <div className="market-ui-mode-switch">
            <button type="button" className=${mode === "car" ? "is-active" : ""} onClick=${() => setMode("car")}>
              По авто
            </button>
            <button type="button" className=${mode === "vin" ? "is-active" : ""} onClick=${() => setMode("vin")}>
              По VIN
            </button>
          </div>

          ${mode === "car"
            ? html`
                <div className="market-ui-form-list">
                  ${[
                    ["Марка", brand, setBrand, ["BMW", "Toyota", "Mercedes-Benz"]],
                    ["Модель", model, setModel, ["X5 (F15)", "Camry", "E-Class"]],
                    ["Год выпуска", year, setYear, ["2019", "2021", "2018"]],
                    ["Модификация", modification, setModification, ["xDrive 30d 3.0d", "2.5 Hybrid", "2.0 бензин"]]
                  ].map(([label, value, setter, options]) => html`
                    <label key=${label} className="market-ui-select">
                      <span>${label}</span>
                      <select value=${value} onInput=${(event) => setter(event.target.value)}>
                        ${options.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                      </select>
                    </label>
                  `)}
                </div>
                <button type="button" className="market-ui-primary-btn">Показать запчасти</button>
              `
            : html`
                <div className="market-ui-filter-panel">
                  <label className="market-ui-select">
                    <span>VIN</span>
                    <input className="dx-input" placeholder="Введите VIN" />
                  </label>
                  <button type="button" className="market-ui-primary-btn">Проверить VIN</button>
                </div>
              `}

          <div className="market-ui-car-preview">
            <img
              src="./assets/marketplace/bmw-x5.jpg"
              alt="BMW X5"
              loading="eager"
              decoding="async"
            />
          </div>

          <${MarketSectionTitle} title="Сохранённые авто" />
          <div className="market-ui-saved-cars">
            <button type="button">
              <b>${activeCar?.brand || "BMW"} ${activeCar?.model || "X5"}</b>
              <span>${activeCar?.year || "2019"}</span>
            </button>
            <button type="button">
              <b>Toyota Camry</b>
              <span>2021</span>
            </button>
          </div>

          <${MarketSectionTitle} title="Подходящие товары" />
          <${MemoProductGrid} products=${selectedProducts} onAddToCart=${onAddToCart} />
        </main>
      </div>
    `;
  }

  function MarketOrdersScreen({ orders, orderChats, cartCount }) {
    const safeOrders = normalizeBuyerOrdersList(orders);

    return html`
      <div className="market-ui-page">
        <${MarketTopBar}
          title="Заказы"
          subtitle="Статусы и история покупок"
          cartCount=${cartCount}
          backPath="/market"
          compact=${true}
        />
        <main className="market-ui-content">
          <${MarketAppNav} active="orders" cartCount=${cartCount} />
          ${safeOrders.length
            ? safeOrders.map((order) => html`
                <div key=${order.id} className="market-ui-order-card">
                  <div className="market-ui-order-head">
                    <div className="min-w-0">
                      <h3>${order.id}</h3>
                      <p>${formatRuDate(order.date)} • ${order.storeName}</p>
                    </div>
                    <span style=${{ color: order.statusColor, background: alphaBg(order.statusColor, 0.14) }}>
                      ${order.statusLabel}
                    </span>
                  </div>

                  <div className="market-ui-order-items">
                    ${order.items.map((item) => html`
                      <div key=${`${order.id}-${item.title}`}>
                        <p>${item.title} × ${item.qty}</p>
                        <b>${formatTjsPrice((Number(item.qty) || 0) * (Number(item.price) || 0))}</b>
                      </div>
                    `)}
                  </div>

                  <div className="market-ui-order-foot">
                    <div>
                      <p>${order.deliveryMethod}</p>
                      <small>${order.address || "Адрес будет подтверждён продавцом"}</small>
                    </div>
                    <strong>${formatTjsPrice(order.amount)}</strong>
                  </div>

                  <${OrderChatSummaryCard}
                    order=${order}
                    orderChats=${orderChats}
                    viewerRole="buyer"
                    actionLabel="Написать"
                    actionPath=${getBuyerOrderChatPath(order.id)}
                  />
                </div>
              `)
            : html`
                <div className="market-ui-filter-panel">
                  <div className="text-center">
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      Заказов пока нет
                    </p>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      После оформления покупки заказ появится здесь.
                    </p>
                    <a href="#/market" className="inline-flex mt-4 market-ui-primary-btn">
                      Открыть маркет
                    </a>
                  </div>
                </div>
              `}
        </main>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────────
  // BuyerAuthScreen — многошаговый вход/регистрация
  // Шаги: role → phone → otp → profile → car

  // ── Экспорт в DX.screens для app.js ──────────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.MarketScreen = MarketScreen;
  DX.screens.MarketCatalogScreen = MarketCatalogScreen;
  DX.screens.MarketAutoPickerScreen = MarketAutoPickerScreen;
  DX.screens.MarketOrdersScreen = MarketOrdersScreen;
})();
