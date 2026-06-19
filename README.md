# Cubematel

A real-time web recreation of the **Cube World** toy by Mattel (2004).

Each connected player gets an animated LCD cube containing a pixel-art stickman character. Cubes can be physically linked together — players move their cube towards others by snapping onto any free face (above, below, left, right).

## Getting started

**Requirements:** Node.js ≥ 18

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Each browser tab becomes a new player.

## How to play

When you connect, you are assigned a random **Cube World character** with their own colour and personality prop.

### Moving your character

Use the movement buttons to animate your stickman:

| Action | Effect |
|--------|--------|
| Shake | Your character looks surprised |
| Flip | Your character flips upside down |
| Tilt | Your character gets disoriented |
| Play | Your character plays with their prop |

### Connecting cubes

Click **Find nearest** to snap your cube next to another player's cube.

Once near another cube, you can choose a face — **above**, **below**, **left**, or **right** — to physically link your cube to theirs. A face is grayed out if it is already occupied.

## Characters

There are **22 Cube World characters** across 5 series (2005–2008), each with a unique colour and prop. See [set.md](set.md) for the full list.

## Development

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | TypeScript check (no emit) |

For architecture, module map, data model, Socket.IO events, and rendering conventions, see [CONTEXT.md](CONTEXT.md).
