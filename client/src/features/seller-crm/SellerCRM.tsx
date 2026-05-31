/**
 * Seller CRM — два раздела:
 * 1. Товары (добавление, редактирование, фото в Storage)
 * 2. Заказы (статусы, история)
 */
import React, { useRef, useState } from "react";
import { Routes, Route, useNavigate, NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CrmLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { Button } from "@shared/ui/Button";
import { Input, Select } from "@shared/ui/Input";
import { useToast } from "@shared/ui/Toast";
import { colors } from "@shared/ui/tokens";
import { useAuthStore } from "@features/auth/store";
import { fetchMyStore, fetchSellerProducts, fetchSellerOrders, upsertProduct, deleteProduct, updateOrderStatus, upsertStore } from "./api";
import type { Product, Order, Store } from "@shared/api/types";

// ── CRM Layout (tabs) ─────────────────────────────────────────────────────

function SellerNav() {
  const tabs = [
    { path: "/seller", label: "📊 Дашборд", exact: true },
    { path: "/seller/products", label: "📦 Товары" },
    { path: "/seller/orders", label: "🛒 Заказы" },
    { path: "/seller/store", label: "⚙️ Магазин" },
  ];
  return (
    <nav style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "0 16px 12px", scrollbarWidth: "none" }}>
      {tabs.map((t) => (
        <NavLink key={t.path} to={t.path} end={t.exact}
          style={({ isActive }) => ({ flexShrink: 0, padding: "8px 14px", borderRadius: "20px", background: isActive ? colors.neonCyan : "rgba(255,255,255,0.06)", color: isActive ? colors.black : colors.silver, fontWeight: isActive ? 700 : 500, fontSize: "13px", textDecoration: "none" })}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

// ── Главный роутер CRM ────────────────────────────────────────────────────

export function SellerCRM() {
  const { session } = useAuthStore();
  const { data: store } = useQuery({ queryKey: ["my-store", session.id], queryFn: () => fetchMyStore(session.id), enabled: session.authenticated });

  if (!session.authenticated) return <SellerLoginPrompt />;

  return (
    <div style={{ minHeight: "100dvh", background: colors.black, maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ padding: "16px 16px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ color: colors.neonCyan, fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", margin: "0 0 4px" }}>DRIVEX SELLER CRM</p>
        <p style={{ color: colors.white, fontWeight: 700, fontSize: "18px", margin: "0 0 12px" }}>{store?.name || "Мой магазин"}</p>
        <SellerNav />
      </div>
      <Routes>
        <Route path="/"        element={<SellerDashboard storeId={store?.id ?? ""} />} />
        <Route path="/products"   element={<ProductsList storeId={store?.id ?? ""} />} />
        <Route path="/products/new" element={<ProductEditor storeId={store?.id ?? ""} />} />
        <Route path="/products/:id" element={<ProductEditor storeId={store?.id ?? ""} />} />
        <Route path="/orders"  element={<OrdersList storeId={store?.id ?? ""} />} />
        <Route path="/store"   element={<StoreSettings userId={session.id} store={store} />} />
      </Routes>
    </div>
  );
}

// ── Дашборд ───────────────────────────────────────────────────────────────

function SellerDashboard({ storeId }: { storeId: string }) {
  const { data: products = [] } = useQuery({ queryKey: ["seller-products", storeId], queryFn: () => fetchSellerProducts(storeId), enabled: !!storeId });
  const { data: orders = [] } = useQuery({ queryKey: ["seller-orders", storeId], queryFn: () => fetchSellerOrders(storeId), enabled: !!storeId });

  const revenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total_amount, 0);
  const newOrders = orders.filter((o) => o.status === "new").length;
  const activeProducts = products.filter((p) => p.publish_status === "active").length;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {[
          { label: "Выручка", value: `${revenue.toLocaleString()} сом.`, emoji: "💰" },
          { label: "Новых заказов", value: String(newOrders), emoji: "📬" },
          { label: "Активных товаров", value: String(activeProducts), emoji: "📦" },
          { label: "Всего заказов", value: String(orders.length), emoji: "📋" },
        ].map((stat) => (
          <Card key={stat.label} padding="14px">
            <p style={{ color: colors.silver, fontSize: "12px", margin: "0 0 6px" }}>{stat.emoji} {stat.label}</p>
            <p style={{ color: colors.white, fontWeight: 800, fontSize: "22px", margin: 0 }}>{stat.value}</p>
          </Card>
        ))}
      </div>
      {newOrders > 0 && (
        <div style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "16px", padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "28px" }}>🔔</span>
          <div>
            <p style={{ color: colors.white, fontWeight: 700, margin: "0 0 4px" }}>Новые заказы!</p>
            <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>{newOrders} заказ(а) ждут подтверждения</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Список товаров ────────────────────────────────────────────────────────

function ProductsList({ storeId }: { storeId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ["seller-products", storeId], queryFn: () => fetchSellerProducts(storeId), enabled: !!storeId });

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["seller-products"] }); toast.push("Товар удалён"); },
  });

  if (isLoading) return <div style={{ padding: "32px", textAlign: "center", color: colors.silver }}>Загрузка...</div>;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <Button fullWidth onClick={() => navigate("/seller/products/new")}>+ Добавить товар</Button>
      {products.map((p) => (
        <Card key={p.id} padding="14px">
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {p.image_url ? (
              <img src={p.image_url} alt={p.title} style={{ width: "56px", height: "56px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: "56px", height: "56px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🔩</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: colors.white, fontWeight: 600, margin: "0 0 4px", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
              <p style={{ color: colors.neonCyan, fontWeight: 700, margin: "0 0 4px" }}>{p.price} сом.</p>
              <p style={{ color: p.stock_qty > 0 ? colors.success : colors.danger, fontSize: "12px", margin: 0 }}>
                {p.stock_qty > 0 ? `✓ ${p.stock_qty} шт.` : "✗ Нет в наличии"}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/seller/products/${p.id}`)}>✏️</Button>
              <Button size="sm" variant="danger" loading={deleteMut.isPending} onClick={() => { if (confirm("Удалить товар?")) deleteMut.mutate(p.id); }}>🗑️</Button>
            </div>
          </div>
        </Card>
      ))}
      {products.length === 0 && <CardLight padding="32px" style={{ textAlign: "center" }}><p style={{ color: colors.silver }}>Нет товаров. Добавьте первый!</p></CardLight>}
    </div>
  );
}

// ── Редактор товара ───────────────────────────────────────────────────────

const CATEGORIES = ["Масла", "Фильтры", "Тормоза", "Аккумуляторы", "Шины", "Двигатель", "Аксессуары", "Другое"];

function ProductEditor({ storeId }: { storeId: string; productId?: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<Product> & { imageFile?: File; imagePreview?: string }>({
    title: "", category: "Масла", price: 0, stock_qty: 0, description: "", badge: "", brand: "", publish_status: "active",
  });

  const f = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveMut = useMutation({
    mutationFn: () => upsertProduct(storeId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-products"] });
      toast.push("Товар сохранён!", "success");
      navigate("/seller/products");
    },
    onError: (err) => toast.push((err as Error).message, "error"),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => f("imagePreview", reader.result as string);
    reader.readAsDataURL(file);
    f("imageFile", file);
    e.target.value = "";
  };

  return (
    <CrmLayout title="Добавить товар" backPath="/seller/products">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Input label="Название" value={form.title ?? ""} onChange={(e) => f("title", e.target.value)} placeholder="Масло Mobil 5W-30" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Select label="Категория" value={form.category ?? "Масла"} onChange={(e) => f("category", e.target.value)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <Input label="Бренд" value={form.brand ?? ""} onChange={(e) => f("brand", e.target.value)} placeholder="Bosch" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Цена (сом.)" type="number" value={String(form.price ?? 0)} onChange={(e) => f("price", Number(e.target.value))} />
            <Input label="Кол-во" type="number" value={String(form.stock_qty ?? 0)} onChange={(e) => f("stock_qty", Number(e.target.value))} />
          </div>
          <Input label="Описание" value={form.description ?? ""} onChange={(e) => f("description", e.target.value)} placeholder="Краткое описание товара" />
          <Input label="Значок (Хит, Скидка...)" value={form.badge ?? ""} onChange={(e) => f("badge", e.target.value)} />
        </Card>

        {/* Фото товара */}
        <Card padding="16px">
          <p style={{ color: colors.silver, fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>📸 Фото товара</p>
          <div onClick={() => fileRef.current?.click()} style={{ borderRadius: "12px", overflow: "hidden", cursor: "pointer", minHeight: "120px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {form.imagePreview ? (
              <img src={form.imagePreview} alt="preview" style={{ width: "100%", objectFit: "cover", maxHeight: "200px" }} />
            ) : (
              <div style={{ textAlign: "center", color: colors.silver }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
                <p style={{ fontSize: "13px", margin: 0 }}>Нажмите для выбора фото</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          {form.imagePreview && <Button size="sm" variant="ghost" fullWidth style={{ marginTop: "8px" }} onClick={() => { f("imagePreview", ""); f("imageFile", undefined); }}>Удалить фото</Button>}
        </Card>

        <Button fullWidth size="lg" loading={saveMut.isPending} onClick={() => saveMut.mutate()} disabled={!form.title || !storeId}>
          Сохранить товар
        </Button>
      </div>
    </CrmLayout>
  );
}

// ── Список заказов ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = { new: "Новый", confirmed: "Подтверждён", delivery: "В доставке", pickup_ready: "Готов", completed: "Завершён", cancelled: "Отменён" };
const STATUS_COLORS: Record<string, string> = { new: colors.neonCyan, confirmed: colors.electricBlue, delivery: colors.warning, pickup_ready: colors.success, completed: colors.success, cancelled: colors.danger };

function OrdersList({ storeId }: { storeId: string }) {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["seller-orders", storeId], queryFn: () => fetchSellerOrders(storeId), enabled: !!storeId });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order["status"] }) => updateOrderStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["seller-orders"] }); toast.push("Статус обновлён", "success"); },
  });

  if (isLoading) return <div style={{ padding: "32px", textAlign: "center", color: colors.silver }}>Загрузка...</div>;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {orders.map((order) => (
        <Card key={order.id} padding="16px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <p style={{ color: colors.white, fontWeight: 700, margin: "0 0 4px" }}>{order.customer_name}</p>
              <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>{order.created_at.slice(0, 16).replace("T", " ")}</p>
            </div>
            <span style={{ color: STATUS_COLORS[order.status] || colors.silver, fontWeight: 700, fontSize: "13px", background: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: "20px" }}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <div style={{ marginBottom: "12px" }}>
            {order.items.map((item) => (
              <p key={item.product_id} style={{ color: colors.silver, fontSize: "13px", margin: "0 0 4px" }}>
                {item.product_title} × {item.quantity} = {(item.quantity * item.unit_price).toLocaleString()} сом.
              </p>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: colors.neonCyan, fontWeight: 800, margin: 0 }}>{order.total_amount.toLocaleString()} сом.</p>
            {order.status === "new" && (
              <div style={{ display: "flex", gap: "6px" }}>
                <Button size="sm" variant="secondary" loading={updateMut.isPending} onClick={() => updateMut.mutate({ id: order.id, status: "confirmed" })}>Принять</Button>
                <Button size="sm" variant="danger" onClick={() => updateMut.mutate({ id: order.id, status: "cancelled" })}>Отмена</Button>
              </div>
            )}
            {order.status === "confirmed" && (
              <Button size="sm" variant="secondary" onClick={() => updateMut.mutate({ id: order.id, status: "delivery" })}>→ В доставку</Button>
            )}
          </div>
        </Card>
      ))}
      {orders.length === 0 && <CardLight padding="32px" style={{ textAlign: "center" }}><p style={{ color: colors.silver }}>Заказов пока нет</p></CardLight>}
    </div>
  );
}

// ── Настройки магазина ────────────────────────────────────────────────────

function StoreSettings({ userId, store }: { userId: string; store?: Store | null }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: store?.name ?? "", city: store?.city ?? "", address: store?.address ?? "", category: store?.category ?? "Автозапчасти", phone: store?.phone ?? "", description: "", working_hours: "" });
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const saveMut = useMutation({
    mutationFn: () => upsertStore(userId, { ...form, ...(store?.id ? { id: store.id } : {}) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-store"] }); toast.push("Магазин сохранён!", "success"); },
    onError: (err) => toast.push((err as Error).message, "error"),
  });

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Input label="Название магазина" value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="АвтоЗапчасти Худжанд" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Input label="Город" value={form.city} onChange={(e) => f("city", e.target.value)} placeholder="Худжанд" />
          <Input label="Телефон" value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="+992..." />
        </div>
        <Input label="Адрес" value={form.address} onChange={(e) => f("address", e.target.value)} placeholder="ул. Ленина, 1" />
        <Input label="Режим работы" value={form.working_hours} onChange={(e) => f("working_hours", e.target.value)} placeholder="09:00 — 21:00" />
        <Input label="Описание" value={form.description} onChange={(e) => f("description", e.target.value)} placeholder="Краткое описание" />
      </Card>
      <Button fullWidth size="lg" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Сохранить</Button>
    </div>
  );
}

// ── Заглушка для незарегистрированных ────────────────────────────────────

function SellerLoginPrompt() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100dvh", background: colors.black, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <Card glow="cyan" padding="32px" style={{ textAlign: "center", maxWidth: "360px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏪</div>
        <h2 style={{ color: colors.white, margin: "0 0 12px" }}>Seller CRM</h2>
        <p style={{ color: colors.silver, fontSize: "14px", margin: "0 0 20px" }}>Войдите чтобы управлять магазином</p>
        <Button fullWidth onClick={() => navigate("/auth")}>Войти / Зарегистрироваться</Button>
      </Card>
    </div>
  );
}
