-- DRIVEX: объединение данных одного пользователя в ОДИН аккаунт.
--
-- Ситуация: данные разнесены по двум аккаунтам одного человека (номер +992927125989):
--   834323d4-f787-4dec-8081-be557363a31f  → gmail (shohruh15082006@gmail.com) — ОСНОВНОЙ
--   5ee99196-c69b-4d40-ad04-6e31cb7e766f  → phone_992927125989@drivex.app — слить в основной
--
-- НЕ ТРОГАЕМ другого пользователя 54c3853e-... (Далер Обидов).
--
-- Как применить: Supabase → SQL Editor → New query → вставить весь файл → Run.

-- ── Шаг 1. Перенести данные phone-аккаунта в gmail-аккаунт (новее — побеждает) ──
insert into public.user_app_state (user_id, key, value, updated_at)
select
  '834323d4-f787-4dec-8081-be557363a31f'::uuid,
  s.key,
  s.value,
  s.updated_at
from public.user_app_state s
where s.user_id = '5ee99196-c69b-4d40-ad04-6e31cb7e766f'::uuid
on conflict (user_id, key) do update
  set value = excluded.value,
      updated_at = excluded.updated_at
  where excluded.updated_at > public.user_app_state.updated_at;

-- ── Шаг 2. Удалить старые данные phone-аккаунта (уже перенесены) ───────────────
delete from public.user_app_state
where user_id = '5ee99196-c69b-4d40-ad04-6e31cb7e766f'::uuid;

-- ── Шаг 3. Убрать дубли в public.users по номеру ───────────────────────────────
--   (правильная строка с твоим auth-id пересоздастся при следующем входе — self-heal)
delete from public.users
where coalesce(phone, '') <> ''
  and phone in (
    select phone from public.users
    where coalesce(phone, '') <> ''
    group by phone having count(*) > 1
  );

-- ── Шаг 4. Один номер = один аккаунт (на будущее) ──────────────────────────────
create unique index if not exists users_phone_unique_idx
  on public.users (phone)
  where phone is not null and phone <> '';
