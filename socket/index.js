// create a socket.io instance
const io = require("socket.io")(3000, {
  cors: {
    origin: "https://y4d8ts-3000.csb.app",
  },
});

// list of users
let users = [];

// add user to the list
function addUser(userId, socketId) {
  // if a user is not on the list, add it
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
}

// listen for a connection
io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("addUser", (userId) => {
    // add a user to the list
    addUser(userId, socket.id);
    // send the list of users to the client
    io.emit("getUsers", users);
  });

  // <------ Task 12 here------>
  // <------ Task 12 here------>

  // when the user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected");

    // remove user from the list
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
});
