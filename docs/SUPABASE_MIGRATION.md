# Миграция Supabase для нового дизайна КРОДО

Новый интерфейс (Bento / Канбан / Список, метки, приоритеты, группы) хранит
дополнительные поля в таблице `tasks` и две новые таблицы для пользовательских
колонок и меток. Изменения аддитивные — существующие данные не удаляются
и не переименовываются, откат на старый фронтенд остаётся рабочим.

## Как применить

1. Откройте **Supabase Studio → SQL Editor** для вашего проекта.
2. Выполните файл целиком: [`supabase/migrations/0001_crodo_design.sql`](../supabase/migrations/0001_crodo_design.sql).
3. **Важно:** выполните миграцию **до** деплоя нового фронтенда — иначе запросы
   к `column_id`/`label_id`/`priority`/`group_name` будут падать с ошибкой
   "column does not exist".

## Что делает миграция

- Добавляет в `tasks` колонки `column_id` (статус: backlog/today/doing/done),
  `label_id`, `group_name`, `priority` (`low`/`medium`/`high`), `note`.
- Бэкфиллит существующие задачи: архивные → `done`, остальные → `today`.
  `total_seconds`, `is_archived`, `position`, `is_running`, `last_start_time` —
  не трогаются.
- Создаёт таблицы `task_columns` и `task_labels` (RLS: доступ только владельцу)
  и сидирует в них дефолтные 4 колонки и 4 метки для всех существующих
  пользователей.
- Включает Realtime-репликацию для `tasks` (для синхронизации таймера между
  открытыми вкладками/устройствами).

## Проверка перед запуском (по желанию)

Если хотите свериться со схемой перед миграцией:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_name = 'tasks'
order by ordinal_position;

select * from pg_policies where tablename = 'tasks';
```

## Новые пользователи

Клиент сам создаёт дефолтные колонки/метки при первом входе, если их ещё нет
(`ensureWorkspace()` в `src/hooks/useCrodoStore.js`), так что регистрация новых
пользователей не требует ручных действий после миграции.
