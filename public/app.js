// @ts-check
/**
 * @file public/app.js
 * @description Entry point for the Cubematel client.
 *
 * Responsibilities:
 *   - Create the Socket.IO connection.
 *   - Initialise the PixiJS scene via createScene.
 *   - Wire server events to the scene and DOM interface.
 *
 * @dependencies js/dom.js, js/scene/index.js, Socket.IO client (global io)
 */

import { bindControls, getDomRefs, setSelfBadge, updateDirectionButtons } from "./js/dom.js";
import { createScene } from "./js/scene/index.js";

const socket = io();
const dom = getDomRefs();
const scene = createScene(dom);

bindControls({ socket, targetInput: dom.targetInput, directionButtons: dom.directionButtons });

socket.on("connect", () => {
  scene.setMyCubeId(socket.id);
  setSelfBadge(dom.selfBadge, socket.id);
});

socket.on("world:update", (/** @type {import('../types/cube.js').GameState} */ state) => {
  scene.handleWorldUpdate(state);
  // Refreshes direction buttons if a target is already selected.
  const targetId = dom.targetInput.value.trim();
  if (targetId) {
    updateDirectionButtons(dom.directionButtons, state.cubes, targetId);
  }
});

scene.setup();
