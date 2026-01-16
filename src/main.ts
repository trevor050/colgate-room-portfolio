import './style.css';
import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { content } from './content';

// Room dimensions
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;

// Set viewport height CSS variable immediately (fixes iOS Safari 100vh issue)
function setViewportHeight() {
  const vh = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${vh}px`);
}
setViewportHeight();

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

  // Safari-safe resize function
  function resize() {
    // Use visualViewport for mobile Safari, with fallbacks
    let viewportWidth: number;
    let viewportHeight: number;
    
    if (window.visualViewport) {
      viewportWidth = window.visualViewport.width;
      viewportHeight = window.visualViewport.height;
    } else {
      // Fallback for older browsers
      viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    }
    
    // Account for safe areas on notched devices
    const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')) || 0;
    const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 0;
    const safeAreaLeft = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left')) || 0;
    const safeAreaRight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right')) || 0;
    
    // Adjust for safe areas
    const availableWidth = viewportWidth - safeAreaLeft - safeAreaRight;
    const availableHeight = viewportHeight - safeAreaTop - safeAreaBottom;
    
    // Calculate scale to fit the room, with a small margin for breathing room
    const scale = Math.min(
      (availableWidth * 0.98) / ROOM_WIDTH,
      (availableHeight * 0.95) / ROOM_HEIGHT
    );
    
    app.canvas.style.width = `${ROOM_WIDTH * scale}px`;
    app.canvas.style.height = `${ROOM_HEIGHT * scale}px`;
    
    // Update CSS custom property for viewport height (fixes iOS 100vh bug)
    document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
  }
  
  resize();
  
  // Listen to multiple events for Safari compatibility
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => {
    // Delay resize on orientation change for Safari to settle
    setTimeout(resize, 100);
    setTimeout(resize, 300);
  });
  
  // Visual viewport resize (important for mobile Safari keyboard, toolbar changes)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
    window.visualViewport.addEventListener('scroll', resize);
  }

  const room = new Container();
  app.stage.addChild(room);

  // Draw the room
  drawRoom(room);

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
  makeInteractive(studyDesk, 'academics', app);

  // Dev setup - cleaner, everything on desk
  const devSetup = createDevSetup(480, 250);
  room.addChild(devSetup);
  makeInteractive(devSetup, 'projects', app);

  // Add labels
  addLabels(room);

  // Add title
  addTitle(room);

  // Hide loading screen
  document.getElementById('loading')!.classList.add('hidden');

  // Setup overlay
  setupOverlay();

  // Hint text without emojis
  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Click the glowing objects to explore';
  document.body.appendChild(hint);
}

function drawRoom(room: Container) {
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
  
  // Stars in window
  windowEl.circle(65, 105, 1.5);
  windowEl.fill(0xffffee);
  windowEl.circle(80, 125, 1);
  windowEl.fill(0xffffee);
  windowEl.circle(115, 175, 1);
  windowEl.fill(0xffffee);
  
  // Cozy curtains - warm fabric look with folds
  windowEl.rect(25, 68, 22, 175);
  windowEl.fill(0x6a5a60); // Warm taupe
  windowEl.rect(28, 68, 4, 175);
  windowEl.fill(0x7a6a70); // Fold highlight
  windowEl.rect(40, 68, 4, 175);
  windowEl.fill(0x5a4a50); // Fold shadow
  
  windowEl.rect(153, 68, 22, 175);
  windowEl.fill(0x6a5a60);
  windowEl.rect(156, 68, 4, 175);
  windowEl.fill(0x7a6a70);
  windowEl.rect(168, 68, 4, 175);
  windowEl.fill(0x5a4a50);
  
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

  // Clock on wall - cozy wooden frame
  const clock = new Graphics();
  // Clock wooden frame
  clock.circle(600, 85, 28);
  clock.fill(COLORS.woodMid);
  clock.circle(600, 85, 25);
  clock.fill(COLORS.woodLight);
  // Clock face
  clock.circle(600, 85, 22);
  clock.fill(COLORS.cream);
  clock.circle(600, 85, 20);
  clock.stroke({ width: 1, color: COLORS.woodDark });
  // Clock center
  clock.circle(600, 85, 3);
  clock.fill(COLORS.woodDark);
  
  // Hour hand pointing to 10
  clock.poly([600, 85, 592, 77, 594, 75, 602, 83]);
  clock.fill(COLORS.woodDark);
  
  // Minute hand pointing to 2
  clock.poly([600, 85, 610, 71, 612, 73, 602, 87]);
  clock.fill(0x5a5a6a);
  
  // Hour markers (simple dots)
  clock.circle(600, 66, 2);
  clock.fill(COLORS.woodDark);
  clock.circle(600, 104, 2);
  clock.fill(COLORS.woodDark);
  clock.circle(581, 85, 2);
  clock.fill(COLORS.woodDark);
  clock.circle(619, 85, 2);
  clock.fill(COLORS.woodDark);
  
  room.addChild(clock);

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
  // Light glow effect under shade
  lamp.ellipse(760, 322, 18, 4);
  lamp.fill(0xffeecc);
  room.addChild(lamp);
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
  
  // Cozy coffee mug with steam
  desk.roundRect(148, 60, 22, 20, 4);
  desk.fill(0x7a6a5a); // Warm ceramic
  desk.roundRect(168, 66, 8, 10, 4);
  desk.fill(0x7a6a5a); // Handle
  desk.ellipse(159, 62, 10, 4);
  desk.fill(0x5a4030); // Coffee
  // Steam lines
  desk.rect(155, 50, 2, 8);
  desk.fill(0xcccccc);
  desk.rect(161, 48, 2, 10);
  desk.fill(0xcccccc);
  
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
  
  // Small desk plant
  desk.roundRect(0, 62, 18, 18, 4);
  desk.fill(0x6a5545);
  desk.circle(9, 55, 10);
  desk.fill(0x4a7a4a);
  desk.circle(5, 58, 6);
  desk.fill(0x5a8a5a);
  
  container.addChild(desk);
  
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
  
  // Code on screen - syntax highlighted
  const codeLines = [
    { x: 72, w: 35, color: 0x61afef },
    { x: 72, w: 55, color: 0x98c379 },
    { x: 72, w: 40, color: 0xe5c07b },
    { x: 72, w: 65, color: 0xc678dd },
    { x: 72, w: 50, color: 0x56b6c2 },
    { x: 72, w: 60, color: 0x61afef },
    { x: 72, w: 30, color: 0xe06c75 },
    { x: 72, w: 70, color: 0x98c379 },
    { x: 72, w: 45, color: 0x61afef },
    { x: 72, w: 55, color: 0xc678dd },
  ];
  
  codeLines.forEach((line, i) => {
    setup.rect(line.x, 22 + i * 7, line.w, 4);
    setup.fill(line.color);
  });
  
  // Keyboard on desk - mechanical style
  setup.roundRect(78, 133, 104, 22, 4);
  setup.fill(0x3a3a4a);
  // Key rows with rounded keys
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 12; col++) {
      setup.roundRect(84 + col * 8, 137 + row * 6, 6, 5, 1);
      setup.fill(0x5a5a6a);
    }
  }
  
  // Mouse - ergonomic shape
  setup.roundRect(196, 136, 22, 16, 6);
  setup.fill(0x3a3a4a);
  setup.roundRect(204, 138, 6, 6, 2);
  setup.fill(0x4a4a5a);
  
  // Cute desk plant in nice pot
  setup.roundRect(16, 106, 28, 24, 6);
  setup.fill(0x7a6050); // Terracotta pot
  setup.roundRect(18, 108, 24, 4, 2);
  setup.fill(0x8a7060); // Pot rim
  setup.ellipse(30, 96, 16, 18);
  setup.fill(0x4a7a4a);
  setup.ellipse(23, 100, 10, 12);
  setup.fill(0x5a8a5a);
  setup.ellipse(37, 98, 10, 12);
  setup.fill(0x5a8a5a);
  
  // Water bottle - sporty style
  setup.roundRect(226, 102, 18, 28, 6);
  setup.fill(0x4a7a8a);
  setup.roundRect(228, 96, 14, 10, 4);
  setup.fill(0x3a3a4a); // Cap
  setup.rect(230, 110, 12, 4);
  setup.fill(0x6a9aba); // Label stripe
  
  // Headphones hanging on monitor (cozy touch)
  setup.roundRect(190, 20, 22, 26, 8);
  setup.fill(0x4a4a5a);
  setup.roundRect(192, 22, 18, 22, 6);
  setup.fill(0x5a5a6a);
  setup.roundRect(194, 8, 14, 14, 4);
  setup.fill(0x4a4a5a); // Headband
  
  container.addChild(setup);
  
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

  container.on('pointerover', () => {
    glowFilter.outerStrength = 3;
    glowFilter.color = 0xffffff;
    container.scale.set(1.02);
  });

  container.on('pointerout', () => {
    glowFilter.color = COLORS.glow;
    container.scale.set(1);
  });

  container.on('pointerdown', (_e: FederatedPointerEvent) => {
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
}

function setupOverlay() {
  const overlay = document.getElementById('overlay')!;
  const closeBtn = document.getElementById('close-overlay')!;

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('visible');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('visible');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.classList.remove('visible');
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

init().catch(console.error);
