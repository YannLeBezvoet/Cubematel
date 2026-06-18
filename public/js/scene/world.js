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
import { renderHistory, updateCounters } from "../dom.js";

/**
 * @typedef {import('../renderers/cube-node.js').Cube} Cube
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
 * @property {string | null} myCubeId
 * @property {number} cameraX
 * @property {number} cameraY
 * @property {boolean} ready
 * @property {object | null} latestWorld
 * @property {object | null} dragState
 * @property {ResizeObserver | null} resizeObserver
 */

/**
 * Synchronises server state with the live Pixi scene.
 * Creates/removes cube nodes, updates positions via GSAP, triggers flip
 * animations and redraws on state change.
 *
 * @param {SceneState} sceneState
 * @param {{ cubes: Cube[], history: object[] }} state
 * @param {{ targetInput: HTMLInputElement, cubeCount: HTMLElement, linkCount: HTMLElement, historyList: HTMLElement }} refs
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
  syncCubes(sceneState, cubes, refs.targetInput);
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
 *
 * @param {SceneState} sceneState
 * @param {Cube[]} cubes
 * @param {HTMLInputElement} targetInput
 */
function syncCubes(sceneState, cubes, targetInput) {
  const existingIds = new Set(sceneState.cubeNodes.keys());

  cubes.forEach((cube) => {
    if (!sceneState.cubeNodes.has(cube.id)) {
      const node = createCubeNode(cube.id, targetInput);
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
  const myCube = cubes.find((cube) => cube.id === sceneState.myCubeId);
  const originX = Number.isFinite(myCube?.x) ? myCube?.x ?? 0 : 0;
  const originY = Number.isFinite(myCube?.y) ? myCube?.y ?? 0 : 0;

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
