import { getSupabase, isSupabaseConfigured } from "@shared/api/supabase";
import { fetchWithFallback } from "@shared/api/dataLayer";
import { DEMO_PRODUCTS, DEMO_STORES } from "@shared/api/demo";
import type { Product, Store, Order } from "@shared/api/types";

// ── Продукты ──────────────────────────────────────────────────────────────

export interface ProductFilters {
  storeId?: string;
  category?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const { storeId, category, query, page = 0, pageSize = 24 } = filters;

  return fetchWithFallback(
    `products-${storeId ?? "all"}-${category ?? "all"}-${query ?? ""}-${page}`,
    async () => {
      let req = getSupabase()
        .from("products")
        .select("*")
        .or("publish_status.eq.active,status.eq.active")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (storeId) req = req.eq("store_id", storeId);
      if (category && category !== "all") req = req.ilike("category", `%${category}%`);
      if (query) req = req.or(`title.ilike.%${query}%,name.ilike.%${query}%`);

      const { data, error } = await req;
      if (error) throw error;
      return (data ?? []).map(normalizeProduct);
    },
    DEMO_PRODUCTS
  );
}

export async function fetchStores(): Promise<Store[]> {
  return fetchWithFallback(
    "stores-all",
    async () => {
      const { data, error } = await getSupabase()
        .from("stores")
        .select("*")
        .eq("status", "active")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    DEMO_STORES
  );
}

// ── Заказы ────────────────────────────────────────────────────────────────

export async function fetchBuyerOrders(userId: string): Promise<Order[]> {
  return fetchWithFallback(
    `buyer-orders-${userId}`,
    async () => {
      const { data, error } = await getSupabase()
        .from("orders")
        .select("*, order_items(*)")
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map(normalizeOrder);
    },
    []
  );
}

export async function createOrder(
  order: Omit<Order, "id" | "created_at">
): Promise<Order> {
  if (!isSupabaseConfigured) {
    // Demo mode
    return { ...order, id: `demo-order-${Date.now()}`, created_at: new Date().toISOString() } as Order;
  }

  const { data, error } = await getSupabase()
    .from("orders")
    .insert(order)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalizeOrder(data);
}

// ── Нормализация (обе схемы: title/name, publish_status/status) ────────────

function normalizeProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id ?? ""),
    store_id: String(row.store_id ?? ""),
    title: String(row.title || row.name || ""),
    category: String(row.category ?? ""),
    category_id: String(row.category_id ?? ""),
    price: Number(row.price ?? 0),
    old_price: row.old_price ? Number(row.old_price) : undefined,
    image_url: String(row.image_url ?? ""),
    brand: String(row.brand ?? ""),
    sku: String(row.sku ?? ""),
    stock_qty: Number(row.stock_qty ?? row.stock ?? 0),
    description: String(row.description ?? ""),
    badge: String(row.badge ?? ""),
    rating: Number(row.rating ?? 0),
    reviews_count: Number(row.reviews_count ?? 0),
    publish_status: (String(row.publish_status ?? row.status ?? "draft")) as Product["publish_status"],
    delivery_available: Boolean(row.delivery_available),
  };
}

function normalizeOrder(row: Record<string, unknown>): Order {
  const rawItems = Array.isArray(row.order_items) ? row.order_items : (Array.isArray(row.items) ? row.items : []);
  return {
    id: String(row.id ?? ""),
    store_id: String(row.store_id ?? ""),
    buyer_id: row.buyer_id ? String(row.buyer_id) : undefined,
    customer_name: String(row.customer_name ?? ""),
    customer_phone: String(row.customer_phone ?? ""),
    items: rawItems.map((item: Record<string, unknown>) => ({
      product_id: String(item.product_id ?? ""),
      product_title: String(item.product_title ?? item.title ?? "Товар"),
      quantity: Number(item.quantity ?? item.qty ?? 1),
      unit_price: Number(item.unit_price ?? item.price ?? 0),
    })),
    total_amount: Number(row.total_amount ?? 0),
    status: String(row.status ?? "new") as Order["status"],
    delivery_type: String(row.delivery_type ?? "delivery") as Order["delivery_type"],
    delivery_address: String(row.delivery_address ?? ""),
    payment_status: String(row.payment_status ?? "pending") as Order["payment_status"],
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}
