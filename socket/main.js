// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Create an Express app
const app = express();
app.use(cors());

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.io server
const io = new Server(server, {
  cors: {
    origin: "https://y4d8ts-3000.csb.app:3000", // Allow React app domain
    methods: ["GET", "POST"],
  },
});

// Handle Socket.io connections
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Listen for messages from clients
  socket.on("chat message", (msg) => {
    console.log(`Message from ${socket.id}: ${msg}`);

    // Broadcast the message to all connected clients
    io.emit("chat message", msg);
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = 3005;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});
