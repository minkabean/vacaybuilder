# VacayBuilder — Trina's 60th Birthday & Retirement Trip

Deployment-ready Cloudflare Worker + Static Assets + D1 + R2 package. Supabase has been removed.

## Preconfigured
- Worker: `vacaybuilder`
- Custom domain: `trinia.tripinvitation.com`
- D1: `vacaybuilder`
- D1 ID: `a814face-b3c0-413d-9e79-f53eda1daf57`
- Cloudflare Access org: `dry-surf-9ac8.cloudflareaccess.com`
- Organizer Access AUD: configured
- Member Access AUD: configured
- Organizers: `minkabean@gmail.com`, `trinajames2011@yahoo.com`
- Google + OTP are handled by Cloudflare Access. No passwords are stored by the app.

## Access paths expected in Cloudflare
- Organizer app: `trinia.tripinvitation.com/admin*`
- Member app: `trinia.tripinvitation.com/member*`
- The public site remains unprotected.

## What deployment provisions
`npm run deploy`:
1. Creates the R2 bucket `vacaybuilder-photos` if needed.
2. Applies D1 migrations.
3. Deploys the Worker and static assets.
4. Attaches the custom domain via Wrangler.

The Worker also contains a safe first-request schema bootstrap so an empty D1 can initialize even if a migration step is skipped.

## Cloudflare Git deployment
Keep the existing GitHub connection on the `vacaybuilder` Worker. In Cloudflare go to **Workers & Pages → vacaybuilder → Settings → Builds** and set the **Deploy command** to `npm run deploy`. Cloudflare Workers Builds supplies its deployment authentication automatically. Every push to the production branch will then provision/apply the Cloudflare resources and deploy the site.

## Test after deploy
1. Public: `https://trinia.tripinvitation.com/`
2. Health: `https://trinia.tripinvitation.com/api/health`
3. Member: `https://trinia.tripinvitation.com/member.html`
4. Organizer: `https://trinia.tripinvitation.com/admin.html`
5. Sign in as `minkabean@gmail.com` with Google.
6. Sign in as `trinajames2011@yahoo.com` with One-time PIN.
7. In Admin, edit a hotel or announcement and confirm the public site updates.
8. In Member, add an idea/message/photo and confirm it appears.

## Admin capabilities
- Trip details
- Hotels and nightly prices
- Cost estimates
- Activities
- Announcements
- Intro text on main pages
- Guest idea moderation
- Guest book moderation
- Photo moderation
- Add/update guest and organizer roles

## Guest capabilities
- Browse without signing in
- Google or OTP authentication through Cloudflare Access
- Submit activity ideas
- Going / Interested responses
- Guest book
- Shared photos


## 2026-10-02 redirect-loop fix

The Worker now passes `/admin`, `/admin.html`, `/member`, and `/member.html`
directly to the Static Assets binding instead of internally rewriting clean
URLs to `.html` files.

Cloudflare Static Assets uses `auto-trailing-slash` HTML handling by default:
a request for `/admin` serves `admin.html`, while `/admin.html` redirects to
`/admin`. Internally rewriting `/admin` to `/admin.html` therefore created a
307 loop. This build removes that rewrite.

No Access policy, Google OAuth, OTP, AUD tag, or cookie-setting change is
required for this specific fix.

## 2026-10-03 admin-loading and completion fix

- `/admin.js` and `/member.js` are now served as static assets instead of being
  mistaken for protected API endpoints. This fixes the permanent “Loading…”
  screen in both portals.
- Migration `0003_complete_seed_and_indexes.sql` safely fills missing hotel,
  cost, and editable page-introduction records without replacing existing edits.
- Guest participation links now lead to working idea, response, guest-book, and
  photo tools instead of disabled placeholders.
- The active event slug is configurable with `EVENT_SLUG`, which keeps the
  Worker reusable for a future VacayBuilder event.

After deployment, use the clean URLs `/admin` and `/member`. The `.html` URLs
remain compatible but Cloudflare may canonicalize them to the clean URLs.
