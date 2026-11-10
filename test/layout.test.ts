import { describe, expect, it } from 'vitest';
import { fitRoom, renderResolution, roomRectToPage, ROOM_HEIGHT, ROOM_WIDTH } from '../src/layout.ts';

describe('fitRoom', () => {
  it('fills the limiting dimension and keeps the 4:3 aspect ratio', () => {
    expect(fitRoom(1600, 1200)).toEqual({ scale: 2, width: 1600, height: 1200 });
    const wide = fitRoom(1280, 800);
    expect(wide.height).toBe(800);
    expect(wide.width).toBe(Math.floor(ROOM_WIDTH * (800 / ROOM_HEIGHT)));
    const tall = fitRoom(390, 844);
    expect(tall.width).toBe(390);
    expect(tall.height).toBe(Math.floor(ROOM_HEIGHT * (390 / ROOM_WIDTH)));
  });

  it('never exceeds the viewport', () => {
    for (const [w, h] of [[844, 390], [667, 375], [1366, 768], [3840, 2160], [801, 601]]) {
      const fit = fitRoom(w!, h!);
      expect(fit.width).toBeLessThanOrEqual(w!);
      expect(fit.height).toBeLessThanOrEqual(h!);
    }
  });

  it('returns a zero fit for an empty or hidden container', () => {
    expect(fitRoom(0, 600)).toEqual({ scale: 0, width: 0, height: 0 });
    expect(fitRoom(-5, -5)).toEqual({ scale: 0, width: 0, height: 0 });
  });
});

describe('renderResolution', () => {
  it('uses the device pixel ratio, capped at 2', () => {
    expect(renderResolution(1)).toBe(1);
    expect(renderResolution(1.5)).toBe(1.5);
    expect(renderResolution(3)).toBe(2);
    expect(renderResolution(undefined)).toBe(1);
    expect(renderResolution(0)).toBe(1);
  });
});

describe('roomRectToPage', () => {
  it('scales and offsets a room rectangle onto the page', () => {
    expect(roomRectToPage({ x: 340, y: 80, width: 155, height: 55 }, { left: 107, top: 0 }, 2)).toEqual({
      x: 787,
      y: 160,
      width: 310,
      height: 110,
    });
  });
});
