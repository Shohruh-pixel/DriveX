// app/shared/ui.js — Navigation helpers, BottomNav, SimplePage, useHashPath
(() => {
  'use strict';
  const DX = window.DX;
  const { html, useState, useEffect } = DX;
  const Icon = DX.Icon;
  function navigateToHash(path) {
    const nextPath = String(path || "/");
    if (typeof window === "undefined") return;
    window.location.hash = nextPath.startsWith("#") ? nextPath : `#${nextPath}`;
  }

  function getHashPath() {
    const raw = (window.location.hash || "").replace(/^#/, "");
    const path = raw.split("?")[0].trim();
    if (!path) return "/";
    return path.startsWith("/") ? path : `/${path}`;
  }

  function normalizePath(path) {
    const trimmed = String(path || "/").split("?")[0].replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
  }

  function useHashPath() {
    const [path, setPath] = useState(() => normalizePath(getHashPath()));

    useEffect(() => {
      if (!window.location.hash) window.location.hash = "#/";
      const onChange = () => setPath(normalizePath(getHashPath()));
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    }, []);

    return path;
  }

  function BackHeader({ title, backPath }) {
    return html`
      <div className="pt-12 pb-6 px-6" style=${{ background: "var(--drivex-graphite)" }}>
        <div className="flex items-center gap-3 mb-6">
          <a
            href=${`#${backPath}`}
            className="p-2 rounded-xl glass-card-light"
            style=${{ color: "var(--drivex-neon-cyan)" }}
            aria-label="Назад"
          >
            <${Icon} name="chevron-left" size=${24} />
          </a>
          <h1 className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
            ${title}
          </h1>
        </div>
      </div>
    `;
  }

  function BottomNav({ activePath }) {
    const items = [
      { path: "/", icon: "home", label: "Главная" },
      { path: "/map", icon: "map", label: "Карта" },
      { path: "/services", icon: "wrench", label: "Сервисы" },
      { path: "/market", icon: "bag", label: "Маркет" },
      { path: "/profile", icon: "user", label: "Профиль" }
    ];

    return html`
      <nav
        id="bottom-nav"
        className="fixed bottom-0 left-0 right-0 glass-card border-t z-50"
        style=${{
          borderTopColor: "var(--glass-border)",
          maxWidth: "480px",
          margin: "0 auto"
        }}
      >
        <div className="flex items-center justify-around h-20 px-2">
          ${items.map((item) => {
            const isActive = activePath === item.path;
            return html`
              <a
                key=${item.path}
                className="nav-link flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 flex-1"
                href=${`#${item.path}`}
                data-nav=${item.path}
                data-active=${isActive ? "true" : "false"}
                aria-current=${isActive ? "page" : "false"}
                style=${{
                  color: isActive
                    ? "var(--drivex-neon-cyan)"
                    : "var(--drivex-silver)",
                  background: isActive ? "rgba(6, 182, 212, 0.1)" : "transparent"
                }}
              >
                <span className="nav-icon">
                  <${Icon}
                    name=${item.icon}
                    size=${24}
                    strokeWidth=${isActive ? 2.5 : 2}
                    className=${isActive ? "neon-glow-cyan" : ""}
                  />
                </span>
                <span className="text-xs font-medium">${item.label}</span>
              </a>
            `;
          })}
        </div>
      </nav>
    `;
  }

  function PlaceholderPage({ title, backPath }) {
    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <${BackHeader} title=${title} backPath=${backPath} />
        <div className="px-6 py-6">
          <div className="glass-card-light rounded-2xl p-5">
            <p className="text-sm" style=${{ color: "var(--drivex-white)" }}>
              Экран в разработке. Это демо-прототип.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function SimplePage({ title, backPath, children }) {
    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <${BackHeader} title=${title} backPath=${backPath} />
        ${children}
      </div>
    `;
  }


  // Export to DX namespace
  DX.navigateToHash = navigateToHash;
  DX.getHashPath = getHashPath;
  DX.normalizePath = normalizePath;
  DX.useHashPath = useHashPath;
  DX.BackHeader = BackHeader;
  DX.BottomNav = BottomNav;
  DX.PlaceholderPage = PlaceholderPage;
  DX.SimplePage = SimplePage;
})();
