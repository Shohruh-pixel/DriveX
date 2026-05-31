import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { colors, radius } from "./tokens";

interface Toast {
  id: number;
  message: string;
  type?: "info" | "success" | "error";
}

interface ToastCtx {
  push: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastCtx>({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const push = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const bgByType = (type: Toast["type"]) =>
    type === "error" ? "rgba(239,68,68,0.18)" :
    type === "success" ? "rgba(16,185,129,0.18)" :
    "rgba(6,182,212,0.12)";

  const borderByType = (type: Toast["type"]) =>
    type === "error" ? "rgba(239,68,68,0.35)" :
    type === "success" ? "rgba(16,185,129,0.35)" :
    "rgba(6,182,212,0.25)";

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: "90px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          width: "min(360px, calc(100vw - 32px))",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: bgByType(t.type),
              border: `1px solid ${borderByType(t.type)}`,
              borderRadius: radius.xl,
              padding: "12px 16px",
              color: colors.white,
              fontSize: "14px",
              fontWeight: 500,
              backdropFilter: "blur(12px)",
              animation: "slideUp 0.3s ease",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
