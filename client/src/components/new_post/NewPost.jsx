import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import DefaultProfilePic from "../../images/noPic.png";
import "./newPost.css";

export default function NewPost({ pageType }) {
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const getImageUrl = (imageStr) => {
    if (!imageStr) return DefaultProfilePic;
    if (imageStr.startsWith('data:')) return imageStr;
    return `/images/${imageStr}`;
  };

  async function handleFormSubmit(e) {
    e.preventDefault();
    try {
      let imagePath = '';
      
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadResponse = await axiosClient.post("/upload", formData);
        imagePath = uploadResponse.data.filename;
      }

      const newPost = {
        userId: user._id,
        desc: desc,
        img: imagePath
      };

      await axiosClient.post("/posts", newPost);

      if (pageType === "profile") {
        navigate("/");
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  }

  return (
    <div className="newPostContainer">
      <div className="newPostWrapper">
        <div className="newPostTop">
          <img
            className="newPostProfileImg"
            src={getImageUrl(user.profilePicture)}
            alt="Profile"
          />
          <input
            placeholder="Create a new post here..."
            className="newPostInput"
            onChange={(e) => setDesc(e.target.value)}
            value={desc}
            style={{ outline: "none" }}
          />
        </div>
        <hr className="newPostHr" />
        <form className="newPostBottom" onSubmit={handleFormSubmit}>
          <div className="newPostOption">
            <input
              style={{ outline: "none" }}
              type="file"
              id="file"
              accept=".png,.jpeg,.jpg"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <button className="newPostButton" type="submit">
            Post
          </button>
        </form>
      </div>
    </div>
  );
}