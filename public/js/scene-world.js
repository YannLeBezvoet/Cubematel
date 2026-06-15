import { createCubeNode, drawCube } from "./cube-node.js";
import { renderHistory, updateCounters } from "./dom.js";

// Synchronise l'état serveur avec les nodes Pixi déjà en mémoire.
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
    if (!node) {
      return;
    }
    node.cube = cube;
    drawCube(node, cube);
  });
}

// Déduplique les liens pour éviter de compter deux fois la même connexion.
function collectUniqueLinks(cubes) {
  return new Set(
    cubes.flatMap((cube) => (cube.connectedTo || []).map((target) => [cube.id, target].sort().join("::")))
  );
}

// Crée ou supprime les nodes pour coller exactement aux cubes actifs.
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
    sceneState.cubeLayer.removeChild(node.container);
    sceneState.cubeNodes.delete(id);
  });
}

// Centre le monde visuel sur le cube local.
function layoutCubes(sceneState, cubes) {
  const width = sceneState.app.screen.width;
  const height = sceneState.app.screen.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const gapX = 80;
  const gapY = 80;
  const myCube = cubes.find((cube) => cube.id === sceneState.myCubeId);
  const originX = Number.isFinite(myCube?.x) ? myCube.x : 0;
  const originY = Number.isFinite(myCube?.y) ? myCube.y : 0;

  cubes.forEach((cube, index) => {
    const node = sceneState.cubeNodes.get(cube.id);
    if (!node) {
      return;
    }
    const x = Number.isFinite(cube.x) ? cube.x : index;
    const y = Number.isFinite(cube.y) ? cube.y : 0;
    node.targetX = centerX + (x - originX) * gapX;
    node.targetY = centerY + (y - originY) * gapY;
  });
}
