# DRIVEX (React, без сборки)

Это статическая версия прототипа на React 18 без `npm`/сборщика.

## Запуск

- Открой `index.html` в браузере: `C:\Users\shokhrukh.makhkamov\Documents\New project\driveX\react\index.html`
- Нужен интернет, чтобы подтянуть библиотеки из CDN (React/ReactDOM/HTM).

## Что внутри

- Хэш‑роутинг: `#/`, `#/map`, `#/services`, `#/market`, `#/profile` + детали `#/service/:id`, `#/product/:id`.
- Состояние:
  - корзина сохраняется в `localStorage` (`drivex.cart.v1`)
  - настройки сохраняются в `localStorage` (`drivex.settings.v1`)
  - профиль (имя/телефон/email/аватар) сохраняется в `localStorage` (`drivex.profile.v1`)
  - безопасность (2FA/биометрия) сохраняется в `localStorage` (`drivex.security.v1`)
  - документы сохраняются в `localStorage` (`drivex.documents.v1`)
  - права хранятся как один общий документ, техпаспорт и техосмотр отдельно по каждой машине
  - обслуживание и техосмотр хранятся отдельно по каждой машине в `localStorage` (`drivex.maintenance.v1`)
  - активная машина сохраняется в `localStorage` (`drivex.active-car.v1`) и используется в документах/обслуживании

## Стили

- Общие стили и токены лежат в `..\drivex.css` и `..\app.css`.

## Миграции Supabase

- Перед запуском приложения выполните SQL из `migrations/20260606_0004_users_profile_fields.sql` в Supabase SQL Editor.
- Run this SQL in Supabase SQL Editor before starting the app.
- Создайте Storage-бакеты по инструкции в `migrations/STORAGE_SETUP.md`.
