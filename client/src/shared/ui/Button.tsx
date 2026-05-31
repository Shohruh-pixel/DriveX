import React from "react";
import { colors } from "./tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${colors.neonCyan}, ${colors.electricBlue})`,
    color: colors.black,
    border: "none",
    fontWeight: 700,
  },
  secondary: {
    background: "rgba(6,182,212,0.12)",
    color: colors.neonCyan,
    border: `1px solid rgba(6,182,212,0.25)`,
    fontWeight: 600,
  },
  ghost: {
    background: "rgba(255,255,255,0.04)",
    color: colors.silver,
    border: "1px solid rgba(255,255,255,0.08)",
    fontWeight: 600,
  },
  danger: {
    background: "rgba(239,68,68,0.12)",
    color: colors.danger,
    border: `1px solid rgba(239,68,68,0.25)`,
    fontWeight: 600,
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "8px 16px", fontSize: "13px", borderRadius: "12px" },
  md: { padding: "12px 20px", fontSize: "15px", borderRadius: "16px" },
  lg: { padding: "16px 24px", fontSize: "17px", borderRadius: "20px" },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
        transition: "all 0.2s",
        width: fullWidth ? "100%" : undefined,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {loading && (
        <span
          style={{
            width: "16px",
            height: "16px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  );
}
