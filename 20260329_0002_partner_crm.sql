-- DRIVEX Partner CRM schema (Supabase)
-- Safe defaults: all tables RLS enabled, owners limited by partner_id + owner_id

-- Partners
create table if not exists public.partners (
  id text primary key,
  name text not null,
  category text not null,
  description text,
  address text,
  city text,
  district text,
  phone text,
  altPhone text,
  email text,
  ownerId uuid,
  rating numeric default 5,
  reviewCount integer default 0,
  priceLevel integer default 2,
  services jsonb default '[]'::jsonb,
  status text default 'pending',
  createdAt timestamptz default now(),
  updatedAt timestamptz default now()
);

-- Partner auth users (light)
create table if not exists public.partner_users (
  id uuid primary key default gen_random_uuid(),
  partnerId text references public.partners(id) on delete cascade,
  email text,
  phone text,
  role text default 'owner',
  password_hash text,
  created_at timestamptz default now()
);

-- Services reference
create table if not exists public.partner_services (
  id uuid primary key default gen_random_uuid(),
  partnerId text references public.partners(id) on delete cascade,
  name text not null,
  price numeric default 0,
  duration text,
  category text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.service_categories (
  id text primary key,
  title text not null,
  icon text,
  accent text
);

-- Staff
create table if not exists public.partner_staff (
  id uuid primary key default gen_random_uuid(),
  partnerId text references public.partners(id) on delete cascade,
  name text not null,
  role text,
  specialization text,
  workload integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Bookings
create table if not exists public.partner_bookings (
  id uuid primary key default gen_random_uuid(),
  userId text,
  partnerId text references public.partners(id) on delete cascade,
  carId text,
  serviceName text,
  date date,
  time text,
  price numeric default 0,
  status text default 'pending',
  commission numeric default 0,
  rating numeric,
  comment text,
  createdAt timestamptz default now()
);

-- Customers
create table if not exists public.partner_customers (
  id uuid primary key default gen_random_uuid(),
  partnerId text references public.partners(id) on delete cascade,
  name text,
  phone text,
  email text,
  totalSpent numeric default 0,
  visits integer default 0,
  lastVisit timestamptz
);

-- Customer cars
create table if not exists public.customer_cars (
  id uuid primary key default gen_random_uuid(),
  customerId uuid references public.partner_customers(id) on delete cascade,
  partnerId text references public.partners(id) on delete cascade,
  make text,
  model text,
  year integer,
  vin text,
  plate text,
  mileage integer,
  created_at timestamptz default now()
);

-- Work orders
create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  partnerId text references public.partners(id) on delete cascade,
  bookingId uuid references public.partner_bookings(id) on delete set null,
  customerId uuid references public.partner_customers(id) on delete set null,
  carId uuid references public.customer_cars(id) on delete set null,
  complaint text,
  diagnosis text,
  labor_total numeric default 0,
  parts_total numeric default 0,
  total numeric default 0,
  status text default 'new',
  opened_at timestamptz default now(),
  closed_at timestamptz
);

-- Work order items (labor)
create table if not exists public.work_order_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid references public.work_orders(id) on delete cascade,
  title text,
  qty numeric default 1,
  price numeric default 0
);

-- Work order parts
create table if not exists public.work_order_parts (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid references public.work_orders(id) on delete cascade,
  title text,
  qty numeric default 1,
  price numeric default 0,
  supplier text
);

-- Status history
create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  entity text,
  entity_id uuid,
  from_status text,
  to_status text,
  partnerId text,
  created_at timestamptz default now()
);

-- Media
create table if not exists public.partner_media (
  id uuid primary key default gen_random_uuid(),
  partnerId text references public.partners(id) on delete cascade,
  url text,
  kind text,
  meta jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.partners enable row level security;
alter table public.partner_users enable row level security;
alter table public.partner_services enable row level security;
alter table public.partner_staff enable row level security;
alter table public.partner_bookings enable row level security;
alter table public.partner_customers enable row level security;
alter table public.customer_cars enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_items enable row level security;
alter table public.work_order_parts enable row level security;
alter table public.partner_media enable row level security;

-- Policies: owner can manage own partner data
create policy partners_owner on public.partners
  for all using (auth.uid() = ownerId);

create policy partner_users_owner on public.partner_users
  for all using (auth.uid() = ownerId)
  with check (auth.uid() = ownerId);

create policy partner_services_owner on public.partner_services
  for all using (exists (select 1 from public.partners p where p.id = partnerId and p.ownerId = auth.uid()));

create policy partner_staff_owner on public.partner_staff
  for all using (exists (select 1 from public.partners p where p.id = partnerId and p.ownerId = auth.uid()));

create policy partner_bookings_owner on public.partner_bookings
  for select using (exists (select 1 from public.partners p where p.id = partnerId and p.ownerId = auth.uid()))
  with check (exists (select 1 from public.partners p where p.id = partnerId and p.ownerId = auth.uid()));

create policy partner_customers_owner on public.partner_customers
  for all using (exists (select 1 from public.partners p where p.id = partnerId and p.ownerId = auth.uid()));

create policy customer_cars_owner on public.customer_cars
  for all using (exists (select 1 from public.partners p where p.id = partnerId and p.ownerId = auth.uid()));

create policy work_orders_owner on public.work_orders
  for all using (exists (select 1 from public.partners p where p.id = partnerId and p.ownerId = auth.uid()));

create policy work_order_items_owner on public.work_order_items
  for all using (exists (select 1 from public.work_orders w join public.partners p on p.id = w.partnerId where w.id = work_order_id and p.ownerId = auth.uid()));

create policy work_order_parts_owner on public.work_order_parts
  for all using (exists (select 1 from public.work_orders w join public.partners p on p.id = w.partnerId where w.id = work_order_id and p.ownerId = auth.uid()));

create policy partner_media_owner on public.partner_media
  for all using (exists (select 1 from public.partners p where p.id = partnerId and p.ownerId = auth.uid()));

