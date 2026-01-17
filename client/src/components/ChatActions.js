import React from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useShop } from "./ShopContext";

const CHAT_API = "https://chat-api.connectfree4u.com";

const ChatActions = () => {
  const navigate = useNavigate();
  const { shop } = useShop();   // ✅ source of truth
  const token = localStorage.getItem("authToken");

  if (!token || !shop?.id) return null;

  let role;
  try {
    role = jwtDecode(token)?.role;
  } catch {
    return null;
  }

  // ✅ VENDOR → Inbox ONLY
  if (role === "vendor") {
    return (
      <button className="chat-btn" onClick={() => navigate("/vendor/inbox")}>
        📥 Open Inbox
      </button>
    );
  }

  // ✅ CUSTOMER → Chat with Seller
  if (role === "customer") {
    return (
      <button
        className="chat-btn"
        onClick={async () => {
          try {
            const res = await fetch(`${CHAT_API}/api/chat/start`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ shopId: shop.id }), // 🔥 GUARANTEED
            });

            if (!res.ok) {
              alert(await res.text());
              return;
            }

            const data = await res.json();
            //navigate(`/chat/${data.chatId}`);
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

  return null;
};

export default ChatActions;
