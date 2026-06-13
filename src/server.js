const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { CubeWorldGame, CHARACTERS } = require("./game");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const game = new CubeWorldGame();

app.use(express.static(path.join(__dirname, "..", "public")));

io.on("connection", (socket) => {
  const playerName = `Joueur-${socket.id.slice(0, 4)}`;
  const preferredCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  game.createCube(socket.id, playerName, preferredCharacter);
  io.emit("world:update", game.getState());

  socket.on("cube:move", ({ movement }) => {
    game.moveCube(socket.id, movement);
    io.emit("world:update", game.getState());
  });

  socket.on("cubes:connect", ({ targetId, direction }) => {
    game.connectCubes(socket.id, targetId, direction);
    io.emit("world:update", game.getState());
  });

  socket.on("disconnect", () => {
    game.removeCube(socket.id);
    io.emit("world:update", game.getState());
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Cube World en ligne démarré sur http://localhost:${PORT}`);
  });
}

module.exports = { app, server, game };
