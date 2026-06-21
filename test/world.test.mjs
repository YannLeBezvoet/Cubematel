/**
 * @file test/world.test.mjs
 * @description Unit tests for pure helpers in scene/world.js.
 *
 * Only imports pure, side-effect-free functions — no PixiJS or DOM required.
 */

import { test, expect } from "vitest";
import { findCubesWithNeighborBelow } from "../public/js/scene/world.js";

// ─── findCubesWithNeighborBelow ───────────────────────────────────────────────

test("returns empty set when no cubes are stacked", () => {
  const cubes = [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 1, y: 0 },
    { id: "c", x: 0, y: 2 },
  ];
  expect(findCubesWithNeighborBelow(cubes).size).toBe(0);
});

test("detects cube directly below (y+1)", () => {
  const cubes = [
    { id: "top", x: 0, y: 0 },
    { id: "bot", x: 0, y: 1 },
  ];
  const result = findCubesWithNeighborBelow(cubes);
  expect(result.has("top")).toBe(true);
  expect(result.has("bot")).toBe(false);
});

test("only counts direct vertical neighbour, not diagonal or horizontal", () => {
  // "center" has a horizontal neighbour (right) and a diagonal one (diag),
  // but nothing at (0, 1) — so it should NOT be flagged.
  const cubes = [
    { id: "center", x: 0, y: 0 },
    { id: "right",  x: 1, y: 0 },
    { id: "diag",   x: 1, y: 1 },
  ];
  const result = findCubesWithNeighborBelow(cubes);
  expect(result.has("center")).toBe(false);
  // "right" has "diag" directly below (1,1) — it IS flagged
  expect(result.has("right")).toBe(true);
});

test("handles a chain of three stacked cubes correctly", () => {
  const cubes = [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 0, y: 1 },
    { id: "c", x: 0, y: 2 },
  ];
  const result = findCubesWithNeighborBelow(cubes);
  expect(result.has("a")).toBe(true);
  expect(result.has("b")).toBe(true);
  expect(result.has("c")).toBe(false);
});

test("returns empty set for a single cube", () => {
  const cubes = [{ id: "solo", x: 5, y: -3 }];
  expect(findCubesWithNeighborBelow(cubes).size).toBe(0);
});

test("returns empty set for an empty list", () => {
  expect(findCubesWithNeighborBelow([]).size).toBe(0);
});
