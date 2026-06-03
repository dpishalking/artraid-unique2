# Money Magnet Analytics (pishalking.ru)

AI SaaS для маркетинга: аудит сайта, генератор прототипов лендинга, генератор офферов.

## Стек

- **Frontend:** React, TypeScript, Vite, Tailwind, shadcn/ui
- **Backend:** Supabase (Auth, Postgres, Edge Functions)
- **AI:** Google Gemini
- **Deploy:** GitHub Actions → Timeweb (статика), Supabase CLI (functions)

## Локальная разработка

```bash
npm ci
cp .env.example .env   # при наличии шаблона; иначе задайте VITE_SUPABASE_* 
npm run dev
```

## Скрипты

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production build + SPA fallback для Timeweb |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

## Основные маршруты

- `/` — хаб
- `/audit` — AI-аудит сайта
- `/prototype` — конструктор прототипа (требует auth)
- `/offer-generator` — генератор офферов
- `/pricing` — тарифы и кредиты
- `/admin` — админ-кабинет

## Деплой

- Push в `main` → фронт на pishalking.ru (см. `.github/workflows/deploy-timeweb.yml`)
- Edge functions: `supabase functions deploy … --project-ref <ref>` (см. `.cursor/rules/deploy-after-changes.mdc`)

## Документация

- `docs/SUPABASE_PQZB_MIGRATION.md` — миграция Supabase-проекта
