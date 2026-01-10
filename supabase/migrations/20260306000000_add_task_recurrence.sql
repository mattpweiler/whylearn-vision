alter table public.tasks
  add column if not exists recurrence_group_id text,
  add column if not exists recurrence_cadence text,
  add column if not exists recurrence_start_date date;

create index if not exists idx_tasks_recurrence_group
  on public.tasks (recurrence_group_id);

alter type public.habit_cadence_type add value if not exists 'monthly';
