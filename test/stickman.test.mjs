/**
 * @file stickman.test.mjs
 * @description Unit tests for stickman pixel-art renderer.
 *
 * Verifies that drawStickman and drawProp produce geometry that stays within
 * the declared bounding box:
 *   - Width:  24 display px  (cols -4 to +3 × P=3)
 *   - Height: 36 display px  (rows -8 to +3 × P=3, y=-24..+12)
 *
 * Uses a lightweight PIXI.Graphics mock — no browser required.
 */

import { test, expect } from "vitest";
import { drawStickman, drawProp } from "../public/js/renderers/stickman.js";

// ─── PIXI.Graphics mock ───────────────────────────────────────────────────────

/**
 * Records every drawRect call so tests can assert on geometry.
 *
 * @returns {{ rects: Array<{x,y,w,h}>, lineStyle: Function, beginFill: Function, endFill: Function, drawRect: Function }}
 */
function makeMockGfx() {
  const rects = [];
  return {
    rects,
    lineStyle() {},
    beginFill() {},
    endFill() {},
    drawRect(x, y, w, h) {
      rects.push({ x, y, w, h });
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the axis-aligned bounding box of all recorded rects.
 *
 * @param {Array<{x,y,w,h}>} rects
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number }}
 */
function bbox(rects) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const { x, y, w, h } of rects) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }
  return { minX, minY, maxX, maxY };
}

// ─── drawStickman tests ───────────────────────────────────────────────────────

test("drawStickman exports correctly", () => {
  expect(typeof drawStickman).toBe("function");
  expect(typeof drawProp).toBe("function");
});

test("drawStickman default pose fits within 24×36 px bounding box", () => {
  const gfx = makeMockGfx();
  drawStickman(gfx, "happy", "Whip");

  expect(gfx.rects.length).toBeGreaterThan(0);

  const { minX, minY, maxX, maxY } = bbox(gfx.rects);
  expect(minX).toBeGreaterThanOrEqual(-12);
  expect(maxX).toBeLessThanOrEqual(12);
  expect(minY).toBeGreaterThanOrEqual(-24);
  expect(maxY).toBeLessThanOrEqual(12);
});

test("drawStickman arms-wide pose (surpris) stays within bounding box", () => {
  const gfx = makeMockGfx();
  drawStickman(gfx, "surpris", "Dodger");

  const { minX, maxX, minY, maxY } = bbox(gfx.rects);
  expect(minX).toBeGreaterThanOrEqual(-12);
  expect(maxX).toBeLessThanOrEqual(12);
  expect(minY).toBeGreaterThanOrEqual(-24);
  expect(maxY).toBeLessThanOrEqual(12);
});

test("drawStickman joyeux pose arm cells reach above row -4 (y=-12)", () => {
  const gfxJoyeux = makeMockGfx();
  drawStickman(gfxJoyeux, "joyeux", "Whip");

  const gfxHappy = makeMockGfx();
  drawStickman(gfxHappy, "happy", "Whip");

  const armCellsJoyeux = gfxJoyeux.rects.filter((r) => r.x < -6 || r.x >= 6);
  const armCellsHappy  = gfxHappy.rects.filter((r) => r.x < -6 || r.x >= 6);

  const topJoyeux = bbox(armCellsJoyeux).minY;
  const topHappy  = bbox(armCellsHappy).minY;

  expect(topJoyeux).toBeLessThan(topHappy);
});

test("drawStickman head is symmetric around x=0", () => {
  const gfx = makeMockGfx();
  drawStickman(gfx, "happy", "Dodger");

  const headRects = gfx.rects.filter((r) => r.y <= -15);
  expect(headRects.length).toBeGreaterThan(0);

  const { minX, maxX } = bbox(headRects);
  expect(minX).toBe(-6);
  expect(maxX).toBe(6);
});

test("all emotion poses draw same number of body cells (head+neck+torso+legs)", () => {
  const emotions = ["happy", "surpris", "curieux", "joyeux", "désorienté"];
  const counts = emotions.map((e) => {
    const gfx = makeMockGfx();
    drawStickman(gfx, e, "Whip");
    return gfx.rects.length;
  });
  const unique = new Set(counts);
  expect(unique.size).toBe(1);
});

// ─── drawProp tests ───────────────────────────────────────────────────────────

test("drawProp Dodger draws a basketball (4 rects)", () => {
  const gfx = makeMockGfx();
  drawProp(gfx, "Dodger");
  expect(gfx.rects.length).toBe(4);
});

test("drawProp Whip draws a rope (5 rects)", () => {
  const gfx = makeMockGfx();
  drawProp(gfx, "Whip");
  expect(gfx.rects.length).toBe(5);
});
