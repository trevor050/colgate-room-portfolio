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
- PostHog: set `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` (see `.env`)

### Tracking links (optional)

- Per-college links: add `?college=colgate` (or any value) to tag sessions.
- Exclude your own device: visit `?internal=1` once (to re-enable: `?internal=0`).
