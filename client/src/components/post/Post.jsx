import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "./post.css";
import { Link } from "react-router-dom";
import DefaultProfilePic from "../../images/noPic.png";

function Post({ post }) {
  const [user, setUser] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosClient.get(`/users/?userId=${post.userId}`);
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, [post.userId]);

  const getImageUrl = (imageStr) => {
    if (!imageStr) return DefaultProfilePic;
    if (imageStr.startsWith('data:')) return imageStr;
    return `/images/${imageStr}`;
  };

  return (
    <div className="postContainer">
      <div className="postWrapper">
        <div className="postTop">
          <Link to={`profile/${user.username}`}>
            <img
              className="userProfileImg"
              src={getImageUrl(user.profilePicture)}
              alt="Profile"
            />
          </Link>
          <span className="postUsername">{user.username}</span>
        </div>
        <hr className="postHr" />
        <div className="postCenter">
          {post.img && (
            <img
              className="postImg"
              src={getImageUrl(post.img)}
              alt="Post"
              onError={(e) => {
                e.target.src = DefaultProfilePic;
              }}
            />
          )}
        </div>
        <div className="postBottom">
          <span className="postDescription">{post.desc}</span>
        </div>
      </div>
    </div>
  );
}

export default Post;