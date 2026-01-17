import './style.css';
import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { inject } from '@vercel/analytics';
import posthog from 'posthog-js';
import { createTelemetryClient } from './tracking/telemetry';
import { content } from './content';

if (import.meta.env.PROD) {
  inject();
}

// Manual opt-out for your own devices (since IP/geo-based filtering is unreliable client-side).
// - `?internal=1` opts this browser out and persists via localStorage.
// - `?internal=0` opts back in and removes the flag.
if (import.meta.env.PROD) {
  try {
    const params = new URL(window.location.href).searchParams;
    const internalParam = params.get('internal');
    if (internalParam === '1' || internalParam === 'true') {
      localStorage.setItem('ph_internal', '1');
    } else if (internalParam === '0' || internalParam === 'false') {
      localStorage.removeItem('ph_internal');
    }
  } catch {
    // noop
  }
}

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
if (import.meta.env.PROD && posthogKey) {
  const isInternal = localStorage.getItem('ph_internal') === '1';

  posthog.init(posthogKey, {
    // First-party proxy route (less likely to be blocked than `us.i.posthog.com`).
    // - Dev is proxied via `vite.config.ts`
    // - Prod is rewritten via `vercel.json`
    api_host: '/_i',
    capture_pageview: true,
    capture_pageleave: true,
    // Keep it lightweight (we only need analytics + recordings).
    autocapture: true,
    loaded: (ph) => {
      // This app is mostly a canvas; explicit events help verify installation.
      ph.capture('$pageview');
      ph.capture('site_loaded');
    },
  });

  if (isInternal) {
    posthog.opt_out_capturing();
  } else {
    posthog.opt_in_capturing();
  }
}

// Room dimensions
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;

let currentOverlayKey: string | null = null;
let overlayOpenedAtMs: number | null = null;
let firstInteractionCaptured = false;
let interactionCount = 0;
const sessionStartMs = performance.now();
let firstInteractionAtMs: number | null = null;
const overlaySummary: Map<string, number> = new Map();
let overlayScrollStats:
  | { maxPct: number; totalPx: number; maxSpeedPxPerSec: number; lastTop: number; lastTs: number }
  | null = null;

// Animation state
interface AnimationState {
  stars: { graphics: Graphics; baseAlpha: number; speed: number; phase: number }[];
  clock: { container: Container; hourHand: Graphics; minuteHand: Graphics; secondHand: Graphics };
  steam: { particles: Graphics[]; container: Container };
  dustMotes: { particles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number }[]; graphics: Graphics };
  lampGlow: { graphics: Graphics; baseAlpha: number };
  plants: { graphics: Graphics[]; baseRotations: number[] };
  codeLines: { graphics: Graphics[]; scrollOffset: number };
  curtains: { left: Graphics; right: Graphics };
}

let animState: AnimationState;

// Refined color palette - cozy bedroom vibes
const COLORS = {
  // Walls - warm cozy tones (like a real bedroom)
  wallLight: 0x6a6878,
  wallDark: 0x5a5868,
  wallAccent: 0x4d4d5d,
  
  // Carpet - rich dark blue-grey for contrast
  carpetBase: 0x2a2a3a,
  carpetLight: 0x353545,
  carpetDark: 0x222230,
  carpetFiber: 0x303042,
  
  // Furniture - warm natural wood tones
  woodLight: 0xa08a70,
  woodMid: 0x8a7560,
  woodDark: 0x6a5545,
  
  // Accents
  gold: 0xd4a854,
  goldDark: 0xa67c3d,
  cream: 0xf5f0e0,
  paper: 0xfaf8f0,
  
  // Tech
  screenDark: 0x1a2332,
  screenGlow: 0x2a3a4a,
  
  // Interactive glow
  glow: 0xffeebb,
};

async function init() {
  const app = new Application();
  
  await app.init({
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    backgroundColor: 0x1a1a2e,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  const container = document.getElementById('game-container')!;
  container.appendChild(app.canvas);

  function resize() {
    const { width: viewportWidth, height: viewportHeight } = container.getBoundingClientRect();
    const scale = Math.min(
      viewportWidth / ROOM_WIDTH,
      viewportHeight / ROOM_HEIGHT
    );
    app.canvas.style.width = `${ROOM_WIDTH * scale}px`;
    app.canvas.style.height = `${ROOM_HEIGHT * scale}px`;
  }
  
  resize();
  window.addEventListener('resize', resize);

  const room = new Container();
  app.stage.addChild(room);

  // Initialize animation state
  animState = {
    stars: [],
    clock: { container: new Container(), hourHand: new Graphics(), minuteHand: new Graphics(), secondHand: new Graphics() },
    steam: { particles: [], container: new Container() },
    dustMotes: { particles: [], graphics: new Graphics() },
    lampGlow: { graphics: new Graphics(), baseAlpha: 0.6 },
    plants: { graphics: [], baseRotations: [] },
    codeLines: { graphics: [], scrollOffset: 0 },
    curtains: { left: new Graphics(), right: new Graphics() },
  };

  // Draw the room
  drawRoom(room, app);

  // Interactive elements
  // Awards - centered on upper wall
  const awards = createAwards(340, 80);
  room.addChild(awards);
  makeInteractive(awards, 'awards', app);

  // Calendar on wall for schedule - left of center, lower section
  const calendar = createCalendar(280, 230);
  room.addChild(calendar);
  makeInteractive(calendar, 'schedule', app);

  // Study desk with laptop for academics
  const studyDesk = createStudyDesk(50, 300);
  room.addChild(studyDesk);
  // Add steam container after study desk so steam appears above
  room.addChild(animState.steam.container);
  makeInteractive(studyDesk, 'academics', app);

  // Dev setup - cleaner, everything on desk
  const devSetup = createDevSetup(480, 250);
  room.addChild(devSetup);
  makeInteractive(devSetup, 'projects', app);

  // Add labels
  addLabels(room);

  // Add title
  addTitle(room);

  // Add dust motes floating in the lamp light
  createDustMotes(room, app);

  // Start all animations
  startAnimations(app);

  // Hide loading screen
  document.getElementById('loading')!.classList.add('hidden');

  // Setup overlay
  setupOverlay();

  // Hint text without emojis
  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Click the glowing objects to explore';
  document.body.appendChild(hint);

  setupClientAnalytics();
}

function captureAnalytics(event: string, properties: Record<string, unknown> = {}) {
  if (!import.meta.env.PROD || !posthogKey) return;
  try {
    posthog.capture(event, {
      ...properties,
      is_mobile: window.matchMedia('(max-width: 900px)').matches,
      orientation: window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape',
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
    });
  } catch {
    // noop
  }
}

function isInternalDevice(): boolean {
  try {
    return localStorage.getItem('ph_internal') === '1';
  } catch {
    return false;
  }
}

const telemetry = createTelemetryClient({
  shouldIgnore: () => !import.meta.env.PROD || isInternalDevice(),
});

function setupClientAnalytics() {
  const isMobileMq = window.matchMedia('(max-width: 900px)');
  const isPortraitMq = window.matchMedia('(orientation: portrait)');

  let mobileBannerCaptured = false;
  let rotatePromptActive = false;

  const evaluate = (reason: string) => {
    const isMobile = isMobileMq.matches;
    const isPortrait = isPortraitMq.matches;

    if (isMobile && !mobileBannerCaptured) {
      mobileBannerCaptured = true;
      captureAnalytics('mobile_warning_shown', { reason });
      telemetry.track('mobile_warning_shown', { reason });
    }

    const shouldShowRotatePrompt = isMobile && isPortrait;
    if (shouldShowRotatePrompt && !rotatePromptActive) {
      rotatePromptActive = true;
      captureAnalytics('rotate_prompt_shown', { reason });
      telemetry.track('rotate_prompt_shown', { reason });
    } else if (!shouldShowRotatePrompt && rotatePromptActive) {
      rotatePromptActive = false;
      captureAnalytics('rotate_prompt_dismissed', { reason });
      telemetry.track('rotate_prompt_dismissed', { reason });
    }
  };

  evaluate('init');
  telemetry.installGlobalTracking();
  telemetry.ensureVisit({
    device_pixel_ratio: window.devicePixelRatio ?? 1,
    screen_w: window.screen?.width ?? null,
    screen_h: window.screen?.height ?? null,
  });

  const onChange = () => evaluate('viewport_change');
  try {
    isMobileMq.addEventListener('change', onChange);
    isPortraitMq.addEventListener('change', onChange);
  } catch {
    // Safari fallback
    isMobileMq.addListener(onChange);
    isPortraitMq.addListener(onChange);
  }

  window.addEventListener('resize', onChange, { passive: true });
  window.addEventListener('orientationchange', () => evaluate('orientationchange'), { passive: true });

  window.addEventListener(
    'pagehide',
    () => {
      captureAnalytics('session_summary', {
        interactions: interactionCount,
        active_seconds: Math.round((performance.now() - sessionStartMs) / 1000),
      });

      const overlays = Array.from(overlaySummary.entries())
        .map(([key, seconds]) => ({ key, seconds }))
        .sort((a, b) => b.seconds - a.seconds)
        .slice(0, 10);

      void telemetry.flush({
        useBeacon: true,
        summary: telemetry.buildTimingSummary({
          interactions: interactionCount,
          overlays,
          overlays_unique: overlaySummary.size,
          first_interaction_seconds:
            firstInteractionAtMs == null ? null : Math.round((firstInteractionAtMs - sessionStartMs) / 1000),
        }),
      });
    },
    { passive: true }
  );
}

function drawRoom(room: Container, _app: Application) {
  const bg = new Graphics();
  
  // Wall - warm inviting tone with good contrast against dark carpet
  bg.rect(0, 0, ROOM_WIDTH, 420);
  bg.fill(0x706878); // Warmer mauve-grey
  
  // Subtle wall texture stripes for coziness
  for (let i = 0; i < 8; i++) {
    bg.rect(0, 50 + i * 50, ROOM_WIDTH, 2);
    bg.fill(0x686070);
  }
  
  // Baseboard - warm wood tone
  bg.rect(0, 408, ROOM_WIDTH, 14);
  bg.fill(0x5a4a40);
  bg.rect(0, 408, ROOM_WIDTH, 3);
  bg.fill(0x6a5a50);
  
  // Cozy carpet floor
  bg.rect(0, 422, ROOM_WIDTH, 180);
  bg.fill(COLORS.carpetBase);
  
  // Fuzzy carpet texture - soft fiber effect
  for (let y = 424; y < 600; y += 4) {
    for (let x = 0; x < ROOM_WIDTH; x += 6) {
      const shade = Math.random() > 0.5 ? COLORS.carpetLight : COLORS.carpetDark;
      const fiberShade = Math.random() > 0.7 ? COLORS.carpetFiber : shade;
      bg.rect(x + (y % 8 === 0 ? 2 : 0), y, 4, 3);
      bg.fill(fiberShade);
    }
  }
  
  // Carpet edge/shadow near baseboard
  bg.rect(0, 422, ROOM_WIDTH, 4);
  bg.fill(0x3a3a4a);
  
  room.addChild(bg);

  // Window - cozy bedroom style
  const windowEl = new Graphics();
  
  // Window outer frame - warm wood
  windowEl.roundRect(38, 78, 124, 154, 4);
  windowEl.fill(COLORS.woodDark);
  
  // Window inner frame
  windowEl.roundRect(46, 86, 108, 138, 2);
  windowEl.fill(COLORS.woodMid);
  
  // Window panes - evening sky with warm tones
  windowEl.rect(50, 90, 48, 62);
  windowEl.fill(0x3a5575); // Deep evening blue
  windowEl.rect(102, 90, 48, 62);
  windowEl.fill(0x3a5575);
  windowEl.rect(50, 156, 48, 62);
  windowEl.fill(0x2a4565); // Darker bottom
  windowEl.rect(102, 156, 48, 62);
  windowEl.fill(0x2a4565);
  
  // Window cross
  windowEl.rect(98, 90, 4, 128);
  windowEl.fill(COLORS.woodMid);
  windowEl.rect(50, 152, 100, 4);
  windowEl.fill(COLORS.woodMid);
  
  // Moon in window
  windowEl.circle(130, 110, 10);
  windowEl.fill(0xeeeedd);
  windowEl.circle(133, 108, 8);
  windowEl.fill(0x3a5575);
  
  // Animated stars in window - positioned within the window pane areas
  // Window panes are at: 50-98, 90-152 (top left), 102-150, 90-152 (top right)
  // 50-98, 156-218 (bottom left), 102-150, 156-218 (bottom right)
  const starPositions = [
    { x: 65, y: 105, size: 2 },
    { x: 85, y: 130, size: 1.5 },
    { x: 75, y: 145, size: 1.8 },
    { x: 60, y: 170, size: 1.5 },
    { x: 88, y: 195, size: 1.2 },
    { x: 115, y: 115, size: 1.8 },
    { x: 135, y: 135, size: 1.5 },
    { x: 120, y: 175, size: 2 },
    { x: 140, y: 200, size: 1.3 },
    { x: 108, y: 195, size: 1.6 },
  ];
  
  // Add stars to windowEl so they're part of the window
  starPositions.forEach((star) => {
    const starGraphics = new Graphics();
    // Draw a small cross/sparkle shape for more visible stars
    starGraphics.circle(star.x, star.y, star.size);
    starGraphics.fill(0xffffee);
    // Add sparkle rays
    starGraphics.rect(star.x - star.size * 1.5, star.y - 0.5, star.size * 3, 1);
    starGraphics.fill(0xffffee);
    starGraphics.rect(star.x - 0.5, star.y - star.size * 1.5, 1, star.size * 3);
    starGraphics.fill(0xffffee);
    windowEl.addChild(starGraphics);
    
    animState.stars.push({
      graphics: starGraphics,
      baseAlpha: 1,
      speed: 2 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
    });
  });
  
  // Cozy curtains - warm fabric look with folds (animated)
  const leftCurtain = new Graphics();
  leftCurtain.rect(25, 68, 22, 175);
  leftCurtain.fill(0x6a5a60);
  leftCurtain.rect(28, 68, 4, 175);
  leftCurtain.fill(0x7a6a70);
  leftCurtain.rect(40, 68, 4, 175);
  leftCurtain.fill(0x5a4a50);
  leftCurtain.pivot.set(25, 68);
  leftCurtain.position.set(25, 68);
  room.addChild(leftCurtain);
  animState.curtains.left = leftCurtain;
  
  const rightCurtain = new Graphics();
  rightCurtain.rect(153, 68, 22, 175);
  rightCurtain.fill(0x6a5a60);
  rightCurtain.rect(156, 68, 4, 175);
  rightCurtain.fill(0x7a6a70);
  rightCurtain.rect(168, 68, 4, 175);
  rightCurtain.fill(0x5a4a50);
  rightCurtain.pivot.set(175, 68);
  rightCurtain.position.set(175, 68);
  room.addChild(rightCurtain);
  animState.curtains.right = rightCurtain;
  
  // Curtain rod - warm metal
  windowEl.roundRect(20, 62, 160, 10, 3);
  windowEl.fill(0x7a6a5a);
  windowEl.circle(20, 67, 7);
  windowEl.fill(0x8a7a6a);
  windowEl.circle(180, 67, 7);
  windowEl.fill(0x8a7a6a);
  
  room.addChild(windowEl);

  // Cozy bookshelf between window and awards
  const shelf = new Graphics();
  
  // Shelf brackets - rounded for softer look
  shelf.roundRect(218, 148, 10, 22, 2);
  shelf.fill(COLORS.woodDark);
  shelf.roundRect(298, 148, 10, 22, 2);
  shelf.fill(COLORS.woodDark);
  
  // Shelf surface - with rounded edges
  shelf.roundRect(213, 143, 104, 10, 3);
  shelf.fill(COLORS.woodMid);
  shelf.rect(215, 143, 100, 3);
  shelf.fill(COLORS.woodLight);
  
  // Books - varied heights and warm colors
  const books = [
    { x: 220, w: 10, h: 28, color: 0x7a5a4a },
    { x: 232, w: 9, h: 24, color: 0x4a6a5a },
    { x: 243, w: 12, h: 30, color: 0x5a4a6a },
    { x: 257, w: 8, h: 22, color: 0x4a5a6a },
    { x: 267, w: 10, h: 26, color: 0x6a5a4a },
    { x: 279, w: 8, h: 24, color: 0x5a4a4a },
    { x: 289, w: 12, h: 28, color: 0x4a5a5a },
  ];
  
  books.forEach(book => {
    shelf.roundRect(book.x, 143 - book.h, book.w, book.h, 1);
    shelf.fill(book.color);
    // Spine detail
    shelf.rect(book.x + 3, 143 - book.h + 5, 1, book.h - 10);
    shelf.fill(0xddddcc);
  });
  
  // Small decorative item on shelf - little plant
  shelf.roundRect(302, 128, 12, 15, 2);
  shelf.fill(0x6a5545);
  shelf.circle(308, 122, 8);
  shelf.fill(0x4a7a4a);
  
  room.addChild(shelf);

  // Framed painting - nicely centered on right wall area
  const painting = new Graphics();
  // Frame shadow
  painting.rect(694, 82, 80, 65);
  painting.fill(0x2a2a3a);
  // Frame - warm wood with rounded corners
  painting.roundRect(690, 78, 80, 65, 4);
  painting.fill(COLORS.woodMid);
  painting.roundRect(696, 84, 68, 53, 2);
  painting.fill(0x1a2332);
  // Cozy landscape - warm sunset scene
  painting.rect(698, 86, 64, 20);
  painting.fill(0x6a5a70); // Dusk purple sky
  painting.rect(698, 100, 64, 12);
  painting.fill(0xcc8866); // Warm sunset
  painting.rect(698, 106, 64, 6);
  painting.fill(0xdd9977); // Horizon glow
  // Sun setting
  painting.circle(730, 105, 10);
  painting.fill(0xffbb77);
  // Rolling hills
  painting.poly([698, 135, 715, 118, 735, 125, 762, 112, 762, 135]);
  painting.fill(0x4a5a4a);
  room.addChild(painting);

  // Clock on wall - cozy wooden frame with REAL TIME
  const clockContainer = new Container();
  clockContainer.x = 600;
  clockContainer.y = 85;
  
  const clockBase = new Graphics();
  // Clock wooden frame
  clockBase.circle(0, 0, 28);
  clockBase.fill(COLORS.woodMid);
  clockBase.circle(0, 0, 25);
  clockBase.fill(COLORS.woodLight);
  // Clock face
  clockBase.circle(0, 0, 22);
  clockBase.fill(COLORS.cream);
  clockBase.circle(0, 0, 20);
  clockBase.stroke({ width: 1, color: COLORS.woodDark });
  // Hour markers (simple dots)
  clockBase.circle(0, -19, 2);
  clockBase.fill(COLORS.woodDark);
  clockBase.circle(0, 19, 2);
  clockBase.fill(COLORS.woodDark);
  clockBase.circle(-19, 0, 2);
  clockBase.fill(COLORS.woodDark);
  clockBase.circle(19, 0, 2);
  clockBase.fill(COLORS.woodDark);
  clockContainer.addChild(clockBase);
  
  // Hour hand
  const hourHand = new Graphics();
  hourHand.rect(-2, -12, 4, 14);
  hourHand.fill(COLORS.woodDark);
  clockContainer.addChild(hourHand);
  animState.clock.hourHand = hourHand;
  
  // Minute hand
  const minuteHand = new Graphics();
  minuteHand.rect(-1.5, -16, 3, 18);
  minuteHand.fill(0x5a5a6a);
  clockContainer.addChild(minuteHand);
  animState.clock.minuteHand = minuteHand;
  
  // Second hand
  const secondHand = new Graphics();
  secondHand.rect(-0.5, -17, 1, 19);
  secondHand.fill(0xc54a4a);
  clockContainer.addChild(secondHand);
  animState.clock.secondHand = secondHand;
  
  // Clock center cap
  const clockCenter = new Graphics();
  clockCenter.circle(0, 0, 3);
  clockCenter.fill(COLORS.woodDark);
  clockContainer.addChild(clockCenter);
  
  animState.clock.container = clockContainer;
  room.addChild(clockContainer);

  // Large cozy area rug - makes the room feel homely
  const rug = new Graphics();
  // Outer border - warm burgundy/brown
  rug.roundRect(250, 480, 300, 90, 6);
  rug.fill(0x5a3a3a);
  // Main rug body
  rug.roundRect(258, 486, 284, 78, 4);
  rug.fill(0x6a4a45);
  // Inner border pattern
  rug.roundRect(268, 494, 264, 62, 3);
  rug.fill(0x5a3a38);
  // Center field
  rug.roundRect(278, 502, 244, 46, 2);
  rug.fill(0x6a4a42);
  // Subtle pattern - geometric lines
  rug.rect(300, 520, 60, 3);
  rug.fill(0x7a5a4a);
  rug.rect(440, 520, 60, 3);
  rug.fill(0x7a5a4a);
  rug.rect(380, 512, 40, 3);
  rug.fill(0x7a5a4a);
  rug.rect(380, 532, 40, 3);
  rug.fill(0x7a5a4a);
  room.addChild(rug);
  
  // Cozy floor lamp in corner - grounded on floor
  const lamp = new Graphics();
  // Lamp base on floor
  lamp.ellipse(760, 590, 18, 6);
  lamp.fill(0x3a3a3a);
  lamp.ellipse(760, 588, 15, 5);
  lamp.fill(0x4a4a4a);
  // Lamp pole
  lamp.rect(757, 320, 6, 270);
  lamp.fill(0x5a5a5a);
  lamp.rect(759, 320, 2, 270);
  lamp.fill(0x6a6a6a);
  // Lamp shade
  lamp.poly([738, 320, 782, 320, 775, 270, 745, 270]);
  lamp.fill(0x8a7a6a);
  // Lamp shade inner glow
  lamp.poly([742, 318, 778, 318, 772, 275, 748, 275]);
  lamp.fill(0xeeddbb);
  room.addChild(lamp);
  
  // Animated lamp glow effect
  const lampGlow = new Graphics();
  lampGlow.ellipse(760, 322, 18, 4);
  lampGlow.fill(0xffeecc);
  // Add a larger ambient glow
  lampGlow.ellipse(760, 400, 60, 80);
  lampGlow.fill({ color: 0xffeecc, alpha: 0.08 });
  room.addChild(lampGlow);
  animState.lampGlow.graphics = lampGlow;
}

function createAwards(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.label = 'awards';

  const frameWidth = 45;
  const frameHeight = 55;
  const spacing = 55;

  for (let i = 0; i < 3; i++) {
    const frame = new Graphics();
    const fx = i * spacing;
    
    // Frame shadow
    frame.rect(fx + 2, 2, frameWidth, frameHeight);
    frame.fill(0x1a1a2a);
    
    // Frame outer
    frame.rect(fx, 0, frameWidth, frameHeight);
    frame.fill(COLORS.gold);
    
    // Frame inner border
    frame.rect(fx + 3, 3, frameWidth - 6, frameHeight - 6);
    frame.fill(COLORS.goldDark);
    
    // Certificate paper
    frame.rect(fx + 6, 6, frameWidth - 12, frameHeight - 12);
    frame.fill(COLORS.cream);
    
    // Certificate details
    frame.rect(fx + 10, 12, frameWidth - 20, 2);
    frame.fill(0xccccbb);
    frame.rect(fx + 12, 18, frameWidth - 24, 1);
    frame.fill(0xddddcc);
    frame.rect(fx + 12, 22, frameWidth - 24, 1);
    frame.fill(0xddddcc);
    frame.rect(fx + 12, 26, frameWidth - 24, 1);
    frame.fill(0xddddcc);
    
    // Gold seal
    frame.circle(fx + frameWidth/2, 38, 6);
    frame.fill(COLORS.gold);
    frame.circle(fx + frameWidth/2, 38, 4);
    frame.fill(COLORS.goldDark);
    
    container.addChild(frame);
  }

  return container;
}

function createCalendar(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.label = 'schedule';

  const cal = new Graphics();
  
  // Calendar shadow
  cal.rect(2, 2, 70, 85);
  cal.fill(0x1a1a2a);
  
  // Calendar board
  cal.rect(0, 0, 70, 85);
  cal.fill(0x3a3a3a);
  
  // Calendar paper
  cal.rect(4, 4, 62, 77);
  cal.fill(COLORS.paper);
  
  // Red header (month bar)
  cal.rect(4, 4, 62, 14);
  cal.fill(0xc54a4a);
  
  // Month text placeholder
  cal.rect(15, 8, 40, 6);
  cal.fill(0xffffff);
  
  // Calendar grid lines
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      cal.rect(8 + col * 8, 22 + row * 11, 7, 9);
      cal.fill(0xeeeedd);
    }
  }
  
  // Highlighted dates (current week)
  cal.rect(8 + 2 * 8, 22 + 2 * 11, 7, 9);
  cal.fill(0xffeeaa);
  cal.rect(8 + 3 * 8, 22 + 2 * 11, 7, 9);
  cal.fill(0xffeeaa);
  cal.rect(8 + 4 * 8, 22 + 2 * 11, 7, 9);
  cal.fill(0xffeeaa);
  
  // Pin at top
  cal.circle(35, 0, 4);
  cal.fill(0xcc3333);
  cal.circle(35, 0, 2);
  cal.fill(0xee5555);
  
  container.addChild(cal);

  return container;
}

function createStudyDesk(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.label = 'academics';

  const desk = new Graphics();
  
  // Desk surface - rounded for cuter look
  desk.roundRect(-5, 80, 195, 14, 4);
  desk.fill(COLORS.woodMid);
  desk.roundRect(-5, 80, 195, 4, 2);
  desk.fill(COLORS.woodLight);
  
  // Desk front panel - with rounded corners
  desk.roundRect(0, 94, 185, 48, 4);
  desk.fill(COLORS.woodDark);
  
  // Cute drawer with rounded corners
  desk.roundRect(58, 100, 65, 36, 4);
  desk.fill(COLORS.woodMid);
  // Drawer handle - cute round knob
  desk.circle(90, 118, 6);
  desk.fill(COLORS.gold);
  desk.circle(90, 118, 4);
  desk.fill(COLORS.goldDark);
  
  // Desk legs - tapered for style
  desk.poly([8, 142, 22, 142, 18, 192, 12, 192]);
  desk.fill(COLORS.woodDark);
  desk.poly([163, 142, 177, 142, 173, 192, 167, 192]);
  desk.fill(COLORS.woodDark);

  // Open Spiral Notebook (Academics)
  // Shadow
  desk.roundRect(52, 58, 84, 28, 2);
  desk.fill(COLORS.carpetDark);

  // Cover (Dark Blue)
  desk.roundRect(50, 56, 84, 28, 2);
  desk.fill(0x3a4a5a);

  // Pages (Cream/White)
  // Left Page
  desk.rect(52, 58, 38, 24);
  desk.fill(COLORS.paper);
  // Right Page
  desk.rect(94, 58, 38, 24);
  desk.fill(COLORS.paper);

  // Text/Lines
  for (let i = 0; i < 4; i++) {
    const ly = 64 + i * 5;
    // Left lines
    desk.rect(56, ly, 30, 1);
    desk.fill(0xd0d0d0);
    // Right lines
    desk.rect(98, ly, 30, 1);
    desk.fill(0xd0d0d0);
  }

  // Spiral Binding (Center)
  desk.rect(90, 56, 4, 28);
  desk.fill(0x222222); // Dark gap

  for (let i = 0; i < 8; i++) {
    const ly = 58 + i * 3;
    desk.roundRect(89, ly, 6, 1.5, 0.75);
    desk.fill(0xcccccc);
  }
  
  // Pen laying beside notebook
  desk.roundRect(140, 65, 40, 5, 2);
  desk.fill(0x2a2a3a);
  desk.poly([140, 65, 140, 70, 136, 67.5]); // Pen tip
  desk.fill(0xc0c0c0);
  desk.roundRect(170, 66, 10, 3, 1);
  desk.fill(0x4a4a5a); // Pen clip
  
  // Cozy coffee mug with animated steam
  desk.roundRect(148, 60, 22, 20, 4);
  desk.fill(0x7a6a5a); // Warm ceramic
  desk.roundRect(168, 66, 8, 10, 4);
  desk.fill(0x7a6a5a); // Handle
  desk.ellipse(159, 62, 10, 4);
  desk.fill(0x5a4030); // Coffee
  
  container.addChild(desk);
  
  // Create animated steam particles - positioned relative to the container
  // Coffee mug is at ~159, 60 relative to the desk, which is at x, y
  // Steam should rise from around y=55 (just above the mug)
  const steamContainer = new Container();
  // Don't set position - particles will use coordinates relative to container's parent
  
  // Store initial positions for steam particles to reset properly
  const steamBaseX = x + 159; // Absolute X of mug center
  const steamBaseY = y + 52;  // Absolute Y just above mug
  
  for (let i = 0; i < 5; i++) {
    const steam = new Graphics();
    const startX = steamBaseX + (Math.random() - 0.5) * 6;
    const startY = steamBaseY - i * 6;
    steam.circle(startX, startY, 2 + Math.random());
    steam.fill({ color: 0xffffff, alpha: 0.25 });
    steamContainer.addChild(steam);
    // Store base position on the graphics object for reset
    (steam as any)._baseX = steamBaseX;
    (steam as any)._baseY = steamBaseY;
    (steam as any)._offsetY = i * 6;
    animState.steam.particles.push(steam);
  }
  animState.steam.container = steamContainer;
  
  // Cute pencil cup - rounded
  desk.roundRect(12, 58, 26, 22, 6);
  desk.fill(0x6a6a7a);
  desk.roundRect(14, 60, 22, 4, 2);
  desk.fill(0x7a7a8a);
  desk.rect(18, 46, 4, 16);
  desk.fill(0xf4c542); // Yellow pencil
  desk.poly([18, 46, 22, 46, 20, 42]); // Pencil tip
  desk.fill(0xeeddcc);
  desk.rect(26, 48, 4, 14);
  desk.fill(0x4a5a6a); // Blue pen
  desk.rect(32, 45, 4, 17);
  desk.fill(0x8a5a5a); // Red pen
  
  // Small desk plant - animated leaves
  const plantPot = new Graphics();
  plantPot.roundRect(0, 62, 18, 18, 4);
  plantPot.fill(0x6a5545);
  container.addChild(plantPot);
  
  const plantLeaf1 = new Graphics();
  plantLeaf1.circle(9, 55, 10);
  plantLeaf1.fill(0x4a7a4a);
  plantLeaf1.pivot.set(9, 62);
  plantLeaf1.position.set(9, 62);
  container.addChild(plantLeaf1);
  animState.plants.graphics.push(plantLeaf1);
  animState.plants.baseRotations.push(0);
  
  const plantLeaf2 = new Graphics();
  plantLeaf2.circle(5, 58, 6);
  plantLeaf2.fill(0x5a8a5a);
  plantLeaf2.pivot.set(9, 62);
  plantLeaf2.position.set(9, 62);
  container.addChild(plantLeaf2);
  animState.plants.graphics.push(plantLeaf2);
  animState.plants.baseRotations.push(0);
  
  return container;
}

function createDevSetup(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.label = 'projects';

  const setup = new Graphics();
  
  // Desk surface - rounded edges for welcoming feel
  setup.roundRect(-5, 130, 270, 16, 5);
  setup.fill(COLORS.woodMid);
  setup.roundRect(-5, 130, 270, 5, 3);
  setup.fill(COLORS.woodLight);
  
  // Desk front - with subtle rounded corners
  setup.roundRect(0, 146, 260, 52, 5);
  setup.fill(COLORS.woodDark);
  
  // Desk legs - tapered, modern style
  setup.poly([12, 198, 28, 198, 24, 244, 16, 244]);
  setup.fill(COLORS.woodDark);
  setup.poly([232, 198, 248, 198, 244, 244, 236, 244]);
  setup.fill(COLORS.woodDark);
  
  // Monitor stand base - sleek rounded
  setup.roundRect(88, 116, 84, 14, 4);
  setup.fill(0x3a3a4a);
  setup.roundRect(118, 98, 24, 20, 3);
  setup.fill(0x3a3a4a);
  
  // Main monitor - modern rounded bezel
  setup.roundRect(58, 8, 144, 92, 6);
  setup.fill(0x2a2a3a);
  setup.roundRect(64, 14, 132, 80, 4);
  setup.fill(COLORS.screenDark);
  
  container.addChild(setup);
  
  // Create animated code lines on screen (separate container for animation)
  const codeContainer = new Container();
  codeContainer.x = 0;
  codeContainer.y = 0;
  
  // Create a mask for the screen area
  const screenMask = new Graphics();
  screenMask.roundRect(64, 14, 132, 80, 4);
  screenMask.fill(0xffffff);
  codeContainer.mask = screenMask;
  container.addChild(screenMask);
  
  const codeColors = [0x61afef, 0x98c379, 0xe5c07b, 0xc678dd, 0x56b6c2, 0xe06c75];
  
  // Create more code lines for scrolling effect - store line info for cursor
  const lineData: { x: number; width: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const codeLine = new Graphics();
    const width = 30 + Math.random() * 45;
    const indent = Math.random() > 0.7 ? 12 : (Math.random() > 0.5 ? 6 : 0);
    const lineX = 72 + indent;
    const lineY = 20 + i * 7;
    codeLine.rect(lineX, lineY, width, 4);
    codeLine.fill(codeColors[i % codeColors.length]);
    codeContainer.addChild(codeLine);
    animState.codeLines.graphics.push(codeLine);
    lineData.push({ x: lineX, width, y: lineY });
  }
  
  // Blinking cursor - position at the end of a middle line (line 4)
  const cursorLine = lineData[4];
  const cursor = new Graphics();
  cursor.rect(cursorLine.x + cursorLine.width + 2, cursorLine.y - 1, 2, 6);
  cursor.fill(0xffffff);
  codeContainer.addChild(cursor);
  animState.codeLines.graphics.push(cursor); // Add cursor to be animated
  
  container.addChild(codeContainer);
  
  // Rest of the setup drawn on a new graphics
  const setupRest = new Graphics();
  
  // Keyboard on desk - mechanical style
  setupRest.roundRect(78, 133, 104, 22, 4);
  setupRest.fill(0x3a3a4a);
  // Key rows with rounded keys
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 12; col++) {
      setupRest.roundRect(84 + col * 8, 137 + row * 6, 6, 5, 1);
      setupRest.fill(0x5a5a6a);
    }
  }
  
  // Mouse - ergonomic shape
  setupRest.roundRect(196, 136, 22, 16, 6);
  setupRest.fill(0x3a3a4a);
  setupRest.roundRect(204, 138, 6, 6, 2);
  setupRest.fill(0x4a4a5a);
  
  // Cute desk plant in nice pot - animated
  setupRest.roundRect(16, 106, 28, 24, 6);
  setupRest.fill(0x7a6050); // Terracotta pot
  setupRest.roundRect(18, 108, 24, 4, 2);
  setupRest.fill(0x8a7060); // Pot rim
  container.addChild(setupRest);
  
  // Animated plant leaves
  const devPlant1 = new Graphics();
  devPlant1.ellipse(30, 96, 16, 18);
  devPlant1.fill(0x4a7a4a);
  devPlant1.pivot.set(30, 106);
  devPlant1.position.set(30, 106);
  container.addChild(devPlant1);
  animState.plants.graphics.push(devPlant1);
  animState.plants.baseRotations.push(0);
  
  const devPlant2 = new Graphics();
  devPlant2.ellipse(23, 100, 10, 12);
  devPlant2.fill(0x5a8a5a);
  devPlant2.pivot.set(30, 106);
  devPlant2.position.set(30, 106);
  container.addChild(devPlant2);
  animState.plants.graphics.push(devPlant2);
  animState.plants.baseRotations.push(0);
  
  const devPlant3 = new Graphics();
  devPlant3.ellipse(37, 98, 10, 12);
  devPlant3.fill(0x5a8a5a);
  devPlant3.pivot.set(30, 106);
  devPlant3.position.set(30, 106);
  container.addChild(devPlant3);
  animState.plants.graphics.push(devPlant3);
  animState.plants.baseRotations.push(0);
  
  // Water bottle and headphones (static)
  const staticItems = new Graphics();
  
  // Water bottle - sporty style
  staticItems.roundRect(226, 102, 18, 28, 6);
  staticItems.fill(0x4a7a8a);
  staticItems.roundRect(228, 96, 14, 10, 4);
  staticItems.fill(0x3a3a4a); // Cap
  staticItems.rect(230, 110, 12, 4);
  staticItems.fill(0x6a9aba); // Label stripe
  
  // Headphones hanging on monitor (cozy touch)
  staticItems.roundRect(190, 20, 22, 26, 8);
  staticItems.fill(0x4a4a5a);
  staticItems.roundRect(192, 22, 18, 22, 6);
  staticItems.fill(0x5a5a6a);
  staticItems.roundRect(194, 8, 14, 14, 4);
  staticItems.fill(0x4a4a5a); // Headband
  
  container.addChild(staticItems);
  
  return container;
}

function makeInteractive(container: Container, contentKey: string, app: Application) {
  container.eventMode = 'static';
  container.cursor = 'pointer';

  const glowFilter = new GlowFilter({
    distance: 12,
    outerStrength: 1.5,
    innerStrength: 0,
    color: COLORS.glow,
    alpha: 0.7,
  });
  
  container.filters = [glowFilter];

  let time = Math.random() * Math.PI * 2;
  app.ticker.add(() => {
    time += 0.025;
    glowFilter.outerStrength = 1.2 + Math.sin(time) * 0.5;
  });

  let hoverStartedAt: number | null = null;
  container.on('pointerover', () => {
    hoverStartedAt = performance.now();
    telemetry.track('hover_start', { target: contentKey });
    glowFilter.outerStrength = 3;
    glowFilter.color = 0xffffff;
    container.scale.set(1.02);
  });

  container.on('pointerout', () => {
    if (hoverStartedAt != null) {
      const seconds = Math.round(((performance.now() - hoverStartedAt) / 1000) * 10) / 10;
      telemetry.track('hover_end', { target: contentKey, seconds });
      hoverStartedAt = null;
    }
    glowFilter.color = COLORS.glow;
    container.scale.set(1);
  });

  container.on('pointerdown', (_e: FederatedPointerEvent) => {
    telemetry.track('click_target', { target: contentKey });
    showOverlay(contentKey);
  });
}

function showOverlay(contentKey: string) {
  const overlay = document.getElementById('overlay')!;
  const body = document.getElementById('overlay-body')!;
  
  const data = content[contentKey];
  if (data) {
    body.innerHTML = data.html;
  }
  
  overlay.classList.add('visible');

  interactionCount += 1;
  if (!firstInteractionCaptured) {
    firstInteractionCaptured = true;
    firstInteractionAtMs = performance.now();
    captureAnalytics('first_interaction', { via: 'open_overlay' });
  }

  currentOverlayKey = contentKey;
  overlayOpenedAtMs = performance.now();
  captureAnalytics('open_overlay', { overlay: contentKey });
  telemetry.track('open_overlay', { overlay: contentKey });

  const overlayContent = overlay.querySelector('.overlay-content') as HTMLElement | null;
  if (overlayContent) {
    overlayScrollStats = {
      maxPct: 0,
      totalPx: 0,
      maxSpeedPxPerSec: 0,
      lastTop: overlayContent.scrollTop,
      lastTs: performance.now(),
    };
  } else {
    overlayScrollStats = null;
  }
}

function setupOverlay() {
  const overlay = document.getElementById('overlay')!;
  const closeBtn = document.getElementById('close-overlay')!;
  const overlayContent = overlay.querySelector('.overlay-content') as HTMLElement | null;

  if (overlayContent) {
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
          overlayScrollStats.maxSpeedPxPerSec = Math.max(
            overlayScrollStats.maxSpeedPxPerSec,
            Math.abs(deltaPx) / dt
          );
        }

        overlayScrollStats.totalPx += Math.abs(deltaPx);
        overlayScrollStats.lastTop = overlayContent.scrollTop;
        overlayScrollStats.lastTs = now;
      },
      { passive: true }
    );
  }

  const hide = (reason: string) => {
    if (!overlay.classList.contains('visible')) return;
    overlay.classList.remove('visible');

    const overlayKey = currentOverlayKey;
    const openedAt = overlayOpenedAtMs;
    const scroll = overlayScrollStats;
    currentOverlayKey = null;
    overlayOpenedAtMs = null;
    overlayScrollStats = null;

    if (overlayKey && openedAt != null) {
      const openSeconds = Math.round((performance.now() - openedAt) / 1000);
      overlaySummary.set(overlayKey, (overlaySummary.get(overlayKey) ?? 0) + openSeconds);
      captureAnalytics('close_overlay', {
        overlay: overlayKey,
        reason,
        open_seconds: openSeconds,
        max_scroll_pct: scroll ? Math.round(scroll.maxPct * 1000) / 1000 : 0,
        total_scroll_px: scroll ? Math.round(scroll.totalPx) : 0,
      });

      telemetry.track('close_overlay', {
        overlay: overlayKey,
        reason,
        open_seconds: openSeconds,
        max_scroll_pct: scroll ? Math.round(scroll.maxPct * 1000) / 1000 : 0,
        total_scroll_px: scroll ? Math.round(scroll.totalPx) : 0,
        max_scroll_speed_px_s: scroll ? Math.round(scroll.maxSpeedPxPerSec) : 0,
      });
    } else {
      captureAnalytics('close_overlay', { overlay: overlayKey ?? 'unknown', reason });
      telemetry.track('close_overlay', { overlay: overlayKey ?? 'unknown', reason });
    }
  };

  closeBtn.addEventListener('click', () => hide('button'));

  overlay.addEventListener('click', (e) => {
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

function addLabels(room: Container) {
  const labelStyle = new TextStyle({
    fontFamily: 'Press Start 2P',
    fontSize: 7,
    fill: 0xcccccc,
    dropShadow: {
      color: 0x000000,
      blur: 2,
      distance: 1,
    },
  });

  const labels = [
    { text: 'AWARDS', x: 423, y: 155 },
    { text: 'SCHEDULE', x: 315, y: 335 },
    { text: 'ACADEMICS', x: 140, y: 510 },
    { text: 'PROJECTS', x: 610, y: 510 },
  ];

  labels.forEach(({ text, x, y }) => {
    const label = new Text({ text, style: labelStyle });
    label.anchor.set(0.5);
    label.x = x;
    label.y = y;
    label.alpha = 0.6;
    room.addChild(label);
  });
}

function addTitle(room: Container) {
  const titleStyle = new TextStyle({
    fontFamily: 'Press Start 2P',
    fontSize: 12,
    fill: 0xffffff,
    dropShadow: {
      color: 0x000000,
      blur: 4,
      distance: 2,
    },
  });

  const title = new Text({ text: "TREVOR'S ROOM", style: titleStyle });
  title.anchor.set(0.5, 0);
  title.x = ROOM_WIDTH / 2;
  title.y = 12;
  room.addChild(title);

  const subtitleStyle = new TextStyle({
    fontFamily: 'VT323',
    fontSize: 16,
    fill: 0xaaaaaa,
  });

  const subtitle = new Text({ text: 'Welcome to my portfolio', style: subtitleStyle });
  subtitle.anchor.set(0.5, 0);
  subtitle.x = ROOM_WIDTH / 2;
  subtitle.y = 32;
  room.addChild(subtitle);
}

function createDustMotes(room: Container, _app: Application) {
  // Create dust particles floating in lamp light - reduced count for subtlety
  for (let i = 0; i < 10; i++) {
    animState.dustMotes.particles.push({
      x: 700 + Math.random() * 70,
      y: 300 + Math.random() * 150,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.05 - Math.random() * 0.1,
      alpha: 0.15 + Math.random() * 0.15,
      size: 0.8 + Math.random() * 1,
    });
  }
  
  animState.dustMotes.graphics = new Graphics();
  room.addChild(animState.dustMotes.graphics);
}

function startAnimations(app: Application) {
  let time = 0;
  
  app.ticker.add((ticker) => {
    time += ticker.deltaTime * 0.016; // Convert to seconds approximately
    
    // === CLOCK ANIMATION (Real time) ===
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    
    animState.clock.secondHand.rotation = (seconds / 60) * Math.PI * 2;
    animState.clock.minuteHand.rotation = (minutes / 60) * Math.PI * 2;
    animState.clock.hourHand.rotation = (hours / 12) * Math.PI * 2;
    
    // === STAR TWINKLING ===
    animState.stars.forEach((star) => {
      star.phase += star.speed * 0.01;
      const twinkle = Math.sin(star.phase) * 0.5 + 0.5;
      // Only change brightness subtly
      star.graphics.alpha = 0.65 + twinkle * 0.3;
    });
    
    // === CURTAIN SWAY ===
    const curtainSway = Math.sin(time * 0.8) * 0.025;
    animState.curtains.left.rotation = curtainSway;
    animState.curtains.right.rotation = -curtainSway * 0.8; // Slightly different for natural look
    
    // === LAMP GLOW PULSE ===
    const glowPulse = Math.sin(time * 1.5) * 0.35 + 0.65;
    animState.lampGlow.graphics.alpha = glowPulse;
    
    // === STEAM ANIMATION ===
    animState.steam.particles.forEach((steam, i) => {
      const baseX = (steam as any)._baseX || 209; // fallback
      const baseY = (steam as any)._baseY || 352;
      const offsetY = (steam as any)._offsetY || 0;
      
      // Calculate position based on time
      const progress = ((time * 0.5 + i * 0.3) % 2) / 2; // 0 to 1 cycle
      const riseAmount = progress * 25; // Rise up to 25 pixels
      const wobble = Math.sin(time * 3 + i * 1.5) * 3; // Side-to-side wobble
      const fadeOut = 1 - progress; // Fade as it rises
      
      steam.clear();
      const size = 1.5 + (1 - progress) * 1.5; // Shrink as it rises
      steam.circle(baseX + wobble, baseY - riseAmount - offsetY * 0.3, size);
      steam.fill({ color: 0xffffff, alpha: fadeOut * 0.3 });
    });
    
    // === PLANT SWAY ===
    animState.plants.graphics.forEach((plant, i) => {
      const swayAmount = 0.06 + (i % 3) * 0.02;
      const swaySpeed = 0.8 + (i % 2) * 0.2;
      plant.rotation = Math.sin(time * swaySpeed + i * 0.7) * swayAmount;
    });
    
    // === CODE SCROLLING & CURSOR BLINK ===
    animState.codeLines.scrollOffset += 0.02;
    
    // Move code lines up slowly and wrap around
    const codeLineCount = animState.codeLines.graphics.length - 1; // -1 for cursor
    animState.codeLines.graphics.forEach((line, i) => {
      if (i < codeLineCount) {
        // Code lines scroll
        line.y = -Math.sin(animState.codeLines.scrollOffset * 0.5 + i * 0.1) * 0.5;
      } else {
        // Cursor blinks
        line.alpha = Math.sin(time * 6) > 0 ? 1 : 0;
      }
    });
    
    // === DUST MOTES ===
    animState.dustMotes.graphics.clear();
    animState.dustMotes.particles.forEach((mote) => {
      // Update position
      mote.x += mote.vx + Math.sin(time * 0.5 + mote.y * 0.01) * 0.1;
      mote.y += mote.vy;
      
      // Gentle floating
      mote.vx += (Math.random() - 0.5) * 0.02;
      mote.vy += (Math.random() - 0.5) * 0.01;
      
      // Dampen velocity
      mote.vx *= 0.99;
      mote.vy *= 0.99;
      
      // Reset if out of bounds
      if (mote.y < 260 || mote.y > 500 || mote.x < 660 || mote.x > 790) {
        mote.x = 700 + Math.random() * 60;
        mote.y = 350 + Math.random() * 100;
        mote.vx = (Math.random() - 0.5) * 0.2;
        mote.vy = -0.1 - Math.random() * 0.15;
      }
      
      // Twinkle effect
      const twinkle = Math.sin(time * 3 + mote.x + mote.y) * 0.3 + 0.7;
      
      // Draw mote
      animState.dustMotes.graphics.circle(mote.x, mote.y, mote.size);
      animState.dustMotes.graphics.fill({ color: 0xffffee, alpha: mote.alpha * twinkle });
    });
  });
}

init().catch(console.error);
