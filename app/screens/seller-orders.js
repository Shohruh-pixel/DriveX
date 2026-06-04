// app/screens/seller-orders.js
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


  DX.screens = DX.screens || {};
  DX.screens.SellerNotFoundScreen = SellerNotFoundScreen;
})();

