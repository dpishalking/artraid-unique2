# Переезд на Supabase pqzb

Проект: **pqzbcmjxodohxecnmavn**  
Dashboard: https://supabase.com/dashboard/project/pqzbcmjxodohxecnmavn

Старый проект Lovable (**faymecb**) больше не используется в коде после обновления секретов.

## Что уже сделано в репозитории

- `supabase/config.toml` → `project_id = pqzbcmjxodohxecnmavn`
- Миграции: `supabase db push` на pqzb
- Edge Functions задеплоены на pqzb (включая `admin-api`, `get-admin-dashboard`)

## Обязательно: GitHub Secrets (прод)

В **Settings → Secrets → Actions** репозитория обновите:

| Secret | Значение |
|--------|----------|
| `VITE_SUPABASE_PROJECT_ID` | `pqzbcmjxodohxecnmavn` |
| `VITE_SUPABASE_URL` | `https://pqzbcmjxodohxecnmavn.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key из pqzb → Settings → API |
| `VITE_OFFER_SUPABASE_URL` | то же, что `VITE_SUPABASE_URL` (или удалить, если не используется в workflow) |
| `VITE_OFFER_SUPABASE_PUBLISHABLE_KEY` | то же, что anon key |
| `VITE_ADMIN_EMAILS` | `tvtska@gmail.com,d.pishalkin@gmail.com` |

После сохранения — **Re-run** workflow Deploy или push в `main`.

## Локально

Скопируйте `.env.example` → `.env` и подставьте anon key из pqzb Dashboard.

## Supabase Secrets (Edge Functions)

В [pqzb → Edge Functions → Secrets](https://supabase.com/dashboard/project/pqzbcmjxodohxecnmavn/settings/functions):

| Secret | Назначение |
|--------|------------|
| `GEMINI_API_KEY` | AI (прототипы, аудит, офферы) |
| `FIRECRAWL_API_KEY` | Парсинг сайтов (если был на fayme) |
| `ADMIN_EMAILS` | `tvtska@gmail.com,d.pishalkin@gmail.com` |
| `ADMIN_BACKLOG_TOKEN` | опционально, legacy backlog |

Скопируйте значения с faymecb, если есть доступ, или создайте новые ключи.

## Auth (pqzb Dashboard)

[Authentication → URL Configuration](https://supabase.com/dashboard/project/pqzbcmjxodohxecnmavn/auth/url-configuration):

- **Site URL:** `https://pishalking.ru`
- **Redirect URLs:** `https://pishalking.ru/**`, `http://localhost:5173/**`

Google OAuth — заново настроить Client ID/Secret в pqzb, если использовали вход через Google.

## Важно: пользователи и данные

Без доступа к **faymecb** старые аккаунты и прототипы **не переносятся автоматически**.

- Пользователям нужно **зарегистрироваться заново** на pqzb.
- Старые прототипы на faymecb останутся там (если Lovable не отдаст дамп).

При появлении доступа к faymecb можно сделать экспорт `profiles`, `prototypes`, `user_credits` и импорт в pqzb.

## Проверка после переключения

1. Регистрация / вход на https://pishalking.ru/auth
2. Создание прототипа в /builder
3. Админка https://pishalking.ru/admin/dashboard
4. Генератор офферов /offer-generator
