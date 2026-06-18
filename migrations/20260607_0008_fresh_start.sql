-- DRIVEX: ЧИСТЫЙ СТАРТ (удаляет все накопленные тестовые данные пользователей).
--
-- После рефакторинга все личные данные хранятся в ОДНОМ дереве: public.user_app_state
-- (ключ = user_id + key). Этот скрипт очищает тестовую кашу, чтобы начать с нуля.
--
-- Аккаунты входа (auth.users) НЕ трогаем — при следующем входе создастся чистое дерево.
--
-- Применить: Supabase → SQL Editor → New query → вставить → Run.

-- 1) Очистить ВСЕ личные данные (единое дерево). Это главное.
truncate table public.user_app_state;

-- 2) Очистить реестр-визитки. Правильная строка пересоздаётся при входе (self-heal в коде).
--    Если есть внешние связи и delete ругается — закомментируй эту строку.
delete from public.users;

-- 3) (необязательно) Старые дублирующие хранилища, если в них только тест:
-- truncate table public.documents;
-- delete from public.orders where buyer_id is not null;

-- 4) Уникальность номера на будущее (один номер = один аккаунт в реестре).
create unique index if not exists users_phone_unique_idx
  on public.users (phone)
  where phone is not null and phone <> '';
