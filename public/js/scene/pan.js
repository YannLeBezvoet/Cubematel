// @ts-check
/**
 * @file scene/pan.js
 * @description Camera pan interactions for the cube scene.
 *
 * Wires pointer events onto the transparent pan overlay so the user can
 * click-drag to scroll the world. Also exports helpers to reposition the
 * overlay and apply the camera offset to the scene layers.
 *
 * No project-level imports — only reads/writes sceneState and window.PIXI.
 *
 * @typedef {import('./world.js').SceneState} SceneState
 * @typedef {import('./world.js').DragState} DragState
 */

/**
 * Initialises drag state and wires all pointer events onto the pan overlay.
 * Must be called once after the PixiJS overlay is created.
 *
 * @param {SceneState} sceneState
 */
export function setupPanInteractions(sceneState) {
  sceneState.dragState = {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startCameraX: 0,
    startCameraY: 0,
    dragged: false,
  };

  const onPointerDown = (/** @type {any} */ event) => {
    if (typeof event.button === "number" && event.button !== 0) {
      return;
    }
    const dragState = sceneState.dragState;
    if (!dragState) return;
    dragState.active = true;
    dragState.pointerId = event.pointerId;
    const { x, y } = getPointerPosition(event);
    dragState.startX = x;
    dragState.startY = y;
    dragState.startCameraX = sceneState.cameraX;
    dragState.startCameraY = sceneState.cameraY;
    dragState.dragged = false;
  };

  const onPointerMove = (/** @type {any} */ event) => {
    const dragState = sceneState.dragState;
    if (!dragState || !dragState.active || dragState.pointerId !== event.pointerId) {
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

  const endDrag = (/** @type {any} */ event) => {
    const dragState = sceneState.dragState;
    if (!dragState || !dragState.active || dragState.pointerId !== event.pointerId) {
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

/**
 * Redraws the invisible overlay that captures pointer interactions.
 * Must be called after every resize.
 *
 * @param {SceneState} sceneState
 */
export function updatePanOverlay(sceneState) {
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

/**
 * Applies the current camera offset to links and cube layers.
 * The background layer is kept at (0, 0) to remain fixed.
 *
 * @param {SceneState} sceneState
 */
export function applyCameraTransform(sceneState) {
  if (!sceneState.linksLayer || !sceneState.cubeLayer) {
    return;
  }

  if (sceneState.backgroundLayer) {
    sceneState.backgroundLayer.position.set(0, 0);
  }
  sceneState.linksLayer.position.set(sceneState.cameraX, sceneState.cameraY);
  sceneState.cubeLayer.position.set(sceneState.cameraX, sceneState.cameraY);
}

/**
 * Normalises a DOM PointerEvent or a PixiJS FederatedPointerEvent to {x, y}.
 *
 * @param {any} event
 * @returns {{ x: number, y: number }}
 */
function getPointerPosition(event) {
  if (event.clientX !== undefined) {
    return { x: event.clientX, y: event.clientY };
  }
  return { x: event.global.x, y: event.global.y };
}
