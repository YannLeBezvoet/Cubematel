/**
 * @file test/game.test.mjs
 * @description Unit tests for CubeWorldGame — server-side game logic.
 *
 * Covers: movements, connections, colour assignment, and face constraints.
 */

import { test, expect } from "vitest";
import { CubeWorldGame, CUBE_COLORS } from "../src/game.js";

test("un cube réagit aux mouvements", () => {
  const game = new CubeWorldGame();
  game.createCube("a", "Alice", "Dodger");

  game.moveCube("a", "shake");
  let cube = game.getState().cubes[0];
  expect(cube.emotion).toBe("surpris");

  game.moveCube("a", "flip");
  cube = game.getState().cubes[0];
  expect(cube.orientation).toBe("upside_down");
});

test("deux cubes connectés peuvent interagir", () => {
  const game = new CubeWorldGame();
  game.createCube("a", "Alice", "Dodger");
  game.createCube("b", "Bob", "Whip");

  game.connectCubes("a", "b", "horizontal");
  const state = game.getState();
  const cubeA = state.cubes.find((cube) => cube.id === "a");
  const cubeB = state.cubes.find((cube) => cube.id === "b");

  expect(cubeA.connectedTo).toEqual(["b"]);
  expect(cubeB.y).toBe(cubeA.y);
  expect(Math.abs(cubeB.x - cubeA.x)).toBe(1);
  expect(state.history.some((entry) => entry.text.includes("discutent ensemble"))).toBe(true);
});

test("chaque cube reçoit une couleur aléatoire différente", () => {
  const game = new CubeWorldGame();
  game.createCube("a", "Alice", "Dodger");
  game.createCube("b", "Bob", "Whip");

  const state = game.getState();
  const cubeA = state.cubes.find((cube) => cube.id === "a");
  const cubeB = state.cubes.find((cube) => cube.id === "b");

  expect(typeof cubeA.color).toBe("number");
  expect(typeof cubeB.color).toBe("number");
  expect(cubeA.color).not.toBe(cubeB.color);
  expect(CUBE_COLORS.includes(cubeA.color)).toBe(true);
  expect(CUBE_COLORS.includes(cubeB.color)).toBe(true);
});

test("une connexion verticale place le cube au dessus ou en dessous", () => {
  const game = new CubeWorldGame();
  game.createCube("a", "Alice", "Dodger");
  game.createCube("b", "Bob", "Whip");

  game.connectCubes("a", "b", "vertical");
  const state = game.getState();
  const cubeA = state.cubes.find((cube) => cube.id === "a");
  const cubeB = state.cubes.find((cube) => cube.id === "b");

  expect(cubeB.x).toBe(cubeA.x);
  expect(Math.abs(cubeB.y - cubeA.y)).toBe(1);
});

test("une connexion verticale réaligne aussi des cubes sans coordonnées", () => {
  const game = new CubeWorldGame();
  game.createCube("a", "Alice", "Dodger");
  game.createCube("b", "Bob", "Whip");
  const cubeA = game.cubes.get("a");
  const cubeB = game.cubes.get("b");
  delete cubeA.x;
  delete cubeA.y;
  delete cubeB.x;
  delete cubeB.y;

  game.connectCubes("a", "b", "vertical");
  const state = game.getState();
  const alignedA = state.cubes.find((cube) => cube.id === "a");
  const alignedB = state.cubes.find((cube) => cube.id === "b");

  expect(alignedB.x).toBe(alignedA.x);
  expect(Math.abs(alignedB.y - alignedA.y)).toBe(1);
});

test("chaque face d'un cube n'accepte qu'un seul voisin", () => {
  const game = new CubeWorldGame();
  game.createCube("a", "Alice", "Dodger");
  game.createCube("b", "Bob", "Whip");
  game.createCube("c", "Chloé", "Dodger");
  game.createCube("d", "David", "Whip");

  game.connectCubes("a", "b", "horizontal");
  game.connectCubes("a", "c", "horizontal");
  game.connectCubes("a", "d", "horizontal");

  const state = game.getState();
  const cubeA = state.cubes.find((cube) => cube.id === "a");
  const cubeD = state.cubes.find((cube) => cube.id === "d");

  expect(cubeA.connectedTo.length).toBe(2);
  expect(cubeA.connectedTo.includes("d")).toBe(false);
  expect(Math.abs(cubeD.x - cubeA.x) + Math.abs(cubeD.y - cubeA.y)).not.toBe(1);
});
