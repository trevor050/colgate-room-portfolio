# Portfolio Tracker (internal analytics)

This repo contains a small, first‑party analytics system intended for low‑traffic, high‑signal sites (e.g. “send to a few recruiters and understand what they looked at”).

## What it does

- Captures client events (clicks/hover/sections/scroll + basic device context)
- Captures session timing (total, active, idle)
- Enriches non-bot sessions with IPinfo (cached) and PTR reverse DNS (cached)
- Stores everything in Postgres
- Serves a token‑protected admin dashboard at `/api/admin`

## Files that make up the tracker

**Client**

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

## Open-source spin-out checklist

- Move the files above into a new repo (keep paths consistent or update imports)
- Provide a minimal demo UI (or keep the current `/api/admin` page)
- Add a migration strategy (current `ensureSchema()` uses idempotent `CREATE TABLE` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`)
- Add a license, contributing guide, and security note for admin token handling
