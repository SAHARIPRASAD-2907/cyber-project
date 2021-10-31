import React, { useEffect, useState } from "react";
import { user } from "../Join/Join";
import socketIo from "socket.io-client";
import "./chat.css";
import Message from "../Message/Message";
import ReactScrollToBottom from "react-scroll-to-bottom";
// eslint-disable-next-line
const forge = require("node-forge");

let socket;

const ENDPOINT = "http://localhost:4500/";
// eslint-disable-next-line

export const Chat = () => {
  const [id, setid] = useState("");
  const [messages, setMessages] = useState([]);
  // Sending message to server
  const send = () => {
    const message = document.getElementById("chat-input").value;
    //console.log(message);
    // Generate AES-128 key and IV
    const key = forge.random.getBytesSync(16);
    const iv = forge.random.getBytesSync(16);
    //console.log(`Key : ${key}, IV : ${iv}`);
    // Encrypt message
    const cipher = forge.cipher.createCipher("AES-CBC", key);
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(message));
    cipher.finish();
    const encryptedMsg = cipher.output;
    //console.log("Encrypted text",encryptedMsg);
    socket.emit("message", { encryptedMsg, id, key, iv });
    document.getElementById("chat-input").value = "";
    //console.log("secure", SECURE);
  };

  useEffect(() => {
    socket = socketIo(ENDPOINT, { transports: ["websocket"] });
    const btn = document.getElementById("send-btn")
    btn.className += "disabled";
    btn.disabled = true;
    socket.on("connect", () => {
      setid(socket.id);
    });
    console.log("FUNCTION RUNNING");
    const b = Math.floor(Math.random() * 9) + 1;
	// Send request to obtain p & q from server
	socket.emit("request");
	// Receive p & q from server
	socket.on("request", data => {
    console.log("Request sent");
		let { q, p } = data;
		console.log("q", q, "p", p);
		console.log("b", b);

		// Calculate B = q^b mod p
		let B = Math.pow(parseInt(q), b) % parseInt(p);
		console.log("B", B);

		// Send B to server and get K_a, A from server
		socket.emit("exchange", {B,q,p});
		socket.on("exchange", data => {
      console.log("Exchange under process");
			let { K_a, A } = data;
			// Calculate K_b = A^b mod p
			const K_b = Math.pow(A, b) % p;
			console.log("K_b", K_b);

			// Check if both keys match
			if (K_a === K_b) {
				btn.className = "";
				btn.disabled = false;
				alert("Connection secure.");
				// Send request to obtain AES-128 key and IV
				socket.emit("secure");
			} else {
				btn.className += "disabled";
				btn.disabled = true;
				alert("Connection not secure.");
			}
		});
	});
    
    
    console.log(socket);
    socket.emit("joined", { user });

    socket.on("welcome", (data) => {
      setMessages([...messages, data]);
      console.log(data.user, data.message);
    });

    socket.on("userJoined", (data) => {
      setMessages([...messages, data]);
      console.log(data.user, data.message);
    });

    socket.on("leave", (data) => {
      console.log(data);
      setMessages([...messages, data]);
      console.log(data.user, data.message);
    });

    return () => {
      socket.disconnect();
      socket.off();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    socket.on("sendMessage", ({ user, encryptedMsg, id, key, iv }) => {
      //console.log("The displayed data");
      //console.log("Encrypted text",encryptedMsg);
      //console.log(forge.util.createBuffer(encryptedMsg));
      const decipher = forge.cipher.createDecipher("AES-CBC", key);
      decipher.start({ iv: iv });
      decipher.update(forge.util.createBuffer(encryptedMsg));
      decipher.finish();
      //console.log("Result", decipher.output);
      const message = decipher.output.toString();
      //console.log(message);
      const data1 = {
        user,
        message,
        id,
      };
      setMessages([...messages, data1]);
    });
    return () => {
      socket.off();
    };
  }, [messages]);

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="header">
          <h2>Secure chat</h2>
          <p>
            <a href="/">Exit</a>
          </p>
        </div>
        <ReactScrollToBottom className="chat-box">
          {messages.map((item, i) => (
            <Message
              key={id}
              user={item.id === id ? "" : item.user}
              message={item.message}
              classs={item.id === id ? "right" : "left"}
            />
          ))}
        </ReactScrollToBottom>
        <div className="input-box">
          <input
            onKeyPress={(event) => (event.key === "Enter" ? send() : null)}
            type="text"
            id="chat-input"
          />
          <button onClick={send} id="send-btn">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
