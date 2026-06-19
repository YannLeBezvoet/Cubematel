// @ts-check
/**
 * @file coordinates.js
 * @description Cube positioning logic on the 2D grid.
 *
 * Responsibilities:
 *   - Assign initial coordinates to cubes that have no position.
 *   - Move the source cube (player) to snap it onto a specific
 *     face of the target cube.
 *   - Check whether a cell is available.
 *
 * Available directions: "above" | "below" | "left" | "right"
 * Each represents a face of the TARGET cube where the player positions themselves.
 */

/** @type {Record<string, { dx: number, dy: number }>} Coordinate offsets for each direction relative to the target. */
const DIRECTION_OFFSETS = {
  above: { dx: 0, dy: -1 },
  below: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/**
 * Catches cubes without coordinates to prevent partial states.
 *
 * @param {Map<string, import('../../types/cube.js').Cube>} cubes
 */
function ensureAllCoordinates(cubes) {
  cubes.forEach((cube) => {
    if (Number.isFinite(cube.x) && Number.isFinite(cube.y)) {
      return;
    }
    const position = findFirstFreeCoordinate(cubes, cube.id);
    cube.x = position.x;
    cube.y = position.y;
  });
}

/**
 * Finds the first free cell in a simple, deterministic grid scan.
 *
 * @param {Map<string, import('../../types/cube.js').Cube>} cubes
 * @param {string} [ignoredCubeId]
 * @returns {{ x: number, y: number }}
 */
function findFirstFreeCoordinate(cubes, ignoredCubeId) {
  const searchLimit = cubes.size + 2;
  for (let y = -searchLimit; y <= searchLimit; y += 1) {
    for (let x = -searchLimit; x <= searchLimit; x += 1) {
      if (!isPositionTaken(cubes, x, y, ignoredCubeId)) {
        return { x, y };
      }
    }
  }
  return { x: searchLimit + 1, y: 0 };
}

/**
 * Checks whether a position is already occupied by another cube.
 *
 * @param {Map<string, import('../../types/cube.js').Cube>} cubes
 * @param {number} x
 * @param {number} y
 * @param {string} [ignoredCubeId]
 * @returns {boolean}
 */
function isPositionTaken(cubes, x, y, ignoredCubeId) {
  return [...cubes.values()].some(
    (cube) => cube.id !== ignoredCubeId && cube.x === x && cube.y === y
  );
}

/**
 * Returns the position of the cell adjacent to the target in the given direction.
 *
 * @param {{ x: number, y: number }} target
 * @param {string} direction
 * @returns {{ x: number, y: number }}
 */
function targetFacePosition(target, direction) {
  const offset = DIRECTION_OFFSETS[direction] ?? DIRECTION_OFFSETS.below;
  return { x: target.x + offset.dx, y: target.y + offset.dy };
}

/**
 * Moves the source cube (player) to snap it onto the indicated face
 * of the target cube. The target remains stationary.
 *
 * @param {Map<string, import('../../types/cube.js').Cube>} cubes
 * @param {string} sourceId - Identifier of the player cube (the one that moves)
 * @param {string} targetId - Identifiant du cube cible (qui reste en place)
 * @param {string} direction - "above" | "below" | "left" | "right"
 * @returns {boolean} true if the move succeeded or was already performed
 */
function moveSourceToTarget(cubes, sourceId, targetId, direction) {
  const source = cubes.get(sourceId);
  const target = cubes.get(targetId);
  if (!source || !target) {
    return false;
  }

  const destination = targetFacePosition(target, direction);

  if (source.x === destination.x && source.y === destination.y) {
    return true;
  }

  if (isPositionTaken(cubes, destination.x, destination.y, source.id)) {
    return false;
  }

  source.x = destination.x;
  source.y = destination.y;
  return true;
}

module.exports = {
  ensureAllCoordinates,
  findFirstFreeCoordinate,
  moveSourceToTarget,
};
