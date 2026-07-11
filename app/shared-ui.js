// app/shared-ui.js — Общие UI компоненты (Icon, Toast, BottomNav, SimplePage)
(() => {
  'use strict';
  window.DX = window.DX || {};
  const DX = window.DX;
  // React hooks — globals.js должен загрузиться первым
  const React = window.DX.React || window.React;
  const html  = window.DX.html;
  const { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } = React || {};
  // ToastContext и normalizePath приходят из utils-models.js (загружается перед shared-ui.js)
  const ToastContext = window.DX.ToastContext || createContext({ push: function(){} });
  function useToast() { return useContext(ToastContext); }
  // ConfirmContext — внутри-приложенческое модальное подтверждение (вместо window.confirm)
  const ConfirmContext = window.DX.ConfirmContext || createContext({ confirm: function(){ return Promise.resolve(true); } });
  window.DX.ConfirmContext = ConfirmContext;
  function useConfirm() { return useContext(ConfirmContext); }
  function normalizePath(p) {
    return window.DX.normalizePath ? window.DX.normalizePath(p) :
      (('/' + String(p||'').replace(/^#\//,'').replace(/\/+$/,'')) || '/');
  }
  function getHashPath() { return typeof window !== 'undefined' ? window.location.hash : ''; }
  function Icon({ name, size = 24, strokeWidth = 2, className = "", style }) {
    const commonProps = {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    };

    const Star = () =>
      html`<svg
        width=${size}
        height=${size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        aria-hidden="true"
        className=${className}
        style=${style}
      >
        <path
          d="M12 17.3 6.8 20l1-5.9L3 9.8l6-.7L12 3.6l3 5.5 6 .7-4.8 4.3 1 5.9z"
        ></path>
      </svg>`;

    switch (name) {
      case "star":
        return Star();
      case "home":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 10.5 12 3l9 7.5"></path>
          <path d="M5 10v10h14V10"></path>
        </svg>`;
      case "map":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"></path>
          <path d="M9 3v15"></path>
          <path d="M15 6v15"></path>
        </svg>`;
      case "wrench":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path
            d="M14.7 6.3a5 5 0 0 1-6.4 6.4L4 17l3 3 4.3-4.3a5 5 0 0 1 6.4-6.4l-3 3 2 2 3-3Z"
          ></path>
        </svg>`;
      case "bag":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M6 7h12l-1 14H7L6 7Z"></path>
          <path d="M9 7a3 3 0 0 1 6 0"></path>
        </svg>`;
      case "user":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M20 21a8 8 0 0 0-16 0"></path>
          <circle cx="12" cy="8" r="4"></circle>
        </svg>`;
      case "smile":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M8.5 15a5 5 0 0 0 7 0"></path>
          <path d="M9 10h.01"></path>
          <path d="M15 10h.01"></path>
        </svg>`;
      case "phone":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path
            d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6.1 6.1l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.9z"
          ></path>
        </svg>`;
      case "bell":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
          ></path>
          <path d="M13.7 21a2 2 0 0 1-3.4 0"></path>
        </svg>`;
      case "sun":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v3"></path>
          <path d="M12 19v3"></path>
          <path d="m4.9 4.9 2.1 2.1"></path>
          <path d="m17 17 2.1 2.1"></path>
          <path d="M2 12h3"></path>
          <path d="M19 12h3"></path>
          <path d="m4.9 19.1 2.1-2.1"></path>
          <path d="m17 7 2.1-2.1"></path>
        </svg>`;
      case "coffee":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M6 8h10v6a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V8Z"></path>
          <path d="M16 10h1a2 2 0 0 1 0 4h-1"></path>
          <path d="M8 3v3"></path>
          <path d="M12 3v3"></path>
          <path d="M6 21h10"></path>
        </svg>`;
      case "gift":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="8" width="18" height="5" rx="1"></rect>
          <path d="M12 8v13"></path>
          <path d="M5 13h14v8H5z"></path>
          <path d="M12 8H8.5a2.5 2.5 0 1 1 0-5c2 0 3.5 2 3.5 5Z"></path>
          <path d="M12 8h3.5a2.5 2.5 0 1 0 0-5C13.5 3 12 5 12 8Z"></path>
        </svg>`;
      case "cloud-rain":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M7 18a4 4 0 1 1 .8-7.9A5 5 0 0 1 18 11a3.5 3.5 0 1 1 0 7H7Z"></path>
          <path d="M9 19.5 8 22"></path>
          <path d="M13 19.5 12 22"></path>
          <path d="M17 19.5 16 22"></path>
        </svg>`;
      case "fuel":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 3h10v18H3z"></path>
          <path d="M13 7h2l3 3v10a2 2 0 0 1-2 2h-3"></path>
          <path d="M6 7h4"></path>
        </svg>`;
      case "battery":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="7" width="16" height="10" rx="2"></rect>
          <path d="M19 10h2v4h-2"></path>
          <path d="M7 10v4"></path>
          <path d="M5 12h4"></path>
          <path d="M13 10v4"></path>
        </svg>`;
      case "car":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <path d="M9 17h6"></path>
          <circle cx="17" cy="17" r="2"></circle>
        </svg>`;
      case "sos":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 2 2 22h20L12 2Z"></path>
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
        </svg>`;
      case "bot":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 8V4"></path>
          <rect x="5" y="8" width="14" height="12" rx="3"></rect>
          <path d="M9 12h.01"></path>
          <path d="M15 12h.01"></path>
          <path d="M9 16h6"></path>
        </svg>`;
      case "search":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="11" cy="11" r="7"></circle>
          <path d="M21 21l-4.3-4.3"></path>
        </svg>`;
      case "filter":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M4 6h16"></path>
          <path d="M7 12h10"></path>
          <path d="M10 18h4"></path>
        </svg>`;
      case "settings":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M4 21v-7"></path>
          <path d="M4 10V3"></path>
          <path d="M12 21v-9"></path>
          <path d="M12 8V3"></path>
          <path d="M20 21v-5"></path>
          <path d="M20 12V3"></path>
          <path d="M1 14h6"></path>
          <path d="M9 8h6"></path>
          <path d="M17 16h6"></path>
        </svg>`;
      case "edit":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </svg>`;
      case "lock":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="11" width="18" height="11" rx="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>`;
      case "card":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <path d="M2 10h20"></path>
          <path d="M6 15h2"></path>
          <path d="M10 15h6"></path>
        </svg>`;
      case "calendar":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="5" width="18" height="16" rx="2"></rect>
          <path d="M16 3v4"></path>
          <path d="M8 3v4"></path>
          <path d="M3 11h18"></path>
        </svg>`;
      case "clock":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7v5l3 2"></path>
        </svg>`;
      case "coins":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <ellipse cx="12" cy="6.5" rx="5.5" ry="2.5"></ellipse>
          <path d="M6.5 6.5v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4"></path>
          <path d="M6.5 10.5v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4"></path>
        </svg>`;
      case "bolt":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M13 2 5 13h5l-1 9 8-11h-5z"></path>
        </svg>`;
      case "repeat":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M17 2l4 4-4 4"></path>
          <path d="M3 11V9a3 3 0 0 1 3-3h15"></path>
          <path d="M7 22l-4-4 4-4"></path>
          <path d="M21 13v2a3 3 0 0 1-3 3H3"></path>
        </svg>`;
      case "check":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M20 6 9 17l-5-5"></path>
        </svg>`;
      case "copy":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="9" y="9" width="13" height="13" rx="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>`;
      case "folder":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"></path>
        </svg>`;
      case "plus":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </svg>`;
      case "x":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>`;
      case "trash":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </svg>`;
      case "layers":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 2 2 7l10 5 10-5-10-5Z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>`;
      case "wash":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M7 3h10"></path>
          <path d="M9 3v4"></path>
          <path d="M15 3v4"></path>
          <path d="M6 7h12l-1 14H7L6 7Z"></path>
        </svg>`;
      case "tire":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 3v2"></path>
          <path d="M12 19v2"></path>
          <path d="M3 12h2"></path>
          <path d="M19 12h2"></path>
        </svg>`;
      case "parking":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M8 3h6a4 4 0 0 1 0 8H8z"></path>
          <path d="M8 11v10"></path>
        </svg>`;
      case "crosshair":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="7"></circle>
          <path d="M12 3v2"></path>
          <path d="M12 19v2"></path>
          <path d="M3 12h2"></path>
          <path d="M19 12h2"></path>
        </svg>`;
      case "chevron-left":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M15 18 9 12l6-6"></path>
        </svg>`;
      case "truck":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 7h11v10H3z"></path>
          <path d="M14 10h4l3 3v4h-7z"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <circle cx="18" cy="17" r="2"></circle>
        </svg>`;
      case "scan":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M4 7V4h3"></path>
          <path d="M17 4h3v3"></path>
          <path d="M20 17v3h-3"></path>
          <path d="M7 20H4v-3"></path>
          <path d="M7 12h10"></path>
        </svg>`;
      case "sparkles":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 2l1.5 5L19 9l-5.5 2L12 16l-1.5-5L5 9l5.5-2L12 2Z"></path>
        </svg>`;
      case "play":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m10 8 6 4-6 4z"></path>
        </svg>`;
      case "send":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M22 2 11 13"></path>
          <path d="M22 2 15 22l-4-9-9-4 20-7Z"></path>
        </svg>`;
      case "image":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <circle cx="9" cy="9" r="2"></circle>
          <path d="m21 15-4.5-4.5L4 21"></path>
        </svg>`;
      case "paperclip":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10 13.4"></path>
        </svg>`;
      default:
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="10"></circle>
        </svg>`;
    }
  }

  function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((message) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, message: String(message) }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2200);
    }, []);

    return html`
      <${ToastContext.Provider} value=${{ push }}>
        ${children}
        <div
          className="fixed top-4 left-0 right-0 z-50 pointer-events-none"
          style=${{ maxWidth: "480px", margin: "0 auto" }}
          aria-live="polite"
          aria-atomic="true"
        >
          ${toasts.map(
            (t) => html`
              <div
                key=${t.id}
                className="mx-3 mb-3 glass-card rounded-2xl p-4 neon-glow-cyan"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style=${{
                      background: "rgba(6, 182, 212, 0.2)",
                      color: "var(--drivex-neon-cyan)"
                    }}
                  >
                    <${Icon} name="star" size=${18} />
                  </div>
                  <p className="text-sm" style=${{ color: "var(--drivex-white)" }}>
                    ${t.message}
                  </p>
                </div>
              </div>
            `
          )}
        </div>
      </${ToastContext.Provider}>
    `;
  }

  // In-app confirmation modal — заменяет нативный window.confirm.
  // Использование: const confirm = useConfirm(); const ok = await confirm({ title, message, confirmLabel, danger });
  function ConfirmProvider({ children }) {
    const [request, setRequest] = useState(null);

    const confirm = useCallback((options) => {
      return new Promise((resolve) => {
        setRequest({ options: options && typeof options === "object" ? options : {}, resolve });
      });
    }, []);

    const close = useCallback((result) => {
      setRequest((prev) => {
        if (prev && typeof prev.resolve === "function") prev.resolve(result);
        return null;
      });
    }, []);

    const opts = request ? request.options : null;
    const title = (opts && opts.title) || "Подтвердите действие";
    const message = opts && opts.message;
    const confirmLabel = (opts && opts.confirmLabel) || "Подтвердить";
    const cancelLabel = (opts && opts.cancelLabel) || "Отмена";
    const danger = Boolean(opts && opts.danger);
    const icon = opts && opts.icon;

    return html`
      <${ConfirmContext.Provider} value=${{ confirm }}>
        ${children}
        ${request
          ? html`
              <div
                className="fixed inset-0 z-50 flex items-center justify-center px-5"
                style=${{ background: "rgba(2, 6, 12, 0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", maxWidth: "480px", margin: "0 auto" }}
                role="dialog"
                aria-modal="true"
                onClick=${() => close(false)}
              >
                <div
                  className="glass-card rounded-3xl p-6 w-full neon-glow-cyan"
                  style=${{ maxWidth: "400px" }}
                  onClick=${(e) => e.stopPropagation()}
                >
                  ${icon
                    ? html`<div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                        style=${{
                          background: danger ? "rgba(239, 68, 68, 0.16)" : "rgba(6, 182, 212, 0.16)",
                          color: danger ? "var(--drivex-danger)" : "var(--drivex-neon-cyan)"
                        }}
                      >
                        <${Icon} name=${icon} size=${26} />
                      </div>`
                    : null}
                  <h2 className="text-xl font-bold mb-2" style=${{ color: "var(--drivex-white)" }}>
                    ${title}
                  </h2>
                  ${message
                    ? html`<p className="text-sm mb-6" style=${{ color: "var(--drivex-silver)", whiteSpace: "pre-line" }}>
                        ${message}
                      </p>`
                    : html`<div style=${{ height: "12px" }}></div>`}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="flex-1 py-3 rounded-2xl font-semibold glass-card-light"
                      style=${{ color: "var(--drivex-white)" }}
                      onClick=${() => close(false)}
                    >
                      ${cancelLabel}
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-3 rounded-2xl font-bold"
                      style=${{
                        background: danger ? "rgba(239, 68, 68, 0.16)" : "var(--gradient-primary)",
                        color: danger ? "var(--drivex-danger)" : "var(--drivex-white)"
                      }}
                      onClick=${() => close(true)}
                    >
                      ${confirmLabel}
                    </button>
                  </div>
                </div>
              </div>
            `
          : null}
      </${ConfirmContext.Provider}>
    `;
  }

  // Toggle — стилизованный переключатель (вместо нативного <input type=checkbox>)
  function Toggle({ checked, onChange, disabled }) {
    const on = Boolean(checked);
    return html`
      <button
        type="button"
        role="switch"
        aria-checked=${on ? "true" : "false"}
        disabled=${Boolean(disabled)}
        onClick=${() => { if (!disabled && typeof onChange === "function") onChange(!on); }}
        style=${{
          position: "relative",
          width: "48px",
          height: "28px",
          borderRadius: "9999px",
          background: on ? "var(--drivex-neon-cyan)" : "rgba(148, 163, 184, 0.3)",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "default" : "pointer",
          padding: "2px",
          border: "none",
          flexShrink: 0,
          transition: "background 0.2s"
        }}
      >
        <span
          style=${{
            display: "block",
            width: "24px",
            height: "24px",
            borderRadius: "9999px",
            background: "#ffffff",
            transform: on ? "translateX(20px)" : "translateX(0)",
            transition: "transform 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
          }}
        ></span>
      </button>
    `;
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

  function alphaBg(color, alpha = 0.2) {
    const known = {
      "var(--drivex-electric-blue)": `rgba(14, 165, 233, ${alpha})`,
      "var(--drivex-neon-cyan)": `rgba(6, 182, 212, ${alpha})`,
      "var(--drivex-bright-cyan)": `rgba(34, 211, 238, ${alpha})`,
      "var(--drivex-success)": `rgba(16, 185, 129, ${alpha})`,
      "var(--drivex-warning)": `rgba(245, 158, 11, ${alpha})`,
      "var(--drivex-danger)": `rgba(239, 68, 68, ${alpha})`
    };

    if (known[color]) return known[color];

    if (typeof color === "string" && color.startsWith("#") && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return `rgba(148, 163, 184, ${alpha})`;
  }

  function parseMileageLabel(value) {
    const digits = String(value || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }

  function sortByDateDesc(list = []) {
    return [...list].sort((a, b) => {
      const aTime = new Date(a?.date || a?.doneAt || 0).getTime() || 0;
      const bTime = new Date(b?.date || b?.doneAt || 0).getTime() || 0;
      return bTime - aTime;
    });
  }

  function buildDashboardMaintenanceFeed(maintenance, activeCarId) {
    const carState = getMaintenanceCarState(maintenance, activeCarId);
    const storageService = window.DrivexStorageService;
    const storageHistory =
      storageService && typeof storageService.getByCar === "function"
        ? storageService.getByCar(activeCarId)
        : [];
    const maintenanceRecords = (Array.isArray(carState.records) ? carState.records : []).map((record) => ({
      date: record.date,
      mileage: record.mileage,
      price: record.cost,
      serviceName: record.service || record.title || "Сервис",
      nextServiceAt: null,
      source: "maintenance"
    }));

    return {
      records: sortByDateDesc([...storageHistory, ...maintenanceRecords]),
      inspection: carState.inspection || {}
    };
  }

  function getMonthlySavings(activeCarId, maintenance) {
    const analyticsEngine = window.DrivexAnalyticsEngine;
    const feed = buildDashboardMaintenanceFeed(maintenance, activeCarId);
    const analytics =
      analyticsEngine && typeof analyticsEngine.compute === "function"
        ? analyticsEngine.compute(feed.records)
        : { monthlySpent: 0 };
    const monthlySpent = Number(analytics?.monthlySpent) || 0;
    const cashback = monthlySpent > 0 ? Math.round(monthlySpent * 0.03) : 0;
    return Math.max(cashback, monthlySpent > 0 ? 120 : 320);
  }

  function getMorningCommuteMinutes() {
    const workPlace = savedPlaces.find((place) => place.id === "work");
    if (!workPlace) return 18;
    return Math.max(12, 28 - new Date().getHours());
  }

  function getServiceDashboardStatus({ maintenance, activeCarId }) {
    const activeCar = findGarageCar(activeCarId);
    const currentMileage = parseMileageLabel(activeCar?.mileage);
    const feed = buildDashboardMaintenanceFeed(maintenance, activeCarId);
    const records = feed.records;
    const inspection = feed.inspection || {};
    const nowMs = Date.now();
    const latestRecord = records[0] || null;
    const latestRecordMs = latestRecord?.date ? new Date(latestRecord.date).getTime() : 0;
    const overdueByMileage = records.find(
      (record) =>
        Number.isFinite(Number(record?.nextServiceAt)) &&
        currentMileage >= Number(record.nextServiceAt)
    );
    const dueSoonByMileage = records.find((record) => {
      const nextServiceAt = Number(record?.nextServiceAt);
      if (!Number.isFinite(nextServiceAt)) return false;
      const remaining = nextServiceAt - currentMileage;
      return remaining > 0 && remaining < 500;
    });
    const inspectionExpired =
      inspection.validUntil && new Date(inspection.validUntil).getTime() < nowMs;
    const longNoService = latestRecordMs > 0 && nowMs - latestRecordMs > 180 * 24 * 60 * 60 * 1000;

    if (overdueByMileage || inspectionExpired) {
      return {
        state: "service",
        title: "Status: Service",
        icon: "wrench",
        accent: "#ff6b57",
        glow: "rgba(255, 107, 87, 0.34)",
        message: "Машина просит внимания. Пора заехать на сервис.",
        actionLabel: "Записаться",
        actionHref: "#/services",
        health: 24,
        metricType: "health",
        metricValue: 24,
        helper: overdueByMileage
          ? "Порог ТО уже пройден по пробегу."
          : "Техосмотр просрочен. Проверьте журнал обслуживания."
      };
    }

    if (dueSoonByMileage || longNoService) {
      const remaining = dueSoonByMileage
        ? Math.max(0, Number(dueSoonByMileage.nextServiceAt) - currentMileage)
        : 450;
      const health = longNoService ? 54 : Math.max(48, Math.min(88, Math.round((remaining / 500) * 42 + 46)));
      return {
        state: "service",
        title: "Status: Service",
        icon: "wrench",
        accent: "#ff7f50",
        glow: "rgba(255, 127, 80, 0.32)",
        message: "Машина просит внимания. Пора заехать на сервис.",
        actionLabel: "Записаться",
        actionHref: "#/services",
        health,
        metricType: "health",
        metricValue: health,
        helper: dueSoonByMileage
          ? `До следующего ТО осталось около ${formatPrice(remaining)} км.`
          : "Давно не было новых записей. Лучше заехать на диагностику."
      };
    }

    return {
      state: "service",
      title: "Status: Service",
      icon: "wrench",
      accent: "#3ba7ff",
      glow: "rgba(59, 167, 255, 0.28)",
      message: "По журналу обслуживания все спокойно. Машина в хорошем состоянии.",
      actionLabel: "История ТО",
      actionHref: "#/profile",
      health: 100,
      metricType: "health",
      metricValue: 100,
      helper: "Health Bar заполнен на 100%. Критичных сервисных событий нет."
    };
  }

  function getContextDashboardStatus(profileName) {
    const hour = new Date().getHours();
    const firstName = String(profileName || "").trim().split(/\s+/)[0] || "водитель";
    const commuteMinutes = getMorningCommuteMinutes();

    if (hour >= 7 && hour < 11) {
      return {
        state: "context",
        phase: "morning",
        title: "Status: Context",
        icon: commuteMinutes <= 18 ? "coffee" : "sun",
        accent: "#2ea9ff",
        glow: "rgba(46, 169, 255, 0.34)",
        message: `Доброе утро, ${firstName}! До работы около ${commuteMinutes} мин. Заедем за кофе?`,
        actionLabel: "Маршрут",
        actionHref: "#/map",
        health: 100,
        metricType: "health",
        metricValue: 100,
        helper: "Утренний режим активен. Маршрут и быстрые остановки уже готовы."
      };
    }

    if (hour >= 16 && hour < 21) {
      return {
        state: "context",
        phase: "evening",
        title: "Ритм города",
        icon: "map",
        accent: "#ff9f43",
        glow: "rgba(255, 159, 67, 0.30)",
        message: "Вечерний час-пик в разгаре. На главных улицах Худжанда заторы. DriveX желает вам спокойной и безопасной дороги.",
        actionLabel: "Обзор пробок",
        actionHref: "#/map",
        health: 100,
        metricType: "health",
        metricValue: 100,
        helper: "Вечерний сценарий предупреждает о дорожной обстановке, а не строит маршрут за вас."
      };
    }

    if (hour >= 21 || hour < 7) {
      return {
        state: "context",
        phase: "night",
        title: "Ночной драйв",
        icon: "sparkles",
        accent: "#7dd3fc",
        glow: "rgba(125, 211, 252, 0.28)",
        message: "Дороги свободны, а город в огнях. Идеальное время для спокойной поездки. Ваше авто готово, а вы?",
        moodLine: "Давай-ка освежаем машину и добавим ночи еще больше блеска.",
        actionLabel: "Пойдем в мойку",
        actionHref: "#/services",
        health: 100,
        metricType: "health",
        metricValue: 100,
        helper: "",
        displayMode: "immersive"
      };
    }

    if (hour >= 11 && hour < 16) {
      return {
        state: "context",
        phase: "day",
        title: "Status: Context",
        icon: "sun",
        accent: "#2ea9ff",
        glow: "rgba(46, 169, 255, 0.28)",
        message: `${firstName}, маршрут дня под рукой. Когда соберетесь, DriveX поможет быстро стартовать.`,
        actionLabel: "Маршрут",
        actionHref: "#/map",
        health: 100,
        metricType: "health",
        metricValue: 100,
        helper: "Сейчас не утренний слот 07:00–10:00, поэтому показан общий контекстный сценарий."
      };
    }
  }

  function getMarketingDashboardStatus(activeCarId, maintenance) {
    const savings = getMonthlySavings(activeCarId, maintenance);

    return {
      state: "marketing",
      title: "Status: Marketing",
      icon: "gift",
      accent: "#29d391",
      glow: "rgba(41, 211, 145, 0.34)",
      message: `Вы сэкономили ${formatPrice(savings)} TJS в этом месяце. Крутой результат!`,
      actionLabel: "Забрать бонусы",
      actionHref: "#/bonus",
      health: 100,
      metricType: "money",
      metricValue: savings,
      helper: "Экономия посчитана по расходам на обслуживание и бонусам DriveX."
    };
  }

  function buildWeatherUrl(latitude, longitude) {
    const weatherConfig = window.DRIVEX_WEATHER_CONFIG || {};
    const apiKey = typeof weatherConfig.openWeatherApiKey === "string" ? weatherConfig.openWeatherApiKey.trim() : "";

    if (apiKey) {
      return `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=ru`;
    }

    return `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,rain,showers,snowfall,weather_code&timezone=auto`;
  }

  function normalizeWeatherPayload(data) {
    if (!data || typeof data !== "object") return null;

    if (data.current && typeof data.current === "object") {
      return {
        temperature: Number(data.current.temperature_2m) || 0,
        rain: Number(data.current.rain) || 0,
        showers: Number(data.current.showers) || 0,
        snowfall: Number(data.current.snowfall) || 0,
        weatherCode: Number(data.current.weather_code) || 0
      };
    }

    if (data.main && data.weather) {
      const weatherId = Number(data.weather[0]?.id) || 0;
      const rain = weatherId >= 500 && weatherId < 600 ? 1 : 0;
      const snowfall = weatherId >= 600 && weatherId < 700 ? 1 : 0;
      return {
        temperature: Number(data.main.temp) || 0,
        rain,
        showers: rain,
        snowfall,
        weatherCode: weatherId
      };
    }

    return null;
  }

  function getWeatherDashboardStatus(snapshot) {
    const hour = new Date().getHours();
    if (!snapshot) {
      return {
        state: "weather",
        phase: hour >= 11 && hour < 16 ? "lunch" : "normal",
        title: hour >= 11 && hour < 16 ? "Градус комфорта" : "Status: Weather",
        icon: "cloud-rain",
        accent: "#1dc7ff",
        glow: "rgba(29, 199, 255, 0.28)",
        message:
          hour >= 11 && hour < 16
            ? "Пользователь, на улице сейчас около +24°. Не забывайте проветрить салон перед поездкой. Хорошего дня!"
            : "Погодных рисков не обнаружено. Можно ехать спокойно.",
        actionLabel: "Советы",
        actionHref: "#/ai-assistant",
        health: 100,
        metricType: "temperature",
        metricValue: 24,
        helper:
          hour >= 11 && hour < 16
            ? "Дневной сценарий работает как климатический ассистент для водителя."
            : "Нет данных GPS или резких погодных событий. Показан базовый погодный сценарий."
      };
    }

    const temperature = Number(snapshot.temperature) || 0;
    const rain = Number(snapshot.rain) || 0;
    const showers = Number(snapshot.showers) || 0;
    const snowfall = Number(snapshot.snowfall) || 0;
    const weatherCode = Number(snapshot.weatherCode) || 0;
    const wet = rain > 0 || showers > 0 || snowfall > 0;
    const icy = temperature <= 1 && wet;
    const heavyRain = wet && [63, 65, 80, 81, 82, 95, 96, 99, 502, 503, 504, 522].includes(weatherCode);
    const extremeHeat = temperature >= 38;

    if (!icy && !heavyRain && !extremeHeat) {
      return {
        state: "weather",
        phase: hour >= 11 && hour < 16 ? "lunch" : "normal",
        title: hour >= 11 && hour < 16 ? "Градус комфорта" : "Status: Weather",
        icon: "sun",
        accent: "#1dc7ff",
        glow: "rgba(29, 199, 255, 0.28)",
        message:
          hour >= 11 && hour < 16
            ? `Пользователь, на улице сейчас +${Math.round(temperature)}°. Не забывайте проветрить салон перед поездкой. Хорошего дня!`
            : "Погода спокойная. Дорожные условия без критических рисков.",
        actionLabel: hour >= 11 && hour < 16 ? "Советы" : "Советы по вождению",
        actionHref: "#/ai-assistant",
        health: 100,
        metricType: "temperature",
        metricValue: Math.round(temperature),
        helper:
          hour >= 11 && hour < 16
            ? "Обеденный сценарий подсказывает климат и комфорт в салоне."
            : "Осадков и экстремальной температуры нет. Это обычный погодный сценарий."
      };
    }

    let message = "Сегодня скользко. Держите дистанцию и проверьте шины.";
    if (heavyRain) {
      message = "Сегодня сильный дождь. Снизьте скорость и проверьте обзор.";
    } else if (extremeHeat) {
      message = "Сегодня аномальная жара. Следите за температурой двигателя и давлением в шинах.";
    }

    return {
      state: "weather",
      phase: "alert",
      title: "Status: Weather",
      icon: "cloud-rain",
      accent: "#1dc7ff",
      glow: "rgba(29, 199, 255, 0.34)",
      message,
      actionLabel: "Советы по вождению",
      actionHref: "#/ai-assistant",
      health: 100,
      metricType: "temperature",
      metricValue: Math.round(temperature),
      helper: "Погода подтягивается по GPS. Если доступа нет, экран откатится к другому сценарию."
    };
  }

  function NumberTicker({ value, suffix = "", prefix = "", decimals = 0 }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      const target = Number(value) || 0;
      const startValue = displayValue;
      const duration = 900;
      const startTime = performance.now();
      let frameId = 0;

      const tick = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextValue = startValue + (target - startValue) * eased;
        setDisplayValue(progress >= 1 ? target : nextValue);
        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
        }
      };

      frameId = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(frameId);
    }, [value]);

    const normalized =
      decimals > 0
        ? Number(displayValue).toFixed(decimals)
        : formatPrice(Math.round(Number(displayValue) || 0));

    return html`<span>${prefix}${normalized}${suffix}</span>`;
  }

  // Карточка «Мой автомобиль» — одна персональная сводка вместо карусели
  // из 4 сценариев (сервис/погода/контекст/маркетинг). Пользователь за пару
  // секунд видит статус СВОЕГО авто и одно уместное действие; никакого
  // «Свайп влево или вправо», дев-жаргона и выдуманных цифр экономии.
  function SmartDashboard({ profileName, activeCarId, maintenance }) {
    const car = findGarageCar(activeCarId);
    const mileage = parseMileageLabel(car?.mileage);
    const feed = buildDashboardMaintenanceFeed(maintenance, activeCarId);
    const records = feed.records;
    const inspection = feed.inspection || {};
    const nowMs = Date.now();

    // Ближайшее плановое ТО по пробегу (минимальный остаток из всех записей)
    let nextServiceRemaining = null;
    for (const record of records) {
      const nextAt = Number(record?.nextServiceAt);
      if (!Number.isFinite(nextAt) || nextAt <= 0) continue;
      const remaining = nextAt - mileage;
      if (nextServiceRemaining === null || remaining < nextServiceRemaining) {
        nextServiceRemaining = remaining;
      }
    }

    // Честные расходы за текущий календарный месяц (никаких минимумов «320 TJS»)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthSpent = records.reduce((sum, record) => {
      const ts = new Date(record?.date || 0).getTime();
      if (!ts || ts < monthStart.getTime()) return sum;
      return sum + (Number(record?.price) || 0);
    }, 0);

    const lastRecord = records[0] || null;
    const lastServiceLabel = lastRecord?.date
      ? new Date(lastRecord.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
      : "—";

    const inspectionExpired =
      inspection.validUntil && new Date(inspection.validUntil).getTime() < nowMs;
    const overdue = nextServiceRemaining !== null && nextServiceRemaining <= 0;
    const dueSoon = nextServiceRemaining !== null && nextServiceRemaining > 0 && nextServiceRemaining < 500;
    const lastMs = lastRecord?.date ? new Date(lastRecord.date).getTime() : 0;
    const longNoService = lastMs > 0 && nowMs - lastMs > 180 * 24 * 60 * 60 * 1000;

    let status;
    if (!car) {
      status = {
        accent: "#3ba7ff",
        chip: "Начните здесь",
        title: "Ваш гараж пуст",
        subtitle: "1 минута на подключение",
        message: "Добавьте автомобиль — DRIVEX напомнит о ТО, посчитает расходы и сохранит документы.",
        actionLabel: "Добавить авто",
        actionHref: "#/garage"
      };
    } else if (overdue || inspectionExpired) {
      status = {
        accent: "#ff6b57",
        chip: "Пора на сервис",
        message: inspectionExpired
          ? "Техосмотр просрочен — обновите его в ближайшее время."
          : "Порог планового ТО пройден по пробегу.",
        actionLabel: "Записаться на сервис",
        actionHref: "#/services"
      };
    } else if (dueSoon || longNoService) {
      status = {
        accent: "#ff9f43",
        chip: "ТО скоро",
        message: dueSoon
          ? `До планового ТО осталось около ${formatPrice(nextServiceRemaining)} км.`
          : "Давно не было записей — загляните на диагностику.",
        actionLabel: "Записаться на сервис",
        actionHref: "#/services"
      };
    } else {
      status = {
        accent: "#29d391",
        chip: "Всё в порядке",
        message: nextServiceRemaining !== null
          ? `Следующее ТО через ~${formatPrice(nextServiceRemaining)} км.`
          : "Критичных событий по журналу нет. Хорошей дороги!",
        actionLabel: "Мой гараж",
        actionHref: "#/garage"
      };
    }

    const accent = status.accent;
    const nextServiceValue = nextServiceRemaining === null
      ? "—"
      : nextServiceRemaining <= 0
        ? "пройдено"
        : `${formatPrice(nextServiceRemaining)} км`;

    return html`
      <div
        className="smart-dashboard-shell car-status-card rounded-3xl p-6"
        style=${{
          background: `linear-gradient(140deg, ${alphaBg(accent, 0.26)} 0%, rgba(10, 18, 31, 0.96) 48%, rgba(7, 11, 18, 0.98) 100%)`,
          border: `1px solid ${alphaBg(accent, 0.38)}`,
          boxShadow: `0 24px 60px ${alphaBg(accent, 0.18)}, inset 0 1px 0 rgba(255,255,255,0.06)`
        }}
      >
        <div className="smart-dashboard-grid"></div>

        <div className="relative z-10">
          <div className="car-status-head">
            <div
              className="smart-dashboard-icon-wrap"
              style=${{
                background: `linear-gradient(135deg, ${alphaBg(accent, 0.3)} 0%, ${alphaBg(accent, 0.12)} 100%)`,
                color: accent,
                border: `1px solid ${alphaBg(accent, 0.4)}`
              }}
            >
              <${Icon} name="car" size=${22} />
            </div>
            <div className="min-w-0">
              <p className="car-status-title">${car ? (car.name || "Мой автомобиль") : status.title}</p>
              <p className="car-status-sub">
                ${car
                  ? (mileage ? `Пробег ${formatPrice(mileage)} км` : "Пробег не указан")
                  : status.subtitle}
              </p>
            </div>
            <span
              className="car-status-chip"
              style=${{
                color: accent,
                background: alphaBg(accent, 0.14),
                border: `1px solid ${alphaBg(accent, 0.36)}`
              }}
            >
              <span className="car-status-chip-dot" style=${{ background: accent }}></span>
              ${status.chip}
            </span>
          </div>

          <p className="car-status-message">${status.message}</p>

          ${car
            ? html`<div className="car-status-tiles">
                <div className="car-status-tile">
                  <p className="car-status-tile-value">${nextServiceValue}</p>
                  <p className="car-status-tile-label">До планового ТО</p>
                </div>
                <div className="car-status-tile">
                  <p className="car-status-tile-value">${formatPrice(monthSpent)} <span>TJS</span></p>
                  <p className="car-status-tile-label">Расходы за месяц</p>
                </div>
                <div className="car-status-tile">
                  <p className="car-status-tile-value">${lastServiceLabel}</p>
                  <p className="car-status-tile-label">Последнее ТО</p>
                </div>
              </div>`
            : html`<div className="car-status-benefits">
                <span>✓ Напоминания о ТО</span>
                <span>✓ Журнал расходов</span>
                <span>✓ Документы под рукой</span>
              </div>`}

          <a
            href=${status.actionHref}
            className="car-status-cta"
            style=${{
              background: `linear-gradient(135deg, ${accent} 0%, ${alphaBg(accent, 0.72)} 100%)`,
              boxShadow: `0 10px 26px ${alphaBg(accent, 0.3)}`
            }}
          >
            ${status.actionLabel}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    `;
  }

  function LegacySmartDashboardCarousel({ profileName, activeCarId, maintenance }) {
    const [weatherStatus, setWeatherStatus] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [transitionKey, setTransitionKey] = useState(0);
    const [transitionDirection, setTransitionDirection] = useState("next");
    const touchStartXRef = useRef(0);
    const serviceStatus = getServiceDashboardStatus({ maintenance, activeCarId });
    const contextStatus = getContextDashboardStatus(profileName);
    const marketingStatus = getMarketingDashboardStatus(activeCarId, maintenance);
    const fallbackWeatherStatus = getWeatherDashboardStatus(null);
    const resolvedWeatherStatus = weatherStatus || fallbackWeatherStatus;
    const serviceStatusKey = `${serviceStatus.state}-${serviceStatus.health}-${serviceStatus.helper}`;
    const statuses = [serviceStatus, resolvedWeatherStatus, contextStatus, marketingStatus];
    const activeStatus = statuses[Math.min(activeIndex, Math.max(0, statuses.length - 1))] || marketingStatus;
    const activeStatusIndex = statuses.findIndex((item) => item === activeStatus);

    useEffect(() => {
      let cancelled = false;

      if (!navigator.geolocation || !window.fetch) {
        setWeatherStatus(null);
        return undefined;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = position.coords?.latitude;
            const longitude = position.coords?.longitude;
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

            const response = await fetch(buildWeatherUrl(latitude, longitude));
            if (!response.ok) return;
            const data = await response.json();
            if (cancelled) return;
            setWeatherStatus(getWeatherDashboardStatus(normalizeWeatherPayload(data)));
          } catch {
            if (!cancelled) setWeatherStatus(null);
          }
        },
        () => {
          if (!cancelled) setWeatherStatus(null);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 10 * 60 * 1000 }
      );

      return () => {
        cancelled = true;
      };
    }, [serviceStatusKey]);

    useEffect(() => {
      const preferredIndex =
        serviceStatus.health < 100
          ? 0
          : resolvedWeatherStatus.phase === "alert" || resolvedWeatherStatus.phase === "lunch"
            ? 1
            : contextStatus.phase === "morning" || contextStatus.phase === "evening" || contextStatus.phase === "night"
              ? 2
              : 3;

      setActiveIndex((prev) => {
        if (prev >= statuses.length) return preferredIndex;
        return prev;
      });
    }, [statuses.length, serviceStatusKey, resolvedWeatherStatus.phase, contextStatus.phase]);

    function goNext() {
      if (statuses.length <= 1) return;
      setTransitionDirection("next");
      setActiveIndex((prev) => (prev + 1) % statuses.length);
      setTransitionKey((prev) => prev + 1);
    }

    function goPrev() {
      if (statuses.length <= 1) return;
      setTransitionDirection("prev");
      setActiveIndex((prev) => (prev - 1 + statuses.length) % statuses.length);
      setTransitionKey((prev) => prev + 1);
    }

    function handleTouchStart(event) {
      touchStartXRef.current = event.changedTouches?.[0]?.clientX || 0;
    }

    function handleTouchEnd(event) {
      const endX = event.changedTouches?.[0]?.clientX || 0;
      const diffX = endX - touchStartXRef.current;
      if (Math.abs(diffX) < 36) return;
      if (diffX < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    const accent = activeStatus.accent;
    const healthWidth = `${Math.max(0, Math.min(100, Number(activeStatus.health) || 0))}%`;
    const isMoney = activeStatus.metricType === "money";
    const isTemperature = activeStatus.metricType === "temperature";
    const isImmersive = activeStatus.displayMode === "immersive";

    useEffect(() => {
      if (statuses.length <= 1) return undefined;
      const intervalId = window.setInterval(() => {
        setTransitionDirection("next");
        setActiveIndex((prev) => (prev + 1) % statuses.length);
        setTransitionKey((prev) => prev + 1);
      }, 4200);
      return () => window.clearInterval(intervalId);
    }, [statuses.length, serviceStatusKey, resolvedWeatherStatus.phase, contextStatus.phase]);

    return html`
      <div
        className="smart-dashboard-shell rounded-3xl p-6"
        onTouchStart=${handleTouchStart}
        onTouchEnd=${handleTouchEnd}
        style=${{
          background: `linear-gradient(140deg, ${alphaBg(accent, 0.28)} 0%, rgba(10, 18, 31, 0.96) 48%, rgba(7, 11, 18, 0.98) 100%)`,
          border: `1px solid ${alphaBg(accent, 0.4)}`,
          boxShadow: `0 24px 60px ${alphaBg(accent, 0.2)}, inset 0 1px 0 rgba(255,255,255,0.06)`
        }}
      >
        <div className="smart-dashboard-grid"></div>
        <div className="smart-dashboard-orb smart-dashboard-orb-a" style=${{ background: activeStatus.glow }}></div>
        <div className="smart-dashboard-orb smart-dashboard-orb-b" style=${{ background: alphaBg(accent, 0.2) }}></div>

        <div
          className="relative z-10 smart-dashboard-animated-content"
          key=${transitionKey}
          data-direction=${transitionDirection}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="smart-dashboard-icon-wrap"
                style=${{
                  background: `linear-gradient(135deg, ${alphaBg(accent, 0.3)} 0%, ${alphaBg(accent, 0.12)} 100%)`,
                  color: accent,
                  border: `1px solid ${alphaBg(accent, 0.4)}`
                }}
              >
                <${Icon} name=${activeStatus.icon} size=${26} />
              </div>
              <div>
                <p className="text-xs font-semibold" style=${{ color: "rgba(255,255,255,0.72)", letterSpacing: "0.14em" }}>
                  SMART DASHBOARD
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-light-silver)" }}>
                  ${activeStatus.title}
                </p>
              </div>
            </div>

            <a
              href=${activeStatus.actionHref}
              className="px-4 py-3 rounded-2xl text-sm font-semibold smart-dashboard-cta"
              style=${{
                background: `linear-gradient(135deg, ${accent} 0%, ${alphaBg(accent, 0.72)} 100%)`,
                color: "var(--drivex-white)"
              }}
            >
              ${activeStatus.actionLabel}
            </a>
          </div>

          <div className="mt-6">
            <p className="text-sm" style=${{ color: "var(--drivex-light-silver)" }}>
              ${activeStatus.message}
            </p>

            ${isImmersive
              ? html`<div className="mt-5 smart-dashboard-immersive-copy">
                  <p className="text-lg font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    ${activeStatus.moodLine || ""}
                  </p>
                </div>`
              : html`<div className="flex items-end justify-between gap-4 mt-5">
                    <div>
                      <div className="text-4xl font-bold tracking-tight" style=${{ color: "var(--drivex-white)" }}>
                        ${isMoney
                          ? html`<${NumberTicker} value=${activeStatus.metricValue} suffix=" TJS" />`
                          : isTemperature
                            ? html`<${NumberTicker} value=${activeStatus.metricValue} suffix="°C" />`
                            : html`<${NumberTicker} value=${activeStatus.metricValue} suffix="%" />`}
                      </div>
                      <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                        ${isMoney ? "Экономия за месяц" : isTemperature ? "Температура сейчас" : "Здоровье авто"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold" style=${{ color: accent, letterSpacing: "0.12em" }}>
                        LIVE
                      </p>
                      <p className="text-sm mt-2 max-w-[160px]" style=${{ color: "var(--drivex-silver)" }}>
                        ${activeStatus.helper}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs mb-2" style=${{ color: "var(--drivex-silver)" }}>
                      <span>Health Bar</span>
                      <span>${Math.round(Number(activeStatus.health) || 0)}%</span>
                    </div>
                    <div className="smart-dashboard-progress">
                      <div
                        className="smart-dashboard-progress-fill"
                        style=${{
                          width: healthWidth,
                          background: `linear-gradient(90deg, ${accent} 0%, ${alphaBg(accent, 0.82)} 100%)`,
                          boxShadow: `0 0 22px ${alphaBg(accent, 0.45)}`
                        }}
                      ></div>
                    </div>
                  </div>`}

            ${statuses.length > 1
              ? html`<div className="smart-dashboard-footer mt-5">
                  <div className="smart-dashboard-swipe-hint" style=${{ color: "var(--drivex-silver)" }}>
                    Свайп влево или вправо
                  </div>
                  <div className="smart-dashboard-dots">
                    ${statuses.map(
                      (status, index) => html`<span
                        key=${`${status.state}-${index}`}
                        className="smart-dashboard-dot"
                        data-active=${index === activeStatusIndex}
                        style=${{
                          background: index === activeStatusIndex ? accent : "rgba(148, 163, 184, 0.24)",
                          boxShadow: index === activeStatusIndex ? `0 0 16px ${alphaBg(accent, 0.45)}` : "none"
                        }}
                      ></span>`
                    )}
                  </div>
                </div>`
              : null}
          </div>
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

  function AIAssistCard({ children, accent = "var(--drivex-neon-cyan)", className = "" }) {
    return html`
      <div
        className=${`glass-card-light rounded-3xl p-5 ${className}`.trim()}
        style=${{
          border: `1px solid ${alphaBg(accent, 0.16)}`,
          boxShadow: `0 18px 36px ${alphaBg(accent, 0.08)}`
        }}
      >
        ${children}
      </div>
    `;
  }

  function AIChip({ label, onClick, active = false }) {
    return html`
      <button
        type="button"
        className="px-3 py-2 rounded-2xl text-sm transition-all"
        style=${{
          background: active ? alphaBg("var(--drivex-neon-cyan)", 0.18) : "rgba(148, 163, 184, 0.12)",
          color: active ? "var(--drivex-neon-cyan)" : "var(--drivex-light-silver)",
          border: active ? `1px solid ${alphaBg("var(--drivex-neon-cyan)", 0.3)}` : "1px solid rgba(148,163,184,0.08)"
        }}
        onClick=${onClick}
      >
        ${label}
      </button>
    `;
  }

  function AIQuickActionCard({ item, active, onClick }) {
    return html`
      <button
        type="button"
        className="ai-quick-card rounded-3xl p-4 text-left transition-all"
        style=${{
          background: active
            ? `linear-gradient(145deg, ${alphaBg(item.accent, 0.22)} 0%, rgba(13, 19, 31, 0.96) 100%)`
            : "rgba(18, 24, 37, 0.88)",
          border: active
            ? `1px solid ${alphaBg(item.accent, 0.32)}`
            : "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: active ? `0 18px 34px ${alphaBg(item.accent, 0.12)}` : "none"
        }}
        onClick=${onClick}
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style=${{
            background: alphaBg(item.accent, 0.18),
            color: item.accent
          }}
        >
          <${Icon} name=${item.icon} size=${20} />
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)", lineHeight: "1.35" }}>
            ${item.title}
          </p>
        </div>
      </button>
    `;
  }

  function AIResponseCard({ response, onFindService, onShowMap, onSave }) {
    if (!response) return null;

    return html`
      <${AIAssistCard} accent="var(--drivex-electric-blue)" className="ai-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold" style=${{ color: "var(--drivex-neon-cyan)", letterSpacing: "0.16em" }}>
              LAST AI RESPONSE
            </p>
            <h3 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
              ${response.title}
            </h3>
            <p className="text-sm mt-3" style=${{ color: "var(--drivex-light-silver)", lineHeight: "1.6" }}>
              ${response.summary}
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style=${{
              background: alphaBg("var(--drivex-electric-blue)", 0.18),
              color: "var(--drivex-electric-blue)"
            }}
          >
            <${Icon} name="bot" size=${22} />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          ${response.sections.map(
            (section) => html`
              <div key=${section.title}>
                <p className="text-sm font-semibold mb-2" style=${{ color: "var(--drivex-white)" }}>
                  ${section.title}
                </p>
                <div className="space-y-2">
                  ${section.items.map(
                    (item) => html`
                      <div key=${item} className="flex items-start gap-3">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style=${{ background: "var(--drivex-neon-cyan)" }}
                        ></span>
                        <p className="text-sm" style=${{ color: "var(--drivex-light-silver)", lineHeight: "1.55" }}>
                          ${item}
                        </p>
                      </div>
                    `
                  )}
                </div>
              </div>
            `
          )}
        </div>

        <div
          className="mt-5 rounded-2xl p-4"
          style=${{
            background: "rgba(8, 15, 26, 0.55)",
            border: "1px solid rgba(148, 163, 184, 0.08)"
          }}
        >
          <p className="text-xs font-semibold" style=${{ color: "var(--drivex-silver)", letterSpacing: "0.12em" }}>
            СРОЧНОСТЬ
          </p>
          <p className="text-sm mt-2" style=${{ color: "var(--drivex-white)", lineHeight: "1.55" }}>
            ${response.urgencyText || response.urgency}
          </p>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-neon-cyan)", lineHeight: "1.55" }}>
            ${response.recommendation}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <button
            type="button"
            className="ai-action-button"
            onClick=${onFindService}
          >
            Найти сервис
          </button>
          <button
            type="button"
            className="ai-action-button"
            onClick=${onShowMap}
          >
            Показать на карте
          </button>
          <button
            type="button"
            className="ai-action-button"
            onClick=${onSave}
          >
            Сохранить
          </button>
        </div>
      </${AIAssistCard}>
    `;
  }

  function AIAssistantScreen({ profile, activeCarId, maintenance, serviceDirectory }) {
    const toast = useToast();
    const aiService = window.DrivexAIAssistService || null;
    const activeCar = findGarageCar(activeCarId) || garageCars[0] || null;
    const carName = activeCar?.name || null;
    const carMileage = activeCar?.mileage || null;
    const nearbyPool =
      serviceDirectory && Array.isArray(serviceDirectory.nearbyServices)
        ? serviceDirectory.nearbyServices
        : nearbyServices.map((item) => decorateServiceRecord(item));
    const quickScenarios = aiService && typeof aiService.getQuickScenarios === "function"
      ? aiService.getQuickScenarios()
      : [];
    const popularPrompts = aiService && typeof aiService.getPopularPrompts === "function"
      ? aiService.getPopularPrompts()
      : [];
    const [activeScenarioId, setActiveScenarioId] = useState("symptoms");
    const [query, setQuery] = useState("");
    const [placeholder, setPlaceholder] = useState("Например: машина не заводится утром");
    const [loading, setLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [lastResponse, setLastResponse] = useState(() =>
      aiService && typeof aiService.analyzeQuery === "function"
        ? aiService.analyzeQuery("", { activeCar, nearbyServices: nearbyPool, maintenance, profile })
        : null
    );

    const aiContext = {
      activeCar,
      nearbyServices: nearbyPool,
      maintenance,
      profile
    };

    function buildAIInput(message, scenarioType) {
      if (aiService && typeof aiService.buildInput === "function") {
        return aiService.buildInput({
          userMessage: message,
          scenarioType,
          activeCar,
          maintenance,
          location: { city: "Худжанд" },
          locale: "ru-RU"
        });
      }

      return {
        userMessage: message,
        scenarioType,
        vehicle: activeCar ? {
          make:    activeCar.make || (carName || "").split(" ")[0] || "",
          model:   activeCar.model || (carName || "").split(" ").slice(1).join(" "),
          year:    activeCar.year || "",
          mileage: Number(String(carMileage || "0").replace(/[^\d]/g, "")) || 0
        } : null,
        location: { city: "Худжанд" },
        locale: "ru-RU"
      };
    }

    function submitAsk(nextQuery = query, scenarioType = activeScenarioId) {
      if (loading || !aiService) return;
      setLoading(true);
      setAiError("");
      const timeoutMs = 700 + Math.floor(Math.random() * 500);
      window.setTimeout(() => {
        const input = buildAIInput(nextQuery, scenarioType);
        const request =
          typeof aiService.askDriveXAI === "function"
            ? aiService.askDriveXAI(input)
            : Promise.resolve(aiService.analyzeQuery(nextQuery, aiContext));

        Promise.resolve(request)
          .then((response) => {
            setLastResponse(response);
          })
          .catch(() => {
            setAiError("Не удалось получить ответ. Попробуй ещё раз.");
            if (typeof aiService.analyzeQuery === "function") {
              setLastResponse(aiService.analyzeQuery(nextQuery, aiContext));
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }, timeoutMs);
    }

    function handleScenarioClick(scenario) {
      setActiveScenarioId(scenario.id);
      if (scenario.placeholder) {
        setPlaceholder(scenario.placeholder);
      }
      if (scenario.immediate && aiService && typeof aiService.runScenario === "function") {
        setLoading(true);
        setAiError("");
        window.setTimeout(() => {
          Promise.resolve(aiService.runScenario(scenario.id, aiContext))
            .then((response) => {
              setLastResponse(response);
            })
            .catch(() => {
              setAiError("Не удалось получить ответ. Попробуй ещё раз.");
              if (typeof aiService.analyzeQuery === "function") {
                setLastResponse(aiService.analyzeQuery("", { ...aiContext, scenarioType: scenario.scenarioType }));
              }
            })
            .finally(() => {
              setLoading(false);
            });
        }, 820);
      }
    }

    function handlePromptChip(prompt) {
      setQuery(prompt);
      submitAsk(prompt);
    }

    return html`
      <div className="min-h-screen pb-24" style=${{ background: "var(--drivex-black)" }}>
        <${BackHeader} title="AI помощник" backPath="/" />
        <div className="px-6 pb-8 space-y-5">
          <div className="ai-fade-in">
            <p className="text-sm" style=${{ color: "var(--drivex-silver)", lineHeight: "1.6" }}>
              Помогу понять проблему, обслуживание и сервисы для твоей машины
            </p>
          </div>

          <${AIAssistCard} accent="var(--drivex-neon-cyan)" className="relative overflow-hidden ai-fade-in">
            <div className="absolute -top-8 right-0 w-32 h-32 rounded-full blur-3xl" style=${{ background: alphaBg("var(--drivex-neon-cyan)", 0.18) }}></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold" style=${{ color: "var(--drivex-neon-cyan)", letterSpacing: "0.18em" }}>
                    SMART ASSIST
                  </p>
                  <h2 className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                    ${carName} · Smart Assist
                  </h2>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)" }}>
                    Пробег: ${carMileage}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style=${{
                    background: alphaBg("var(--drivex-neon-cyan)", 0.16),
                    color: "var(--drivex-neon-cyan)"
                  }}
                >
                  <${Icon} name="bot" size=${24} />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <div className="ai-summary-pill">
                  AI нашёл 2 рекомендации
                </div>
                <div className="ai-summary-pill">
                  ${nearbyPool.length} сервиса рядом
                </div>
              </div>
            </div>
          </${AIAssistCard}>

          <div className="ai-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                Быстрые сценарии
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              ${quickScenarios.map(
                (scenario) => html`
                  <${AIQuickActionCard}
                    key=${scenario.id}
                    item=${scenario}
                    active=${activeScenarioId === scenario.id}
                    onClick=${() => handleScenarioClick(scenario)}
                  />
                `
              )}
            </div>
          </div>

          <${AIAssistCard} accent="var(--drivex-electric-blue)" className="ai-fade-in">
            <p className="text-sm font-semibold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Спроси про симптомы, слова мастера или обслуживание
            </p>
            <textarea
              className="w-full rounded-3xl glass-card-light outline-none dx-input ai-textarea"
              rows="4"
              placeholder=${placeholder}
              value=${query}
              onInput=${(e) => setQuery(e.target.value)}
            ></textarea>

            <button
              type="button"
              className="w-full mt-4 py-4 rounded-2xl font-semibold dx-btn ai-primary-button"
              onClick=${() => submitAsk()}
              disabled=${loading}
              style=${{
                opacity: loading ? 0.76 : 1
              }}
            >
              ${loading ? "AI думает..." : "Спросить AI"}
            </button>
            ${aiError
              ? html`<p className="text-sm mt-3" style=${{ color: "var(--drivex-warning)" }}>
                  ${aiError}
                </p>`
              : null}
          </${AIAssistCard}>

          <div className="ai-fade-in">
            <p className="text-sm font-semibold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Популярные запросы
            </p>
            <div className="flex flex-wrap gap-2">
              ${popularPrompts.map(
                (prompt) => html`
                  <${AIChip}
                    key=${prompt}
                    label=${prompt}
                    onClick=${() => handlePromptChip(prompt)}
                    active=${query === prompt}
                  />
                `
              )}
            </div>
          </div>

          <div className="ai-fade-in">
            <p className="text-sm font-semibold mb-3" style=${{ color: "var(--drivex-white)" }}>
              Последний ответ
            </p>
            ${loading
              ? html`<${AIAssistCard} accent="var(--drivex-electric-blue)">
                  <div className="flex items-center gap-3">
                    <div className="ai-loader-dot"></div>
                    <div>
                      <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                        AI анализирует запрос
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                        Сопоставляю симптомы, обслуживание и сервисы рядом...
                      </p>
                    </div>
                  </div>
                </${AIAssistCard}>`
              : html`<${AIResponseCard}
                  response=${lastResponse}
                  onFindService=${() => navigateToHash("/services")}
                  onShowMap=${() => navigateToHash("/map")}
                  onSave=${() => toast.push("Ответ AI сохранён")}
                />`}
          </div>
        </div>
      </div>
    `;
  }

  function AIPremiumHeader() {
    return html`
      <div className="ai-premium-header">
        <a href="#/" className="ai-premium-back" aria-label="Назад">
          <${Icon} name="chevron-left" size=${20} />
        </a>
        <div className="min-w-0">
          <h1 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>AI Assist</h1>
          <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
            Диагностика, обслуживание, сервисы
          </p>
        </div>
        <div className="ai-premium-status" aria-hidden="true"><span></span></div>
      </div>
    `;
  }

  function AIPremiumSuggestionCard({ title, icon, delay = 0, onClick }) {
    return html`
      <button type="button" className="ai-suggestion-card" style=${{ animationDelay: `${delay}ms` }} onClick=${onClick}>
        <span className="ai-suggestion-icon"><${Icon} name=${icon} size=${20} /></span>
        <span>${title}</span>
      </button>
    `;
  }

  function AIPremiumEmptyState() {
    return html`
      <div className="ai-empty-state">
        <div className="ai-orb-wrap">
          <div className="ai-orb"></div>
          <div className="ai-orb-core"><${Icon} name="bot" size=${30} /></div>
        </div>
        <h2 className="text-3xl font-bold mt-7" style=${{ color: "var(--drivex-white)", letterSpacing: "-0.03em" }}>
          Чем помочь с машиной?
        </h2>
        <p className="text-sm mt-3 max-w-[320px] mx-auto" style=${{ color: "var(--drivex-silver)", lineHeight: "1.7" }}>
          Опиши симптом, слова мастера или вопрос по обслуживанию
        </p>
      </div>
    `;
  }

  function AIPremiumUserMessage({ text }) {
    return html`
      <div className="ai-message-row ai-message-row-user">
        <div className="ai-user-bubble">${text}</div>
      </div>
    `;
  }

  function AIPremiumAIMessage({ response, onFindService, onShowMap, onFindPart }) {
    const sections = Array.isArray(response?.sections) ? response.sections : [];
    const urgency = response?.urgencyText || response?.urgency || "Средняя. Лучше проверить при повторении.";
    const primaryCta = Array.isArray(response?.cta) ? response.cta[0] : null;
    const secondaryCta = Array.isArray(response?.cta) ? response.cta[1] : null;
    const handleCta = (cta) => {
      const action = cta?.action || cta?.type || "";
      if (action === "show_map" || action === "map") return onShowMap && onShowMap();
      if (action === "find_part" || action === "parts" || action === "market") return onFindPart && onFindPart();
      return onFindService && onFindService();
    };

    return html`
      <div className="ai-message-row ai-message-row-ai">
        <article className="ai-analysis-card">
          <div className="ai-analysis-topline">
            <span>AI ANALYSIS</span>
            <span className="ai-analysis-dot"></span>
          </div>
          <h2 className="text-2xl font-bold mt-3" style=${{ color: "var(--drivex-white)", letterSpacing: "-0.03em" }}>
            ${response?.title || "AI рекомендация DriveX"}
          </h2>
          <p className="text-sm mt-3" style=${{ color: "var(--drivex-light-silver)", lineHeight: "1.7" }}>
            ${response?.summary || "Я подготовил предварительный разбор по описанию."}
          </p>
          <div className="ai-analysis-sections">
            ${sections.map(
              (section) => html`
                <section key=${section.title} className="ai-analysis-section">
                  <h3>${section.title}</h3>
                  <div className="space-y-2">
                    ${(section.items || []).map(
                      (item) => html`<div key=${item} className="ai-analysis-item"><span></span><p>${item}</p></div>`
                    )}
                  </div>
                </section>
              `
            )}
            <section className="ai-analysis-section">
              <h3>Срочность</h3>
              <p className="ai-urgency-text">${urgency}</p>
              ${response?.recommendation ? html`<p className="ai-recommendation-text">${response.recommendation}</p>` : null}
            </section>
          </div>
          <div className="ai-analysis-actions">
            <button type="button" className="ai-find-service" onClick=${() => handleCta(primaryCta)}>
              ${primaryCta?.label || "Найти сервис"}
            </button>
            <button type="button" className="ai-map-link" onClick=${() => handleCta(secondaryCta)}>
              ${secondaryCta?.label || "Показать на карте"}
            </button>
          </div>
        </article>
      </div>
    `;
  }

  function AIPremiumThinkingCard() {
    return html`
      <div className="ai-message-row ai-message-row-ai">
        <div className="ai-thinking-card">
          <div className="ai-thinking-orb"></div>
          <div className="min-w-0">
            <p className="ai-thinking-label">AI ANALYSIS IN PROGRESS</p>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)" }}>
              Анализируем симптомы и подбираем лучший сценарий
            </p>
            <div className="ai-shimmer-lines" aria-hidden="true"><span></span><span></span></div>
          </div>
        </div>
      </div>
    `;
  }

  function AIPremiumSuggestionChip({ label, onClick }) {
    return html`<button type="button" className="ai-feed-chip" onClick=${onClick}>${label}</button>`;
  }

  function AIPremiumInputBar({ value, disabled, suggestions = [], onChange, onSend, onSuggestion }) {
    return html`
      <div className="ai-input-shell">
        ${suggestions.length
          ? html`<div className="ai-input-suggestions">
              ${suggestions.map(
                (item, index) => html`<button
                  key=${item.label}
                  type="button"
                  className="ai-input-suggestion"
                  style=${{ animationDelay: `${index * 55}ms` }}
                  disabled=${disabled}
                  onClick=${() => onSuggestion && onSuggestion(item)}
                >
                  ${item.label}
                </button>`
              )}
            </div>`
          : null}
        <form
          className="ai-input-console"
          onSubmit=${(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <textarea
            className="ai-console-input"
            rows="1"
            value=${value}
            placeholder="Например: машина не заводится утром"
            disabled=${disabled}
            onInput=${(event) => onChange(event.target.value)}
          ></textarea>
          <button type="submit" className="ai-send-button" disabled=${disabled || !String(value || "").trim()} aria-label="Отправить">
            <${Icon} name="play" size=${18} />
          </button>
        </form>
      </div>
    `;
  }

  function AIAssistantScreen({ profile, activeCarId, maintenance, serviceDirectory }) {
    const aiService    = window.DrivexAIAssistService || null;
    const historyService = window.DrivexAIHistoryService || null;
    const scrollRef    = useRef(null);
    const latestRequestRef = useRef("");
    const activeCar    = findGarageCar(activeCarId) || garageCars[0] || null;
    const carName      = activeCar?.name    || null; // null если нет авто
    const carMileage   = activeCar?.mileage || null;
    const userId       = profile?.id || null;
    const nearbyPool   =
      serviceDirectory && Array.isArray(serviceDirectory.nearbyServices)
        ? serviceDirectory.nearbyServices
        : nearbyServices.map((item) => decorateServiceRecord(item));

    const [messages,  setMessages]  = useState([]);
    const [query,     setQuery]     = useState("");
    const [loading,   setLoading]   = useState(false);
    const [aiError,   setAiError]   = useState("");
    const [chatReady, setChatReady] = useState(false);

    // ── Инициализация: userId → historyService → загрузка чата ────────────
    useEffect(() => {
      if (!historyService || !userId) { setChatReady(true); return; }

      historyService.setUser(userId);

      // Создаём/находим активный чат и загружаем историю
      (async () => {
        try {
          const chats = await historyService.loadUserChats(userId);
          if (chats && chats.length > 0) {
            const lastChat = chats[0]; // последний по updated_at
            historyService.setActiveChat(lastChat.id);
            const history = await historyService.loadChatMessages(lastChat.id, userId);
            if (history && history.length > 0) {
              // Преобразуем формат истории в формат messages
              const restored = history.map(msg => ({
                id:       msg.id || ("h-" + Math.random().toString(16).slice(2)),
                role:     msg.role === "assistant" ? "ai" : "user",
                text:     msg.text || (msg.role === "user" ? msg.content : ""),
                response: msg.response || (msg.role === "assistant" ? {
                  title:   "Ответ AI",
                  summary: msg.answer || msg.content || "",
                  causes:  [],
                  actions: [],
                  urgency: "low"
                } : null)
              })).filter(m => m.text || m.response?.summary);
              if (restored.length > 0) setMessages(restored);
            }
          }
        } catch { /* ignore — работаем без истории */ }
        setChatReady(true);
      })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
      const target = scrollRef.current;
      if (!target) return;
      target.scrollTop = target.scrollHeight;
    }, [messages.length, loading]);

    function buildAIInput(message, scenarioType) {
      // Берём историю из сервиса для контекста Claude
      const activeChatId = historyService ? historyService.getActiveChatId() : null;
      const contextHistory = (historyService && activeChatId)
        ? historyService.getContextHistory(activeChatId, 8)
        : messages.slice(-8).map(m => ({
            role:     m.role === "ai" ? "assistant" : "user",
            text:     m.text,
            answer:   m.response?.summary || m.response?.answer,
            response: m.response
          }));

      const base = {
        userMessage:  message,
        scenarioType,
        activeCar,
        activeCarId,   // передаём ID чтобы resolveActiveCar нашёл машину
        maintenance,
        location:     { city: "Худжанд" },
        locale:       "ru-RU",
        // Контекст для Claude/Groq
        userId,
        chatId:       activeChatId,
        history:      contextHistory
      };

      if (aiService && typeof aiService.buildInput === "function") {
        const built = aiService.buildInput(base);
        // Добавляем userId и history в built объект
        return { ...built, userId, chatId: activeChatId, history: contextHistory };
      }

      return {
        ...base,
        vehicle: activeCar ? {
          make:    activeCar.make || (activeCar.name || "").split(" ")[0] || "",
          model:   activeCar.model || (activeCar.name || "").split(" ").slice(1).join(" "),
          year:    activeCar.year     || "",
          mileage: Number(String(activeCar.mileage || "0").replace(/[^\d]/g, "")) || 0,
          fuelType: activeCar.fuelType || ""
        } : null
      };
    }

    function fallbackResponse(message, scenarioType) {
      if (aiService && typeof aiService.analyzeQuery === "function") {
        return aiService.analyzeQuery(message, {
          activeCar,
          nearbyServices: nearbyPool,
          maintenance,
          profile,
          scenarioType
        });
      }
      return {
        title: "AI Assist",
        summary: "Не удалось получить ответ. Рекомендуется очная диагностика в сервисе.",
        sections: [
          { title: "Возможные причины", items: ["симптом требует проверки"] },
          { title: "Что сделать сейчас", items: ["попробовать ещё раз", "обратиться в сервис"] }
        ],
        urgencyText: "Средняя. Лучше не откладывать, если проблема повторяется.",
        recommendation: "Рекомендуется очная диагностика в сервисе"
      };
    }

    function sendMessage(message = query, scenarioType = "diagnostic") {
      const text = String(message || "").trim();
      if (!text || loading || !aiService) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          role: "user",
          text
        }
      ]);
      setQuery("");
      setLoading(true);
      setAiError("");

      const startedAt = Date.now();
      const requestId = `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      latestRequestRef.current = requestId;
      const input = buildAIInput(text, scenarioType);
      const request =
        typeof aiService.askDriveXAI === "function"
          ? aiService.askDriveXAI(input)
          : Promise.resolve(fallbackResponse(text, scenarioType));

      Promise.resolve(request)
        .then((response) => {
          const remaining = Math.max(0, 760 - (Date.now() - startedAt));
          window.setTimeout(() => {
            if (latestRequestRef.current !== requestId) return;
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                role: "ai",
                response
              }
            ]);
            setLoading(false);
          }, remaining);
        })
        .catch(() => {
          const response = fallbackResponse(text, scenarioType);
          window.setTimeout(() => {
            if (latestRequestRef.current !== requestId) return;
            setAiError("Не удалось получить ответ. Показал безопасную рекомендацию.");
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                role: "ai",
                response
              }
            ]);
            setLoading(false);
          }, 700);
        });
    }

    const hasConversation = messages.length > 0 || loading;
    const latestAIMessage = [...messages].reverse().find((item) => item.role === "ai" && item.response);
    const responseSuggestions = latestAIMessage?.response?.suggestions?.length
      ? latestAIMessage.response.suggestions
      : latestAIMessage?.response?.raw?.suggestions || [];
    const inputSuggestions = !hasConversation
      ? [
          { label: "Не заводится утром", message: "Машина не заводится утром", scenario: "diagnostic" },
          { label: "Стук в подвеске", message: "Стук в подвеске", scenario: "diagnostic" },
          { label: "Что скоро обслужить?", message: "Что скоро обслужить?", scenario: "maintenance" }
        ]
      : !loading && responseSuggestions.length
        ? responseSuggestions.slice(0, 3).map((label) => ({
            label,
            message: label,
            scenario: "diagnostic"
          }))
      : !loading
        ? [
            { label: "Понять слова мастера", message: "На СТО сказали менять сайлентблок и амортизатор", scenario: "explain_service" },
            { label: "Найти сервис", message: "Подбери сервис рядом", scenario: "find_service" },
            { label: "Что делать дальше?", message: "Что делать дальше?", scenario: "diagnostic" }
          ]
        : [];

    return html`
      <div className="ai-premium-screen">
        <div className="ai-premium-bg"></div>
        <${AIPremiumHeader} />
        <main ref=${scrollRef} className="ai-feed">
          ${!hasConversation
            ? html`<${AIPremiumEmptyState} />`
            : html`<div className="ai-conversation">
                ${carName ? html`
                  <div className="ai-car-context">
                    <span>🚗 ${carName}</span>
                    ${carMileage ? html`<span>${carMileage}</span>` : null}
                  </div>
                ` : html`
                  <div className="ai-car-context" style=${{ opacity:0.6 }}>
                    <span>🚗 Авто не добавлено</span>
                    <a href="#/garage" style=${{ color:"var(--drivex-neon-cyan)", textDecoration:"none", fontSize:"11px" }}>+ Добавить</a>
                  </div>
                `}
                ${messages.map((message) =>
                  message.role === "user"
                    ? html`<${AIPremiumUserMessage} key=${message.id} text=${message.text} />`
                    : html`<${AIPremiumAIMessage}
                        key=${message.id}
                        response=${message.response}
                        onFindService=${() => navigateToHash("/services")}
                        onShowMap=${() => navigateToHash("/map")}
                        onFindPart=${() => navigateToHash("/market")}
                      />`
                )}
                ${loading ? html`<${AIPremiumThinkingCard} />` : null}
                ${aiError ? html`<p className="ai-error-text">${aiError}</p>` : null}
              </div>`}
        </main>
        <${AIPremiumInputBar}
          value=${query}
          disabled=${loading}
          suggestions=${inputSuggestions}
          onChange=${setQuery}
          onSend=${() => sendMessage(query, "diagnostic")}
          onSuggestion=${(item) => sendMessage(item.message, item.scenario)}
        />
      </div>
    `;
  }


  // ── Export to DX ──
  try { if (typeof AIAssistantScreen !== 'undefined') window.DX['AIAssistantScreen'] = AIAssistantScreen; } catch(e) {}
  try { if (typeof AIAssistCard !== 'undefined') window.DX['AIAssistCard'] = AIAssistCard; } catch(e) {}
  try { if (typeof AIChip !== 'undefined') window.DX['AIChip'] = AIChip; } catch(e) {}
  try { if (typeof AIPremiumAIMessage !== 'undefined') window.DX['AIPremiumAIMessage'] = AIPremiumAIMessage; } catch(e) {}
  try { if (typeof AIPremiumEmptyState !== 'undefined') window.DX['AIPremiumEmptyState'] = AIPremiumEmptyState; } catch(e) {}
  try { if (typeof AIPremiumHeader !== 'undefined') window.DX['AIPremiumHeader'] = AIPremiumHeader; } catch(e) {}
  try { if (typeof AIPremiumInputBar !== 'undefined') window.DX['AIPremiumInputBar'] = AIPremiumInputBar; } catch(e) {}
  try { if (typeof AIPremiumSuggestionCard !== 'undefined') window.DX['AIPremiumSuggestionCard'] = AIPremiumSuggestionCard; } catch(e) {}
  try { if (typeof AIPremiumSuggestionChip !== 'undefined') window.DX['AIPremiumSuggestionChip'] = AIPremiumSuggestionChip; } catch(e) {}
  try { if (typeof AIPremiumThinkingCard !== 'undefined') window.DX['AIPremiumThinkingCard'] = AIPremiumThinkingCard; } catch(e) {}
  try { if (typeof AIPremiumUserMessage !== 'undefined') window.DX['AIPremiumUserMessage'] = AIPremiumUserMessage; } catch(e) {}
  try { if (typeof AIQuickActionCard !== 'undefined') window.DX['AIQuickActionCard'] = AIQuickActionCard; } catch(e) {}
  try { if (typeof AIResponseCard !== 'undefined') window.DX['AIResponseCard'] = AIResponseCard; } catch(e) {}
  try { if (typeof alphaBg !== 'undefined') window.DX['alphaBg'] = alphaBg; } catch(e) {}
  try { if (typeof BackHeader !== 'undefined') window.DX['BackHeader'] = BackHeader; } catch(e) {}
  try { if (typeof BottomNav !== 'undefined') window.DX['BottomNav'] = BottomNav; } catch(e) {}
  try { if (typeof buildDashboardMaintenanceFeed !== 'undefined') window.DX['buildDashboardMaintenanceFeed'] = buildDashboardMaintenanceFeed; } catch(e) {}
  try { if (typeof buildWeatherUrl !== 'undefined') window.DX['buildWeatherUrl'] = buildWeatherUrl; } catch(e) {}
  try { if (typeof getContextDashboardStatus !== 'undefined') window.DX['getContextDashboardStatus'] = getContextDashboardStatus; } catch(e) {}
  try { if (typeof getMarketingDashboardStatus !== 'undefined') window.DX['getMarketingDashboardStatus'] = getMarketingDashboardStatus; } catch(e) {}
  try { if (typeof getMonthlySavings !== 'undefined') window.DX['getMonthlySavings'] = getMonthlySavings; } catch(e) {}
  try { if (typeof getMorningCommuteMinutes !== 'undefined') window.DX['getMorningCommuteMinutes'] = getMorningCommuteMinutes; } catch(e) {}
  try { if (typeof getServiceDashboardStatus !== 'undefined') window.DX['getServiceDashboardStatus'] = getServiceDashboardStatus; } catch(e) {}
  try { if (typeof getWeatherDashboardStatus !== 'undefined') window.DX['getWeatherDashboardStatus'] = getWeatherDashboardStatus; } catch(e) {}
  try { if (typeof Icon !== 'undefined') window.DX['Icon'] = Icon; } catch(e) {}
  try { if (typeof normalizeWeatherPayload !== 'undefined') window.DX['normalizeWeatherPayload'] = normalizeWeatherPayload; } catch(e) {}
  try { if (typeof NumberTicker !== 'undefined') window.DX['NumberTicker'] = NumberTicker; } catch(e) {}
  try { if (typeof parseMileageLabel !== 'undefined') window.DX['parseMileageLabel'] = parseMileageLabel; } catch(e) {}
  try { if (typeof PlaceholderPage !== 'undefined') window.DX['PlaceholderPage'] = PlaceholderPage; } catch(e) {}
  try { if (typeof SimplePage !== 'undefined') window.DX['SimplePage'] = SimplePage; } catch(e) {}
  try { if (typeof SmartDashboard !== 'undefined') window.DX['SmartDashboard'] = SmartDashboard; } catch(e) {}
  try { if (typeof sortByDateDesc !== 'undefined') window.DX['sortByDateDesc'] = sortByDateDesc; } catch(e) {}
  try { if (typeof ToastProvider !== 'undefined') window.DX['ToastProvider'] = ToastProvider; } catch(e) {}
  try { if (typeof ConfirmProvider !== 'undefined') window.DX['ConfirmProvider'] = ConfirmProvider; } catch(e) {}
  try { if (typeof Toggle !== 'undefined') window.DX['Toggle'] = Toggle; } catch(e) {}
  try { if (typeof useHashPath !== 'undefined') window.DX['useHashPath'] = useHashPath; } catch(e) {}
})();
