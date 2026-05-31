/**
 * dataLayer — унифицированный слой данных:
 * Supabase → localStorage fallback → demo данные
 *
 * Каждый запрос сохраняет результат в localStorage как кэш.
 * Если Supabase недоступен — возвращает кэш или demo данные.
 */

import { getSupabase, isSupabaseConfigured } from "./supabase";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 минут

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`drivex.cache.${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    localStorage.setItem(`drivex.cache.${key}`, JSON.stringify(entry));
  } catch {
    // localStorage может быть недоступен
  }
}

// Универсальная функция для запросов к Supabase с кэшированием и fallback
export async function fetchWithFallback<T>(
  cacheKey: string,
  supabaseQuery: () => Promise<T>,
  fallback: T
): Promise<T> {
  // 1. Пробуем Supabase
  if (isSupabaseConfigured) {
    try {
      const result = await supabaseQuery();
      if (result !== null && result !== undefined) {
        cacheSet(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn(`[dataLayer] Supabase error for ${cacheKey}:`, err);
    }
  }

  // 2. Пробуем кэш localStorage
  const cached = cacheGet<T>(cacheKey);
  if (cached !== null) return cached;

  // 3. Возвращаем demo данные
  return fallback;
}

// Мутация с оптимистичным обновлением кэша
export async function mutateWithCache<T>(
  cacheKey: string,
  supabaseQuery: () => Promise<T>,
  optimisticUpdate?: (prev: T | null) => T
): Promise<T> {
  // Оптимистично обновляем кэш
  if (optimisticUpdate) {
    const prev = cacheGet<T>(cacheKey);
    cacheSet(cacheKey, optimisticUpdate(prev));
  }

  if (!isSupabaseConfigured) {
    // В demo режиме просто возвращаем что есть
    const cached = cacheGet<T>(cacheKey);
    if (cached) return cached;
    throw new Error("Demo mode: Supabase not configured");
  }

  const result = await supabaseQuery();
  cacheSet(cacheKey, result);
  return result;
}

// Получить текущего пользователя (не через состояние — напрямую из Supabase)
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await getSupabase().auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

// Сохранить данные пользователя в localStorage (оффлайн persistence)
export function saveUserLocal(key: string, data: unknown): void {
  try {
    localStorage.setItem(`drivex.user.${key}`, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadUserLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`drivex.user.${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
