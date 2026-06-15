// Gère le pan de caméra pour garder la scène principale simple.
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

// Redessine le voile invisible qui capte les interactions.
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

// Applique le décalage de caméra aux calques utiles.
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

function getPointerPosition(event) {
  if (event.clientX !== undefined) {
    return { x: event.clientX, y: event.clientY };
  }
  return { x: event.global.x, y: event.global.y };
}
