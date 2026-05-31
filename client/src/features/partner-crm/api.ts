import { getSupabase, isSupabaseConfigured, uploadFile } from "@shared/api/supabase";
import { fetchWithFallback } from "@shared/api/dataLayer";
import { DEMO_SERVICES } from "@shared/api/demo";
import type { ServiceCenter } from "@shared/api/types";

// ── Сервисный центр ───────────────────────────────────────────────────────

export async function fetchMyServiceCenter(userId: string): Promise<ServiceCenter | null> {
  if (!isSupabaseConfigured) {
    return { id: "demo-sc", owner_user_id: userId, name: "Мой СТО (Demo)", category: "СТО", phones: ["+992 90 000 00 00"], photos: [], rating: 4.8, reviews_count: 0, boxes_count: 3, status: "active" };
  }
  const { data } = await getSupabase()
    .from("service_centers")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertServiceCenter(
  userId: string,
  center: Partial<ServiceCenter>
): Promise<ServiceCenter> {
  if (!isSupabaseConfigured) {
    return { ...center, id: center.id ?? `sc-${Date.now()}`, owner_user_id: userId, phones: center.phones ?? [], photos: center.photos ?? [], rating: 0, reviews_count: 0, boxes_count: center.boxes_count ?? 1, status: "pending" } as ServiceCenter;
  }
  const row = {
    owner_user_id: userId,
    name: center.name ?? "",
    category: center.category ?? "СТО",
    description: center.description ?? "",
    address: center.address ?? "",
    city: center.city ?? "",
    working_hours: center.working_hours ?? "",
    phones: center.phones ?? [],
    photos: center.photos ?? [],
    logo_url: center.logo_url ?? "",
    boxes_count: center.boxes_count ?? 1,
    lat: center.lat ?? null,
    lng: center.lng ?? null,
    status: "pending",
    updated_at: new Date().toISOString(),
    ...(center.id ? { id: center.id } : {}),
  };
  const { data, error } = await getSupabase()
    .from("service_centers")
    .upsert(row, { onConflict: center.id ? "id" : "owner_user_id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  // Обновляем роль пользователя → partner
  try { await getSupabase().from("users").upsert({ id: userId, role: "partner" }, { onConflict: "id" }); } catch { /* ignore */ }
  return data as ServiceCenter;
}

export async function uploadServicePhoto(
  centerId: string,
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${centerId}/${Date.now()}.${ext}`;
  return uploadFile("service-photos", path, file);
}

export async function updateServicePhotos(centerId: string, photos: string[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  await getSupabase().from("service_centers").update({ photos, updated_at: new Date().toISOString() }).eq("id", centerId);
}

// ── Публичные сервисы (каталог) ───────────────────────────────────────────

export async function fetchServiceCenters(params: { category?: string; city?: string; query?: string } = {}): Promise<ServiceCenter[]> {
  return fetchWithFallback(
    `services-${params.category ?? "all"}-${params.city ?? ""}-${params.query ?? ""}`,
    async () => {
      let req = getSupabase().from("service_centers").select("*").eq("status", "active").order("rating", { ascending: false }).limit(60);
      if (params.category && params.category !== "all") req = req.eq("category", params.category);
      if (params.city) req = req.ilike("city", `%${params.city}%`);
      if (params.query) req = req.ilike("name", `%${params.query}%`);
      const { data, error } = await req;
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, phones: Array.isArray(r.phones) ? r.phones : [], photos: Array.isArray(r.photos) ? r.photos : [] })) as ServiceCenter[];
    },
    DEMO_SERVICES
  );
}

// ── Записи клиентов (Partner CRM) ─────────────────────────────────────────

export interface Appointment {
  id: string;
  center_id: string;
  client_name: string;
  client_phone: string;
  service_type: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  car_info?: string;
}

export async function fetchAppointments(centerId: string): Promise<Appointment[]> {
  return fetchWithFallback(
    `appointments-${centerId}`,
    async () => {
      const { data, error } = await getSupabase()
        .from("appointments")
        .select("*")
        .eq("center_id", centerId)
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    []
  );
}

export async function createAppointment(apt: Omit<Appointment, "id">): Promise<Appointment> {
  if (!isSupabaseConfigured) {
    return { ...apt, id: `apt-${Date.now()}` };
  }
  const { data, error } = await getSupabase().from("appointments").insert(apt).select().single();
  if (error) throw new Error(error.message);
  return data as Appointment;
}
