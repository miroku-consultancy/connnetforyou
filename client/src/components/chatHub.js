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

const API_BASE_URL = "https://chat-api.connectfree4u.com";

const ChatComponent = () => {
  const { chatUserId } = useParams();

  const connectionRef = useRef(null);
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // =========================
  // 1️⃣ SIGNALR CONNECTION
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/chathub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    // connection.on("ReceiveMessage", (senderChatUserId, content) => {
    //   setMessages((prev) => [
    //     ...prev,
    //     {
    //       from: senderChatUserId === chatUserId ? "other" : "me",
    //       text: content,
    //       time: new Date().toLocaleTimeString(),
    //     },
    //   ]);
    // });
connection.on("ReceiveMessage", (senderChatUserId, content) => {
  // ❗ Ignore messages from other customers
  if (senderChatUserId !== chatUserId) {
    // Later: increment inbox unread count
    return;
  }

  setMessages(prev => [
    ...prev,
    {
      from: "other",
      text: content,
      time: new Date().toLocaleTimeString(),
    },
  ]);
});

    connection
      .start()
      .then(() => {
        connectionRef.current = connection;
        console.log("✅ SignalR connected");
      })
      .catch(() => toast.error("Chat connection failed"));

    return () => connection.stop();
  }, [chatUserId]);

  // =========================
  // 2️⃣ LOAD CHAT HISTORY
  // =========================
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");

        const res = await axios.get(
          `${API_BASE_URL}/api/chat/messages/${chatUserId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setMessages(
          res.data.map((m) => ({
            from: m.sender === chatUserId ? "other" : "me",
            text: m.message,
            time: new Date(m.timestamp).toLocaleTimeString(),
          }))
        );
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chatUserId]);

  // =========================
  // 3️⃣ SEND MESSAGE
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
      await conn.invoke("SendMessage", chatUserId, message);
      setMessage("");
    } catch {
      toast.error("Send failed");
    } finally {
      setSending(false);
    }
  };

  // =========================
  // 4️⃣ UI
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
                  maxWidth="70%"
                >
                  <Typography variant="body2">
                    {m.text}
                    <span style={{ fontSize: 10, marginLeft: 6 }}>
                      {m.time}
                    </span>
                  </Typography>
                </Box>
              </Box>
            ))
          )}
          <div ref={bottomRef} />
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
              minWidth: 0,
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
