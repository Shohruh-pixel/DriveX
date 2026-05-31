/**
 * AuthFlow — полный поток аутентификации:
 * Выбор роли → Телефон → OTP → Профиль → Машина
 * Каждый шаг изолирован, ошибка одного не ломает другие.
 */

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { Card } from "@shared/ui/Card";
import { useToast } from "@shared/ui/Toast";
import { colors } from "@shared/ui/tokens";
import {
  sendOtp, verifyOtp, upsertUserProfile, fetchUserRole,
  saveCarToSupabase, validatePhone, BOT_NAME,
  type SendOtpResult,
} from "./api";
import { useAuthStore } from "./store";
import type { Car, UserRole } from "@shared/api/types";

type Step = "role" | "phone" | "otp" | "profile" | "car";

const CAR_MAKES = [
  { make: "Toyota",    models: ["Camry", "Corolla", "RAV4", "Land Cruiser", "Prius"] },
  { make: "Chevrolet", models: ["Cobalt", "Nexia", "Lacetti", "Captiva"] },
  { make: "Hyundai",   models: ["Elantra", "Tucson", "Accent", "Santa Fe", "Sonata"] },
  { make: "Kia",       models: ["Rio", "Sportage", "Ceed", "K5"] },
  { make: "BMW",       models: ["3 Series", "5 Series", "X5", "X6"] },
  { make: "Mercedes",  models: ["C-Class", "E-Class", "GLE", "S-Class"] },
  { make: "Daewoo",    models: ["Matiz", "Nexia", "Lacetti"] },
  { make: "Другое",    models: ["Другая модель"] },
];

export function AuthFlow() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setSession, addCar } = useAuthStore();

  const [step, setStep]           = useState<Step>("role");
  const [phone, setPhone]         = useState("");
  const [otp, setOtp]             = useState("");
  const [name, setName]           = useState("");
  const [otpResult, setOtpResult] = useState<SendOtpResult | null>(null);
  const [userId, setUserId]       = useState<string | null>(null);
  const [carMake, setCarMake]     = useState("");
  const [carModel, setCarModel]   = useState("");
  const [carYear, setCarYear]     = useState("");
  const [busy, setBusy]           = useState(false);

  const models = CAR_MAKES.find((m) => m.make === carMake)?.models ?? [];
  const steps: Step[] = ["role", "phone", "otp", "profile", "car"];
  const stepIdx = steps.indexOf(step);

  // ── Шаг Phone ─────────────────────────────────────────────────────────
  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePhone(phone);
    if (err) { toast.push(err, "error"); return; }
    setBusy(true);
    try {
      const result = await sendOtp(phone);
      setOtpResult(result);
      if (result.testCode) toast.push(`DEV код: ${result.testCode}`);
      setStep("otp");
    } catch (err) {
      toast.push((err as Error).message || "Ошибка отправки кода", "error");
    } finally {
      setBusy(false);
    }
  }, [phone, toast]);

  // ── Шаг OTP ───────────────────────────────────────────────────────────
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.push("Введите 6-значный код", "error"); return; }
    setBusy(true);
    try {
      const result = await verifyOtp(phone, otp, otpResult?.method ?? "dev");
      setUserId(result.userId);
      setStep("profile");
    } catch (err) {
      toast.push((err as Error).message || "Неверный код", "error");
    } finally {
      setBusy(false);
    }
  }, [otp, otpResult, phone, toast]);

  // ── Шаг Profile ───────────────────────────────────────────────────────
  const handleSaveProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.push("Введите ваше имя", "error"); return; }
    setBusy(true);
    try {
      // Загружаем роль из Supabase (мог быть seller/partner ранее)
      const role: UserRole = userId ? await fetchUserRole(userId) : "buyer";
      if (userId) await upsertUserProfile(userId, { name, phone, role });

      const session = {
        id: userId ?? `local-${phone.replace(/\D/g, "")}`,
        name,
        phone,
        email: "",
        role,
        authenticated: true,
        provider: userId ? ("supabase" as const) : ("local" as const),
      };
      setSession(session);

      // Редирект по роли
      if (role === "seller") { navigate("/seller"); return; }
      if (role === "partner") { navigate("/partner"); return; }
      setStep("car");
    } catch (err) {
      toast.push((err as Error).message || "Ошибка сохранения профиля", "error");
    } finally {
      setBusy(false);
    }
  }, [name, phone, userId, navigate, setSession, toast]);

  // ── Шаг Car ───────────────────────────────────────────────────────────
  const handleAddCar = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carMake || !carModel) { toast.push("Выберите марку и модель", "error"); return; }
    setBusy(true);
    try {
      const car: Car = {
        id: `car-${Date.now()}`,
        make: carMake, model: carModel, year: carYear,
        addedAt: new Date().toISOString(),
      };
      addCar(car);
      if (userId) await saveCarToSupabase(userId, [car]);
      toast.push("Автомобиль добавлен!", "success");
      navigate("/");
    } catch (err) {
      toast.push((err as Error).message || "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  }, [carMake, carModel, carYear, userId, addCar, navigate, toast]);

  const handleGuest = () => {
    setSession({ id: "guest", name: "Гость", phone: "", email: "", role: "buyer", authenticated: false, provider: "guest" });
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100dvh", background: colors.black, display: "flex", alignItems: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: "440px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <p style={{ color: colors.neonCyan, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", margin: "0 0 8px" }}>DRIVEX</p>
          <h1 style={{ color: colors.white, fontSize: "28px", fontWeight: 800, margin: "0 0 8px" }}>
            {step === "role" ? "Добро пожаловать" : step === "phone" ? "Вход по телефону" : step === "otp" ? "Введите код" : step === "profile" ? "Ваш профиль" : "Добавить авто"}
          </h1>
          <p style={{ color: colors.silver, fontSize: "14px", margin: 0 }}>
            {step === "role" ? "Выберите как продолжить" : step === "phone" ? `Код придёт в @${BOT_NAME}` : step === "otp" ? `Отправлено на ${phone}` : step === "profile" ? "Как вас зовут?" : "Ваш автомобиль"}
          </p>

          {/* Stepper */}
          {step !== "role" && (
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "16px" }}>
              {(["phone","otp","profile","car"] as Step[]).map((s, i) => (
                <div key={s} style={{ height: "4px", borderRadius: "2px", width: stepIdx - 1 === i ? "24px" : "8px", background: stepIdx - 1 >= i ? colors.neonCyan : "rgba(255,255,255,0.15)", transition: "all 0.3s" }} />
              ))}
            </div>
          )}
        </div>

        {/* ── Role ── */}
        {step === "role" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { emoji: "🚗", title: "Я автовладелец", sub: "Маркет, гараж, сервисы, документы", action: () => setStep("phone") },
              { emoji: "🏪", title: "Я продавец",     sub: "Открыть магазин в маркетплейсе",     action: () => navigate("/seller") },
              { emoji: "🔧", title: "Сервисный центр", sub: "СТО, мойка, детейлинг — CRM",        action: () => navigate("/partner") },
            ].map((item) => (
              <Card key={item.title} onClick={item.action} glow="cyan" padding="16px" style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontSize: "32px" }}>{item.emoji}</span>
                  <div>
                    <p style={{ color: colors.white, fontWeight: 700, margin: "0 0 4px" }}>{item.title}</p>
                    <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>{item.sub}</p>
                  </div>
                </div>
              </Card>
            ))}
            <Button variant="ghost" fullWidth onClick={handleGuest} style={{ marginTop: "4px" }}>
              Войти как гость →
            </Button>
            <p style={{ color: colors.silver, fontSize: "12px", textAlign: "center", margin: 0, opacity: 0.6 }}>
              Гость: просмотр каталога и сервисов без входа
            </p>
          </div>
        )}

        {/* ── Phone ── */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card padding="20px">
              <Input label="Номер телефона" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+992 XX XXX XXXX" autoFocus />
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "14px" }}>
                <span style={{ fontSize: "20px" }}>✈️</span>
                <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>
                  Напишите боту <strong style={{ color: colors.neonCyan }}>@{BOT_NAME}</strong> свой номер заранее — он пришлёт код
                </p>
              </div>
            </Card>
            <Button type="submit" fullWidth size="lg" loading={busy}>Получить код</Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => setStep("role")}>← Назад</Button>
          </form>
        )}

        {/* ── OTP ── */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {otpResult?.needTelegram && (
                <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "12px", padding: "12px" }}>
                  <p style={{ color: colors.neonCyan, fontWeight: 600, margin: "0 0 4px", fontSize: "14px" }}>Напишите @{otpResult.botName} в Telegram</p>
                  <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>Отправьте номер <strong>{phone}</strong> — бот пришлёт код</p>
                </div>
              )}
              {otpResult?.testCode && (
                <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
                  <p style={{ color: "#fbbf24", fontSize: "13px", margin: 0 }}>DEV код: <strong style={{ fontSize: "18px", letterSpacing: "0.1em" }}>{otpResult.testCode}</strong></p>
                </div>
              )}
              <input
                type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="000000" autoFocus
                style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: colors.white, fontSize: "32px", textAlign: "center", letterSpacing: "0.4em", fontWeight: 700, outline: "none", boxSizing: "border-box" }}
              />
            </Card>
            <Button type="submit" fullWidth size="lg" loading={busy} disabled={otp.length < 6}>Подтвердить</Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => { setStep("phone"); setOtp(""); }}>← Изменить номер</Button>
          </form>
        )}

        {/* ── Profile ── */}
        {step === "profile" && (
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Input label="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя и фамилия" autoFocus />
              <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>
                Телефон: <strong style={{ color: colors.white }}>{phone}</strong> ✓
              </p>
            </Card>
            <Button type="submit" fullWidth size="lg" loading={busy} disabled={!name.trim()}>Продолжить →</Button>
          </form>
        )}

        {/* ── Car ── */}
        {step === "car" && (
          <form onSubmit={handleAddCar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <p style={{ color: colors.silver, fontSize: "12px", fontWeight: 600, margin: "0 0 8px" }}>Марка</p>
                  <select value={carMake} onChange={(e) => { setCarMake(e.target.value); setCarModel(""); }}
                    style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: colors.white, fontSize: "14px" }}>
                    <option value="">Выбрать...</option>
                    {CAR_MAKES.map((m) => <option key={m.make} value={m.make} style={{ background: "#0a0a0f" }}>{m.make}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ color: colors.silver, fontSize: "12px", fontWeight: 600, margin: "0 0 8px" }}>Модель</p>
                  <select value={carModel} onChange={(e) => setCarModel(e.target.value)} disabled={!carMake}
                    style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: colors.white, fontSize: "14px" }}>
                    <option value="">Выбрать...</option>
                    {models.map((m) => <option key={m} value={m} style={{ background: "#0a0a0f" }}>{m}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Год выпуска" type="number" value={carYear} onChange={(e) => setCarYear(e.target.value)} placeholder="2019" min="1990" max={String(new Date().getFullYear())} />
            </Card>
            <Button type="submit" fullWidth size="lg" loading={busy} disabled={!carMake || !carModel}>Добавить авто</Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => navigate("/")}>Пропустить →</Button>
          </form>
        )}

      </div>
    </div>
  );
}
