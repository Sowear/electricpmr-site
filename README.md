# ElectricPMR Site

Сайт и рабочий кабинет для проекта `ElectricPMR`.

В репозитории живут:
- публичный сайт на `React + Vite`
- внутренний кабинет со сметами, проектами, финансами и ролями
- кастомный API на `Cloudflare Workers + D1 + R2`
- `Supabase` edge functions для email- и notification-сценариев

## Stack

- `Vite`
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`
- `React Query`
- `Supabase`
- `Cloudflare Workers`
- `D1`
- `R2`
- `Vitest`

## Structure

- `src/` — фронтенд, страницы, компоненты, хуки, клиентская логика
- `cloudflare/worker.ts` — API для auth, БД, storage и webhook-уведомлений
- `cloudflare/schema.sql` — схема D1
- `supabase/functions/` — edge functions Supabase
- `supabase/migrations/` — SQL-миграции Supabase
- `public/` — статические ассеты, sitemap, robots, фото, видео

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run lint
```

## Frontend local run

1. Установите зависимости:

```bash
npm install
```

2. Создайте `.env` и заполните нужные переменные.

3. Запустите фронтенд:

```bash
npm run dev
```

Обычно Vite поднимается на `http://127.0.0.1:8080`.

## Environment variables

Фронтенд использует:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=
```

Пояснения:
- `VITE_SUPABASE_URL` — URL проекта Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` — publishable key Supabase
- `VITE_API_BASE_URL` — базовый URL Cloudflare API, например `http://127.0.0.1:8787`

Если `VITE_API_BASE_URL` не задан, часть запросов идёт через прямой клиент Supabase.

## Cloudflare worker

`wrangler.toml` уже содержит:
- `DB` — D1 database binding
- `WORK_EXAMPLES_BUCKET` — R2 bucket binding
- `APP_BASE_URL`
- `SESSION_TTL_DAYS`

Локальный запуск worker:

1. Подготовьте D1 и R2.
2. Примените схему:

```bash
npx wrangler d1 execute electricpmr --local --file=cloudflare/schema.sql
```

3. Запустите worker:

```bash
npx wrangler dev
```

По умолчанию worker доступен на `http://127.0.0.1:8787`.

4. Для работы фронтенда через worker добавьте в `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8787
```

## Optional worker env vars

Эти переменные читает `cloudflare/worker.ts`:

```env
SUPER_ADMIN_EMAIL=
REQUEST_EMAIL_WEBHOOK_URL=
REQUEST_EMAIL_WEBHOOK_TOKEN=
ESTIMATE_EMAIL_WEBHOOK_URL=
ESTIMATE_EMAIL_WEBHOOK_TOKEN=
```

Они нужны для:
- bootstrap супер-админа
- webhook/email-уведомлений по заявкам
- webhook/email-уведомлений по сметам

## Supabase

В проекте используются:
- auth и клиентские запросы
- edge functions в `supabase/functions/`
- миграции в `supabase/migrations/`

`supabase/config.toml` содержит настройки функций:
- `send-request-notification`
- `send-estimate-email`
- `validate-status-transition`

## Typical local workflow

1. Поднять Cloudflare worker на `127.0.0.1:8787`
2. Прописать `VITE_API_BASE_URL=http://127.0.0.1:8787`
3. Поднять фронтенд через `npm run dev`
4. Проверить публичный сайт, формы, кабинет и сметы

## Quality checks

Сборка:

```bash
npm run build
```

Тесты:

```bash
npm run test
```

Линтер:

```bash
npm run lint
```

Сейчас `build` и `test` должны проходить. `lint` может ругаться на исторические проблемы типизации и `any` в части кабинета.

## Deploy

Публичная часть собирается через:

```bash
npm run build
```

В проекте также есть:
- `vercel.json` для SPA-роутинга
- `vite-plugin-pwa` для PWA
- prerender production-маршрутов в `vite.config.ts`

Перед деплоем полезно проверить:

```bash
npm run build
npm run test
```

И отдельно убедиться, что:
- канонический домен актуален
- `sitemap.xml` и `robots.txt` соответствуют боевому домену
- нужные env vars выставлены в окружении
