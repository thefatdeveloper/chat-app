import "./chat.css";
import Header from "../../components/header/Header";
import ChatUser from "../../components/chatUser/ChatUser";
import Message from "../../components/message/Message";
import OnlineUsers from "../../components/onlineUsers/OnlineUsers";

function Chat() {
  // Create states

  // Get all chats of a user
  return (
    <>
      <Header />

      <div className="chat">
        <div className="chatMenu">
          {/* Map over the fetched chats */}
          <ChatUser />
        </div>

        <div className="chatBox">
          <div className="chatBoxContainer">
            <Message />
          </div>
        </div>

        <div className="followedUsers">
          <OnlineUsers />
        </div>
      </div>
    </>
  );
}

export default Chat;
