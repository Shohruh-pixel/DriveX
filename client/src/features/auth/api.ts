/**
 * auth/api.ts — OTP через Telegram + Supabase
 * Поддерживает: Supabase Phone OTP / Сервер (Telegram @DriiiveX_Bot) / Dev-режим
 */

import { getSupabase, isSupabaseConfigured } from "@shared/api/supabase";
import type { AuthSession, UserRole } from "@shared/api/types";

export const BOT_NAME = "DriiiveX_Bot";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("992") && digits.length === 12) return `+${digits}`;
  if ((digits.startsWith("7") || digits.startsWith("8")) && digits.length === 11)
    return `+7${digits.slice(1)}`;
  if (digits.startsWith("998") && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+992${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return `+${digits}`;
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return "Введите корректный номер телефона";
  return null;
}

// ── Шаг 1: Отправить OTP ─────────────────────────────────────────────────

export interface SendOtpResult {
  phone: string;
  method: "supabase" | "server" | "dev";
  testCode?: string;
  needTelegram?: boolean;
  botName?: string;
  message?: string;
}

export async function sendOtp(rawPhone: string): Promise<SendOtpResult> {
  const phone = normalizePhone(rawPhone);

  // 1. Supabase Phone OTP (требует Twilio в настройках Supabase)
  if (isSupabaseConfigured) {
    try {
      const { error } = await getSupabase().auth.signInWithOtp({ phone });
      if (!error) return { phone, method: "supabase" };
      const isPhoneNotEnabled =
        error.message?.includes("Unsupported") ||
        error.message?.includes("provider") ||
        error.message?.includes("SMS") ||
        error.message?.includes("not enabled");
      if (!isPhoneNotEnabled) throw new Error(error.message);
    } catch (err) {
      const msg = (err as Error).message || "";
      if (!msg.includes("Unsupported") && !msg.includes("provider") && !msg.includes("SMS"))
        throw err;
    }
  }

  // 2. Серверный OTP (Telegram @DriiiveX_Bot)
  if (window.location.protocol !== "file:") {
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          phone,
          method: "server",
          botName: data.botName || BOT_NAME,
          needTelegram: data.needTelegram || false,
          testCode: data.testCode,
          message: data.message,
        };
      }
    } catch {
      // Сервер недоступен — dev-fallback
    }
  }

  // 3. Dev-режим (сервер не запущен)
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const key = `drivex_dev_otp_${phone.replace(/\D/g, "")}`;
  try { sessionStorage.setItem(key, code); } catch {}
  console.info(`[auth] DEV OTP for ${phone}: ${code}`);
  return { phone, method: "dev", testCode: code, botName: BOT_NAME };
}

// ── Шаг 2: Проверить OTP ─────────────────────────────────────────────────

export interface VerifyOtpResult {
  userId: string | null;
  session: { access_token: string; refresh_token: string } | null;
  devMode?: boolean;
}

export async function verifyOtp(
  rawPhone: string,
  code: string,
  method: SendOtpResult["method"]
): Promise<VerifyOtpResult> {
  const phone = normalizePhone(rawPhone);

  if (method === "supabase" && isSupabaseConfigured) {
    const { data, error } = await getSupabase().auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });
    if (error) throw new Error(error.message || "Неверный код");
    return { userId: data.user?.id ?? null, session: data.session as VerifyOtpResult["session"] };
  }

  if (method === "dev") {
    const key = `drivex_dev_otp_${phone.replace(/\D/g, "")}`;
    const stored = sessionStorage.getItem(key);
    if (!stored || stored !== code) throw new Error("Неверный код");
    sessionStorage.removeItem(key);

    // Создаём/входим через временный email аккаунт в Supabase
    if (isSupabaseConfigured) {
      const email = `phone_${phone.replace(/\D/g, "")}@drivex.app`;
      const password = `dx_${phone.replace(/\D/g, "")}_2026`;
      const { data: signUpData } = await getSupabase().auth.signUp({ email, password,
        options: { data: { phone, role: "buyer" } }
      });
      if (signUpData?.user) return { userId: signUpData.user.id, session: null, devMode: true };
      const { data: signInData } = await getSupabase().auth.signInWithPassword({ email, password });
      return { userId: signInData?.user?.id ?? null, session: null, devMode: true };
    }
    return { userId: `dev-${phone.replace(/\D/g, "")}`, session: null, devMode: true };
  }

  // Server OTP
  const res = await fetch("/api/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Неверный код");

  if (data.access_token && isSupabaseConfigured) {
    await getSupabase().auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token || "",
    });
  }
  return { userId: data.userId ?? null, session: null };
}

// ── Создать/обновить профиль пользователя ─────────────────────────────────

export async function upsertUserProfile(
  userId: string,
  data: { name: string; phone: string; role?: UserRole }
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await getSupabase()
      .from("users")
      .upsert(
        { id: userId, full_name: data.name, phone: data.phone, role: data.role || "buyer", updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
  } catch { /* ignore */ }
}

// ── Получить роль пользователя из Supabase ────────────────────────────────

export async function fetchUserRole(userId: string): Promise<UserRole> {
  if (!isSupabaseConfigured) return "buyer";
  try {
    const { data } = await getSupabase().from("users").select("role").eq("id", userId).maybeSingle();
    return (data?.role as UserRole) || "buyer";
  } catch {
    return "buyer";
  }
}

// ── Сохранить машину ──────────────────────────────────────────────────────

export async function saveCarToSupabase(userId: string, cars: unknown[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await getSupabase()
      .from("users")
      .upsert({ id: userId, cars, updated_at: new Date().toISOString() }, { onConflict: "id" });
  } catch { /* ignore */ }
}

export { normalizePhone };
