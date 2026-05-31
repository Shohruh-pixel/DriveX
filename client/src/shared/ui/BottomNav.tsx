import React from "react";
import { NavLink } from "react-router-dom";
import { colors, glass } from "./tokens";

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/",         icon: "🏠", label: "Главная" },
  { path: "/map",      icon: "🗺️", label: "Карта" },
  { path: "/services", icon: "🔧", label: "Сервисы" },
  { path: "/market",   icon: "🛍️", label: "Маркет" },
  { path: "/profile",  icon: "👤", label: "Профиль" },
];

export function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(480px, 100vw)",
        background: `${glass.bg}`,
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${glass.border}`,
        display: "flex",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          style={({ isActive }) => ({
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px 4px",
            textDecoration: "none",
            color: isActive ? colors.neonCyan : colors.silver,
            fontSize: "10px",
            fontWeight: isActive ? 700 : 500,
            gap: "4px",
            transition: "color 0.2s",
          })}
        >
          <span style={{ fontSize: "22px", lineHeight: 1 }}>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
