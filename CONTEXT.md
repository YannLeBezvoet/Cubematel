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
- Client: PixiJS v7 (via `/vendor`), GSAP v3 (via `/vendor`), native ES modules, Socket.IO client
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
    ├── index.js           # Re-exports CubeWorldGame, CHARACTERS, CUBE_COLORS
    ├── cube-world-game.js # CubeWorldGame class — world state (Map<id, cube>); @ts-check
    ├── constants.js       # CHARACTERS = ['Dodger','Whip']; CUBE_COLORS (12 hex colours)
    ├── coordinates.js     # Cube placement and connection on the grid
    ├── movements.js       # Translates a UI movement → { emotion, activity, orientation? }
    └── colors.js          # Picks a random available colour

public/
├── index.html             # HTML entry point; loads PIXI + GSAP via /vendor, then app.js
├── app.js                 # Client entry point: creates socket, scene, binds controls
├── styles.css
├── tsconfig.json          # Client TS config (ESNext + DOM, checkJs:false, noEmit)
└── js/
    ├── globals.d.ts       # Extends Window: window.PIXI (PixiJS) and window.gsap (GSAP)
    ├── dom.js             # getDomRefs, bindControls, setSelfBadge, DOM history
    ├── scene/
    │   ├── index.js       # createScene() — factory; exposes setMyCubeId / handleWorldUpdate / setup
    │   ├── setup.js       # PixiJS initialisation, layers, ResizeObserver, background, ticker
    │   ├── world.js       # renderWorld() — diff cubeNodes, GSAP position/flip tweens, history; @ts-check
    │   ├── animation.js   # Ticker loop: sinusoidal bobbing only (lerp and flip delegated to GSAP)
    │   ├── pan.js         # Camera drag and layer movement
    │   ├── background.js  # Stars + floating particles (decoration)
    │   └── errors.js      # showSceneError() — fatal error message in the scene
    └── renderers/
        ├── cube-node.js   # createCubeNode / drawCube — PIXI container for a cube; @ts-check
        └── stickman.js    # drawStickman / drawProp — pixel art (P=3px grid)

tsconfig.json              # Server TS config (CommonJS, checkJs:false, noEmit)
vitest.config.mjs          # Vitest configuration (environment: node)
```

---

## Data model (cube)

```js
{
  id: string,            // socket.id
  playerName: string,    // "Player-XXXX"
  color: number,         // 0xRRGGBB (one of the 12 CUBE_COLORS)
  character: string,     // "Dodger" | "Whip"
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
| (auto)         | `connect`         | —                                  | Creates a cube for the new socket              |
| (auto)         | `disconnect`      | —                                  | Removes the cube and recomputes links          |

---

## Key business rules

1. Each player owns exactly one cube, identified by their `socket.id`.
2. Two cubes are neighbours only if they are **orthogonally adjacent** (Δx=1,Δy=0 or Δx=0,Δy=1).
3. On connection, it is the **player (source) who moves** to the chosen face of the target cube — the target stays still.
4. A face is unavailable if another cube already occupies it; the UI disables those faces automatically from the received world state.
5. Colour is chosen randomly from unused colours.
6. `_syncConnections` rebuilds `connectedTo` from coordinates on every mutation.
7. The public history is limited to the **last 20 entries**.

---

## Visual rendering (PixiJS)

Each cube is a `PIXI.Container` with layers (bottom to top):
`plate` (shadow) → `halo` (coloured glow) → `cubeShape` (frame + LCD screen) → `figure` (stickman) → `prop` (character icon)

**Stickman:** pixel-art grid, 1 unit = P=3px. Origin = hip centre.
- Arm pose by `emotion`: `surprised`→wide, `joyful`→play (Dodger/Whip differ), `curious`→curious, default→down.
- `upside_down`: `figure.scale.y = -1`, `figure.y = -19` (inverted gravity).
- Props: ball (Dodger) or lasso (Whip), always at the bottom of the LCD screen.

**Animations:**
- **Bobbing**: sinusoidal per frame in the Pixi ticker (`animation.js`), intensity by emotion.
- **Position transition**: `gsap.to(node, { x, y, duration: 0.35, ease: 'power2.out' })` triggered from `world.js/layoutCubes` on each `world:update`.
- **Orientation flip**: `gsap.to(node.body, { rotation: Math.PI, ease: 'sine.inOut' })` from `world.js/startFlipAnimation`; `drawCube` called in `onComplete`. In-progress state tracked via `node.flipping` (boolean) and `node._pendingCube`.

---

## Important conventions

- The server **never** emits to an individual socket — everything goes through `io.emit('world:update', ...)`.
- `src/game.js` is a compatibility shim that re-exports `src/game/index.js`.
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
