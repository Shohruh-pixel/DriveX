// Дизайн-токены DRIVEX — единый источник цветов/стилей
export const colors = {
  black:        "#0a0a0f",
  white:        "#f0f4ff",
  silver:       "#94a3b8",
  neonCyan:     "#06b6d4",
  electricBlue: "#0ea5e9",
  success:      "#10b981",
  warning:      "#f59e0b",
  danger:       "#ef4444",
  purple:       "#8b5cf6",
} as const;

export const glass = {
  bg:         "rgba(255,255,255,0.04)",
  bgLight:    "rgba(255,255,255,0.06)",
  border:     "rgba(255,255,255,0.08)",
  borderCyan: "rgba(6,182,212,0.18)",
} as const;

export const radius = {
  sm: "12px",
  md: "16px",
  lg: "20px",
  xl: "24px",
  "2xl": "28px",
  "3xl": "32px",
} as const;
