import React, { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Box,
    Button,
    TextField,
    Typography,
    AppBar,
    Toolbar,
    Container,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send'; // Import the Send icon
//import { API_BASE_URL } from '../Config/api';

const API_BASE_URL = 'https://chat-api.connectfree4u.com';
const ChatComponent = () => {
    const connectionRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showSendButton, setShowSendButton] = useState(false);
    const { recipientId, recipientName } = useParams();
    const endOfMessagesRef = useRef(null);
    const recipientIdRef = useRef(recipientId);
const recipientNameRef = useRef(recipientName);

useEffect(() => {
  recipientIdRef.current = recipientId;
  recipientNameRef.current = recipientName;
}, [recipientId, recipientName]);


//     useEffect(() => {
//         // const token = localStorage.getItem('jwtToken');
//         // const newConnection = new HubConnectionBuilder()
//         //     .withUrl(`${API_BASE_URL}/chathub?token=${token}`)
//         //     .build();
// //         const token = localStorage.getItem("jwtToken");

// // const newConnection = new HubConnectionBuilder()
// //   .withUrl(`${API_BASE_URL}/chathub`, {
// //     accessTokenFactory: () => token ?? ""
// //   })
// //   .build();
// const token = localStorage.getItem("jwtToken");
// const tenantId = localStorage.getItem("tenantId");
// //localStorage.setItem("tenantId", "ffe286fa-7297-4e3e-b550-08d7b7a96dd2");


// const newConnection = new HubConnectionBuilder()
//   .withUrl(
//     `${API_BASE_URL}/chathub?tenantId=${tenantId}`,
//     {
//       accessTokenFactory: () => token ?? ""
//     }
//   )
//   .withAutomaticReconnect()
//   .build();


//         newConnection.on('ReceiveMessage', (senderId, messageContent) => {
//             const timestamp = new Date().toLocaleTimeString();
//             setMessages(prevMessages => [
//                 ...prevMessages,
//                 { senderName: senderId === recipientId ? recipientName : 'You', message: messageContent, timestamp }
//             ]);
//         });

//         newConnection.start()
//             .then(() => {
//                 setConnection(newConnection);
//                 console.log('Connected to SignalR hub');
//             })
//             .catch(error => {
//                 console.error('Connection failed: ', error);
//             });

//         return () => {
//             if (newConnection) {
//                 newConnection.stop();
//                 console.log('Disconnected from SignalR hub');
//             }
//         };
//     }, [recipientId, recipientName]);
useEffect(() => {
//   const token = localStorage.getItem("jwtToken");
//   const tenantId = localStorage.getItem("tenantId");

//   const connection = new HubConnectionBuilder()
//     .withUrl(
//       `${API_BASE_URL}/chathub?tenantId=${tenantId}`,
//       {
//         accessTokenFactory: () => token ?? ""
//       }
//     )
//     .withAutomaticReconnect()
//     .build();
const token = localStorage.getItem("jwtToken");

// 🔴 PHASE-1 HARDCODE TENANT
const tenantId = "ffe286fa-7297-4e3e-b550-08d7b7a96dd2";

const connection = new HubConnectionBuilder()
  .withUrl(
    `${API_BASE_URL}/chathub?access_token=${token}&tenantId=${tenantId}`
  )
  .withAutomaticReconnect()
  .build();


//   connection.on("ReceiveMessage", (senderId, messageContent) => {
//     const timestamp = new Date().toLocaleTimeString();
//     setMessages(prev => [
//       ...prev,
//       {
//         senderName: senderId === recipientId ? recipientName : "You",
//         message: messageContent,
//         timestamp
//       }
//     ]);
//   });
connection.on("ReceiveMessage", (senderId, messageContent) => {
  const timestamp = new Date().toLocaleTimeString();
  setMessages(prev => [
    ...prev,
    {
      senderName:
        senderId === recipientIdRef.current
          ? recipientNameRef.current
          : "You",
      message: messageContent,
      timestamp
    }
  ]);
});
connection.onreconnecting(() => {
  toast.warn("Reconnecting chat...");
});

connection.onreconnected(() => {
  toast.success("Chat reconnected");
});

connection.onclose(() => {
  toast.error("Chat disconnected");
});



  connection
    .start()
    .then(() => {
      console.log("SignalR connected");
      connectionRef.current = connection;
    })
    .catch(err => console.error("SignalR error", err));

  return () => {
    connection.stop();
  };
}, []); // 🔥 EMPTY DEPENDENCY ARRAY — THIS IS CRITICAL


    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/chat/messages/${recipientId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                    }
                });
                setMessages(response.data.map(msg => ({
                    senderName: msg.sender === recipientId ? recipientName : 'You',
                    message: msg.message,
                    timestamp: new Date(msg.timestamp).toLocaleTimeString()
                })));
            } catch (error) {
                console.error("Error fetching messages:", error);
                toast.error('Failed to load messages. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [recipientId, recipientName]);

    useEffect(() => {
        if (endOfMessagesRef.current) {
            setTimeout(() => {
                endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages]);

    // const sendMessage = async () => {
    //     if (connection && message.trim() !== '') {
    //         setSending(true);
    //         try {
    //             await connection.send('SendMessage', recipientId, message);
    //             const timestamp = new Date().toLocaleTimeString();
    //             //setMessages(prevMessages => [...prevMessages, { senderName: 'You', message, timestamp }]);
    //             setMessage('');
    //             setShowSendButton(false);
    //         } catch (error) {
    //             console.error('Send message failed: ', error);
    //             toast.error('Failed to send message.');
    //         } finally {
    //             setSending(false);
    //         }
    //     } else {
    //         toast.warn('Message cannot be empty.');
    //     }
    // };
const sendMessage = async () => {
  const connection = connectionRef.current;

  if (!connection || connection.state !== "Connected") {
    toast.error("Chat not connected");
    return;
  }

  if (!message.trim()) return;

  setSending(true);
  try {
    await connection.invoke("SendMessage", recipientId, message);
    setMessage("");
    setShowSendButton(false);
  } catch (error) {
    console.error("Send message failed:", error);
    toast.error("Failed to send message");
  } finally {
    setSending(false);
  }
};


    return (
        <Container maxWidth="sm">
            <AppBar position="static" sx={{ bgcolor: '#4CAF50' }}> {/* Change to your desired color */}
    <Toolbar>
        <Typography variant="h6">{recipientName}</Typography>
    </Toolbar>
</AppBar>

            <Box display="flex" flexDirection="column" height="80vh" mt={0}>
                <Box flex={1} bgcolor="#E5DDD5" p={2} overflow="auto">
                    {loading ? (
                        <Typography>Loading messages...</Typography>
                    ) : (
                        messages.map((msg, index) => (
                            <Box
                                key={index}
                                display="flex"
                                justifyContent={msg.senderName === 'You' ? 'flex-end' : 'flex-start'}
                                mb={1}
                            >
                                <Box
                                    bgcolor={msg.senderName === 'You' ? '#DCF8C6' : '#fff'}
                                    borderRadius={2}
                                    p={1}
                                    sx={{
                                        maxWidth: '70%',
                                    }}
                                >
                                    <Typography variant="body2">
                                        <strong>{msg.senderName}:</strong> {msg.message}
                                        <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '10px' }}>{msg.timestamp}</span>
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                    <div ref={endOfMessagesRef} />
                </Box>
                <Box display="flex" mt={0} position="relative">
    <TextField
        variant="outlined"
        fullWidth
        multiline
        value={message}
        onChange={e => {
            setMessage(e.target.value);
            setShowSendButton(e.target.value.trim() !== '');
        }}
        placeholder="Type a message..."
        onFocus={() => setShowSendButton(true)}
        onBlur={() => !message && setShowSendButton(false)}
        sx={{ 
            bgcolor: '#fff',
            resize: 'none', // Prevent resizing the textarea
            overflow: 'hidden', // Hide overflow
            height: '50px', // Fixed height
            paddingRight: '60px', // Space for the button
        }} 
        inputProps={{
            style: {
                height: 'auto', // Allow input to auto-adjust
                padding: '10px', // Padding for better spacing
            },
        }}
    />
    {showSendButton && (
        <Button
            variant="contained"
            sx={{
                bgcolor: '#28a745', // WhatsApp-like green
                color: 'white',
                position: 'absolute',
                right: 10, // Position button on the right
                top: '50%', // Center vertically
                transform: 'translateY(-50%)', // Adjust for perfect centering
                minWidth: 0, // Prevent button from expanding
                width: '30px', // Adjust button width
                height: '30px', // Adjust button height
                borderRadius: '50%', // Make the button round
                '&:hover': {
                    bgcolor: '#218838', // Darker green on hover
                },
            }}
            onClick={sendMessage}
            disabled={sending}
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
