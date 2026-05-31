import React from "react";
import { glass, radius } from "./tokens";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  glow?: "cyan" | "blue" | "none";
  padding?: string;
  className?: string;
}

export function Card({
  children,
  style,
  onClick,
  glow = "none",
  padding = "20px",
  className,
}: CardProps) {
  const glowBorder =
    glow === "cyan" ? "1px solid rgba(6,182,212,0.25)" :
    glow === "blue" ? "1px solid rgba(14,165,233,0.25)" :
    `1px solid ${glass.border}`;

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: glass.bgLight,
        border: glowBorder,
        borderRadius: radius["2xl"],
        padding,
        cursor: onClick ? "pointer" : undefined,
        transition: "all 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Лёгкая карточка — чуть прозрачнее
export function CardLight({ children, style, onClick, padding = "20px" }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: glass.bg,
        border: `1px solid ${glass.border}`,
        borderRadius: radius["2xl"],
        padding,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
