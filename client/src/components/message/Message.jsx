import "./message.css";
import moment from "moment";
import DefaultProfilePic from "../../images/noPic.png";
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

function Message({ message, personalMessage }) {
  const [senderData, setSenderData] = useState(null);

  useEffect(() => {
    const fetchSenderData = async () => {
      if (!personalMessage) { // Only fetch for messages from others
        try {
          const response = await axiosClient.get(`/users?userId=${message.sender}`);
          setSenderData(response.data);
        } catch (error) {
          console.error("Error fetching sender data:", error);
        }
      }
    };

    fetchSenderData();
  }, [message.sender, personalMessage]);

  return (
    <div className={personalMessage ? "message personalMessage" : "message"}>
      <div className="messageTop">
        <img 
          src={senderData?.profilePicture 
            ? `data:image/jpeg;base64,${senderData.profilePicture.split(',')[1]}`
            : DefaultProfilePic
          } 
          alt="" 
          className="messageImg" 
        />
        <p className="messageText">{message.message}</p>
      </div>
      <div className="messageBottom">
        {message.createdAt ? moment(message.createdAt).fromNow() : 'Just now'}
      </div>
    </div>
  );
}

export default Message;