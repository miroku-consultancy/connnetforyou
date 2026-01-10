import React, { useEffect, useRef, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";

const API_BASE_URL = "https://chat-api.connectfree4u.com";

// 🔴 TEMP VALUES (CHANGE ONLY THESE)
const TENANT_ID = "ffe286fa-7297-4e3e-b550-08d7b7a96dd2";
const RECIPIENT_ID = "7b5100e6-10d7-47a0-8fa9-0ec64d92c696";

export default function ChatTest() {
  const connectionRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/chathub?tenantId=${TENANT_ID}`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (senderId, message) => {
      setMessages(prev => [...prev, { senderId, message }]);
    });

    connection.start()
      .then(() => {
        console.log("✅ SignalR connected");
        setStatus("connected");
        connectionRef.current = connection;
      })
      .catch(err => {
        console.error("❌ SignalR failed", err);
        setStatus("error");
      });

    return () => {
      connection.stop();
    };
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      await connectionRef.current.invoke(
        "SendMessage",
        RECIPIENT_ID,
        text
      );
      setText("");
    } catch (err) {
      console.error("❌ Send failed", err);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h2>Chat Test Page</h2>
      <p>Status: <b>{status}</b></p>

      <div style={{
        border: "1px solid #ccc",
        height: 300,
        overflowY: "auto",
        padding: 10,
        marginBottom: 10
      }}>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.senderId}</b>: {m.message}
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type message"
        style={{ width: "80%", padding: 8 }}
      />

      <button onClick={sendMessage} style={{ padding: 8, marginLeft: 5 }}>
        Send
      </button>
    </div>
  );
}
