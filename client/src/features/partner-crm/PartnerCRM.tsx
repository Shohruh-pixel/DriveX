/**
 * Partner CRM — CRM сервисного центра (СТО, мойка, детейлинг)
 * Разделы: Дашборд / Записи / Фото / Настройки центра
 */
import React, { useRef, useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CrmLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { Button } from "@shared/ui/Button";
import { Input, Select } from "@shared/ui/Input";
import { useToast } from "@shared/ui/Toast";
import { colors } from "@shared/ui/tokens";
import { useAuthStore } from "@features/auth/store";
import { fetchMyServiceCenter, upsertServiceCenter, uploadServicePhoto, updateServicePhotos, fetchAppointments } from "./api";
import type { ServiceCenter } from "@shared/api/types";
import type { Appointment } from "./api";

// ── Навигация CRM ─────────────────────────────────────────────────────────

function PartnerNav() {
  const tabs = [
    { path: "/partner", label: "📊 Дашборд", exact: true },
    { path: "/partner/appointments", label: "📅 Записи" },
    { path: "/partner/photos", label: "📸 Фото" },
    { path: "/partner/settings", label: "⚙️ Центр" },
  ];
  return (
    <nav style={{ display: "flex", gap: "6px", overflowX: "auto", padding: "0 16px 12px", scrollbarWidth: "none" }}>
      {tabs.map((t) => (
        <NavLink key={t.path} to={t.path} end={t.exact}
          style={({ isActive }) => ({ flexShrink: 0, padding: "8px 14px", borderRadius: "20px", background: isActive ? colors.purple : "rgba(255,255,255,0.06)", color: isActive ? colors.white : colors.silver, fontWeight: isActive ? 700 : 500, fontSize: "13px", textDecoration: "none" })}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

// ── Роутер ────────────────────────────────────────────────────────────────

export function PartnerCRM() {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const { data: center } = useQuery({ queryKey: ["my-center", session.id], queryFn: () => fetchMyServiceCenter(session.id), enabled: session.authenticated });

  if (!session.authenticated) {
    return (
      <div style={{ minHeight: "100dvh", background: colors.black, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <Card glow="cyan" padding="32px" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔧</div>
          <h2 style={{ color: colors.white, margin: "0 0 12px" }}>Partner CRM</h2>
          <p style={{ color: colors.silver, margin: "0 0 20px" }}>Войдите для доступа к кабинету</p>
          <Button fullWidth onClick={() => navigate("/auth")}>Войти</Button>
        </Card>
      </div>
    );
  }

  // Если нет зарегистрированного центра — показываем форму регистрации
  if (!center) {
    return <PartnerRegistration userId={session.id} />;
  }

  return (
    <div style={{ minHeight: "100dvh", background: colors.black, maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ padding: "16px 16px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ color: colors.purple, fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", margin: "0 0 4px" }}>DRIVEX PARTNER CRM</p>
        <p style={{ color: colors.white, fontWeight: 700, fontSize: "18px", margin: "0 0 12px" }}>{center.name}</p>
        <PartnerNav />
      </div>
      <Routes>
        <Route path="/"            element={<PartnerDashboard center={center} />} />
        <Route path="/appointments" element={<AppointmentsList centerId={center.id} />} />
        <Route path="/photos"      element={<PhotosManager center={center} userId={session.id} />} />
        <Route path="/settings"    element={<CenterSettings center={center} userId={session.id} />} />
      </Routes>
    </div>
  );
}

// ── Регистрация центра ────────────────────────────────────────────────────

const SC_CATEGORIES = ["СТО", "Шиномонтаж", "Автомойка", "Детейлинг", "Диагностика", "Эвакуатор", "Другое"];

function PartnerRegistration({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", category: "СТО", city: "Худжанд", address: "", phone: "", working_hours: "09:00 — 21:00", boxes_count: 1, description: "" });
  const f = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const saveMut = useMutation({
    mutationFn: () => upsertServiceCenter(userId, { ...form, phones: [form.phone] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-center"] });
      toast.push("Заявка отправлена! Ожидайте одобрения.", "success");
      navigate("/partner");
    },
    onError: (err) => toast.push((err as Error).message, "error"),
  });

  return (
    <CrmLayout title="Регистрация центра" backPath="/">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <Card padding="16px" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <p style={{ color: colors.purple, fontWeight: 600, margin: "0 0 6px" }}>🔍 Как это работает</p>
          <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>
            1. Заполните анкету → 2. Заявка идёт администратору → 3. После одобрения открывается кабинет
          </p>
        </Card>

        <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Input label="Название центра" value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="АвтоМастер Премиум" />
          <Select label="Категория" value={form.category} onChange={(e) => f("category", e.target.value)} options={SC_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <Input label="Город" value={form.city} onChange={(e) => f("city", e.target.value)} />
            <Input label="Телефон" value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="+992..." />
          </div>
          <Input label="Адрес" value={form.address} onChange={(e) => f("address", e.target.value)} placeholder="ул. Ленина, 1" />
          <Input label="Режим работы" value={form.working_hours} onChange={(e) => f("working_hours", e.target.value)} />
          <div>
            <p style={{ color: colors.silver, fontSize: "12px", fontWeight: 600, margin: "0 0 8px" }}>Кол-во боксов: {form.boxes_count}</p>
            <input type="range" min={1} max={20} value={form.boxes_count} onChange={(e) => f("boxes_count", Number(e.target.value))} style={{ width: "100%", accentColor: colors.purple }} />
          </div>
          <Input label="Описание" value={form.description} onChange={(e) => f("description", e.target.value)} placeholder="Расскажите о вашем центре" />
        </Card>

        <Button fullWidth size="lg" loading={saveMut.isPending} onClick={() => saveMut.mutate()} disabled={!form.name || !form.phone}>
          Отправить заявку
        </Button>
      </div>
    </CrmLayout>
  );
}

// ── Дашборд ───────────────────────────────────────────────────────────────

function PartnerDashboard({ center }: { center: ServiceCenter }) {
  const { data: appointments = [] } = useQuery({ queryKey: ["appointments", center.id], queryFn: () => fetchAppointments(center.id) });
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayApts = appointments.filter((a) => a.date === todayStr);
  const pending = appointments.filter((a) => a.status === "pending").length;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {[
          { emoji: "📅", label: "Сегодня", value: String(todayApts.length) },
          { emoji: "⏳", label: "Ожидают", value: String(pending) },
          { emoji: "⭐", label: "Рейтинг", value: String(center.rating || "—") },
          { emoji: "🏎️", label: "Боксов", value: String(center.boxes_count) },
        ].map((s) => (
          <Card key={s.label} padding="14px">
            <p style={{ color: colors.silver, fontSize: "12px", margin: "0 0 6px" }}>{s.emoji} {s.label}</p>
            <p style={{ color: colors.white, fontWeight: 800, fontSize: "22px", margin: 0 }}>{s.value}</p>
          </Card>
        ))}
      </div>
      {center.status === "pending" && (
        <Card padding="16px" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <p style={{ color: "#fbbf24", fontWeight: 600, margin: "0 0 6px" }}>⏳ На проверке</p>
          <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>Ваш центр ожидает одобрения администратора</p>
        </Card>
      )}
    </div>
  );
}

// ── Записи клиентов ───────────────────────────────────────────────────────

function AppointmentsList({ centerId }: { centerId: string }) {
  const { data: appointments = [], isLoading } = useQuery({ queryKey: ["appointments", centerId], queryFn: () => fetchAppointments(centerId) });

  const STATUS_COLOR: Record<string, string> = { pending: colors.warning, confirmed: colors.neonCyan, completed: colors.success, cancelled: colors.danger };

  if (isLoading) return <div style={{ padding: "32px", textAlign: "center", color: colors.silver }}>Загрузка...</div>;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {appointments.map((apt) => (
        <Card key={apt.id} padding="14px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: colors.white, fontWeight: 600, margin: "0 0 4px" }}>{apt.client_name}</p>
              <p style={{ color: colors.silver, fontSize: "13px", margin: "0 0 4px" }}>{apt.service_type}</p>
              <p style={{ color: colors.silver, fontSize: "12px", margin: 0 }}>{apt.date} {apt.time}</p>
            </div>
            <span style={{ color: STATUS_COLOR[apt.status] ?? colors.silver, fontSize: "12px", fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: "20px" }}>
              {apt.status === "pending" ? "Ожидает" : apt.status === "confirmed" ? "Принят" : apt.status === "completed" ? "Завершён" : "Отменён"}
            </span>
          </div>
        </Card>
      ))}
      {appointments.length === 0 && <CardLight padding="32px" style={{ textAlign: "center" }}><p style={{ color: colors.silver }}>Записей пока нет</p></CardLight>}
    </div>
  );
}

// ── Управление фото (до 5 шт.) ────────────────────────────────────────────

function PhotosManager({ center, userId }: { center: ServiceCenter; userId: string }) {
  const toast = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>(center.photos ?? []);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= 5) { toast.push("Максимум 5 фото", "error"); return; }
    setUploading(true);
    try {
      const url = await uploadServicePhoto(center.id, userId, file);
      const next = [...photos, url];
      setPhotos(next);
      await updateServicePhotos(center.id, next);
      qc.invalidateQueries({ queryKey: ["my-center"] });
      toast.push("Фото загружено!", "success");
    } catch (err) {
      toast.push((err as Error).message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removePhoto = async (url: string) => {
    const next = photos.filter((p) => p !== url);
    setPhotos(next);
    await updateServicePhotos(center.id, next);
    toast.push("Фото удалено");
  };

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>{photos.length}/5 фото загружено</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {photos.map((url) => (
          <div key={url} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9" }}>
            <img src={url} alt="фото" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button onClick={() => removePhoto(url)} style={{ position: "absolute", top: "6px", right: "6px", width: "26px", height: "26px", borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "white", cursor: "pointer", fontSize: "14px" }}>×</button>
          </div>
        ))}
        {photos.length < 5 && (
          <div onClick={() => fileRef.current?.click()} style={{ borderRadius: "12px", aspectRatio: "16/9", background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "32px" }}>
            {uploading ? "⏳" : "+"}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
    </div>
  );
}

// ── Настройки центра ──────────────────────────────────────────────────────

function CenterSettings({ center, userId }: { center: ServiceCenter; userId: string }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: center.name, category: center.category, city: center.city ?? "", address: center.address ?? "",
    working_hours: center.working_hours ?? "", phone: center.phones?.[0] ?? "", description: center.description ?? "",
    boxes_count: center.boxes_count,
  });
  const f = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const saveMut = useMutation({
    mutationFn: () => upsertServiceCenter(userId, { ...form, id: center.id, phones: [form.phone] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-center"] }); toast.push("Сохранено!", "success"); },
    onError: (err) => toast.push((err as Error).message, "error"),
  });

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Input label="Название" value={form.name} onChange={(e) => f("name", e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Input label="Город" value={form.city} onChange={(e) => f("city", e.target.value)} />
          <Input label="Телефон" value={form.phone} onChange={(e) => f("phone", e.target.value)} />
        </div>
        <Input label="Адрес" value={form.address} onChange={(e) => f("address", e.target.value)} />
        <Input label="Режим работы" value={form.working_hours} onChange={(e) => f("working_hours", e.target.value)} />
        <Input label="Описание" value={form.description} onChange={(e) => f("description", e.target.value)} />
      </Card>
      <Button fullWidth size="lg" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Сохранить</Button>
    </div>
  );
}
