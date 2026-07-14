// Dashboard + SmartDashboard
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

  function DashboardScreen({ notificationsCount, profileName, serviceDirectory, activeCarId, maintenance }) {
    const safeName = String(profileName || "").trim();
    const firstName = safeName ? safeName.split(/\s+/)[0] : "Водитель";
    const nearbyList =
      serviceDirectory && Array.isArray(serviceDirectory.nearbyServices)
        ? serviceDirectory.nearbyServices
        : nearbyServices.map((item) => decorateServiceRecord(item));
    const servicePool =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item));
    const activeCar = findGarageCar(activeCarId);
    const personalizedServices = getPersonalizedServices(servicePool, activeCarId).slice(0, 2);
    const featuredService = personalizedServices[0] || servicePool[0] || nearbyList[0];
    const secondaryService =
      nearbyList.find((service) => String(service.id) !== String(featuredService?.id)) || personalizedServices[1] || nearbyList[1];
    const nearbyPreview = nearbyList.slice(0, 3);

    // Скрытые напоминания — строго локально (это выбор конкретного устройства,
    // не синкается в облако; id задачи включает машину и тип, так что при
    // изменении состояния задача появится снова под новым содержимым).
    const [dismissedReminders, setDismissedReminders] = useState(() => {
      try {
        const raw = window.localStorage.getItem("drivex.dismissed-reminders.v1");
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    });
    const dismissReminder = (id) => {
      if (!id) return;
      setDismissedReminders((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id].slice(-30);
        try {
          window.localStorage.setItem("drivex.dismissed-reminders.v1", JSON.stringify(next));
        } catch {
          // локальный кеш — не критично
        }
        return next;
      });
    };
    const reminders = buildSmartCareTasks(maintenance, activeCarId)
      .filter((task) => !dismissedReminders.includes(task.id));

    return html`
      <div className="home-redesign min-h-screen">
        <div className="home-redesign-bg"></div>
        <div className="home-redesign-inner">
          <header className="home-redesign-header">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="home-brand text-glow-cyan"
                  style=${{ color: "var(--drivex-white)" }}
                >
                  DRIVEX
                </h1>
                <p className="home-greeting" style=${{ color: "var(--drivex-silver)" }}>
                  Добро пожаловать, ${firstName}
                </p>
              </div>

              <a
                href="#/notifications"
                className="home-notification"
                aria-label="Уведомления"
              >
                <span style=${{ color: "var(--drivex-white)" }}>
                  <${Icon} name="bell" size=${18} />
                </span>
                ${notificationsCount > 0
                  ? html`<span
                      className="absolute top-2 right-2 w-2 h-2 rounded-full"
                      style=${{ background: "var(--drivex-danger)" }}
                    ></span>`
                  : null}
              </a>
            </div>

            <${SmartDashboard}
              profileName=${profileName}
              activeCarId=${activeCarId}
              maintenance=${maintenance}
            />
          </header>

          <main className="home-redesign-content">
            <section className="home-section">
              <h2 className="home-section-title">Быстрые действия</h2>
              <div className="home-quick-grid">
                ${quickActions.map(
                  (action) => html`
                    <a key=${action.path} href=${`#${action.path}`} className="home-quick-action">
                      <span
                        className="home-quick-icon"
                        style=${{
                          background: alphaBg(action.color, 0.14),
                          color: action.color
                        }}
                      >
                        <${Icon} name=${action.icon} size=${18} />
                      </span>
                      <span>${action.label}</span>
                    </a>
                  `
                )}
              </div>
            </section>

            ${featuredService
              ? html`<section className="home-section">
                  <div className="home-section-row">
                    <div>
                      <h2 className="home-section-title">Для твоей машины</h2>
                      <p className="home-section-subtitle">
                        ${activeCar ? `${activeCar.name} · ${activeCar.mileage}` : "Подобрано по рейтингу и расстоянию"}
                      </p>
                    </div>
                    <a href="#/services" className="home-section-link">Все сервисы</a>
                  </div>

                  <a href=${`#/service/${featuredService.id}`} className="home-featured-service">
                    <div className="home-featured-image">
                      <img src=${featuredService.image} alt=${featuredService.name} loading="lazy" />
                      <span className="home-image-badge">Лучший вариант рядом</span>
                    </div>
                    <div className="home-featured-body">
                      <div className="home-featured-top">
                        <div>
                          <p className="home-service-category">${featuredService.category || featuredService.type}</p>
                          <h3>${featuredService.name}</h3>
                        </div>
                        <span className="home-save-icon"><${Icon} name="star" size=${16} /></span>
                      </div>
                      <div className="home-meta-line">
                        <span>${featuredService.distance || featuredService.city || "Рядом"}</span>
                        ${(() => {
                          // Честные цифры: рейтинг и отзывы — только если отзывы
                          // реально есть (как на странице сервиса). Раньше тут были
                          // фейковые фолбэки «4.5» и «120 отзывов» для нового сервиса.
                          const count = Math.max(0, Math.round(Number(featuredService.reviews) || 0));
                          return count > 0
                            ? html`<span className="home-rating"><${Icon} name="star" size=${11} /> ${featuredService.rating}</span>
                                <span>${count} ${pluralize(count, "отзыв", "отзыва", "отзывов")}</span>`
                            : html`<span>Отзывов пока нет</span>`;
                        })()}
                      </div>
                      <div className="home-featured-chips">
                        <span><${Icon} name="car" size=${13} /> Подходит для ${activeCar?.name || "вашего авто"}</span>
                        <span><${Icon} name="coins" size=${13} /> ${featuredService.price || "Честные цены"}</span>
                      </div>
                      <div className="home-featured-footer">
                        <span className="home-open-dot">${featuredService.available !== false ? "Открыто сейчас" : "Сейчас закрыто"}</span>
                        <span className="home-book-button">Записаться</span>
                      </div>
                    </div>
                  </a>

                  ${secondaryService
                    ? html`<a href=${`#/service/${secondaryService.id}`} className="home-secondary-service">
                        <img src=${secondaryService.image} alt=${secondaryService.name} loading="lazy" />
                        <div>
                          <p>${secondaryService.category || secondaryService.type}</p>
                          <h3>${secondaryService.name}</h3>
                          <span>${[secondaryService.distance, Number(secondaryService.reviews) > 0 ? `★ ${secondaryService.rating}` : "Новый сервис"].filter(Boolean).join(" · ")}</span>
                        </div>
                        <span>Смотреть →</span>
                      </a>`
                    : null}
                </section>`
              : null}

            <section className="home-section">
              <div className="home-section-row">
                <h2 className="home-section-title">Рядом с вами</h2>
                <a href="#/map" className="home-section-link">Показать на карте</a>
              </div>

              <div className="home-nearby-list">
                ${nearbyPreview.map(
                  (service) => html`
                    <a key=${service.id} href=${`#/service/${service.id}`} className="home-nearby-card">
                      <span className="home-nearby-icon">
                        <${Icon} name=${service.category === "Шиномонтаж" ? "tire" : service.category === "Детейлинг" ? "wash" : "wrench"} size=${18} />
                      </span>
                      <div className="home-nearby-main">
                        <h3>${service.name}</h3>
                        <p>${service.type} · ${service.distance} · <span>${service.available ? "Открыто" : "Закрыто"}</span></p>
                      </div>
                      <div className="home-nearby-side">
                        ${Number(service.reviews) > 0
                          ? html`<span><${Icon} name="star" size=${10} /> ${service.rating}</span>`
                          : html`<span>Новый</span>`}
                        <b>Подробнее</b>
                      </div>
                    </a>
                  `
                )}
              </div>
            </section>

            <section className="home-section home-reminders-section">
              <div className="home-section-row">
                <h2 className="home-section-title">Напоминания</h2>
                <a href="#/smart-care" className="home-section-link">Все задачи</a>
              </div>

              <div className="home-reminder-grid">
                ${reminders.length
                  ? reminders.map((reminder) => {
                      // Иконка и действие — по ТИПУ задачи (id вида "<car>-oil" /
                      // "<car>-inspection"), а не по позиции в списке.
                      const isOil = String(reminder.id || "").includes("-oil");
                      return html`
                    <div key=${reminder.id} className="home-reminder-card">
                      <button type="button" aria-label="Скрыть" onClick=${() => dismissReminder(reminder.id)}>×</button>
                      <span className="home-reminder-icon">
                        <${Icon} name=${isOil ? "wrench" : "scan"} size=${18} />
                      </span>
                      <h3>${reminder.task}</h3>
                      <p>${reminder.dueDate}</p>
                      <a href=${isOil ? "#/services" : "#/smart-care"}>${isOil ? "Найти сервис" : "Проверить сроки"}</a>
                    </div>
                  `;
                    })
                  : html`
                      <div className="home-reminder-card">
                        <span className="home-reminder-icon">
                          <${Icon} name="car" size=${18} />
                        </span>
                        <h3>${garageCars.length ? "Нет срочных задач" : "Добавьте автомобиль"}</h3>
                        <p>${garageCars.length ? "Журнал обслуживания чистый" : "Умный уход начнёт работать после добавления машины"}</p>
                        <a href="#/garage">${garageCars.length ? "Открыть гараж" : "Добавить авто"}</a>
                      </div>
                    `}
              </div>
            </section>
          </main>
        </div>
      </div>
    `;
  }

  function MapScreen({ serviceDirectory }) {
    useEffect(() => {
      let instance = null;
      let cancelled = false;
      let retryId = 0;

      const mountMap = () => {
        if (cancelled || instance) return;
        const mapModule = window.DrivexMapScreen;
        if (!mapModule || typeof mapModule.mount !== "function") {
          retryId = window.setTimeout(mountMap, 120);
          return;
        }
        try {
          instance = mapModule.mount({
            containerId: "map-container",
            serviceDirectory
          });
        } catch (error) {
          const container = document.getElementById("map-container");
          if (container) {
            container.innerHTML = `
              <div class="dx-map-fallback">
                <h2>Карта временно недоступна</h2>
                <p>${String(error?.message || "Не удалось запустить карту.")}</p>
              </div>
            `;
          }
        }
      };

      mountMap();

      return () => {
        cancelled = true;
        window.clearTimeout(retryId);
        if (instance && typeof instance.destroy === "function") instance.destroy();
      };
    }, [serviceDirectory]);

    return html`
      <div id="map-container" className="dx-map-container" aria-label="Карта сервисов DriveX"></div>
    `;
  }


  // ── Export to DX.screens (chain: app-main.js читает отсюда) ──
  DX.screens = DX.screens || {};
  if (typeof DashboardScreen !== 'undefined') DX.screens['DashboardScreen'] = DashboardScreen;
  if (typeof MapScreen !== 'undefined') DX.screens['MapScreen'] = MapScreen;
})();
