import './style.css';
import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { content } from './content';

// Room dimensions (we'll scale to fit)
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;

// Colors for the pixel art room
const COLORS = {
  wallTop: 0x3d3d5c,
  wallBottom: 0x2d2d44,
  floor: 0x4a3728,
  floorLight: 0x5c4332,
  desk: 0x8b7355,
  deskDark: 0x6b5344,
  monitor: 0x1a1a2e,
  monitorScreen: 0x0a3d0a,
  laptop: 0x2a2a3a,
  laptopScreen: 0x1a4a6a,
  notebook: 0xf4e4c1,
  notebookLines: 0x6a9ec9,
  frame: 0xc9a227,
  frameDark: 0x8b7355,
  accent: 0xffd700,
  glow: 0xffff99,
};

async function init() {
  // Create PixiJS Application
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

  // Scale canvas to fit window while maintaining aspect ratio
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

  // Main room container
  const room = new Container();
  app.stage.addChild(room);

  // Draw the room background
  drawRoom(room);

  // Add interactive elements
  const interactables: Container[] = [];
  
  // Awards on wall
  const awardsFrame = createAwardsWall(320, 80);
  room.addChild(awardsFrame);
  interactables.push(awardsFrame);
  makeInteractive(awardsFrame, 'awards', app);

  // Study desk with laptop (academics)
  const studyDesk = createStudyDesk(80, 280);
  room.addChild(studyDesk);
  interactables.push(studyDesk);
  makeInteractive(studyDesk, 'academics', app);

  // Notebook (schedule)
  const notebook = createNotebook(180, 380);
  room.addChild(notebook);
  interactables.push(notebook);
  makeInteractive(notebook, 'schedule', app);

  // Dev setup (projects/ECs)
  const devSetup = createDevSetup(520, 220);
  room.addChild(devSetup);
  interactables.push(devSetup);
  makeInteractive(devSetup, 'projects', app);

  // Add labels
  addLabels(room);

  // Add welcome title
  addTitle(room);

  // Hide loading screen
  const loading = document.getElementById('loading')!;
  loading.classList.add('hidden');

  // Setup overlay close handlers
  setupOverlay();

  // Add hint text
  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = '✨ Click the glowing objects to explore ✨';
  document.body.appendChild(hint);
}

function drawRoom(room: Container) {
  const bg = new Graphics();
  
  // Wall gradient (top to bottom)
  bg.rect(0, 0, ROOM_WIDTH, 400);
  bg.fill(COLORS.wallTop);
  
  // Wall bottom section
  bg.rect(0, 300, ROOM_WIDTH, 100);
  bg.fill(COLORS.wallBottom);
  
  // Floor
  bg.rect(0, 400, ROOM_WIDTH, 200);
  bg.fill(COLORS.floor);
  
  // Floor boards (pixel art style)
  for (let y = 400; y < 600; y += 40) {
    for (let x = 0; x < ROOM_WIDTH; x += 80) {
      const offset = ((y - 400) / 40) % 2 === 0 ? 0 : 40;
      bg.rect(x + offset, y, 78, 38);
      bg.fill(COLORS.floorLight);
      bg.rect(x + offset, y, 78, 2);
      bg.fill(0x3a2718);
    }
  }
  
  // Baseboard
  bg.rect(0, 395, ROOM_WIDTH, 8);
  bg.fill(0x4a3a2a);
  
  // Wall decoration - horizontal line
  bg.rect(0, 200, ROOM_WIDTH, 4);
  bg.fill(COLORS.wallBottom);
  
  room.addChild(bg);

  // Window on left side
  const window = new Graphics();
  
  // Window frame
  window.rect(20, 60, 100, 120);
  window.fill(0x4a3a2a);
  
  // Window panes
  window.rect(26, 66, 42, 52);
  window.fill(0x87ceeb); // Sky blue
  window.rect(72, 66, 42, 52);
  window.fill(0x87ceeb);
  window.rect(26, 122, 42, 52);
  window.fill(0x6bb3d9);
  window.rect(72, 122, 42, 52);
  window.fill(0x6bb3d9);
  
  // Window cross frame
  window.rect(68, 66, 4, 108);
  window.fill(0x4a3a2a);
  window.rect(26, 118, 88, 4);
  window.fill(0x4a3a2a);
  
  // Curtains
  window.rect(10, 50, 15, 140);
  window.fill(0x8b0000); // Dark red curtain
  window.rect(115, 50, 15, 140);
  window.fill(0x8b0000);
  
  // Curtain rod
  window.rect(5, 45, 130, 6);
  window.fill(0x333333);
  
  room.addChild(window);

  // Add a subtle light beam from window
  const lightBeam = new Graphics();
  lightBeam.poly([120, 180, 280, 400, 80, 400]);
  lightBeam.fill({ color: 0xffffcc, alpha: 0.08 });
  room.addChild(lightBeam);

  // Bookshelf on the wall (between window and awards)
  const shelf = new Graphics();
  shelf.rect(200, 120, 80, 8);
  shelf.fill(0x5a4a3a);
  
  // Books on shelf
  const bookColors = [0x8b4513, 0x2e4a2e, 0x4a2e4a, 0x2e2e4a, 0x4a4a2e];
  let bookX = 203;
  bookColors.forEach((color, i) => {
    const bookWidth = 8 + (i % 3) * 2;
    const bookHeight = 20 + (i % 4) * 5;
    shelf.rect(bookX, 120 - bookHeight, bookWidth, bookHeight);
    shelf.fill(color);
    bookX += bookWidth + 2;
  });
  
  room.addChild(shelf);

  // Poster on wall (right side)
  const poster = new Graphics();
  poster.rect(720, 80, 60, 80);
  poster.fill(0x1a1a2e);
  poster.rect(724, 84, 52, 72);
  poster.fill(0x2a4a6a);
  
  // Simple geometric design on poster
  poster.circle(750, 115, 15);
  poster.fill(0xff6b6b);
  poster.poly([735, 145, 765, 145, 750, 125]);
  poster.fill(0x4ecdc4);
  
  room.addChild(poster);

  // Rug on floor
  const rug = new Graphics();
  rug.roundRect(350, 450, 150, 80, 5);
  rug.fill(0x6b3a5a);
  rug.roundRect(360, 458, 130, 64, 3);
  rug.fill(0x8a4a7a);
  // Rug pattern
  rug.rect(380, 475, 90, 3);
  rug.fill(0xdaa520);
  rug.rect(380, 490, 90, 3);
  rug.fill(0xdaa520);
  rug.rect(380, 505, 90, 3);
  rug.fill(0xdaa520);
  
  room.addChild(rug);
}

function createAwardsWall(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.label = 'awards';

  // Create 3 award frames on the wall
  const frameWidth = 50;
  const frameHeight = 60;
  const spacing = 70;

  for (let i = 0; i < 3; i++) {
    const frame = new Graphics();
    const fx = i * spacing;
    
    // Frame border
    frame.rect(fx, 0, frameWidth, frameHeight);
    frame.fill(COLORS.frame);
    
    // Inner frame
    frame.rect(fx + 4, 4, frameWidth - 8, frameHeight - 8);
    frame.fill(COLORS.frameDark);
    
    // "Certificate" inside
    frame.rect(fx + 8, 8, frameWidth - 16, frameHeight - 16);
    frame.fill(0xf5f5dc);
    
    // Gold star in center
    frame.star(fx + frameWidth/2, frameHeight/2, 5, 8, 4);
    frame.fill(COLORS.accent);
    
    container.addChild(frame);
  }

  // Trophy in the middle below frames
  const trophy = new Graphics();
  trophy.rect(85, 70, 30, 8);
  trophy.fill(COLORS.frame);
  trophy.rect(93, 50, 14, 20);
  trophy.fill(COLORS.frame);
  trophy.circle(100, 40, 15);
  trophy.fill(COLORS.accent);
  trophy.star(100, 40, 5, 8, 4);
  trophy.fill(COLORS.frame);
  container.addChild(trophy);

  return container;
}

function createStudyDesk(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.label = 'academics';

  const desk = new Graphics();
  
  // Desk surface
  desk.rect(0, 60, 150, 12);
  desk.fill(COLORS.desk);
  
  // Desk front
  desk.rect(0, 72, 150, 40);
  desk.fill(COLORS.deskDark);
  
  // Desk legs
  desk.rect(10, 112, 12, 50);
  desk.fill(COLORS.deskDark);
  desk.rect(128, 112, 12, 50);
  desk.fill(COLORS.deskDark);
  
  // Laptop base
  desk.rect(40, 45, 70, 15);
  desk.fill(COLORS.laptop);
  
  // Laptop screen
  desk.rect(45, 10, 60, 35);
  desk.fill(COLORS.laptop);
  desk.rect(48, 13, 54, 29);
  desk.fill(COLORS.laptopScreen);
  
  // Screen glow effect (text lines)
  desk.rect(52, 18, 40, 3);
  desk.fill(0x4a8aba);
  desk.rect(52, 24, 35, 3);
  desk.fill(0x4a8aba);
  desk.rect(52, 30, 45, 3);
  desk.fill(0x4a8aba);
  
  container.addChild(desk);
  
  return container;
}

function createNotebook(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.label = 'schedule';

  const notebook = new Graphics();
  
  // Notebook cover/pages
  notebook.roundRect(0, 0, 60, 45, 3);
  notebook.fill(COLORS.notebook);
  
  // Spiral binding
  for (let i = 0; i < 6; i++) {
    notebook.circle(-2, 5 + i * 7, 3);
    notebook.fill(0x333333);
  }
  
  // Lines on page
  for (let i = 0; i < 5; i++) {
    notebook.rect(8, 8 + i * 8, 44, 1);
    notebook.fill(COLORS.notebookLines);
  }
  
  // Red margin line
  notebook.rect(14, 5, 1, 35);
  notebook.fill(0xcc6666);
  
  // Pencil next to notebook
  notebook.rect(65, 10, 30, 5);
  notebook.fill(0xf4c542);
  notebook.rect(63, 10, 4, 5);
  notebook.fill(0x333333);
  notebook.poly([95, 10, 100, 12.5, 95, 15]);
  notebook.fill(0xeebb99);
  
  container.addChild(notebook);
  
  return container;
}

function createDevSetup(x: number, y: number): Container {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.label = 'projects';

  const setup = new Graphics();
  
  // Desk
  setup.rect(0, 120, 220, 15);
  setup.fill(COLORS.desk);
  setup.rect(0, 135, 220, 50);
  setup.fill(COLORS.deskDark);
  
  // Desk legs
  setup.rect(10, 185, 15, 60);
  setup.fill(COLORS.deskDark);
  setup.rect(195, 185, 15, 60);
  setup.fill(COLORS.deskDark);
  
  // Main monitor
  setup.rect(60, 20, 100, 80);
  setup.fill(0x222233);
  setup.rect(65, 25, 90, 65);
  setup.fill(COLORS.monitorScreen);
  
  // Monitor stand
  setup.rect(95, 100, 30, 8);
  setup.fill(0x222233);
  setup.rect(102, 108, 16, 12);
  setup.fill(0x222233);
  
  // Code on screen
  setup.rect(70, 32, 25, 3);
  setup.fill(0x61afef);
  setup.rect(70, 38, 40, 3);
  setup.fill(0x98c379);
  setup.rect(70, 44, 30, 3);
  setup.fill(0xe5c07b);
  setup.rect(70, 50, 50, 3);
  setup.fill(0xc678dd);
  setup.rect(70, 56, 35, 3);
  setup.fill(0x56b6c2);
  setup.rect(70, 62, 45, 3);
  setup.fill(0x61afef);
  setup.rect(70, 68, 20, 3);
  setup.fill(0xe06c75);
  setup.rect(70, 74, 55, 3);
  setup.fill(0x98c379);
  
  // Secondary monitor (left)
  setup.rect(0, 40, 50, 60);
  setup.fill(0x222233);
  setup.rect(4, 44, 42, 48);
  setup.fill(0x1a3a4a);
  
  // Terminal on secondary
  setup.rect(8, 50, 30, 3);
  setup.fill(0x4ade80);
  setup.rect(8, 56, 25, 3);
  setup.fill(0x4ade80);
  
  // Keyboard
  setup.roundRect(50, 108, 80, 12, 2);
  setup.fill(0x333344);
  
  // Mouse
  setup.roundRect(140, 108, 15, 10, 3);
  setup.fill(0x333344);
  
  // RGB strip under desk (for that gamer aesthetic)
  setup.rect(5, 133, 210, 2);
  setup.fill(0xff00ff);
  
  // Small plant on desk
  setup.roundRect(175, 95, 20, 20, 3);
  setup.fill(0x8b4513);
  setup.circle(185, 85, 12);
  setup.fill(0x228b22);
  setup.circle(180, 88, 8);
  setup.fill(0x32cd32);
  
  container.addChild(setup);
  
  return container;
}

function makeInteractive(container: Container, contentKey: string, app: Application) {
  container.eventMode = 'static';
  container.cursor = 'pointer';

  // Add glow filter for that "this is clickable" effect
  const glowFilter = new GlowFilter({
    distance: 15,
    outerStrength: 2,
    innerStrength: 0,
    color: 0xffff99,
    alpha: 0.8,
  });
  
  container.filters = [glowFilter];

  // Animate the glow - pulsing effect
  let time = Math.random() * Math.PI * 2; // Random offset so they don't all pulse together
  app.ticker.add(() => {
    time += 0.03;
    glowFilter.outerStrength = 1.5 + Math.sin(time) * 0.8;
  });

  // Hover effects - brighten glow and scale up slightly
  container.on('pointerover', () => {
    glowFilter.outerStrength = 4;
    glowFilter.color = 0xffffff;
    container.scale.set(1.03);
  });

  container.on('pointerout', () => {
    glowFilter.color = 0xffff99;
    container.scale.set(1);
  });

  // Click to show overlay
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

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.classList.remove('visible');
    }
  });
}

function addLabels(room: Container) {
  const labelStyle = new TextStyle({
    fontFamily: 'Press Start 2P',
    fontSize: 8,
    fill: 0xffffff,
    dropShadow: {
      color: 0x000000,
      blur: 2,
      distance: 1,
    },
  });

  // Labels for each interactive area
  const labels = [
    { text: 'AWARDS', x: 390, y: 170 },
    { text: 'ACADEMICS', x: 100, y: 445 },
    { text: 'SCHEDULE', x: 185, y: 435 },
    { text: 'PROJECTS', x: 590, y: 470 },
  ];

  labels.forEach(({ text, x, y }) => {
    const label = new Text({ text, style: labelStyle });
    label.anchor.set(0.5);
    label.x = x;
    label.y = y;
    label.alpha = 0.7;
    room.addChild(label);
  });
}

function addTitle(room: Container) {
  // Main title - name
  const titleStyle = new TextStyle({
    fontFamily: 'Press Start 2P',
    fontSize: 14,
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
  title.y = 15;
  room.addChild(title);

  // Subtitle
  const subtitleStyle = new TextStyle({
    fontFamily: 'VT323',
    fontSize: 18,
    fill: 0xcccccc,
  });

  const subtitle = new Text({ text: 'Welcome to my portfolio', style: subtitleStyle });
  subtitle.anchor.set(0.5, 0);
  subtitle.x = ROOM_WIDTH / 2;
  subtitle.y = 38;
  room.addChild(subtitle);
}

// Start the app
init().catch(console.error);
