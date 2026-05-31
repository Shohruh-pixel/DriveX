import { getSupabase, isSupabaseConfigured, uploadFile } from "@shared/api/supabase";
import { fetchWithFallback } from "@shared/api/dataLayer";
import type { Document, MaintenanceRecord } from "@shared/api/types";

// ── Документы ──────────────────────────────────────────────────────────────

export async function fetchDocuments(userId: string): Promise<Document[]> {
  return fetchWithFallback(
    `docs-${userId}`,
    async () => {
      const { data, error } = await getSupabase()
        .from("documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    []
  );
}

export async function uploadDocument(
  userId: string,
  carId: string | null,
  docType: Document["doc_type"],
  file: File
): Promise<Document> {
  let fileUrl = "";

  if (isSupabaseConfigured) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${carId ?? "license"}/${docType}/${Date.now()}.${ext}`;
    fileUrl = await uploadFile("documents", path, file);

    const row = {
      user_id: userId,
      car_id: carId,
      doc_type: docType,
      file_url: fileUrl,
      file_name: file.name,
      mime_type: file.type,
    };
    const { data, error } = await getSupabase().from("documents").insert(row).select().single();
    if (error) throw new Error(error.message);
    return data as Document;
  }

  // Fallback: base64 в localStorage
  const reader = new FileReader();
  fileUrl = await new Promise<string>((res) => {
    reader.onload = () => res(reader.result as string);
    reader.readAsDataURL(file);
  });
  const doc: Document = {
    id: `local-doc-${Date.now()}`,
    user_id: userId,
    car_id: carId ?? undefined,
    doc_type: docType,
    file_url: fileUrl,
    file_name: file.name,
    created_at: new Date().toISOString(),
  };
  return doc;
}

export async function deleteDocument(docId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await getSupabase().from("documents").delete().eq("id", docId);
}

// ── Обслуживание (ТО) ─────────────────────────────────────────────────────

export async function fetchMaintenance(userId: string, carId: string): Promise<MaintenanceRecord[]> {
  return fetchWithFallback(
    `maintenance-${userId}-${carId}`,
    async () => {
      // Хранится в jsonb поле car_maintenance или отдельной таблице
      const { data } = await getSupabase()
        .from("users")
        .select("maintenance_data")
        .eq("id", userId)
        .maybeSingle();
      const allRecords: MaintenanceRecord[] = data?.maintenance_data ?? [];
      return allRecords.filter((r) => r.car_id === carId);
    },
    []
  );
}

export async function saveMaintenance(
  userId: string,
  allRecords: MaintenanceRecord[]
): Promise<void> {
  if (!isSupabaseConfigured) return;
  await getSupabase()
    .from("users")
    .upsert({ id: userId, maintenance_data: allRecords }, { onConflict: "id" });
}
