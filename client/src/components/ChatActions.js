// // ChatActions.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";

// const CHAT_API = "https://chat-api.connectfree4u.com";

// const ChatActions = () => {
//   const navigate = useNavigate();
//   const [role, setRole] = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem("authToken");
//     if (!token) return;

//     try {
//       const decoded = jwtDecode(token);
//       setRole(decoded.role);
//     } catch {
//       setRole(null);
//     }
//   }, []);

//   if (!role) return null;

//   // CUSTOMER → Chat with Seller
//   if (role === "customer") {
//     return (
//       <button
//         className="chat-btn"
//         onClick={async () => {
//           try {
//             const token = localStorage.getItem("authToken");
//             if (!token) return alert("Login required");

//             const res = await fetch(`${CHAT_API}/api/chat/start`, {
//               method: "POST",
//               headers: {
//                 Authorization: `Bearer ${token}`,
//                 "Content-Type": "application/json",
//               },
//             });

//             if (!res.ok) {
//               alert(await res.text());
//               return;
//             }

//             const data = await res.json();
//             navigate(`/chat/${data.recipientChatUserId}`);
//           } catch (err) {
//             console.error(err);
//             alert("Failed to start chat");
//           }
//         }}
//       >
//         💬 Chat with Seller
//       </button>
//     );
//   }

//   // VENDOR → Inbox
//   if (role === "vendor") {
//     return (
//       <button
//         className="chat-btn"
//         onClick={() => navigate("/vendor/inbox")}
//       >
//         📥 Open Inbox
//       </button>
//     );
//   }

//   return null;
// };

// export default ChatActions;
// ChatActions.jsx
// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { useShop } from "./ShopContext";

// const CHAT_API = "https://chat-api.connectfree4u.com";

// const ChatActions = ({ shopId }) => {
//   const navigate = useNavigate();
//   const { shop } = useShop(); // ✅ context-driven
//   const token = localStorage.getItem("authToken");

//   // Not logged in → show nothing (or login CTA later)
//   if (!token) return null;

//   // ✅ VENDOR CONTEXT (shop selected)
//   if (shop?.id) {
//     return (
//       <button
//         className="chat-btn"
//         onClick={() => navigate("/vendor/inbox")}
//       >
//         📥 Open Inbox
//       </button>
//     );
//   }

//   // ✅ CUSTOMER CONTEXT (browsing a shop)
//   return (
//     <button
//       className="chat-btn"
//       onClick={async () => {
//         try {
//           const res = await fetch(`${CHAT_API}/api/chat/start`, {
//             method: "POST",
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ shopId }), // 🔑 explicit shop
//           });

//           if (!res.ok) {
//             alert(await res.text());
//             return;
//           }

//           const data = await res.json();
//           navigate(`/chat/${data.chatId}`); // 🔑 chatId, not userId
//         } catch (err) {
//           console.error(err);
//           alert("Failed to start chat");
//         }
//       }}
//     >
//       💬 Chat with Seller
//     </button>
//   );
// };

// export default ChatActions;
// ChatActions.jsx
// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";

// const CHAT_API = "https://chat-api.connectfree4u.com";

// const ChatActions = ({ shopId }) => {
//   const navigate = useNavigate();
//   const token = localStorage.getItem("authToken");

//   if (!token) return null;

//   let role = null;
//   try {
//     role = jwtDecode(token)?.role;
//   } catch {
//     return null;
//   }

//   // ✅ VENDOR → Inbox ONLY
//   if (role === "vendor") {
//     return (
//       <button
//         className="chat-btn"
//         onClick={() => navigate("/vendor/inbox")}
//       >
//         📥 Open Inbox
//       </button>
//     );
//   }

//   // ✅ CUSTOMER → Chat with Seller
//   if (role === "customer") {
//     return (
//       <button
//         className="chat-btn"
//         onClick={async () => {
//           try {
//             const res = await fetch(`${CHAT_API}/api/chat/start`, {
//               method: "POST",
//               headers: {
//                 Authorization: `Bearer ${token}`,
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify({ shopId }),
//             });

//             if (!res.ok) {
//               alert(await res.text());
//               return;
//             }

//             const data = await res.json();
//             navigate(`/chat/${data.chatId}`);
//           } catch (err) {
//             console.error(err);
//             alert("Failed to start chat");
//           }
//         }}
//       >
//         💬 Chat with Seller
//       </button>
//     );
//   }

//   return null;
// };

// export default ChatActions;
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
