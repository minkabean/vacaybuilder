-- V18 content update for the existing Supabase project.
update public.events
set title = 'Trina''s 60th Birthday & Retirement Trip'
where slug = 'trina-60-retirement-2029';

update public.celebration_events
set title = 'Trina''s Birthday & Retirement Celebration',
    description = 'Tentatively planned for July 21, 2029, before the Martha''s Vineyard trip.',
    starts_at = '2029-07-21 12:00:00+00',
    location = 'Trina''s Home',
    status = 'draft'
where event_id = (select id from public.events where slug='trina-60-retirement-2029')
  and title in ('Trina''s 60th Birthday Celebration','Trina''s Birthday & Retirement Celebration');
