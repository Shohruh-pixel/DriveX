import React, { useEffect, useRef, useState } from "react";
import { PageLayout } from "@shared/ui/Layout";
import { colors } from "@shared/ui/tokens";
import { useQuery } from "@tanstack/react-query";
import { fetchServiceCenters } from "@features/services/api";
import type { ServiceCenter } from "@shared/api/types";

// Leaflet подключается через CDN чтобы не увеличивать bundle
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletLib = any;
declare global {
  interface Window {
    L: LeafletLib;
  }
}

const HUDŽAND_CENTER: [number, number] = [40.2836, 69.6213];

const CATEGORY_ICONS: Record<string, string> = {
  "СТО": "🔧", "Шиномонтаж": "⭕", "Автомойка": "💧",
  "Детейлинг": "✨", "Диагностика": "🔍", "Эвакуатор": "🚛",
};

export function MapScreen() {
  const mapRef    = useRef<HTMLDivElement>(null);
  const leafRef   = useRef<unknown>(null);
  const [leafletReady, setLeafletReady] = useState(!!window.L);
  const [selected, setSelected] = useState<ServiceCenter | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["services", "all"],
    queryFn: () => fetchServiceCenters({}),
    staleTime: 5 * 60 * 1000,
  });

  // Загружаем Leaflet через CDN если ещё не загружен
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // Инициализируем карту когда Leaflet готов
  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current).setView(HUDŽAND_CENTER, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map);

    // Маркер текущего положения
    const locIcon = L.divIcon({ html: `<div style="font-size:28px;line-height:1">📍</div>`, className: "", iconSize: [32, 32], iconAnchor: [16, 32] });
    L.marker(HUDŽAND_CENTER, { icon: locIcon }).addTo(map).bindPopup("Худжанд (центр)");

    leafRef.current = map;

    // Очистка при unmount
    return () => { map.remove(); leafRef.current = null; };
  }, [leafletReady]);

  // Добавляем маркеры сервисов
  useEffect(() => {
    const map = leafRef.current as (ReturnType<typeof window.L.map> | null);
    if (!map || !window.L || !services.length) return;
    const L = window.L;

    services.forEach((sc) => {
      if (!sc.lat || !sc.lng) return;
      const emoji = CATEGORY_ICONS[sc.category] ?? "🔧";
      const icon = L.divIcon({
        html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${emoji}</div>`,
        className: "", iconSize: [28, 28], iconAnchor: [14, 28],
      });
      L.marker([sc.lat, sc.lng], { icon })
        .addTo(map)
        .on("click", () => setSelected(sc));
    });
  }, [services, leafletReady]);

  return (
    <PageLayout title="Карта" hideNav={false}>
      {/* Карта */}
      <div style={{ position: "relative" }}>
        {!leafletReady && (
          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)" }}>
            <p style={{ color: colors.silver }}>Загрузка карты...</p>
          </div>
        )}
        <div ref={mapRef} style={{ height: "60vh", width: "100%", display: leafletReady ? "block" : "none" }} />

        {/* Легенда */}
        <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(10,10,15,0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "4px" }}>
          {Object.entries(CATEGORY_ICONS).map(([cat, emoji]) => (
            <p key={cat} style={{ color: colors.silver, fontSize: "11px", margin: 0 }}>{emoji} {cat}</p>
          ))}
        </div>
      </div>

      {/* Выбранный сервис */}
      {selected && (
        <div style={{ padding: "16px", background: colors.black, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <div>
              <p style={{ color: colors.white, fontWeight: 700, fontSize: "16px", margin: "0 0 4px" }}>{selected.name}</p>
              <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>{selected.category} • {selected.address}</p>
            </div>
            <button onClick={() => setSelected(null)} style={{ color: colors.silver, background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {selected.phones?.[0] && (
              <a href={`tel:${selected.phones[0]}`} style={{ flex: 1, padding: "10px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: colors.success, fontWeight: 600, fontSize: "14px", textDecoration: "none", textAlign: "center" }}>
                📞 Позвонить
              </a>
            )}
            <a href={`https://maps.google.com/?q=${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer"
              style={{ flex: 1, padding: "10px", borderRadius: "12px", background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", color: colors.electricBlue, fontWeight: 600, fontSize: "14px", textDecoration: "none", textAlign: "center" }}>
              🗺️ Маршрут
            </a>
          </div>
        </div>
      )}

      {/* Список под картой */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <p style={{ color: colors.silver, fontSize: "13px", fontWeight: 600, margin: 0 }}>Все сервисы ({services.length})</p>
        {services.filter((sc) => sc.lat && sc.lng).map((sc) => (
          <button key={sc.id} onClick={() => {
            setSelected(sc);
            const map = leafRef.current as ReturnType<typeof window.L.map>;
            if (map && sc.lat && sc.lng) map.setView([sc.lat, sc.lng], 16);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", cursor: "pointer", textAlign: "left", width: "100%" }}>
            <span style={{ fontSize: "28px" }}>{CATEGORY_ICONS[sc.category] ?? "🔧"}</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: colors.white, fontWeight: 600, margin: "0 0 4px", fontSize: "14px" }}>{sc.name}</p>
              <p style={{ color: colors.silver, fontSize: "12px", margin: 0 }}>{sc.address} • ⭐ {sc.rating}</p>
            </div>
          </button>
        ))}
      </div>
    </PageLayout>
  );
}
