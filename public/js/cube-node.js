/**
 * @file cube-node.js
 * @description PIXI.js node factory and renderer for a single cube in the scene.
 *
 * Each "cube node" is a lightweight PIXI Container holding several Graphics layers:
 *   - plate      : drop-shadow behind the entire device
 *   - halo       : coloured glow ring around the device
 *   - cubeShape  : the device body — coloured frame + dark LCD screen area
 *   - figure     : pixel-art stickman character (drawn by stickman.js)
 *   - prop       : character's icon at the bottom of the LCD screen
 *   - label      : player name below the device
 *   - mood       : character + emotion line below the label
 *
 * The `figure` layer is Y-flipped when the cube orientation is "upside_down".
 *
 * @dependencies PIXI.js v7 (via window.PIXI), stickman.js
 */

import { drawStickman, drawProp } from "./stickman.js";

/**
 * Creates a new cube node and wires up its click handler.
 *
 * @param {string} id           - Unique cube identifier
 * @param {HTMLInputElement} targetInput - Input to fill when the node is tapped
 * @returns {Object} node - A plain object holding all PIXI display objects and state
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
    flipAnim: null,
  };
}

/**
 * Redraws all visual layers of a cube node to reflect the given cube state.
 * Called on every world update and at the end of flip animations.
 *
 * @param {Object} node  - Cube node created by createCubeNode
 * @param {Object} cube  - Cube state: { color, orientation, emotion, character, playerName }
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
  const upsideDown = cube.orientation === "upside_down";
  node.figure.scale.y = upsideDown ? -1 : 1;
  node.figure.position.set(0, upsideDown ? 10 : -10);

  node.figure.clear();
  drawStickman(node.figure, cube.emotion, cube.character);

  // ── Character prop icon ────────────────────────────────────────────────────
  node.prop.clear();
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
