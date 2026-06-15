import { showSceneError } from "./scene-errors.js";
import { setupScene } from "./scene-setup.js";
import { renderWorld } from "./scene-world.js";

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
    panOverlay: null,
    cubeNodes: new Map(),
    links: [],
    stars: [],
    floaters: [],
    latestWorld: { cubes: [], history: [] },
    ready: false,
    resizeObserver: null,
    hasFatalError: false,
    myCubeId: "",
    cameraX: 0,
    cameraY: 0,
    dragState: null,
  };

  return {
    // Mémorise l'identité locale pour prioriser son cube à l'écran.
    setMyCubeId(cubeId) {
      sceneState.myCubeId = cubeId;
    },
    // Applique le snapshot serveur quand la scène est prête.
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
    // Initialise Pixi et les calques visuels une seule fois.
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
