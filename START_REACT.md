# DRIVEX — Запуск React + TypeScript + Vite

## Новое приложение (React)

```bash
cd client
npm run dev
# Открыть: http://localhost:5173
```

## Старое приложение (vanilla HTM, продолжает работать)

```bash
node server.js
# Открыть: http://localhost:8080
```

## Структура проекта

```
DriveX/
├── client/                  ← НОВЫЙ React + Vite проект
│   ├── src/
│   │   ├── app/             ← роутер, провайдеры, ErrorBoundary
│   │   ├── shared/
│   │   │   ├── api/         ← Supabase клиент, types, demo данные, dataLayer
│   │   │   └── ui/          ← Button, Card, Input, Toast, Layout, BottomNav
│   │   └── features/        ← изолированные модули (ошибка в одном ≠ падение всего)
│   │       ├── auth/        ← телефон → OTP (@DriiiveX_Bot) → профиль → авто
│   │       ├── home/        ← главный экран
│   │       ├── garage/      ← машины, документы в Supabase Storage
│   │       ├── marketplace/ ← товары из Supabase / demo данные
│   │       ├── seller-crm/  ← CRM продавца: товары, заказы, магазин
│   │       ├── partner-crm/ ← CRM сервисного центра: записи, фото, настройки
│   │       └── profile/     ← профиль пользователя
│   └── .env.local           ← Supabase URL + anon key
│
├── app.js                   ← старый код (23k строк, работает на :8080)
├── server.js                ← Node.js сервер (OTP, AI, static)
└── supabase-schema.sql      ← SQL схема базы данных
```

## Ключевые особенности нового кода

### ErrorBoundary — изоляция ошибок
```tsx
// Если Seller CRM упадёт — Home, Market, Garage продолжают работать
<FeatureBoundary name="Seller CRM">
  <SellerCRM />
</FeatureBoundary>
```

### Lazy loading — быстрая загрузка
```tsx
// Каждая фича грузится только когда пользователь туда заходит
const SellerCRM = lazy(() => import("@features/seller-crm/SellerCRM"))
```

### Supabase → localStorage fallback → demo данные
```ts
// Автоматически: Supabase → localStorage кэш → demo данные
const products = await fetchWithFallback("products", supabaseQuery, DEMO_PRODUCTS)
```

### Единый Supabase клиент (нет Lock conflicts)
```ts
// Один клиент на всё приложение
export function getSupabase(): SupabaseClient { ... }
```

## Маршруты

| URL | Компонент |
|-----|-----------|
| `/` | HomeScreen |
| `/auth` | AuthFlow (телефон → OTP → профиль → авто) |
| `/garage` | GarageScreen |
| `/garage/docs/:carId` | CarDocumentsScreen |
| `/market` | MarketScreen |
| `/seller/*` | SellerCRM |
| `/partner/*` | PartnerCRM |
| `/profile` | ProfileScreen |

## Переменные окружения (client/.env.local)

```env
VITE_SUPABASE_URL=https://fppczriwvbflrhnorgqv.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```
