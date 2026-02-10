import React, { useEffect, useRef, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  TextField,
  Typography,
  AppBar,
  Toolbar,
  Container,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useShop } from "./ShopContext";


const API_BASE_URL = "https://chat-api.connectfree4u.com";

const ChatComponent = () => {
  //const { chatUserId } = useParams(); // other participant
  const { threadId } = useParams(); // conversation thread

  const connectionRef = useRef(null);

  const [myChatUserId, setMyChatUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // =========================
  // 0️⃣ Resolve MY chat user
  // =========================

useEffect(() => {
  const token = localStorage.getItem("authToken");
  if (!token || !threadId) return;

  axios
    .get(`${API_BASE_URL}/api/chat/threads/${threadId}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      console.log("✅ Resolved myChatUserId:", res.data.chatUserId);
      setMyChatUserId(res.data.chatUserId);
    })
    .catch((err) => {
      console.error("❌ Failed to resolve chat identity", err?.response?.data || err.message);
      toast.error("Failed to resolve chat identity");
    });
}, [threadId]);



  //   axios
  //     .get(`${API_BASE_URL}/api/chat/me`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     })
  //     .then((res) => setMyChatUserId(res.data.chatUserId))
  //     .catch(() => toast.error("Failed to resolve chat identity"));
  // }, []);


  
  // =========================
  // 🔥 HARD RESET ON CHAT CHANGE
  // =========================
  useEffect(() => {
    setMessages([]);

    if (connectionRef.current) {
      connectionRef.current.stop();
      connectionRef.current = null;
      console.log("🔁 SignalR reset due to chat change");
    }
    }, [threadId]);
  //}, [chatUserId]);

  // =========================
  // 1️⃣ SignalR connection
  // =========================
  useEffect(() => {
    //if (!myChatUserId || !chatUserId) return;
if (!myChatUserId || !threadId) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/chathub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    // connection.on("ReceiveMessage", (senderId, recipientId, text) => {
    //   if (senderId === chatUserId || recipientId === chatUserId) {
    //     setMessages((prev) => [
    //       ...prev,
    //       {
    //         from: senderId === myChatUserId ? "me" : "other",
    //         text,
    //         time: new Date().toLocaleTimeString(),
    //       },
    //     ]);
    //   }
    // });
// connection.on("ReceiveMessage", (recvThreadId, senderId, text) => {
//   if (recvThreadId !== threadId) return;

//   setMessages((prev) => [
//     ...prev,
//     {
//       from: senderId === myChatUserId ? "me" : "other",
//       text,
//       time: new Date().toLocaleTimeString(),
//     },
//   ]);
// });
connection.on("ReceiveMessage", (payload) => {
  console.log("📩 Incoming message:", payload, "myChatUserId:", myChatUserId);
  if (String(payload.threadId) !== String(threadId)) return;

  setMessages((prev) => [
    ...prev,
    {
      from: payload.senderChatUserId === myChatUserId ? "me" : "other",
      text: payload.message,
      time: new Date(payload.timestamp).toLocaleTimeString(),
    },
  ]);
});



   connection
  .start()
  .then(async () => {
    connectionRef.current = connection;
    console.log("✅ SignalR connected for chat:", threadId);

    await connection.invoke("JoinThread", threadId); // ✅ join group
    console.log("👥 Joined thread group:", threadId);
  })
  .catch(() => toast.error("Chat connection failed"));


    return () => {
      connection.stop();
    };
    }, [threadId, myChatUserId]);
  //}, [chatUserId, myChatUserId]);

  // =========================
  // 2️⃣ Load history
  // =========================
  useEffect(() => {
    //if (!myChatUserId || !chatUserId) return;
if (!myChatUserId || !threadId) return;
    setLoading(true);
    const token = localStorage.getItem("authToken");

    // axios
    //   .get(`${API_BASE_URL}/api/chat/messages/${chatUserId}`, {
    //     headers: { Authorization: `Bearer ${token}` },
    //   })
    axios.get(`${API_BASE_URL}/api/chat/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
        setMessages(
          res.data.map((m) => ({
            from: m.sender === myChatUserId ? "me" : "other",
            text: m.message,
            time: new Date(m.timestamp).toLocaleTimeString(),
          }))
        );
      })
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoading(false));
      }, [threadId, myChatUserId]);
  //}, [chatUserId, myChatUserId]);

  // =========================
  // 3️⃣ Send message
  // =========================
  const sendMessage = async () => {
    if (!message.trim()) return;

    const conn = connectionRef.current;
    if (!conn || conn.state !== "Connected") {
      toast.error("Chat not connected");
      return;
    }

    setSending(true);
    try {
      //await conn.invoke("SendMessage", chatUserId, message);
      await conn.invoke("SendMessage", threadId, message);
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <Container maxWidth="sm">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Chat</Typography>
        </Toolbar>
      </AppBar>

      <Box display="flex" flexDirection="column" height="80vh">
        <Box flex={1} p={2} overflow="auto">
          {loading ? (
            <Typography>Loading…</Typography>
          ) : (
            messages.map((m, i) => (
              <Box
                key={i}
                display="flex"
                justifyContent={m.from === "me" ? "flex-end" : "flex-start"}
                mb={1}
              >
                <Box
                  bgcolor={m.from === "me" ? "#DCF8C6" : "#fff"}
                  p={1}
                  borderRadius={2}
                >
                  {m.text}
                  <span style={{ fontSize: 10, marginLeft: 6 }}>
                    {m.time}
                  </span>
                </Box>
              </Box>
            ))
          )}
        </Box>

        <Box position="relative">
          <TextField
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message…"
          />
          <Button
            onClick={sendMessage}
            disabled={sending}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ChatComponent;
