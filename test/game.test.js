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

  assert.deepEqual(cubeA.connectedTo, ["b"]);
  assert.ok(state.history.some((entry) => entry.text.includes("discutent ensemble")));
});
