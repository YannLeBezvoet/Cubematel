const socket = io();
const historyList = document.getElementById("history");
const targetInput = document.getElementById("targetId");
const selfBadge = document.getElementById("selfBadge");
const cubeCount = document.getElementById("cubeCount");
const linkCount = document.getElementById("linkCount");
const cubeScene = document.getElementById("cubeScene");
let myCubeId = "";

const palettes = {
  Dodger: {
    top: 0x82dbff,
    left: 0x33a0d8,
    right: 0x1f6cba,
    glow: 0x7fd4ff,
    accent: 0xffbf47,
  },
  Whip: {
    top: 0xffd886,
    left: 0xff9d52,
    right: 0xd15d54,
    glow: 0xffb776,
    accent: 0x8be5b2,
  },
};

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
};

function showSceneError(text) {
  if (sceneState.hasFatalError) {
    return;
  }
  sceneState.hasFatalError = true;
  cubeScene.innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
}

socket.on("connect", () => {
  myCubeId = socket.id;
  selfBadge.textContent = `Mon cube : ${myCubeId.slice(0, 6)}`;
});

document.querySelectorAll("[data-move]").forEach((button) => {
  button.addEventListener("click", () => {
    socket.emit("cube:move", { movement: button.dataset.move });
  });
});

document.getElementById("connectBtn").addEventListener("click", () => {
  const targetId = targetInput.value.trim();
  const direction = document.getElementById("direction").value;
  if (!targetId) {
    return;
  }
  socket.emit("cubes:connect", { targetId, direction });
});

function renderHistory(history) {
  if (!history.length) {
    historyList.innerHTML = '<li class="empty-state">La ville attend ses premiers mouvements.</li>';
    return;
  }

  historyList.innerHTML = history
    .slice()
    .reverse()
    .map((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return `<li class="history-item"><span>${time}</span>${escapeHtml(entry.text)}</li>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}

function getPose(cube) {
  const byEmotion = {
    happy: {
      body: [0, -4, 0, 26],
      leftArm: [0, 8, -16, 0],
      rightArm: [0, 8, 16, 0],
      leftLeg: [0, 26, -12, 44],
      rightLeg: [0, 26, 12, 44],
      mouth: [-8, -12, 0, -7, 8, -12],
    },
    surpris: {
      body: [0, -4, 0, 27],
      leftArm: [0, 6, -20, -10],
      rightArm: [0, 6, 20, -10],
      leftLeg: [0, 27, -10, 45],
      rightLeg: [0, 27, 10, 45],
      mouth: [0, -8, 4],
    },
    joyeux: {
      body: [0, -6, 0, 26],
      leftArm: [0, 5, -14, -8],
      rightArm: [0, 5, 20, -4],
      leftLeg: [0, 26, -11, 45],
      rightLeg: [0, 26, 13, 40],
      mouth: [-9, -12, 0, -5, 9, -12],
    },
    curieux: {
      body: [0, -5, -4, 27],
      leftArm: [-2, 8, -20, 6],
      rightArm: [-2, 8, 17, -1],
      leftLeg: [-4, 27, -15, 45],
      rightLeg: [-4, 27, 8, 45],
      mouth: [-7, -10, 0, -7, 7, -10],
    },
    désorienté: {
      body: [0, -6, 5, 24],
      leftArm: [3, 7, -17, 12],
      rightArm: [3, 7, 18, 0],
      leftLeg: [5, 24, -8, 45],
      rightLeg: [5, 24, 14, 45],
      mouth: [-8, -9, 0, -13, 8, -9],
    },
  };
  return byEmotion[cube.emotion] || byEmotion.happy;
}

function createCubeNode(id) {
  const PIXI = window.PIXI;
  const container = new PIXI.Container();
  const cubeShape = new PIXI.Graphics();
  const halo = new PIXI.Graphics();
  const figure = new PIXI.Graphics();
  const prop = new PIXI.Graphics();
  const plate = new PIXI.Graphics();
  const label = new PIXI.Text("", {
    fontFamily: "Arial",
    fontSize: 12,
    fill: 0xedf4ff,
    fontWeight: "700",
  });
  const mood = new PIXI.Text("", {
    fontFamily: "Arial",
    fontSize: 11,
    fill: 0xbdd2f5,
  });

  label.anchor.set(0.5, 0);
  mood.anchor.set(0.5, 0);
  label.y = 58;
  mood.y = 74;

  container.addChild(plate, halo, cubeShape, figure, prop, label, mood);
  container.eventMode = "static";
  container.cursor = "pointer";
  container.on("pointertap", () => {
    targetInput.value = id;
    targetInput.focus();
  });

  return {
    id,
    container,
    cubeShape,
    halo,
    figure,
    prop,
    plate,
    label,
    mood,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    phase: Math.random() * Math.PI * 2,
    cube: null,
  };
}

function drawCube(node, cube) {
  const palette = palettes[cube.character] || palettes.Dodger;
  const pose = getPose(cube);

  node.plate.clear();
  node.plate.beginFill(0x02060f, 0.42);
  node.plate.drawEllipse(0, 44, 38, 10);
  node.plate.endFill();

  node.halo.clear();
  node.halo.lineStyle(12, palette.glow, 0.18);
  node.halo.drawCircle(0, -8, 35);

  node.cubeShape.clear();
  node.cubeShape.lineStyle(2, 0xffffff, 0.24);
  node.cubeShape.beginFill(palette.left, 1);
  node.cubeShape.drawRoundedRect(-30, -34, 60, 60, 10);
  node.cubeShape.endFill();
  node.cubeShape.beginFill(palette.top, 0.96);
  node.cubeShape.drawRoundedRect(-30, -34, 60, 18, 10);
  node.cubeShape.endFill();
  node.cubeShape.beginFill(palette.right, 0.2);
  node.cubeShape.drawRoundedRect(-30, -16, 60, 42, 10);
  node.cubeShape.endFill();

  const figureScaleY = cube.orientation === "upside_down" ? -1 : 1;
  const originY = cube.orientation === "upside_down" ? 30 : -2;
  node.figure.scale.y = figureScaleY;
  node.figure.position.set(0, originY);
  node.prop.scale.y = figureScaleY;
  node.prop.position.set(0, originY);

  node.figure.clear();
  node.figure.lineStyle(4, 0xf8fbff, 1);
  node.figure.drawCircle(0, -20, 8);
  node.figure.moveTo(pose.body[0], pose.body[1]);
  node.figure.lineTo(pose.body[2], pose.body[3]);
  node.figure.moveTo(pose.leftArm[0], pose.leftArm[1]);
  node.figure.lineTo(pose.leftArm[2], pose.leftArm[3]);
  node.figure.moveTo(pose.rightArm[0], pose.rightArm[1]);
  node.figure.lineTo(pose.rightArm[2], pose.rightArm[3]);
  node.figure.moveTo(pose.leftLeg[0], pose.leftLeg[1]);
  node.figure.lineTo(pose.leftLeg[2], pose.leftLeg[3]);
  node.figure.moveTo(pose.rightLeg[0], pose.rightLeg[1]);
  node.figure.lineTo(pose.rightLeg[2], pose.rightLeg[3]);
  node.figure.lineStyle(2, 0x0d2038, 1);
  node.figure.drawCircle(-3, -22, 1.2);
  node.figure.drawCircle(3, -22, 1.2);
  if (pose.mouth.length === 3) {
    node.figure.drawCircle(pose.mouth[0], pose.mouth[1], pose.mouth[2]);
  } else {
    node.figure.moveTo(pose.mouth[0], pose.mouth[1]);
    node.figure.quadraticCurveTo(pose.mouth[2], pose.mouth[3], pose.mouth[4], pose.mouth[5]);
  }

  node.prop.clear();
  if (cube.character === "Dodger") {
    node.prop.lineStyle(2, 0x062138, 1);
    node.prop.beginFill(palette.accent, 1);
    node.prop.drawCircle(18, 18, 7);
    node.prop.endFill();
    node.prop.moveTo(11, 18);
    node.prop.lineTo(25, 18);
    node.prop.moveTo(18, 11);
    node.prop.lineTo(18, 25);
  } else {
    node.prop.lineStyle(5, palette.accent, 1);
    node.prop.moveTo(10, 0);
    node.prop.bezierCurveTo(26, 3, 32, 18, 18, 28);
    node.prop.lineStyle(0);
    node.prop.beginFill(palette.accent, 1);
    node.prop.drawCircle(11, 28, 3.2);
    node.prop.endFill();
  }

  node.label.text = cube.playerName;
  node.mood.text = `${cube.character} - ${cube.emotion}`;
  node.cubeShape.tint = cube.id === myCubeId ? 0xfff7dc : 0xffffff;
}

function buildBackground() {
  const PIXI = window.PIXI;
  const width = sceneState.app.screen.width;
  const height = sceneState.app.screen.height;
  const texture = PIXI.Texture.WHITE;

  sceneState.stars.forEach((entry) => sceneState.backgroundLayer.removeChild(entry.sprite));
  sceneState.floaters.forEach((entry) => sceneState.backgroundLayer.removeChild(entry.sprite));
  sceneState.stars = [];
  sceneState.floaters = [];

  const starCount = 380;
  for (let i = 0; i < starCount; i += 1) {
    const sprite = new PIXI.Sprite(texture);
    const size = 1 + Math.random() * 2.4;
    sprite.width = size;
    sprite.height = size;
    sprite.tint = i % 3 === 0 ? 0xb8d6ff : 0xe5f3ff;
    sprite.alpha = 0.28 + Math.random() * 0.52;
    sprite.x = Math.random() * width;
    sprite.y = Math.random() * height;
    sceneState.backgroundLayer.addChild(sprite);
    sceneState.stars.push({
      sprite,
      speed: 0.05 + Math.random() * 0.28,
      drift: (Math.random() - 0.5) * 0.22,
    });
  }

  const floaterCount = 160;
  for (let i = 0; i < floaterCount; i += 1) {
    const sprite = new PIXI.Sprite(texture);
    const size = 6 + Math.random() * 16;
    sprite.width = size;
    sprite.height = size;
    sprite.anchor.set(0.5);
    sprite.tint = i % 2 === 0 ? 0x1c3555 : 0x2d4870;
    sprite.alpha = 0.07 + Math.random() * 0.12;
    sprite.x = Math.random() * width;
    sprite.y = Math.random() * height;
    sceneState.backgroundLayer.addChild(sprite);
    sceneState.floaters.push({
      sprite,
      velocityX: (Math.random() - 0.5) * 0.2,
      velocityY: (Math.random() - 0.5) * 0.2,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function updateBackground(delta) {
  const width = sceneState.app.screen.width;
  const height = sceneState.app.screen.height;

  sceneState.stars.forEach((star) => {
    star.sprite.y += star.speed * delta;
    star.sprite.x += star.drift * delta;
    if (star.sprite.y > height + 2) {
      star.sprite.y = -2;
      star.sprite.x = Math.random() * width;
    }
    if (star.sprite.x < -2) {
      star.sprite.x = width + 2;
    } else if (star.sprite.x > width + 2) {
      star.sprite.x = -2;
    }
  });

  sceneState.floaters.forEach((item) => {
    item.phase += 0.01 * delta;
    item.sprite.x += item.velocityX * delta + Math.sin(item.phase) * 0.05;
    item.sprite.y += item.velocityY * delta + Math.cos(item.phase) * 0.04;
    if (item.sprite.x < -20) item.sprite.x = width + 20;
    if (item.sprite.x > width + 20) item.sprite.x = -20;
    if (item.sprite.y < -20) item.sprite.y = height + 20;
    if (item.sprite.y > height + 20) item.sprite.y = -20;
  });
}

function syncCubes(cubes) {
  const existingIds = new Set(sceneState.cubeNodes.keys());
  cubes.forEach((cube) => {
    if (!sceneState.cubeNodes.has(cube.id)) {
      const node = createCubeNode(cube.id);
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

function layoutCubes(cubes) {
  const width = sceneState.app.screen.width;
  const columns = Math.max(2, Math.floor((width - 90) / 120));
  const left = 60;
  const top = 70;
  const gapX = 110;
  const gapY = 110;

  cubes.forEach((cube, index) => {
    const node = sceneState.cubeNodes.get(cube.id);
    if (!node) return;
    const col = index % columns;
    const row = Math.floor(index / columns);
    node.targetX = left + col * gapX;
    node.targetY = top + row * gapY;
  });
}

function drawLinks() {
  sceneState.linkGraphics.clear();
  sceneState.linkGraphics.lineStyle(2.5, 0x7fd4ff, 0.42);
  sceneState.links.forEach(([source, target]) => {
    const a = sceneState.cubeNodes.get(source);
    const b = sceneState.cubeNodes.get(target);
    if (!a || !b) return;
    sceneState.linkGraphics.moveTo(a.container.x, a.container.y);
    sceneState.linkGraphics.lineTo(b.container.x, b.container.y);
  });
}

function renderWorld(state) {
  sceneState.latestWorld = state;
  const cubes = state.cubes.slice().sort((a, b) => {
    if (a.id === myCubeId) return -1;
    if (b.id === myCubeId) return 1;
    return a.playerName.localeCompare(b.playerName, "fr");
  });

  cubeCount.textContent = `${cubes.length} ${cubes.length > 1 ? "cubes" : "cube"}`;
  const uniqueLinks = new Set(
    cubes.flatMap((cube) => cube.connectedTo.map((target) => [cube.id, target].sort().join("::")))
  );
  linkCount.textContent = `${uniqueLinks.size} ${uniqueLinks.size > 1 ? "liens" : "lien"}`;
  renderHistory(state.history);

  syncCubes(cubes);
  layoutCubes(cubes);

  sceneState.links = [...uniqueLinks].map((entry) => entry.split("::"));
  cubes.forEach((cube) => {
    const node = sceneState.cubeNodes.get(cube.id);
    if (!node) return;
    node.cube = cube;
    drawCube(node, cube);
  });
}

function animate(delta) {
  updateBackground(delta);

  sceneState.cubeNodes.forEach((node) => {
    node.phase += 0.05 * delta;
    const bobIntensity =
      node.cube && node.cube.emotion === "joyeux"
        ? 4.5
        : node.cube && node.cube.emotion === "surpris"
          ? 3.3
          : 2.1;
    const bob = Math.sin(node.phase) * bobIntensity;
    node.x += (node.targetX - node.x) * 0.11;
    node.y += (node.targetY + bob - node.y) * 0.11;
    node.container.position.set(node.x, node.y);
  });

  drawLinks();
}

function setupScene() {
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
    showSceneError("Impossible de lancer la scène 2D sur ce navigateur.");
    return;
  }

  const view = app.view || app.canvas;
  cubeScene.appendChild(view);
  const width = Math.max(1, cubeScene.clientWidth);
  const height = Math.max(1, cubeScene.clientHeight);
  app.renderer.resize(width, height);

  sceneState.app = app;
  sceneState.backgroundLayer = new PIXI.Container();
  sceneState.linksLayer = new PIXI.Container();
  sceneState.cubeLayer = new PIXI.Container();
  sceneState.linkGraphics = new PIXI.Graphics();
  sceneState.linksLayer.addChild(sceneState.linkGraphics);

  app.stage.addChild(sceneState.backgroundLayer);
  app.stage.addChild(sceneState.linksLayer);
  app.stage.addChild(sceneState.cubeLayer);

  buildBackground();
  app.ticker.add((delta) => {
    try {
      animate(delta);
    } catch (error) {
      console.error("Erreur de rendu PixiJS", error);
      app.ticker.stop();
      showSceneError("Erreur de rendu de la scène 2D.");
    }
  });
  const resizeScene = () => {
    app.renderer.resize(Math.max(1, cubeScene.clientWidth), Math.max(1, cubeScene.clientHeight));
    buildBackground();
  };
  if (typeof ResizeObserver === "function") {
    sceneState.resizeObserver = new ResizeObserver(resizeScene);
    sceneState.resizeObserver.observe(cubeScene);
  } else {
    window.addEventListener("resize", resizeScene);
  }
  requestAnimationFrame(() => {
    app.renderer.resize(Math.max(1, cubeScene.clientWidth), Math.max(1, cubeScene.clientHeight));
    buildBackground();
  });
  sceneState.ready = true;
  try {
    renderWorld(sceneState.latestWorld);
  } catch (error) {
    console.error("Erreur de synchronisation de la scène", error);
    showSceneError("Impossible d'afficher les cubes dans la scène 2D.");
  }
}

socket.on("world:update", (state) => {
  if (!state || !Array.isArray(state.cubes)) {
    return;
  }
  if (!sceneState.ready) {
    sceneState.latestWorld = state;
    return;
  }
  try {
    renderWorld(state);
  } catch (error) {
    console.error("Erreur lors de world:update", error);
    showSceneError("Erreur lors de la mise a jour de la scène.");
  }
});

setupScene();
