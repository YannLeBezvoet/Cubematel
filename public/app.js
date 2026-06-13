import { bindControls, getDomRefs, setSelfBadge } from "./js/dom.js";
import { createScene } from "./js/scene.js";

const socket = io();
const dom = getDomRefs();
const scene = createScene(dom);

bindControls({ socket, targetInput: dom.targetInput, directionSelect: dom.directionSelect });

socket.on("connect", () => {
  scene.setMyCubeId(socket.id);
  setSelfBadge(dom.selfBadge, socket.id);
});

socket.on("world:update", (state) => {
  scene.handleWorldUpdate(state);
});

scene.setup();
