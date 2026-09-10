-- Run this after the organizer has signed in with Google at least once.
-- Replace the email below.
insert into public.event_memberships (event_id,user_id,role)
select e.id,p.id,'organizer'
from public.events e
join auth.users u on u.email = 'ORGANIZER_EMAIL_HERE'
join public.profiles p on p.id = u.id
where e.slug='trina-60-retirement-2029'
on conflict (event_id,user_id) do update set role='organizer';
