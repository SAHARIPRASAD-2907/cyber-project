import React from 'react'
import "./Message.css";
import nextId from "react-id-generator";


const Message = ({ user, message, classs }) => {
    const htmlId = nextId();
    if (user) {
        return (
            <div key={htmlId} className={`message-box ${classs}`}  >
                {`${user}: ${message}`}
            </div>
        )
    }
    else {


        return (
            <div key={htmlId} className={`message-box ${classs}`}>
                {`You: ${message}`}
            </div>
        )
    }
}

export default Message