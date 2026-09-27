// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import { useShop } from "./ShopContext";

// const CHAT_API = "https://chat-api.jusping.com";

// const ChatActions = () => {
//   const navigate = useNavigate();
//   const { shop } = useShop();
//   const token = localStorage.getItem("authToken");
//   console.log("ChatActions debug:", {
//   tokenExists: !!token,
//   shop,
//   shopId: shop?.id
// });

//   if (!token || !shop?.id) return null;

//   let role;
//   try {
//     role = jwtDecode(token)?.role;
//   } catch {
//     return null;
//   }

//   // Vendor → Inbox
//   if (role === "vendor") {
//     return (
//       <button className="chat-btn" onClick={() => navigate("/vendor/inbox")}>
//         📥 Open Inbox
//       </button>
//     );
//   }

//   // Customer → Chat with seller
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
//               body: JSON.stringify({ shopId: shop.id }),
//             });

//             if (!res.ok) {
//               alert(await res.text());
//               return;
//             }

//             const data = await res.json();
//             navigate(`/chat/${data.threadId}`);
//           } catch {
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

const CHAT_API = "https://chat-api.jusping.com";

const ChatActions = ({ shopId }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  if (!token) return null;

  let role;

  try {
    role = jwtDecode(token)?.role;
  } catch (error) {
    console.error("Invalid JWT:", error);
    return null;
  }

  // Vendor → Inbox
  // No shopId requirement for displaying the Inbox button
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

  // Customer → Chat with seller
  if (role === "customer") {
    if (!shopId) {
      console.warn("ChatActions: Seller shopId is missing");
      return null;
    }

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
              body: JSON.stringify({ shopId }),
            });

            if (!res.ok) {
              alert(await res.text());
              return;
            }

            const data = await res.json();

            navigate(`/chat/${data.threadId}`);
          } catch (error) {
            console.error("Failed to start chat:", error);
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