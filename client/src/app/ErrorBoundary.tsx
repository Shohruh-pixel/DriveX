import React from "react";
import { colors, glass, radius } from "@shared/ui/tokens";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  featureName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ErrorBoundary: изолирует ошибки отдельного модуля
// Если один модуль упал — остальные продолжают работать
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.featureName}]`, error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: radius["2xl"],
            padding: "24px",
            width: "100%",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚠️</div>
          <h3 style={{ color: colors.white, margin: "0 0 8px", fontSize: "16px", fontWeight: 700 }}>
            {this.props.featureName
              ? `Раздел "${this.props.featureName}" временно недоступен`
              : "Что-то пошло не так"}
          </h3>
          <p style={{ color: colors.silver, fontSize: "13px", margin: "0 0 16px" }}>
            {this.state.error?.message || "Неизвестная ошибка"}
          </p>
          <p style={{ color: colors.silver, fontSize: "12px", margin: "0 0 16px", opacity: 0.7 }}>
            Остальные разделы приложения продолжают работать ✓
          </p>
          <button
            onClick={this.reset}
            style={{
              padding: "10px 20px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: radius.lg,
              color: colors.white,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }
}

// Обёртка для lazy-loaded фичей
export function FeatureBoundary({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  return (
    <ErrorBoundary featureName={name}>
      <React.Suspense
        fallback={
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid rgba(6,182,212,0.3)",
                borderTopColor: colors.neonCyan,
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ color: colors.silver, fontSize: "13px" }}>Загрузка...</p>
          </div>
        }
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}
