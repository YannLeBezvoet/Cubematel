// @ts-check
/**
 * @file src/socket-handlers.js
 * @description Branchement des événements Socket.IO pour un cube connecté.
 *
 * Responsabilités :
 *   - Associer les événements Socket.IO (cube:move, cubes:connect, disconnect)
 *     aux méthodes métier du jeu.
 *   - Diffuser l'état monde après chaque mutation via broadcastWorld.
 *
 * @dependencies src/game
 */

const { CHARACTERS } = require("./game");

/**
 * @typedef {import('./game/cube-world-game').CubeWorldGame} CubeWorldGame
 */

/**
 * Branche les événements Socket.IO d'un cube sur un même flux simple.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {CubeWorldGame} game
 */
function registerSocketHandlers(io, socket, game) {
  const playerName = `Joueur-${socket.id.slice(0, 4)}`;
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
 * Diffuse l'état monde courant à tous les clients connectés.
 *
 * @param {import('socket.io').Server} io
 * @param {CubeWorldGame} game
 */
function broadcastWorld(io, game) {
  io.emit("world:update", game.getState());
}

module.exports = { registerSocketHandlers };
