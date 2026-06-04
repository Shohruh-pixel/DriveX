// app/screens/seller-dashboard.js
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

  DX.screens = DX.screens || {};
  DX.screens.SellerProductsScreen = SellerProductsScreen;
  DX.screens.SellerProductEditorScreen = SellerProductEditorScreen;
  DX.screens.OrderChatSummaryCard = OrderChatSummaryCard;
})();

