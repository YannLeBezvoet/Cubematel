import { updateBackground } from "./background.js";

export function animate(sceneState, delta) {
  updateBackground(sceneState, delta);

  sceneState.cubeNodes.forEach((node) => {
    node.phase += 0.05 * delta;
    const bob = hasConnections(node.cube)
      ? 0
      : Math.sin(node.phase) * getBobIntensity(node.cube?.emotion);
    node.x += (node.targetX - node.x) * 0.11;
    node.y += (node.targetY + bob - node.y) * 0.11;
    node.container.position.set(node.x, node.y);
  });
}

function getBobIntensity(emotion) {
  if (emotion === "joyeux") {
    return 4.5;
  }
  if (emotion === "surpris") {
    return 3.3;
  }
  return 2.1;
}

function hasConnections(cube) {
  return Array.isArray(cube?.connectedTo) && cube.connectedTo.length > 0;
}
