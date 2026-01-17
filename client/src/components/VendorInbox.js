// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Typography,
//   List,
//   ListItem,
//   ListItemText,
//   Divider,
// } from "@mui/material";
// import { toast } from "react-toastify";

// const API_BASE_URL = "https://chat-api.connectfree4u.com";

// const VendorInbox = () => {
//   const [inbox, setInbox] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadInbox = async () => {
//       try {
//         const token = localStorage.getItem("authToken");
//         if (!token) {
//           toast.error("Login required");
//           return;
//         }

//         const res = await axios.get(
//           `${API_BASE_URL}/api/chat/inbox`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         setInbox(res.data);
//       } catch (err) {
//         toast.error("Failed to load inbox");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadInbox();
//   }, []);

//   if (loading) {
//     return <Typography>Loading inbox…</Typography>;
//   }

//   if (inbox.length === 0) {
//     return <Typography>No customer messages yet</Typography>;
//   }

//   return (
//     <Box maxWidth="sm" mx="auto" mt={2}>
//       <Typography variant="h6" gutterBottom>
//         📥 Customer Inbox
//       </Typography>

//       <List>
//         {inbox.map((item, index) => (
//           <React.Fragment key={item.chatUserId}>
//             <ListItem
//               button
//               onClick={() =>
//                 navigate(`/chat/${item.chatUserId}`)
//               }
//             >
//               <ListItemText
//                 primary={`Customer`}
//                 secondary={item.lastMessage}
//               />
//               <Typography variant="caption">
//                 {new Date(item.lastTimestamp).toLocaleTimeString()}
//               </Typography>
//             </ListItem>
//             {index < inbox.length - 1 && <Divider />}
//           </React.Fragment>
//         ))}
//       </List>
//     </Box>
//   );
// };

// export default VendorInbox;
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Typography,
//   List,
//   ListItem,
//   ListItemText,
//   Divider,
// } from "@mui/material";
// import { toast } from "react-toastify";
// import { useShop } from "./ShopContext";

// const API_BASE_URL = "https://chat-api.connectfree4u.com";

// const VendorInbox = () => {
//   const [inbox, setInbox] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();
//   const { shop } = useShop(); // ✅ shop context

//   useEffect(() => {
//     const loadInbox = async () => {
//       const token = localStorage.getItem("authToken");
//       if (!token) {
//         toast.error("Login required");
//         return;
//       }

//       if (!shop?.id) {
//         toast.error("Please select a shop");
//         navigate("/vendor/dashboard");
//         return;
//       }

//       try {
//         const res = await axios.get(
//           `${API_BASE_URL}/api/chat/inbox`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         setInbox(res.data);
//       } catch (err) {
//         toast.error("Failed to load inbox");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadInbox();
//   }, [shop, navigate]);

//   if (loading) {
//     return <Typography>Loading inbox…</Typography>;
//   }

//   if (inbox.length === 0) {
//     return <Typography>No customer messages yet</Typography>;
//   }

//   return (
//     <Box maxWidth="sm" mx="auto" mt={2}>
//       <Typography variant="h6" gutterBottom>
//         📥 Customer Inbox
//       </Typography>

//       <List>
//         {inbox.map((item, index) => (
//           <React.Fragment key={item.chatId}>
//             <ListItem
//               button
//               onClick={() => navigate(`/chat/${item.chatId}`)}
//             >
//               <ListItemText
//                 primary={item.customerName || "Customer"}
//                 secondary={item.lastMessage}
//               />
//               <Typography variant="caption">
//                 {new Date(item.lastTimestamp).toLocaleTimeString()}
//               </Typography>
//             </ListItem>
//             {index < inbox.length - 1 && <Divider />}
//           </React.Fragment>
//         ))}
//       </List>
//     </Box>
//   );
// };

// export default VendorInbox;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "https://chat-api.connectfree4u.com";

const VendorInbox = () => {
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    // 🔐 1️⃣ Auth check
    if (!token) {
      navigate("/");
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch {
      navigate("/");
      return;
    }

    // 🔐 2️⃣ ROLE CHECK (THIS WAS MISSING)
    if (decoded.role !== "vendor") {
      toast.error("Vendor access required");
      navigate("/");
      return;
    }

    // 🔐 3️⃣ Load inbox only for vendor
    const loadInbox = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/chat/inbox`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setInbox(res.data);
      } catch (err) {
        toast.error("Failed to load inbox");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInbox();
  }, [navigate]);

  if (loading) {
    return <Typography>Loading inbox…</Typography>;
  }

  if (inbox.length === 0) {
    return <Typography>No customer messages yet</Typography>;
  }

  return (
    <Box maxWidth="sm" mx="auto" mt={2}>
      <Typography variant="h6" gutterBottom>
        📥 Customer Inbox
      </Typography>

      <List>
        {inbox.map((item, index) => (
          <React.Fragment key={item.chatUserId}>
            <ListItem
              button
              onClick={() => navigate(`/chat/${item.chatUserId}`)}
            >
              <ListItemText
                primary="Customer"
                secondary={item.lastMessage}
              />
              <Typography variant="caption">
                {new Date(item.lastTimestamp).toLocaleTimeString()}
              </Typography>
            </ListItem>
            {index < inbox.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default VendorInbox;
