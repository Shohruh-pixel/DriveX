import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fppczriwvbflrhnorgqv.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_NmqZT7hxynolWR00ux_hkA_mEpzEKFg";

// Единый клиент на всё приложение — предотвращает Lock conflicts
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "drivex-auth",
      },
    });
  }
  return _client;
}

// Проверяем что Supabase реально настроен (не пустые placeholder значения)
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("YOUR_")
);

// Получить публичный URL файла из Storage
export function getStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// Загрузить файл в Storage, вернуть публичный URL
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const sb = getSupabase();
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
