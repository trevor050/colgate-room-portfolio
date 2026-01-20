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

This project uses the Dossier first‑party tracker via the `@trevor050/dossier` package (single Vercel project).

### Dossier tracker

- Ingest: `POST /api/collect`
- Replay ingest: `POST /api/replay` (optional)
- Admin dashboard: `/api/admin`
- Client wiring lives in `src/main.ts` and reads `VITE_TRACKER_ENDPOINT`.
- Set `VITE_TRACKER_ENDPOINT=/api/collect` (or `off` to disable).

### Third-party analytics (optional)

- Vercel Analytics: enabled in `src/main.ts`
- PostHog: set `VITE_PUBLIC_POSTHOG_KEY` (see `.env.example`)

### PostHog proxy (recommended)

PostHog is proxied through `/_i/*` to reduce third‑party blocking:

- Dev: proxied via `vite.config.ts`
- Prod: proxied via `vercel.json`
