-- DRIVEX — полная схема базы данных Supabase
-- Запускать в Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ─────────────────────────────────────────────
-- 1. USERS (расширение auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.users (
  id            uuid references auth.users on delete cascade primary key,
  full_name     text,
  phone         text,
  email         text,
  avatar_url    text,
  role          text not null default 'buyer'
                  check (role in ('buyer', 'seller', 'partner')),
  fcm_token     text,
  cars          jsonb  not null default '[]',
  active_car_id text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Автоматически создаём запись при регистрации
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.phone, ''),
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = coalesce(excluded.full_name, users.full_name),
    phone      = coalesce(excluded.phone, users.phone),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ─────────────────────────────────────────────
-- 2. SELLERS (магазины продавцов)
-- ─────────────────────────────────────────────
create table if not exists public.sellers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete cascade,
  store_id     text unique not null,
  store_name   text not null,
  description  text,
  category     text,
  city         text,
  address      text,
  phone        text,
  email        text,
  logo_url     text,
  status       text not null default 'pending'
                 check (status in ('active', 'pending', 'blocked')),
  rating       numeric(3,2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3. PRODUCTS (товары маркетплейса)
-- ─────────────────────────────────────────────
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  store_id      text references public.sellers(store_id) on delete cascade,
  seller_id     uuid references public.sellers(id) on delete cascade,
  name          text not null,
  description   text,
  category      text,
  category_id   text,
  price         numeric(12,2) not null default 0,
  old_price     numeric(12,2),
  image_url     text,
  images        jsonb not null default '[]',
  in_stock      boolean not null default true,
  stock_qty     integer not null default 0,
  unit_label    text not null default 'шт.',
  delivery      text,
  badge         text,
  specs         jsonb not null default '[]',
  rating        numeric(3,2) not null default 0,
  reviews_count integer not null default 0,
  status        text not null default 'active'
                  check (status in ('active', 'draft', 'archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 4. SERVICE_CENTERS (партнёры-сервисы)
-- ─────────────────────────────────────────────
create table if not exists public.service_centers (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid references public.users(id) on delete set null,
  name           text not null,
  category       text not null default 'СТО',
  description    text,
  address        text,
  city           text,
  lat            numeric(10,7),
  lng            numeric(10,7),
  working_hours  text,
  phones         jsonb not null default '[]',
  photos         jsonb not null default '[]',
  logo_url       text,
  rating         numeric(3,2) not null default 0,
  reviews_count  integer not null default 0,
  boxes_count    integer not null default 1,
  status         text not null default 'pending'
                   check (status in ('active', 'pending', 'blocked')),
  verified       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 5. ORDERS (заказы маркетплейса)
-- ─────────────────────────────────────────────
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  buyer_id         uuid references public.users(id) on delete set null,
  store_id         text,
  seller_id        uuid references public.sellers(id) on delete set null,
  items            jsonb not null default '[]',
  total_amount     numeric(12,2) not null default 0,
  status           text not null default 'new'
                     check (status in ('new','confirmed','delivery','pickup_ready','completed','cancelled')),
  delivery_type    text not null default 'delivery'
                     check (delivery_type in ('delivery','pickup')),
  delivery_address text,
  payment_method   text not null default 'cash',
  payment_status   text not null default 'pending'
                     check (payment_status in ('pending','paid','refunded')),
  payment_id       text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 6. DOCUMENTS (техпаспорта, техосмотры)
-- ─────────────────────────────────────────────
create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade,
  car_id     text,
  doc_type   text not null
               check (doc_type in ('registration','inspection','insurance','license','other')),
  file_url   text not null,
  file_name  text,
  mime_type  text,
  expires_at date,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 7. PHONE_OTPS (OTP для Telegram-входа)
-- ─────────────────────────────────────────────
create table if not exists public.phone_otps (
  id               uuid primary key default gen_random_uuid(),
  phone            text not null,
  code             text not null,
  telegram_user_id bigint,
  used             boolean not null default false,
  expires_at       timestamptz not null default (now() + interval '10 minutes'),
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 8. RLS (Row Level Security)
-- ─────────────────────────────────────────────
alter table public.users           enable row level security;
alter table public.sellers         enable row level security;
alter table public.products        enable row level security;
alter table public.service_centers enable row level security;
alter table public.orders          enable row level security;
alter table public.documents       enable row level security;
alter table public.phone_otps      enable row level security;

-- Users: read/write своего профиля
create policy "users_own"       on public.users for all    using (auth.uid() = id);
create policy "users_pub_read"  on public.users for select using (true);

-- Sellers: владелец управляет, все читают активные
create policy "sellers_owner"      on public.sellers for all    using (auth.uid() = user_id);
create policy "sellers_pub_read"   on public.sellers for select using (status = 'active');

-- Products: владелец магазина управляет, все читают активные
create policy "products_owner" on public.products for all using (
  exists (select 1 from public.sellers s where s.id = products.seller_id and s.user_id = auth.uid())
);
create policy "products_pub_read" on public.products for select using (status = 'active');

-- Service centers: владелец управляет, все читают активные
create policy "sc_owner"    on public.service_centers for all    using (auth.uid() = owner_user_id);
create policy "sc_pub_read" on public.service_centers for select using (status = 'active');

-- Orders: покупатель и продавец видят свои заказы
create policy "orders_buyer"  on public.orders for all using (auth.uid() = buyer_id);
create policy "orders_seller" on public.orders for all using (
  exists (select 1 from public.sellers s where s.store_id = orders.store_id and s.user_id = auth.uid())
);

-- Documents: только владелец
create policy "docs_own" on public.documents for all using (auth.uid() = user_id);

-- Phone OTPs: сервис пишет, проверка через API
create policy "otp_insert" on public.phone_otps for insert with check (true);
create policy "otp_select" on public.phone_otps for select using (true);

-- ─────────────────────────────────────────────
-- 9. STORAGE BUCKETS
-- Выполнить в Dashboard → Storage → New bucket
-- ─────────────────────────────────────────────
-- Или через SQL:
insert into storage.buckets (id, name, public) values
  ('product-images',  'product-images',  true),
  ('service-photos',  'service-photos',  true),
  ('user-avatars',    'user-avatars',    true),
  ('documents',       'documents',       false)
on conflict (id) do nothing;

-- Storage policies: чтение публичных бакетов
create policy "product_images_read"  on storage.objects for select using (bucket_id = 'product-images');
create policy "product_images_write" on storage.objects for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
create policy "product_images_del"   on storage.objects for delete using  (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "service_photos_read"  on storage.objects for select using (bucket_id = 'service-photos');
create policy "service_photos_write" on storage.objects for insert with check (bucket_id = 'service-photos' and auth.role() = 'authenticated');
create policy "service_photos_del"   on storage.objects for delete using  (bucket_id = 'service-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_read"  on storage.objects for select using (bucket_id = 'user-avatars');
create policy "avatars_write" on storage.objects for insert with check (bucket_id = 'user-avatars' and auth.role() = 'authenticated');
create policy "avatars_del"   on storage.objects for delete using  (bucket_id = 'user-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "docs_read"  on storage.objects for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "docs_write" on storage.objects for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "docs_del"   on storage.objects for delete using  (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
