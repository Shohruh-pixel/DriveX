# AGENTS

## Purpose
This repository is a static React 18 prototype app delivered without a bundler. Most application logic lives in `app.js`. The goal is to help AI coding agents make productive changes quickly and safely.

## Key facts
- The app is built as a static single-page application using React/ReactDOM/HTM from CDN.
- There is no Node.js build pipeline in the repository. Do not add a bundler or assume a `package.json` build step.
- Supabase is already integrated via `supabase-config.js` and `window.supabase`.
- Most user state is currently persisted in `localStorage`.
- Main file for features and data sync is `app.js`.

## Important files
- `app.js` — main application logic and state management.
- `supabase-config.js` — Supabase project URL, anonymous key, and bucket configuration.
- `storageService.js` — a small localStorage wrapper used for service history.
- `README.md` — documents the current localStorage persistence model.

## Supabase guidance
- Use `window.DRIVEX_SUPABASE_CONFIG` and `getSupabaseClient()` in `app.js`.
- The app already detects Supabase availability via `getBuyerAuthStatus()`.
- When Supabase is available, prefer persistent storage in Supabase tables instead of `localStorage`.
- Keep local fallback behavior for apps that run without Supabase.
- Do not edit `vendor/supabase.min.js` unless you are intentionally updating the dependency.

## Current localStorage responsibilities
The repo stores user/buyer data with keys such as:
- `drivex.buyerGarage` / `drivex.active-car.v1`
- `drivex.profile.v1`
- `drivex.documents.v1`
- `drivex.maintenance.v1`
- `drivex.saved-places.v1`
- buyer session/auth state under `drivex.buyerSession`
- seller data under `drivex.seller*` keys

## Recommended agent behavior
- When asked to build features like "Мои Автомобили", "Документы", "Журнал Обслуживания", "История Заказов", "История Поездок", "Сохраненные Места", "Уведомления", "Профиль и Безопасность", "Настройки" or similar, first identify whether data is currently only in localStorage.
- For new user data flows, create Supabase persistence functions in `app.js` or a new helper module that uses `getSupabaseClient()`.
- Preserve the current localStorage fallback to avoid breaking the existing static prototype.
- Prefer incremental changes: migrate individual state slices to Supabase rather than rewriting all storage at once.

## What not to do
- Do not remove `localStorage` support outright.
- Do not introduce a Node.js/webpack/rollup-based build system.
- Do not modify the existing CDN-based React/HTM loading approach unless absolutely required.

## Suggested next agent customizations
- `AGENTS.md` can be followed by creating a custom skill for Supabase migration tasks.
- If work expands, add a dedicated `supabase-integration` instructions file describing table schemas and auth flows.
