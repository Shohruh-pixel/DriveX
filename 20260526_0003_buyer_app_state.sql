-- DRIVEX buyer app state (Supabase)
-- Stores private per-user frontend state while the product data model is still evolving.

create table if not exists public.user_app_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_app_state enable row level security;

drop policy if exists user_app_state_owner_select on public.user_app_state;
drop policy if exists user_app_state_owner_insert on public.user_app_state;
drop policy if exists user_app_state_owner_update on public.user_app_state;
drop policy if exists user_app_state_owner_delete on public.user_app_state;

create policy user_app_state_owner_select on public.user_app_state
  for select
  using (auth.uid() = user_id);

create policy user_app_state_owner_insert on public.user_app_state
  for insert
  with check (auth.uid() = user_id);

create policy user_app_state_owner_update on public.user_app_state
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy user_app_state_owner_delete on public.user_app_state
  for delete
  using (auth.uid() = user_id);
