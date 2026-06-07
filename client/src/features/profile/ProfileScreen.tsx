import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { useToast } from "@shared/ui/Toast";
import { colors } from "@shared/ui/tokens";
import { useAuthStore } from "@features/auth/store";
import { upsertUserProfile } from "@features/auth/api";
import { getSupabase, isSupabaseConfigured, uploadFile } from "@shared/api/supabase";

interface MenuItem { emoji: string; label: string; path: string; badge?: string }

export function ProfileScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { session, cars, logout, setSession } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleSaveProfile = async () => {
    const name = editName.trim();
    if (!name) { toast.push("Введите имя", "error"); return; }
    setSavingProfile(true);
    try {
      await upsertUserProfile(session.id, { name, phone: session.phone, role: session.role });
      setSession({ ...session, name });
      toast.push("Профиль обновлён", "success");
      setEditing(false);
    } catch (err) {
      toast.push((err as Error).message || "Ошибка сохранения", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isSupabaseConfigured) { toast.push("Загрузка недоступна в demo-режиме", "error"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const url = await uploadFile("user-avatars", `${session.id}/avatar.${ext}`, file);
      await getSupabase().from("users").update({ avatar_url: url }).eq("id", session.id);
      setSession({ ...session, avatar_url: url });
      toast.push("Фото обновлено", "success");
    } catch (err) {
      toast.push((err as Error).message || "Ошибка загрузки", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Выйти из аккаунта?\nВаши данные сохранены в облаке."
    );
    if (!confirmed) return;
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
            <div
              onClick={() => !uploadingAvatar && fileRef.current?.click()}
              style={{ position: "relative", width: "60px", height: "60px", flexShrink: 0, cursor: uploadingAvatar ? "default" : "pointer" }}
            >
              <div style={{ width: "60px", height: "60px", borderRadius: "20px", overflow: "hidden", background: "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(14,165,233,0.3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", color: colors.white, opacity: uploadingAvatar ? 0.5 : 1 }}>
                {session.avatar_url
                  ? <img src={session.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (session.name?.[0]?.toUpperCase() ?? "👤")}
              </div>
              {uploadingAvatar && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: colors.white }}>⏳</div>
              )}
              <div style={{ position: "absolute", right: "-4px", bottom: "-4px", width: "24px", height: "24px", borderRadius: "50%", background: colors.neonCyan, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", border: "2px solid #0a0a0f" }}>📷</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Input label="Имя" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Имя и фамилия" autoFocus />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button size="sm" loading={savingProfile} onClick={handleSaveProfile}>Сохранить</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditName(session.name); }}>Отмена</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 4px" }}>
                    <p style={{ color: colors.white, fontWeight: 800, fontSize: "18px", margin: 0 }}>{session.name || "Без имени"}</p>
                    <button onClick={() => { setEditName(session.name); setEditing(true); }} style={{ background: "none", border: "none", color: colors.neonCyan, fontSize: "13px", cursor: "pointer", padding: 0 }}>Редактировать</button>
                  </div>
                  <p style={{ color: colors.silver, fontSize: "13px", margin: "0 0 6px" }}>{session.phone || session.email || ""}</p>
                  <span style={{ color: colors.neonCyan, fontSize: "12px", fontWeight: 700, background: "rgba(6,182,212,0.12)", padding: "3px 10px", borderRadius: "20px" }}>{roleBadge}</span>
                </>
              )}
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
