-- DRIVEX: один номер телефона = один аккаунт.
--
-- ПРИЧИНА ДУБЛЕЙ: раньше разные экраны/пути входа создавали разные Supabase-аккаунты
-- для одного номера (phone_<digits>@drivex.app в OTP, <digits>@phone.drivex.app в форме,
-- плюс регистрация по реальному email). В коде это уже унифицировано.
--
-- ВАЖНО: гараж, журнал ТО и документы хранятся в ОТДЕЛЬНОЙ таблице user_app_state
-- (ключ = auth-id). Этот скрипт её НЕ трогает — данные не потеряются.
-- Правильная строка в public.users пересоздаётся автоматически при следующем входе
-- (self-heal в app/app-main.js: loginBuyer upsert по auth-id).

-- ── Как применить ──────────────────────────────────────────────────────────
-- Supabase Dashboard → SQL Editor → New query → вставить весь файл → Run.

-- Шаг 1. Посмотреть дубли (необязательно):
--   select phone, count(*) from public.users
--   where coalesce(phone,'') <> '' group by phone having count(*) > 1;

-- Шаг 2. Удалить все строки public.users для номеров, у которых есть дубли.
--   (Реальные данные в user_app_state не затрагиваются; строка восстановится при входе.)
delete from public.users
where coalesce(phone, '') <> ''
  and phone in (
    select phone
    from public.users
    where coalesce(phone, '') <> ''
    group by phone
    having count(*) > 1
  );

-- Шаг 3. Закрепить уникальность номера (пустые номера не блокируются).
create unique index if not exists users_phone_unique_idx
  on public.users (phone)
  where phone is not null and phone <> '';
