# Dossier

First‑party analytics for low‑traffic, high‑signal sites (e.g. “share with a few recruiters and see what they looked at”).

## What it does

- Captures client events (clicks/hover/sections/scroll + basic device context)
- Captures session timing (total, active, idle)
- Enriches non‑bot sessions with IPinfo (cached) and PTR reverse DNS (cached)
- Stores everything in Postgres
- Serves a token‑protected admin dashboard at `/api/admin`

## Project layout

**Client**

- `src/tracking/config.ts` — Vite client config helper
- `src/tracking/telemetry.ts` — event queue + batching + global listeners

**Ingest + admin API (Vercel Functions)**

- `api/collect.ts` — ingest endpoint (writes to Postgres)
- `api/admin/index.ts` — dashboard UI
- `api/admin/auth.ts` — auth check endpoint
- `api/admin/sessions.ts` — sessions list
- `api/admin/session.ts` — session detail (includes events)
- `api/admin/visitors.ts` — visitors list
- `api/admin/status.ts` — configuration status (safe)

**Server helpers**

- `server/schema.ts` — tables + migrations
- `server/db.ts` — Postgres pool
- `server/http.ts` — request helpers / allowlist
- `server/bot.ts` — bot scoring heuristics
- `server/geo.ts` — Vercel geo header parsing
- `server/ipinfo.ts` — IPinfo caching + enrichment
- `server/ptr.ts` — PTR caching + reverse DNS
- `server/admin.ts` — `ADMIN_TOKEN` auth helper

## Quick start (Vercel)

1. Deploy this folder as its own project (or copy `api/`, `server/`, `src/tracking/` into your app).
2. Set the required env vars (see below).
3. In your client app, initialize the telemetry client and point it at `/api/collect`.

## Environment variables

**Required**

- `DATABASE_URL` (or `POSTGRES_URL*`)
- `ADMIN_TOKEN`

**Optional**

- `IPINFO_TOKEN` (skipped for bots; cached per IP)
- `REPORT_ALLOWED_HOSTS` (comma-separated allowlist for Origin/Referer)
- `BOT_SCORE_THRESHOLD` (default: `6`)

## Client configuration (Vite)

- `VITE_TRACKER_ENDPOINT` (default: `/api/collect`)
- `VITE_TRACKER_PERSIST` (`localStorage` or `cookie`, default: `localStorage`)

## Discord visit reports (optional)

Serverless endpoint `api/report.ts` can send a Discord message on `visit` and `session_end`.

- Set `DISCORD_WEBHOOK_URL` in Vercel → Project → Settings → Environment Variables
- (Optional) Set `DISCORD_BOT_WEBHOOK_URL` for suspected bot traffic
- (Optional) Set `REPORT_ALLOWED_HOSTS` to your domains to reduce spam

## Minimal client example

```ts
import { getTrackerConfig } from './tracking/config';
import { createTelemetryClient } from './tracking/telemetry';

const trackerConfig = getTrackerConfig();
const telemetry = createTelemetryClient({
  endpoint: trackerConfig.endpoint,
  persistVisitorId: trackerConfig.persist,
});

telemetry.installGlobalTracking();
telemetry.ensureVisit();

window.addEventListener('pagehide', () => {
  void telemetry.flush({ useBeacon: true });
});
```

## Admin dashboard

- Visit `/api/admin`
- The admin token is stored in `localStorage` + a cookie scoped to `/api/admin`
