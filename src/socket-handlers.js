// @ts-check
/**
 * @file src/socket-handlers.js
 * @description Socket.IO event wiring for a connected cube.
 *
 * Responsibilities:
 *   - Bind Socket.IO events (cube:move, cubes:connect, disconnect)
 *     to the game business methods.
 *   - Broadcast the world state after each mutation via broadcastWorld.
 *
 * @dependencies src/game
 */

const { CHARACTERS } = require("./game");

/**
 * @typedef {import('./game/cube-world-game').CubeWorldGame} CubeWorldGame
 */

/**
 * Wires all Socket.IO events for a cube through a single handler.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {CubeWorldGame} game
 */
function registerSocketHandlers(io, socket, game) {
  const playerName = `Player-${socket.id.slice(0, 4)}`;
  const preferredCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

  game.createCube(socket.id, playerName, preferredCharacter);
  broadcastWorld(io, game);

  socket.on("cube:move", (/** @type {{ movement: string }} */ { movement }) => {
    game.moveCube(socket.id, movement);
    broadcastWorld(io, game);
  });

  socket.on("cubes:connect", (/** @type {{ targetId: string, direction: "above" | "below" | "left" | "right" }} */ { targetId, direction }) => {
    game.connectCubes(socket.id, targetId, direction);
    broadcastWorld(io, game);
  });

  socket.on("disconnect", () => {
    game.removeCube(socket.id);
    broadcastWorld(io, game);
  });
}

/**
 * Broadcasts the current world state to all connected clients.
 *
 * @param {import('socket.io').Server} io
 * @param {CubeWorldGame} game
 */
function broadcastWorld(io, game) {
  io.emit("world:update", game.getState());
}

module.exports = { registerSocketHandlers };
