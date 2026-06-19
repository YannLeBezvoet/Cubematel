// @ts-check
/**
 * @file src/server.js
 * @description Bootstrap Express + Socket.IO.
 *
 * Responsabilités :
 *   - Créer l'application Express et le serveur HTTP.
 *   - Attacher Socket.IO et déléguer chaque connexion à registerSocketHandlers.
 *   - Servir les fichiers statiques du client et des vendors.
 *
 * @dependencies express, socket.io, src/game, src/socket-handlers
 */

const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { CubeWorldGame } = require("./game");
const { registerSocketHandlers } = require("./socket-handlers");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const game = new CubeWorldGame();

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/vendor", express.static(path.join(__dirname, "..", "node_modules")));

io.on("connection", (socket) => {
  registerSocketHandlers(io, socket, game);
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Cube World en ligne démarré sur http://localhost:${PORT}`);
  });
}

module.exports = { app, server, game };
