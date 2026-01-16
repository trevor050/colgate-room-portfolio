import './style.css';
import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { content } from './content';

// Room dimensions
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;

// Refined color palette - cozy evening room
const COLORS = {
  // Walls - warm evening tones
  wallLight: 0x4a4a6a,
  wallDark: 0x3a3a5a,
  wallAccent: 0x2d2d44,
  
  // Floor - rich wood
  floorBase: 0x5c4332,
  floorLight: 0x6b5040,
  floorDark: 0x4a3528,
  floorGap: 0x3a2718,
  
  // Furniture - warm wood tones
  woodLight: 0x9a8060,
  woodMid: 0x7a6050,
  woodDark: 0x5a4535,
  
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
    const scale = Math.min(
      window.innerWidth / ROOM_WIDTH,
      window.innerHeight / ROOM_HEIGHT
    );
    app.canvas.style.width = `${ROOM_WIDTH * scale}px`;
    app.canvas.style.height = `${ROOM_HEIGHT * scale}px`;
  }
  
  resize();
  window.addEventListener('resize', resize);

  const room = new Container();
  app.stage.addChild(room);

  // Draw the room
  drawRoom(room);

  // Interactive elements
  // Awards - 3 frames on wall, cleaner placement
  const awards = createAwards(420, 100);
  room.addChild(awards);
  makeInteractive(awards, 'awards', app);

  // Calendar on wall for schedule - centered on wall
  const calendar = createCalendar(350, 200);
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
  
  // Wall - cleaner single color with subtle gradient
  bg.rect(0, 0, ROOM_WIDTH, 420);
  bg.fill(0x4a4a5a); // Muted slate blue/grey
  
  // Subtle shadow at top for depth
  bg.rect(0, 0, ROOM_WIDTH, 40);
  bg.fill({ color: 0x000000, alpha: 0.2 });
  
  // Baseboard only (removed the huge lower wall section)
  bg.rect(0, 410, ROOM_WIDTH, 12);
  bg.fill(0x3a2a2a); // Dark wood
  bg.rect(0, 410, ROOM_WIDTH, 2);
  bg.fill(0x5a4a4a); // Highlight
  
  // Floor
  bg.rect(0, 422, ROOM_WIDTH, 180);
  bg.fill(COLORS.floorBase);
  
  // Floor planks - more refined pattern
  for (let y = 422; y < 600; y += 35) {
    const rowOffset = ((y - 422) / 35) % 2 === 0 ? 0 : 60;
    for (let x = -60 + rowOffset; x < ROOM_WIDTH + 60; x += 120) {
      // Main plank
      bg.rect(x, y, 118, 33);
      bg.fill(COLORS.floorLight);
      // Plank edge highlight
      bg.rect(x, y, 118, 2);
      bg.fill(COLORS.floorBase);
      // Plank gap
      bg.rect(x + 118, y, 2, 33);
      bg.fill(COLORS.floorGap);
    }
    // Horizontal gap between rows
    bg.rect(0, y + 33, ROOM_WIDTH, 2);
    bg.fill(COLORS.floorGap);
  }
  
  room.addChild(bg);

  // Window - properly proportioned
  const windowEl = new Graphics();
  
  // Window outer frame
  windowEl.rect(40, 80, 120, 150);
  windowEl.fill(COLORS.woodDark);
  
  // Window inner frame
  windowEl.rect(48, 88, 104, 134);
  windowEl.fill(COLORS.woodMid);
  
  // Window panes - evening sky gradient
  windowEl.rect(52, 92, 46, 60);
  windowEl.fill(0x4a6a8a); // Evening blue
  windowEl.rect(102, 92, 46, 60);
  windowEl.fill(0x4a6a8a);
  windowEl.rect(52, 156, 46, 60);
  windowEl.fill(0x3a5a7a); // Darker bottom
  windowEl.rect(102, 156, 46, 60);
  windowEl.fill(0x3a5a7a);
  
  // Window cross
  windowEl.rect(98, 92, 4, 124);
  windowEl.fill(COLORS.woodMid);
  windowEl.rect(52, 152, 96, 4);
  windowEl.fill(COLORS.woodMid);
  
  // Stars in window
  windowEl.circle(70, 105, 1);
  windowEl.fill(0xffffff);
  windowEl.circle(130, 115, 1);
  windowEl.fill(0xffffff);
  windowEl.circle(85, 125, 1);
  windowEl.fill(0xffffff);
  
  // Curtains - simple and clean
  windowEl.rect(30, 70, 18, 170);
  windowEl.fill(0x6a4a5a); // Muted burgundy
  windowEl.rect(152, 70, 18, 170);
  windowEl.fill(0x6a4a5a);
  
  // Curtain rod
  windowEl.rect(25, 65, 150, 8);
  windowEl.fill(COLORS.woodDark);
  windowEl.circle(25, 69, 6);
  windowEl.fill(COLORS.woodDark);
  windowEl.circle(175, 69, 6);
  windowEl.fill(COLORS.woodDark);
  
  room.addChild(windowEl);

  // Bookshelf between window and awards
  const shelf = new Graphics();
  
  // Shelf brackets
  shelf.rect(220, 150, 8, 20);
  shelf.fill(COLORS.woodDark);
  shelf.rect(300, 150, 8, 20);
  shelf.fill(COLORS.woodDark);
  
  // Shelf surface
  shelf.rect(215, 145, 100, 8);
  shelf.fill(COLORS.woodMid);
  shelf.rect(215, 145, 100, 2);
  shelf.fill(COLORS.woodLight);
  
  // Books - varied heights and colors
  const books = [
    { x: 220, w: 10, h: 28, color: 0x8b4513 },
    { x: 232, w: 8, h: 24, color: 0x2e5a4a },
    { x: 242, w: 12, h: 30, color: 0x5a3a6a },
    { x: 256, w: 8, h: 22, color: 0x2a4a6a },
    { x: 266, w: 10, h: 26, color: 0x6a5a3a },
    { x: 278, w: 8, h: 24, color: 0x4a2a2a },
    { x: 288, w: 12, h: 28, color: 0x3a5a5a },
  ];
  
  books.forEach(book => {
    shelf.rect(book.x, 145 - book.h, book.w, book.h);
    shelf.fill(book.color);
    // Spine detail
    shelf.rect(book.x + 2, 145 - book.h + 4, 1, book.h - 8);
    shelf.fill(0xffffff);
  });
  
  room.addChild(shelf);

  // Framed painting (adds personality without clutter)
  const painting = new Graphics();
  // Frame
  painting.rect(240, 205, 90, 70);
  painting.fill(COLORS.woodDark);
  painting.rect(244, 209, 82, 62);
  painting.fill(0x1a2332);
  // Sky
  painting.rect(246, 211, 78, 28);
  painting.fill(0x2a4a6a);
  // Sun
  painting.circle(305, 225, 10);
  painting.fill(0xff6b6b);
  // Mountains
  painting.poly([246, 271, 274, 245, 296, 262, 324, 238, 324, 271]);
  painting.fill(0x4ecdc4);
  painting.poly([246, 271, 262, 255, 280, 271]);
  painting.fill(0x3aa89f);
  room.addChild(painting);

  // Area rug in center of room

  // Area rug in center of room
  const rug = new Graphics();
  // Outer border
  rug.roundRect(280, 495, 150, 65, 4);
  rug.fill(0x4a3a4a);
  // Main rug area
  rug.roundRect(286, 500, 138, 55, 3);
  rug.fill(0x5a4a5a);
  // Inner pattern area
  rug.roundRect(294, 507, 122, 41, 2);
  rug.fill(0x6a5a6a);
  // Center diamond pattern
  rug.poly([355, 510, 375, 527, 355, 544, 335, 527]);
  rug.fill(0x7a6a5a);
  
  room.addChild(rug);

  // Small side table removed as requested
  // No more lamp or side table code here

  // Clock on wall - readable time (10:10) with crisp hands
  const clock = new Graphics();
  // Clock face
  clock.circle(745, 150, 25);
  clock.fill(COLORS.cream);
  clock.circle(745, 150, 22);
  clock.stroke({ width: 2, color: COLORS.woodDark });
  // Clock center
  clock.circle(745, 150, 3);
  clock.fill(COLORS.woodDark);
  
  // Hour hand (short, angled up-left)
  clock.poly([745, 150, 740, 143, 742, 141, 748, 148]);
  clock.fill(COLORS.woodDark);

  // Minute hand (longer, angled up-right)
  clock.poly([745, 150, 753, 140, 755, 142, 747, 152]);
  clock.fill(0x4a4a5a);
  
  // Hour markers
  clock.circle(745, 130, 2); // 12
  clock.fill(COLORS.woodDark);
  clock.circle(745, 170, 2); // 6
  clock.fill(COLORS.woodDark);
  clock.circle(725, 150, 2); // 9
  clock.fill(COLORS.woodDark);
  clock.circle(765, 150, 2); // 3
  clock.fill(COLORS.woodDark);
  
  room.addChild(clock);
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
  
  // Desk surface
  desk.rect(0, 80, 180, 12);
  desk.fill(COLORS.woodMid);
  desk.rect(0, 80, 180, 3);
  desk.fill(COLORS.woodLight);
  
  // Desk front panel
  desk.rect(0, 92, 180, 45);
  desk.fill(COLORS.woodDark);
  
  // Drawer
  desk.rect(60, 98, 60, 32);
  desk.fill(COLORS.woodMid);
  desk.rect(85, 110, 10, 8);
  desk.fill(COLORS.gold);
  
  // Desk legs
  desk.rect(8, 137, 12, 55);
  desk.fill(COLORS.woodDark);
  desk.rect(160, 137, 12, 55);
  desk.fill(COLORS.woodDark);
  
  // Laptop on desk
  // Laptop base
  desk.rect(50, 68, 80, 12);
  desk.fill(0x3a3a4a);
  desk.rect(52, 70, 76, 8);
  desk.fill(0x4a4a5a);
  
  // Laptop screen
  desk.rect(55, 25, 70, 43);
  desk.fill(0x2a2a3a);
  desk.rect(58, 28, 64, 35);
  desk.fill(COLORS.screenDark);
  
  // Screen content
  desk.rect(62, 33, 30, 3);
  desk.fill(0x5a8aba);
  desk.rect(62, 39, 45, 2);
  desk.fill(0x6a9aca);
  desk.rect(62, 44, 35, 2);
  desk.fill(0x6a9aca);
  desk.rect(62, 49, 50, 2);
  desk.fill(0x6a9aca);
  desk.rect(62, 54, 40, 2);
  desk.fill(0x5a8aba);
  
  // Laptop hinge
  desk.rect(55, 68, 70, 3);
  desk.fill(0x3a3a4a);
  
  // Coffee mug
  desk.rect(145, 65, 18, 15);
  desk.fill(0xeeeedd);
  desk.rect(163, 69, 6, 7);
  desk.fill(0xeeeedd);
  desk.ellipse(154, 66, 9, 3);
  desk.fill(0x5a4030);
  
  // Pencil holder
  desk.rect(15, 62, 20, 18);
  desk.fill(0x5a5a6a);
  desk.rect(18, 50, 3, 14);
  desk.fill(0xf4c542); // Yellow pencil
  desk.rect(24, 52, 3, 12);
  desk.fill(0x4a4a4a); // Dark pen
  desk.rect(30, 49, 3, 15);
  desk.fill(0x8a8a9a); // Silver pen
  
  container.addChild(desk);
  
  return container;
}

function createDevSetup(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.label = 'projects';

  const setup = new Graphics();
  
  // Desk surface
  setup.rect(0, 130, 260, 14);
  setup.fill(COLORS.woodMid);
  setup.rect(0, 130, 260, 3);
  setup.fill(COLORS.woodLight);
  
  // Desk front
  setup.rect(0, 144, 260, 50);
  setup.fill(COLORS.woodDark);
  
  // Desk legs
  setup.rect(10, 194, 14, 50);
  setup.fill(COLORS.woodDark);
  setup.rect(236, 194, 14, 50);
  setup.fill(COLORS.woodDark);
  
  // Monitor stand base (on desk)
  setup.rect(90, 118, 80, 12);
  setup.fill(0x2a2a3a);
  setup.rect(120, 100, 20, 18);
  setup.fill(0x2a2a3a);
  
  // Main monitor
  setup.rect(60, 10, 140, 90);
  setup.fill(0x1a1a2a);
  setup.rect(65, 15, 130, 78);
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
  
  // Keyboard on desk
  setup.roundRect(80, 135, 100, 18, 2);
  setup.fill(0x3a3a4a);
  // Key rows
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 12; col++) {
      setup.rect(85 + col * 8, 138 + row * 5, 6, 4);
      setup.fill(0x4a4a5a);
    }
  }
  
  // Mouse
  setup.roundRect(195, 138, 18, 12, 4);
  setup.fill(0x3a3a4a);
  setup.rect(202, 140, 4, 4);
  setup.fill(0x4a4a5a);
  
  // Small desk plant
  setup.rect(20, 110, 22, 20);
  setup.fill(0x6a5040);
  setup.rect(20, 110, 22, 4);
  setup.fill(0x5a4030);
  setup.ellipse(31, 100, 14, 16);
  setup.fill(0x3a6a3a);
  setup.ellipse(25, 105, 8, 10);
  setup.fill(0x4a7a4a);
  setup.ellipse(37, 103, 8, 10);
  setup.fill(0x4a7a4a);
  
  // Water bottle on desk
  setup.roundRect(225, 105, 14, 25, 4);
  setup.fill(0x4a7a9a);
  setup.roundRect(227, 100, 10, 8, 2);
  setup.fill(0x3a3a4a);
  setup.rect(229, 110, 8, 3);
  setup.fill(0x6a9aba);
  
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
    { text: 'AWARDS', x: 500, y: 180 },
    { text: 'SCHEDULE', x: 385, y: 305 },
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
