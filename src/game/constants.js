// @ts-check
/**
 * @file src/game/constants.js
 * @description Constantes partagées du jeu Cubematel.
 *
 * CHARACTERS : personnages disponibles pour les cubes.
 * CUBE_COLORS : palette de couleurs 0xRRGGBB assignées aux cubes.
 */

/** @type {string[]} */
const CHARACTERS = ["Dodger", "Whip"];
/** @type {number[]} */
const CUBE_COLORS = [
  0xff6b6b,
  0x4ecdc4,
  0xffd166,
  0x7b61ff,
  0x5fa8ff,
  0x95d46b,
  0xff9f68,
  0xf26ca7,
  0x6ee7b7,
  0xfacc15,
  0x38bdf8,
  0xc084fc,
];

module.exports = { CHARACTERS, CUBE_COLORS };
