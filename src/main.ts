import '@fontsource/press-start-2p/400.css';
import '@fontsource/vt323/400.css';
import './style.css';
import { Application, Container, RendererType, type Text } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { startAnalytics } from './analytics';
import { content } from './content';
import { fitRoom, renderResolution, ROOM_HEIGHT, ROOM_WIDTH } from './layout';
import { buildRoom, COLORS, startAnimations, type RoomTarget } from './scene';

const { dossier, capture } = startAnalytics({ sections: false });

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = () => reduceMotionQuery.matches;

let interactionCount = 0;
const sessionStartMs = performance.now();
let firstInteractionAtMs: number | null = null;

/** Per-target hover/focus highlight, set up in `makeInteractive`. */
const highlighters = new Map<string, (on: boolean) => void>();

/** Wait for the pixel fonts so Pixi doesn't bake the fallback font into its text textures. */
function loadFonts(timeoutMs = 3000): Promise<void> {
  if (!document.fonts?.load) return Promise.resolve();
  const fonts = Promise.all([document.fonts.load('12px "Press Start 2P"'), document.fonts.load('16px "VT323"')]).then(() => undefined);
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  return Promise.race([fonts, timeout]).catch(() => undefined);
}

async function init() {
  const fontsReady = loadFonts();
  const app = new Application();

  await app.init({
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    backgroundColor: 0x1a1a2e,
    resolution: renderResolution(window.devicePixelRatio),
    autoDensity: true,
  });
  await fontsReady;

  const container = document.getElementById('game-container')!;
  app.canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(app.canvas);

  const room = new Container();
  app.stage.addChild(room);
  const { targets, texts } = buildRoom(room, app);

  // Glow filters need WebGL/WebGPU; the Canvas2D fallback renderer gets a scale-only highlight.
  const canGlow = app.renderer.type !== RendererType.CANVAS;
  for (const target of targets) makeInteractive(target, app, canGlow);
  const buttons = createTargetButtons(targets);

  // Render at the size the room is actually displayed, so it stays sharp at any window size.
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    const fit = fitRoom(width, height);
    if (!fit.scale) return;
    app.renderer.resize(fit.width, fit.height);
    room.scale.set(fit.scale);
    const textResolution = app.renderer.resolution * fit.scale;
    for (const text of texts) setTextResolution(text, textResolution);
    positionTargetButtons(targets, buttons, app.canvas);
    // Resizing clears the canvas; redraw now in case the ticker is paused behind a panel.
    app.render();
  }

  resize();
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(container);

  // Start all animations
  startAnimations(app, reduceMotion);

  hideLoading();
  setupOverlay(app);

  // Hint text without emojis
  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = canGlow ? 'Click the glowing objects to explore' : 'Click the objects to explore';
  document.body.appendChild(hint);

  // Time spent looking at the room itself; overlays push their own key on top.
  dossier.enter('room');
  dossier.track('room_ready', { renderer: RendererType[app.renderer.type] ?? String(app.renderer.type) });
  setupClientAnalytics();
}

function setTextResolution(text: Text, resolution: number) {
  const rounded = Math.round(resolution * 4) / 4;
  if (text.resolution !== rounded) text.resolution = rounded;
}

function hideLoading() {
  const loading = document.getElementById('loading')!;
  loading.classList.add('hidden');
  loading.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    loading.hidden = true;
  }, 600);
}

/** Shown when the room can't start (no WebGL/Canvas, or a crash during setup). */
function showFailure(error: unknown) {
  console.error(error);
  const loading = document.getElementById('loading')!;
  loading.classList.add('failed');
  loading.querySelector('.loading-text')!.textContent = "The room couldn't load on this device.";
  const escape = loading.querySelector<HTMLAnchorElement>('.loading-escape');
  if (escape) escape.textContent = 'Read the plain resume instead';
  dossier.track('room_failed', { message: String(error instanceof Error ? error.message : error).slice(0, 200) });
  capture('room_failed');
}

function setupClientAnalytics() {
  const isMobileMq = window.matchMedia('(max-width: 900px)');
  const isPortraitMq = window.matchMedia('(orientation: portrait)');

  let mobileBannerCaptured = false;
  let rotatePromptActive = false;

  const evaluate = (reason: string) => {
    const isMobile = isMobileMq.matches;

    if (isMobile && !mobileBannerCaptured) {
      mobileBannerCaptured = true;
      capture('mobile_warning_shown', { reason });
      dossier.track('mobile_warning_shown', { reason });
    }

    const shouldShowRotatePrompt =
      window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches &&
      !document.documentElement.classList.contains('allow-portrait');
    if (shouldShowRotatePrompt && !rotatePromptActive) {
      rotatePromptActive = true;
      capture('rotate_prompt_shown', { reason });
      dossier.track('rotate_prompt_shown', { reason });
    } else if (!shouldShowRotatePrompt && rotatePromptActive) {
      rotatePromptActive = false;
      capture('rotate_prompt_dismissed', { reason });
      dossier.track('rotate_prompt_dismissed', { reason });
    }
  };

  evaluate('init');
  const onChange = () => evaluate('viewport_change');
  isMobileMq.addEventListener('change', onChange);
  isPortraitMq.addEventListener('change', onChange);
  window.addEventListener('orientationchange', () => evaluate('orientationchange'), { passive: true });

  document.getElementById('show-room-anyway')?.addEventListener('click', () => {
    document.documentElement.classList.add('allow-portrait');
    dossier.track('rotate_prompt_skipped');
    capture('rotate_prompt_skipped');
    evaluate('skip');
    window.dispatchEvent(new Event('resize'));
  });

  window.addEventListener(
    'pagehide',
    () => {
      capture('session_summary', {
        interactions: interactionCount,
        active_seconds: Math.round((performance.now() - sessionStartMs) / 1000),
        first_interaction_seconds:
          firstInteractionAtMs == null ? null : Math.round((firstInteractionAtMs - sessionStartMs) / 1000),
      });
    },
    { passive: true },
  );
}

function makeInteractive({ key: contentKey, container }: RoomTarget, app: Application, canGlow: boolean) {
  container.eventMode = 'static';
  container.cursor = 'pointer';

  let glowFilter: GlowFilter | null = null;
  if (canGlow) {
    glowFilter = new GlowFilter({
      distance: 12,
      outerStrength: 1.5,
      innerStrength: 0,
      color: COLORS.glow,
      alpha: 0.7,
    });
    // Match the canvas resolution so filtered objects aren't blurrier than the rest on HiDPI screens.
    glowFilter.resolution = 'inherit';
    container.filters = [glowFilter];
  }

  let highlighted = false;
  let time = Math.random() * Math.PI * 2;
  app.ticker.add(() => {
    if (!glowFilter || highlighted) return;
    if (reduceMotion()) {
      glowFilter.outerStrength = 1.5;
      return;
    }
    time += 0.025;
    glowFilter.outerStrength = 1.2 + Math.sin(time) * 0.5;
  });

  const setHighlight = (on: boolean) => {
    highlighted = on;
    if (glowFilter) {
      glowFilter.outerStrength = on ? 3 : 1.5;
      glowFilter.color = on ? 0xffffff : COLORS.glow;
    }
    container.scale.set(on ? 1.02 : 1);
  };
  highlighters.set(contentKey, setHighlight);

  let hoverStartedAt: number | null = null;
  container.on('pointerover', () => {
    hoverStartedAt = performance.now();
    dossier.track('hover_start', { target: contentKey });
    setHighlight(true);
  });

  container.on('pointerout', () => {
    if (hoverStartedAt != null) {
      const seconds = Math.round(((performance.now() - hoverStartedAt) / 1000) * 10) / 10;
      dossier.track('hover_end', { target: contentKey, seconds });
      hoverStartedAt = null;
    }
    setHighlight(false);
  });

  container.on('pointertap', () => {
    dossier.track('click_target', { target: contentKey, via: 'pointer' });
    showOverlay(contentKey);
  });
}

/**
 * Real buttons laid over the canvas objects. They make the room reachable with Tab
 * and screen readers; mouse and touch input still goes to the canvas underneath.
 */
function createTargetButtons(targets: RoomTarget[]): HTMLButtonElement[] {
  const nav = document.getElementById('room-nav')!;
  return targets.map(({ key }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-target';
    button.textContent = content[key]?.title ?? key;
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('focus', () => highlighters.get(key)?.(true));
    button.addEventListener('blur', () => highlighters.get(key)?.(false));
    button.addEventListener('click', () => {
      dossier.track('click_target', { target: key, via: 'keyboard' });
      showOverlay(key);
    });
    nav.appendChild(button);
    return button;
  });
}

function positionTargetButtons(targets: RoomTarget[], buttons: HTMLButtonElement[], canvas: HTMLCanvasElement) {
  const canvasBox = canvas.getBoundingClientRect();
  targets.forEach(({ container }, i) => {
    const bounds = container.getBounds();
    const style = buttons[i]!.style;
    style.left = `${canvasBox.left + bounds.x}px`;
    style.top = `${canvasBox.top + bounds.y}px`;
    style.width = `${bounds.width}px`;
    style.height = `${bounds.height}px`;
  });
}

// Overlay state
let currentOverlayKey: string | null = null;
let overlayOpenedAtMs: number | null = null;
let overlayScrollStats:
  | { maxPct: number; totalPx: number; maxSpeedPxPerSec: number; lastTop: number; lastTs: number }
  | null = null;
let returnFocusTo: HTMLElement | null = null;
let onOverlayVisibility: (open: boolean) => void = () => {};

/** Everything behind the dialog, made inert while it is open. */
const background = () =>
  ['game-container', 'room-nav', 'plain-link'].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el != null);

function showOverlay(contentKey: string) {
  const overlay = document.getElementById('overlay')!;
  const dialog = overlay.querySelector<HTMLElement>('.overlay-content')!;
  const body = document.getElementById('overlay-body')!;
  if (currentOverlayKey) return;

  const data = content[contentKey];
  if (data) {
    body.innerHTML = data.html;
    const heading = body.querySelector('h2');
    if (heading) heading.id = 'overlay-title';
  }

  returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  overlay.inert = false;
  overlay.removeAttribute('aria-hidden');
  overlay.classList.add('visible');
  for (const el of background()) el.inert = true;
  dialog.scrollTop = 0;
  dialog.focus({ preventScroll: true });
  onOverlayVisibility(true);

  interactionCount += 1;
  if (firstInteractionAtMs == null) {
    firstInteractionAtMs = performance.now();
    capture('first_interaction', { via: 'open_overlay' });
  }

  currentOverlayKey = contentKey;
  overlayOpenedAtMs = performance.now();
  capture('open_overlay', { overlay: contentKey });
  dossier.track('open_overlay', { overlay: contentKey });
  dossier.enter(contentKey);

  overlayScrollStats = {
    maxPct: 0,
    totalPx: 0,
    maxSpeedPxPerSec: 0,
    lastTop: dialog.scrollTop,
    lastTs: performance.now(),
  };
}

function setupOverlay(app: Application) {
  const overlay = document.getElementById('overlay')!;
  const closeBtn = document.getElementById('close-overlay')!;
  const overlayContent = overlay.querySelector('.overlay-content') as HTMLElement;

  // The room is hidden behind a blurred backdrop while a panel is open, so stop
  // rendering it: blurring a canvas that redraws every frame is expensive on phones.
  onOverlayVisibility = (open) => {
    document.body.classList.toggle('panel-open', open);
    if (open) app.stop();
    else app.start();
  };

  overlayContent.addEventListener(
    'scroll',
    () => {
      if (!overlay.classList.contains('visible')) return;
      if (!overlayScrollStats) return;

      const maxScroll = overlayContent.scrollHeight - overlayContent.clientHeight;
      const pct = maxScroll > 0 ? overlayContent.scrollTop / maxScroll : 0;
      overlayScrollStats.maxPct = Math.max(overlayScrollStats.maxPct, pct);

      const now = performance.now();
      const deltaPx = overlayContent.scrollTop - overlayScrollStats.lastTop;
      const dt = (now - overlayScrollStats.lastTs) / 1000;
      if (dt > 0) {
        overlayScrollStats.maxSpeedPxPerSec = Math.max(overlayScrollStats.maxSpeedPxPerSec, Math.abs(deltaPx) / dt);
      }

      overlayScrollStats.totalPx += Math.abs(deltaPx);
      overlayScrollStats.lastTop = overlayContent.scrollTop;
      overlayScrollStats.lastTs = now;
    },
    { passive: true },
  );

  const hide = (reason: string) => {
    if (!overlay.classList.contains('visible')) return;
    overlay.classList.remove('visible');
    overlay.inert = true;
    overlay.setAttribute('aria-hidden', 'true');
    for (const el of background()) el.inert = false;
    onOverlayVisibility(false);

    const overlayKey = currentOverlayKey;
    const openedAt = overlayOpenedAtMs;
    const scroll = overlayScrollStats;
    currentOverlayKey = null;
    overlayOpenedAtMs = null;
    overlayScrollStats = null;
    if (overlayKey) dossier.leave(overlayKey);

    if (overlayKey && openedAt != null) {
      const openSeconds = Math.round((performance.now() - openedAt) / 1000);
      const scrollProps = {
        max_scroll_pct: scroll ? Math.round(scroll.maxPct * 1000) / 1000 : 0,
        total_scroll_px: scroll ? Math.round(scroll.totalPx) : 0,
      };
      capture('close_overlay', { overlay: overlayKey, reason, open_seconds: openSeconds, ...scrollProps });
      dossier.track('close_overlay', {
        overlay: overlayKey,
        reason,
        open_seconds: openSeconds,
        ...scrollProps,
        max_scroll_speed_px_s: scroll ? Math.round(scroll.maxSpeedPxPerSec) : 0,
      });
    } else {
      capture('close_overlay', { overlay: overlayKey ?? 'unknown', reason });
      dossier.track('close_overlay', { overlay: overlayKey ?? 'unknown', reason });
    }

    returnFocusTo?.focus({ preventScroll: true });
    returnFocusTo = null;
  };

  closeBtn.addEventListener('click', () => hide('button'));

  overlay.addEventListener('click', (e) => {
    // On touch screens the click that follows the tap which opened the panel can land
    // on the backdrop; ignore clicks in the first moments after opening.
    if (overlayOpenedAtMs != null && performance.now() - overlayOpenedAtMs < 400) return;
    if (e.target === overlay) {
      hide('backdrop');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hide('escape');
    }
  });
}

init().catch(showFailure);
