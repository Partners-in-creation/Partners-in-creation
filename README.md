# Partners In Creation

The website and community home for Partners In Creation, a Torah learning
community led by Aviezer. Visitors can see the next class, add it to their
calendar, listen to past classes, read announcements and subscribe to
reminders. Aviezer manages everything from a private admin dashboard at
`/admin`.

## What's included

- **Homepage**: welcome, next class with Add to Calendar, recent recordings, latest updates, about and subscribe.
- **Classes**: weekly schedules (e.g. twice a week) that create each date automatically, with any single date editable,
  rescheduled or cancelled for holidays. Draft, published, rescheduled and cancelled statuses. In person, online or hybrid.
  Calendar files (.ics) and Google Calendar links.
- **Address privacy**: every class's address and meeting link is **Private** by default. The admin can choose
  *Public*, *Subscribers only* (confirmed subscribers see it through their personal email link) or *Private* (visitors
  ask to attend, and the admin approves each person, which emails them the address). The venue name is always public.
- **Recordings library**: upload audio (stored on disk or in S3-compatible storage, never in the database) or paste a link.
  Search, topic and year filters, newest first, individual shareable pages, related recordings, a mobile-friendly
  player with seeking and playback speed. A `mediaType` field is ready for adding video later.
- **Announcements**: announcements, schedule changes and community news, with optional pinning and emailing to subscribers.
- **Subscriptions**: double opt-in email subscriptions with per-person preferences and one-click unsubscribe.
  Subscribers are emailed when a class changes or is cancelled, and get a reminder before each class.
- **Admin dashboard**: classes, weekly schedules, recordings, announcements, attendees, subscribers (with CSV export),
  a log of every email sent, and editable site text and contact details.

All descriptive text about Aviezer and the community is placeholder copy marked `[Placeholder]`, to be written
in **Admin → Site settings**. Nothing biographical has been invented.

## Running it locally

Requires Node.js 22.

```bash
npm install
cp .env.example .env      # then set ADMIN_PASSWORD and SESSION_SECRET
npx prisma db push        # creates the SQLite database
npm run db:seed           # optional: a sample weekly schedule and welcome note
npm run dev               # http://localhost:3000, admin at /admin
```

`npm test` runs unit tests; `npm run typecheck` and `npm run build` check everything compiles.

## Before going live

1. **Give the site its own email address.** The site needs a dedicated sender (for example
   `notifications@partnersincreation.org`) and a contact address. Both are placeholders now
   (`notifications@example.com`, `contact@example.com`). Don't use a personal inbox. Set `EMAIL_FROM` and `SMTP_URL`
   from any transactional email provider (Postmark, Resend, Amazon SES, Mailgun...), and change the contact email in
   Site settings. Until then, emails are only saved in **Admin → Sent emails**.
2. **Set a strong `ADMIN_PASSWORD`** and a random `SESSION_SECRET`.
3. **Set `SITE_URL`** to the real address so email and calendar links work.
4. **Schedule reminders**: call `GET /api/cron/reminders` with `Authorization: Bearer $CRON_SECRET` at least daily
   (hourly is better). `vercel.json` sets up a daily Vercel Cron; Vercel sends the header automatically when
   `CRON_SECRET` is set.
5. **Write the real content** in Site settings and replace the sample schedule.

## Hosting options

- **A server with a disk** (Railway, Render, Fly.io, a small VPS): works as is with SQLite and local audio storage.
  Mount a persistent volume for the database file and `UPLOAD_DIR`.
- **Vercel or another serverless host**: the file system doesn't persist, so use Postgres (change `provider` in
  `prisma/schema.prisma` to `postgresql`, e.g. Neon or Supabase) and S3-compatible storage for audio (Cloudflare R2
  is inexpensive for audio). The bucket needs public read access (or a public custom domain) for `S3_PUBLIC_URL`,
  and a CORS rule allowing `PUT` from the site's origin so the browser can upload directly.

## Project layout

- `src/app/(site)` public pages, `src/app/admin` dashboard, `src/app/api` media, uploads and cron.
- `src/lib` data access, time zones, calendar files, address privacy rules (`classes.ts`), email and notifications.
- `prisma/schema.prisma` the data model.
