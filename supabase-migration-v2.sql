-- ═══════════════════════════════════════════════════════════════
-- DRIVEX — Migration v2: совместимость с seller-backend.js
-- Запустить в Supabase → SQL Editor ПОСЛЕ supabase-schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1. STORES (используется seller-backend.js для маркетплейса)
--    Отдельно от service_centers (партнёры-СТО)
-- ─────────────────────────────────────────────────────────
create table if not exists public.stores (
  id                   text primary key,           -- slug магазина
  owner_user_id        uuid references public.users(id) on delete set null,
  name                 text not null default '',
  city                 text not null default '',
  address              text not null default '',
  category             text not null default 'Автозапчасти',
  business_type        text not null default 'Доставка и самовывоз',
  delivery_available   boolean not null default true,
  pickup_available     boolean not null default true,
  delivery_radius      text not null default '',
  working_hours        text not null default '',
  description          text not null default '',
  location_text        text not null default '',
  latitude             numeric(10,7),
  longitude            numeric(10,7),
  logo_url             text not null default '',
  onboarding_completed boolean not null default false,
  status               text not null default 'pending_review'
                         check (status in ('active','pending_review','blocked')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- 2. PRODUCTS — обновляем под seller-backend.js
--    Добавляем колонки title, publish_status, stock
--    (Если таблица уже создана через v1 — ALTER TABLE)
-- ─────────────────────────────────────────────────────────
-- Снимаем NOT NULL с name (seller-backend пишет title, не name)
alter table public.products alter column name drop not null;
alter table public.products alter column name set default '';

-- Добавляем колонки которые ждёт seller-backend.js
alter table public.products add column if not exists title         text    not null default '';
alter table public.products add column if not exists slug          text    not null default '';
alter table public.products add column if not exists brand         text    not null default '';
alter table public.products add column if not exists sku           text    not null default '';
alter table public.products add column if not exists stock         integer not null default 0;
alter table public.products add column if not exists delivery_available boolean not null default true;
alter table public.products add column if not exists publish_status text   not null default 'draft'
  check (publish_status in ('active','draft','archived'));
alter table public.products add column if not exists market_product_id bigint;

-- Синхронизируем name ↔ title (name = title как fallback)
create or replace function public.sync_product_name_title()
returns trigger language plpgsql as $$
begin
  if NEW.title <> '' and NEW.name = '' then
    NEW.name := NEW.title;
  end if;
  if NEW.name <> '' and NEW.title = '' then
    NEW.title := NEW.name;
  end if;
  if NEW.publish_status <> '' and NEW.status = 'active' and NEW.publish_status = 'draft' then
    NEW.status := 'draft';
  end if;
  if NEW.publish_status = 'active' then
    NEW.status := 'active';
  end if;
  if NEW.stock_qty = 0 and NEW.stock <> 0 then
    NEW.stock_qty := NEW.stock;
  end if;
  if NEW.stock = 0 and NEW.stock_qty <> 0 then
    NEW.stock := NEW.stock_qty;
  end if;
  return NEW;
end; $$;

drop trigger if exists products_sync_fields on public.products;
create trigger products_sync_fields
  before insert or update on public.products
  for each row execute function public.sync_product_name_title();

-- ─────────────────────────────────────────────────────────
-- 3. ORDER_ITEMS (используется при checkout в seller-backend)
-- ─────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id            text primary key,
  order_id      uuid references public.orders(id) on delete cascade,
  product_id    uuid,
  product_title text    not null default '',
  quantity      integer not null default 1,
  unit_price    numeric(12,2) not null default 0,
  total_price   numeric(12,2) not null default 0,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- 4. SELLER_NOTIFICATIONS
-- ─────────────────────────────────────────────────────────
create table if not exists public.seller_notifications (
  id         text primary key default gen_random_uuid()::text,
  store_id   text,
  type       text    not null default 'info',
  title      text    not null default '',
  message    text    not null default '',
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- 5. PROFILES (view → users, для совместимости с legacy кодом)
-- ─────────────────────────────────────────────────────────
create or replace view public.profiles as
  select
    id,
    full_name,
    phone,
    email,
    role,
    created_at,
    updated_at
  from public.users;

-- Разрешаем INSERT/UPDATE через view
create or replace function public.profiles_upsert_fn()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, full_name, phone, role)
  values (new.id, coalesce(new.full_name,''), coalesce(new.phone,''), coalesce(new.role,'buyer'))
  on conflict (id) do update set
    full_name  = coalesce(excluded.full_name, users.full_name),
    phone      = coalesce(excluded.phone,     users.phone),
    role       = coalesce(excluded.role,      users.role),
    updated_at = now();
  return new;
end; $$;

drop trigger if exists profiles_instead_insert on public.profiles;
create trigger profiles_instead_insert
  instead of insert on public.profiles
  for each row execute function public.profiles_upsert_fn();

drop trigger if exists profiles_instead_update on public.profiles;
create trigger profiles_instead_update
  instead of update on public.profiles
  for each row execute function public.profiles_upsert_fn();

-- ─────────────────────────────────────────────────────────
-- 6. ORDERS — добавляем колонки для seller-backend.js
-- ─────────────────────────────────────────────────────────
alter table public.orders add column if not exists customer_user_id  uuid references public.users(id) on delete set null;
alter table public.orders add column if not exists customer_name      text not null default '';
alter table public.orders add column if not exists customer_phone     text not null default '';

-- ─────────────────────────────────────────────────────────
-- 7. USER_ROLE_REQUESTS (заявки на смену роли: seller/partner)
--    Администратор одобряет/отклоняет
-- ─────────────────────────────────────────────────────────
create table if not exists public.role_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  requested_role text not null check (requested_role in ('seller','partner')),
  store_id    text,     -- заполняется для seller
  center_id   uuid,     -- заполняется для partner
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  notes       text,
  reviewed_by uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- 8. RLS для новых таблиц
-- ─────────────────────────────────────────────────────────
alter table public.stores              enable row level security;
alter table public.order_items         enable row level security;
alter table public.seller_notifications enable row level security;
alter table public.role_requests       enable row level security;

-- stores: владелец управляет, все читают активные
create policy "stores_owner"    on public.stores for all    using (auth.uid() = owner_user_id);
create policy "stores_pub_read" on public.stores for select using (status = 'active');

-- order_items: через orders
create policy "order_items_read" on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.buyer_id = auth.uid() or
           exists (select 1 from public.stores s where s.id = o.store_id and s.owner_user_id = auth.uid()))
  ));
create policy "order_items_insert" on public.order_items for insert with check (true);

-- seller_notifications: только владелец магазина
create policy "notif_owner" on public.seller_notifications for all
  using (exists (
    select 1 from public.stores s where s.id = seller_notifications.store_id and s.owner_user_id = auth.uid()
  ));

-- role_requests: пользователь видит свои, сервисный уровень пишет
create policy "role_req_own"    on public.role_requests for all    using (auth.uid() = user_id);
create policy "role_req_insert" on public.role_requests for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- 9. Функция одобрения заявки на роль (вызывается admin-ом)
-- ─────────────────────────────────────────────────────────
create or replace function public.approve_role_request(request_id uuid, reviewer_id uuid)
returns void language plpgsql security definer as $$
declare
  req record;
begin
  select * into req from public.role_requests where id = request_id and status = 'pending';
  if not found then raise exception 'Заявка не найдена или уже обработана'; end if;

  -- Обновляем роль пользователя
  update public.users
  set role = req.requested_role, updated_at = now()
  where id = req.user_id;

  -- Помечаем заявку как одобренную
  update public.role_requests
  set status = 'approved', reviewed_by = reviewer_id, updated_at = now()
  where id = request_id;
end; $$;
