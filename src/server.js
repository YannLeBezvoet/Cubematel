// @ts-check
/**
 * @file src/server.js
 * @description Express + Socket.IO bootstrap.
 *
 * Responsibilities:
 *   - Create the Express application and HTTP server.
 *   - Attach Socket.IO and delegate each connection to registerSocketHandlers.
 *   - Serve static client files and vendor assets.
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
    console.log(`Cube World online started on http://localhost:${PORT}`);
  });
}

module.exports = { app, server, game };
