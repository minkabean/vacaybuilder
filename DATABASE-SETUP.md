# V17 Database Setup

V17 keeps the site static on Cloudflare Pages and adds a PostgreSQL/Auth/Storage backend through Supabase.

## Why this architecture
- The public site stays plain HTML/CSS/JavaScript.
- Supabase supplies PostgreSQL, Google OAuth, Row Level Security, and photo storage.
- No custom password system.
- No separate application server is required for the first interactive features.
- RLS enforces permissions in PostgreSQL even though the browser talks directly to Supabase.

## What is already built
- Google sign-in / sign-out UI on interior pages.
- Guest profiles created automatically from Google metadata.
- Guest-submitted activity ideas.
- Going / Interested responses.
- Guest Book messages.
- Organizer role in the database.
- Tables for official celebration events, RSVPs, announcements, and trip-photo metadata.
- A `trip-photos` Storage bucket with upload/read/delete policies.
- Public browsing remains available without sign-in.

## One-time setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run `supabase/schema.sql`.
3. In Authentication > Providers, enable Google.
4. Create a Google OAuth Web application and configure the Supabase callback URL shown by Supabase.
5. Add the Cloudflare Pages production origin and local development origin to the allowed OAuth configuration.
6. In Supabase Auth URL configuration, set the Site URL to the Cloudflare Pages site and allow the relevant redirect URLs.
7. Copy the Project URL and **publishable** key into `js/config.js`.
8. Deploy the site.
9. Sign in once with the organizer's Google account.
10. Edit `supabase/make-organizer.sql` with that email and run it.

Do not put the Supabase `service_role` key in browser JavaScript.

## Local testing

Because the site now uses JavaScript modules, serve the directory over HTTP instead of double-clicking HTML files.

Examples:

```bash
python -m http.server 8080
```

or

```bash
npx serve .
```

Then open `http://localhost:8080`.

## Database model

- `events`: reusable top-level event record.
- `profiles`: Google-authenticated people.
- `event_memberships`: guest / organizer role per event.
- `celebration_events`: organizer-created official plans.
- `celebration_rsvps`: Going / Interested on official plans.
- `activity_ideas`: guest-submitted activity ideas.
- `activity_responses`: Going / Interested on guest ideas.
- `guest_book_entries`: messages for Trina.
- `trip_photos`: photo metadata; binary files live in Supabase Storage.
- `announcements`: organizer updates.

This is intentionally event-based so the same code can later support retreats, reunions, birthdays, conferences, and group trips.
