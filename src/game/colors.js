// @ts-check
/**
 * @file src/game/colors.js
 * @description Random colour selection for cubes.
 *
 * Uses the predefined palette first before generating a fallback colour
 * so each cube has a distinct appearance for as long as the palette allows.
 *
 * @dependencies src/game/constants.js
 */

const { CUBE_COLORS } = require("./constants");

/**
 * @typedef {import('../../types/cube.js').Cube} Cube
 */

/**
 * Picks an available 0xRRGGBB colour for a new cube.
 * Prefers unused colours from the predefined palette;
 * generates a distinct random colour if the palette is exhausted.
 *
 * @param {Map<string, Cube>} cubes - État courant des cubes du monde
 * @returns {number} Couleur au format 0xRRGGBB
 */
function pickRandomAvailableColor(cubes) {
  const usedColors = new Set([...cubes.values()].map((cube) => cube.color).filter(Number.isInteger));
  const availableColors = CUBE_COLORS.filter((color) => !usedColors.has(color));
  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  let color;
  do {
    const red = 96 + Math.floor(Math.random() * 160);
    const green = 96 + Math.floor(Math.random() * 160);
    const blue = 96 + Math.floor(Math.random() * 160);
    color = (red << 16) | (green << 8) | blue;
  } while (usedColors.has(color));

  return color;
}

module.exports = { pickRandomAvailableColor };
