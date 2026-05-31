import React from "react";
import { useNavigate } from "react-router-dom";
import { colors, glass } from "./tokens";
import { BottomNav } from "./BottomNav";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  backPath?: string;
  hideNav?: boolean;
  headerRight?: React.ReactNode;
}

export function PageLayout({
  children,
  title,
  backPath,
  hideNav = false,
  headerRight,
}: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: colors.black,
        maxWidth: "480px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Header */}
      {title && (
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            background: colors.black,
            borderBottom: `1px solid ${glass.border}`,
            gap: "12px",
          }}
        >
          {backPath && (
            <button
              onClick={() => navigate(backPath)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                background: glass.bg,
                border: `1px solid ${glass.border}`,
                color: colors.white,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              ←
            </button>
          )}
          <h1
            style={{
              flex: 1,
              fontSize: "18px",
              fontWeight: 700,
              color: colors.white,
              margin: 0,
            }}
          >
            {title}
          </h1>
          {headerRight}
        </header>
      )}

      {/* Content */}
      <main style={{ paddingBottom: hideNav ? 0 : "80px" }}>{children}</main>

      {/* Bottom navigation */}
      {!hideNav && <BottomNav />}
    </div>
  );
}

// Обёртка для CRM страниц (без BottomNav, своя шапка)
export function CrmLayout({
  children,
  title,
  subtitle,
  backPath,
  headerRight,
}: PageLayoutProps & { subtitle?: string }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: colors.black,
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          padding: "20px 20px 12px",
          borderBottom: `1px solid ${glass.border}`,
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        {backPath && (
          <button
            onClick={() => navigate(backPath)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              background: glass.bg,
              border: `1px solid ${glass.border}`,
              color: colors.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            ←
          </button>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: colors.neonCyan, letterSpacing: "0.15em", margin: "0 0 4px" }}>
            DRIVEX CRM
          </p>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: colors.white, margin: 0 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: "13px", color: colors.silver, margin: "4px 0 0" }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerRight}
      </header>
      <main>{children}</main>
    </div>
  );
}
