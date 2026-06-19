// @ts-check
/**
 * @file src/game/index.js
 * @description Point d'entrée du module jeu. Ré-exporte les éléments publics de la couche métier.
 */

const { CubeWorldGame } = require("./cube-world-game");
const { CHARACTERS, CUBE_COLORS } = require("./constants");

module.exports = { CubeWorldGame, CHARACTERS, CUBE_COLORS };
