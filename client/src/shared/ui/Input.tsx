import React from "react";
import { colors, glass, radius } from "./tokens";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, style, ...props }: InputProps) {
  return (
    <label style={{ display: "block" }}>
      {label && (
        <span
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            color: colors.silver,
            marginBottom: "8px",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      )}
      <input
        {...props}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: glass.bg,
          border: `1px solid ${error ? "rgba(239,68,68,0.4)" : glass.border}`,
          borderRadius: radius.xl,
          color: colors.white,
          fontSize: "15px",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(6,182,212,0.5)";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? "rgba(239,68,68,0.4)"
            : glass.border;
          props.onBlur?.(e);
        }}
      />
      {error && (
        <span style={{ display: "block", fontSize: "12px", color: colors.danger, marginTop: "6px" }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ display: "block", fontSize: "12px", color: colors.silver, marginTop: "6px" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, options, style, ...props }: SelectProps) {
  return (
    <label style={{ display: "block" }}>
      {label && (
        <span
          style={{ display: "block", fontSize: "12px", fontWeight: 600, color: colors.silver, marginBottom: "8px" }}
        >
          {label}
        </span>
      )}
      <select
        {...props}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: glass.bg,
          border: `1px solid ${glass.border}`,
          borderRadius: radius.xl,
          color: colors.white,
          fontSize: "15px",
          outline: "none",
          boxSizing: "border-box",
          ...style,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: "#0a0a0f" }}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
