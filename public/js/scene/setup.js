// @ts-check
/**
 * @file scene/setup.js
 * @description PixiJS initialisation and scene lifecycle management.
 *
 * Creates the PixiJS Application, builds the layer stack (background, links,
 * cubes, pan overlay), wires the animation ticker and the resize observer.
 * Called once at startup; subsequent world updates go through scene/world.js.
 *
 * @dependencies scene/background.js, scene/animation.js, scene/errors.js,
 *               scene/world.js, scene/pan.js
 *
 * @typedef {import('./world.js').SceneState} SceneState
 */

import { buildBackground } from "./background.js";
import { animate } from "./animation.js";
import { showSceneError } from "./errors.js";
import { renderWorld } from "./world.js";
import { applyCameraTransform, setupPanInteractions, updatePanOverlay } from "./pan.js";

/**
 * Initialises the PixiJS application and all scene layers.
 * Wires the resize observer and the animation ticker.
 * Renders the buffered world state immediately after setup.
 *
 * @param {SceneState} sceneState
 * @param {{ cubeScene: HTMLElement, targetInput: HTMLInputElement, cubeCount: HTMLElement, linkCount: HTMLElement, historyList: HTMLElement }} refs
 */
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

  const view = /** @type {any} */ (app.view || (/** @type {any} */ (app)).canvas);
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
