-- DRIVEX: разрешить продавцам добавлять товары своего магазина.
--
-- ПРИЧИНА (почему products = 0): таблица products настроена под СТАРУЮ схему `sellers`,
-- а приложение (seller-backend.js) и магазины используют таблицу `stores`:
--   • products.store_id ссылался на sellers(store_id) → вставка для stores-магазина падает по FK;
--   • RLS-политика products_owner проверяла sellers/seller_id → продавец не проходил проверку.
-- Итог: продавец физически не мог опубликовать товар. Этот скрипт чинит FK и RLS.
--
-- Применить: Supabase → SQL Editor → New query → вставить → Run.

-- 1) Внешний ключ store_id → stores (а не sellers)
alter table public.products drop constraint if exists products_store_id_fkey;
alter table public.products drop constraint if exists products_seller_id_fkey;
alter table public.products
  add constraint products_store_id_fkey
  foreign key (store_id) references public.stores(id) on delete cascade;

-- 2) RLS: владелец магазина (через stores.owner_user_id) управляет своими товарами;
--    активные товары читают все.
alter table public.products enable row level security;
drop policy if exists "products_owner"    on public.products;
drop policy if exists "products_pub_read"  on public.products;

create policy "products_owner" on public.products for all
  using (
    exists (select 1 from public.stores s
            where s.id = products.store_id and s.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.stores s
            where s.id = products.store_id and s.owner_user_id = auth.uid())
  );

create policy "products_pub_read" on public.products for select
  using (status = 'active' or publish_status = 'active');
