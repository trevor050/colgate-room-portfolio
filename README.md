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

- Vercel Analytics: enabled in `src/main.ts`
- PostHog: set `VITE_PUBLIC_POSTHOG_KEY` (see `.env`)
- Discord visit reports (server-side): set `DISCORD_WEBHOOK_URL` in Vercel env (do not commit)

### Tracking links (optional)

- Per-college links: add `?college=colgate` (or any value) to tag sessions.
- Exclude your own device: visit `?internal=1` once (to re-enable: `?internal=0`).

### PostHog proxy (recommended)

PostHog is proxied through `/_i/*` to reduce third‑party blocking:

- Dev: proxied via `vite.config.ts`
- Prod: proxied via `vercel.json`

### Discord visit reports (optional)

Serverless endpoint `api/report.ts` can send a Discord message on `visit` and `session_end`.

- Set `DISCORD_WEBHOOK_URL` in Vercel → Project → Settings → Environment Variables
- (Optional) Set `DISCORD_BOT_WEBHOOK_URL` for suspected bot traffic
- (Optional) Set `REPORT_ALLOWED_HOSTS` to your domains to reduce spam
