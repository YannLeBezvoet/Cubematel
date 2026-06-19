# Cubematel

Real-time Node.js game inspired by Cube World, with a Socket.IO server and PixiJS rendering.

## Getting started

```bash
npm install
npm start
```

The project listens on `http://localhost:3000`.

## Commands

| Command | Role |
|---|---|
| `npm start` | starts the server |
| `npm test` | runs the logic tests |

## Architecture

```text
src/server.js
  -> Express + Socket.IO bootstrap
src/socket-handlers.js
  -> wires Socket.IO events
src/game.js
  -> simple compatibility shim for src/game/
src/game/
  -> game logic, colours, coordinates, movements
public/js/scene/
  -> PixiJS scene: initialisation, animation, rendering, camera pan, errors, background
public/js/renderers/
  -> entity rendering: LCD cube and pixel-art stickman
public/js/dom.js
  -> DOM access, controls, badges, history
```

## Business rules

1. A cube receives a character, a colour, and a free position.
2. Two cubes are neighbours only if they are orthogonally adjacent.
3. A face can only hold one neighbour.
4. The server remains the single source of truth.
5. The public history is limited to the last 20 entries.

## Key files

| File | Responsibility |
|---|---|
| `src/game/cube-world-game.js` | world state and mutations |
| `src/game/coordinates.js` | placement and alignment |
| `src/game/colors.js` | colour selection |
| `src/game/movements.js` | movement → action translation |
| `public/js/scene/index.js` | scene entry point, `createScene` factory |
| `public/js/scene/setup.js` | PixiJS initialisation and layers |
| `public/js/scene/pan.js` | camera and pan interactions |
| `public/js/scene/world.js` | server snapshot rendering |
| `public/js/scene/animation.js` | per-frame animation loop |
| `public/js/scene/background.js` | stars and background particles |
| `public/js/scene/errors.js` | fatal error display in the scene |
| `public/js/renderers/cube-node.js` | cube node factory and rendering (LCD frame + figure) |
| `public/js/renderers/stickman.js` | pixel-art stickman and prop icon drawing |

## Client folder structure

```text
public/js/
├── scene/          # PixiJS scene (setup, world rendering, animation, pan, background, errors)
├── renderers/      # Visual entities (LCD cube, pixel-art stickman)
└── dom.js          # DOM access and manipulation
```

## Visual rendering

Each cube is rendered as an LCD unit inspired by Cube World by Mattel:

- **Coloured frame**: rounded border in the character's colour.
- **LCD screen**: dark grey background simulating a liquid-crystal display.
- **Pixel-art stickman**: character made of black square blocks (4×4 px each).
- **Poses**: arms change according to emotion (`surpris`, `joyeux`, `curieux`, default).
- **Prop**: icon at the bottom of the screen — ball for Dodger, lasso for Whip.

## Tests

Tests cover movements, connections, colours, and cube alignment.
