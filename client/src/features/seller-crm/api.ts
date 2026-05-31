import { getSupabase, isSupabaseConfigured, uploadFile } from "@shared/api/supabase";
import { fetchWithFallback } from "@shared/api/dataLayer";
import { DEMO_PRODUCTS, DEMO_ORDERS } from "@shared/api/demo";
import type { Product, Order, Store } from "@shared/api/types";

// ── Магазин ───────────────────────────────────────────────────────────────

export async function fetchMyStore(userId: string): Promise<Store | null> {
  if (!isSupabaseConfigured) {
    return { id: "demo-store", name: "Мой магазин (Demo)", city: "Худжанд", rating: 4.8, status: "active" };
  }
  const { data } = await getSupabase()
    .from("stores")
    .select("*")
    .eq("owner_user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertStore(
  userId: string,
  store: Partial<Store>
): Promise<Store> {
  if (!isSupabaseConfigured) {
    return { id: store.id ?? `store-${Date.now()}`, name: store.name ?? "", city: store.city ?? "", rating: 0, status: "pending_review", ...store };
  }
  const row = {
    owner_user_id: userId,
    name: store.name ?? "",
    city: store.city ?? "",
    address: store.address ?? "",
    category: store.category ?? "Автозапчасти",
    description: (store as Record<string, unknown>).description ?? "",
    working_hours: (store as Record<string, unknown>).working_hours ?? "",
    logo_url: store.logo_url ?? "",
    onboarding_completed: true,
    status: "active",
    updated_at: new Date().toISOString(),
    ...(store.id ? { id: store.id } : {}),
  };
  const { data, error } = await getSupabase()
    .from("stores")
    .upsert(row, { onConflict: store.id ? "id" : "owner_user_id" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Store;
}

// ── Продукты ──────────────────────────────────────────────────────────────

export async function fetchSellerProducts(storeId: string): Promise<Product[]> {
  return fetchWithFallback(
    `seller-products-${storeId}`,
    async () => {
      const { data, error } = await getSupabase()
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    DEMO_PRODUCTS
  );
}

export async function upsertProduct(
  storeId: string,
  product: Partial<Product> & { imageFile?: File }
): Promise<Product> {
  let imageUrl = product.image_url ?? "";

  // Загрузка фото в Supabase Storage
  if (product.imageFile && isSupabaseConfigured) {
    const ext = product.imageFile.name.split(".").pop() ?? "jpg";
    const path = `${storeId}/${Date.now()}.${ext}`;
    imageUrl = await uploadFile("product-images", path, product.imageFile);
  }

  const row = {
    store_id: storeId,
    title: product.title ?? "",
    name: product.title ?? "",
    category: product.category ?? "",
    brand: product.brand ?? "",
    sku: product.sku ?? "",
    price: product.price ?? 0,
    old_price: product.old_price ?? null,
    image_url: imageUrl,
    stock: product.stock_qty ?? 0,
    stock_qty: product.stock_qty ?? 0,
    description: product.description ?? "",
    badge: product.badge ?? "",
    delivery_available: product.delivery_available ?? true,
    publish_status: product.publish_status ?? "active",
    status: product.publish_status ?? "active",
    updated_at: new Date().toISOString(),
    ...(product.id ? { id: product.id } : {}),
  };

  if (!isSupabaseConfigured) {
    return { ...product, id: product.id ?? `prod-${Date.now()}`, image_url: imageUrl, store_id: storeId, rating: 0, reviews_count: 0 } as Product;
  }

  const { data, error } = await getSupabase()
    .from("products")
    .upsert(row, { onConflict: product.id ? "id" : undefined })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProduct(productId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await getSupabase().from("products").delete().eq("id", productId);
}

// ── Заказы ────────────────────────────────────────────────────────────────

export async function fetchSellerOrders(storeId: string): Promise<Order[]> {
  return fetchWithFallback(
    `seller-orders-${storeId}`,
    async () => {
      const { data, error } = await getSupabase()
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    DEMO_ORDERS
  );
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
  if (!isSupabaseConfigured) return;
  await getSupabase().from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
}

// ── Уведомления ───────────────────────────────────────────────────────────

export async function fetchNotifications(storeId: string) {
  if (!isSupabaseConfigured) return [];
  const { data } = await getSupabase()
    .from("seller_notifications")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}
