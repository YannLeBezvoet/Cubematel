/**
 * @file stickman.js
 * @description Pixel art stickman renderer for the Cubematel LCD game aesthetic.
 *
 * Draws stickman figures and character prop icons using PIXI.js Graphics objects.
 * Each "pixel" is a P×P filled square block, simulating the low-resolution
 * chunky look of a classic LCD handheld game (à la Cube World by Mattel).
 *
 * Coordinate system (figure-local):
 *   - Origin (0, 0) is the figure center.
 *   - Head top: y = -24, feet bottom: y = +12. Total height: 36 display px.
 *   - The figure container is offset to (0, -10) within the cube body externally.
 *
 * Poses vary by emotion; props vary by character.
 *
 * @dependencies PIXI.js v7 — Graphics objects are passed in, not imported directly.
 */

/** Size in display pixels of each pixel-art "pixel" block. */
const P = 4;

// ─── Layout constants (in figure-local display coords) ────────────────────────

const HEAD_TOP = -24;      // y of head's top edge
const BODY_TOP = HEAD_TOP + 2 * P;  // -16 : head is 2 blocks tall
const LEGS_TOP = BODY_TOP + 3 * P;  // -4  : body is 3 blocks tall

// Shoulder y = BODY_TOP; shoulder x = ±(P/2 + P) = ±(body_half + one_block)
// Body is 4px wide centred at 0 → left edge x=-2, right edge x=+2.
// Arms attach one block outside the body edges: left shoulder at x=-6, right at x=+2.

// ─── Primitive ────────────────────────────────────────────────────────────────

/**
 * Draws a single P×P pixel block at display coords (x, y).
 * @param {PIXI.Graphics} gfx
 * @param {number} x
 * @param {number} y
 */
function drawPx(gfx, x, y) {
  gfx.drawRect(x, y, P, P);
}

// ─── Body parts ───────────────────────────────────────────────────────────────

/**
 * Draws the head: a 2×2 grid of P×P blocks (8×8 display px, centred at x=0).
 * @param {PIXI.Graphics} gfx
 * @param {number} yTop
 */
function drawHead(gfx, yTop) {
  drawPx(gfx, -P, yTop);
  drawPx(gfx, 0,  yTop);
  drawPx(gfx, -P, yTop + P);
  drawPx(gfx, 0,  yTop + P);
}

/**
 * Draws the body: a 4px-wide centred column of 3 pixel blocks (4×12 display px).
 * @param {PIXI.Graphics} gfx
 * @param {number} yTop
 */
function drawBody(gfx, yTop) {
  gfx.drawRect(-2, yTop, P, 3 * P);
}

/**
 * Draws both legs in a V shape.
 * Crotch: 1 shared block. Each leg then splits one block outward for 3 blocks down.
 * @param {PIXI.Graphics} gfx
 * @param {number} yTop - y of the crotch block (= LEGS_TOP)
 */
function drawLegs(gfx, yTop) {
  gfx.drawRect(-2, yTop, P, P);            // crotch (centred)
  gfx.drawRect(-P, yTop + P, P, 3 * P);   // left leg  (x: -4..0)
  gfx.drawRect(0,  yTop + P, P, 3 * P);   // right leg (x:  0..4)
}

// ─── Arm poses ────────────────────────────────────────────────────────────────

/**
 * Arms hanging down and slightly outward (default / happy).
 * @param {PIXI.Graphics} gfx
 * @param {number} yArm - shoulder y (= BODY_TOP)
 */
function drawArmsDown(gfx, yArm) {
  drawPx(gfx, -2 * P, yArm);           // left upper arm
  drawPx(gfx, -3 * P, yArm + P);       // left forearm (down-out)
  drawPx(gfx,      P, yArm);           // right upper arm
  drawPx(gfx,  2 * P, yArm + P);       // right forearm
}

/**
 * Arms spread wide horizontally (surprised).
 * @param {PIXI.Graphics} gfx
 * @param {number} yArm
 */
function drawArmsWide(gfx, yArm) {
  drawPx(gfx, -2 * P, yArm);
  drawPx(gfx, -3 * P, yArm);
  drawPx(gfx,      P, yArm);
  drawPx(gfx,  2 * P, yArm);
}

/**
 * Both arms raised (joyful celebrating pose).
 * @param {PIXI.Graphics} gfx
 * @param {number} yArm
 */
function drawArmsUp(gfx, yArm) {
  drawPx(gfx, -2 * P, yArm - P);
  drawPx(gfx, -3 * P, yArm - 2 * P);
  drawPx(gfx,      P, yArm - P);
  drawPx(gfx,  2 * P, yArm - 2 * P);
}

/**
 * Dodger play pose: right arm raised high (triumphant dribble/shot), left arm down.
 * @param {PIXI.Graphics} gfx
 * @param {number} yArm
 */
function drawArmsPlayDodger(gfx, yArm) {
  drawPx(gfx, -2 * P, yArm);           // left upper arm (down)
  drawPx(gfx, -3 * P, yArm + P);       // left forearm
  drawPx(gfx,      P, yArm - P);       // right upper arm (raised)
  drawPx(gfx,  2 * P, yArm - 2 * P);  // right forearm (high)
}

/**
 * Whip play pose: left arm raised high (lasso throw), right arm down.
 * @param {PIXI.Graphics} gfx
 * @param {number} yArm
 */
function drawArmsPlayWhip(gfx, yArm) {
  drawPx(gfx, -2 * P, yArm - P);       // left upper arm (raised)
  drawPx(gfx, -3 * P, yArm - 2 * P);  // left forearm (high)
  drawPx(gfx,      P, yArm);           // right upper arm (down)
  drawPx(gfx,  2 * P, yArm + P);       // right forearm
}

/**
 * Curious pose: left arm down, right arm extended forward/horizontal (peeking).
 * @param {PIXI.Graphics} gfx
 * @param {number} yArm
 */
function drawArmsCurieux(gfx, yArm) {
  drawPx(gfx, -2 * P, yArm);           // left upper arm (down)
  drawPx(gfx, -3 * P, yArm + P);       // left forearm
  drawPx(gfx,      P, yArm);           // right upper arm
  drawPx(gfx,  2 * P, yArm);           // right forearm (horizontal — shielding eyes)
}

/**
 * Selects and draws the correct arm pose based on emotion and character.
 * @param {PIXI.Graphics} gfx
 * @param {string} emotion
 * @param {string} character
 * @param {number} yArm
 */
function drawArms(gfx, emotion, character, yArm) {
  switch (emotion) {
    case "surpris":
      drawArmsWide(gfx, yArm);
      break;
    case "joyeux":
      if (character === "Dodger") {
        drawArmsPlayDodger(gfx, yArm);
      } else {
        drawArmsPlayWhip(gfx, yArm);
      }
      break;
    case "curieux":
      drawArmsCurieux(gfx, yArm);
      break;
    default:
      drawArmsDown(gfx, yArm);
  }
}

// ─── Prop icons ───────────────────────────────────────────────────────────────

/** Pixel size used for prop icons (smaller than stickman P for visual balance). */
const PP = 2;

/**
 * Draws a pixel-art basketball for Dodger.
 * Positioned around (0, 22) in body-container coords.
 * @param {PIXI.Graphics} gfx
 */
function drawBall(gfx) {
  const cx = 0;
  const cy = 22;
  // Diamond/ball outline (filled):
  //   . X X .
  //   X X X X
  //   X X X X
  //   . X X .
  gfx.drawRect(cx - PP,      cy - 2 * PP, 2 * PP, PP);   // top
  gfx.drawRect(cx - 2 * PP, cy - PP,     4 * PP, PP);    // upper band
  gfx.drawRect(cx - 2 * PP, cy,          4 * PP, PP);    // lower band
  gfx.drawRect(cx - PP,      cy + PP,    2 * PP, PP);    // bottom
}

/**
 * Draws a pixel-art lasso coil for Whip.
 * Positioned around (0, 20) in body-container coords.
 * @param {PIXI.Graphics} gfx
 */
function drawRope(gfx) {
  const cx = 0;
  const cy = 20;
  // Oval coil:
  gfx.drawRect(cx - 3 * PP, cy,          6 * PP, PP);    // top arc
  gfx.drawRect(cx - 4 * PP, cy + PP,     PP,     2 * PP); // left side
  gfx.drawRect(cx + 3 * PP, cy + PP,     PP,     2 * PP); // right side
  gfx.drawRect(cx - 3 * PP, cy + 3 * PP, 6 * PP, PP);    // bottom arc
  // rope stem going up from the coil
  gfx.drawRect(cx + PP,     cy - 3 * PP, PP,     3 * PP); // vertical tail
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Draws the complete pixel-art stickman onto the given PIXI Graphics object.
 * The graphics object should be cleared by the caller before this call.
 *
 * @param {PIXI.Graphics} gfx    - The figure Graphics object (local coords)
 * @param {string} emotion       - 'happy' | 'surpris' | 'joyeux' | 'curieux' | 'désorienté'
 * @param {string} character     - 'Dodger' | 'Whip'
 */
export function drawStickman(gfx, emotion, character) {
  gfx.lineStyle(0);
  gfx.beginFill(0x000000, 1);

  drawHead(gfx, HEAD_TOP);
  drawBody(gfx, BODY_TOP);
  drawArms(gfx, emotion, character, BODY_TOP);
  drawLegs(gfx, LEGS_TOP);

  gfx.endFill();
}

/**
 * Draws the character's prop icon at the bottom of the LCD screen area.
 * The graphics object should be cleared by the caller before this call.
 * Props are always shown regardless of emotion.
 *
 * @param {PIXI.Graphics} gfx  - The prop Graphics object (body-container coords)
 * @param {string} character   - 'Dodger' | 'Whip'
 */
export function drawProp(gfx, character) {
  gfx.lineStyle(0);
  gfx.beginFill(0x000000, 1);

  if (character === "Dodger") {
    drawBall(gfx);
  } else {
    drawRope(gfx);
  }

  gfx.endFill();
}
