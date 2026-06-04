// profile.js
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

  // ── Экспорт в DX.screens для app.js ──────────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.ProfileScreen = ProfileScreen;
})();
