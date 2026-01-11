import React, { useState, useEffect, useRef } from "react";
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
  const connectionRef = useRef(null);
  const recipientChatUserIdRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSendButton, setShowSendButton] = useState(false);

  // 🔥 IMPORTANT STATE
  const [recipientResolved, setRecipientResolved] = useState(false);

  const { recipientId, recipientName } = useParams();

  // =========================
  // 1️⃣ RESOLVE RECIPIENT CHAT USER ID
  // =========================
  useEffect(() => {
    const resolveRecipient = async () => {
      try {
        setRecipientResolved(false);

        const token = localStorage.getItem("authToken");
        if (!token) {
          toast.error("Authentication required");
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/api/chat/resolve-recipient/${recipientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        recipientChatUserIdRef.current = res.data;
        setRecipientResolved(true);
      } catch (err) {
        toast.error("Failed to resolve chat recipient");
        console.error(err);
      }
    };

    resolveRecipient();
  }, [recipientId]);

  // =========================
  // 2️⃣ SIGNALR CONNECTION (ONCE)
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

    connection.on("ReceiveMessage", (senderChatUserId, messageContent) => {
      const timestamp = new Date().toLocaleTimeString();

      setMessages((prev) => [
        ...prev,
        {
          senderName:
            senderChatUserId === recipientChatUserIdRef.current
              ? recipientName
              : "You",
          message: messageContent,
          timestamp,
        },
      ]);
    });

    connection
      .start()
      .then(() => {
        connectionRef.current = connection;
        console.log("✅ SignalR connected");
      })
      .catch((err) => {
        console.error("SignalR error", err);
        toast.error("Chat connection failed");
      });

    return () => {
      connection.stop();
    };
  }, []); // 🔥 MUST STAY EMPTY

  // =========================
  // 3️⃣ LOAD CHAT HISTORY (AFTER RESOLVE)
  // =========================
  useEffect(() => {
    if (!recipientResolved) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");

        const res = await axios.get(
          `${API_BASE_URL}/api/chat/messages/${recipientChatUserIdRef.current}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMessages(
          res.data.map((m) => ({
            senderName:
              m.sender === recipientChatUserIdRef.current
                ? recipientName
                : "You",
            message: m.message,
            timestamp: new Date(m.timestamp).toLocaleTimeString(),
          }))
        );
      } catch (err) {
        toast.error("Failed to load messages");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [recipientResolved]);

  // =========================
  // 4️⃣ SEND MESSAGE
  // =========================
  const sendMessage = async () => {
    const connection = connectionRef.current;

    if (!connection || connection.state !== "Connected") {
      toast.error("Chat not connected");
      return;
    }

    if (!message.trim()) return;

    setSending(true);
    try {
      await connection.invoke(
        "SendMessage",
        recipientChatUserIdRef.current,
        message
      );
      setMessage("");
      setShowSendButton(false);
    } catch (err) {
      toast.error("Send failed");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // =========================
  // 5️⃣ UI
  // =========================
  return (
    <Container maxWidth="sm">
      <AppBar position="static" sx={{ bgcolor: "#4CAF50" }}>
        <Toolbar>
          <Typography variant="h6">{recipientName}</Typography>
        </Toolbar>
      </AppBar>

      <Box display="flex" flexDirection="column" height="80vh">
        <Box flex={1} bgcolor="#E5DDD5" p={2} overflow="auto">
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            messages.map((msg, i) => (
              <Box
                key={i}
                display="flex"
                justifyContent={
                  msg.senderName === "You" ? "flex-end" : "flex-start"
                }
                mb={1}
              >
                <Box
                  bgcolor={msg.senderName === "You" ? "#DCF8C6" : "#fff"}
                  borderRadius={2}
                  p={1}
                  maxWidth="70%"
                >
                  <Typography variant="body2">
                    <strong>{msg.senderName}:</strong> {msg.message}
                    <span style={{ fontSize: 11, marginLeft: 8 }}>
                      {msg.timestamp}
                    </span>
                  </Typography>
                </Box>
              </Box>
            ))
          )}
          <div ref={endOfMessagesRef} />
        </Box>

        <Box position="relative">
          <TextField
            fullWidth
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setShowSendButton(e.target.value.trim() !== "");
            }}
            placeholder="Type a message..."
          />
          {showSendButton && (
            <Button
              onClick={sendMessage}
              disabled={sending}
              sx={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                minWidth: 0,
                borderRadius: "50%",
              }}
            >
              <SendIcon />
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ChatComponent;
