// app/shared/toast.js — ToastContext, useToast, ToastProvider
(() => {
  'use strict';
  const DX = window.DX;
  const { html, createContext, useContext, useCallback, useState } = DX;
  const Icon = DX.Icon;

  const ToastContext = createContext({
    push: () => {}
  });

  function useToast() {
    return useContext(ToastContext);
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
  // Export to DX namespace
  DX.ToastContext = ToastContext;
  DX.useToast = useToast;
  DX.ToastProvider = ToastProvider;
})();
