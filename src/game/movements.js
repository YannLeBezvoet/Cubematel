// @ts-check
/**
 * @file src/game/movements.js
 * @description Traduction d'un mouvement UI en réaction métier.
 *
 * Responsabilités :
 *   - Mapper les identifiants de mouvement ("shake", "flip", "tilt", "play")
 *     vers les champs métier (emotion, activity, orientation).
 *
 * @dependencies Aucune (module autonome)
 */

/**
 * @typedef {import('../../types/cube.js').Cube} Cube
 */

/**
 * @typedef {{ emotion: string, activity: string, orientation?: string }} MovementAction
 */

/**
 * Traduit un mouvement UI en réaction métier minimale.
 *
 * @param {string} movement - "shake" | "flip" | "tilt" | "play"
 * @param {Cube} cube - État courant du cube effectuant le mouvement
 * @returns {MovementAction | null} Action à appliquer, ou null si mouvement inconnu
 */
function getMovementAction(movement, cube) {
  /** @type {Record<string, MovementAction>} */
  const actions = {
    shake: {
      emotion: "surpris",
      activity: "rit en étant secoué",
    },
    flip: {
      emotion: "désorienté",
      activity: "pleure puis retrouve son équilibre",
      orientation: cube.orientation === "upright" ? "upside_down" : "upright",
    },
    tilt: {
      emotion: "curieux",
      activity: "regarde autour de lui",
    },
    play: {
      emotion: "joyeux",
      activity:
        cube.character === "Dodger" ? "dribble et tire" : "fait du lasso avec sa corde",
    },
  };

  return actions[movement] || null;
}

module.exports = { getMovementAction };
