import "./chat.css";
import Header from "../../components/header/Header";
import ChatUser from "../../components/chatUser/ChatUser";
import Message from "../../components/message/Message";
import OnlineUsers from "../../components/onlineUsers/onlineUsers";
import { useSelector } from "react-redux";
import { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axiosClient";
import { io } from "socket.io-client";

function Chat() {
  // Redux state
  const { user } = useSelector((state) => state.user);

  // Component state
  const [chats, setChats] = useState([]);
  const [currChat, setCurrChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);

  // Refs
  const socket = useRef();
  const newMsgRef = useRef();
  const SOCKET_SERVER = process.env.REACT_APP_WEBSOCKET_URL;

  // Initialize socket connection with auth
  useEffect(() => {
    if (!socket.current && user) {
      console.log('Connecting to socket server:', SOCKET_SERVER);
      socket.current = io(SOCKET_SERVER, {
        transports: ['websocket'],
        reconnection: true,
        auth: {
          userId: user._id
        }
      });

      // Socket connection event handlers
      socket.current.on('connect', () => {
        console.log('Socket connected successfully');
      });

      socket.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Message listener
      socket.current.on("getMessage", (data) => {
        console.log("Received message:", data);
        setArrivalMessage({
          sender: data.senderId,
          message: data.message,
          createdAt: Date.now(),
        });
      });
    }

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        console.log('Disconnecting socket');
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [user, SOCKET_SERVER]);

  // Handle arriving messages
  useEffect(() => {
    if (arrivalMessage && currChat?.users.includes(arrivalMessage.sender)) {
      console.log("Adding arrival message to chat:", arrivalMessage);
      setMessages(prev => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, currChat]);

  // Connect user to socket and handle online users
  useEffect(() => {
    if (socket.current && user?._id) {
      console.log('Emitting addUser event with ID:', user._id);
      socket.current.emit("addUser", user._id);

      socket.current.on("getUsers", (users) => {
        console.log('Received online users:', users);
        console.log('Current user followings:', user.followings);
        
        const onlineFollowings = user.followings.filter(followingId => 
          users.some(u => u.userId === followingId)
        );
        
        console.log('Filtered online followings:', onlineFollowings);
        setOnlineUsers(onlineFollowings);
      });
    }

    return () => {
      if (socket.current) {
        socket.current.off("getUsers");
      }
    };
  }, [user]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axiosClient.get(`/chats/${user._id}`);
        setChats(res.data);
      } catch (err) {
        console.error("Error fetching chats:", err);
      }
    };
    if (user?._id) fetchChats();
  }, [user]);

  // Fetch messages for current chat
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axiosClient.get(`/messages/${currChat._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    if (currChat) fetchMessages();
  }, [currChat]);

  // Auto-scroll to new messages
  useEffect(() => {
    newMsgRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle chat selection
  const handleChatSelect = (chat) => {
    setCurrChat(chat);
  };

  // Handle message submission
  const handleMessageSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const receiverId = currChat.users.find((id) => id !== user._id);

    // Emit socket event first for instant feedback
    socket.current.emit("sendMessage", {
      senderId: user._id,
      receiverId,
      message: newMsg,
    });

    // Save message to database
    try {
      const messageData = {
        sender: user._id,
        message: newMsg,
        chatId: currChat._id,
      };

      const res = await axiosClient.post("/messages", messageData);
      setMessages([...messages, res.data]);
      setNewMsg("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <>
      <Header />
      <div className="chat">
        <div className="chatMenu">
          {chats.length > 0 ? (
            <>
              <h3 className="columnTitle">Chats</h3>
              {chats.map((chat) => (
                <div key={chat._id} onClick={() => handleChatSelect(chat)}>
                  <ChatUser chat={chat} cUser={user} />
                </div>
              ))}
            </>
          ) : (
            <span className="noChats">No chats yet</span>
          )}
        </div>

        <div className="chatBox">
          <div className="chatBoxContainer">
            {currChat ? (
              <>
                <div className="chatBoxTop">
                  {messages.map((message) => (
                    <div key={message._id} ref={newMsgRef}>
                      <Message
                        message={message}
                        personalMessage={message.sender === user._id}
                      />
                    </div>
                  ))}
                </div>
                <div className="chatBoxBottom">
                  <textarea
                    placeholder="Write something..."
                    className="chatMessageInput"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleMessageSend(e)}
                  />
                  <button className="chatSubmitButton" onClick={handleMessageSend}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <span className="defaultChatMessage">
                Please select a conversation to start a chat.
              </span>
            )}
          </div>
        </div>

        <div className="followedUsers">
          <div className="followedUsersContainer">
            {onlineUsers.length !== 0 && (
              <h3 className="columnTitle">Online Users</h3>
            )}
            <ul className="followedUsersList">
              <OnlineUsers
                onlineUsers={onlineUsers}
                currUser={user}
                setCurrChat={setCurrChat}
              />
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;