const express = require("express");
const path = require("path");

const app = express();
const PORT = 3003;
const server = app.listen(PORT, () => console.log(`💬 server on port ${PORT}`));

const io = require("socket.io")(server);

let socketsConected = new Set();
let rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));
io.on("connection", onConnected);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

function onConnected(socket) {
  console.log("Socket connected", socket.id);
  socketsConected.add(socket.id);
  io.emit("clients-total", socketsConected.size);

  socket.on("join-room", (roomName) => {
    socket.join(roomName);
    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Set());
    }
    rooms.get(roomName).add(socket.id);
    socket.emit("room-joined", roomName);
    io.to(roomName).emit("clients-in-room", rooms.get(roomName).size);
  });

  socket.on("leave-room", (roomName) => {
    socket.leave(roomName);
    if (rooms.has(roomName)) {
      rooms.get(roomName).delete(socket.id);
      if (rooms.get(roomName).size === 0) {
        rooms.delete(roomName);
      } else {
        io.to(roomName).emit("clients-in-room", rooms.get(roomName).size);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected", socket.id);
    socketsConected.delete(socket.id);
    io.emit("clients-total", socketsConected.size);

    // Remove socket from all rooms
    rooms.forEach((clients, roomName) => {
      if (clients.has(socket.id)) {
        clients.delete(socket.id);
        if (clients.size === 0) {
          rooms.delete(roomName);
        } else {
          io.to(roomName).emit("clients-in-room", clients.size);
        }
      }
    });
  });

  socket.on("message", (data) => {
    if (data.room) {
      socket.to(data.room).emit("chat-message", data);
    } else {
      socket.broadcast.emit("chat-message", data);
    }
  });

  socket.on("feedback", (data) => {
    if (data.room) {
      socket.to(data.room).emit("feedback", data);
    } else {
      socket.broadcast.emit("feedback", data);
    }
  });
}
