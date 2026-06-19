// @ts-check
/**
 * @file src/game/colors.js
 * @description Sélection aléatoire de couleur pour les cubes.
 *
 * Réutilise d'abord la palette prédéfinie avant de générer une couleur de secours
 * afin que chaque cube ait une apparence distincte tant que la palette le permet.
 *
 * @dependencies src/game/constants.js
 */

const { CUBE_COLORS } = require("./constants");

/**
 * @typedef {import('../../types/cube.js').Cube} Cube
 */

/**
 * Choisit une couleur 0xRRGGBB disponible pour un nouveau cube.
 * Préfère les couleurs de la palette prédéfinie non encore utilisées ;
 * génère une couleur aléatoire distincte si la palette est épuisée.
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
