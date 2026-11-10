# AGENTS.md

Trevor's interactive resume: pixel-art room in PixiJS 8 + Vite 8 + TS 7, on Vercel. Paired with Dossier (`@trevor050/dossier`, his own analytics package, installed from GitHub by commit SHA). Live at trevorrosato.vercel.app (colgate-room-portfolio.vercel.app 307s there).

## Hard rules
- `src/content.ts` is a real person's resume. Never invent, reword or drop facts. Typos/outdated things: flag, don't fix silently.
- Keep the room's look. It was hand-tuned over many commits; drawing code in `src/scene.ts` came over verbatim from the old main.ts.

## Layout
- `src/main.ts` boot: fonts → Pixi app → `buildRoom` → interaction, overlay dialog, keyboard button layer (`#room-nav`), Dossier enter/leave, failure fallback.
- `src/scene.ts` all drawing + ambient animation (`startAnimations(app, reduceMotion)`). Room coords 800x600.
- `src/layout.ts` fit math (pure). Renderer is resized to display size and `room` container scaled; Text resolution bumped on resize so text stays sharp.
- `src/resume.ts` renders content into `resume.html` at build time via `siteHtml()` plugin in `vite.config.ts` (also fills `%SITE_URL%`, `%SITE_DESCRIPTION%`). Content changes need a dev-server restart to show on /resume.
- `src/analytics.ts` Vercel Analytics + Dossier + lazy PostHog. `src/tracking.ts` pure ignore rules (tested).
- `api/collect.ts`, `api/admin.ts` one-line Dossier re-exports. Only two functions (Hobby plan).
- `style.css` shared by both pages. Base content rules use `.resume-content`; overlay-only media rules keep `#overlay-body` (id specificity on purpose, preserves old cascade). `resume-page.css` unfixes html/body for scrolling + print styles.

## Commands
- `npm run dev` / `npm test` (vitest 4, Node 20 compatible) / `npm run typecheck` / `npm run build` / `npm run preview`.
- E2E tracking: `npm run dossier:demo` (PGlite, :8787) + `npm run build && DOSSIER_URL=http://localhost:8787 npm run preview`, open `:4173/?to=tag`. Admin API: `:8787/api/admin?api=overview|person&id=|session&sid=`; POST `api=links` / `api=mark` need `Origin: http://localhost:8787`.
- Playwright: no local dep. Borrow `../dossier/node_modules/playwright-core` with Chromium 1254 from `~/Library/Caches/ms-playwright`.

## Tracking invariants
- Ignore when: !PROD, `VERCEL_ENV` != production (via `__DEPLOY_ENV__` define), `?internal=1` (localStorage `ph_internal`), `VITE_TRACKER_ENDPOINT=off`. Dossier itself also honors GPC/DNT and `?dossier=off`.
- Keys: `room` entered after load; overlays enter/leave their content key; /resume times `section[id]` with the same keys. `sections: false` on the room page.
- Replay stays off (canvas → blank DOM replay; canvas recording heavy).
- Automated browsers are flagged bots by Dossier (`navigator.webdriver`); `api=mark` with `is_bot:false` to see them in People.

## Hazards
- Overlay open → `app.stop()` (no rendering behind the blurred backdrop). `resize()` calls `app.render()` because resizing clears the canvas.
- Backdrop clicks within 400ms of opening are ignored (touch ghost click).
- Glow filters only on WebGL/WebGPU; Canvas2D fallback gets scale-only highlight. Pixi v8: Graphics can't have children (stars live in their own Container).
- Viewport zoom lock on index.html is deliberate ("Safari fixes" commit); /resume allows zoom.
- Lockfile pins Dossier as `git+ssh://...#sha`; npm falls back to https for public GitHub. Bump = change SHA in package.json + `npm install`.
- Known Dossier 0.2 quirks (report upstream, don't patch here): multi-page session summaries overwrite `sections`/`pages` (last page wins); person view counts `click_target` + `open_overlay` together, so clicks here show doubled.
