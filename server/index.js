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
	socket.on("request", data => {
    console.log("Request recieved");
		console.log("q", q, "p", p);
		socket.emit("request", {
			q: q,
			p: p
		});
	});

	// 3.) Exchange A & B
	socket.on("exchange", data => {
		console.log("B:", data);
		const {B} = data;
		// 2.) Calculate A = q^a mod p
    console.log(q);
    console.log(a);
    console.log(p);
    console.log("-----------------");
		const A = Math.pow(q, a) % p;
    console.log("A-",A);
		// Calculate K(a) = B^a mod p
		const K_a = Math.pow(B, a) % p;
    console.log("K_a",K_a);
		// Send A and K_a to client
		socket.emit("exchange", {
			K_a,
			A
		});
	});

  socket.on("joined", ({ user }) => {
    users[socket.id] = user;
    console.log(`${user} has joined`);
    socket.broadcast.emit("userJoined", {
      user: "Admin",
      message: `${users[socket.id]} has joined`,
    });
    socket.emit("welcome", {
      user: "Admin",
      message: `Welcome to the chat,${users[socket.id]} `,
    });
  });

  socket.on("message", ({ encryptedMsg, id, key, iv }) => {
    io.emit("sendMessage", { user: users[id], encryptedMsg, id, key, iv });
    // user:users[id],message,id
  });

  socket.on("disconnect", () => {
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
