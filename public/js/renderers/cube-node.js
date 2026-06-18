// @ts-check
/**
 * @file renderers/cube-node.js
 * @description PIXI.js node factory and renderer for a single cube in the scene.
 *
 * Each "cube node" is a lightweight PIXI Container holding several Graphics layers:
 *   - plate      : drop-shadow behind the entire device
 *   - halo       : coloured glow ring around the device
 *   - cubeShape  : the device body — coloured frame + dark LCD screen area
 *   - figure     : pixel-art stickman character (drawn by renderers/stickman.js)
 *   - prop       : character's icon at the bottom of the LCD screen
 *   - label      : player name below the device
 *   - mood       : character + emotion line below the label
 *
 * The `figure` layer is Y-flipped when the cube orientation is "upside_down".
 * Position transitions are driven by GSAP via scene/world.js (not this module).
 *
 * @dependencies PIXI.js v7 (via window.PIXI), renderers/stickman.js
 */

/**
 * @typedef {import('../../../types/cube.js').Cube} Cube
 */

/**
 * @typedef {Object} CubeNode
 * @property {string} id
 * @property {any} container   - Root display object added to cubeLayer
 * @property {any} body         - Rotated during flip animation
 * @property {any} cubeShape
 * @property {any} halo
 * @property {any} figure
 * @property {any} prop
 * @property {any} plate
 * @property {any} label
 * @property {any} mood
 * @property {number} x          - Current interpolated X (GSAP-managed)
 * @property {number} y          - Current interpolated Y (GSAP-managed)
 * @property {number} targetX    - Destination X set by layoutCubes
 * @property {number} targetY    - Destination Y set by layoutCubes
 * @property {number} phase      - Phase accumulator for bobbing sine wave
 * @property {Cube | null} cube  - Last known server cube state
 * @property {boolean} flipping  - True while a GSAP flip tween is running
 * @property {Cube | null} _pendingCube - Cube state to apply after flip completes
 */

import { drawStickman, drawProp } from "./stickman.js";

/**
 * Creates a new cube node and wires up its click handler.
 *
 * @param {string} id           - Unique cube identifier
 * @param {HTMLInputElement} targetInput - Input to fill when the node is tapped
 * @returns {CubeNode}
 */
export function createCubeNode(id, targetInput) {
  const PIXI = window.PIXI;
  const container = new PIXI.Container();
  const cubeShape = new PIXI.Graphics();
  const halo = new PIXI.Graphics();
  const figure = new PIXI.Graphics();
  const prop = new PIXI.Graphics();
  const plate = new PIXI.Graphics();
  const label = new PIXI.Text("", {
    fontFamily: "Arial",
    fontSize: 12,
    fill: 0xedf4ff,
    fontWeight: "700",
  });
  const mood = new PIXI.Text("", {
    fontFamily: "Arial",
    fontSize: 11,
    fill: 0xbdd2f5,
  });

  label.anchor.set(0.5, 0);
  mood.anchor.set(0.5, 0);
  label.y = 58;
  mood.y = 74;

  const body = new PIXI.Container();
  body.addChild(plate, halo, cubeShape, figure, prop);
  container.addChild(body, label, mood);
  container.eventMode = "static";
  container.cursor = "pointer";
  container.on("pointertap", () => {
    targetInput.value = id;
    targetInput.focus();
  });

  return {
    id,
    container,
    body,
    cubeShape,
    halo,
    figure,
    prop,
    plate,
    label,
    mood,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    phase: Math.random() * Math.PI * 2,
    cube: null,
    flipping: false,
    _pendingCube: null,
  };
}

/**
 * Redraws all visual layers of a cube node to reflect the given cube state.
 * Called on every world update and at the end of flip animations.
 *
 * @param {CubeNode} node
 * @param {{ color: number, orientation: string, emotion: string, character: string, playerName: string }} cube
 */
export function drawCube(node, cube) {
  const cubeColor = Number.isInteger(cube.color) ? cube.color : 0xcccccc;

  // ── Device frame + LCD screen ───────────────────────────────────────────────
  node.cubeShape.clear();

  // Outer coloured plastic frame (rounded corners like the physical device)
  node.cubeShape.lineStyle(0);
  node.cubeShape.beginFill(cubeColor, 1);
  node.cubeShape.drawRoundedRect(-40, -40, 80, 80, 6);
  node.cubeShape.endFill();

  // Dark inner bezel (simulates the recess between frame and screen)
  node.cubeShape.beginFill(0x0a0c10, 1);
  node.cubeShape.drawRect(-33, -36, 66, 72);
  node.cubeShape.endFill();

  // LCD screen surface (medium-dark grey, slightly inset from the bezel)
  node.cubeShape.beginFill(0x2e3540, 1);
  node.cubeShape.drawRect(-29, -33, 58, 65);
  node.cubeShape.endFill();

  // ── Stickman figure ────────────────────────────────────────────────────────
  // Gravity: feet touch the LCD bottom (y=30) when upright, LCD top (y=-31) when upside_down.
  // figure.y=18 → feet-bottom = 18 + 4×P = 30; figure.y=-19 → feet displayed at -19-12 = -31.
  const upsideDown = cube.orientation === "upside_down";
  node.figure.scale.y = upsideDown ? -1 : 1;
  node.figure.position.set(0, upsideDown ? -19 : 18);

  node.figure.clear();
  drawStickman(node.figure, cube.emotion, cube.character);

  // ── Character prop icon ────────────────────────────────────────────────────
  // Flip the prop with the figure so it stays on the same side as the stickman's feet.
  node.prop.clear();
  node.prop.scale.y = upsideDown ? -1 : 1;
  drawProp(node.prop, cube.character);

  // ── Plate (drop-shadow) and halo (colour glow) ────────────────────────────
  node.plate.clear();
  node.plate.beginFill(0x000000, 0.2);
  node.plate.drawRoundedRect(-44, -44, 92, 92, 12);
  node.plate.endFill();

  node.halo.clear();
  node.halo.lineStyle(5, cubeColor, 0.22);
  node.halo.drawRoundedRect(-48, -48, 96, 96, 14);

  // ── Labels ─────────────────────────────────────────────────────────────────
  node.label.text = cube.playerName;
  node.mood.text = `${cube.character} - ${cube.emotion}`;
}
