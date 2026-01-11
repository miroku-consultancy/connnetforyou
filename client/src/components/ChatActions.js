// ChatActions.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const CHAT_API = "https://chat-api.connectfree4u.com";

const ChatActions = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setRole(decoded.role);
    } catch {
      setRole(null);
    }
  }, []);

  if (!role) return null;

  // CUSTOMER → Chat with Seller
  if (role === "customer") {
    return (
      <button
        className="chat-btn"
        onClick={async () => {
          try {
            const token = localStorage.getItem("authToken");
            if (!token) return alert("Login required");

            const res = await fetch(`${CHAT_API}/api/chat/start`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (!res.ok) {
              alert(await res.text());
              return;
            }

            const data = await res.json();
            navigate(`/chat/${data.recipientChatUserId}`);
          } catch (err) {
            console.error(err);
            alert("Failed to start chat");
          }
        }}
      >
        💬 Chat with Seller
      </button>
    );
  }

  // VENDOR → Inbox
  if (role === "vendor") {
    return (
      <button
        className="chat-btn"
        onClick={() => navigate("/vendor/inbox")}
      >
        📥 Open Inbox
      </button>
    );
  }

  return null;
};

export default ChatActions;
