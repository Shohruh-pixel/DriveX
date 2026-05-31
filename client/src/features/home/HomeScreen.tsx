import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@features/auth/store";
import { PageLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { Button } from "@shared/ui/Button";
import { colors } from "@shared/ui/tokens";

const QUICK_ACTIONS = [
  { emoji: "🔧", label: "Ремонт", path: "/services", color: colors.electricBlue },
  { emoji: "🚗", label: "Гараж",  path: "/garage",   color: colors.neonCyan },
  { emoji: "🆘", label: "SOS",    path: "/emergency", color: colors.danger },
  { emoji: "🤖", label: "AI",     path: "/ai",        color: colors.warning },
];

const FEATURED_SERVICES = [
  { emoji: "🔧", name: "АвтоМастер Премиум", cat: "СТО", rating: 4.8, city: "Худжанд" },
  { emoji: "⭕", name: "ШиноМонтаж 24/7",   cat: "Шиномонтаж", rating: 4.9, city: "Худжанд" },
];

export function HomeScreen() {
  const navigate = useNavigate();
  const { session, cars, activeCarId } = useAuthStore();
  const activeCar = cars.find((c) => c.id === activeCarId) ?? cars[0];
  const firstName = session.name.split(" ")[0] || "Водитель";

  return (
    <PageLayout>
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Приветствие */}
        <div>
          <p style={{ color: colors.silver, fontSize: "14px", margin: "0 0 4px" }}>Привет, {firstName} 👋</p>
          <h1 style={{ color: colors.white, fontSize: "26px", fontWeight: 800, margin: 0 }}>DRIVEX</h1>
          {activeCar && (
            <p style={{ color: colors.neonCyan, fontSize: "13px", margin: "6px 0 0", fontWeight: 600 }}>
              🚗 {activeCar.make} {activeCar.model} {activeCar.year}
            </p>
          )}
        </div>

        {/* Если не авторизован — баннер */}
        {!session.authenticated && (
          <Card glow="cyan" padding="20px">
            <p style={{ color: colors.white, fontWeight: 700, margin: "0 0 8px", fontSize: "16px" }}>Создайте аккаунт</p>
            <p style={{ color: colors.silver, fontSize: "13px", margin: "0 0 14px" }}>Сохраняйте гараж, историю ТО и документы в облаке</p>
            <Button size="sm" onClick={() => navigate("/auth")}>Войти / Зарегистрироваться</Button>
          </Card>
        )}

        {/* Быстрые действия */}
        <div>
          <p style={{ color: colors.silver, fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Быстрые действия</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {QUICK_ACTIONS.map((a) => (
              <Card key={a.path} onClick={() => navigate(a.path)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }} padding="14px">
                <span style={{ fontSize: "28px" }}>{a.emoji}</span>
                <span style={{ color: colors.white, fontWeight: 600, fontSize: "14px" }}>{a.label}</span>
              </Card>
            ))}
          </div>
        </div>

        {/* Ближайшие сервисы */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ color: colors.silver, fontSize: "13px", fontWeight: 600, margin: 0 }}>Рядом с вами</p>
            <button onClick={() => navigate("/services")} style={{ color: colors.neonCyan, background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Все →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FEATURED_SERVICES.map((s) => (
              <CardLight key={s.name} onClick={() => navigate("/services")} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} padding="14px">
                <span style={{ fontSize: "32px" }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: colors.white, fontWeight: 600, margin: "0 0 4px" }}>{s.name}</p>
                  <p style={{ color: colors.silver, fontSize: "12px", margin: 0 }}>{s.cat} • {s.city} • ⭐ {s.rating}</p>
                </div>
              </CardLight>
            ))}
          </div>
        </div>

        {/* Маркет превью */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ color: colors.silver, fontSize: "13px", fontWeight: 600, margin: 0 }}>Маркетплейс</p>
            <button onClick={() => navigate("/market")} style={{ color: colors.neonCyan, background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Открыть →</button>
          </div>
          <Card onClick={() => navigate("/market")} style={{ cursor: "pointer", background: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(14,165,233,0.12))", border: "1px solid rgba(6,182,212,0.2)" }} padding="20px">
            <p style={{ color: colors.white, fontWeight: 700, fontSize: "16px", margin: "0 0 6px" }}>🛍️ Автозапчасти и аксессуары</p>
            <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>Масла, фильтры, шины — с доставкой по Худжанду</p>
          </Card>
        </div>

      </div>
    </PageLayout>
  );
}
