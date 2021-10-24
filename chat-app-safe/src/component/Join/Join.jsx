import React, { useState } from "react";
import "./join.css";
import { Link } from "react-router-dom";

let user;
const sendUser = () => {
  user = document.getElementById("join-input").value;
  document.getElementById("join-input").value = "";
};
const Join = () => {
  const [name, setName] = useState("");
  return (
    <div className="join-page">
      <div className="join-container">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/ChatSecure_App_Icon.png/220px-ChatSecure_App_Icon.png"
          alt="logo"
        />
        <h1>Secure chat</h1>
        <input
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter Your Name"
          type="text"
          id="join-input"
        />
        <Link
          onClick={(event) => (!name ? event.preventDefault() : null)}
          to="/chat"
        >
          <button className="join-btn" onClick={sendUser}>
            Join room
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Join;
export { user };
