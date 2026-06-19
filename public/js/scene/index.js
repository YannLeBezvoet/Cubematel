// @ts-check
/**
 * @file scene/index.js
 * @description Entry point for the 2D cube scene.
 *
 * Exposes `createScene`, the factory that wires together setup, rendering and
 * world-update handling. Consumers only need this module — the sub-modules
 * (setup, animation, pan, world, errors, background) are internal to the scene.
 *
 * @dependencies scene/setup.js, scene/world.js, scene/errors.js
 *
 * @typedef {import('./world.js').SceneState} SceneState
 * @typedef {import('./world.js').GameState} GameState
 */

import { showSceneError } from "./errors.js";
import { setupScene } from "./setup.js";
import { renderWorld } from "./world.js";

/**
 * Factory that creates and returns the public scene API.
 * The returned object is the only interface consumers need.
 *
 * @param {{ cubeScene: HTMLElement, targetInput: HTMLInputElement, directionButtons: HTMLButtonElement[], cubeCount: HTMLElement, linkCount: HTMLElement, historyList: HTMLElement }} refs
 * @returns {{ setMyCubeId: (id: string) => void, handleWorldUpdate: (state: GameState) => void, setup: () => void }}
 */
export function createScene({
  cubeScene,
  targetInput,
  directionButtons,
  cubeCount,
  linkCount,
  historyList,
}) {
  const sceneState = {
    app: null,
    backgroundLayer: null,
    linksLayer: null,
    cubeLayer: null,
    linkGraphics: null,
    panOverlay: null,
    cubeNodes: new Map(),
    links: [],
    stars: [],
    floaters: [],
    latestWorld: /** @type {GameState} */ ({ cubes: [], history: [] }),
    originX: NaN,
    originY: NaN,
    ready: false,
    resizeObserver: null,
    hasFatalError: false,
    myCubeId: "",
    cameraX: 0,
    cameraY: 0,
    dragState: null,
  };

  return {
    // Mémorise l'identité locale pour prioriser son cube à l'écran.
    setMyCubeId(cubeId) {
      sceneState.myCubeId = cubeId;
    },
    // Applique le snapshot serveur quand la scène est prête.
    handleWorldUpdate(state) {
      if (!state || !Array.isArray(state.cubes)) {
        return;
      }
      if (!sceneState.ready) {
        sceneState.latestWorld = state;
        return;
      }
      try {
        renderWorld(sceneState, state, { targetInput, directionButtons, cubeCount, linkCount, historyList });
      } catch (error) {
        console.error("Erreur lors de world:update", error);
        showSceneError(sceneState, cubeScene, "Erreur lors de la mise a jour de la scène.");
      }
    },
    // Initialise Pixi et les calques visuels une seule fois.
    setup() {
      setupScene(sceneState, {
        cubeScene,
        targetInput,
        cubeCount,
        linkCount,
        historyList,
      });
    },
  };
}
