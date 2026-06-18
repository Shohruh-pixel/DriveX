-- DRIVEX: продавец должен видеть заказы своего магазина (и менять их статус).
--
-- ПРИЧИНА (почему в Seller CRM «Заказов пока нет»): на таблице orders включён RLS,
-- но политики SELECT для ВЛАДЕЛЬЦА МАГАЗИНА не было. Покупатель видел свой заказ
-- (customer_user_id = auth.uid()), а продавец при запросе
-- orders where store_id = <его магазин> получал 0 строк БЕЗ ошибки (RLS молча
-- скрывает строки). Этот скрипт добавляет доступ владельцу магазина к заказам и
-- позициям заказа, сохраняя доступ покупателя к своим заказам.
--
-- Применить: Supabase → SQL Editor → New query → вставить → Run.

-- ── orders ───────────────────────────────────────────────────────────
alter table public.orders enable row level security;

drop policy if exists "orders_store_owner"     on public.orders;
drop policy if exists "orders_customer_read"    on public.orders;
drop policy if exists "orders_customer_insert"  on public.orders;

-- Владелец магазина: полный доступ к заказам своего магазина (читать + менять статус).
create policy "orders_store_owner" on public.orders for all
  using (
    exists (select 1 from public.stores s
            where s.id = orders.store_id and s.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.stores s
            where s.id = orders.store_id and s.owner_user_id = auth.uid())
  );

-- Покупатель: видит свои заказы.
create policy "orders_customer_read" on public.orders for select
  using (customer_user_id = auth.uid());

-- Покупатель: создаёт заказ от своего имени.
create policy "orders_customer_insert" on public.orders for insert
  with check (customer_user_id = auth.uid());

-- ── order_items ──────────────────────────────────────────────────────
alter table public.order_items enable row level security;

drop policy if exists "order_items_store_owner"    on public.order_items;
drop policy if exists "order_items_customer_read"   on public.order_items;
drop policy if exists "order_items_customer_insert" on public.order_items;

-- Владелец магазина: позиции заказов своего магазина.
create policy "order_items_store_owner" on public.order_items for all
  using (
    exists (select 1 from public.orders o
            join public.stores s on s.id = o.store_id
            where o.id = order_items.order_id and s.owner_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.orders o
            join public.stores s on s.id = o.store_id
            where o.id = order_items.order_id and s.owner_user_id = auth.uid())
  );

-- Покупатель: позиции своих заказов.
create policy "order_items_customer_read" on public.order_items for select
  using (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id and o.customer_user_id = auth.uid())
  );

create policy "order_items_customer_insert" on public.order_items for insert
  with check (
    exists (select 1 from public.orders o
            where o.id = order_items.order_id and o.customer_user_id = auth.uid())
  );
