-- Add goal color column with a light default for legacy rows
alter table public.goals
  add column if not exists color_hex text not null default '#E3F2FD';

-- Backfill any existing nulls just in case constraints differ
update public.goals
set color_hex = '#E3F2FD'
where color_hex is null;
