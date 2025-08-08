import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { join } from "node:path";
const app = express();
const httpServer = createServer(app);
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("message", (msg) => {
    console.log(`Message received: ${msg}`);
    io.emit("message", msg); // broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.get("/", (_req, res) => {
  res.sendFile(join(__dirname, "/view/index.html"));
});

httpServer.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
