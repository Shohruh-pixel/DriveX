create extension if not exists "pgcrypto";

create type public.user_role as enum ('buyer', 'seller', 'admin');
create type public.store_status as enum ('draft', 'pending_review', 'active', 'suspended');
create type public.publish_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum ('new', 'confirmed', 'pickup_ready', 'delivery', 'completed', 'cancelled');
create type public.delivery_type as enum ('delivery', 'pickup');
create type public.notification_type as enum ('welcome', 'store_updated', 'product_published', 'product_low_stock', 'order_new', 'order_status');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role public.user_role not null default 'buyer',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stores (
  id text primary key,
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  city text not null default '',
  address text not null default '',
  category text not null default 'Автозапчасти',
  business_type text not null default 'Доставка и самовывоз',
  delivery_available boolean not null default false,
  pickup_available boolean not null default true,
  delivery_radius text not null default '',
  working_hours text not null default '',
  description text not null default '',
  location_text text not null default '',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  logo_url text not null default '',
  onboarding_completed boolean not null default false,
  status public.store_status not null default 'pending_review',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists stores_owner_user_id_key on public.stores (owner_user_id);
create index if not exists stores_status_idx on public.stores (status);
create index if not exists stores_city_idx on public.stores (city);

create table if not exists public.products (
  id text primary key,
  store_id text not null references public.stores (id) on delete cascade,
  title text not null,
  slug text not null,
  category text not null,
  brand text not null default '',
  sku text not null default '',
  price numeric(12, 2) not null default 0,
  old_price numeric(12, 2),
  stock integer not null default 0,
  description text not null default '',
  badge text not null default '',
  image_url text not null default '',
  delivery_available boolean not null default false,
  publish_status public.publish_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists products_store_slug_key on public.products (store_id, slug);
create unique index if not exists products_store_sku_key on public.products (store_id, sku);
create index if not exists products_store_publish_idx on public.products (store_id, publish_status);
create index if not exists products_category_idx on public.products (category);

create table if not exists public.orders (
  id text primary key,
  store_id text not null references public.stores (id) on delete cascade,
  customer_user_id uuid references public.profiles (id) on delete set null,
  customer_name text not null,
  customer_phone text not null default '',
  delivery_type public.delivery_type not null default 'delivery',
  delivery_address text not null default '',
  total_amount numeric(12, 2) not null default 0,
  status public.order_status not null default 'new',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_store_status_idx on public.orders (store_id, status);
create index if not exists orders_store_created_idx on public.orders (store_id, created_at desc);

create table if not exists public.order_items (
  id text primary key,
  order_id text not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  product_title text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  total_price numeric(12, 2) not null default 0
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

create table if not exists public.seller_notifications (
  id text primary key,
  store_id text not null references public.stores (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists seller_notifications_store_read_idx on public.seller_notifications (store_id, is_read, created_at desc);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'buyer'::public.user_role);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'admin'::public.user_role;
$$;

create or replace function public.owns_store(target_store_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.stores
    where id = target_store_id
      and owner_user_id = auth.uid()
  );
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_stores_updated_at on public.stores;
create trigger set_stores_updated_at before update on public.stores
for each row execute procedure public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products
for each row execute procedure public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.seller_notifications enable row level security;
alter table public.product_images enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert with check (auth.uid() = id or public.is_admin());

drop policy if exists stores_read_own on public.stores;
create policy stores_read_own on public.stores
for select using (public.owns_store(id) or public.is_admin());

drop policy if exists stores_manage_own on public.stores;
create policy stores_manage_own on public.stores
for all using (public.owns_store(id) or public.is_admin())
with check (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists stores_public_catalog on public.stores;
create policy stores_public_catalog on public.stores
for select using (status = 'active');

drop policy if exists products_public_catalog on public.products;
create policy products_public_catalog on public.products
for select using (
  publish_status = 'active'
  and exists (
    select 1 from public.stores
    where stores.id = products.store_id
      and stores.status = 'active'
  )
);

drop policy if exists products_manage_own on public.products;
create policy products_manage_own on public.products
for all using (public.owns_store(store_id) or public.is_admin())
with check (public.owns_store(store_id) or public.is_admin());

drop policy if exists orders_read_own on public.orders;
create policy orders_read_own on public.orders
for select using (public.owns_store(store_id) or public.is_admin());

drop policy if exists orders_update_own on public.orders;
create policy orders_update_own on public.orders
for update using (public.owns_store(store_id) or public.is_admin())
with check (public.owns_store(store_id) or public.is_admin());

drop policy if exists orders_insert_public on public.orders;
create policy orders_insert_public on public.orders
for insert with check (true);

drop policy if exists order_items_read_own on public.order_items;
create policy order_items_read_own on public.order_items
for select using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (public.owns_store(orders.store_id) or public.is_admin())
  )
);

drop policy if exists order_items_insert_public on public.order_items;
create policy order_items_insert_public on public.order_items
for insert with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
  )
);

drop policy if exists seller_notifications_read_own on public.seller_notifications;
create policy seller_notifications_read_own on public.seller_notifications
for select using (public.owns_store(store_id) or public.is_admin());

drop policy if exists seller_notifications_manage_own on public.seller_notifications;
create policy seller_notifications_manage_own on public.seller_notifications
for all using (public.owns_store(store_id) or public.is_admin())
with check (public.owns_store(store_id) or public.is_admin());

drop policy if exists product_images_manage_own on public.product_images;
create policy product_images_manage_own on public.product_images
for all using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and (public.owns_store(products.store_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and (public.owns_store(products.store_id) or public.is_admin())
  )
);

drop policy if exists activity_logs_read_own on public.activity_logs;
create policy activity_logs_read_own on public.activity_logs
for select using (public.owns_store(store_id) or public.is_admin());

drop policy if exists activity_logs_insert_own on public.activity_logs;
create policy activity_logs_insert_own on public.activity_logs
for insert with check (public.owns_store(store_id) or public.is_admin());

insert into storage.buckets (id, name, public)
values ('seller-assets', 'seller-assets', true)
on conflict (id) do nothing;
