/** The room is drawn in a fixed 800x600 coordinate space and scaled to fit the window. */
export const ROOM_WIDTH = 800;
export const ROOM_HEIGHT = 600;

export type Fit = { scale: number; width: number; height: number };

/** Largest whole-pixel size with the room's aspect ratio that fits inside the viewport. */
export function fitRoom(viewportWidth: number, viewportHeight: number, roomWidth = ROOM_WIDTH, roomHeight = ROOM_HEIGHT): Fit {
  const w = Math.max(0, viewportWidth);
  const h = Math.max(0, viewportHeight);
  const scale = Math.min(w / roomWidth, h / roomHeight);
  if (!Number.isFinite(scale) || scale <= 0) return { scale: 0, width: 0, height: 0 };
  return { scale, width: Math.floor(roomWidth * scale), height: Math.floor(roomHeight * scale) };
}

/** Device pixel ratio for the renderer, capped so 3x phones don't render 9x the pixels for no visible gain. */
export function renderResolution(devicePixelRatio: number | undefined, max = 2): number {
  const dpr = devicePixelRatio && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return Math.min(dpr, max);
}

export type Rect = { x: number; y: number; width: number; height: number };

/** Map a rectangle in room coordinates to page coordinates, given the canvas's on-page box. */
export function roomRectToPage(rect: Rect, canvas: { left: number; top: number }, scale: number): Rect {
  return {
    x: canvas.left + rect.x * scale,
    y: canvas.top + rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}
