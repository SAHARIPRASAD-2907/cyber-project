import React, { useEffect } from "react";
import { user } from "../Join/Join";
import socketIo from "socket.io-client";
import "./chat.css";
// eslint-disable-next-line 
const forge = require("node-forge");

const ENDPOINT = "http://localhost:4500/";
// eslint-disable-next-line 
let SECURE = false;

export const Chat = () => {
  const socket = socketIo(ENDPOINT, { transports: ["websocket"] });
  useEffect(() => {
    socket.on("connect", () => {
      alert("Connected");
      socket.emit("joined", { user });
      socket.on("welcome", ({ user, message }) => {
        console.log(user, message);
      });
      socket.on('userJoined',(data)=>{
      console.log(data.user,data.message);
      })
      return () => {};
    });
    // eslint-disable-next-line 
  }, []);
  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="header"></div>
        <div className="chat-box"></div>
        <div className="input-box">
          <input type="text" id="chat-input" />
          <button id="send-btn">Send</button>
        </div>
      </div>
    </div>
  );
};
