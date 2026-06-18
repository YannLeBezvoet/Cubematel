/**
 * @file scene/animation.js
 * @description Per-frame animation loop for the cube scene.
 *
 * Handles the bobbing offset of unconnected cubes and delegates background
 * particle updates to background.js. Position lerp and flip rotation are
 * managed by GSAP tweens triggered from scene/world.js.
 *
 * Called every tick by the PixiJS ticker set up in scene/setup.js.
 *
 * @dependencies scene/background.js
 */

import { updateBackground } from "./background.js";

/**
 * Per-frame update: advances background particles and applies bobbing offset
 * to each cube node's container position.
 *
 * @param {import("./world.js").SceneState} sceneState
 * @param {number} delta - PixiJS ticker delta (frames elapsed since last tick)
 */
export function animate(sceneState, delta) {
  updateBackground(sceneState, delta);

  sceneState.cubeNodes.forEach((node) => {
    node.phase += 0.05 * delta;
    const bob = hasConnections(node.cube)
      ? 0
      : Math.sin(node.phase) * getBobIntensity(node.cube?.emotion);
    node.container.position.set(node.x, node.y + bob);
  });
}

/**
 * Returns the vertical bobbing amplitude in pixels for a given emotion.
 *
 * @param {string | undefined} emotion
 * @returns {number}
 */
function getBobIntensity(emotion) {
  if (emotion === "joyeux") return 4.5;
  if (emotion === "surpris") return 3.3;
  return 2.1;
}

/**
 * Returns true if the cube has at least one active connection.
 *
 * @param {{ connectedTo?: string[] } | null | undefined} cube
 * @returns {boolean}
 */
function hasConnections(cube) {
  return Array.isArray(cube?.connectedTo) && cube.connectedTo.length > 0;
}
