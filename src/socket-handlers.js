const { CHARACTERS } = require("./game");

// Branche les événements Socket.IO d'un cube sur un même flux simple.
function registerSocketHandlers(io, socket, game) {
  const playerName = `Joueur-${socket.id.slice(0, 4)}`;
  const preferredCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

  game.createCube(socket.id, playerName, preferredCharacter);
  broadcastWorld(io, game);

  socket.on("cube:move", ({ movement }) => {
    game.moveCube(socket.id, movement);
    broadcastWorld(io, game);
  });

  socket.on("cubes:connect", ({ targetId, direction }) => {
    game.connectCubes(socket.id, targetId, direction);
    broadcastWorld(io, game);
  });

  socket.on("disconnect", () => {
    game.removeCube(socket.id);
    broadcastWorld(io, game);
  });
}

// Diffuse l'état courant sans dupliquer la logique d'émission.
function broadcastWorld(io, game) {
  io.emit("world:update", game.getState());
}

module.exports = { registerSocketHandlers };
