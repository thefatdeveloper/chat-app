import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import NewPost from "../new_post/NewPost";
import Post from "../post/Post";
import UserSearch from "../userSearch/UserSearch";
import "./body.css";
import axiosClient from "../../api/axiosClient";

export default function Body({ username, page }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = username
          ? await axiosClient.get("/posts/profile/" + username)
          : await axiosClient.get("posts/timeline/" + user._id);
        
        // Ensure we always have an array of posts
        const postsData = Array.isArray(res.data) ? res.data : [];
        setPosts(postsData);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load posts");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchPosts();
    }
  }, [username, user._id]);

  if (loading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="bodyContainer">
      <div className="bodyWrapper">
        <div className="bodyLeftCenter">
          {(!username || username === user.username) && (
            <NewPost pageType={page} />
          )}
          {Array.isArray(posts) && posts.length > 0 ? (
            posts.map((postData) => (
              <Post key={postData._id} post={postData} />
            ))
          ) : (
            <div>No posts found</div>
          )}
        </div>
        <div className="bodyRight">
          {(!username || username === user.username) && <UserSearch />}
        </div>
      </div>
    </div>
  );
}