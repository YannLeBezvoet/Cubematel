// @ts-check
/**
 * @file scene/background.js
 * @description Animated background layer: drifting stars and floating particles.
 *
 * `buildBackground` rebuilds the entire layer (call on init and resize).
 * `updateBackground` moves sprites each frame — called by scene/animation.js.
 *
 * No project-level imports — reads/writes sceneState and window.PIXI directly.
 *
 * @typedef {import('./world.js').SceneState} SceneState
 */

/**
 * Rebuilds stars and floaters for the current canvas size.
 * Must be called on init and on every resize.
 *
 * @param {SceneState} sceneState
 */
export function buildBackground(sceneState) {
  const PIXI = window.PIXI;
  const width = sceneState.app.screen.width;
  const height = sceneState.app.screen.height;
  const texture = PIXI.Texture.WHITE;

  sceneState.stars.forEach((entry) => sceneState.backgroundLayer.removeChild(entry.sprite));
  sceneState.floaters.forEach((entry) => sceneState.backgroundLayer.removeChild(entry.sprite));
  sceneState.stars = [];
  sceneState.floaters = [];

  createStars(sceneState, texture, width, height);
  createFloaters(sceneState, texture, width, height);
}

/**
 * Advances background sprite positions by one frame.
 * Called every tick by scene/animation.js.
 *
 * @param {SceneState} sceneState
 * @param {number} delta - PixiJS ticker delta (frames elapsed since last tick)
 */
export function updateBackground(sceneState, delta) {
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

/**
 * @param {SceneState} sceneState
 * @param {any} texture - PIXI.Texture.WHITE
 * @param {number} width
 * @param {number} height
 */
function createStars(sceneState, texture, width, height) {
  const PIXI = window.PIXI;
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
}

/**
 * @param {SceneState} sceneState
 * @param {any} texture - PIXI.Texture.WHITE
 * @param {number} width
 * @param {number} height
 */
function createFloaters(sceneState, texture, width, height) {
  const PIXI = window.PIXI;
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
