const test = require("node:test");
const assert = require("node:assert/strict");
const { CubeWorldGame } = require("../src/game");

test("un cube réagit aux mouvements", () => {
  const game = new CubeWorldGame();
  game.createCube("a", "Alice", "Dodger");

  game.moveCube("a", "shake");
  let cube = game.getState().cubes[0];
  assert.equal(cube.emotion, "surpris");

  game.moveCube("a", "flip");
  cube = game.getState().cubes[0];
  assert.equal(cube.orientation, "upside_down");
});

test("deux cubes connectés peuvent interagir", () => {
  const game = new CubeWorldGame();
  game.createCube("a", "Alice", "Dodger");
  game.createCube("b", "Bob", "Whip");

  game.connectCubes("a", "b", "horizontal");
  const state = game.getState();
  const cubeA = state.cubes.find((cube) => cube.id === "a");
  const cubeB = state.cubes.find((cube) => cube.id === "b");

  assert.deepEqual(cubeA.connectedTo, ["b"]);
  assert.equal(cubeB.y, cubeA.y);
  assert.equal(Math.abs(cubeB.x - cubeA.x), 1);
  assert.ok(state.history.some((entry) => entry.text.includes("discutent ensemble")));
});

test("une connexion verticale place le cube au dessus ou en dessous", () => {
  const game = new CubeWorldGame();
  game.createCube("a", "Alice", "Dodger");
  game.createCube("b", "Bob", "Whip");

  game.connectCubes("a", "b", "vertical");
  const state = game.getState();
  const cubeA = state.cubes.find((cube) => cube.id === "a");
  const cubeB = state.cubes.find((cube) => cube.id === "b");

  assert.equal(cubeB.x, cubeA.x);
  assert.equal(Math.abs(cubeB.y - cubeA.y), 1);
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

  assert.equal(alignedB.x, alignedA.x);
  assert.equal(Math.abs(alignedB.y - alignedA.y), 1);
});
