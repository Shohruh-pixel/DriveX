import React from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { Button } from "@shared/ui/Button";
import { useToast } from "@shared/ui/Toast";
import { colors } from "@shared/ui/tokens";
import { useAuthStore } from "@features/auth/store";

interface MenuItem { emoji: string; label: string; path: string; badge?: string }

export function ProfileScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, cars, logout } = useAuthStore();

  if (!session.authenticated) {
    return (
      <PageLayout title="Профиль">
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: "64px" }}>👤</div>
          <h2 style={{ color: colors.white, margin: "0 0 8px" }}>Войдите в аккаунт</h2>
          <p style={{ color: colors.silver, fontSize: "14px", margin: "0 0 20px" }}>Сохраняйте данные, историю и документы</p>
          <Button fullWidth size="lg" onClick={() => navigate("/auth")}>Войти / Зарегистрироваться</Button>
          <Button fullWidth variant="ghost" onClick={() => navigate("/")}>Продолжить как гость</Button>
        </div>
      </PageLayout>
    );
  }

  const menuItems: MenuItem[] = [
    { emoji: "🚗", label: "Мой гараж", path: "/garage", badge: cars.length > 0 ? String(cars.length) : undefined },
    { emoji: "📄", label: "Документы", path: "/garage/docs" },
    { emoji: "🔧", label: "История ТО", path: "/garage/maintenance" },
    { emoji: "🛍️", label: "Мои заказы", path: "/orders" },
    { emoji: "⭐", label: "Избранное", path: "/favorites" },
    ...(session.role === "seller" ? [{ emoji: "🏪", label: "Seller CRM", path: "/seller" }] : []),
    ...(session.role === "partner" ? [{ emoji: "🔧", label: "Partner CRM", path: "/partner" }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    toast.push("Вы вышли из аккаунта");
    navigate("/");
  };

  const roleBadge = session.role === "seller" ? "🏪 Продавец" : session.role === "partner" ? "🔧 Партнёр" : "🚗 Пользователь";

  return (
    <PageLayout title="Профиль">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Аватар и имя */}
        <Card glow="cyan" padding="20px">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "20px", background: "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(14,165,233,0.3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
              {session.name?.[0]?.toUpperCase() ?? "👤"}
            </div>
            <div>
              <p style={{ color: colors.white, fontWeight: 800, fontSize: "18px", margin: "0 0 4px" }}>{session.name || "Без имени"}</p>
              <p style={{ color: colors.silver, fontSize: "13px", margin: "0 0 6px" }}>{session.phone || session.email || ""}</p>
              <span style={{ color: colors.neonCyan, fontSize: "12px", fontWeight: 700, background: "rgba(6,182,212,0.12)", padding: "3px 10px", borderRadius: "20px" }}>{roleBadge}</span>
            </div>
          </div>
        </Card>

        {/* Меню */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {menuItems.map((item) => (
            <CardLight key={item.path} onClick={() => navigate(item.path)} style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }} padding="14px">
              <span style={{ fontSize: "22px" }}>{item.emoji}</span>
              <span style={{ color: colors.white, fontWeight: 500, flex: 1 }}>{item.label}</span>
              {item.badge && <span style={{ color: colors.neonCyan, fontWeight: 700, fontSize: "13px" }}>{item.badge}</span>}
              <span style={{ color: colors.silver }}>›</span>
            </CardLight>
          ))}
        </div>

        <Button variant="ghost" fullWidth onClick={handleLogout}>Выйти из аккаунта</Button>
      </div>
    </PageLayout>
  );
}
