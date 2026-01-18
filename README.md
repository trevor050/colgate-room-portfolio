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

This project supports optional third‑party analytics. The first‑party tracker lives in the separate Dossier repo: `https://github.com/trevor050/dossier`.

### Dossier tracker (optional)

- Client wiring lives in `src/main.ts` and reads `VITE_TRACKER_ENDPOINT`.
- For same‑origin routing, `vercel.json` rewrites `/api/*` to the Dossier deployment.
- Set `VITE_TRACKER_ENDPOINT=/api/collect` (or `off` to disable).
- The client helper lives in `src/tracking/*` (copied from Dossier for now).

### Third-party analytics (optional)

- Vercel Analytics: enabled in `src/main.ts`
- PostHog: set `VITE_PUBLIC_POSTHOG_KEY` (see `.env.example`)

### PostHog proxy (recommended)

PostHog is proxied through `/_i/*` to reduce third‑party blocking:

- Dev: proxied via `vite.config.ts`
- Prod: proxied via `vercel.json`
