# КРОДО

Трекер задач с механикой «шахматных часов»: одна задача идёт — остальные на паузе.
Три вида: Bento, Канбан, Список.

## Разработка

```
npm install
npm run dev
```

Нужны переменные окружения `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.

## Миграция базы данных

Перед первым деплоем этой версии выполните SQL-миграцию — см.
[`docs/SUPABASE_MIGRATION.md`](docs/SUPABASE_MIGRATION.md).
