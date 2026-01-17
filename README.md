# colgate-room-portfolio

Interactive “room” portfolio built with `pixi.js` + `vite`.

## Local development

- Install: `npm install`
- Run: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`

## Editing content

All portfolio text/content lives in `src/content.ts`.

## Deploy

- GitHub: push to `main`
- Vercel: `vercel --prod`

## Analytics

This project supports both third‑party analytics (optional) and a first‑party “internal” tracker.

### First-party analytics (recommended)

First‑party analytics is collected by Vercel Functions and stored in Postgres:

- Ingest: `POST /api/collect`
- Admin dashboard: `/api/admin` (stores your token in `localStorage`)

**Setup (Vercel)**

- Set a Postgres connection string via `DATABASE_URL` (preferred) or Vercel’s `POSTGRES_URL*` env vars.
- Set `ADMIN_TOKEN` (long random string).
- Optional: set `IPINFO_TOKEN` to enrich non‑bot IPs (cached; skipped for bots).
- Optional: set `REPORT_ALLOWED_HOSTS` to restrict `Origin`/`Referer` hosts.

**Usage**

- Exclude your own device: visit `/?internal=1` once (to re-enable: `/?internal=0`).
- Bots are hidden by default in the dashboard; add `?bots=1` to include them.
- Tracker code map: `tracker/README.md`

### Third-party analytics (optional)

- Vercel Analytics: enabled in `src/main.ts`
- PostHog: set `VITE_PUBLIC_POSTHOG_KEY` (see `.env.example`)

### PostHog proxy (recommended)

PostHog is proxied through `/_i/*` to reduce third‑party blocking:

- Dev: proxied via `vite.config.ts`
- Prod: proxied via `vercel.json`

### Discord visit reports (optional)

Serverless endpoint `api/report.ts` can send a Discord message on `visit` and `session_end`.

- Set `DISCORD_WEBHOOK_URL` in Vercel → Project → Settings → Environment Variables
- (Optional) Set `DISCORD_BOT_WEBHOOK_URL` for suspected bot traffic
- (Optional) Set `REPORT_ALLOWED_HOSTS` to your domains to reduce spam
