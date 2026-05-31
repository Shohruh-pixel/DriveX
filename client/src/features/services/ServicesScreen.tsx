import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { colors } from "@shared/ui/tokens";
import { fetchServiceCenters, SERVICE_CATEGORIES } from "./api";
import type { ServiceCenter } from "@shared/api/types";

export function ServicesScreen() {
  const [category, setCategory] = useState("all");
  const [query, setQuery]       = useState("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", category, query],
    queryFn: () => fetchServiceCenters({
      category: category === "all" ? undefined : category,
      query: query || undefined,
    }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageLayout title="Сервисы">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Поиск */}
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Поиск сервиса..."
          style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: colors.white, fontSize: "15px", outline: "none", boxSizing: "border-box" }}
        />

        {/* Категории */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
          {SERVICE_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              style={{ flexShrink: 0, padding: "8px 14px", borderRadius: "20px", background: category === cat.id ? colors.electricBlue : "rgba(255,255,255,0.06)", border: "none", color: category === cat.id ? "#fff" : colors.silver, fontWeight: category === cat.id ? 700 : 500, fontSize: "13px", cursor: "pointer" }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Карточки сервисов */}
        {isLoading
          ? <p style={{ color: colors.silver, textAlign: "center", padding: "32px" }}>Загрузка...</p>
          : services.length === 0
            ? <CardLight padding="32px" style={{ textAlign: "center" }}><p style={{ color: colors.silver }}>Сервисы не найдены</p></CardLight>
            : services.map((sc) => <ServiceCard key={sc.id} sc={sc} />)
        }
      </div>
    </PageLayout>
  );
}

function ServiceCard({ sc }: { sc: ServiceCenter }) {
  const [expanded, setExpanded] = useState(false);
  const phone = sc.phones?.[0] ?? "";

  return (
    <Card padding="0" style={{ overflow: "hidden" }}>
      {/* Фото */}
      {sc.photos?.[0] && (
        <img src={sc.photos[0]} alt={sc.name} style={{ width: "100%", height: "160px", objectFit: "cover" }} loading="lazy" />
      )}

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Заголовок */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: colors.white, fontWeight: 700, fontSize: "16px", margin: "0 0 4px" }}>{sc.name}</p>
            <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>{sc.category} • {sc.city}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ color: "#fbbf24", fontWeight: 700, margin: "0 0 2px" }}>⭐ {sc.rating || "—"}</p>
            <p style={{ color: colors.silver, fontSize: "11px", margin: 0 }}>{sc.reviews_count} отзывов</p>
          </div>
        </div>

        {/* Инфо строка */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {sc.working_hours && <span style={{ color: colors.silver, fontSize: "12px" }}>🕐 {sc.working_hours}</span>}
          {sc.boxes_count > 0 && <span style={{ color: colors.silver, fontSize: "12px" }}>🏎️ {sc.boxes_count} бокс(а)</span>}
          {sc.address && <span style={{ color: colors.silver, fontSize: "12px" }}>📍 {sc.address}</span>}
        </div>

        {/* Описание (раскрывается) */}
        {sc.description && (
          <div>
            <p style={{ color: colors.silver, fontSize: "13px", margin: 0, display: expanded ? "block" : "-webkit-box", WebkitLineClamp: expanded ? undefined : 2, WebkitBoxOrient: "vertical" as const, overflow: expanded ? "visible" : "hidden" }}>
              {sc.description}
            </p>
            {sc.description.length > 80 && (
              <button onClick={() => setExpanded(!expanded)} style={{ color: colors.neonCyan, background: "none", border: "none", cursor: "pointer", fontSize: "12px", padding: "4px 0" }}>
                {expanded ? "Скрыть" : "Подробнее →"}
              </button>
            )}
          </div>
        )}

        {/* Действия */}
        <div style={{ display: "flex", gap: "8px" }}>
          {phone && (
            <a href={`tel:${phone}`} style={{ flex: 1, padding: "10px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: colors.success, fontWeight: 600, fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              📞 Позвонить
            </a>
          )}
          {sc.lat && sc.lng && (
            <a href={`https://maps.google.com/?q=${sc.lat},${sc.lng}`} target="_blank" rel="noreferrer"
              style={{ flex: 1, padding: "10px", borderRadius: "12px", background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", color: colors.electricBlue, fontWeight: 600, fontSize: "14px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              🗺️ На карте
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
