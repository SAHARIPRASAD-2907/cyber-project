import React, { useEffect, useState } from "react";
import { useStateWithCallbackLazy } from "use-state-with-callback";
import { user } from "../Join/Join";
import socketIo from "socket.io-client";
import "./chat.css";
import Message from "../Message/Message";
import ReactScrollToBottom from "react-scroll-to-bottom";
import { useHistory } from "react-router-dom";
import { randInt, gen_key, power, encrypy_msg, decrypt_msg } from "./elgamel";
// eslint-disable-next-line
const forge = require("node-forge");

let socket;

//const ENDPOINT = "https://chat-server-secure.herokuapp.com/";
const ENDPOINT = "http://localhost:4500";
// eslint-disable-next-line

export const Chat = () => {
  const [id, setid] = useState("");
  const [messages, setMessages] = useState([]);
  const [secure, setSecure] = useState("Not Secure retry");
  const [datas, setDatas] = useState({});
  const [users, setUsers] = useState([]);
  const [privateKeyValues, setPrivateKeyValues] = useState(0);
  const [elgamalValues, setElgmalValues] = useState([]);
  const [state, setState] = useStateWithCallbackLazy(false);
  const [state1, setState1] = useStateWithCallbackLazy(false);
  const [msgReceved, setMsgReceived] = useStateWithCallbackLazy([]);

  let history = useHistory();

  window.onload = () => {
    window.location.reload(history.push("/"));
  };
  const sendPrivate = () => {
    const usr = document.getElementById("items").value;
    // sending request to usr2 and id
    socket.emit("get-values-for-private-chat", { usr, id });
    console.log("The values are " + elgamalValues);
  };

  const sendPrivateMessage = () => {
    const usr = document.getElementById("items").value;
    const message = document.getElementById("chat-input").value;
    console.log("Step5:Encrypt app");
    console.log(state);

    const [h, q, g] = elgamalValues;
    console.log(q, g, h);
    const { en_msg, p } = encrypy_msg(message, q, h, g);
    console.log(en_msg);

    // encrypting value with elgamal values
    document.getElementById("chat-input").value = "";
    socket.emit("privateMessage", { en_msg, usr, id, p, q });
    console.log("Sending private message", usr, message);
  };

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
    const btn = document.getElementById("send-btn");
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
    socket.on("request", (data) => {
      console.log("Request sent");
      let { q, p } = data;
      console.log("q", q, "p", p);
      console.log("b", b);

      // Calculate B = q^b mod p
      let B = Math.pow(parseInt(q), b) % parseInt(p);
      console.log("B", B);

      // Send B to server and get K_a, A from server
      socket.emit("exchange", { B });
      setDatas({
        btn,
        b,
        p,
      });
    });

    console.log(socket);
    socket.emit("joined", { user });

    return () => {
      socket.disconnect();
      socket.off();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const btn = document.getElementById("send-btn");
    const { b, p } = datas;
    socket.on("exchange", (data) => {
      console.log("Exchange under process");
      let { K_a, A } = data;
      // Calculate K_b = A^b mod p
      const K_b = Math.pow(A, b) % p;
      console.log("K_b", K_b);

      // Check if both keys match
      if (K_a === K_b) {
        btn.className = "";
        btn.disabled = false;
        setSecure("Secure communication");
        // Send request to obtain AES-128 key and IV
        socket.emit("secure");
      } else {
        btn.className += "disabled";
        btn.disabled = true;
        setSecure("Not Secure retry");
      }
    });
  });

  useEffect(() => {
    socket.on("welcome", (data) => {
      console.log(data.usersInChat);
      const uindec = data.usersInChat.indexOf(user);
      data.usersInChat.splice(uindec, 1);
      setUsers(data.usersInChat);
      setMessages([...messages, data]);
      console.log(data.user, data.message);
    });

    socket.on("userJoined", (data) => {
      console.log(data.usersInChat);
      setUsers(data.usersInChat);
      setMessages([...messages, data]);
      console.log(data.user, data.message);
    });

    socket.on("leave", (data) => {
      console.log(data);
      setMessages([...messages, data]);
      console.log(data.user, data.message);
    });

    socket.on("request-for-value", ({ id }) => {
      const randInt = (min, max) =>
        Math.floor(min + Math.random() * (max - min + 1));
      console.log("step2:requesting for values");
      let q = randInt(100, 1000);
      console.log(q);
      let g = randInt(2, q);
      console.log(g);
      let key = gen_key(q);
      console.log("step3:key generated " + key);
      setSecure("waiting for message");
      setPrivateKeyValues(key);
      setSecure("Secure connection");
      let h = power(g, key, q);
      console.log(h);
      socket.emit("generated-value-for-user", { q, g, h, id });
    });

    // Request values from
    socket.on("sending-values-for-pchat", async ({ hval, qval, gval }) => {
      console.log("Values to chat privately with user");
      console.log(hval, qval, gval);
      setSecure("waiting for message");
      setElgmalValues([...elgamalValues, hval, qval, gval]);
      setSecure("Secure connection");
    });

    socket.on("private-message", ({ usr, en_msg, id, p, q }) => {
      setMsgReceived([...msgReceved, usr, en_msg, id, p, q]);
    });

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
  }, [messages, users]);

  useEffect(() => {
    console.log("one of the values changing in user1");
    if (elgamalValues.length) {
      console.log("Elgamal values updated " + elgamalValues);
      console.log("Private key value updated " + privateKeyValues);
      setState(true, () => {
        sendPrivateMessage();
        setState(false);
      });
    }
  }, [elgamalValues]);

  useEffect(() => {
    console.log("one of the values changing in user2");
    console.log(privateKeyValues, msgReceved.length);
    if (privateKeyValues && msgReceved.length) {
      console.log(msgReceved);
      const [usr, en_msg, id, p, q] = msgReceved;
      console.log("STEP6 decrypting message");
      console.log(en_msg);
      console.log("Private key+" + privateKeyValues);
      let msg = decrypt_msg(en_msg, p, privateKeyValues, q);
      const data2 = {
        user: usr,
        message: msg.join("").toString(),
        id,
      };
      console.log(data2);
      setMessages([...messages, data2, elgamalValues]);
      setPrivateKeyValues([]);
      setMsgReceived([]);
    }
  }, [privateKeyValues, msgReceved]);

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="header">
          <h2>Secure chat ({secure})</h2>
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
        <div className="input-box">
          <select id="items">
            {users.map((names) => (
              <option value={names}> {names} </option>
            ))}
          </select>
          <button onClick={sendPrivate} id="send-btn">
            Send Private
          </button>
        </div>
      </div>
    </div>
  );
};
