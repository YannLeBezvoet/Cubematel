// @ts-check
/**
 * @file src/game/movements.js
 * @description Translates a UI movement into a business reaction.
 *
 * Responsibilities:
 *   - Map movement identifiers ("shake", "flip", "tilt", "play")
 *     to business fields (emotion, activity, orientation).
 *
 * @dependencies None (standalone module)
 */

/**
 * @typedef {import('../../types/cube.js').Cube} Cube
 */

/**
 * @typedef {{ emotion: string, activity: string, orientation?: string }} MovementAction
 */

/**
 * Translates a UI movement into a minimal business reaction.
 *
 * @param {string} movement - "shake" | "flip" | "tilt" | "play"
 * @param {Cube} cube - Current state of the cube performing the movement
 * @returns {MovementAction | null} Action to apply, or null if the movement is unknown
 */
function getMovementAction(movement, cube) {
  /** @type {Record<string, MovementAction>} */
  const actions = {
    shake: {
      emotion: "surprised",
      activity: "laughs while being shaken",
    },
    flip: {
      emotion: "disoriented",
      activity: "cries then regains balance",
      orientation: cube.orientation === "upright" ? "upside_down" : "upright",
    },
    tilt: {
      emotion: "curious",
      activity: "looks around",
    },
    play: {
      emotion: "joyful",
      activity:
        cube.character === "Dodger" ? "dribbles and shoots" : "twirls the lasso",
    },
  };

  return actions[movement] || null;
}

module.exports = { getMovementAction };
