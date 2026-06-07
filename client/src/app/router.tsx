import React, { lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { FeatureBoundary } from "./ErrorBoundary";
import { CarDocumentsScreen } from "@features/garage/GarageScreen";
import { MaintenanceScreen }  from "@features/garage/MaintenanceScreen";

// ── Lazy imports — каждый модуль изолирован, ошибка одного ≠ падение всего ──
const HomeScreen     = lazy(() => import("@features/home/HomeScreen")            .then((m) => ({ default: m.HomeScreen })));
const AuthFlow       = lazy(() => import("@features/auth/AuthFlow")              .then((m) => ({ default: m.AuthFlow })));
const GarageScreen   = lazy(() => import("@features/garage/GarageScreen")        .then((m) => ({ default: m.GarageScreen })));
const MarketScreen   = lazy(() => import("@features/marketplace/MarketScreen")   .then((m) => ({ default: m.MarketScreen })));
const CartScreen     = lazy(() => import("@features/marketplace/CartScreen")     .then((m) => ({ default: m.CartScreen })));
const OrdersScreen   = lazy(() => import("@features/orders/OrdersScreen")        .then((m) => ({ default: m.OrdersScreen })));
const ServicesScreen = lazy(() => import("@features/services/ServicesScreen")    .then((m) => ({ default: m.ServicesScreen })));
const MapScreen      = lazy(() => import("@features/map/MapScreen")              .then((m) => ({ default: m.MapScreen })));
const AiScreen       = lazy(() => import("@features/ai/AiScreen")               .then((m) => ({ default: m.AiScreen })));
const ProfileScreen  = lazy(() => import("@features/profile/ProfileScreen")      .then((m) => ({ default: m.ProfileScreen })));
const FavoritesScreen = lazy(() => import("@features/profile/FavoritesScreen")    .then((m) => ({ default: m.FavoritesScreen })));
const SellerCRM      = lazy(() => import("@features/seller-crm/SellerCRM")       .then((m) => ({ default: m.SellerCRM })));
const PartnerCRM     = lazy(() => import("@features/partner-crm/PartnerCRM")     .then((m) => ({ default: m.PartnerCRM })));

// Заглушка для разделов в разработке
function Placeholder({ title, emoji = "🚧" }: { title: string; emoji?: string }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", padding: "24px", color: "#94a3b8", textAlign: "center" }}>
      <div style={{ fontSize: "56px" }}>{emoji}</div>
      <h2 style={{ color: "#f0f4ff", margin: 0 }}>{title}</h2>
      <p style={{ margin: 0, fontSize: "14px" }}>Раздел в разработке</p>
      <a href="/" style={{ color: "#06b6d4", fontSize: "14px" }}>← На главную</a>
    </div>
  );
}

// Route-компоненты для параметризованных путей
function CarDocsRoute()        { const { carId } = useParams<{ carId: string }>(); return <CarDocumentsScreen carId={carId ?? ""} />; }
function MaintenanceRoute()    { return <MaintenanceScreen />; }

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Главная ── */}
        <Route path="/" element={<FeatureBoundary name="Главная"><HomeScreen /></FeatureBoundary>} />

        {/* ── Авторизация ── */}
        <Route path="/auth" element={<FeatureBoundary name="Авторизация"><AuthFlow /></FeatureBoundary>} />

        {/* ── Гараж ── */}
        <Route path="/garage"                      element={<FeatureBoundary name="Гараж"><GarageScreen /></FeatureBoundary>} />
        <Route path="/garage/docs/:carId"          element={<FeatureBoundary name="Документы"><CarDocsRoute /></FeatureBoundary>} />
        <Route path="/garage/maintenance/:carId"   element={<FeatureBoundary name="История ТО"><MaintenanceRoute /></FeatureBoundary>} />
        <Route path="/garage/maintenance"          element={<FeatureBoundary name="История ТО"><MaintenanceRoute /></FeatureBoundary>} />

        {/* ── Маркетплейс ── */}
        <Route path="/market"      element={<FeatureBoundary name="Маркет"><MarketScreen /></FeatureBoundary>} />
        <Route path="/market/cart" element={<FeatureBoundary name="Корзина"><CartScreen /></FeatureBoundary>} />
        <Route path="/orders"      element={<FeatureBoundary name="Заказы"><OrdersScreen /></FeatureBoundary>} />

        {/* ── Сервисы и карта ── */}
        <Route path="/services" element={<FeatureBoundary name="Сервисы"><ServicesScreen /></FeatureBoundary>} />
        <Route path="/map"      element={<FeatureBoundary name="Карта"><MapScreen /></FeatureBoundary>} />

        {/* ── AI ── */}
        <Route path="/ai" element={<FeatureBoundary name="AI Ассистент"><AiScreen /></FeatureBoundary>} />

        {/* ── Профиль ── */}
        <Route path="/profile"   element={<FeatureBoundary name="Профиль"><ProfileScreen /></FeatureBoundary>} />
        <Route path="/favorites" element={<FeatureBoundary name="Избранное"><FavoritesScreen /></FeatureBoundary>} />
        <Route path="/emergency" element={<Placeholder title="🆘 SOS Помощь" emoji="🆘" />} />

        {/* ── CRM ── */}
        <Route path="/seller/*"  element={<FeatureBoundary name="Seller CRM"><SellerCRM /></FeatureBoundary>} />
        <Route path="/partner/*" element={<FeatureBoundary name="Partner CRM"><PartnerCRM /></FeatureBoundary>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
