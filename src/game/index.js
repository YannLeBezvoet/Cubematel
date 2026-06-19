// @ts-check
/**
 * @file src/game/index.js
 * @description Game module entry point. Re-exports the public elements of the business layer.
 */

const { CubeWorldGame } = require("./cube-world-game");
const { CHARACTERS, CUBE_COLORS } = require("./constants");

module.exports = { CubeWorldGame, CHARACTERS, CUBE_COLORS };
