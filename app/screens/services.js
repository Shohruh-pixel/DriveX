// Services + ServiceDetail
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

  // ── Кросс-файловые компоненты (читаются из DX при рендере) ──────────
  const ServicePhoneButton = function(p){ var F=(window.DX.screens||{}).ServicePhoneButton; return F ? React.createElement(F, p) : null; };
  const ServiceStatusChip  = function(p){ var F=(window.DX.screens||{}).ServiceStatusChip; return F ? React.createElement(F, p) : null; };
  const ServiceCrmLayout   = function(p){ var F=(window.DX.screens||{}).ServiceCrmLayout;   return F?F(p):(p.children||null); };
  const SellerField        = function(p){ var F=(window.DX.screens||{}).SellerField;        return F?F(p):(p.children||null); };
  const SellerInput        = function(p){ var F=(window.DX.screens||{}).SellerInput; return F ? React.createElement(F, p) : null; };
  const SellerSelect       = function(p){ var F=(window.DX.screens||{}).SellerSelect; return F ? React.createElement(F, p) : null; };
  const SellerTextarea     = function(p){ var F=(window.DX.screens||{}).SellerTextarea; return F ? React.createElement(F, p) : null; };
  const OrderStatusTimeline= function(p){ var F=(window.DX.screens||{}).OrderStatusTimeline||window.DX.OrderStatusTimeline; return F?F(p):null; };

  function ServicesScreen({ serviceDirectory, activeCarId, serviceCrmReady = false, serviceCenterName = "" }) {
    const toast = useToast();
    const [serviceSearchQuery, setServiceSearchQuery] = useState("");
    // useMemo: decorateServiceRecord копирует объекты (включая base64-фото) для
    // каждого сервиса — без мемоизации это гоняется заново на любой ре-рендер
    // (в т.ч. фоновый poll родителя), что на слабых устройствах ощутимо грузит CPU.
    const servicesList = useMemo(() => (
      serviceDirectory && Array.isArray(serviceDirectory.featuredServices)
        ? serviceDirectory.featuredServices.map((item) => decorateServiceRecord(item))
        : recommendedServices.map((item) => decorateServiceRecord(item))
    ), [serviceDirectory]);
    const servicePool = useMemo(() => (
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services.map((item) => decorateServiceRecord(item))
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item))
    ), [serviceDirectory]);
    const activeCar = findGarageCar(activeCarId);
    const personalizedServices = useMemo(
      () => getPersonalizedServices(servicePool, activeCarId).slice(0, 3),
      [servicePool, activeCarId]
    );

    const getServiceSavingsLabel = (service) => {
      const priceScore = clampServiceMetric(service?.honestPriceScore, 82);
      const savings = Math.max(35, Math.round(((priceScore - 58) * 2.1) / 5) * 5);
      return `${savings}+ TJS`;
    };

    const getCompactServiceKind = (service) => {
      const raw = String(service?.category || service?.type || "СТО").trim();
      const lower = raw.toLowerCase();
      if (!raw) return "СТО";
      if (lower.includes("сто")) return "СТО";
      if (lower.includes("шин")) return "Шины";
      if (lower.includes("детейл")) return "Детейлинг";
      if (lower.includes("мойк")) return "Мойка";
      if (lower.includes("элект")) return "Электрика";
      if (lower.includes("диагност")) return "Диагностика";
      return raw.split(" ").slice(0, 2).join(" ");
    };

    const getCompactServiceSubtitle = (service) =>
      [getCompactServiceKind(service), service?.distance, service?.city].filter(Boolean).join(" • ");

    const openServiceBooking = (event, serviceId) => {
      event.preventDefault();
      event.stopPropagation();
      navigateToHash(getServiceBookingPath(serviceId));
    };

    const compareService = (event, serviceName) => {
      event.preventDefault();
      event.stopPropagation();
      toast.push(`Сравнение ${serviceName} скоро добавим`);
    };

    const normalizedSearchQuery = normalizeServiceCategoryText(serviceSearchQuery);
    const serviceMatchesSearch = (service) => {
      if (!normalizedSearchQuery) return true;
      const categoryMeta = getServiceCategoryMeta(service?.categoryId || service?.category || service?.type);
      const searchableText = normalizeServiceCategoryText([
        service?.name,
        service?.category,
        service?.categoryLabel,
        service?.type,
        categoryMeta?.name,
        service?.city,
        service?.address,
        service?.locationLabel,
        service?.description,
        service?.tagline,
        service?.price,
        service?.workingHours
      ].filter(Boolean).join(" "));
      return searchableText.includes(normalizedSearchQuery);
    };

    const renderCompactServiceCard = (service, options = {}) => {
      const tags = Array.isArray(service?.primaryBadges) ? service.primaryBadges.slice(0, 2) : [];
      if (options.recommended && tags.length < 3) {
        tags.push({
          id: "recommended",
          label: "Рекомендуем",
          color: "var(--drivex-neon-cyan)"
        });
      }

      return html`
        <a
          key=${`${options.keyPrefix || "service"}-${service.id}`}
          href=${`#/service/${service.id}`}
          className="relative block overflow-hidden rounded-[24px] p-4 transition-all hover:scale-[1.01]"
          style=${{
            background: "linear-gradient(180deg, rgba(18, 24, 38, 0.98) 0%, rgba(12, 18, 29, 0.98) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            boxShadow: "0 16px 28px rgba(0, 0, 0, 0.16)"
          }}
        >
          <div
            className="absolute -top-10 -right-10 w-24 h-24 rounded-full pointer-events-none"
            style=${{
              background: "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0) 72%)"
            }}
          ></div>

          <div className="relative flex items-start gap-3">
            <div
              className="rounded-[12px] overflow-hidden flex-shrink-0"
              style=${{
                width: "88px",
                height: "88px",
                minWidth: "88px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              ${service.image
                ? html`<img
                    key=${getServiceImageRenderKey(service)}
                    src=${service.image}
                    alt=${service.name}
                    className="w-full h-full object-cover"
                  />`
                : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3
                  className="font-bold text-[17px] leading-tight truncate"
                  style=${{ color: "var(--drivex-white)", maxWidth: "65%" }}
                >
                  ${service.name}
                </h3>
                <span
                  className="inline-flex items-center gap-1 text-[15px] font-semibold whitespace-nowrap"
                  style=${{ color: "var(--drivex-warning)" }}
                >
                  <${Icon} name="star" size=${12} />
                  ${service.smartRating}
                </span>
              </div>

              <p className="text-[12px] mt-1 truncate" style=${{ color: "var(--drivex-silver)" }}>
                ${getCompactServiceSubtitle(service)}
              </p>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-4 flex-wrap text-[12px]">
                  <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-silver)" }}>
                    <${Icon} name="clock" size=${12} />
                    ${service.averageRepairTime || "25 мин"}
                  </span>
                  <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-warning)" }}>
                    <${Icon} name="coins" size=${12} />
                    ${getServiceSavingsLabel(service)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[12px]">
                  <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-neon-cyan)" }}>
                    <${Icon} name="repeat" size=${12} />
                    ${service.repeatClientsPercent}% возврат
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            ${tags.slice(0, 3).map((badge) => html`
              <span
                key=${badge.id}
                className="px-2.5 py-1.5 rounded-full text-[10px] font-semibold"
                style=${{
                  background: `linear-gradient(135deg, ${alphaBg(badge.color, 0.2)} 0%, ${alphaBg(badge.color, 0.12)} 100%)`,
                  color: badge.color,
                  border: `1px solid ${alphaBg(badge.color, 0.16)}`
                }}
              >
                ${badge.label}
              </span>
            `)}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span
              role="button"
              tabIndex="0"
              className="inline-flex items-center justify-center px-4 py-3 rounded-full text-sm font-semibold"
              style=${{
                color: "var(--drivex-white)",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
              onClick=${(event) => compareService(event, service.name)}
            >
              Сравнить
            </span>

            <span
              role="button"
              tabIndex="0"
              className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-full text-sm font-semibold dx-btn"
              style=${{ boxShadow: "0 12px 24px rgba(14, 165, 233, 0.2)" }}
              onClick=${(event) => openServiceBooking(event, service.id)}
            >
              Записаться
            </span>
          </div>
        </a>
      `;
    };

    const searchedServices = servicePool.filter(serviceMatchesSearch);
    const searchedServicesList = servicesList.filter(serviceMatchesSearch);
    const searchedPersonalizedServices = personalizedServices.filter(serviceMatchesSearch);
    const topService = searchedPersonalizedServices[0] || searchedServicesList[0] || searchedServices[0];
    const visibleServices = dedupeServicesById(normalizedSearchQuery ? [
      ...searchedPersonalizedServices,
      ...searchedServicesList,
      ...searchedServices
    ] : [
      ...personalizedServices,
      ...servicesList,
      ...servicePool
    ]).slice(0, 6);
    const categoriesWithRuntimeServices = serviceCategories
      .map((category) => ({
        ...category,
        serviceCount: servicePool.filter((service) => service.categoryId === category.id).length
      }))
      .filter((category) => category.serviceCount > 0);
    const quickFilters = [
      { id: "all", label: "Все", icon: "layers", active: true },
      ...categoriesWithRuntimeServices.slice(0, 5).map((category) => ({
        id: category.id,
        label: category.name,
        icon: category.icon
      }))
    ];
    const crmStats = [
      { label: "Записи", value: "24/7" },
      { label: "Клиенты", value: "CRM" },
      { label: "Склад", value: "учет" }
    ];

    const renderServiceRow = (service, index) => {
      const isTop = index === 0;
      const meta = [
        service.distance,
        service.workingHours,
        service.city
      ].filter(Boolean).slice(0, 3).join(" · ");
      const primaryBadge = isTop ? "ТОП" : getCompactServiceKind(service);

      return html`
        <a key=${`services-redesign-${service.id}`} href=${`#/service/${service.id}`} className="services-redesign-card">
          <div className="services-redesign-photo">
            ${service.image
              ? html`<img
                  key=${getServiceImageRenderKey(service)}
                  src=${service.image}
                  alt=${service.name}
                />`
              : html`<span><${Icon} name="wrench" size=${24} /></span>`}
            <b>${primaryBadge}</b>
          </div>

          <div className="services-redesign-card-body">
            <div className="services-redesign-card-head">
              <div className="min-w-0">
                <h3>${service.name}</h3>
                <p>${meta || getCompactServiceSubtitle(service)}</p>
              </div>
              <button
                type="button"
                className="services-redesign-save"
                aria-label="Сохранить сервис"
                onClick=${(event) => compareService(event, service.name)}
              >
                <${Icon} name="star" size=${16} />
              </button>
            </div>

            <div className="services-redesign-meta">
              ${Number(service.reviews) > 0
                ? html`<span><${Icon} name="star" size=${11} /> ${service.rating}</span>
                    <span>${service.reviews} ${pluralize(Number(service.reviews), "отзыв", "отзыва", "отзывов")}</span>`
                : html`<span>Новый сервис</span>`}
              <span>${Number(service.boxesCount) || 1} ${pluralize(Number(service.boxesCount) || 1, "бокс", "бокса", "боксов")}</span>
            </div>

            <div className="services-redesign-card-foot">
              <strong>${service.averagePrice || service.priceFrom
                ? `от ${service.averagePrice || service.priceFrom} TJS`
                : "Цена по запросу"}</strong>
              <button
                type="button"
                onClick=${(event) => openServiceBooking(event, service.id)}
              >
                Записаться
              </button>
            </div>
          </div>
        </a>
      `;
    };

    const renderCategoryTile = (category) => html`
      <a key=${category.id} href=${`#/category/${category.id}`} className="services-redesign-category">
        <span style=${{ color: category.color, background: alphaBg(category.color, 0.16) }}>
          <${Icon} name=${category.icon} size=${18} />
        </span>
        <b>${category.name}</b>
      </a>
    `;

    const submitServiceSearch = (event) => {
      event.preventDefault();
      if (!normalizedSearchQuery) {
        toast.push("Введите название сервиса или услуги");
        return;
      }
      if (visibleServices[0]) {
        toast.push(`Найдено сервисов: ${visibleServices.length}`);
        return;
      }
      toast.push(`По запросу «${serviceSearchQuery.trim()}» ничего не найдено`);
    };

    return html`
      <div className="services-redesign-page">
        <header className="services-redesign-hero">
          <div className="services-redesign-hero-copy">
            <p>СЕРВИСЫ ДЛЯ АВТО</p>
            <h1>Найдите лучший сервис рядом</h1>
            <span>${activeCar ? `${activeCar.name} · ${activeCar.mileage}` : "Запись, диагностика и ремонт в Худжанде"}</span>
          </div>
          <div className="services-redesign-car" aria-hidden="true"></div>
        </header>

        <form className="services-redesign-searchbar" onSubmit=${submitServiceSearch}>
          <span><${Icon} name="search" size=${17} /></span>
          <input
            value=${serviceSearchQuery}
            placeholder="Название или услуга..."
            onInput=${(event) => setServiceSearchQuery(event.target.value)}
          />
          <button type="submit">Найти</button>
        </form>

        <nav className="services-redesign-filters" aria-label="Фильтры сервисов">
          ${quickFilters.map((filter) => html`
            <a
              key=${filter.id}
              href=${filter.id === "all" ? "#/services" : `#/category/${filter.id}`}
              data-active=${filter.active ? "true" : "false"}
            >
              <${Icon} name=${filter.icon} size=${15} />
              ${filter.label}
            </a>
          `)}
        </nav>

        <main className="services-redesign-content">
          <section className="services-redesign-section">
            <div className="services-redesign-section-head">
              <div>
                <h2>Популярные сервисы</h2>
                <p>${topService ? `Лучший выбор: ${topService.name}` : "Проверенные сервисы рядом"}</p>
              </div>
              <a href="#/map">Смотреть все</a>
            </div>

            <div className="services-redesign-list">
              ${visibleServices.length
                ? visibleServices.map((service, index) => renderServiceRow(service, index))
                : html`
                    <div className="glass-card-light rounded-2xl p-5">
                      <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        Ничего не найдено
                      </p>
                      <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                        Попробуйте написать тип услуги: автомойка, шиномонтаж, диагностика или ремонт.
                      </p>
                    </div>
                  `}
            </div>
          </section>

          <section className="services-redesign-crm">
            <div>
              <p>ДЛЯ СЕРВИСОВ</p>
              <h2>Получите свой сервис на DriveX</h2>
              <span>
                ${serviceCrmReady
                  ? `${serviceCenterName || "Ваш сервис"} уже подключен. Откройте кабинет.`
                  : "Записи, клиенты и заявки в одном кабинете."}
              </span>
              <a href="#/service-crm">${serviceCrmReady ? "Войти в CRM" : "Добавить сервис"}</a>
            </div>
            <aside>
              <b>DriveX</b>
              ${crmStats.map((item) => html`
                <span key=${item.label}>
                  <small>${item.label}</small>
                  <strong>${item.value}</strong>
                </span>
              `)}
            </aside>
          </section>

          <section className="services-redesign-section">
            <div className="services-redesign-section-head">
              <div>
                <h2>Категории услуг</h2>
                <p>Быстрый выбор без лишних шагов</p>
              </div>
            </div>
            <div className="services-redesign-categories">
              ${serviceCategories.map(renderCategoryTile)}
            </div>
          </section>
        </main>
      </div>
    `;

    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <div className="pt-12 pb-6 px-6" style=${{ background: "var(--drivex-graphite)" }}>
          <h1
            className="text-3xl font-bold mb-6 text-glow-cyan"
            style=${{ color: "var(--drivex-white)" }}
          >
            Автосервисы
          </h1>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style=${{ color: "var(--drivex-silver)" }}
            >
              <${Icon} name="search" size=${20} />
            </span>
            <input
              className="w-full pl-12 pr-4 py-4 rounded-xl glass-card-light outline-none dx-input"
              placeholder="Поиск сервисов..."
            />
          </div>
        </div>

        <div className="px-6 py-6">
          ${activeCar && personalizedServices.length
            ? html`<div
                className="relative overflow-hidden rounded-[32px] p-5 mb-6"
                style=${{
                  background: "linear-gradient(180deg, rgba(14, 19, 31, 0.98) 0%, rgba(9, 15, 26, 0.98) 100%)",
                  border: "1px solid rgba(56, 189, 248, 0.16)",
                  boxShadow: "0 28px 56px rgba(0, 0, 0, 0.22)"
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style=${{
                    background:
                      "radial-gradient(circle at 18% 10%, rgba(34, 211, 238, 0.14) 0%, rgba(34, 211, 238, 0) 28%), radial-gradient(circle at 88% 8%, rgba(249, 115, 22, 0.12) 0%, rgba(249, 115, 22, 0) 24%), radial-gradient(rgba(255, 255, 255, 0.09) 0.8px, transparent 0.8px)",
                    backgroundSize: "auto, auto, 18px 18px",
                    opacity: 0.72
                  }}
                ></div>

                <div
                  className="absolute left-8 top-[104px] w-28 h-[2px] rounded-full pointer-events-none"
                  style=${{
                    background: "linear-gradient(90deg, rgba(56, 189, 248, 0.85) 0%, rgba(56, 189, 248, 0) 100%)"
                  }}
                ></div>

                <div className="relative">
                  <h2 className="text-[29px] font-bold leading-tight" style=${{ color: "var(--drivex-white)" }}>
                    Лучшие сервисы для ${activeCar.name}
                  </h2>
                  <p className="text-sm mt-2 max-w-[280px]" style=${{ color: "var(--drivex-silver)" }}>
                    Подобрали подходящие сервисы быстрее и выгоднее по смарт-рейтингу
                  </p>

                  <div
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold mt-5"
                    style=${{
                      background: "rgba(6, 182, 212, 0.14)",
                      color: "var(--drivex-neon-cyan)",
                      border: "1px solid rgba(6, 182, 212, 0.16)",
                      boxShadow: "0 10px 24px rgba(6, 182, 212, 0.14)"
                    }}
                  >
                    <${Icon} name="bolt" size=${14} />
                    ${personalizedServices.length} варианта
                  </div>

                  <div className="space-y-3 mt-5">
                    ${personalizedServices.map((service, index) =>
                      renderCompactServiceCard(service, {
                        keyPrefix: "personalized",
                        recommended: index === 0
                      })
                    )}
                  </div>
                </div>
              </div>`
            : null}

          <div
            className="relative overflow-hidden rounded-[34px] p-6 mb-6"
            style=${{
              background: "linear-gradient(145deg, rgba(8, 24, 40, 0.98) 0%, rgba(15, 23, 42, 0.98) 62%, rgba(5, 20, 34, 1) 100%)",
              border: "1px solid rgba(6, 182, 212, 0.16)",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.22)"
            }}
          >
            <div
              className="absolute -top-16 -right-10 w-40 h-40 rounded-full pointer-events-none"
              style=${{
                background: "radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, rgba(6, 182, 212, 0) 72%)"
              }}
            ></div>
            <div
              className="absolute -bottom-12 left-8 w-36 h-36 rounded-full pointer-events-none"
              style=${{
                background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0) 74%)"
              }}
            ></div>

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.24em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  ДЛЯ СЕРВИСОВ
                </p>
                <h2
                  className="text-[32px] font-bold mt-3"
                  style=${{
                    color: "var(--drivex-white)",
                    lineHeight: "1.04",
                    letterSpacing: "-0.03em"
                  }}
                >
                  Отдельный
                  <br />
                  Service CRM
                </h2>
                <p className="text-sm mt-4 max-w-[360px]" style=${{ color: "var(--drivex-silver)", lineHeight: 1.75 }}>
                  Регистрация сервиса, учёт клиентов и машин, ремонты, склад, финансы и запись по боксам.
                </p>
              </div>

              <div
                className="w-16 h-16 rounded-[24px] flex items-center justify-center flex-shrink-0"
                style=${{
                  background: "linear-gradient(145deg, rgba(6, 182, 212, 0.22) 0%, rgba(6, 182, 212, 0.1) 100%)",
                  color: "var(--drivex-neon-cyan)",
                  border: "1px solid rgba(6, 182, 212, 0.12)"
                }}
              >
                <${Icon} name="wrench" size=${28} />
              </div>
            </div>

            <div className="relative flex flex-wrap gap-2 mt-5">
              ${["Клиенты", "Ремонты", "Склад", "Финансы"].map((chip) => html`
                <span
                  key=${chip}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold"
                  style=${{
                    background: "rgba(255, 255, 255, 0.045)",
                    color: "var(--drivex-white)",
                    border: "1px solid rgba(255, 255, 255, 0.04)"
                  }}
                >
                  ${chip}
                </span>
              `)}
            </div>

            <div className="relative flex items-end justify-between gap-4 flex-wrap mt-6">
              <div>
                <p className="text-xs font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  7 разделов CRM
                </p>
                <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Для владельца сервиса и команды
                </p>
              </div>

              <a
                href="#/service-crm"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-sm font-bold"
                style=${{
                  minWidth: "196px",
                  background: "linear-gradient(135deg, #1fb7f3 0%, #0ea5e9 100%)",
                  color: "var(--drivex-white)",
                  boxShadow: "0 16px 30px rgba(14, 165, 233, 0.28)"
                }}
              >
                <span>Открыть CRM</span>
                <${Icon} name="chevron-left" size=${16} style=${{ transform: "rotate(180deg)" }} />
              </a>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4" style=${{ color: "var(--drivex-white)" }}>
            Категории услуг
          </h2>
          <div className="grid grid-cols-2 gap-4">
            ${serviceCategories.map(
              (c) => html`
                <a
                  key=${c.id}
                  href=${`#/category/${c.id}`}
                  className="glass-card-light rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-105"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style=${{
                      background: alphaBg(c.color, 0.2),
                      color: c.color
                    }}
                  >
                    <${Icon} name=${c.icon} size=${28} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style=${{ color: "var(--drivex-white)" }}>
                      ${c.name}
                    </h3>
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      ${c.count}
                    </p>
                  </div>
                </a>
              `
            )}
          </div>
        </div>

        <div className="px-6 py-6" id="services-recommended">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Рекомендуем
            </h2>
            <a href="#/map" className="text-sm font-medium" style=${{ color: "var(--drivex-neon-cyan)" }}>
              На карте
            </a>
          </div>

          <div className="space-y-4">
            ${servicesList.map((service, index) =>
              renderCompactServiceCard(service, {
                keyPrefix: "recommended",
                recommended: index === 0
              })
            )}
          </div>
        </div>
      </div>
    `;
  }

  function ServiceRequestStatusTimeline({ status = "new" }) {
    const normalizedStatus = normalizeServiceRequestStatusId(status);

    // Отклонённая заявка — вне линейного таймлайна: показываем явный статус.
    if (normalizedStatus === "declined") {
      return html`
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3"
          style=${{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.26)" }}
        >
          <span className="w-3 h-3 rounded-full flex-shrink-0" style=${{ background: "var(--drivex-danger)" }}></span>
          <span className="text-sm font-semibold" style=${{ color: "var(--drivex-danger)" }}>
            Сервис отклонил заявку — выберите другое время или сервис
          </span>
        </div>
      `;
    }

    const currentIndex = Math.max(
      0,
      serviceRequestStatusOptions.findIndex((item) => item.id === normalizedStatus)
    );

    return html`
      <div className="flex items-start justify-between gap-3">
        ${serviceRequestStatusOptions.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return html`
            <div key=${step.id} className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style=${{
                    background: isActive ? step.color : "rgba(148, 163, 184, 0.22)",
                    boxShadow: isCurrent ? `0 0 0 6px ${alphaBg(step.color, 0.16)}` : "none"
                  }}
                ></span>
                <span
                  className="text-xs font-semibold"
                  style=${{ color: isActive ? "var(--drivex-white)" : "var(--drivex-silver)" }}
                >
                  ${step.label}
                </span>
              </div>
              ${index < serviceRequestStatusOptions.length - 1
                ? html`<div
                    className="mt-3 h-[2px] rounded-full"
                    style=${{
                      background:
                        index < currentIndex ? step.color : "rgba(148, 163, 184, 0.18)"
                    }}
                  ></div>`
                : null}
            </div>
          `;
        })}
      </div>
    `;
  }

  function CartBadge({ count, size = 20, offset = { top: "-4px", right: "-4px" } }) {
    const safeCount = Math.max(0, Number(count) || 0);
    if (!safeCount) return null;

    return html`<span
      className="absolute rounded-full flex items-center justify-center text-xs font-bold"
      style=${{
        top: offset.top,
        right: offset.right,
        minWidth: `${size}px`,
        height: `${size}px`,
        padding: "0 6px",
        background: "var(--drivex-danger)",
        color: "var(--drivex-white)",
        boxShadow: "0 10px 30px rgba(239, 68, 68, 0.35)"
      }}
    >
      ${safeCount > 99 ? "99+" : safeCount}
    </span>`;
  }

  function MarketStoreAvatar({ store, size = 40, rounded = "14px" }) {
    const safeStore = store && typeof store === "object" ? store : null;
    const accent = safeStore?.accent || "var(--drivex-neon-cyan)";
    const label = String(safeStore?.avatar || "DX").slice(0, 2).toUpperCase();

    return html`<div
      className="flex items-center justify-center font-bold flex-shrink-0"
      style=${{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: rounded,
        background: `linear-gradient(135deg, ${alphaBg(accent, 0.4)} 0%, rgba(15, 23, 42, 0.92) 100%)`,
        color: "var(--drivex-white)",
        border: `1px solid ${alphaBg(accent, 0.45)}`
      }}
    >
      ${label}
    </div>`;
  }

  function StoreLabel({ store, deliveryText }) {
    if (!store) return null;

    return html`
      <div className="flex items-center gap-2 mt-3">
        <${MarketStoreAvatar} store=${store} size=${30} rounded="10px" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold" style=${{ color: "var(--drivex-white)" }}>
            ${store.name}
          </p>
          <p style=${{ color: "var(--drivex-silver)", fontSize: "11px" }}>
            ${store.city}${deliveryText ? ` • ${deliveryText}` : ""}
          </p>
        </div>
      </div>
    `;
  }

  function SearchBar({ value, onChange, onToggleFilters, filtersCount }) {
    return html`
      <div className="market-ui-search-row">
        <div className="market-ui-search">
          <span>
            <${Icon} name="search" size=${20} />
          </span>
          <input
            type="search"
            className="dx-input"
            placeholder="Поиск автозапчастей, масел, шин..."
            value=${value}
            onInput=${(e) => onChange && onChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="market-ui-icon-btn"
          onClick=${onToggleFilters}
          aria-label="Фильтры"
        >
          <${Icon} name="filter" size=${20} />
          <${CartBadge} count=${filtersCount} size=${18} offset=${{ top: "6px", right: "6px" }} />
        </button>
      </div>
    `;
  }

  function CategoryRow({ categories, activeCategoryId, onSelectCategory }) {
    return html`
      <div className="market-ui-category-row no-scrollbar">
        ${categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          return html`
            <button
              key=${category.id}
              type="button"
              className=${`market-ui-category ${isActive ? "is-active" : ""}`}
              style=${{ "--market-accent": category.color }}
              onClick=${() =>
                onSelectCategory &&
                onSelectCategory(isActive && category.id !== "all" ? "all" : category.id)}
            >
              <span>
                <${Icon} name=${category.icon} size=${18} />
              </span>
              <b>${category.name}</b>
            </button>
          `;
        })}
      </div>
    `;
  }

  function MarketAppNav({ active = "home", cartCount = 0 }) {
    const items = [
      { id: "home", label: "Главная", icon: "home", path: "/market" },
      { id: "catalog", label: "Каталог", icon: "layers", path: "/marketplace/catalog" },
      { id: "auto", label: "Подбор", icon: "search", path: "/marketplace/auto" },
      { id: "orders", label: "Заказы", icon: "folder", path: "/marketplace/orders" }
    ];

    return html`
      <nav className="market-ui-nav" aria-label="Вкладки маркетплейса">
        ${items.map((item) => {
          const isActive = active === item.id;
          return html`
            <a
              key=${item.id}
              href=${`#${item.path}`}
              className=${`market-ui-nav-item ${isActive ? "is-active" : ""}`}
              aria-current=${isActive ? "page" : "false"}
            >
              <span>${item.label}</span>
            </a>
          `;
        })}
      </nav>
    `;
  }

  function MarketTopBar({ title, subtitle, cartCount = 0, backPath = "", compact = false }) {
    return html`
      <header className=${`market-ui-top ${compact ? "is-compact" : ""}`}>
        <div className="market-ui-title-row">
          ${backPath
            ? html`<a href=${`#${backPath}`} className="market-ui-icon-btn" aria-label="Назад">
                <${Icon} name="chevron-left" size=${19} />
              </a>`
            : null}
          <div className="min-w-0">
            <h1>${title}</h1>
            ${subtitle ? html`<p>${subtitle}</p>` : null}
          </div>
          <a href=${getMarketCartPath()} className="market-ui-icon-btn ml-auto" aria-label="Корзина">
            <${Icon} name="bag" size=${20} />
            <${CartBadge} count=${cartCount} size=${17} offset=${{ top: "-6px", right: "-6px" }} />
          </a>
        </div>
      </header>
    `;
  }

  function MarketSectionTitle({ title, actionLabel, actionPath }) {
    return html`
      <div className="market-ui-section-head">
        <h2>${title}</h2>
        ${actionLabel && actionPath
          ? html`<a href=${`#${actionPath}`}>${actionLabel}</a>`
          : null}
      </div>
    `;
  }

  // Герой-карусель маркетплейса: 3 актуальных слайда, автопрокрутка каждые 5с.
  function PromoBanner({ onShowDeals }) {
    const slides = [
      {
        id: "sale",
        badge: "Акция месяца",
        title: "Скидки до −30%",
        text: "Масла, фильтры и расходники по сниженным ценам",
        cta: "Смотреть",
        theme: "is-sale",
        image: "./assets/marketplace/motor-oil-shelf.jpg",
        onClick: onShowDeals
      },
      {
        id: "used",
        badge: "Проверено магазином",
        title: "Б/У запчасти с гарантией",
        text: "Оригинальные детали с разборки — проверяем до продажи",
        cta: "К запчастям",
        theme: "is-used",
        image: "https://fppczriwvbflrhnorgqv.supabase.co/storage/v1/object/public/product-images/avtomir/BU-001-v2.jpg",
        onClick: () => navigateToHash("/marketplace/store/автомир-худжанд")
      },
      {
        id: "delivery",
        badge: "DRIVEX доставка",
        title: "Привезём в день заказа",
        text: "По Худжанду — сегодня, самовывоз с рынка Панчшанбе",
        cta: "Выбрать товары",
        theme: "is-delivery",
        image: "https://fppczriwvbflrhnorgqv.supabase.co/storage/v1/object/public/product-images/avtomir/TIR-003-v2.jpg",
        onClick: () => navigateToHash("/marketplace/catalog")
      }
    ];

    const [active, setActive] = useState(0);
    const timerRef = useRef(null);

    const restartTimer = useCallback(() => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setActive((prev) => (prev + 1) % slides.length);
      }, 5000);
    }, [slides.length]);

    useEffect(() => {
      restartTimer();
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
      };
    }, [restartTimer]);

    const goTo = useCallback((index) => {
      setActive(index);
      restartTimer(); // ручной выбор не должен тут же перелистнуться автотаймером
    }, [restartTimer]);

    return html`
      <div className="market-ui-promo" role="region" aria-label="Акции и предложения">
        ${slides.map((slide, index) => html`
          <div
            key=${slide.id}
            className=${`market-ui-promo-slide ${slide.theme} ${index === active ? "is-active" : ""}`}
            aria-hidden=${index === active ? "false" : "true"}
          >
            <div className="market-ui-promo-body">
              <span className="market-ui-promo-badge">${slide.badge}</span>
              <h2>${slide.title}</h2>
              <p>${slide.text}</p>
              <button type="button" tabIndex=${index === active ? 0 : -1} onClick=${slide.onClick}>
                ${slide.cta}
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="market-ui-promo-media">
              <img src=${slide.image} alt="" loading=${index === 0 ? "eager" : "lazy"} decoding="async" />
            </div>
            <span className="market-ui-promo-glow" aria-hidden="true"></span>
          </div>
        `)}
        <div className="market-ui-promo-dots" role="tablist" aria-label="Слайды">
          ${slides.map((slide, index) => html`
            <button
              key=${slide.id}
              type="button"
              role="tab"
              aria-selected=${index === active ? "true" : "false"}
              aria-label=${`Слайд ${index + 1}`}
              className=${index === active ? "is-active" : ""}
              onClick=${() => goTo(index)}
            ></button>
          `)}
        </div>
      </div>
    `;
  }

  function ProductCard({ product, onAddToCart }) {
    const [addedPulse, setAddedPulse] = useState(false);
    const addedTimerRef = useRef(null);
    const toast = useToast();
    const store = getMarketStore(product.storeId);
    const badgeColor = getMarketBadgeColor(product);
    const discount = getMarketDiscountPercent(product);
    const categoryMeta = marketCategories.find((category) => category.id === product.categoryId);
    const categoryColor = categoryMeta?.color || "var(--drivex-neon-cyan)";
    const favorites = typeof useMarketFavorites === "function" ? useMarketFavorites() : { has: () => false, toggle: () => false };
    const favoriteKey = typeof getMarketFavoriteKey === "function" ? getMarketFavoriteKey(product) : "";
    const isFavorite = favorites.has(favoriteKey);

    useEffect(() => {
      return () => {
        if (addedTimerRef.current) {
          window.clearTimeout(addedTimerRef.current);
        }
      };
    }, []);

    const handleAddToCart = useCallback((event) => {
      event.preventDefault();
      event.stopPropagation();
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

    return html`
      <div className=${`market-ui-product ${addedPulse ? "is-added" : ""}`}>
        <a href=${getMarketProductPath(product.id)} className="market-ui-product-link">
          <div className="market-ui-product-img">
          <img src=${product.image} alt=${product.name} loading="lazy" decoding="async" />

          ${discount
            ? html`<span className="market-ui-sale" style=${{ background: badgeColor }}>
                -${discount}%
              </span>`
            : null}
          <button
            type="button"
            className=${`market-ui-fav ${isFavorite ? "is-active" : ""}`}
            style=${{ width: "2rem", height: "2rem", right: "0.4rem", top: "0.4rem" }}
            onClick=${(e) => {
              e.preventDefault();
              e.stopPropagation();
              const added = favorites.toggle(favoriteKey);
              toast.push(added ? "Добавлено в избранное" : "Убрано из избранного");
            }}
            aria-label=${isFavorite ? "Убрать из избранного" : "В избранное"}
          >
            <${Icon} name="heart" size=${14} />
          </button>
          </div>

          <div className="market-ui-product-body">
            <p className="market-ui-product-store">${store?.name || "Магазин DRIVEX"}</p>
            <h3>
              ${product.name}
            </h3>

            <div className="market-ui-product-meta">
              <span>${product.rating} (${product.reviews})</span>
              <span>${product.category}</span>
            </div>
          </div>
        </a>

        <div className="market-ui-product-foot">
          <div>
            <strong>${formatTjsPrice(product.price)}</strong>
            ${product.oldPrice
              ? html`<small>
                  ${formatTjsPrice(product.oldPrice)}
                </small>`
              : null}
          </div>
          <button
            type="button"
            className=${addedPulse ? "is-added" : ""}
            onClick=${handleAddToCart}
            aria-label=${addedPulse ? "Товар добавлен" : "В корзину"}
          >
            ${addedPulse ? html`<${Icon} name="check" size=${17} />` : html`<${Icon} name="bag" size=${17} />`}
          </button>
        </div>
      </div>
    `;
  }

  const MemoProductCard = React.memo(ProductCard, (prev, next) => {
    return prev.product === next.product && prev.onAddToCart === next.onAddToCart;
  });

  function ProductGrid({ products, onAddToCart, emptyTitle = "Ничего не найдено", emptyBody, onReset }) {
    if (!products.length) {
      return html`
        <div className="glass-card-light rounded-3xl p-6 text-center">
          <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
            ${emptyTitle}
          </p>
          <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
            ${emptyBody || "Попробуйте изменить запрос или сбросить фильтры."}
          </p>
          ${onReset
            ? html`<button
                type="button"
                className="mt-4 px-4 py-3 rounded-2xl text-sm font-semibold dx-btn"
                onClick=${onReset}
              >
                Сбросить
              </button>`
            : null}
        </div>
      `;
    }

    return html`
      <div className="market-ui-product-grid">
        ${products.map((product) => html`<${MemoProductCard} key=${product.id} product=${product} onAddToCart=${onAddToCart} />`)}
      </div>
    `;
  }

  const MemoProductGrid = React.memo(ProductGrid, (prev, next) => {
    return (
      prev.products === next.products &&
      prev.onAddToCart === next.onAddToCart &&
      prev.emptyTitle === next.emptyTitle &&
      prev.emptyBody === next.emptyBody &&
      prev.onReset === next.onReset
    );
  });

  function MarketplacePage({ cartCount, onAddToCart }) {
    const toast = useToast();
    const [query, setQuery] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState("all");
    const [feedFilterId, setFeedFilterId] = useState("all");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState("all");
    const [deliveryOnly, setDeliveryOnly] = useState(false);
    const [saleOnly, setSaleOnly] = useState(false);
    const [inStockOnly, setInStockOnly] = useState(false);
    const catalogStores = marketplaceData.stores;
    const catalogProducts = marketplaceData.products;

    const cityOptions = useMemo(() => {
      return ["all", ...new Set(catalogStores.map((store) => store.city))];
    }, [catalogStores]);

    const resetMarketplaceFilters = useCallback(() => {
      setQuery("");
      setActiveCategoryId("all");
      setFeedFilterId("all");
      setSelectedCity("all");
      setDeliveryOnly(false);
      setSaleOnly(false);
      setInStockOnly(false);
    }, []);

    const filteredProducts = useMemo(() => {
      return filterMarketProducts(catalogProducts, {
        query,
        categoryId: activeCategoryId,
        city: selectedCity,
        deliveryOnly,
        saleOnly,
        inStockOnly,
        feedFilterId
      });
    }, [activeCategoryId, catalogProducts, deliveryOnly, feedFilterId, inStockOnly, query, saleOnly, selectedCity]);

    const highlightedProducts = useMemo(() => {
      const hasActiveFilters =
        query.trim() ||
        activeCategoryId !== "all" ||
        feedFilterId !== "all" ||
        selectedCity !== "all" ||
        deliveryOnly ||
        saleOnly ||
        inStockOnly;

      return hasActiveFilters ? filteredProducts : filteredProducts.slice(0, 8);
    }, [activeCategoryId, deliveryOnly, feedFilterId, filteredProducts, inStockOnly, query, saleOnly, selectedCity]);

    const activeFiltersCount =
      (feedFilterId !== "all" ? 1 : 0) +
      (selectedCity !== "all" ? 1 : 0) +
      (deliveryOnly ? 1 : 0) +
      (saleOnly ? 1 : 0) +
      (inStockOnly ? 1 : 0);

    const featuredStores = useMemo(() => {
      return catalogStores.map((store) => {
        const storeProducts = getMarketProductsByStore(store.id);
        return {
          ...store,
          productsCount: storeProducts.length
        };
      });
    }, [catalogProducts, catalogStores]);

    const handlePromoClick = useCallback(() => {
      setActiveCategoryId("oil");
      setFeedFilterId("discounted");
      setSaleOnly(true);
      setFiltersOpen(true);
      toast.push("Показываю акционные товары");
    }, [toast]);

    return html`
      <div className="market-ui-page">
        <${MarketTopBar}
          title="Маркетплейс"
          subtitle="Простой. Быстрый. Удобный."
          cartCount=${cartCount}
        />

        <main className="market-ui-content">
          <${SearchBar}
            value=${query}
            onChange=${setQuery}
            onToggleFilters=${() => setFiltersOpen((prev) => !prev)}
            filtersCount=${activeFiltersCount}
          />

          <${MarketAppNav} active="home" cartCount=${cartCount} />

          <div className="market-ui-tabs">
            <a href="#/marketplace/auto" className="market-ui-tab">
              <${Icon} name="car" size=${15} />
              Подбор по авто
            </a>
            <a href="#/marketplace/auto" className="market-ui-tab">
              <${Icon} name="scan" size=${15} />
              По VIN
            </a>
          </div>

          <${CategoryRow}
            categories=${marketCategories.filter((category) => category.id !== "all")}
            activeCategoryId=${activeCategoryId}
            onSelectCategory=${setActiveCategoryId}
          />

        ${filtersOpen
          ? html`
              <div className="market-ui-filter-panel">
                  <div className="market-ui-section-head">
                    <div>
                      <h2>
                        Быстрые фильтры
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick=${resetMarketplaceFilters}
                    >
                      Сбросить
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs mb-2" style=${{ color: "var(--drivex-silver)" }}>
                      Город
                    </p>
                    <div className="market-ui-chip-row">
                      ${cityOptions.map((city) => {
                        const isActive = selectedCity === city;
                        const label = city === "all" ? "Все города" : city;
                        return html`
                          <button
                            key=${city}
                            type="button"
                            className=${`market-ui-chip ${isActive ? "is-active" : ""}`}
                            onClick=${() => setSelectedCity(city)}
                          >
                            ${label}
                          </button>
                        `;
                      })}
                    </div>
                  </div>

                  <div className="market-ui-chip-grid">
                    ${[
                      {
                        id: "delivery",
                        label: "С доставкой",
                        active: deliveryOnly,
                        toggle: () => setDeliveryOnly((prev) => !prev),
                        color: "var(--drivex-success)"
                      },
                      {
                        id: "sale",
                        label: "Со скидкой",
                        active: saleOnly,
                        toggle: () => setSaleOnly((prev) => !prev),
                        color: "var(--drivex-danger)"
                      },
                      {
                        id: "stock",
                        label: "В наличии",
                        active: inStockOnly,
                        toggle: () => setInStockOnly((prev) => !prev),
                        color: "var(--drivex-neon-cyan)"
                      },
                      {
                        id: "close",
                        label: "Скрыть фильтры",
                        active: false,
                        toggle: () => setFiltersOpen(false),
                        color: "var(--drivex-silver)"
                      }
                    ].map((filter) => html`
                      <button
                        key=${filter.id}
                        type="button"
                        className=${`market-ui-chip ${filter.active ? "is-active" : ""}`}
                        onClick=${filter.toggle}
                      >
                        ${filter.label}
                      </button>
                    `)}
                  </div>
              </div>
            `
          : null}

          <${PromoBanner} onShowDeals=${handlePromoClick} />

          <${MarketSectionTitle} title="Популярные товары" actionLabel="Все" actionPath="/marketplace/catalog" />

          <${MemoProductGrid}
            products=${highlightedProducts}
            onAddToCart=${onAddToCart}
            onReset=${resetMarketplaceFilters}
            emptyTitle="Товары не найдены"
            emptyBody="Измените поиск, категорию или фильтры — каталог подстроится сразу."
          />

          <${MarketSectionTitle} title="Магазины" />
          <div className="market-ui-store-list no-scrollbar">
            ${featuredStores.map((store) => html`
              <a key=${store.id} href=${getMarketStorePath(store.id)} className="market-ui-store-card">
                <${MarketStoreAvatar} store=${store} size=${44} rounded="8px" />
                <div>
                  <h3>${store.name}</h3>
                  <p>${store.rating} (${store.reviews}) • ${store.productsCount} товаров</p>
                </div>
              </a>
            `)}
          </div>

          <div className="glass-card rounded-2xl p-5 mt-4 mb-6" style=${{ border: "1px solid rgba(6,182,212,0.2)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style=${{ background: "linear-gradient(135deg, var(--drivex-neon-cyan) 0%, var(--drivex-electric-blue) 100%)" }}>
                <${Icon} name="store" size=${20} />
              </div>
              <div>
                <p className="font-bold text-sm" style=${{ color: "var(--drivex-white)" }}>Хотите продавать на DRIVEX?</p>
                <p className="text-xs mt-0.5" style=${{ color: "var(--drivex-silver)" }}>Откройте магазин и начните продавать уже сегодня</p>
              </div>
            </div>
            <a href="#/seller/register"
              className="block w-full text-center py-3 rounded-xl font-semibold text-sm"
              style=${{ background: "linear-gradient(135deg, var(--drivex-neon-cyan) 0%, var(--drivex-electric-blue) 100%)", color: "var(--drivex-black)" }}>
              Зарегистрировать магазин →
            </a>
          </div>
        </main>
      </div>
    `;
  }

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

  const MARKET_CAR_MAKES = [
    "Toyota", "Lexus", "Honda", "Nissan", "Mitsubishi", "Mazda", "Subaru", "Suzuki",
    "BMW", "Mercedes", "Audi", "Volkswagen", "Opel", "Hyundai", "Kia", "Daewoo",
    "Chevrolet", "Ford", "Renault", "Lada"
  ];

  function marketVinEndpoint() {
    const base = (window.DRIVEX_AI_CONFIG && window.DRIVEX_AI_CONFIG.endpoint) || "/api/ai/assistant";
    return base.replace(/\/assistant\/?$/, "/vin");
  }

  function MarketAutoPickerScreen({ cartCount, onAddToCart }) {
    const toast = useToast();
    const cars = Array.isArray(garageCars) ? garageCars : [];
    const firstCar = cars[0] || null;

    const [mode, setMode] = useState("car");
    const [brand, setBrand] = useState(firstCar?.brand || "");
    const [model, setModel] = useState(firstCar?.model || "");
    const [year, setYear] = useState(firstCar?.year ? String(firstCar.year) : "");
    const [vin, setVin] = useState("");
    const [vinBusy, setVinBusy] = useState(false);
    const [vinInfo, setVinInfo] = useState(null);
    const [searched, setSearched] = useState(
      firstCar
        ? { brand: firstCar.brand || "", model: firstCar.model || "", year: firstCar.year ? String(firstCar.year) : "" }
        : null
    );

    const years = useMemo(() => {
      const cy = new Date().getFullYear();
      const arr = [];
      for (let y = cy; y >= 1990; y--) arr.push(String(y));
      return arr;
    }, []);

    // Реальный подбор: фильтруем каталог по совместимости с выбранным авто
    const matched = useMemo(() => {
      if (!searched || (!searched.brand && !searched.model)) return null;
      const specific = [];
      const universal = [];
      (marketplaceData.products || []).forEach((product) => {
        const r = DX.productMatchesCar
          ? DX.productMatchesCar(product, searched)
          : { match: true, universal: true };
        if (!r.match) return;
        if (r.universal) universal.push(product);
        else specific.push(product);
      });
      return { specific, universal, total: specific.length + universal.length };
    }, [searched]);

    const pickGarageCar = useCallback((car) => {
      setMode("car");
      setBrand(car.brand || "");
      setModel(car.model || "");
      setYear(car.year ? String(car.year) : "");
      setVinInfo(null);
      setSearched({ brand: car.brand || "", model: car.model || "", year: car.year ? String(car.year) : "" });
    }, []);

    const runCarSearch = useCallback(() => {
      if (!brand && !model) {
        toast.push("Выберите марку или модель");
        return;
      }
      setVinInfo(null);
      setSearched({ brand, model, year });
    }, [brand, model, year, toast]);

    const runVinCheck = useCallback(async () => {
      const v = String(vin || "").trim();
      if (v.replace(/[^A-Za-z0-9]/g, "").length < 11) {
        toast.push("Введите корректный VIN (мин. 11 символов)");
        return;
      }
      setVinBusy(true);
      try {
        const resp = await fetch(marketVinEndpoint(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vin: v })
        });
        if (!resp.ok) {
          // 404 = на сервере нет маршрута /api/ai/vin (запущен старый код)
          toast.push(resp.status === 404
            ? "VIN-сервис не найден — перезапустите сервер (node server.js)"
            : `VIN-сервис вернул ошибку ${resp.status}`);
          return;
        }
        let data = null;
        try { data = await resp.json(); } catch { data = null; }
        if (!data || (!data.brand && !data.year)) {
          toast.push("Не удалось распознать VIN — проверьте код");
          return;
        }
        setVinInfo(data);
        setBrand(data.brand || "");
        setModel(data.model || "");
        setYear(data.year ? String(data.year) : "");
        setSearched({ brand: data.brand || "", model: data.model || "", year: data.year ? String(data.year) : "" });
        toast.push(data._mock ? "VIN: базовая расшифровка" : "VIN распознан");
      } catch {
        toast.push("Нет связи с VIN-сервисом — сервер запущен?");
      } finally {
        setVinBusy(false);
      }
    }, [vin, toast]);

    const carLabel = searched && (searched.brand || searched.model)
      ? [searched.brand, searched.model, searched.year].filter(Boolean).join(" ")
      : "";

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

          ${cars.length
            ? html`
                <${MarketSectionTitle} title="Ваш гараж" />
                <div className="market-ui-saved-cars">
                  ${cars.map((car) => {
                    const isActive =
                      searched &&
                      (searched.brand || "") === (car.brand || "") &&
                      (searched.model || "") === (car.model || "");
                    return html`
                      <button
                        key=${car.id || `${car.brand}-${car.model}`}
                        type="button"
                        className=${isActive ? "is-active" : ""}
                        onClick=${() => pickGarageCar(car)}
                      >
                        <b>${[car.brand, car.model].filter(Boolean).join(" ") || "Авто"}</b>
                        <span>${car.year || ""}</span>
                      </button>
                    `;
                  })}
                </div>
              `
            : null}

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
                  <label className="market-ui-select">
                    <span>Марка</span>
                    <select value=${brand} onInput=${(e) => setBrand(e.target.value)}>
                      <option value="">Любая</option>
                      ${MARKET_CAR_MAKES.map((m) => html`<option key=${m} value=${m}>${m}</option>`)}
                    </select>
                  </label>
                  <label className="market-ui-select">
                    <span>Модель</span>
                    <input
                      className="dx-input"
                      placeholder="Например, Camry"
                      value=${model}
                      onInput=${(e) => setModel(e.target.value)}
                    />
                  </label>
                  <label className="market-ui-select">
                    <span>Год выпуска</span>
                    <select value=${year} onInput=${(e) => setYear(e.target.value)}>
                      <option value="">Любой</option>
                      ${years.map((y) => html`<option key=${y} value=${y}>${y}</option>`)}
                    </select>
                  </label>
                </div>
                <button type="button" className="market-ui-primary-btn" onClick=${runCarSearch}>
                  Показать запчасти
                </button>
              `
            : html`
                <div className="market-ui-filter-panel">
                  <label className="market-ui-select">
                    <span>VIN</span>
                    <input
                      className="dx-input"
                      placeholder="Например, JTDBR32E320012345"
                      value=${vin}
                      maxLength=${17}
                      onInput=${(e) => setVin(e.target.value.toUpperCase())}
                    />
                  </label>
                  <button type="button" className="market-ui-primary-btn" disabled=${vinBusy} onClick=${runVinCheck}>
                    ${vinBusy ? "Проверяю…" : "Проверить VIN"}
                  </button>
                  ${vinInfo && (vinInfo.brand || vinInfo.year)
                    ? html`<p style=${{ marginTop: "10px", fontSize: "13px", color: "var(--drivex-light-silver)" }}>
                        Распознано: <b style=${{ color: "var(--drivex-white)" }}>${[vinInfo.brand, vinInfo.model, vinInfo.year].filter(Boolean).join(" ") || "—"}</b>
                      </p>`
                    : null}
                </div>
              `}

          ${searched
            ? matched && matched.total
              ? html`
                  ${matched.specific.length
                    ? html`
                        <${MarketSectionTitle} title=${`Точно для ${carLabel || "вашего авто"} · ${matched.specific.length}`} />
                        <${MemoProductGrid} products=${matched.specific} onAddToCart=${onAddToCart} />
                      `
                    : null}
                  ${matched.universal.length
                    ? html`
                        <${MarketSectionTitle} title=${`Универсальные · ${matched.universal.length}`} />
                        <${MemoProductGrid} products=${matched.universal} onAddToCart=${onAddToCart} />
                      `
                    : null}
                `
              : html`
                  <div className="market-ui-filter-panel">
                    <div className="text-center">
                      <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        Подходящих товаров не нашлось
                      </p>
                      <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                        Для ${carLabel || "этого авто"} пока нет совместимых позиций в каталоге.
                      </p>
                    </div>
                  </div>
                `
            : html`
                <div className="market-ui-filter-panel">
                  <p className="text-sm text-center" style=${{ color: "var(--drivex-silver)" }}>
                    Выберите авто из гаража или укажите марку/VIN — покажем подходящие запчасти.
                  </p>
                </div>
              `}
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
                      <h3>${(DX.formatOrderShortId || ((x) => x))(order.id)}</h3>
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
  // BuyerAuthScreen — Вход / Регистрация с улучшенным UX
  // По умолчанию показывает форму входа (не выбор роли)
  // ─────────────────────────────────────────────────────────────────────
  function BuyerAuthScreen({ mode = "login", authStatus, onLogin, onRegister, onPhoneAuth, onGuest }) {
    const toast = useToast();
    const phoneAuth = window.DrivexPhoneAuth;
    const botName = (phoneAuth && phoneAuth.BOT_NAME) || "DriiiveX_Bot";

    // step: "login" | "register" | "reg_form" | "otp_login"
    const [step, setStep] = useState(mode === "register" ? "register" : "login");
    const [loginMethod, setLoginMethod] = useState("phone"); // "phone" | "email"

    // Вход
    const [loginInput, setLoginInput] = useState("");
    const [loginPass, setLoginPass]   = useState("");
    const [showPass, setShowPass]     = useState(false);

    // Регистрация (новый простой flow: телефон + имя + пароль)
    const [regPhone, setRegPhone]         = useState("");
    const [regName, setRegName]           = useState("");
    const [regPass, setRegPass]           = useState("");
    const [regPassConfirm, setRegPassConfirm] = useState("");
    const [showRegPass, setShowRegPass]   = useState(false);
    const [showRegPassConfirm, setShowRegPassConfirm] = useState(false);

    // Забыли пароль (сброс по email/телефону → новый пароль)
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotPass, setForgotPass] = useState("");
    const [forgotBusy, setForgotBusy] = useState(false);

    // OTP (для входа по телефону без пароля — fallback)
    const [phone, setPhone]               = useState("");
    const [otp, setOtp]                   = useState("");
    const [otpMethod, setOtpMethod]       = useState("server");
    const [otpTestCode, setOtpTestCode]   = useState("");
    const [needTelegram, setNeedTelegram] = useState(false);

    const [carMake, setCarMake]   = useState("");
    const [carModel, setCarModel] = useState("");
    const [carYear, setCarYear]   = useState("");
    const [busy, setBusy]         = useState(false);

    const carOptions = [
      { make: "Toyota",   models: ["Camry","Corolla","RAV4","Prius","Land Cruiser"] },
      { make: "Chevrolet",models: ["Nexia","Cobalt","Lacetti","Captiva"] },
      { make: "Hyundai",  models: ["Elantra","Tucson","Santa Fe","Accent","Sonata"] },
      { make: "Kia",      models: ["Rio","Sportage","Ceed","Optima"] },
      { make: "Daewoo",   models: ["Matiz","Nexia","Lacetti"] },
      { make: "BMW",      models: ["3 Series","5 Series","7 Series","X5"] },
      { make: "Mercedes", models: ["C-Class","E-Class","S-Class","GLE"] },
      { make: "Другое",   models: ["Другая модель"] }
    ];
    const selectedMakeModels = (carOptions.find((o) => o.make === carMake) || carOptions[0]).models;

    // Перевод ошибок Supabase Auth на русский
    const translateAuthError = (msg) => {
      if (!msg) return "Ошибка входа";
      const m = String(msg).toLowerCase();
      if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
        return "Неверный номер или пароль";
      if (m.includes("email not confirmed"))
        return "Аккаунт не подтверждён";
      if (m.includes("user not found") || m.includes("no rows"))
        return "Аккаунт не найден — сначала зарегистрируйтесь";
      if (m.includes("too many requests") || m.includes("rate limit"))
        return "Слишком много попыток — подождите немного";
      if (m.includes("already registered") || m.includes("already exists"))
        return "Этот номер уже зарегистрирован — войдите";
      if (m.includes("network") || m.includes("fetch"))
        return "Нет соединения с сервером";
      if (m.includes("password"))
        return "Неверный пароль";
      if (m.includes("email"))
        return "Неверный email";
      return msg;
    };

    // ── Вход по телефону + пароль ────────────────────────────────────
    const handleLoginPhone = async (e) => {
      e.preventDefault();
      if (busy) return;
      const val = String(loginInput || "").trim();
      if (!val || val.replace(/\D/g, "").length < 9) {
        toast.push("Введите корректный номер телефона"); return;
      }
      if (!loginPass) { toast.push("Введите пароль"); return; }
      setBusy(true);
      try {
        await onLogin({ phone: val, password: loginPass });
      } catch(err) {
        toast.push(translateAuthError(err?.message));
      } finally { setBusy(false); }
    };

    // ── Вход по email + пароль ───────────────────────────────────────
    const handleLoginEmail = async (e) => {
      e.preventDefault();
      if (busy) return;
      const val = String(loginInput || "").trim();
      if (!val) { toast.push("Введите email"); return; }
      if (!loginPass) { toast.push("Введите пароль"); return; }
      setBusy(true);
      try {
        await onLogin({ email: val, password: loginPass });
      } catch(err) {
        toast.push(translateAuthError(err?.message));
      } finally { setBusy(false); }
    };

    // ── Забыли пароль: сброс по телефону/email + новый пароль ───────
    const handleForgotPassword = async () => {
      if (forgotBusy) return;
      const id = String(loginInput || "").trim();
      if (!id) { toast.push("Сначала введите телефон или email в поле выше"); return; }
      if (String(forgotPass).trim().length < 6) { toast.push("Новый пароль — минимум 6 символов"); return; }
      setForgotBusy(true);
      try {
        const res = await fetch("/api/partner/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: id, newPassword: forgotPass.trim() })
        });
        const data = await res.json().catch(() => ({}));
        if (data.ok) {
          setLoginPass(forgotPass.trim());
          setForgotPass(""); setForgotOpen(false);
          toast.push("Пароль обновлён — теперь войдите");
        } else if (data.notFound) {
          toast.push("Аккаунт с таким телефоном/email не найден");
        } else if (data.configured === false) {
          toast.push("Сброс пароля временно недоступен");
        } else {
          toast.push(data.error || "Не удалось сбросить пароль");
        }
      } catch (err) {
        toast.push("Нет соединения с сервером");
      } finally { setForgotBusy(false); }
    };

    // ── Регистрация: телефон + имя + пароль ─────────────────────────
    const handleRegisterBuyer = async (e) => {
      e.preventDefault();
      if (busy) return;
      const phoneVal = String(regPhone || "").trim();
      const nameVal  = String(regName || "").trim();
      const passVal  = String(regPass || "");
      const confVal  = String(regPassConfirm || "");
      if (!phoneVal || phoneVal.replace(/\D/g,"").length < 9) {
        toast.push("Введите корректный номер телефона"); return;
      }
      if (!nameVal)  { toast.push("Введите ваше имя"); return; }
      if (passVal.length < 6) { toast.push("Пароль — минимум 6 символов"); return; }
      if (passVal !== confVal) { toast.push("Пароли не совпадают"); return; }
      setBusy(true);
      try {
        await onRegister({ phone: phoneVal, name: nameVal, password: passVal, role: "buyer" });
      } catch(err) {
        toast.push(translateAuthError(err?.message));
      } finally { setBusy(false); }
    };

    // Определяем метод по содержимому поля (как Instagram)
    const handleLogin = async (e) => {
      e.preventDefault();
      const val = String(loginInput || "").trim();
      const isPhone = /^\+?[\d\s\-()]{7,}$/.test(val) && val.replace(/\D/g,"").length >= 7;
      if (isPhone) return handleLoginPhone(e);
      return handleLoginEmail(e);
    };

    // ── OTP для входа ────────────────────────────────────────────────
    const handleOtpLogin = async (e) => {
      e.preventDefault();
      if (busy || otp.length < 6) return;
      setBusy(true);
      try {
        const pA = window.DrivexPhoneAuth;
        const result = pA ? await pA.verifyOtp(phone, otp, otpMethod) : { userId: null };
        if (onPhoneAuth) await onPhoneAuth({ phone, name: "", userId: result.userId || "" });
      } catch(err) {
        toast.push(err?.message || "Неверный код");
      } finally { setBusy(false); }
    };

    // ── OTP для регистрации ──────────────────────────────────────────
    const handleSendOtp = async (e) => {
      e.preventDefault();
      if (busy) return;
      const cleanPhone = String(phone || "").trim();
      if (!cleanPhone || cleanPhone.replace(/\D/g, "").length < 9) { toast.push("Введите корректный номер"); return; }
      setBusy(true);
      try {
        const pA = window.DrivexPhoneAuth;
        const result = pA ? await pA.sendOtp(cleanPhone) : await fetch("/api/otp/send", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({phone: cleanPhone}) }).then(r=>r.json());
        if (result.needTelegram) setNeedTelegram(true);
        if (result.testCode) { setOtpTestCode(result.testCode); toast.push("DEV: код " + result.testCode); }
        setOtpMethod(result.method || "server");
        setStep("otp");
      } catch(err) { toast.push(err?.message || "Не удалось отправить код"); }
      finally { setBusy(false); }
    };

    const handleVerifyOtp = async (e) => {
      e.preventDefault();
      if (busy || otp.length < 6) { toast.push("Введите 6-значный код"); return; }
      setBusy(true);
      try {
        const pA = window.DrivexPhoneAuth;
        const result = pA ? await pA.verifyOtp(phone, otp, otpMethod)
          : await fetch("/api/otp/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({phone, code: otp}) }).then(r=>r.json().then(d=>{if(!r.ok) throw new Error(d.error); return d;}));
        setVerifiedPhone(phone);
        setVerifiedUserId(result.userId || "");
        setStep("profile");
      } catch(err) { toast.push(err?.message || "Неверный код"); }
      finally { setBusy(false); }
    };

    const handleSaveProfile = async (e) => {
      e.preventDefault();
      if (busy) return;
      const name = String(fullName || "").trim();
      if (!name) { toast.push("Введите ваше имя"); return; }
      setBusy(true);
      try {
        if (onPhoneAuth) await onPhoneAuth({ phone: verifiedPhone, name, userId: verifiedUserId });
        else if (onRegister) await onRegister({ phone: verifiedPhone, name, email: "", password: "", role: "buyer" });
        setStep("car");
      } catch(err) { toast.push(err?.message || "Ошибка"); }
      finally { setBusy(false); }
    };

    const handleAddCar = async (e) => {
      e.preventDefault();
      if (busy || !carMake || !carModel) { toast.push("Выберите марку и модель"); return; }
      setBusy(true);
      try {
        if (onPhoneAuth) await onPhoneAuth({ phone: verifiedPhone, name: fullName, userId: verifiedUserId, car: { make: carMake, model: carModel, year: carYear } });
        if (navigateToHash) navigateToHash("/garage");
      } catch(err) { toast.push(err?.message || "Ошибка"); }
      finally { setBusy(false); }
    };

    const handleSkipCar = () => { if (navigateToHash) navigateToHash("/"); };

    const stepDots = { login: 0, otp_login: 1, register: 0, phone: 0, otp: 1, profile: 2, car: 3 };
    const totalDots = step.startsWith("otp") || step === "profile" || step === "car" ? 4 : 1;

    return html`
      <div className="min-h-screen flex flex-col" style=${{ background: "var(--drivex-black)" }}>
        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-sm space-y-5">

            <!-- Логотип -->
            <div className="text-center">
              <p className="text-xs font-bold tracking-widest" style=${{ color: "var(--drivex-neon-cyan)", letterSpacing: "0.25em" }}>DRIVEX</p>
              <h1 className="text-3xl font-black mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${step === "login"     ? "Войти"
                : step === "reg_form" ? "Регистрация"
                : step === "otp_login"? "Введите код"
                : step === "car"      ? "Ваш автомобиль"
                :                       "Профиль"}
              </h1>
              <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                ${step === "login"     ? "Введите телефон или email"
                : step === "reg_form" ? "Создайте аккаунт"
                : step === "otp_login"? "Введите код из Telegram @" + botName
                : step === "car"      ? "Укажите автомобиль (или пропустите)"
                :                       ""}
              </p>
            </div>

            <!-- ── ВХОД (Instagram-style) ─────────────────────── -->
            ${step === "login" ? html`
              <form className="space-y-3" onSubmit=${handleLogin}>

                <!-- Единая карточка с полями -->
                <div className="glass-card-light rounded-3xl p-5 space-y-3">
                  <!-- Поле: телефон ИЛИ email -->
                  <input
                    type="text"
                    className="w-full p-4 rounded-2xl dx-input"
                    value=${loginInput}
                    onInput=${(e) => setLoginInput(e.target.value)}
                    placeholder="Телефон или Email"
                    autocomplete="username"
                    autofocus
                  />
                  <!-- Разделитель -->
                  <div style=${{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
                  <!-- Поле: пароль -->
                  <div className="relative">
                    <input
                      type=${showPass ? "text" : "password"}
                      className="w-full p-4 rounded-2xl dx-input pr-12"
                      value=${loginPass}
                      onInput=${(e) => setLoginPass(e.target.value)}
                      placeholder="Пароль"
                      autocomplete="current-password"
                    />
                    <button type="button" onClick=${() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style=${{ color:"var(--drivex-silver)", background:"none", border:"none", cursor:"pointer", fontSize:"18px" }}>
                      ${showPass ? "👁" : "🙈"}
                    </button>
                  </div>
                </div>

                <!-- Забыли пароль? -->
                <div className="text-right" style=${{ marginTop: "-4px" }}>
                  <button type="button"
                    className="text-xs font-semibold"
                    style=${{ color:"var(--drivex-neon-cyan)", background:"none", border:"none", cursor:"pointer", padding:"2px 4px" }}
                    onClick=${() => setForgotOpen((v) => !v)}>
                    Забыли пароль?
                  </button>
                </div>
                ${forgotOpen ? html`
                  <div className="glass-card-light rounded-2xl p-4 space-y-3">
                    <p className="text-xs" style=${{ color:"var(--drivex-silver)" }}>
                      Введите телефон или email в поле выше, затем новый пароль:
                    </p>
                    <input type="text"
                      className="w-full p-3 rounded-xl dx-input"
                      value=${forgotPass}
                      onInput=${(e) => setForgotPass(e.target.value)}
                      placeholder="Новый пароль (мин. 6 символов)"
                      autocomplete="new-password" />
                    <button type="button"
                      className="w-full py-3 rounded-xl font-bold dx-btn"
                      disabled=${forgotBusy}
                      onClick=${handleForgotPassword}>
                      ${forgotBusy ? "Сохраняем…" : "Сбросить пароль"}
                    </button>
                  </div>
                ` : null}

                <!-- Войти -->
                <button type="submit" className="w-full py-4 rounded-2xl font-bold text-lg dx-btn" disabled=${busy}>
                  ${busy ? "Входим..." : "Войти"}
                </button>

                <!-- Разделитель -->
                <div className="flex items-center gap-3 py-1">
                  <div style=${{ flex:1, height:"1px", background:"rgba(255,255,255,0.1)" }} />
                  <span className="text-xs" style=${{ color:"rgba(255,255,255,0.3)" }}>или</span>
                  <div style=${{ flex:1, height:"1px", background:"rgba(255,255,255,0.1)" }} />
                </div>

                <!-- Нет аккаунта — Instagram style — сразу на форму регистрации -->
                <button type="button"
                  className="w-full py-3 rounded-2xl text-sm font-semibold"
                  style=${{ background:"transparent", border:"1px solid rgba(6,182,212,0.35)", color:"var(--drivex-neon-cyan)", cursor:"pointer" }}
                  onClick=${() => setStep("reg_form")}>
                  Нет аккаунта? <strong>Зарегистрироваться</strong>
                </button>

                <!-- Гость -->
                <button type="button"
                  className="w-full py-2 text-xs"
                  style=${{ color:"rgba(255,255,255,0.3)", background:"transparent", border:"none", cursor:"pointer" }}
                  onClick=${() => { if (onGuest) onGuest(); else navigateToHash("/"); }}>
                  Войти как гость
                </button>

              </form>
            ` : null}

            <!-- ── OTP ДЛЯ ВХОДА ─────────────────────────────── -->
            ${step === "otp_login" ? html`
              <form className="space-y-3" onSubmit=${handleOtpLogin}>
                <div className="glass-card-light rounded-3xl p-5 space-y-3">
                  ${needTelegram ? html`
                    <div className="rounded-2xl p-3" style=${{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
                      <p className="text-sm font-semibold" style=${{ color: "var(--drivex-neon-cyan)" }}>Напишите @${botName} в Telegram</p>
                      <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>Отправьте боту номер <strong>${phone}</strong></p>
                    </div>
                  ` : null}
                  ${otpTestCode ? html`
                    <div className="rounded-2xl p-2 text-center" style=${{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                      <p className="text-xs" style=${{ color: "#fbbf24" }}>DEV-код: <strong>${otpTestCode}</strong></p>
                    </div>
                  ` : null}
                  <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6"
                    className="w-full p-4 rounded-2xl dx-input text-3xl text-center tracking-[0.5em] font-bold"
                    value=${otp} onInput=${(e) => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                    placeholder="000000" autofocus />
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy || otp.length < 6}>
                  ${busy ? "Проверяем..." : "Войти"}
                </button>
                <button type="button" className="w-full py-3 text-sm" style=${{ color:"var(--drivex-silver)",background:"transparent",border:"none",cursor:"pointer" }}
                  onClick=${() => { setStep("login"); setOtp(""); }}>← Назад</button>
              </form>
            ` : null}

            <!-- ── РЕГИСТРАЦИЯ: выбор типа аккаунта ─────────── -->
            ${step === "register" ? html`
              <div className="space-y-3">
                <div className="space-y-2">
                  <!-- Автовладелец → форма регистрации -->
                  <button type="button" className="w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all"
                    style=${{ background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.25)",cursor:"pointer" }}
                    onClick=${() => setStep("reg_form")}>
                    <span style=${{ fontSize:"28px" }}>🚗</span>
                    <div>
                      <p className="font-bold" style=${{ color:"var(--drivex-white)" }}>Я автовладелец</p>
                      <p className="text-xs mt-1" style=${{ color:"var(--drivex-silver)" }}>Маркетплейс, сервисы, гараж, документы</p>
                    </div>
                  </button>
                  <button type="button" className="w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all"
                    style=${{ background:"rgba(14,165,233,0.08)",border:"1px solid rgba(14,165,233,0.2)",cursor:"pointer" }}
                    onClick=${() => navigateToHash("/partner/register")}>
                    <span style=${{ fontSize:"28px" }}>🏪</span>
                    <div>
                      <p className="font-bold" style=${{ color:"var(--drivex-white)" }}>Я продавец</p>
                      <p className="text-xs mt-1" style=${{ color:"var(--drivex-silver)" }}>Открыть магазин в маркетплейсе DRIVEX</p>
                    </div>
                  </button>
                  <button type="button" className="w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all"
                    style=${{ background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",cursor:"pointer" }}
                    onClick=${() => navigateToHash("/partner/login")}>
                    <span style=${{ fontSize:"28px" }}>🔧</span>
                    <div>
                      <p className="font-bold" style=${{ color:"var(--drivex-white)" }}>Я сервисный центр</p>
                      <p className="text-xs mt-1" style=${{ color:"var(--drivex-silver)" }}>СТО, мойка, детейлинг — партнёрский кабинет</p>
                    </div>
                  </button>
                </div>
                <button type="button" className="w-full py-3 rounded-2xl text-sm font-semibold"
                  style=${{ color:"var(--drivex-silver)",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer" }}
                  onClick=${() => setStep("login")}>← Уже есть аккаунт? Войти</button>
              </div>
            ` : null}

            <!-- ── ФОРМА РЕГИСТРАЦИИ автовладельца ────────────── -->
            ${step === "reg_form" ? html`
              <form className="space-y-3" onSubmit=${handleRegisterBuyer}>
                <div className="glass-card-light rounded-3xl p-5 space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>Номер телефона</span>
                    <input type="tel"
                      className="w-full mt-2 p-4 rounded-2xl dx-input text-lg tracking-wider"
                      value=${regPhone}
                      onInput=${(e) => setRegPhone(e.target.value)}
                      placeholder="+992 XX XXX XXXX"
                      autocomplete="tel" autofocus />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>Ваше имя</span>
                    <input type="text"
                      className="w-full mt-2 p-4 rounded-2xl dx-input"
                      value=${regName}
                      onInput=${(e) => setRegName(e.target.value)}
                      placeholder="Имя и фамилия"
                      autocomplete="name" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>Пароль</span>
                    <div className="relative mt-2">
                      <input type=${showRegPass ? "text" : "password"}
                        className="w-full p-4 rounded-2xl dx-input pr-12"
                        value=${regPass}
                        onInput=${(e) => setRegPass(e.target.value)}
                        placeholder="Минимум 6 символов"
                        autocomplete="new-password" />
                      <button type="button" onClick=${() => setShowRegPass(!showRegPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                        style=${{ color:"var(--drivex-silver)",background:"none",border:"none",cursor:"pointer" }}>
                        ${showRegPass ? "👁" : "🙈"}
                      </button>
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>Повторите пароль</span>
                    <div className="relative mt-2">
                      <input type=${showRegPassConfirm ? "text" : "password"}
                        className="w-full p-4 rounded-2xl dx-input pr-12"
                        value=${regPassConfirm}
                        onInput=${(e) => setRegPassConfirm(e.target.value)}
                        placeholder="Ещё раз"
                        autocomplete="new-password" />
                      <button type="button" onClick=${() => setShowRegPassConfirm(!showRegPassConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                        style=${{ color:"var(--drivex-silver)",background:"none",border:"none",cursor:"pointer" }}>
                        ${showRegPassConfirm ? "👁" : "🙈"}
                      </button>
                    </div>
                  </label>
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl font-bold text-lg dx-btn"
                  disabled=${busy || !regPhone || !regName || !regPass || !regPassConfirm}>
                  ${busy ? "Создаём аккаунт..." : "Зарегистрироваться"}
                </button>
                <button type="button" className="w-full py-3 text-sm"
                  style=${{ color:"var(--drivex-silver)",background:"transparent",border:"none",cursor:"pointer" }}
                  onClick=${() => setStep("login")}>← Уже есть аккаунт? Войти</button>
              </form>
            ` : null}

            <!-- ── ТЕЛЕФОН (для регистрации) ──────────────────── -->
            ${step === "phone" ? html`
              <form className="glass-card-light rounded-3xl p-5 space-y-4" onSubmit=${handleSendOtp}>
                <label className="block">
                  <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>Номер телефона</span>
                  <input type="tel" className="w-full mt-2 p-4 rounded-2xl dx-input text-xl tracking-wider"
                    value=${phone} onInput=${(e) => setPhone(e.target.value)}
                    placeholder="+992 XX XXX XXXX" autocomplete="tel" autofocus />
                </label>
                <div className="flex items-center gap-3 px-1">
                  <span style=${{ fontSize:"22px" }}>✈️</span>
                  <p className="text-xs" style=${{ color:"var(--drivex-silver)" }}>
                    Код придёт в <strong style=${{ color:"var(--drivex-neon-cyan)" }}>@${botName}</strong> в Telegram
                  </p>
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy}>
                  ${busy ? "Отправляем..." : "Получить код →"}
                </button>
                <button type="button" className="w-full py-2 text-sm" style=${{ color:"var(--drivex-silver)",background:"transparent",border:"none",cursor:"pointer" }}
                  onClick=${() => setStep("register")}>← Назад</button>
              </form>
            ` : null}

            <!-- ── OTP (регистрация) ───────────────────────────── -->
            ${step === "otp" ? html`
              <form className="glass-card-light rounded-3xl p-5 space-y-4" onSubmit=${handleVerifyOtp}>
                ${needTelegram ? html`
                  <div className="rounded-2xl p-4" style=${{ background:"rgba(6,182,212,0.08)",border:"1px solid rgba(6,182,212,0.2)" }}>
                    <p className="text-sm font-semibold" style=${{ color:"var(--drivex-neon-cyan)" }}>Напишите @${botName} в Telegram</p>
                    <p className="text-xs mt-1" style=${{ color:"var(--drivex-silver)" }}>Отправьте боту номер <strong>${phone}</strong> — он пришлёт код.</p>
                  </div>
                ` : null}
                ${otpTestCode ? html`
                  <div className="rounded-2xl p-3 text-center" style=${{ background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.25)" }}>
                    <p className="text-xs" style=${{ color:"#fbbf24" }}>DEV: код <strong>${otpTestCode}</strong></p>
                  </div>
                ` : null}
                <label className="block">
                  <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>6-значный код</span>
                  <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6"
                    className="w-full mt-2 p-4 rounded-2xl dx-input text-3xl text-center tracking-[0.5em] font-bold"
                    value=${otp} onInput=${(e) => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                    placeholder="000000" autofocus />
                </label>
                <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy || otp.length < 6}>
                  ${busy ? "Проверяем..." : "Подтвердить →"}
                </button>
                <button type="button" className="w-full py-2 text-sm" style=${{ color:"var(--drivex-silver)",background:"transparent",border:"none",cursor:"pointer" }}
                  onClick=${() => { setStep("phone"); setOtp(""); setOtpTestCode(""); setNeedTelegram(false); }}>
                  ← Изменить номер
                </button>
              </form>
            ` : null}

            <!-- ── ПРОФИЛЬ ─────────────────────────────────────── -->
            ${step === "profile" ? html`
              <form className="glass-card-light rounded-3xl p-5 space-y-4" onSubmit=${handleSaveProfile}>
                <label className="block">
                  <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>Ваше имя</span>
                  <input type="text" className="w-full mt-2 p-4 rounded-2xl dx-input"
                    value=${fullName} onInput=${(e) => setFullName(e.target.value)}
                    placeholder="Имя и фамилия" autocomplete="name" autofocus />
                </label>
                <p className="text-xs px-1" style=${{ color:"var(--drivex-silver)" }}>
                  Телефон <strong style=${{ color:"var(--drivex-white)" }}>${verifiedPhone}</strong> подтверждён ✓
                </p>
                <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy || !fullName.trim()}>
                  ${busy ? "Сохраняем..." : "Продолжить →"}
                </button>
              </form>
            ` : null}

            <!-- ── МАШИНА ──────────────────────────────────────── -->
            ${step === "car" ? html`
              <form className="glass-card-light rounded-3xl p-5 space-y-4" onSubmit=${handleAddCar}>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>Марка</span>
                    <select className="w-full mt-2 p-4 rounded-2xl dx-input" value=${carMake}
                      onChange=${(e) => { setCarMake(e.target.value); setCarModel(""); }}>
                      <option value="">Выбрать...</option>
                      ${carOptions.map((o) => html`<option key=${o.make} value=${o.make}>${o.make}</option>`)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>Модель</span>
                    <select className="w-full mt-2 p-4 rounded-2xl dx-input" value=${carModel}
                      onChange=${(e) => setCarModel(e.target.value)} disabled=${!carMake}>
                      <option value="">Выбрать...</option>
                      ${selectedMakeModels.map((m) => html`<option key=${m} value=${m}>${m}</option>`)}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-semibold" style=${{ color:"var(--drivex-silver)" }}>Год выпуска</span>
                  <input type="number" className="w-full mt-2 p-4 rounded-2xl dx-input"
                    value=${carYear} onInput=${(e) => setCarYear(e.target.value)}
                    placeholder="2018" min="1990" max=${new Date().getFullYear()} />
                </label>
                <button type="submit" className="w-full py-4 rounded-2xl font-bold dx-btn" disabled=${busy || !carMake || !carModel}>
                  ${busy ? "Добавляем..." : "Добавить авто"}
                </button>
                <button type="button" className="w-full py-3 rounded-2xl text-sm font-semibold"
                  style=${{ color:"var(--drivex-silver)",background:"transparent",cursor:"pointer" }}
                  onClick=${handleSkipCar}>Пропустить →</button>
              </form>
            ` : null}

          </div>
        </div>
      </div>
    `;
  }

    const BuyerPhoneAuthScreen = BuyerAuthScreen;

  function ProfileScreen({ notificationsCount, profile, documents, documentsTotalCount, maintenance, ordersCount, onLogout }) {
    const fallbackProfile = createDefaultBuyerProfile();
    const name = profile?.name || fallbackProfile.name;
    const phone = profile?.phone || fallbackProfile.phone;
    const email = profile?.email || fallbackProfile.email;
    const avatar = profile?.avatar || "";

    const docs = documents && typeof documents === "object" ? documents : {};
    const licenseReady = docs.license ? 1 : 0;
    const vehicleDocsCount = garageCars.reduce((sum, car) => {
      const carDocs = docs.cars && docs.cars[car.id] ? docs.cars[car.id] : {};
      return sum + (carDocs.registration ? 1 : 0) + (carDocs.inspection ? 1 : 0);
    }, 0);
    const maintenanceRecordsCount = countMaintenanceRecords(maintenance);
    const smartCareTasks = buildSmartCareTasks(maintenance);

    const sections = [
      {
        title: "Мой автопарк",
        items: [
          { icon: "car", label: "Мои автомобили", path: "/garage", badge: String(garageCars.length) },
          {
            icon: "folder",
            label: "Документы",
            path: "/documents",
            badge: documentsTotalCount ? String(documentsTotalCount) : null
          },
          {
            icon: "wrench",
            label: "Журнал обслуживания",
            path: "/maintenance",
            badge: maintenanceRecordsCount ? String(maintenanceRecordsCount) : null
          },
          { icon: "scan", label: "Умный уход", path: "/smart-care", badge: smartCareTasks.length ? String(smartCareTasks.length) : null }
        ]
      },
      {
        title: "Заказы и услуги",
        items: [
          {
            icon: "bag",
            label: "История заказов",
            path: "/orders",
            badge: ordersCount ? String(ordersCount) : null
          },
          { icon: "map", label: "История поездок", path: "/trips", badge: null },
          {
            icon: "map",
            label: "Сохранённые места",
            path: "/saved-locations",
            badge: String(savedPlaces.length)
          }
        ]
      },
      {
        title: "Аккаунт",
        items: [
          {
            icon: "bell",
            label: "Уведомления",
            path: "/notifications",
            badge: String(notificationsCount)
          },
          { icon: "card", label: "Платёжные данные", path: "/payment", badge: null },
          { icon: "star", label: "Бонусная программа", path: "/bonus", badge: null },
          { icon: "copy", label: "Пригласить друзей", path: "/invite", badge: null },
          { icon: "lock", label: "Профиль и безопасность", path: "/profile-security", badge: null },
          { icon: "settings", label: "Настройки приложения", path: "/settings", badge: null },
          { icon: "wrench", label: "Помощь и поддержка", path: "/help", badge: null }
        ]
      }
    ];

    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <div
          className="relative pt-12 pb-8 px-6 overflow-hidden"
          style=${{ background: "var(--gradient-dark)" }}
        >
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl"
              style=${{ background: "var(--drivex-neon-cyan)" }}
            ></div>
          </div>

          <div className="relative z-10">
            <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
              <div className="flex items-center gap-4 mb-6">
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
                    : html`<${Icon} name="user" size=${40} />`}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1" style=${{ color: "var(--drivex-white)" }}>
                    ${name}
                  </h2>
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    ${phone}
                  </p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    ${email}
                  </p>
                  <a
                    href="#/profile-edit"
                    className="inline-flex items-center gap-2 mt-3 text-xs font-semibold"
                    style=${{ color: "var(--drivex-neon-cyan)" }}
                  >
                    <${Icon} name="edit" size=${16} /> Редактировать
                  </a>
                </div>
                <a
                  href="#/settings"
                  className="p-2 rounded-xl"
                  style=${{ color: "var(--drivex-neon-cyan)" }}
                  aria-label="Настройки"
                >
                  <${Icon} name="settings" size=${24} />
                </a>
              </div>

              <a
                href="#/documents"
                className="glass-card-light rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.01]"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style=${{
                    background: "rgba(6, 182, 212, 0.18)",
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="folder" size=${26} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                      Документы
                    </p>
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-bold"
                      style=${{
                        background: "rgba(14, 165, 233, 0.16)",
                        color: "var(--drivex-electric-blue)"
                      }}
                    >
                      ${documentsTotalCount}
                    </span>
                  </div>

                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                    Права: ${licenseReady ? "загружены" : "не добавлены"} • На машины: ${vehicleDocsCount}
                  </p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Техпаспорт и техосмотр хранятся отдельно по каждой машине
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          ${sections.map(
            (section, sectionIdx) => html`
              <div key=${sectionIdx} className="mb-6">
                <h3 className="text-sm font-semibold mb-3 px-2" style=${{ color: "var(--drivex-silver)" }}>
                  ${section.title}
                </h3>
                <div className="glass-card-light rounded-2xl overflow-hidden">
                  ${section.items.map((item, idx) => {
                    const divider =
                      idx < section.items.length - 1
                        ? { borderBottom: "1px solid var(--glass-border)" }
                        : null;
                    return html`
                      <a
                        key=${item.path}
                        href=${`#${item.path}`}
                        className="flex items-center gap-4 p-4 transition-all hover:bg-opacity-80"
                        style=${divider}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style=${{
                            background: "rgba(14, 165, 233, 0.2)",
                            color: "var(--drivex-electric-blue)"
                          }}
                        >
                          <${Icon} name=${item.icon} size=${20} />
                        </div>
                        <span className="flex-1" style=${{ color: "var(--drivex-white)" }}>
                          ${item.label}
                        </span>
                        ${item.badge
                          ? html`<span
                              className="px-2 py-1 rounded-lg text-xs font-bold"
                              style=${{
                                background: "rgba(239, 68, 68, 0.2)",
                                color: "var(--drivex-danger)"
                              }}
                            >
                              ${item.badge}
                            </span>`
                          : null}
                      </a>
                    `;
                  })}
                </div>
              </div>
            `
          )}
          ${onLogout
            ? html`
                <button
                  type="button"
                  className="w-full py-4 rounded-2xl font-bold"
                  style=${{ background: "rgba(239, 68, 68, 0.14)", color: "var(--drivex-danger)" }}
                  onClick=${onLogout}
                >
                  Выйти
                </button>
              `
            : null}
        </div>
      </div>
    `;
  }

  function DocumentsVaultScreen({ documents, totalCount, authStatus }) {
    const docs = documents && typeof documents === "object" ? documents : {};
    const safeTotal = Number.isFinite(Number(totalCount)) ? Number(totalCount) : 0;
    const licenseReady = Boolean(docs.license);
    const cloudEnabled = authStatus && authStatus.mode === "supabase";

    return html`
      <${SimplePage} title="Документы" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              Хранилище документов водителя
            </p>
            <p className="text-3xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
              ${safeTotal}
            </p>
            <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                ${cloudEnabled
                  ? "Документы сохраняются в облаке и доступны под вашей учётной записью."
                  : "Фото документов сохранено на этом устройстве"}
            </p>
          </div>

          <a
            href="#/documents/license"
            className="glass-card-light rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.01]"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style=${{
                background: "rgba(6, 182, 212, 0.2)",
                color: "var(--drivex-neon-cyan)"
              }}
            >
              <${Icon} name="user" size=${22} />
            </div>
            <div className="flex-1">
              <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                Права
              </p>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Один общий документ водителя
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-xl text-xs font-bold"
              style=${{
                background: licenseReady ? "rgba(16, 185, 129, 0.16)" : "rgba(148, 163, 184, 0.16)",
                color: licenseReady ? "var(--drivex-success)" : "var(--drivex-silver)"
              }}
            >
              ${licenseReady ? "Есть" : "Пусто"}
            </span>
          </a>

          <div>
            <h2 className="text-xl font-bold mb-3" style=${{ color: "var(--drivex-white)" }}>
              По машинам
            </h2>
            <div className="space-y-3">
              ${garageCars.map((car) => {
                const carDocs = docs.cars && docs.cars[car.id] ? docs.cars[car.id] : {};
                const registrationReady = Boolean(carDocs.registration);
                const inspectionReady = Boolean(carDocs.inspection);
                const readyCount = (registrationReady ? 1 : 0) + (inspectionReady ? 1 : 0);

                return html`
                  <a
                    key=${car.id}
                    href=${`#/documents/car/${car.id}`}
                    className="glass-card-light rounded-2xl p-4 block transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style=${{
                          background: "rgba(14, 165, 233, 0.2)",
                          color: "var(--drivex-electric-blue)"
                        }}
                      >
                        <${Icon} name="car" size=${22} />
                      </div>

                      <div className="flex-1">
                        <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                          ${car.name}
                        </p>
                        <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                          ${car.plate} • ${car.year}
                        </p>
                      </div>

                      <span
                        className="px-3 py-1 rounded-xl text-xs font-bold"
                        style=${{
                          background: "rgba(14, 165, 233, 0.16)",
                          color: "var(--drivex-electric-blue)"
                        }}
                      >
                        ${readyCount}/2
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2 flex-wrap">
                      <span
                        className="px-3 py-1 rounded-xl text-xs font-bold"
                        style=${{
                          background: registrationReady ? "rgba(14, 165, 233, 0.16)" : "rgba(148, 163, 184, 0.12)",
                          color: registrationReady ? "var(--drivex-electric-blue)" : "var(--drivex-silver)"
                        }}
                      >
                        Техпаспорт: ${registrationReady ? "есть" : "нет"}
                      </span>
                      <span
                        className="px-3 py-1 rounded-xl text-xs font-bold"
                        style=${{
                          background: inspectionReady ? "rgba(245, 158, 11, 0.16)" : "rgba(148, 163, 184, 0.12)",
                          color: inspectionReady ? "var(--drivex-warning)" : "var(--drivex-silver)"
                        }}
                      >
                        Техосмотр: ${inspectionReady ? "есть" : "нет"}
                      </span>
                    </div>
                  </a>
                `;
              })}
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-4">
            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
              ${cloudEnabled
                ? "Документы сохраняются в облаке через Supabase и привязаны к вашему аккаунту."
                : "Данные сохраняются локально. Если очистить данные браузера, документы нужно будет загрузить заново."}
            </p>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function LicenseDocumentScreen({ document, onSave, onRemove }) {
    const toast = useToast();
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);

    const openPicker = useCallback(() => {
      if (busy) return;
      inputRef.current && inputRef.current.click();
    }, [busy]);

    const onFileChange = useCallback(
      async (e) => {
        const file = e?.target?.files && e.target.files[0];
        if (e && e.target) e.target.value = "";
        if (!file) return;

        setBusy(true);
        try {
          let fileUrl = "";
          // Пробуем загрузить в Supabase Storage → documents
          const client = getSupabaseClient();
          const cfg = window.DRIVEX_SUPABASE_CONFIG || {};
          const bucket = (cfg.buckets && cfg.buckets.documents) || "documents";
          if (client) {
            const { data: { user } } = await client.auth.getUser().catch(() => ({ data: {} }));
            if (user) {
              const ext = file.name.split(".").pop() || "jpg";
              const filePath = `${user.id}/license/${Date.now()}.${ext}`;
              const { error: uploadErr } = await client.storage.from(bucket).upload(filePath, file, { upsert: true, contentType: file.type });
              if (!uploadErr) {
                const { data: urlData } = client.storage.from(bucket).getPublicUrl(filePath);
                fileUrl = urlData.publicUrl;
                // Сохраняем в таблицу documents
                await client.from("documents").insert({
                  user_id: user.id,
                  doc_type: "license",
                  file_url: fileUrl,
                  file_name: file.name,
                  mime_type: file.type
                }).catch(() => {});
              }
            }
          }

          // Fallback: dataURL
          if (!fileUrl) {
            const image = await prepareDocumentDataUrl(file, { maxSize: 1400, quality: 0.86 });
            if (!image) { toast.push("Не удалось загрузить фото"); setBusy(false); return; }
            fileUrl = image;
          }

          onSave &&
            onSave({
              id: genId("doc"),
              name: String(file.name || "Права"),
              image: fileUrl,
              fileUrl,
              addedAt: Date.now()
            });
          toast.push("Права сохранены");
        } catch (err) {
          if (String(err && err.message) === "File too large") {
            toast.push("Файл слишком большой (до 8 МБ)");
          } else if (String(err && err.message) === "Image too large") {
            toast.push("Изображение слишком большое после сжатия");
          } else {
            toast.push("Не удалось загрузить фото");
          }
        }
        setBusy(false);
      },
      [onSave, toast]
    );

    const removeDocument = useCallback(() => {
      onRemove && onRemove();
      toast.push("Документ удалён");
    }, [onRemove, toast]);

    return html`
      <${SimplePage} title="Права" backPath="/documents">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style=${{
                  background: "rgba(6, 182, 212, 0.2)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                <${Icon} name="user" size=${22} />
              </div>
              <div>
                <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Водительское удостоверение
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Один общий документ для профиля водителя
                </p>
              </div>
            </div>
          </div>

          ${document
            ? html`
                <div className="glass-card-light rounded-2xl p-4">
                  <img
                    src=${document.image}
                    alt=${document.name || "Права"}
                    style=${{ width: "100%", borderRadius: "16px", display: "block" }}
                  />
                  <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                    ${document.name || "Права"}
                  </p>
                </div>
              `
            : html`
                <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
                  Здесь можно хранить одно фото прав.
                </div>
              `}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="py-4 rounded-2xl font-bold dx-btn"
              onClick=${openPicker}
              disabled=${busy}
            >
              ${document ? "Заменить" : "Добавить"}
            </button>
            ${document
              ? html`
                  <button
                    type="button"
                    className="py-4 rounded-2xl font-bold"
                    style=${{
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "var(--drivex-danger)"
                    }}
                    onClick=${removeDocument}
                  >
                    Удалить
                  </button>
                `
              : html`
                  <div
                    className="py-4 rounded-2xl font-bold text-center"
                    style=${{ background: "var(--glass-bg)", color: "var(--drivex-silver)" }}
                  >
                    Пока пусто
                  </div>
                `}
          </div>

          <input
            ref=${inputRef}
            type="file"
            accept="image/*"
            style=${{ display: "none" }}
            onChange=${onFileChange}
          />
        </div>
      </${SimplePage}>
    `;
  }

  function CarDocumentsScreen({ carId, documents, onSaveDocument, onRemoveDocument, onSelectCar }) {
    const toast = useToast();
    const car = findGarageCar(carId);
    const docs = documents && typeof documents === "object" ? documents : {};
    const carDocs = car && docs.cars && docs.cars[car.id] ? docs.cars[car.id] : {};
    const inputRefs = useRef({});
    const [busyKind, setBusyKind] = useState("");

    useEffect(() => {
      if (car && onSelectCar) onSelectCar(car.id);
    }, [car, onSelectCar]);

    if (!car) {
      return html`
        <${SimplePage} title="Машина не найдена" backPath="/documents">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Попробуйте открыть документы другой машины.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const openPicker = useCallback(
      (kind) => {
        if (busyKind) return;
        if (inputRefs.current[kind]) inputRefs.current[kind].click();
      },
      [busyKind]
    );

    const saveKind = useCallback(
      async (kind, e) => {
        const file = e?.target?.files && e.target.files[0];
        if (e && e.target) e.target.value = "";
        if (!file) return;

        setBusyKind(kind);
        try {
          let fileUrl = "";
          const client = getSupabaseClient();
          const cfg = window.DRIVEX_SUPABASE_CONFIG || {};
          const bucket = (cfg.buckets && cfg.buckets.documents) || "documents";

          if (client) {
            const { data: { user } } = await client.auth.getUser().catch(() => ({ data: {} }));
            if (user) {
              const ext = file.name.split(".").pop() || "jpg";
              const filePath = `${user.id}/${car.id}/${kind}/${Date.now()}.${ext}`;
              const { error: uploadErr } = await client.storage.from(bucket).upload(filePath, file, { upsert: true, contentType: file.type });
              if (!uploadErr) {
                const { data: urlData } = client.storage.from(bucket).getPublicUrl(filePath);
                fileUrl = urlData.publicUrl;
                await client.from("documents").insert({
                  user_id: user.id,
                  car_id: car.id,
                  doc_type: kind,
                  file_url: fileUrl,
                  file_name: file.name,
                  mime_type: file.type
                }).catch(() => {});
              }
            }
          }

          if (!fileUrl) {
            const image = await prepareDocumentDataUrl(file, { maxSize: 1400, quality: 0.86 });
            if (!image) { toast.push("Не удалось загрузить фото"); setBusyKind(""); return; }
            fileUrl = image;
          }

          onSaveDocument &&
            onSaveDocument(car.id, kind, {
              id: genId("doc"),
              name: String(file.name || `${kind}-${car.name}`),
              image: fileUrl,
              fileUrl,
              addedAt: Date.now()
            });
          toast.push("Документ сохранён");
        } catch (err) {
          if (String(err && err.message) === "File too large") {
            toast.push("Файл слишком большой (до 8 МБ)");
          } else {
            toast.push("Не удалось загрузить фото");
          }
        }
        setBusyKind("");
      },
      [car.id, car.name, onSaveDocument, toast]
    );

    return html`
      <${SimplePage} title=${car.name} backPath="/documents">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style=${{
                  background: "rgba(14, 165, 233, 0.2)",
                  color: "var(--drivex-electric-blue)"
                }}
              >
                <${Icon} name="car" size=${22} />
              </div>
              <div>
                <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                  ${car.name}
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  ${car.plate} • ${car.year} • ${car.mileage}
                </p>
              </div>
            </div>
          </div>

          ${vehicleDocumentKinds.map((kind) => {
            const doc = carDocs[kind.id] || null;
            const isBusy = busyKind === kind.id;

            return html`
              <div key=${kind.id} className="glass-card-light rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style=${{ background: alphaBg(kind.color, 0.2), color: kind.color }}
                    >
                      <${Icon} name=${kind.icon} size=${22} />
                    </div>
                    <div>
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${kind.title}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        ${kind.subtitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className="px-3 py-1 rounded-xl text-xs font-bold"
                    style=${{
                      background: doc ? alphaBg(kind.color, 0.18) : "rgba(148, 163, 184, 0.12)",
                      color: doc ? kind.color : "var(--drivex-silver)"
                    }}
                  >
                    ${doc ? "Есть" : "Нет"}
                  </span>
                </div>

                ${doc
                  ? html`
                      <div className="mt-4">
                        <img
                          src=${doc.image}
                          alt=${doc.name || kind.title}
                          style=${{ width: "100%", borderRadius: "16px", display: "block" }}
                        />
                        <p className="text-sm mt-3" style=${{ color: "var(--drivex-silver)" }}>
                          ${doc.name || kind.title}
                        </p>
                      </div>
                    `
                  : html`
                      <div className="mt-4 rounded-2xl p-4" style=${{ background: "var(--glass-bg)" }}>
                        <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                          Фото ещё не добавлено.
                        </p>
                      </div>
                    `}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    className="py-3 rounded-2xl font-bold dx-btn"
                    onClick=${() => openPicker(kind.id)}
                    disabled=${Boolean(busyKind)}
                  >
                    ${doc ? "Заменить" : "Добавить"}
                  </button>

                  ${doc
                    ? html`
                        <button
                          type="button"
                          className="py-3 rounded-2xl font-bold"
                          style=${{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "var(--drivex-danger)"
                          }}
                          onClick=${() => {
                            onRemoveDocument && onRemoveDocument(car.id, kind.id);
                            toast.push("Документ удалён");
                          }}
                        >
                          Удалить
                        </button>
                      `
                    : html`
                        <div
                          className="py-3 rounded-2xl font-bold text-center"
                          style=${{ background: "var(--glass-bg)", color: "var(--drivex-silver)" }}
                        >
                          ${isBusy ? "Загрузка..." : "Пока пусто"}
                        </div>
                      `}
                </div>

                <input
                  ref=${(node) => {
                    inputRefs.current[kind.id] = node;
                  }}
                  type="file"
                  accept="image/*"
                  style=${{ display: "none" }}
                  onChange=${(e) => saveKind(kind.id, e)}
                />
              </div>
            `;
          })}
        </div>
      </${SimplePage}>
    `;
  }

  function ServiceBookingScreen({
    serviceId,
    serviceDirectory,
    profile,
    activeCarId,
    onSelectCar,
    currentCenter,
    appointments,
    onSubmitBooking
  }) {
    const toast = useToast();
    const runtimeServices =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item));
    const service = runtimeServices.find((item) => String(item.id) === String(serviceId)) || null;
    const safeProfile = profile && typeof profile === "object" ? profile : createDefaultBuyerProfile();
    const fallbackCar = findGarageCar(activeCarId) || garageCars[0] || null;
    const currentCatalogService = createCatalogServiceFromCenter(currentCenter, {
      appointments
    });
    const isCrmBacked =
      Boolean(service?.isRegisteredCenter) &&
      Boolean(currentCatalogService) &&
      String(currentCatalogService.id) === String(service?.id);
    const safeCenter = isCrmBacked ? normalizeServiceCenter(currentCenter) : null;
    const appointmentPool = isCrmBacked
      ? normalizeServiceAppointmentsList(appointments, safeCenter?.id).filter((item) => !isDemoServiceAppointment(item))
      : [];
    const defaultDate = getFutureLocalISODate(1);
    const [clientName, setClientName] = useState(() => safeProfile.name || "");
    const [clientPhone, setClientPhone] = useState(() => safeProfile.phone || "");
    const [carId, setCarId] = useState(() => fallbackCar?.id || (garageCars[0]?.id || ""));
    const [day, setDay] = useState(defaultDate);
    const [workLabel, setWorkLabel] = useState(() => service?.type || service?.category || "Диагностика");
    const [note, setNote] = useState("");
    const [submittedRequest, setSubmittedRequest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inlineError, setInlineError] = useState("");
    const selectedCar = findGarageCar(carId) || fallbackCar || garageCars[0] || null;
    const availableSlotOptions = buildServiceBookingSlotOptions({
      service,
      center: safeCenter,
      appointments: appointmentPool,
      day
    }).filter((slot) => slot.available);
    const [time, setTime] = useState(() => availableSlotOptions[0]?.value || "10:00");

    useEffect(() => {
      const nextCar = findGarageCar(activeCarId) || garageCars[0] || null;
      setClientName(safeProfile.name || "");
      setClientPhone(safeProfile.phone || "");
      setCarId(nextCar?.id || (garageCars[0]?.id || ""));
      setDay(getFutureLocalISODate(1));
      setWorkLabel(service?.type || service?.category || "Диагностика");
      setNote("");
      setSubmittedRequest(null);
      setInlineError("");
    }, [activeCarId, safeProfile.name, safeProfile.phone, service?.id, service?.type, service?.category]);

    useEffect(() => {
      if (!availableSlotOptions.length) {
        setTime("");
        return;
      }

      if (!availableSlotOptions.some((slot) => slot.value === time)) {
        setTime(availableSlotOptions[0].value);
      }
    }, [availableSlotOptions, time]);

    if (!service) {
      return html`
        <${SimplePage} title="Запись не найдена" backPath="/services">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Сервис не найден. Попробуйте открыть запись из каталога заново.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const handleSubmit = async (event) => {
      event.preventDefault();

      if (!clientName.trim() || !clientPhone.trim()) {
        setInlineError("Укажите имя и телефон для записи.");
        return;
      }

      if (!workLabel.trim()) {
        setInlineError("Напишите, что нужно сделать по машине.");
        return;
      }

      if (!day || !parseISODate(day)) {
        setInlineError("Выберите дату записи.");
        return;
      }

      if (!time) {
        setInlineError("На этот день нет свободных слотов. Выберите другую дату.");
        return;
      }

      setInlineError("");
      setIsSubmitting(true);

      try {
        const request = await onSubmitBooking?.({
          serviceId: String(service.id),
          serviceName: service.name,
          city: service.city,
          address: service.address || service.locationLabel,
          phone: service.phone,
          day,
          time,
          clientName,
          clientPhone,
          carId: selectedCar?.id || "",
          carLabel: [
            selectedCar?.name,
            selectedCar?.plate
          ].filter(Boolean).join(" • "),
          workLabel,
          note
        });

        if (request?.carId && onSelectCar) {
          onSelectCar(request.carId);
        }
        navigateToHash("/maintenance");
      } catch (error) {
        const message = error?.message || "Не удалось отправить запись";
        setInlineError(message);
        toast.push(message);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (submittedRequest) {
      return html`
        <${SimplePage} title="Запись принята" backPath=${`/service/${service.id}`}>
          <div className="px-6 py-6 space-y-4">
            <div className="glass-card-light rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style=${{
                    background: "rgba(16, 185, 129, 0.18)",
                    color: "var(--drivex-success)"
                  }}
                >
                  <${Icon} name="check" size=${26} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                    ${service.name}
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                    ${normalizeServiceRequestStatusId(submittedRequest.status) === "accepted"
                      ? `Сервис подтвердил запись на ${formatRuDate(submittedRequest.day)} в ${submittedRequest.time}.`
                      : `Заявка на ${formatRuDate(submittedRequest.day)} в ${submittedRequest.time} отправлена — сервис подтвердит её в ближайшее время.`}
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                    ${submittedRequest.clientName}${submittedRequest.carLabel ? ` • ${submittedRequest.carLabel}` : ""}
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-4 mt-5">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${submittedRequest.workLabel}
                </p>
                ${submittedRequest.note
                  ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                      ${submittedRequest.note}
                    </p>`
                  : null}
              </div>

              <div className="glass-card rounded-3xl p-4 mt-4">
                <p className="text-xs font-semibold tracking-[0.16em]" style=${{ color: "var(--drivex-silver)" }}>
                  СТАТУС ЗАЯВКИ
                </p>
                <div className="mt-4">
                  <${ServiceRequestStatusTimeline} status=${submittedRequest.status} />
                </div>
              </div>

              <div className="mt-5 flex gap-3 flex-wrap">
                <a href=${`#/service/${service.id}`} className="px-5 py-3 rounded-2xl text-sm font-semibold dx-btn">
                  К сервису
                </a>
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl text-sm font-semibold"
                  style=${{
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "var(--drivex-white)"
                  }}
                  onClick=${() => setSubmittedRequest(null)}
                >
                  Изменить запись
                </button>
              </div>
            </div>

            ${isCrmBacked
              ? html`<div className="glass-card rounded-3xl p-5">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                    Эта запись уже появилась у сервиса в CRM: в расписании и в списке ремонтов.
                  </p>
                </div>`
              : null}
          </div>
        </${SimplePage}>
      `;
    }

    return html`
      <${SimplePage} title="Запись в сервис" backPath=${`/service/${service.id}`}>
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                  ${service.name}
                </p>
                ${service.city || service.address
                  ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      ${[service.city, service.address || service.locationLabel].filter(Boolean).join(" • ")}
                    </p>`
                  : null}
              </div>
              ${service.phone
                ? html`<${ServicePhoneButton} phone=${service.phone} compact=${true} label="Позвонить в сервис" />`
                : null}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              ${[
                service.type || service.category,
                service.workingHours,
                service.distance
              ]
                .filter(Boolean)
                .map((chip) => html`
                  <span
                    key=${chip}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style=${{
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--drivex-silver)"
                    }}
                  >
                    ${chip}
                  </span>
                `)}
            </div>
          </div>

          <form className="space-y-4" onSubmit=${handleSubmit}>
            <div className="glass-card-light rounded-3xl p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <${SellerField} label="Ваше имя">
                  <${SellerInput}
                    value=${clientName}
                    placeholder="Как к вам обращаться"
                    onInput=${(e) => setClientName(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Телефон">
                  <${SellerInput}
                    value=${clientPhone}
                    placeholder="+992 ..."
                    onInput=${(e) => setClientPhone(e.target.value)}
                  />
                </${SellerField}>
                ${garageCars.length
                  ? html`<${SellerField} label="Машина">
                      <${SellerSelect}
                        value=${carId}
                        onChange=${(e) => setCarId(e.target.value)}
                      >
                        ${garageCars.map((car) => html`
                          <option key=${car.id} value=${car.id}>
                            ${car.name}${car.plate ? ` • ${car.plate}` : ""}
                          </option>
                        `)}
                      </${SellerSelect}>
                    </${SellerField}>`
                  : html`<${SellerField} label="Машина">
                      <div
                        className="rounded-xl px-4 py-3 text-sm"
                        style=${{ background: "rgba(255,255,255,0.05)", color: "var(--drivex-silver)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        В гараже пока нет машин — запись пройдёт без привязки к авто.${" "}
                        <a href="#/garage" style=${{ color: "var(--drivex-neon-cyan)" }}>Добавить машину</a>
                      </div>
                    </${SellerField}>`}
              </div>
            </div>

            <div className="glass-card-light rounded-3xl p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <${SellerField} label="Дата записи">
                  <${SellerInput}
                    type="date"
                    value=${day}
                    min=${toLocalISODate()}
                    onInput=${(e) => setDay(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField}
                  label="Время"
                  note=${availableSlotOptions.length ? `${availableSlotOptions.length} свободных слотов` : "Свободных слотов нет"}
                >
                  <${SellerSelect}
                    value=${time}
                    onChange=${(e) => setTime(e.target.value)}
                    disabled=${!availableSlotOptions.length}
                  >
                    ${availableSlotOptions.length
                      ? availableSlotOptions.map((slot) => html`
                          <option key=${slot.value} value=${slot.value}>
                            ${slot.label}
                          </option>
                        `)
                      : html`<option value="">Выберите другую дату</option>`}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Что нужно сделать">
                  <${SellerInput}
                    value=${workLabel}
                    placeholder="Например: замена масла и диагностика"
                    onInput=${(e) => setWorkLabel(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Комментарий" note="Необязательно">
                  <${SellerTextarea}
                    value=${note}
                    placeholder="Что важно учесть по машине или по времени"
                    onInput=${(e) => setNote(e.target.value)}
                  />
                </${SellerField}>
              </div>
            </div>

            ${inlineError
              ? html`<div className="glass-card rounded-3xl p-4" style=${{ color: "var(--drivex-warning)" }}>
                  ${inlineError}
                </div>`
              : null}

            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    Подтверждение
                  </p>
                  <p className="text-lg font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                    ${day && time ? `${formatRuDate(day)} • ${time}` : "Выберите дату и время"}
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                    Сервис получит имя, телефон, машину и описание работ.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled=${isSubmitting || !availableSlotOptions.length}
                  className="px-6 py-3 rounded-full text-sm font-semibold"
                  style=${{
                    minWidth: "172px",
                    background: isSubmitting || !availableSlotOptions.length
                      ? "rgba(14, 165, 233, 0.22)"
                      : "linear-gradient(135deg, #1fb7f3 0%, #0ea5e9 100%)",
                    color: "var(--drivex-white)",
                    opacity: isSubmitting || !availableSlotOptions.length ? 0.72 : 1
                  }}
                >
                  ${isSubmitting ? "Отправляем..." : "Подтвердить запись"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </${SimplePage}>
    `;
  }


  // ── Export to DX.screens (chain: app-main.js читает отсюда) ──
  DX.screens = DX.screens || {};
  if (typeof MemoProductCard !== 'undefined') DX.screens['MemoProductCard'] = MemoProductCard;
  if (typeof MemoProductGrid !== 'undefined') DX.screens['MemoProductGrid'] = MemoProductGrid;
  if (typeof AIAssistantScreen !== 'undefined') DX.screens['AIAssistantScreen'] = AIAssistantScreen;
  if (typeof BuyerAuthScreen !== 'undefined') DX.screens['BuyerAuthScreen'] = BuyerAuthScreen;
  if (typeof CarDocumentsScreen !== 'undefined') DX.screens['CarDocumentsScreen'] = CarDocumentsScreen;
  if (typeof CartBadge !== 'undefined') DX.screens['CartBadge'] = CartBadge;
  if (typeof CategoryRow !== 'undefined') DX.screens['CategoryRow'] = CategoryRow;
  if (typeof DocumentsVaultScreen !== 'undefined') DX.screens['DocumentsVaultScreen'] = DocumentsVaultScreen;
  if (typeof LicenseDocumentScreen !== 'undefined') DX.screens['LicenseDocumentScreen'] = LicenseDocumentScreen;
  if (typeof MarketAppNav !== 'undefined') DX.screens['MarketAppNav'] = MarketAppNav;
  if (typeof MarketAutoPickerScreen !== 'undefined') DX.screens['MarketAutoPickerScreen'] = MarketAutoPickerScreen;
  if (typeof MarketCatalogScreen !== 'undefined') DX.screens['MarketCatalogScreen'] = MarketCatalogScreen;
  if (typeof MarketOrdersScreen !== 'undefined') DX.screens['MarketOrdersScreen'] = MarketOrdersScreen;
  if (typeof MarketplacePage !== 'undefined') DX.screens['MarketplacePage'] = MarketplacePage;
  if (typeof MarketScreen !== 'undefined') DX.screens['MarketScreen'] = MarketScreen;
  if (typeof MarketSectionTitle !== 'undefined') DX.screens['MarketSectionTitle'] = MarketSectionTitle;
  if (typeof MarketStoreAvatar !== 'undefined') DX.screens['MarketStoreAvatar'] = MarketStoreAvatar;
  if (typeof MarketTopBar !== 'undefined') DX.screens['MarketTopBar'] = MarketTopBar;
  if (typeof ProductCard !== 'undefined') DX.screens['ProductCard'] = ProductCard;
  if (typeof ProductGrid !== 'undefined') DX.screens['ProductGrid'] = ProductGrid;
  if (typeof ProfileScreen !== 'undefined') DX.screens['ProfileScreen'] = ProfileScreen;
  if (typeof PromoBanner !== 'undefined') DX.screens['PromoBanner'] = PromoBanner;
  if (typeof SearchBar !== 'undefined') DX.screens['SearchBar'] = SearchBar;
  if (typeof ServiceBookingScreen !== 'undefined') DX.screens['ServiceBookingScreen'] = ServiceBookingScreen;
  if (typeof ServiceRequestStatusTimeline !== 'undefined') DX.screens['ServiceRequestStatusTimeline'] = ServiceRequestStatusTimeline;
  if (typeof ServicesScreen !== 'undefined') DX.screens['ServicesScreen'] = ServicesScreen;
  if (typeof StoreLabel !== 'undefined') DX.screens['StoreLabel'] = StoreLabel;
})();






