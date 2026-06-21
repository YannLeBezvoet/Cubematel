# Cubematel — Application Context

> This file is the quick-orientation reference for all work on this repository.
> It must be updated whenever a change modifies the architecture, modules,
> business rules, network events, or visual conventions.

---

## Project nature

Cubematel is a real-time web recreation of the **Cube World by Mattel** toy (2004).
Each connected player receives an animated LCD cube containing a pixel-art character.
Cubes can be linked together — a player moves towards a target cube by choosing an available face (above, below, left, right).
The server is the single source of truth — the client never mutates state locally.

**Stack:**
- Server: Node.js ≥ 18, Express v5, Socket.IO v4 (CommonJS)
- Client: PixiJS v8 (via `/vendor`), GSAP v3 (via `/vendor`), native ES modules, Socket.IO client
- Tests: Vitest (`npm test` = `vitest run`, `npm run test:watch` = `vitest`)
- Typing: TypeScript in `checkJs + noEmit` mode — no compilation, verified via `npm run typecheck`
- No bundler, no front-end framework

**Getting started:**
```bash
npm install && npm start        # http://localhost:3000
npm test                        # unit tests (Vitest)
npm run typecheck               # TypeScript check (noEmit)
```

---

## Architecture

```
types/
└── cube.d.ts              # Shared source of truth: Cube, HistoryEntry, GameState interfaces

src/
├── server.js              # Express + Socket.IO bootstrap; exports { app, server, game }
├── socket-handlers.js     # Wires Socket.IO events; calls game.* then broadcastWorld
└── game/
    ├── index.js           # Re-exports CubeWorldGame, CHARACTER_DATA, CHARACTERS
    ├── cube-world-game.js # CubeWorldGame class — world state (Map<id, cube>); @ts-check
    ├── constants.js       # CHARACTER_DATA (22 stickmen: name→{color,prop,activity}); CHARACTERS list
    ├── coordinates.js     # Cube placement, movement and syncConnections on the grid
    ├── movements.js       # Translates a UI movement → { emotion, activity, orientation? }
    └── colors.js          # getCharacterColor — returns canonical colour for a character name

public/
├── index.html             # HTML entry point; loads PIXI + GSAP via /vendor, then app.js
├── app.js                 # Client entry point: creates socket, scene, binds controls
├── styles.css
├── tsconfig.json          # Client TS config (ESNext + DOM, checkJs:false, noEmit)
└── js/
    ├── globals.d.ts       # Extends Window: window.PIXI (PixiJS) and window.gsap (GSAP)
    ├── dom.js             # Barrel re-export for dom/ sub-modules
    ├── dom/
    │   ├── refs.js        # getDomRefs — all DOM element lookups
    │   ├── bindings.js    # bindControls — wires buttons to socket events
    │   └── ui.js          # setSelfBadge, updateCounters, updateDirectionButtons,
    │                      #   renderHistory, escapeHtml
    ├── scene/
    │   ├── index.js       # createScene() — factory; exposes setMyCubeId / handleWorldUpdate / setup
    │   ├── setup.js       # PixiJS initialisation, layers, ResizeObserver, background, ticker
    │   ├── world.js       # renderWorld() — diff cubeNodes, GSAP position/flip tweens; @ts-check
    │   ├── animation.js   # Ticker loop: sinusoidal bobbing (lerp and flip delegated to GSAP)
    │   ├── pan.js         # Camera drag, zoom and applyCameraTransform
    │   ├── background.js  # Stars + floating particles (decoration)
    │   └── errors.js      # showSceneError() — fatal error message in the scene
    └── renderers/
        ├── cube-node.js   # CubeNode class — PIXI container hierarchy and draw() method; @ts-check
        ├── stickman.js    # Public API barrel: drawStickman, drawProp
        └── stickman/
            ├── sprites.js # Pixel data: BODY_PIXELS (12×20) + ARMS_* pose arrays ([row,col] pairs)
            ├── body.js    # Sprite renderer: drawSprite, drawArmPixels, drawBody; exports P=3
            ├── arms.js    # Arm pose dispatch per emotion → drawArmPixels(gfx, ARMS_*)
            └── props.js   # Character prop icons (22 drawers); getCharacterPropDrawer(character)

tsconfig.json              # Server TS config (CommonJS, checkJs:false, noEmit)
vitest.config.mjs          # Vitest configuration (environment: node)
```

---

## Data model (cube)

```js
{
  id: string,            // socket.id
  playerName: string,    // "Player-XXXX"
  color: number,         // 0xRRGGBB — canonical per character (from CHARACTER_DATA)
  character: string,     // one of the 22 Cube World stickman names (see CHARACTER_DATA)
  orientation: string,   // "upright" | "upside_down"
  emotion: string,       // "happy" | "surprised" | "joyful" | "curious" | "disoriented"
  activity: string,      // text description of the current activity
  connectedTo: string[], // ids of adjacent cubes (recomputed by _syncConnections)
  x: number,             // position on the logical grid
  y: number,
}
```

**Broadcast state:** `game.getState()` → `{ cubes: cube[], history: { text, timestamp }[] }` (last 20 entries)

---

## Socket.IO events

| Direction      | Event             | Payload                            | Effect                                         |
|----------------|-------------------|------------------------------------|------------------------------------------------|
| Server→Client  | `world:update`    | `{ cubes, history }`               | Full world snapshot                            |
| Client→Server  | `cube:move`       | `{ movement }` (shake/flip/tilt/play) | Updates cube emotion + activity             |
| Client→Server  | `cubes:connect`   | `{ targetId, direction }` (`"above"/"below"/"left"/"right"`) | Moves the player to the indicated face of the target cube |
| Client→Server  | `cube:find-nearest` | — | Moves the player close to the nearest cube without direct contact |
| (auto)         | `connect`         | —                                  | Creates a cube for the new socket              |
| (auto)         | `disconnect`      | —                                  | Removes the cube and recomputes links          |

---

## Key business rules

1. Each player owns exactly one cube, identified by their `socket.id`.
2. Two cubes are neighbours only if they are **orthogonally adjacent** (Δx=1,Δy=0 or Δx=0,Δy=1).
3. On connection, it is the **player (source) who moves** to the chosen face of the target cube — the target stays still.
4. A face is unavailable if another cube already occupies it; the UI disables those faces automatically from the received world state.
5. Colour is deterministic — each character has a canonical 0xRRGGBB colour defined in CHARACTER_DATA.
6. `_syncConnections` rebuilds `connectedTo` from coordinates on every mutation.
7. The public history is limited to the **last 20 entries**.

---

## Visual rendering (PixiJS)

Each cube is a `PIXI.Container` with layers (bottom to top):
`plate` (shadow) → `halo` (coloured glow) → `cubeShape` (frame + LCD screen) → `figure` (stickman) → `prop` (character icon)

**Stickman:** pixel-art sprite, 12×20 LCD pixels, 1 LCD pixel = P=3 display px. Origin = waist (sprite row 11, col 6).
- Body pixel data in `stickman/sprites.js` (`BODY_PIXELS`); arm overlays as `[row,col]` pair lists.
- Arm pose by `emotion`: `surprised`→wide, `joyful`→play (Dodger raises right arm, others left), `curious`→right arm extended, default→neutral hanging.
- `upside_down`: `figure.scale.y = -1`, `figure.y = -15` (inverted gravity).
- LCD screen: 32×32 LCD pixels = 96×96 display px, centred at cube origin.
- Props: each character has a distinct pixel-art prop (see `set.md`), drawn at the bottom of the LCD screen. `getCharacterPropDrawer(character)` selects the correct draw function.

**Stage layer order (bottom → top):** `backgroundLayer` → `panOverlay` → `linksLayer` → `cubeLayer`.
`panOverlay` sits above the background but below all world content; it is never camera-transformed, so its hit area always covers the full screen.
`linksLayer` and `cubeLayer` are repositioned together by `applyCameraTransform` (pan.js) to implement camera movement.

**Animations:**
- **Bobbing**: sinusoidal per frame in the Pixi ticker (`animation.js`), intensity by emotion.
- **Position transition**: `gsap.to(node, { x, y, duration: 0.35, ease: 'power2.out' })` triggered from `world.js/layoutCubes` on each `world:update`.
- **Orientation flip**: `gsap.to(node.body, { rotation: Math.PI, ease: 'sine.inOut' })` from `world.js/startFlipAnimation`; `drawCube` called in `onComplete`. In-progress state tracked via `node.flipping` (boolean) and `node._pendingCube`.

---

## Important conventions

- The server **never** emits to an individual socket — everything goes through `io.emit('world:update', ...)`.
- `src/game.js` is a compatibility shim that re-exports `src/game/index.js`.
- `public/js/dom.js` is a barrel that re-exports from `dom/refs.js`, `dom/bindings.js`, and `dom/ui.js`.
- `public/js/renderers/stickman.js` is a barrel that assembles `drawStickman` / `drawProp` from `stickman/body.js`, `stickman/arms.js`, and `stickman/props.js`.
- Client modules use **native ES modules** (`import/export`); server modules use **CommonJS** (`require/module.exports`).
- `public/js/package.json` declares `"type": "module"` to enable ES modules in the client folder.
- `window.PIXI` and `window.gsap` are loaded via `<script src="/vendor/...">` and declared in `public/js/globals.d.ts`.
- The `Cube` type (and `HistoryEntry`, `GameState`) is defined **once** in `types/cube.d.ts` and imported via JSDoc `@typedef {import('...')}` on both server and client.
- **TypeScript**: `// @ts-check` enabled per file on complex modules (`cube-world-game.js`, `cube-node.js`, `world.js`). No compilation — `npm run typecheck` (tsc noEmit) to verify.

---

## Existing tests

Runner: **Vitest** (`npm test` = `vitest run`, `npm run test:watch` = `vitest`).

| File                       | What it covers                                                     |
|----------------------------|--------------------------------------------------------------------|
| `test/game.test.mjs`       | Connections, movements, colours, history (Vitest ESM format)       |
| `test/stickman.test.mjs`   | Stickman rendering: pixel coordinates (Vitest ESM format)          |
| `test/world.test.mjs`      | Pure helpers from `scene/world.js`: `findCubesWithNeighborBelow`   |
