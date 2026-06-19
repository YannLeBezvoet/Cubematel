// @ts-check
/**
 * @file scene/world.js
 * @description Synchronises the server snapshot with the live PixiJS scene.
 *
 * On each `world:update` event, creates or removes cube nodes, positions them
 * in the viewport relative to the local player's cube, and triggers redraws or
 * flip animations when orientation changes.
 *
 * Position transitions use GSAP tweens (gsap.to on node.x / node.y).
 * Flip animations use a GSAP tween on node.body.rotation with ease "sine.inOut".
 *
 * @dependencies renderers/cube-node.js, dom.js, GSAP (window.gsap)
 */

import { createCubeNode, drawCube } from "../renderers/cube-node.js";
import { renderHistory, updateCounters, updateDirectionButtons } from "../dom.js";

/**
 * @typedef {import('../renderers/cube-node.js').Cube} Cube
 * @typedef {import('../../../types/cube.js').HistoryEntry} HistoryEntry
 * @typedef {import('../../../types/cube.js').GameState} GameState
 */

/**
 * @typedef {Object} DragState
 * @property {boolean} active
 * @property {number | null} pointerId
 * @property {number} startX
 * @property {number} startY
 * @property {number} startCameraX
 * @property {number} startCameraY
 * @property {boolean} dragged
 */

/**
 * @typedef {Object} SceneState
 * @property {any} app
 * @property {any} backgroundLayer
 * @property {any} linksLayer
 * @property {any} cubeLayer
 * @property {any} linkGraphics
 * @property {any} panOverlay
 * @property {Map<string, import('../renderers/cube-node.js').CubeNode>} cubeNodes
 * @property {string[][]} links
 * @property {Array<{sprite: any, speed: number, drift: number}>} stars
 * @property {Array<{sprite: any, velocityX: number, velocityY: number, phase: number}>} floaters
 * @property {string} myCubeId
 * @property {number} cameraX
 * @property {number} cameraY
 * @property {boolean} ready
 * @property {GameState} latestWorld
 * @property {number} originX - World X coordinate fixed on first view; does not follow player movements
 * @property {number} originY - World Y coordinate fixed on first view; does not follow player movements
 * @property {DragState | null} dragState
 * @property {ResizeObserver | null} resizeObserver
 * @property {boolean} hasFatalError
 */

/**
 * Synchronises server state with the live Pixi scene.
 * Creates/removes cube nodes, updates positions via GSAP, triggers flip
 * animations and redraws on state change.
 *
 * @param {SceneState} sceneState
 * @param {GameState} state
 * @param {{ targetInput: HTMLInputElement, directionButtons?: HTMLButtonElement[], cubeCount: HTMLElement, linkCount: HTMLElement, historyList: HTMLElement }} refs
 */
export function renderWorld(sceneState, state, refs) {
  sceneState.latestWorld = state;
  const cubes = state.cubes.slice().sort((a, b) => {
    if (a.id === sceneState.myCubeId) return -1;
    if (b.id === sceneState.myCubeId) return 1;
    return a.playerName.localeCompare(b.playerName, "fr");
  });

  const uniqueLinks = collectUniqueLinks(cubes);
  sceneState.links = [...uniqueLinks].map((entry) => entry.split("::"));

  updateCounters({
    cubeCount: refs.cubeCount,
    linkCount: refs.linkCount,
    cubeTotal: cubes.length,
    linkTotal: uniqueLinks.size,
  });
  renderHistory(refs.historyList, state.history || []);
  syncCubes(sceneState, cubes, refs);
  layoutCubes(sceneState, cubes);

  cubes.forEach((cube) => {
    const node = sceneState.cubeNodes.get(cube.id);
    if (!node) return;

    const prevOrientation = node.cube?.orientation;
    const orientationChanged = prevOrientation !== undefined && prevOrientation !== cube.orientation;

    if (orientationChanged && !node.flipping) {
      startFlipAnimation(node, cube);
    } else if (node.flipping) {
      node._pendingCube = cube;
    } else {
      drawCube(node, cube);
    }

    node.cube = cube;
  });
}

/**
 * Triggers a GSAP flip animation on node.body.rotation (0 → π → 0).
 * Redraws the cube with pending state at the end.
 *
 * @param {import('../renderers/cube-node.js').CubeNode} node
 * @param {Cube} cube - The incoming cube state to apply after the flip
 */
function startFlipAnimation(node, cube) {
  node.flipping = true;
  node._pendingCube = cube;
  if (node.cube) {
    drawCube(node, node.cube);
  }

  window.gsap.to(node.body, {
    rotation: Math.PI,
    duration: 1.5,
    ease: "sine.inOut",
    onComplete: () => {
      if (node._pendingCube) {
        drawCube(node, node._pendingCube);
      }
      node.body.rotation = 0;
      node.flipping = false;
      node._pendingCube = null;
    },
  });
}

/**
 * Deduplicates links to avoid counting the same connection twice.
 *
 * @param {Cube[]} cubes
 * @returns {Set<string>}
 */
function collectUniqueLinks(cubes) {
  return new Set(
    cubes.flatMap((cube) => (cube.connectedTo || []).map((target) => [cube.id, target].sort().join("::")))
  );
}

/**
 * Creates missing cube nodes and removes nodes for cubes no longer in the state.
 * The onSelect callback fills the target input and refreshes direction buttons.
 *
 * @param {SceneState} sceneState
 * @param {Cube[]} cubes
 * @param {{ targetInput: HTMLInputElement, directionButtons?: HTMLButtonElement[] }} refs
 */
function syncCubes(sceneState, cubes, refs) {
  const existingIds = new Set(sceneState.cubeNodes.keys());

  cubes.forEach((cube) => {
    if (!sceneState.cubeNodes.has(cube.id)) {
      const onSelect = (/** @type {string} */ id) => {
        refs.targetInput.value = id;
        refs.targetInput.focus();
        updateDirectionButtons(refs.directionButtons, sceneState.latestWorld?.cubes ?? [], id);
      };
      const node = createCubeNode(cube.id, onSelect);
      sceneState.cubeNodes.set(cube.id, node);
      sceneState.cubeLayer.addChild(node.container);
    }
    existingIds.delete(cube.id);
  });

  existingIds.forEach((id) => {
    const node = sceneState.cubeNodes.get(id);
    if (!node) return;
    sceneState.cubeLayer.removeChild(node.container);
    sceneState.cubeNodes.delete(id);
  });
}

/**
 * Computes each cube's target screen position relative to the local player's
 * cube and triggers a GSAP tween on node.x / node.y.
 *
 * @param {SceneState} sceneState
 * @param {Cube[]} cubes
 */
function layoutCubes(sceneState, cubes) {
  const width = sceneState.app.screen.width;
  const height = sceneState.app.screen.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const gapX = 80;
  const gapY = 80;

  // The origin is fixed once from the player's initial position.
  // It does not follow movement — only manual pan moves the camera.
  if (!Number.isFinite(sceneState.originX)) {
    const myCube = cubes.find((cube) => cube.id === sceneState.myCubeId);
    if (myCube && Number.isFinite(myCube.x)) {
      sceneState.originX = myCube.x;
      sceneState.originY = myCube.y;
    }
  }

  const originX = Number.isFinite(sceneState.originX) ? sceneState.originX : 0;
  const originY = Number.isFinite(sceneState.originY) ? sceneState.originY : 0;

  cubes.forEach((cube, index) => {
    const node = sceneState.cubeNodes.get(cube.id);
    if (!node) return;

    const x = Number.isFinite(cube.x) ? cube.x : index;
    const y = Number.isFinite(cube.y) ? cube.y : 0;
    node.targetX = centerX + (x - originX) * gapX;
    node.targetY = centerY + (y - originY) * gapY;

    window.gsap.to(node, {
      x: node.targetX,
      y: node.targetY,
      duration: 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });
  });
}
