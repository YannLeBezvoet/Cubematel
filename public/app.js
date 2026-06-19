// @ts-check
/**
 * @file public/app.js
 * @description Point d'entrée du client Cubematel.
 *
 * Responsabilités :
 *   - Créer la connexion Socket.IO.
 *   - Initialiser la scène PixiJS via createScene.
 *   - Brancher les événements serveur sur la scène et l'interface DOM.
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

socket.on("world:update", (/** @type {any} */ state) => {
  scene.handleWorldUpdate(state);
  // Rafraîchit les boutons de direction si une cible est déjà sélectionnée.
  const targetId = dom.targetInput.value.trim();
  if (targetId) {
    updateDirectionButtons(dom.directionButtons, state.cubes, targetId);
  }
});

scene.setup();
