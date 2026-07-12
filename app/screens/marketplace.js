// Marketplace + Cart + Product
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

  // ── Кросс-файловые компоненты ──────────────────────────────────────
  const MemoProductGrid = function(p){ var F=(window.DX.screens||{}).MemoProductGrid; return F ? React.createElement(F, p) : null; };
  const MemoProductCard = function(p){ var F=(window.DX.screens||{}).MemoProductCard; return F ? React.createElement(F, p) : null; };
  const MarketStoreAvatar = function(p){ var F=(window.DX.screens||{}).MarketStoreAvatar; return F ? React.createElement(F, p) : null; };
  const ProductCard     = function(p){ var F=(window.DX.screens||{}).ProductCard; return F ? React.createElement(F, p) : null; };
  const OrderStatusTimeline= function(p){ var F=(window.DX.screens||{}).OrderStatusTimeline||window.DX.OrderStatusTimeline; return F?F(p):null; };
  const OrderChatSummaryCard=function(p){ var F=(window.DX.screens||{}).OrderChatSummaryCard; return F ? React.createElement(F, p) : null; };

  function ServiceDetailScreen({ serviceId, serviceDirectory }) {
    const runtimeServices =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item));
    const service = runtimeServices.find((item) => String(item.id) === String(serviceId)) || null;
    const toast = useToast();
    const [isSaved, setIsSaved] = useState(false);

    if (!service) {
      return html`
        <${SimplePage} title="Сервис не найден" backPath="/services">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Попробуйте открыть другой сервис.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const fallbackImage =
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
    const heroImage = service.image || service.coverImage || fallbackImage;
    const serviceRenderKey = `${String(service.id || "service")}:${heroImage.length}:${heroImage.slice(-24)}`;
    const gallery = Array.from(new Set([heroImage, ...(Array.isArray(service.gallery) ? service.gallery.filter(Boolean) : [])]))
      .filter(Boolean)
      .slice(0, 6);
    const masters = Array.isArray(service.masters) ? service.masters.filter(Boolean).slice(0, 6) : [];
    const ratingValue = Number.isFinite(Number(service.smartRating || service.rating))
      ? Number(service.smartRating || service.rating).toFixed(1)
      : "4.8";
    const reviewCount = Math.max(0, Math.round(Number(service.reviews) || 0));
    const distanceLabel = String(service.distance || "1.2 км").trim();
    const travelMinutes = (() => {
      const normalized = distanceLabel.replace(",", ".").toLowerCase();
      if (normalized.includes("м") && !normalized.includes("км")) return 5;
      const numeric = parseFloat(normalized);
      if (!Number.isFinite(numeric) || numeric <= 0) return 5;
      return Math.max(5, Math.round(numeric * 4.2));
    })();
    const locationMeta = [service.type || service.category || "СТО", distanceLabel, service.city || "Худжанд"]
      .filter(Boolean)
      .join(" • ");
    const shortAddress = [service.city, service.address || service.locationLabel].filter(Boolean).join(", ");
    const workingHours = String(service.workingHours || "").trim();
    // Честная доступность — по графику работы, а не выдуманное «Свободно сейчас»
    const hoursRange = parseServiceWorkingHoursRange(workingHours);
    const endTime = hoursRange.endTime || "18:00";
    const startTime = hoursRange.startTime || "08:00";
    const availability = (() => {
      if (service.available === false) return { label: "Временно не работает", color: "var(--drivex-danger)" };
      const now = new Date();
      const minutesNow = now.getHours() * 60 + now.getMinutes();
      const toMin = (t) => { const m = String(t).match(/(\d{1,2}):(\d{2})/); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
      const start = toMin(startTime);
      const end = toMin(endTime);
      if (start !== null && end !== null && (minutesNow < start || minutesNow >= end)) {
        return { label: `Закрыто • откроется в ${startTime}`, color: "var(--drivex-warning)" };
      }
      return { label: `Открыто до ${endTime}`, color: "var(--drivex-success)" };
    })();
    // Честные метрики: без выдуманных цен, процентов и «клиентов в месяц».
    const returnRate = Math.round(Number(service.repeatClientsPercent) || 0);
    const completedCarsCount = Math.max(0, Math.round(Number(service.completedCars) || 0));
    const trustChips = [
      ...(service.isRegisteredCenter
        ? [{ id: "verified", label: "Проверено DRIVEX", color: "var(--drivex-neon-cyan)" }]
        : []),
      ...(completedCarsCount > 0
        ? [{ id: "completed", label: `${completedCarsCount} выполненных работ`, color: "var(--drivex-electric-blue)" }]
        : [{ id: "new", label: "Новый сервис на DRIVEX", color: "var(--drivex-electric-blue)" }])
    ];
    const summaryMetrics = [
      {
        id: "rating",
        icon: "star",
        value: reviewCount > 0 ? ratingValue : "—",
        label: reviewCount > 0 ? "рейтинг" : "нет отзывов",
        color: "var(--drivex-warning)"
      },
      { id: "boxes", icon: "wrench", value: String(Number(service.boxesCount) || 1), label: "боксов", color: "var(--drivex-electric-blue)" },
      { id: "price", icon: "coins", value: "по запросу", label: "цены работ", color: "var(--drivex-warning)" },
      {
        id: "repeat",
        icon: "repeat",
        value: returnRate > 0 ? `${returnRate}%` : "—",
        label: "возвращаются",
        color: "var(--drivex-success)"
      }
    ];
    // Реальный прайс-лист сервиса (заполняется владельцем в CRM → Настройки →
    // «Услуги и цены»). Если сервис его ещё не заполнил — показываем типовые
    // работы категории как ориентир, честно помечая, что цену назовёт сервис.
    const ownPriceList = Array.isArray(service.priceList) ? service.priceList.filter(Boolean) : [];
    const hasOwnPriceList = ownPriceList.length > 0;
    const servicesList = hasOwnPriceList
      ? ownPriceList
      : (() => {
          const typeLabel = `${service.type || ""} ${service.category || ""}`.toLowerCase();
          if (typeLabel.includes("детейл")) {
            return [
              { id: "wash", title: "Комплексная мойка" },
              { id: "salon", title: "Химчистка салона" },
              { id: "polish", title: "Полировка кузова" },
              { id: "coat", title: "Защитное покрытие" }
            ];
          }
          if (typeLabel.includes("шин")) {
            return [
              { id: "tires", title: "Комплект шиномонтажа" },
              { id: "balance", title: "Балансировка" },
              { id: "repair", title: "Ремонт прокола" },
              { id: "storage", title: "Сезонная замена" }
            ];
          }
          return [
            { id: "oil", title: "Замена масла" },
            { id: "diag", title: "Диагностика" },
            { id: "brakes", title: "Проверка тормозов" },
            { id: "suspension", title: "Ходовая и подвеска" }
          ];
        })();
    const messageHref = (() => {
      const safePhone = String(service.phone || "").trim().replace(/[^\d+]/g, "");
      return safePhone ? `sms:${safePhone}` : "";
    })();

    return html`
      <div className="min-h-screen" style=${{ background: "var(--drivex-black)", paddingBottom: "112px" }}>
        <div className="relative h-[292px] overflow-hidden">
          <img key=${serviceRenderKey} src=${heroImage} alt=${service.name} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style=${{
              background:
                "linear-gradient(180deg, rgba(2, 6, 23, 0.08) 0%, rgba(2, 6, 23, 0.36) 30%, rgba(2, 6, 23, 0.88) 100%)"
            }}
          ></div>
          <div
            className="absolute inset-x-0 top-0 h-32"
            style=${{ background: "linear-gradient(180deg, rgba(2, 6, 23, 0.72) 0%, rgba(2, 6, 23, 0) 100%)" }}
          ></div>

          <div className="absolute inset-x-0 top-0 px-5 pt-5 flex items-center justify-between">
            <a
              href="#/services"
              className="dx-hero-icon-btn"
              aria-label="Назад к сервисам"
            >
              <${Icon} name="chevron-left" size=${20} />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className=${`dx-hero-icon-btn ${isSaved ? "is-active" : ""}`}
                onClick=${() => {
                  const next = !isSaved;
                  setIsSaved(next);
                  toast.push(next ? "Сервис сохранён" : "Сервис убран из избранного");
                }}
                aria-label=${isSaved ? "Убрать из избранного" : "Сохранить сервис"}
              >
                <${Icon} name="star" size=${18} />
              </button>
              <button
                type="button"
                className="dx-hero-icon-btn"
                onClick=${async () => {
                  const shareLink = `${window.location.href.split("#")[0]}#/service/${service.id}`;
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(shareLink);
                      toast.push("Ссылка на сервис скопирована");
                    } else {
                      toast.push("Копирование недоступно");
                    }
                  } catch (error) {
                    toast.push("Не удалось скопировать ссылку");
                  }
                }}
                aria-label="Поделиться сервисом"
              >
                <${Icon} name="copy" size=${18} />
              </button>
            </div>
          </div>

          <div className="absolute left-5 top-20 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold" style=${{
              background: alphaBg(availability.color, 0.18),
              color: availability.color,
              border: `1px solid ${alphaBg(availability.color, 0.28)}`,
              backdropFilter: "blur(10px)"
            }}>
              <span className="w-2 h-2 rounded-full" style=${{ background: availability.color }}></span>
              ${availability.label}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
            <h1 className="text-[30px] leading-tight font-bold" style=${{ color: "var(--drivex-white)" }}>
              ${service.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-sm">
              ${reviewCount > 0
                ? html`<span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-warning)" }}>
                    <${Icon} name="star" size=${14} />
                    ${ratingValue} • ${reviewCount} ${pluralize(reviewCount, "отзыв", "отзыва", "отзывов")}
                  </span>`
                : html`<span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-light-silver)" }}>
                    Новый сервис — отзывов пока нет
                  </span>`}
              <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-light-silver)" }}>
                <${Icon} name="map" size=${14} />
                ${[service.city, service.locationLabel].filter(Boolean).join(" • ") || distanceLabel}
              </span>
            </div>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
              ${locationMeta}
            </p>
          </div>
        </div>

        <div className="relative z-10 -mt-10 px-5 space-y-4">
          <div className="space-y-3">
            <button
              type="button"
              className="w-full text-left"
              style=${{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                minHeight: "60px",
                padding: "0 18px 0 20px",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 52%, #0284c7 100%)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(186, 230, 253, 0.18)",
                boxShadow: "0 18px 36px rgba(14, 165, 233, 0.28)"
              }}
              onClick=${() => navigateToHash(getServiceBookingPath(service.id))}
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em]" style=${{ color: "rgba(224, 242, 254, 0.82)" }}>
                  Онлайн запись
                </span>
                <span className="block text-[18px] font-semibold leading-none mt-1">
                  Записаться сейчас
                </span>
              </span>
              <span
                className="w-9 h-9 rounded-full inline-flex items-center justify-center flex-shrink-0"
                style=${{
                  background: "rgba(255, 255, 255, 0.18)",
                  color: "var(--drivex-white)",
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14)"
                }}
              >
                <${Icon} name="chevron-right" size=${18} />
              </span>
            </button>
            <div className="flex flex-wrap gap-2">
              ${trustChips.map((chip) => html`
                <span
                  key=${chip.id}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style=${{
                    background: alphaBg(chip.color, 0.16),
                    color: chip.color,
                    border: `1px solid ${alphaBg(chip.color, 0.22)}`
                  }}
                >
                  ${chip.label}
                </span>
              `)}
            </div>
          </div>

          <section
            className="rounded-[28px] p-5"
            style=${{
              background: "linear-gradient(145deg, rgba(13, 23, 39, 0.98) 0%, rgba(16, 27, 46, 0.96) 100%)",
              border: "1px solid rgba(6, 182, 212, 0.12)",
              boxShadow: "0 22px 50px rgba(0, 0, 0, 0.24)"
            }}
          >
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px]" style=${{ background: "rgba(148, 163, 184, 0.14)" }}>
              ${summaryMetrics.map((item) => html`
                <div key=${item.id} className="p-4" style=${{ background: "rgba(11, 18, 32, 0.96)" }}>
                  <span className="inline-flex items-center gap-2 text-xs font-medium" style=${{ color: item.color }}>
                    <${Icon} name=${item.icon} size=${14} />
                    ${item.label}
                  </span>
                  <p className="text-[20px] font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                    ${item.value}
                  </p>
                </div>
              `)}
            </div>
          </section>

          <section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div className="mb-4">
              <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                Услуги
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Популярные работы сервиса без лишнего шума
              </p>
            </div>
            <div className="space-y-3">
              ${servicesList.map((item) => html`
                <div
                  key=${item.id}
                  className="rounded-[22px] p-4 flex items-center gap-3"
                  style=${{ background: "rgba(255, 255, 255, 0.035)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      ${item.title}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${hasOwnPriceList
                        ? [
                            Number(item.price) > 0 ? formatTjsPrice(item.price) : "цена по запросу",
                            Number(item.durationMinutes) > 0 ? `${item.durationMinutes} мин` : ""
                          ].filter(Boolean).join(" • ")
                        : "Цену и время уточнит сервис при записи"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-full text-sm font-semibold flex-shrink-0"
                    style=${{
                      background: "rgba(14, 165, 233, 0.14)",
                      color: "var(--drivex-electric-blue)",
                      border: "1px solid rgba(14, 165, 233, 0.2)"
                    }}
                    onClick=${() => navigateToHash(getServiceBookingPath(service.id))}
                  >
                    Записаться
                  </button>
                </div>
              `)}
            </div>
          </section>

          ${masters.length
            ? html`<section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div className="mb-4">
                  <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                    Мастера
                  </h2>
                  <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Команда, которой доверяют клиенты
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  ${masters.map((master) => {
                    const initials = String(master.name || "DX")
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase();
                    return html`<div
                      key=${master.id || master.name}
                      className="w-40 flex-shrink-0 rounded-[24px] p-4"
                      style=${{ background: "rgba(255, 255, 255, 0.035)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold"
                        style=${{
                          background: "linear-gradient(145deg, rgba(14, 165, 233, 0.22) 0%, rgba(6, 182, 212, 0.16) 100%)",
                          color: "var(--drivex-white)"
                        }}
                      >
                        ${initials}
                      </div>
                      <p className="font-semibold mt-4" style=${{ color: "var(--drivex-white)" }}>
                        ${master.name}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-light-silver)" }}>
                        ${master.experience || "Опытный мастер"}
                      </p>
                      <p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)", lineHeight: 1.5 }}>
                        ${master.specialty || master.role || "ТО и ремонт"}
                      </p>
                    </div>`;
                  })}
                </div>
              </section>`
            : null}

          ${gallery.length
            ? html`<section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div className="mb-4">
                  <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                    Фото сервиса
                  </h2>
                  <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Живые кадры сервиса и рабочей зоны
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1" style=${{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                  ${gallery.map((photo, index) => html`
                    <div
                      key=${`${service.id}-gallery-${index}`}
                      className="rounded-[22px] overflow-hidden flex-shrink-0"
                      style=${{
                        width: "160px",
                        minWidth: "160px",
                        flex: "0 0 160px",
                        height: "112px",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        background: "rgba(255, 255, 255, 0.03)"
                      }}
                    >
                      <img src=${photo} alt=${`${service.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  `)}
                </div>
              </section>`
            : null}

          <section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style=${{ background: "rgba(14, 165, 233, 0.12)", color: "var(--drivex-electric-blue)" }}
              >
                <${Icon} name="map" size=${18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Локация
                </h2>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)", lineHeight: 1.6 }}>
                  ${shortAddress || "Точка сервиса уже отмечена на карте DRIVEX"}
                </p>
                ${workingHours
                  ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${workingHours}
                    </p>`
                  : null}
              </div>
            </div>
            <button
              type="button"
              className="w-full mt-4 px-4 py-3 rounded-full text-sm font-semibold"
              style=${{
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
              onClick=${() => navigateToHash("/map")}
            >
              Открыть на карте
            </button>
          </section>
        </div>

        <div className="px-5 pt-3 pb-8">
          <div
            className="rounded-[28px] p-3"
            style=${{
              background: "rgba(8, 15, 26, 0.88)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
              backdropFilter: "blur(18px)"
            }}
          >
            <div className="grid gap-3" style=${{ gridTemplateColumns: "0.9fr 1.3fr" }}>
              <button
                type="button"
                className="px-4 py-3.5 rounded-[20px] text-sm font-semibold"
                style=${{
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "var(--drivex-white)",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
                onClick=${() => {
                  if (messageHref) {
                    window.location.href = messageHref;
                    return;
                  }
                  toast.push("У сервиса пока нет номера для сообщения");
                }}
              >
                Написать
              </button>
              <button
                type="button"
                className="px-4 py-3.5 rounded-[20px] text-sm font-semibold dx-btn"
                style=${{ boxShadow: "0 16px 34px rgba(14, 165, 233, 0.22)" }}
                onClick=${() => navigateToHash(getServiceBookingPath(service.id))}
              >
                Записаться
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function MarketStoreScreen({ storeId, onAddToCart }) {
    useMarketRatings(); // подписка: рейтинг магазина обновляется при новых отзывах
    const store = getMarketStore(storeId);
    const storeRating = getMarketStoreRating(storeId);

    if (!store) {
      return html`
        <${SimplePage} title="Магазин не найден" backPath="/market">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Попробуйте открыть другой партнёрский магазин.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const storeProducts = getMarketProductsByStore(store.id);

    return html`
      <${SimplePage} title=${store.name} backPath="/market">
        <div className="px-6 py-6 space-y-4">
          <div
            className="glass-card rounded-3xl p-6"
            style=${{
              background: `linear-gradient(145deg, ${alphaBg(store.accent, 0.28)} 0%, rgba(15, 23, 42, 0.96) 100%)`
            }}
          >
            <div className="flex items-start gap-4">
              <${MarketStoreAvatar} store=${store} size=${56} rounded="18px" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${store.name}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${store.city}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style=${{
                      background: alphaBg(store.accent, 0.18),
                      color: store.accent
                    }}
                  >
                    ${store.deliveryAvailable ? "Есть доставка" : "Самовывоз"}
                  </span>
                </div>

                <p className="text-sm mt-4" style=${{ color: "var(--drivex-light-silver)" }}>
                  ${store.description || store.tagline}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="glass-card-light rounded-2xl p-3">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  Рейтинг
                </p>
                <p className="font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${storeRating.has ? `★ ${storeRating.rating}` : "—"}
                </p>
              </div>
              <div className="glass-card-light rounded-2xl p-3">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  Отзывы
                </p>
                <p className="font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${storeRating.count}
                </p>
              </div>
              <div className="glass-card-light rounded-2xl p-3">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  Товары
                </p>
                <p className="font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${storeProducts.length}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
              Условия магазина
            </p>
            <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
              ${store.deliveryNote}
            </p>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
              Самовывоз: ${store.pickup}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Товары магазина
            </h2>
            <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              ${storeProducts.length} позиций
            </span>
          </div>

          <${MemoProductGrid}
            products=${storeProducts}
            onAddToCart=${onAddToCart}
            emptyTitle="У магазина пока нет товаров"
          />
        </div>
      </${SimplePage}>
    `;
  }

  // ── Отзывы о товаре: список + форма (Supabase + серверный fallback) ──
  function MarketReviewStars({ value, size = 14, onSelect }) {
    return html`
      <div className="flex items-center gap-1">
        ${[1, 2, 3, 4, 5].map((star) => html`
          <button
            key=${star}
            type="button"
            disabled=${!onSelect}
            onClick=${onSelect ? () => onSelect(star) : undefined}
            style=${{
              color: star <= value ? "var(--drivex-warning)" : "rgba(148, 163, 184, 0.35)",
              cursor: onSelect ? "pointer" : "default",
              background: "none",
              border: "none",
              padding: onSelect ? "0.15rem" : "0"
            }}
            aria-label=${onSelect ? `Оценка ${star}` : undefined}
          >
            <${Icon} name="star" size=${size} />
          </button>
        `)}
      </div>
    `;
  }

  // Покупал ли пользователь этот товар (для бейджа «Проверенная покупка»)
  function hasBoughtProduct(buyerOrders, product) {
    const productId = normalizeMarketProductId(product && product.id);
    const productTitle = String(product?.name || product?.title || "").trim().toLowerCase();
    return (Array.isArray(buyerOrders) ? buyerOrders : []).some((order) => {
      if (!order || order.status === "cancelled") return false;
      return (Array.isArray(order.items) ? order.items : []).some((item) => {
        if (!item) return false;
        if (productId && normalizeMarketProductId(item.productId) === productId) return true;
        const itemTitle = String(item.title || "").trim().toLowerCase();
        return Boolean(productTitle && itemTitle && itemTitle === productTitle);
      });
    });
  }

  function MarketReviewsSection({ product, buyerOrders }) {
    const toast = useToast();
    const productKey = String(product.id);
    const isVerifiedBuyer = useMemo(
      () => hasBoughtProduct(buyerOrders, product),
      [buyerOrders, product]
    );
    const [reviews, setReviews] = useState(null); // null = загрузка
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      let cancelled = false;
      // Смена товара — сбрасываем форму (имя оставляем: это тот же пользователь)
      setReviews(null);
      setRating(5);
      setComment("");
      const api = window.DrivexMarketReviews;
      if (!api) {
        setReviews([]);
        return undefined;
      }
      api
        .loadProductReviews(productKey)
        .then((list) => {
          if (cancelled) return;
          setReviews(list);
          // Реальная оценка — сразу во все карточки каталога
          marketRatingsStore.set(productKey, api.summarizeReviews(list));
        })
        .catch(() => {
          if (!cancelled) setReviews([]);
        });
      return () => {
        cancelled = true;
      };
    }, [productKey]);

    const summary = useMemo(() => {
      const api = window.DrivexMarketReviews;
      if (api && Array.isArray(reviews) && reviews.length) {
        return api.summarizeReviews(reviews);
      }
      return { count: 0, rating: 0 };
    }, [reviews]);

    const handleSubmit = async () => {
      const api = window.DrivexMarketReviews;
      if (!api) {
        toast.push("Отзывы недоступны без сервера");
        return;
      }
      try {
        setSubmitting(true);
        const review = await api.addProductReview({
          productId: productKey,
          rating,
          comment,
          authorName,
          verified: isVerifiedBuyer
        });
        setReviews((prev) => {
          const nextList = [review, ...(prev || []).filter((item) => item.id !== review.id)];
          marketRatingsStore.set(productKey, api.summarizeReviews(nextList));
          return nextList;
        });
        setComment("");
        toast.push("Спасибо за отзыв!");
      } catch (error) {
        toast.push(error?.message || "Не удалось сохранить отзыв");
      } finally {
        setSubmitting(false);
      }
    };

    const formatReviewDate = (value) => {
      const parsed = Date.parse(value);
      if (Number.isNaN(parsed)) return "";
      return new Date(parsed).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    };

    return html`
      <div className="glass-card-light rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
            Отзывы
          </h2>
          ${summary.count
            ? html`<div className="flex items-center gap-2 text-sm" style=${{ color: "var(--drivex-warning)" }}>
                <${Icon} name="star" size=${14} />
                ${summary.rating}
                <span style=${{ color: "var(--drivex-silver)" }}>· ${summary.count}</span>
              </div>`
            : null}
        </div>

        ${reviews === null
          ? html`<p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)" }}>Загружаем отзывы…</p>`
          : reviews.length
            ? html`<div className="space-y-3 mt-4">
                ${reviews.map((review) => html`
                  <div key=${review.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold text-sm truncate" style=${{ color: "var(--drivex-white)" }}>
                          ${review.authorName}
                        </p>
                        ${review.verified
                          ? html`<span
                              className="px-2 py-0.5 rounded-lg text-xs font-semibold flex-shrink-0"
                              style=${{
                                background: "rgba(34, 197, 94, 0.14)",
                                color: "var(--drivex-success)"
                              }}
                            >
                              ✓ Покупка
                            </span>`
                          : null}
                      </div>
                      <${MarketReviewStars} value=${review.rating} size=${12} />
                    </div>
                    ${review.comment
                      ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)" }}>
                          ${review.comment}
                        </p>`
                      : null}
                    <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${formatReviewDate(review.createdAt)}
                    </p>
                  </div>
                `)}
              </div>`
            : html`<p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)" }}>
                Отзывов пока нет — станьте первым!
              </p>`}

        <div className="glass-card rounded-2xl p-4 mt-4">
          <p className="font-semibold text-sm" style=${{ color: "var(--drivex-white)" }}>
            Оставить отзыв
          </p>
          <div className="mt-3">
            <${MarketReviewStars} value=${rating} size=${22} onSelect=${setRating} />
          </div>
          <input
            className="dx-input w-full mt-3"
            placeholder="Ваше имя (необязательно)"
            value=${authorName}
            maxLength=${60}
            onInput=${(e) => setAuthorName(e.target.value)}
          />
          <textarea
            className="dx-input w-full mt-3"
            rows="3"
            placeholder="Поделитесь впечатлением о товаре"
            value=${comment}
            maxLength=${1200}
            onInput=${(e) => setComment(e.target.value)}
          ></textarea>
          <button
            type="button"
            className="w-full mt-3 py-3 rounded-2xl text-sm font-bold dx-btn"
            disabled=${submitting}
            onClick=${handleSubmit}
          >
            ${submitting ? "Отправляем…" : "Отправить отзыв"}
          </button>
        </div>
      </div>
    `;
  }

  // ── Чат с продавцом до заказа: вопрос о товаре ──────────────────────
  function MarketProductChat({ product, store, orderChats, onSendChatMessage, onMarkChatRead }) {
    const toast = useToast();
    const threadId = getMarketProductQuestionThreadId(store?.id, product?.id);
    const thread = getOrderChatThread(orderChats, threadId);
    const [draft, setDraft] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
      if (threadId && onMarkChatRead) onMarkChatRead(threadId, "buyer");
    }, [onMarkChatRead, threadId, thread.messages.length]);

    useEffect(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ block: "nearest" });
      }
    }, [thread.messages.length]);

    const handleSend = () => {
      const text = draft.trim();
      if (!text) return;
      if (!threadId) {
        toast.push("У товара нет магазина — вопрос задать нельзя");
        return;
      }
      onSendChatMessage && onSendChatMessage(threadId, "buyer", text);
      setDraft("");
    };

    return html`
      <div className="glass-card-light rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
            Вопрос продавцу
          </h2>
          <span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
            ${store?.name || ""}
          </span>
        </div>

        ${thread.messages.length
          ? html`<div
              className="space-y-2 mt-4"
              style=${{ maxHeight: "16rem", overflowY: "auto" }}
            >
              ${thread.messages.map((message) => html`
                <div
                  key=${message.id || message.sentAt}
                  className="flex"
                  style=${{ justifyContent: message.senderRole === "buyer" ? "flex-end" : "flex-start" }}
                >
                  <div
                    className="rounded-2xl px-4 py-2.5 text-sm"
                    style=${{
                      maxWidth: "85%",
                      background:
                        message.senderRole === "buyer"
                          ? "rgba(6, 182, 212, 0.16)"
                          : "var(--glass-bg)",
                      color: "var(--drivex-white)"
                    }}
                  >
                    <p className="text-xs mb-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${message.senderRole === "buyer" ? "Вы" : store?.name || "Продавец"}
                    </p>
                    ${message.text}
                  </div>
                </div>
              `)}
              <div ref=${messagesEndRef}></div>
            </div>`
          : html`<p className="text-sm mt-4" style=${{ color: "var(--drivex-silver)" }}>
              Спросите о наличии, совместимости или доставке — продавец ответит в этом чате.
            </p>`}

        <div className="flex gap-2 mt-4">
          <input
            className="dx-input flex-1"
            placeholder="Ваш вопрос о товаре"
            value=${draft}
            maxLength=${800}
            onInput=${(e) => setDraft(e.target.value)}
            onKeyDown=${(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button
            type="button"
            className="px-4 rounded-2xl text-sm font-bold dx-btn"
            onClick=${handleSend}
          >
            Отправить
          </button>
        </div>
      </div>
    `;
  }

  function ProductDetailScreen({ productId, onAddToCart, buyerOrders, orderChats, onSendChatMessage, onMarkChatRead }) {
    const toast = useToast();
    const [addedPulse, setAddedPulse] = useState(false);
    const addedTimerRef = useRef(null);
    const favorites = useMarketFavorites();
    useMarketRatings(); // подписка: оценка обновляется при новых отзывах
    const [chatOpen, setChatOpen] = useState(false);
    const product = getMarketProduct(productId);
    const favoriteKey = getMarketFavoriteKey(product);
    const isFavorite = favorites.has(favoriteKey);
    const ratingInfo = getMarketProductRating(product);

    useEffect(() => {
      return () => {
        if (addedTimerRef.current) {
          window.clearTimeout(addedTimerRef.current);
        }
      };
    }, []);

    // ВСЕ хуки выше раннего return — иначе при асинхронной загрузке каталога
    // меняется число хуков между рендерами (React #310, белый экран)
    const handleAddToCart = useCallback(() => {
      if (!product) return;
      onAddToCart && onAddToCart(product);
      setAddedPulse(true);
      if (addedTimerRef.current) {
        window.clearTimeout(addedTimerRef.current);
      }
      addedTimerRef.current = window.setTimeout(() => {
        setAddedPulse(false);
        addedTimerRef.current = null;
      }, 1200);
    }, [onAddToCart, product]);

    if (!product) {
      const catalogStillLoading = !marketplaceData.products.length;
      return html`
        <${SimplePage} title=${catalogStillLoading ? "Загружаем товар" : "Товар не найден"} backPath="/market">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              ${catalogStillLoading
                ? "Каталог загружается, секунду…"
                : "Попробуйте открыть другой товар."}
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const store = getMarketStore(product.storeId);
    const badgeBg = getMarketBadgeColor(product);
    const relatedProducts = getRelatedMarketProducts(product, 4);

    return html`
      <${SimplePage} title=${product.name} backPath="/market">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-3xl overflow-hidden">
            <div className="relative h-60 overflow-hidden">
              <img src=${product.image} alt=${product.name} className="w-full h-full object-cover" />
              ${product.badge
                ? html`<div
                    className="absolute top-3 left-3 px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md"
                    style=${{ background: badgeBg, color: "var(--drivex-white)" }}
                  >
                    ${product.badge}
                  </div>`
                : null}
              <button
                type="button"
                className=${`market-ui-fav ${isFavorite ? "is-active" : ""}`}
                style=${{ width: "2.5rem", height: "2.5rem", right: "0.75rem", top: "0.75rem" }}
                onClick=${() => {
                  const added = favorites.toggle(favoriteKey);
                  toast.push(added ? "Добавлено в избранное" : "Убрано из избранного");
                }}
                aria-label=${isFavorite ? "Убрать из избранного" : "В избранное"}
                aria-pressed=${isFavorite ? "true" : "false"}
              >
                <${Icon} name="heart" size=${19} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="px-3 py-1 rounded-xl text-xs font-semibold"
                  style=${{
                    background: alphaBg(
                      marketCategories.find((category) => category.id === product.categoryId)?.color ||
                        "var(--drivex-neon-cyan)",
                      0.18
                    ),
                    color:
                      marketCategories.find((category) => category.id === product.categoryId)?.color ||
                      "var(--drivex-neon-cyan)"
                  }}
                >
                  ${product.category}
                </span>
                <span style=${{ color: "var(--drivex-silver)", fontSize: "12px" }}>
                  ${product.unitLabel}
                </span>
              </div>

              ${product.description
                ? html`<div className="glass-card-light rounded-2xl p-4 mt-4">
                    <p className="font-semibold mb-2" style=${{ color: "var(--drivex-white)" }}>Описание</p>
                    <div style=${{ fontSize: "13.5px", lineHeight: 1.6 }}>
                      ${String(product.description).split(/\n/).map((line, i) => {
                        const t = line.trim();
                        if (!t) return html`<div key=${`sp-${i}`} style=${{ height: "8px" }}></div>`;
                        const isHeader = /:$/.test(t) && t.length <= 42;
                        return html`<p
                          key=${`ln-${i}`}
                          style=${{
                            margin: "0 0 3px",
                            fontWeight: isHeader ? 700 : 400,
                            color: isHeader ? "var(--drivex-white)" : "var(--drivex-light-silver)"
                          }}
                        >${t}</p>`;
                      })}
                    </div>
                  </div>`
                : null}

              ${store
                ? html`<a
                    href=${getMarketStorePath(store.id)}
                    className="glass-card rounded-2xl p-4 mt-4 block"
                    style=${{
                      background: `linear-gradient(145deg, ${alphaBg(store.accent, 0.2)} 0%, rgba(15, 23, 42, 0.9) 100%)`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <${MarketStoreAvatar} store=${store} size=${42} rounded="14px" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style=${{ color: "var(--drivex-white)" }}>
                              ${store.name}
                            </p>
                            <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                              ${store.city}
                            </p>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-xl text-xs font-semibold"
                            style=${{
                              background: alphaBg(store.accent, 0.18),
                              color: store.accent
                            }}
                          >
                            ${store.deliveryAvailable ? "Доставка" : "Самовывоз"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-sm">
                          ${(() => {
                            const storeRating = getMarketStoreRating(store.id);
                            return storeRating.has
                              ? html`<span style=${{ color: "var(--drivex-warning)" }}>
                                    <${Icon} name="star" size=${13} />
                                  </span>
                                  <span style=${{ color: "var(--drivex-warning)" }}>${storeRating.rating}</span>
                                  <span style=${{ color: "var(--drivex-silver)" }}>(${storeRating.count})</span>`
                              : html`<span style=${{ color: "var(--drivex-silver)" }}>Нет отзывов</span>`;
                          })()}
                          <span style=${{ color: "var(--drivex-silver)" }}>• ${product.delivery}</span>
                        </div>
                      </div>
                    </div>
                  </a>`
                : null}

              <div className="flex items-baseline gap-2 mb-3 mt-5">
                <span className="font-bold text-2xl" style=${{ color: "var(--drivex-white)" }}>
                  ${formatTjsPrice(product.price)}
                </span>
                ${product.oldPrice
                  ? html`<span className="text-sm line-through" style=${{ color: "var(--drivex-silver)" }}>
                      ${formatTjsPrice(product.oldPrice)}
                    </span>`
                  : null}
              </div>

              ${ratingInfo.has
                ? html`<div className="flex items-center gap-2 text-sm mb-4" style=${{ color: "var(--drivex-warning)" }}>
                    <${Icon} name="star" size=${14} />
                    ${ratingInfo.rating}
                    <span style=${{ color: "var(--drivex-silver)" }}>
                      (${ratingInfo.count} ${ratingInfo.count === 1 ? "отзыв" : ratingInfo.count < 5 ? "отзыва" : "отзывов"})
                    </span>
                  </div>`
                : html`<div className="flex items-center gap-2 text-sm mb-4" style=${{ color: "var(--drivex-silver)" }}>
                    <${Icon} name="star" size=${14} />
                    Отзывов пока нет
                  </div>`}

              <div className="glass-card rounded-2xl p-4 mb-4">
                <p className="text-sm" style=${{ color: "var(--drivex-light-silver)" }}>
                  Доставка: <span style=${{ color: "var(--drivex-white)" }}>${product.delivery}</span>
                  <br />
                  В наличии: <span style=${{ color: "var(--drivex-white)" }}>
                    ${product.stock ? "Да" : "Нет"}
                  </span>
                  ${store
                    ? html`<span>
                        <br />
                        Самовывоз: <span style=${{ color: "var(--drivex-white)" }}>${store.pickup}</span>
                      </span>`
                    : null}
                </p>
              </div>

              ${(() => {
                const rows = [];
                if (product.brand) rows.push(["Бренд", product.brand]);
                if (product.sku) rows.push(["Артикул", product.sku]);
                if (product.category) rows.push(["Категория", product.category]);
                // доп. характеристики вида "Ключ: значение" (если есть)
                (Array.isArray(product.specs) ? product.specs : []).forEach((spec) => {
                  const str = String(spec);
                  const idx = str.indexOf(":");
                  if (idx > 0) rows.push([str.slice(0, idx).trim(), str.slice(idx + 1).trim()]);
                });
                if (!rows.length) return null;
                return html`<div className="glass-card-light rounded-2xl p-4 mb-4">
                  <p className="font-semibold mb-1" style=${{ color: "var(--drivex-white)" }}>
                    Характеристики
                  </p>
                  <div>
                    ${rows.map(([key, value], i) => html`
                      <div
                        key=${`spec-${i}`}
                        className="flex items-baseline justify-between gap-3"
                        style=${{
                          padding: "9px 0",
                          borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none"
                        }}
                      >
                        <span style=${{ color: "var(--drivex-silver)", fontSize: "13px", flexShrink: 0 }}>${key}</span>
                        <span style=${{ color: "var(--drivex-white)", fontSize: "13px", fontWeight: 600, textAlign: "right" }}>${value}</span>
                      </div>
                    `)}
                  </div>
                </div>`;
              })()}

              ${(() => {
                const compat = normalizeProductCompatibility(product.compatibility);
                if (!compat || compat.universal) {
                  return html`<div className="glass-card rounded-2xl p-4 mb-4">
                    <p className="text-sm" style=${{ color: "var(--drivex-light-silver)" }}>
                      <span style=${{ color: "var(--drivex-success)" }}>✓</span>
                      ${" "}Универсальный товар — подходит для любого автомобиля
                    </p>
                  </div>`;
                }
                return html`<div className="glass-card-light rounded-2xl p-4 mb-4">
                  <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    Подходит для
                  </p>
                  <div className="flex gap-2 flex-wrap mt-3">
                    ${compat.brands.map((brand) => html`
                      <span
                        key=${brand}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style=${{
                          background: "rgba(6, 182, 212, 0.12)",
                          color: "var(--drivex-neon-cyan)"
                        }}
                      >
                        ${brand}
                      </span>
                    `)}
                    ${compat.models.map((model) => html`
                      <span
                        key=${`model-${model}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style=${{
                          background: "var(--glass-bg)",
                          color: "var(--drivex-light-silver)"
                        }}
                      >
                        ${model}
                      </span>
                    `)}
                    ${compat.years.length === 2
                      ? html`<span
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                          style=${{
                            background: "rgba(245, 158, 11, 0.12)",
                            color: "var(--drivex-warning)"
                          }}
                        >
                          ${compat.years[0]}–${compat.years[1]} г.
                        </span>`
                      : null}
                  </div>
                </div>`;
              })()}

              <div className="grid grid-cols-3 gap-3">
                ${store
                  ? html`<a
                      href=${getMarketStorePath(store.id)}
                      className="py-3 rounded-2xl text-center font-semibold"
                      style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                    >
                      Магазин
                    </a>`
                  : html`<div
                      className="py-3 rounded-2xl text-center font-semibold"
                      style=${{ background: "var(--glass-bg)", color: "var(--drivex-silver)" }}
                    >
                      Магазин
                    </div>`}
                <button
                  type="button"
                  className="py-3 rounded-2xl text-sm font-semibold"
                  style=${{ background: "rgba(6, 182, 212, 0.12)", color: "var(--drivex-neon-cyan)" }}
                  onClick=${() => {
                    if (!store) {
                      toast.push("У товара нет магазина — вопрос задать нельзя");
                      return;
                    }
                    setChatOpen(true);
                  }}
                >
                  Написать
                </button>
                <button
                  type="button"
                  className=${`py-3 rounded-2xl text-sm font-bold dx-btn ${addedPulse ? "market-added-btn" : ""}`}
                  onClick=${handleAddToCart}
                >
                  ${addedPulse ? "Добавлено" : "В корзину"}
                </button>
              </div>
            </div>
          </div>

          ${store &&
          (chatOpen ||
            getOrderChatThread(orderChats, getMarketProductQuestionThreadId(store.id, product.id)).messages.length)
            ? html`<${MarketProductChat}
                product=${product}
                store=${store}
                orderChats=${orderChats}
                onSendChatMessage=${onSendChatMessage}
                onMarkChatRead=${onMarkChatRead}
              />`
            : null}

          <${MarketReviewsSection} product=${product} buyerOrders=${buyerOrders} />

          ${relatedProducts.length
            ? html`<div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                      Похожие товары
                    </h2>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      По категории и продавцу
                    </p>
                  </div>
                  <a
                    href="#/market"
                    className="text-sm font-semibold"
                    style=${{ color: "var(--drivex-neon-cyan)" }}
                  >
                    В каталог
                  </a>
                </div>

                <${MemoProductGrid} products=${relatedProducts} onAddToCart=${onAddToCart} />
              </div>`
            : null}
        </div>
      </${SimplePage}>
    `;
  }

  function CategoryScreen({ categoryId, serviceDirectory, activeCarId }) {
    const decodedCategoryId = decodeRouteSegment(categoryId);
    const categoryMeta = getServiceCategoryMeta(decodedCategoryId);
    const servicesSource =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]);
    const allServices = dedupeServicesById(servicesSource).map((item) => decorateServiceRecord(item));
    const personalizedServices = getPersonalizedServices(allServices, activeCarId);
    const filteredServices = dedupeServicesById([
      ...personalizedServices.filter((service) => service.categoryId === categoryMeta.id),
      ...allServices.filter((service) => service.categoryId === categoryMeta.id)
    ]);

    const renderFilteredService = (service) => {
      const meta = [
        service.categoryLabel || service.category,
        service.distance,
        service.city
      ].filter(Boolean).join(" • ");

      return html`
        <a
          key=${`category-service-${service.id}`}
          href=${`#/service/${service.id}`}
          className="services-redesign-card"
          style=${{ textDecoration: "none" }}
        >
          <div className="services-redesign-photo">
            ${service.image
              ? html`<img
                  key=${getServiceImageRenderKey(service)}
                  src=${service.image}
                  alt=${service.name}
                />`
              : html`<span style=${{ color: categoryMeta.color }}><${Icon} name=${categoryMeta.icon} size=${24} /></span>`}
            <b>${categoryMeta.name}</b>
          </div>

          <div className="services-redesign-card-body">
            <div className="services-redesign-card-head">
              <div className="min-w-0">
                <h3>${service.name}</h3>
                <p>${meta || service.address || "Сервис DriveX"}</p>
              </div>
              <span
                className="inline-flex items-center gap-1 text-[13px] font-bold"
                style=${{ color: "var(--drivex-warning)" }}
              >
                <${Icon} name="star" size=${12} />
                ${service.smartRating || service.rating || "4.8"}
              </span>
            </div>

            <div className="services-redesign-meta">
              <span>${service.workingHours || "08:00 — 20:00"}</span>
              <span>${service.reviews || "120+"} отзывов</span>
              <span>${service.boxesCount || 2} бокса</span>
            </div>

            <div className="services-redesign-card-foot">
              <strong>${service.price || "Запись онлайн"}</strong>
              <button
                type="button"
                onClick=${(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  navigateToHash(getServiceBookingPath(service.id));
                }}
              >
                Записаться
              </button>
            </div>
          </div>
        </a>
      `;
    };

    return html`
      <${SimplePage} title=${`Категория: ${categoryMeta.name}`} backPath="/services">
        <div className="px-4 py-5 space-y-4">
          <div
            className="rounded-[24px] p-5"
            style=${{
              background: "linear-gradient(135deg, rgba(9, 30, 47, 0.96), rgba(17, 22, 35, 0.96))",
              border: `1px solid ${alphaBg(categoryMeta.color, 0.24)}`,
              boxShadow: `0 18px 34px ${alphaBg(categoryMeta.color, 0.12)}`
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center rounded-2xl"
                style=${{
                  width: "48px",
                  height: "48px",
                  color: categoryMeta.color,
                  background: alphaBg(categoryMeta.color, 0.16)
                }}
              >
                <${Icon} name=${categoryMeta.icon} size=${22} />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] font-bold" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  Фильтр услуг
                </p>
                <h2 className="text-xl font-black m-0" style=${{ color: "var(--drivex-white)" }}>
                  ${categoryMeta.name}
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed" style=${{ color: "var(--drivex-silver)" }}>
              ${filteredServices.length
                ? `Найдено сервисов: ${filteredServices.length}. Новые сервисы из CRM автоматически попадают сюда и в ленту.`
                : "Пока в этой категории нет подключенных сервисов. Когда сервис добавит такой тип услуги, он появится здесь автоматически."}
            </p>
          </div>

          ${filteredServices.length
            ? html`
                <div className="services-redesign-list">
                  ${filteredServices.map(renderFilteredService)}
                </div>
              `
            : html`
                <div className="glass-card-light rounded-2xl p-5">
                  <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    Нет сервисов в категории «${categoryMeta.name}»
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                    Добавьте сервис с типом «${categoryMeta.name}» через CRM, и он появится в этом фильтре.
                  </p>
                  <a
                    href="#/service-crm"
                    className="inline-flex items-center justify-center mt-4 px-4 py-3 rounded-full text-sm font-bold dx-btn"
                  >
                    Добавить сервис
                  </a>
                </div>
              `}
        </div>
      </${SimplePage}>
    `;
  }

  function NotFoundScreen({ path }) {
    return html`
      <${SimplePage} title="404" backPath="/">
        <div className="px-6 py-6">
          <div className="glass-card-light rounded-2xl p-5">
            <p className="text-sm" style=${{ color: "var(--drivex-white)" }}>
              Страница не найдена:
              <code style=${{ color: "var(--drivex-neon-cyan)" }}>${path}</code>
            </p>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function CartScreen({ items, total, profile, referralBalance = 0, onSetQty, onRemove, onCheckout }) {
    const toast = useToast();
    const storesCount = new Set(items.map((item) => item.storeId).filter(Boolean)).size;
    const [checkoutDraft, setCheckoutDraft] = useState(() => createMarketplaceCheckoutDraft(items, profile));
    const [submitting, setSubmitting] = useState(false); // для вида кнопки
    const submittingRef = useRef(false); // СИНХРОННЫЙ замок: state обновляется асинхронно, быстрые клики проскакивают
    const [useBonus, setUseBonus] = useState(false); // списать реферальные бонусы

    const bonusAvailable = Math.max(0, Number(referralBalance) || 0);
    const bonusApplied = useBonus ? Math.min(bonusAvailable, Number(total) || 0) : 0;
    const payableTotal = Math.max(0, Math.round(((Number(total) || 0) - bonusApplied) * 100) / 100);

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
                        ${items.length} ${pluralize(items.length, "товар", "товара", "товаров")}
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
                                  data-store-address=${storeId}
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
                ${bonusAvailable > 0
                  ? html`<button
                      type="button"
                      onClick=${() => setUseBonus((v) => !v)}
                      className="w-full flex items-center justify-between mb-3 p-3 rounded-2xl"
                      style=${{
                        background: useBonus ? "rgba(16,185,129,0.14)" : "var(--glass-bg)",
                        border: useBonus ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent"
                      }}
                    >
                      <span className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        🎁 Списать бонусы (${bonusAvailable} сомони)
                      </span>
                      <span className="text-sm font-bold" style=${{ color: useBonus ? "var(--drivex-success)" : "var(--drivex-neon-cyan)" }}>
                        ${useBonus ? `−${bonusApplied}` : "Применить"}
                      </span>
                    </button>`
                  : null}
                <div className="flex items-center justify-between mb-3">
                  <span style=${{ color: "var(--drivex-silver)" }}>${bonusApplied > 0 ? "К оплате" : "Итого"}</span>
                  <span className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                    ${bonusApplied > 0
                      ? html`<span style=${{ textDecoration: "line-through", color: "var(--drivex-silver)", fontSize: "14px", marginRight: "8px" }}>${formatTjsPrice(total)}</span>${formatTjsPrice(payableTotal)}`
                      : formatTjsPrice(total)}
                  </span>
                </div>
                <p className="text-xs mb-4" style=${{ color: "var(--drivex-silver)" }}>
                  После оформления продавец увидит выбранный способ получения, адрес доставки или самовывоз и комментарий покупателя.
                </p>
                <button
                  type="button"
                  disabled=${submitting}
                  className="w-full py-4 rounded-2xl font-bold text-lg"
                  style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)", opacity: submitting ? 0.6 : 1, cursor: submitting ? "wait" : "pointer" }}
                  onClick=${async () => {
                    if (submittingRef.current) return; // синхронный замок — блокирует мгновенно, до ре-рендера
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
                      // Прокручиваем к полю адреса и фокусируем — иначе пользователь не понимает,
                      // почему заказ "не оформляется" (для доставки нужен адрес).
                      try {
                        const addrInput = document.querySelector('input[data-store-address="' + missingAddressStore[0] + '"]')
                          || document.querySelector('input[placeholder^="Например: Зарафшон"]');
                        if (addrInput) {
                          addrInput.scrollIntoView({ behavior: "smooth", block: "center" });
                          setTimeout(() => addrInput.focus(), 300);
                        }
                      } catch (e) { /* ignore */ }
                      return;
                    }

                    if (!onCheckout) return;
                    submittingRef.current = true;
                    setSubmitting(true);
                    try {
                      await onCheckout({ ...checkoutDraft, bonusApplied });
                    } finally {
                      submittingRef.current = false;
                      setSubmitting(false);
                    }
                  }}
                >
                  ${submitting ? "Оформляем…" : "Оформить заказ"}
                </button>
              </div>`
            : null}
        </div>
      </${SimplePage}>
    `;
  }


  // ── Export to DX.screens (chain: app-main.js читает отсюда) ──
  DX.screens = DX.screens || {};
  if (typeof CartScreen !== 'undefined') DX.screens['CartScreen'] = CartScreen;
  if (typeof CategoryScreen !== 'undefined') DX.screens['CategoryScreen'] = CategoryScreen;
  if (typeof MarketStoreScreen !== 'undefined') DX.screens['MarketStoreScreen'] = MarketStoreScreen;
  if (typeof NotFoundScreen !== 'undefined') DX.screens['NotFoundScreen'] = NotFoundScreen;
  if (typeof ProductDetailScreen !== 'undefined') DX.screens['ProductDetailScreen'] = ProductDetailScreen;
  if (typeof ServiceDetailScreen !== 'undefined') DX.screens['ServiceDetailScreen'] = ServiceDetailScreen;
})();



