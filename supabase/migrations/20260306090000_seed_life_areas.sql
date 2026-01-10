-- Seed default life areas so the client doesn't need to upsert (and hit RLS).
insert into public.life_areas (id, key, name, description, sort_order)
values
  (1, 'career', 'Career', null, 1),
  (2, 'money', 'Money', null, 2),
  (3, 'health', 'Health', null, 3),
  (4, 'relationships', 'Relationships', null, 4),
  (5, 'mental', 'Mental', null, 5),
  (6, 'purpose', 'Purpose', null, 6)
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order;

select setval('public.life_areas_id_seq', (select max(id) from public.life_areas), true);
