-- Crodo design port: adds kanban columns, labels and priority to tasks.
-- Additive only — existing data (total_seconds, is_archived, position, ...) is untouched.
-- Run this in Supabase Studio -> SQL Editor BEFORE deploying the new frontend build.

-- ============ 1. Расширение таблицы tasks ============
alter table public.tasks
  add column if not exists column_id  text    not null default 'today',
  add column if not exists label_id   text,
  add column if not exists group_name text    not null default '',
  add column if not exists priority   text    not null default 'medium',
  add column if not exists note       text;

-- Бэкфилл существующих строк: архив -> done, остальное -> today
update public.tasks
   set column_id = case when coalesce(is_archived, false) then 'done' else 'today' end;

alter table public.tasks
  drop constraint if exists tasks_priority_check;
alter table public.tasks
  add  constraint tasks_priority_check check (priority in ('low', 'medium', 'high'));

create index if not exists tasks_user_column_pos_idx
  on public.tasks (user_id, column_id, position);

-- ============ 2. Пользовательские колонки канбана ============
create table if not exists public.task_columns (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  slug       text not null,
  name       text not null,
  is_done    boolean not null default false,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);
alter table public.task_columns enable row level security;
drop policy if exists "task_columns_owner" on public.task_columns;
create policy "task_columns_owner" on public.task_columns
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ 3. Метки ============
create table if not exists public.task_labels (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  slug       text not null,
  name       text not null,
  color      text not null default 'slate',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);
alter table public.task_labels enable row level security;
drop policy if exists "task_labels_owner" on public.task_labels;
create policy "task_labels_owner" on public.task_labels
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ 4. Сидирование дефолтов для СУЩЕСТВУЮЩИХ пользователей ============
insert into public.task_columns (user_id, slug, name, is_done, position)
select u.id, d.slug, d.name, d.is_done, d.pos
from auth.users u
cross join (values
  ('backlog', 'Бэклог',     false, 0),
  ('today',   'На сегодня', false, 1),
  ('doing',   'В работе',   false, 2),
  ('done',    'Готово',     true,  3)
) as d(slug, name, is_done, pos)
on conflict (user_id, slug) do nothing;

insert into public.task_labels (user_id, slug, name, color, position)
select u.id, d.slug, d.name, d.color, d.pos
from auth.users u
cross join (values
  ('design',   'Дизайн',     'amber', 0),
  ('dev',      'Разработка', 'green', 1),
  ('research', 'Ресёрч',     'blue',  2),
  ('bug',      'Баг',        'rose',  3)
) as d(slug, name, color, pos)
on conflict (user_id, slug) do nothing;

-- ============ 5. Realtime (опционально, для синхронизации между вкладками) ============
-- Обёрнуто в DO-блок, чтобы повторный запуск миграции не падал, если таблица уже добавлена.
do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception
  when duplicate_object then null;
end $$;
