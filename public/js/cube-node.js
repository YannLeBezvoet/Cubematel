export function createCubeNode(id, targetInput) {
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

export function drawCube(node, cube) {
  node.cubeShape.clear();
  node.cubeShape.lineStyle(2, 0x333333, 1);
  node.cubeShape.beginFill(0xcccccc, 1);
  node.cubeShape.drawRect(-40, -40, 80, 80);
  node.cubeShape.endFill();

  const upsideDown = cube.orientation === "upside_down";
  node.figure.scale.y = upsideDown ? -1 : 1;
  node.figure.position.set(0, upsideDown ? 10 : -10);

  node.figure.clear();
  node.figure.lineStyle(3, 0x000000, 1);
  node.figure.drawCircle(0, -15, 6);
  node.figure.moveTo(0, -9);
  node.figure.lineTo(0, 5);
  node.figure.moveTo(-8, -3);
  node.figure.lineTo(8, -3);
  node.figure.moveTo(-4, 5);
  node.figure.lineTo(-4, 15);
  node.figure.moveTo(4, 5);
  node.figure.lineTo(4, 15);
  node.figure.lineStyle(2, 0x000000, 1);
  node.figure.drawCircle(-2, -17, 1);
  node.figure.drawCircle(2, -17, 1);

  node.plate.clear();
  node.prop.clear();
  node.halo.clear();
  node.label.text = cube.playerName;
  node.mood.text = `${cube.character} - ${cube.emotion}`;
}
