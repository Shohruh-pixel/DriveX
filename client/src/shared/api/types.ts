// ─── Пользователи и роли ──────────────────────────────────────────────────
export type UserRole = "buyer" | "seller" | "partner" | "admin";

export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  fcm_token?: string;
  cars?: Car[];
  active_car_id?: string;
  created_at: string;
}

export interface AuthSession {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  authenticated: boolean;
  provider: "supabase" | "local" | "guest";
}

// ─── Автомобили ───────────────────────────────────────────────────────────
export interface Car {
  id: string;
  make: string;
  model: string;
  year: string;
  color?: string;
  plate?: string;
  mileage?: number;
  addedAt: string;
}

// ─── Документы ────────────────────────────────────────────────────────────
export type DocType = "registration" | "inspection" | "insurance" | "license" | "other";

export interface Document {
  id: string;
  user_id: string;
  car_id?: string;
  doc_type: DocType;
  file_url: string;
  file_name?: string;
  expires_at?: string;
  created_at: string;
}

// ─── ТО и обслуживание ────────────────────────────────────────────────────
export interface MaintenanceRecord {
  id: string;
  car_id: string;
  type: string;
  date: string;
  mileage?: number;
  price: number;
  description?: string;
  next_service_at?: number;
}

// ─── Продукты и маркет ────────────────────────────────────────────────────
export interface Product {
  id: string;
  store_id: string;
  title: string;
  name?: string;
  category: string;
  category_id?: string;
  price: number;
  old_price?: number;
  image_url?: string;
  brand?: string;
  sku?: string;
  stock_qty: number;
  description?: string;
  badge?: string;
  rating: number;
  reviews_count: number;
  publish_status: "active" | "draft" | "archived";
  delivery_available?: boolean;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  address?: string;
  category?: string;
  logo_url?: string;
  phone?: string;
  rating: number;
  status: "active" | "pending_review" | "blocked";
}

// ─── Заказы ───────────────────────────────────────────────────────────────
export type OrderStatus = "new" | "confirmed" | "delivery" | "pickup_ready" | "completed" | "cancelled";

export interface OrderItem {
  product_id: string;
  product_title: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  store_id: string;
  buyer_id?: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  delivery_type: "delivery" | "pickup";
  delivery_address?: string;
  payment_status: "pending" | "paid" | "refunded";
  created_at: string;
}

// ─── Сервисные центры ─────────────────────────────────────────────────────
export interface ServiceCenter {
  id: string;
  owner_user_id?: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  working_hours?: string;
  phones: string[];
  photos: string[];
  logo_url?: string;
  rating: number;
  reviews_count: number;
  boxes_count: number;
  status: "active" | "pending" | "blocked";
}

// ─── Уведомления продавца ─────────────────────────────────────────────────
export interface SellerNotification {
  id: string;
  store_id: string;
  type: "order_new" | "order_status" | "product_low_stock" | "product_published" | "store_updated" | "welcome";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ─── Утилиты ──────────────────────────────────────────────────────────────
export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

export type LoadingState = "idle" | "loading" | "success" | "error";
