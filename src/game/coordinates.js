// Rattrape les cubes sans coordonnées pour éviter les états partiels.
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

// Cherche la première case libre dans une grille simple et déterministe.
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

// Vérifie si une position est déjà occupée par un autre cube.
function isPositionTaken(cubes, x, y, ignoredCubeId) {
  return [...cubes.values()].some(
    (cube) => cube.id !== ignoredCubeId && cube.x === x && cube.y === y
  );
}

// Place le cube cible sur une case voisine libre dans l'axe demandé.
function placeConnectedCube(cubes, sourceId, targetId, direction) {
  const source = cubes.get(sourceId);
  const target = cubes.get(targetId);
  if (!source || !target) {
    return false;
  }

  const currentCandidates = connectionCandidates(source, direction);
  const targetAlreadyPlaced = currentCandidates.some(
    (candidate) => candidate.x === target.x && candidate.y === target.y
  );
  if (targetAlreadyPlaced) {
    return true;
  }

  const destination = currentCandidates.find(
    (candidate) => !isPositionTaken(cubes, candidate.x, candidate.y, target.id)
  );
  if (!destination) {
    return false;
  }

  target.x = destination.x;
  target.y = destination.y;
  return true;
}

// Produit les deux emplacements autorisés pour une connexion.
function connectionCandidates(source, direction) {
  if (direction === "vertical") {
    return [
      { x: source.x, y: source.y + 1 },
      { x: source.x, y: source.y - 1 },
    ];
  }
  return [
    { x: source.x + 1, y: source.y },
    { x: source.x - 1, y: source.y },
  ];
}

module.exports = {
  ensureAllCoordinates,
  findFirstFreeCoordinate,
  placeConnectedCube,
};
