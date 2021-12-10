const http = require("http");
const express = require("express");
const cors = require("cors");
const util = require("./primitive-roots");

//Socket setup
const socketIO = require("socket.io");
const { log } = require("console");

const app = express();
const port = 4500 || process.env.PORT;
const users = [{}];
const userNames = [];

app.use(cors());
app.get("/", (req, res) => {
  res.send("IT IS WORKING");
});

const server = http.createServer(app);

//connecting with server
const io = socketIO(server);

io.on("connection", (socket) => {
  console.log("New Connection");

  let q, p;
  const bits = 8;
  const a = Math.floor(Math.random() * 9) + 1;
  console.log("a", a);
  // Generate p and q
  [p, q] = util.genPrimes();

  // 1.) Send p & q to client
  socket.on("request", (data) => {
    console.log("Request recieved");
    console.log("q", q, "p", p);
    socket.emit("request", {
      q: q,
      p: p,
    });
  });

  // 3.) Exchange A & B
  socket.on("exchange", (data) => {
    console.log("B:", data);
    const { B } = data;
    // 2.) Calculate A = q^a mod p
    console.log(q);
    console.log(a);
    console.log(p);
    console.log("-----------------");
    const A = Math.pow(q, a) % p;
    console.log("A-", A);
    // Calculate K(a) = B^a mod p
    const K_a = Math.pow(B, a) % p;
    console.log("K_a", K_a);
    // Send A and K_a to client
    socket.emit("exchange", {
      K_a,
      A,
    });
  });

  socket.on("joined", ({ user }) => {
    users[socket.id] = user;
    userNames.push(user);
    let unique = [...new Set(userNames)];
    console.log(unique);
    console.log(`${user} has joined`);
    socket.broadcast.emit("userJoined", {
      user: "Admin",
      message: `${users[socket.id]} has joined`,
      usersInChat: unique,
    });

    socket.emit("welcome", {
      user: "Admin",
      message: `Welcome to the chat,${users[socket.id]} `,
      usersInChat: unique,
    });
  });

  socket.on("message", ({ encryptedMsg, id, key, iv }) => {
    io.emit("sendMessage", { user: users[id], encryptedMsg, id, key, iv });
    // user:users[id],message,id
  });

  // request for private chat values
  socket.on("get-values-for-private-chat", ({ usr, id }) => {
    console.log("Getting values for private chat");
    // id of user requested
    const obj = Object.keys(users).find((key) => users[key] == usr);
    //sending request to  get values
    io.sockets.in(obj).emit("request-for-value", { id });
  });
  socket.on("generated-value-for-user", ({ q, g, h, id }) => {
    console.log("Public values sent by user");
    console.log(q, g, h);
    io.sockets
      .in(id)
      .emit("sending-values-for-pchat", { qval: q, gval: g, hval: h, id });
  });

  socket.on("privateMessage", ({ en_msg, usr, id, p, q }) => {
    console.log(users);
    const obj = Object.keys(users).find((key) => users[key] == usr);
    console.log(obj);
    io.sockets
      .in(obj)
      .emit("private-message", {
        usr: users[id] + "(private)",
        en_msg,
        id,
        p,
        q,
      });
  });

  socket.on("disconnect", () => {
    const usr = userNames.indexOf(users[socket.id]);
    userNames.splice(usr, 1);
    console.log(userNames);
    socket.broadcast.emit("leave", {
      user: "Admin",
      message: `${users[socket.id]} has left`,
    });
    console.log("User left");
  });
});

server.listen(port, () => {
  console.log("Server working on port 4500");
});
