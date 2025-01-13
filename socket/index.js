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
    origin: "https://y4d8ts-3000.csb.app", // React app domain
    methods: ["GET", "POST"],
  },
});

// List of users
let users = [];

// Function to add a user to the list
function addUser(userId, socketId) {
  // If the user is not already in the list, add them
  if (!users.some((user) => user.userId === userId)) {
    users.push({ userId, socketId });
  }
}

// Function to remove a user from the list
function removeUser(socketId) {
  users = users.filter((user) => user.socketId !== socketId);
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // Listen for 'addUser' event to add a new user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    console.log("User added:", userId);
    io.emit("getUsers", users);
  });

  // Listen for 'sendMessage' event to handle incoming messages
  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    // Find the receiver in the users list
    const user = users.find((user) => user.userId === receiverId);
    if (user) {
      // Send the message to the specific user
      io.to(user.socketId).emit("getMessage", {
        senderId,
        message,
      });
      console.log(`Message from ${senderId} to ${receiverId}: ${message}`);
    } else {
      console.log(`User ${receiverId} not found.`);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

// Start the server on port 3005
const PORT = 3005;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
