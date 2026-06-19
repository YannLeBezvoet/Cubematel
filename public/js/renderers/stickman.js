// @ts-check
/**
 * @file renderers/stickman.js
 * @description Pixel-art stickman renderer for the Cubematel LCD game aesthetic.
 *
 * Draws stickman figures and character prop icons using PIXI.js Graphics.
 * Each figure "pixel" is a P×P filled square block, simulating the chunky
 * LCD look of classic handheld games (à la Cube World by Mattel).
 *
 * Body parts are independent functions accepting offset parameters, making
 * the design animation-ready for future frame-by-frame movement.
 *
 * Coordinate system (grid units, Y+ downward):
 *   - 1 grid unit = P display pixels.
 *   - Grid origin is the figure's visual center (hip level).
 *   - Head top: row -8 (y = -24px), feet bottom: row +3 bottom edge (y = +12px).
 *   - Total figure: 11 grid-row span × P = 36 display px tall.
 *   - Total figure: 8 grid-col span × P = 24 display px wide (with arms).
 *
 * Gravity positioning (managed by renderers/cube-node.js, not this file):
 *   - Normal (upright): figure.y = 18 → feet-bottom at body y=30 (LCD bottom edge y=32).
 *   - Upside_down:      figure.y = -19, scale.y=-1 → feet at body y=-31 (LCD top edge y=-33).
 *
 * Layout overview (grid rows, each cell = P px):
 *
 *   row -8...-6  HEAD       4×3 solid block
 *   row -5       NECK       2×1 (cols -1, 0)
 *   row -4...-1  TORSO      4×4 solid block
 *   row  0...2   LEGS       1 col each, left=-2 right=+1
 *   row  3       FEET       2 cols each, left=-3..-2 right=+1..+2
 *   col -3/-4    LEFT ARM   2-segment, pose-dependent
 *   col +2/+3    RIGHT ARM  2-segment, pose-dependent
 *
 * @dependencies PIXI.js v7 — Graphics objects are passed in, not imported directly.
 */

/** Display pixels per grid unit. Change to scale the entire figure uniformly. */
const P = 3;

// ─── Grid primitive ───────────────────────────────────────────────────────────

/**
 * Fills a single P×P grid cell at (col, row) in figure-local display coords.
 *
 * @param {any} gfx
 * @param {number} col - Grid column
 * @param {number} row - Grid row
 */
function cell(gfx, col, row) {
  gfx.drawRect(col * P, row * P, P, P);
}

// ─── Body part renderers ──────────────────────────────────────────────────────

/**
 * Draws the head as a 4×3 solid block at rows -8 to -6, cols -2 to +1.
 *
 * @param {any} gfx
 */
function drawHead(gfx) {
  for (let r = -8; r <= -6; r++) {
    for (let c = -2; c <= 1; c++) {
      cell(gfx, c, r);
    }
  }
}

/**
 * Draws the neck as a 2×1 block at row -5, cols -1 to 0.
 *
 * @param {any} gfx
 */
function drawNeck(gfx) {
  cell(gfx, -1, -5);
  cell(gfx, 0, -5);
}

/**
 * Draws the torso as a 4×4 solid block at rows -4 to -1, cols -2 to +1.
 *
 * @param {any} gfx
 */
function drawTorso(gfx) {
  for (let r = -4; r <= -1; r++) {
    for (let c = -2; c <= 1; c++) {
      cell(gfx, c, r);
    }
  }
}

/**
 * Draws both legs (rows 0–2) and feet (row 3).
 * Each leg is 1 column wide; feet extend one cell outward on each side.
 *
 * @param {any} gfx
 * @param {number} [leftX=-2]  - Column for the left leg
 * @param {number} [rightX=1]  - Column for the right leg
 */
function drawLegs(gfx, leftX = -2, rightX = 1) {
  for (let r = 0; r <= 2; r++) {
    cell(gfx, leftX, r);
    cell(gfx, rightX, r);
  }
  // Feet: 2 cells wide, extending outward from each leg
  cell(gfx, leftX - 1, 3);
  cell(gfx, leftX, 3);
  cell(gfx, rightX, 3);
  cell(gfx, rightX + 1, 3);
}

/**
 * Draws a single 2-segment arm using grid coordinates.
 *
 * @param {any} gfx
 * @param {number} col1 - Upper arm column
 * @param {number} row1 - Upper arm row
 * @param {number} col2 - Forearm column
 * @param {number} row2 - Forearm row
 */
function drawArm(gfx, col1, row1, col2, row2) {
  cell(gfx, col1, row1);
  cell(gfx, col2, row2);
}

// ─── Arm poses ────────────────────────────────────────────────────────────────
// Shoulder anchor: left at col -3 row -4, right at col +2 row -4.
// Torso occupies cols -2..+1, so arms attach directly outside the body sides.

/**
 * Arms hanging down and outward (default idle pose).
 *
 * @param {any} gfx
 */
function drawArmsDown(gfx) {
  drawArm(gfx, -3, -4, -4, -3);
  drawArm(gfx,  2, -4,  3, -3);
}

/**
 * Arms spread wide horizontally (surprised emotion).
 *
 * @param {any} gfx
 */
function drawArmsWide(gfx) {
  drawArm(gfx, -3, -4, -4, -4);
  drawArm(gfx,  2, -4,  3, -4);
}

/**
 * Dodger play pose: right arm raised high, left arm down.
 *
 * @param {any} gfx
 */
function drawArmsPlayDodger(gfx) {
  drawArm(gfx, -3, -4, -4, -3);
  drawArm(gfx,  2, -5,  3, -6);
}

/**
 * Whip play pose: left arm raised high, right arm down.
 *
 * @param {any} gfx
 */
function drawArmsPlayWhip(gfx) {
  drawArm(gfx, -3, -5, -4, -6);
  drawArm(gfx,  2, -4,  3, -3);
}

/**
 * Curious pose: right arm extended horizontally (shielding eyes / pointing).
 *
 * @param {any} gfx
 */
function drawArmsCurious(gfx) {
  drawArm(gfx, -3, -4, -4, -3);
  drawArm(gfx,  2, -4,  3, -4);
}

/**
 * Selects and draws the correct arm pose for the given emotion and character.
 *
 * @param {any} gfx
 * @param {string} emotion   - Emotion key driving the pose choice
 * @param {string} character - 'Dodger' | 'Whip' (used for joyeux split)
 */
function drawArms(gfx, emotion, character) {
  switch (emotion) {
    case "surpris": return drawArmsWide(gfx);
    case "joyeux":  return character === "Dodger" ? drawArmsPlayDodger(gfx) : drawArmsPlayWhip(gfx);
    case "curieux": return drawArmsCurious(gfx);
    default:        return drawArmsDown(gfx);
  }
}

// ─── Prop icons ───────────────────────────────────────────────────────────────

/** Pixel size for prop icons (drawn in body-container coords, not grid units). */
const PP = 2;

/**
 * Draws a pixel-art basketball for Dodger, centred near (0, 28) in prop-local coords.
 * At this cy the ball bottom aligns with the LCD bottom edge (y=32 in body coords).
 * When the prop container is flipped (upside_down), the ball mirrors to the LCD top.
 *
 * @param {any} gfx
 */
function drawBall(gfx) {
  const cx = 0, cy = 28;
  gfx.drawRect(cx - PP,      cy - 2 * PP, 2 * PP, PP);
  gfx.drawRect(cx - 2 * PP, cy - PP,     4 * PP, PP);
  gfx.drawRect(cx - 2 * PP, cy,          4 * PP, PP);
  gfx.drawRect(cx - PP,      cy + PP,    2 * PP, PP);
}

/**
 * Draws a pixel-art lasso coil for Whip, centred near (0, 24) in prop-local coords.
 * At this cy the rope bottom aligns with the LCD bottom edge (y=32 in body coords).
 * When the prop container is flipped (upside_down), the rope mirrors to the LCD top.
 *
 * @param {any} gfx
 */
function drawRope(gfx) {
  const cx = 0, cy = 24;
  gfx.drawRect(cx - 3 * PP, cy,          6 * PP, PP);
  gfx.drawRect(cx - 4 * PP, cy + PP,     PP,     2 * PP);
  gfx.drawRect(cx + 3 * PP, cy + PP,     PP,     2 * PP);
  gfx.drawRect(cx - 3 * PP, cy + 3 * PP, 6 * PP, PP);
  gfx.drawRect(cx + PP,     cy - 3 * PP, PP,     3 * PP);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Draws the complete pixel-art stickman onto the given PIXI Graphics object.
 * The caller must clear the graphics object before calling this function.
 *
 * Assembles: head → neck → torso → arms (pose-dependent) → legs → feet.
 *
 * @param {any} gfx    - Figure Graphics object (figure-local coords)
 * @param {string} emotion       - 'happy' | 'surpris' | 'joyeux' | 'curieux' | 'désorienté'
 * @param {string} character     - 'Dodger' | 'Whip'
 */
export function drawStickman(gfx, emotion, character) {
  gfx.lineStyle(0);
  gfx.beginFill(0x000000, 1);

  drawHead(gfx);
  drawNeck(gfx);
  drawTorso(gfx);
  drawArms(gfx, emotion, character);
  drawLegs(gfx);

  gfx.endFill();
}

/**
 * Draws the character's prop icon at the bottom of the LCD screen area.
 * The caller must clear the graphics object before calling this function.
 * Props are drawn regardless of emotion.
 *
 * @param {any} gfx  - Prop Graphics object (body-container coords)
 * @param {string} character   - 'Dodger' | 'Whip'
 */
export function drawProp(gfx, character) {
  gfx.lineStyle(0);
  gfx.beginFill(0x000000, 1);

  if (character === "Dodger") drawBall(gfx);
  else drawRope(gfx);

  gfx.endFill();
}
