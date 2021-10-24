const http = require("http");
const express = require("express");
const cors = require("cors");
const util = require("./primitive-roots");

//Socket setup
const socketIO = require("socket.io");

const app = express();
const port = 4500 || process.env.PORT;
const users = [{}];

app.use(cors());
app.get("/", (req, res) => {
  res.send("IT IS WORKING");
});

const server = http.createServer(app);

//connecting with server
const io = socketIO(server);

io.on("connection", (socket) => {
  console.log("New connection");
  socket.on("joined", ({ user }) => {
    users[socket.id] = user;
    console.log(user, " has joined");
  });
  socket.emit("welcome", { user: "Admin", message: "Welcome to the chat " });
  socket.broadcast.emit("userJoined", {
    user: "Admin",
    message: "User has joined",
  });
  
});

server.listen(port, () => {
  console.log("Server working on port 4500");
});
