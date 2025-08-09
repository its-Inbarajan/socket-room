import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { join } from "node:path";
import { IUser } from "./@types/type";
import { findAvailableUser } from "./utils/helper";
const app = express();
const httpServer = createServer(app);
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

let connectedUsers: IUser[] = [];

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on(
    "join_room",
    ({ name, userId }: { name: string; userId: string }) => {
      connectedUsers.push({
        userId: userId,
        socketId: socket.id,
        name: name,
        isAvailable: true,
      });

      const partner = findAvailableUser(connectedUsers, socket.id);
      console.log("Partner", partner);
      if (partner) {
        const roomId = `room-${partner.socketId}-${socket.id}`;
        console.log("RoomId", roomId);
        socket.join(roomId);
        // Telling socket get my partner socketid and make it join same room
        io.sockets.sockets.get(partner?.socketId!)?.join(socket.id);

        // After Join Make both of them unavailable
        connectedUsers = connectedUsers.map((user) =>
          user.socketId === socket.id || user.socketId === partner?.socketId
            ? { ...user, isAvailable: false }
            : user
        );

        // Send Room Info
        io.to(roomId).emit("roomCreated", {
          roomId,
          users: [
            { name, userId, socketId: socket.id },
            {
              name: partner.name,
              userId: partner.userId,
              socketId: partner.socketId,
            },
          ],
        });
      }
    }
  );

  socket.on("leave", (roomId: string) => {
    socket.leave(roomId);

    // Make Both user available again
    connectedUsers = connectedUsers.map((user) =>
      user.socketId === socket.id ? { ...user, isAvailable: false } : user
    );
    // Find other user in the room and mark them available
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    if (roomSockets) {
      roomSockets.forEach((id) => {
        connectedUsers = connectedUsers.map((u) =>
          u.socketId === id ? { ...u, isAvailable: true } : u
        );
      });
    }

    io.to(roomId).emit("roomClosed");
  });

  socket.on("message", (msg) => {
    console.log(`Message received: ${msg}`);
    io.emit("message", msg); // broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedUsers = connectedUsers.filter((u) => u.socketId !== socket.id);
  });
});

app.get("/", (_req, res) => {
  res.sendFile(join(__dirname, "/view/index.html"));
});

httpServer.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
