import { buildBackground, updateBackground } from "./background.js";
import { createCubeNode, drawCube } from "./cube-node.js";
import { escapeHtml, renderHistory, updateCounters } from "./dom.js";

export function createScene({
  cubeScene,
  targetInput,
  cubeCount,
  linkCount,
  historyList,
}) {
  const sceneState = {
    app: null,
    backgroundLayer: null,
    linksLayer: null,
    cubeLayer: null,
    linkGraphics: null,
    cubeNodes: new Map(),
    links: [],
    stars: [],
    floaters: [],
    latestWorld: { cubes: [], history: [] },
    ready: false,
    resizeObserver: null,
    hasFatalError: false,
    myCubeId: "",
  };

  return {
    setMyCubeId(cubeId) {
      sceneState.myCubeId = cubeId;
    },
    handleWorldUpdate(state) {
      if (!state || !Array.isArray(state.cubes)) {
        return;
      }
      if (!sceneState.ready) {
        sceneState.latestWorld = state;
        return;
      }
      try {
        renderWorld(sceneState, state, { targetInput, cubeCount, linkCount, historyList });
      } catch (error) {
        console.error("Erreur lors de world:update", error);
        showSceneError(sceneState, cubeScene, "Erreur lors de la mise a jour de la scène.");
      }
    },
    setup() {
      setupScene(sceneState, {
        cubeScene,
        targetInput,
        cubeCount,
        linkCount,
        historyList,
      });
    },
  };
}

function showSceneError(sceneState, cubeScene, text) {
  if (sceneState.hasFatalError) {
    return;
  }
  sceneState.hasFatalError = true;
  cubeScene.innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
}

function setupScene(sceneState, refs) {
  const { cubeScene } = refs;
  if (!window.PIXI) {
    cubeScene.innerHTML = '<div class="empty-state">PixiJS introuvable. Recharge la page.</div>';
    return;
  }

  const PIXI = window.PIXI;
  let app;
  try {
    app = new PIXI.Application({
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: cubeScene,
    });
  } catch (error) {
    console.error("Impossible d'initialiser PixiJS", error);
    showSceneError(sceneState, cubeScene, "Impossible de lancer la scène 2D sur ce navigateur.");
    return;
  }

  const view = app.view || app.canvas;
  cubeScene.appendChild(view);
  app.renderer.resize(Math.max(1, cubeScene.clientWidth), Math.max(1, cubeScene.clientHeight));

  sceneState.app = app;
  sceneState.backgroundLayer = new PIXI.Container();
  sceneState.linksLayer = new PIXI.Container();
  sceneState.cubeLayer = new PIXI.Container();
  sceneState.linkGraphics = new PIXI.Graphics();
  sceneState.linksLayer.addChild(sceneState.linkGraphics);

  app.stage.addChild(sceneState.backgroundLayer);
  app.stage.addChild(sceneState.linksLayer);
  app.stage.addChild(sceneState.cubeLayer);
  buildBackground(sceneState);

  app.ticker.add((delta) => {
    try {
      animate(sceneState, delta);
    } catch (error) {
      console.error("Erreur de rendu PixiJS", error);
      app.ticker.stop();
      showSceneError(sceneState, cubeScene, "Erreur de rendu de la scène 2D.");
    }
  });

  const resizeScene = () => {
    app.renderer.resize(Math.max(1, cubeScene.clientWidth), Math.max(1, cubeScene.clientHeight));
    buildBackground(sceneState);
  };

  if (typeof ResizeObserver === "function") {
    sceneState.resizeObserver = new ResizeObserver(resizeScene);
    sceneState.resizeObserver.observe(cubeScene);
  } else {
    window.addEventListener("resize", resizeScene);
  }

  requestAnimationFrame(resizeScene);
  sceneState.ready = true;

  try {
    renderWorld(sceneState, sceneState.latestWorld, refs);
  } catch (error) {
    console.error("Erreur de synchronisation de la scène", error);
    showSceneError(sceneState, cubeScene, "Impossible d'afficher les cubes dans la scène 2D.");
  }
}

function renderWorld(sceneState, state, refs) {
  sceneState.latestWorld = state;
  const cubes = state.cubes.slice().sort((a, b) => {
    if (a.id === sceneState.myCubeId) return -1;
    if (b.id === sceneState.myCubeId) return 1;
    return a.playerName.localeCompare(b.playerName, "fr");
  });

  const uniqueLinks = new Set(
    cubes.flatMap((cube) =>
      (cube.connectedTo || []).map((target) => [cube.id, target].sort().join("::"))
    )
  );
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

function layoutCubes(sceneState, cubes) {
  const width = sceneState.app.screen.width;
  const height = sceneState.app.screen.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const gapX = 110;
  const gapY = 110;
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

function animate(sceneState, delta) {
  updateBackground(sceneState, delta);

  sceneState.cubeNodes.forEach((node) => {
    node.phase += 0.05 * delta;
    const bobIntensity =
      node.cube?.emotion === "joyeux" ? 4.5 : node.cube?.emotion === "surpris" ? 3.3 : 2.1;
    const bob = Math.sin(node.phase) * bobIntensity;
    node.x += (node.targetX - node.x) * 0.11;
    node.y += (node.targetY + bob - node.y) * 0.11;
    node.container.position.set(node.x, node.y);
  });

  drawLinks(sceneState);
}

function drawLinks(sceneState) {
  sceneState.linkGraphics.clear();
  sceneState.linkGraphics.lineStyle(2.5, 0x7fd4ff, 0.42);
  sceneState.links.forEach(([source, target]) => {
    const a = sceneState.cubeNodes.get(source);
    const b = sceneState.cubeNodes.get(target);
    if (!a || !b) {
      return;
    }
    sceneState.linkGraphics.moveTo(a.container.x, a.container.y);
    sceneState.linkGraphics.lineTo(b.container.x, b.container.y);
  });
}
