// @ts-check
/**
 * @file coordinates.js
 * @description Logique de positionnement des cubes sur la grille 2D.
 *
 * Responsabilités :
 *   - Assigner des coordonnées initiales aux cubes sans position.
 *   - Déplacer le cube source (joueur) pour qu'il se colle sur une face
 *     spécifique du cube cible.
 *   - Vérifier la disponibilité d'une case.
 *
 * Directions disponibles : "above" | "below" | "left" | "right"
 * Chacune représente une face du cube CIBLE où le joueur vient se positionner.
 */

/** @type {Record<string, { dx: number, dy: number }>} Décalages de coordonnées pour chaque direction relative à la cible. */
const DIRECTION_OFFSETS = {
  above: { dx: 0, dy: -1 },
  below: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/**
 * Rattrape les cubes sans coordonnées pour éviter les états partiels.
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
 * Cherche la première case libre dans une grille simple et déterministe.
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
 * Vérifie si une position est déjà occupée par un autre cube.
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
 * Retourne la position de la case adjacente à la cible dans la direction donnée.
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
 * Déplace le cube source (joueur) pour qu'il se colle sur la face indiquée
 * du cube cible. La cible reste immobile.
 *
 * @param {Map<string, import('../../types/cube.js').Cube>} cubes
 * @param {string} sourceId - Identifiant du cube joueur (qui se déplace)
 * @param {string} targetId - Identifiant du cube cible (qui reste en place)
 * @param {string} direction - "above" | "below" | "left" | "right"
 * @returns {boolean} true si le déplacement a réussi ou était déjà effectué
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
