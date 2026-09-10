-- Trina's Celebration Platform — V17
-- PostgreSQL schema for Supabase.
-- Safe public browsing; Google-authenticated guest writes; organizer role prepared.

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  destination text,
  starts_on date not null,
  ends_on date not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_memberships (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'guest' check (role in ('guest','organizer')),
  created_at timestamptz not null default now(),
  primary key (event_id,user_id)
);

create table if not exists public.celebration_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz,
  location text,
  status text not null default 'draft' check (status in ('draft','published','cancelled')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.celebration_rsvps (
  celebration_event_id uuid not null references public.celebration_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  response text not null check (response in ('going','interested')),
  updated_at timestamptz not null default now(),
  primary key (celebration_event_id,user_id)
);

create table if not exists public.activity_ideas (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text check (description is null or char_length(description) <= 1000),
  category text not null default 'Other',
  suggested_date date,
  suggested_time time,
  meeting_place text,
  status text not null default 'active' check (status in ('active','hidden','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_responses (
  activity_id uuid not null references public.activity_ideas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  response text not null check (response in ('going','interested')),
  updated_at timestamptz not null default now(),
  primary key (activity_id,user_id)
);

create table if not exists public.guest_book_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 1500),
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  caption text check (caption is null or char_length(caption) <= 500),
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             split_part(coalesce(new.email,''),'@',1),
             'Guest'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_event_organizer(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_memberships
    where event_id = p_event_id
      and user_id = auth.uid()
      and role = 'organizer'
  );
$$;

-- RLS
alter table public.events enable row level security;
alter table public.profiles enable row level security;
alter table public.event_memberships enable row level security;
alter table public.celebration_events enable row level security;
alter table public.celebration_rsvps enable row level security;
alter table public.activity_ideas enable row level security;
alter table public.activity_responses enable row level security;
alter table public.guest_book_entries enable row level security;
alter table public.trip_photos enable row level security;
alter table public.announcements enable row level security;

-- Revoke broad defaults, then grant only app operations.
revoke all on public.events from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.event_memberships from anon, authenticated;
revoke all on public.celebration_events from anon, authenticated;
revoke all on public.celebration_rsvps from anon, authenticated;
revoke all on public.activity_ideas from anon, authenticated;
revoke all on public.activity_responses from anon, authenticated;
revoke all on public.guest_book_entries from anon, authenticated;
revoke all on public.trip_photos from anon, authenticated;
revoke all on public.announcements from anon, authenticated;

grant select on public.events to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.celebration_events to anon, authenticated;
grant select on public.celebration_rsvps to anon, authenticated;
grant select, insert, update, delete on public.activity_ideas to authenticated;
grant select, insert, update, delete on public.activity_responses to authenticated;
grant select, insert, update, delete on public.guest_book_entries to authenticated;
grant select, insert, update, delete on public.trip_photos to authenticated;
grant select on public.activity_ideas to anon;
grant select on public.activity_responses to anon;
grant select on public.guest_book_entries to anon;
grant select on public.trip_photos to anon;
grant select on public.announcements to anon, authenticated;
grant select on public.event_memberships to authenticated;
grant insert, update, delete on public.celebration_events to authenticated;
grant insert, update, delete on public.announcements to authenticated;
grant insert, update, delete on public.celebration_rsvps to authenticated;

-- Public event/profile reads
create policy "public can view public events"
on public.events for select
using (is_public = true);

create policy "public can view profiles"
on public.profiles for select
using (true);

create policy "members can view own membership"
on public.event_memberships for select to authenticated
using (user_id = auth.uid() or public.is_event_organizer(event_id));

-- Celebration events
create policy "public can view published celebration events"
on public.celebration_events for select
using (status = 'published');

create policy "organizers manage celebration events"
on public.celebration_events for all to authenticated
using (public.is_event_organizer(event_id))
with check (public.is_event_organizer(event_id));

-- RSVPs
create policy "public can view celebration rsvps"
on public.celebration_rsvps for select
using (true);

create policy "users manage own celebration rsvp"
on public.celebration_rsvps for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Guest ideas
create policy "public can view active guest ideas"
on public.activity_ideas for select
using (status = 'active');

create policy "authenticated users add ideas"
on public.activity_ideas for insert to authenticated
with check (created_by = auth.uid());

create policy "authors or organizers update ideas"
on public.activity_ideas for update to authenticated
using (created_by = auth.uid() or public.is_event_organizer(event_id))
with check (created_by = auth.uid() or public.is_event_organizer(event_id));

create policy "authors or organizers delete ideas"
on public.activity_ideas for delete to authenticated
using (created_by = auth.uid() or public.is_event_organizer(event_id));

-- Going / Interested
create policy "public can view activity responses"
on public.activity_responses for select
using (true);

create policy "users add own activity response"
on public.activity_responses for insert to authenticated
with check (user_id = auth.uid());

create policy "users update own activity response"
on public.activity_responses for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users delete own activity response"
on public.activity_responses for delete to authenticated
using (user_id = auth.uid());

-- Guest book
create policy "public can view visible guestbook entries"
on public.guest_book_entries for select
using (status = 'visible');

create policy "authenticated users add guestbook entries"
on public.guest_book_entries for insert to authenticated
with check (author_id = auth.uid());

create policy "authors or organizers update guestbook"
on public.guest_book_entries for update to authenticated
using (author_id = auth.uid() or public.is_event_organizer(event_id))
with check (author_id = auth.uid() or public.is_event_organizer(event_id));

create policy "authors or organizers delete guestbook"
on public.guest_book_entries for delete to authenticated
using (author_id = auth.uid() or public.is_event_organizer(event_id));

-- Photo metadata
create policy "public can view visible photos"
on public.trip_photos for select
using (status = 'visible');

create policy "authenticated users add photo metadata"
on public.trip_photos for insert to authenticated
with check (uploaded_by = auth.uid());

create policy "owners or organizers update photo metadata"
on public.trip_photos for update to authenticated
using (uploaded_by = auth.uid() or public.is_event_organizer(event_id))
with check (uploaded_by = auth.uid() or public.is_event_organizer(event_id));

create policy "owners or organizers delete photo metadata"
on public.trip_photos for delete to authenticated
using (uploaded_by = auth.uid() or public.is_event_organizer(event_id));

-- Announcements
create policy "public can view published announcements"
on public.announcements for select
using (published_at is not null and published_at <= now());

create policy "organizers manage announcements"
on public.announcements for all to authenticated
using (public.is_event_organizer(event_id))
with check (public.is_event_organizer(event_id));

-- Seed the first event.
insert into public.events (slug,title,subtitle,destination,starts_on,ends_on,is_public)
values (
  'trina-60-retirement-2029',
  'Trina''s 60th Birthday & Retirement Celebration',
  'Two weeks on Martha''s Vineyard to celebrate, relax, explore, and spend time together.',
  'Oak Bluffs · Martha''s Vineyard, Massachusetts',
  '2029-08-05',
  '2029-08-18',
  true
)
on conflict (slug) do update set
  title=excluded.title,
  subtitle=excluded.subtitle,
  destination=excluded.destination,
  starts_on=excluded.starts_on,
  ends_on=excluded.ends_on;

-- Seed the official birthday event as a draft until date/time are finalized.
insert into public.celebration_events (event_id,title,description,location,status,sort_order)
select id,
       'Trina''s 60th Birthday Celebration',
       'The main birthday celebration details will be added once finalized.',
       'Oak Bluffs',
       'draft',
       10
from public.events
where slug='trina-60-retirement-2029'
and not exists (
  select 1 from public.celebration_events ce
  where ce.event_id=events.id and ce.title='Trina''s 60th Birthday Celebration'
);

-- PHOTO STORAGE
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'trip-photos',
  'trip-photos',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

create policy "public can view trip photos"
on storage.objects for select
using (bucket_id='trip-photos');

create policy "authenticated users upload trip photos"
on storage.objects for insert to authenticated
with check (
  bucket_id='trip-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete own trip photos"
on storage.objects for delete to authenticated
using (
  bucket_id='trip-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
