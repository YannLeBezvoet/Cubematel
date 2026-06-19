// @ts-check
/**
 * @file scene/errors.js
 * @description Fatal error display for the cube scene.
 *
 * Replaces the PixiJS canvas with a plain HTML error message when an
 * unrecoverable rendering failure occurs. Guards against double-rendering
 * via the `hasFatalError` flag on sceneState.
 *
 * @dependencies dom.js (escapeHtml)
 *
 * @typedef {import('./world.js').SceneState} SceneState
 */

import { escapeHtml } from "../dom.js";

/**
 * Replaces the canvas container with a fatal error message.
 * Safe to call multiple times — only the first call takes effect.
 *
 * @param {SceneState} sceneState
 * @param {HTMLElement} cubeScene - Container element replacing the PixiJS canvas
 * @param {string} text - Human-readable error message
 */
export function showSceneError(sceneState, cubeScene, text) {
  if (sceneState.hasFatalError) {
    return;
  }
  sceneState.hasFatalError = true;
  cubeScene.innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
}
