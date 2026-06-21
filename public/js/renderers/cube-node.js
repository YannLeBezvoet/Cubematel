// @ts-check
/**
 * @file renderers/cube-node.js
 * @description PIXI.js cube node class for a single cube in the scene.
 *
 * Each CubeNode wraps a PIXI Container holding several Graphics layers:
 *   - plate      : drop-shadow behind the entire device
 *   - halo       : coloured glow ring around the device
 *   - cubeShape  : the device body — coloured frame + dark LCD screen area
 *   - figure     : pixel-art stickman character (drawn by renderers/stickman.js)
 *   - prop       : character's icon at the bottom of the LCD screen
 *   - label      : player name below the device
 *   - mood       : character + emotion line below the label
 *
 * The `figure` layer is Y-flipped when the cube orientation is "upside_down".
 * Position transitions are driven by GSAP via scene/world.js (not this class).
 *
 * @dependencies PIXI.js v8 (via window.PIXI), renderers/stickman.js
 */

/**
 * @typedef {import('../../../types/cube.js').Cube} Cube
 */

import { drawStickman, drawProp } from "./stickman.js";

/**
 * Represents a single cube's visual node in the PixiJS scene.
 * Encapsulates the container hierarchy, child layers, animation state,
 * and redraw logic for one player cube.
 */
export class CubeNode {
  /**
   * Creates the full PIXI container hierarchy and wires the click handler.
   *
   * @param {string} id - Unique cube identifier
   * @param {(id: string) => void} onSelect - Called with the cube id when tapped
   */
  constructor(id, onSelect) {
    const PIXI = window.PIXI;

    /** @type {string} */
    this.id = id;

    this.container = new PIXI.Container();
    this.cubeShape = new PIXI.Graphics();
    this.halo = new PIXI.Graphics();
    this.figure = new PIXI.Graphics();
    this.prop = new PIXI.Graphics();
    this.plate = new PIXI.Graphics();
    this.label = new PIXI.Text({ text: "", style: { fontFamily: "Arial", fontSize: 12, fill: 0xedf4ff, fontWeight: "700" } });
    this.mood = new PIXI.Text({ text: "", style: { fontFamily: "Arial", fontSize: 11, fill: 0xbdd2f5 } });

    this.label.anchor.set(0.5, 0);
    this.mood.anchor.set(0.5, 0);
    this.label.y = 76;
    this.mood.y = 92;

    this.body = new PIXI.Container();
    this.body.addChild(this.plate, this.halo, this.cubeShape, this.figure, this.prop);
    this.container.addChild(this.body, this.label, this.mood);
    this.container.eventMode = "static";
    this.container.cursor = "pointer";
    this.container.on("pointertap", () => onSelect(id));
    this.container.on("pointerenter", () => { this._hovered = true; this._syncLabelVisibility(); });
    this.container.on("pointerleave", () => { this._hovered = false; this._syncLabelVisibility(); });

    /** @type {number} Current interpolated X (GSAP-managed) */
    this.x = 0;
    /** @type {number} Current interpolated Y (GSAP-managed) */
    this.y = 0;
    /** @type {number} Destination X set by layoutCubes */
    this.targetX = 0;
    /** @type {number} Destination Y set by layoutCubes */
    this.targetY = 0;
    /** @type {number} Phase accumulator for bobbing sine wave */
    this.phase = Math.random() * Math.PI * 2;
    /** @type {Cube | null} Last known server cube state */
    this.cube = null;
    /** @type {boolean} True while a GSAP flip tween is running */
    this.flipping = false;
    /** @type {Cube | null} Cube state to apply after flip completes */
    this._pendingCube = null;
    /** @type {boolean} True when another cube is directly below on the grid */
    this._hasCubeBelow = false;
    /** @type {boolean} True while the pointer is over this cube */
    this._hovered = false;
  }

  /**
   * Shows or hides the label/mood texts based on hover and neighbour state.
   * Labels are always visible unless a cube sits directly below (overlapping
   * area), in which case they are hidden until the user hovers over the cube.
   */
  _syncLabelVisibility() {
    const visible = !this._hasCubeBelow || this._hovered;
    this.label.visible = visible;
    this.mood.visible = visible;
  }

  /**
   * Updates whether a cube sits directly below this one on the grid.
   * Hides the label by default when true; the label is revealed on hover.
   *
   * @param {boolean} hasCubeBelow
   */
  updateHasCubeBelow(hasCubeBelow) {
    this._hasCubeBelow = hasCubeBelow;
    this._syncLabelVisibility();
  }

  /**
   * Redraws all visual layers to reflect the given cube state.
   * Called on every world update and at the end of flip animations.
   *
   * @param {{ color: number, orientation: string, emotion: string, character: string, playerName: string }} cube
   */
  draw(cube) {
    const cubeColor = Number.isInteger(cube.color) ? cube.color : 0xcccccc;

    // ── Device frame + LCD screen ───────────────────────────────────────────────
    // LCD = 32×32 LCD pixels × P=3 = 96×96 display pixels, centred at origin.
    this.cubeShape.clear();
    this.cubeShape.roundRect(-58, -58, 116, 116, 8).fill(cubeColor);
    this.cubeShape.rect(-52, -52, 104, 104).fill(0x0a0c10);
    this.cubeShape.rect(-48, -48, 96, 96).fill(0x2e3540);

    // ── Stickman figure ────────────────────────────────────────────────────────
    // Offset 5 LCD pixels (15 display px) toward the gravity direction so the
    // figure stands near the bottom of the LCD and feet remain inside.
    const upsideDown = cube.orientation === "upside_down";
    this.figure.scale.y = upsideDown ? -1 : 1;
    this.figure.position.set(0, upsideDown ? -15 : 15);

    this.figure.clear();
    drawStickman(this.figure, cube.emotion, cube.character);

    // ── Character prop icon ────────────────────────────────────────────────────
    // Offset matches the figure so the prop appears near the LCD bottom corner.
    this.prop.clear();
    this.prop.scale.y = upsideDown ? -1 : 1;
    this.prop.position.set(0, upsideDown ? -16 : 16);
    drawProp(this.prop, cube.character);

    // ── Plate (drop-shadow) and halo (colour glow) ────────────────────────────
    this.plate.clear();
    this.plate.roundRect(-63, -63, 130, 130, 14).fill({ color: 0x000000, alpha: 0.2 });

    this.halo.clear();
    this.halo.roundRect(-67, -67, 138, 138, 16).stroke({ width: 5, color: cubeColor, alpha: 0.22 });

    // ── Labels ─────────────────────────────────────────────────────────────────
    this.label.text = cube.playerName;
    this.mood.text = `${cube.character} - ${cube.emotion}`;
  }
}
