import { buildBackground } from "./background.js";
import { animate } from "./scene-animation.js";
import { showSceneError } from "./scene-errors.js";
import { renderWorld } from "./scene-world.js";

export function setupScene(sceneState, refs) {
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
      autoDensity: true,
      resolution: 1,
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
  cubeScene.classList.add("scene-pan-ready");

  sceneState.app = app;
  sceneState.backgroundLayer = new PIXI.Container();
  sceneState.linksLayer = new PIXI.Container();
  sceneState.cubeLayer = new PIXI.Container();
  sceneState.linkGraphics = new PIXI.Graphics();
  sceneState.panOverlay = new PIXI.Graphics();
  sceneState.linksLayer.addChild(sceneState.linkGraphics);
  sceneState.linksLayer.addChild(sceneState.panOverlay);

  app.stage.addChild(sceneState.backgroundLayer);
  app.stage.addChild(sceneState.linksLayer);
  app.stage.addChild(sceneState.cubeLayer);
  buildBackground(sceneState);
  updatePanOverlay(sceneState);
  applyCameraTransform(sceneState);
  setupPanInteractions(sceneState);

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
    updatePanOverlay(sceneState);
    if (!sceneState.ready || !sceneState.latestWorld) {
      return;
    }

    renderWorld(sceneState, sceneState.latestWorld, refs);
    applyCameraTransform(sceneState);
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
    applyCameraTransform(sceneState);
  } catch (error) {
    console.error("Erreur de synchronisation de la scène", error);
    showSceneError(sceneState, cubeScene, "Impossible d'afficher les cubes dans la scène 2D.");
  }
}

function setupPanInteractions(sceneState) {
  sceneState.dragState = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startCameraX: 0,
    startCameraY: 0,
    dragged: false,
  };

  const onPointerDown = (event) => {
    if (typeof event.button === "number" && event.button !== 0) {
      return;
    }

    sceneState.dragState.active = true;
    sceneState.dragState.pointerId = event.pointerId;
    const { x, y } = getPointerPosition(event);
    sceneState.dragState.startX = x;
    sceneState.dragState.startY = y;
    sceneState.dragState.startCameraX = sceneState.cameraX;
    sceneState.dragState.startCameraY = sceneState.cameraY;
    sceneState.dragState.dragged = false;
  };

  const onPointerMove = (event) => {
    const dragState = sceneState.dragState;
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    const { x, y } = getPointerPosition(event);
    const deltaX = x - dragState.startX;
    const deltaY = y - dragState.startY;
    const distance = Math.hypot(deltaX, deltaY);
    if (!dragState.dragged && distance < 3) {
      return;
    }

    dragState.dragged = true;
    sceneState.cameraX = dragState.startCameraX + deltaX;
    sceneState.cameraY = dragState.startCameraY + deltaY;
    applyCameraTransform(sceneState);
  };

  const endDrag = (event) => {
    const dragState = sceneState.dragState;
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState.active = false;
    dragState.pointerId = null;
  };

  sceneState.panOverlay.eventMode = "static";
  sceneState.panOverlay.cursor = "grab";
  sceneState.panOverlay.on("pointerdown", onPointerDown);
  sceneState.panOverlay.on("pointermove", onPointerMove);
  sceneState.panOverlay.on("pointerup", endDrag);
  sceneState.panOverlay.on("pointerupoutside", endDrag);
  sceneState.panOverlay.on("pointercancel", endDrag);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}

function getPointerPosition(event) {
  if (event.clientX !== undefined) {
    return { x: event.clientX, y: event.clientY };
  }
  // Fallback for PixiJS synthetic events without clientX
  return { x: event.global.x, y: event.global.y };
}

function updatePanOverlay(sceneState) {
  if (!sceneState.panOverlay || !sceneState.app) {
    return;
  }

  const width = sceneState.app.screen.width;
  const height = sceneState.app.screen.height;
  sceneState.panOverlay.clear();
  sceneState.panOverlay.beginFill(0x000000, 0);
  sceneState.panOverlay.drawRect(0, 0, width, height);
  sceneState.panOverlay.endFill();
  sceneState.panOverlay.hitArea = new window.PIXI.Rectangle(0, 0, width, height);
}

function applyCameraTransform(sceneState) {
  if (!sceneState.linksLayer || !sceneState.cubeLayer) {
    return;
  }

  if (sceneState.backgroundLayer) {
    sceneState.backgroundLayer.position.set(0, 0);
  }
  sceneState.linksLayer.position.set(sceneState.cameraX, sceneState.cameraY);
  sceneState.cubeLayer.position.set(sceneState.cameraX, sceneState.cameraY);
}
