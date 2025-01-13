import { Router } from 'express';
import { readFileSync } from 'fs';
import Post from '../models/Post.js';
import User from '../models/User.js';

const router = Router();

// Helper function to encode image to base64
function base64_encode(file) {
  return "data:image/jpeg;base64," + readFileSync(file, "base64");
}

// Create an image post
router.post("/", async (req, res) => {
  // Check if the image is a url or a file
  let checkUrl = req.body.img.split("https");
  let isUrl = checkUrl[0].length < 1;
  
  // Get the base64 string
  let base64str = req.body.img;
  
  // If the image is a file, encode it to base64
  // FOR PLATFORM
  if (!isUrl) {
    base64str = base64_encode(
      `/usercode/image_sharing_app/api/public/images/${req.body.img}`
    );
  }
  
  // Create a new post
  const newPost = new Post({
    userId: req.body.userId,
    desc: req.body.desc,
    img: base64str,
  });
  
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get a single image post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get all posts of a user
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const posts = await Post.find({ userId: user._id });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get timeline posts
router.get("/timeline/:userId", async (req, res) => {
  try {
    // Get current user
    const currentUser = await User.findById(req.params.userId);
    // Get all posts from current user
    const userPosts = await Post.find({ userId: currentUser._id });
    // Get all posts from current user's followed users
    const followedUserPosts = await Promise.all(
      currentUser.followings.map((followingId) => {
        return Post.find({ userId: followingId });
      })
    );
    res.status(200).json(userPosts.concat(...followedUserPosts));
  } catch (err) {
    res.status(500).json(err);
  }
});

// Update an image post
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("The post has been updated");
    } else {
      res.status(403).json("You can only update your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// Delete an image post
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json("The post has been deleted");
    } else {
      res.status(403).json("You can only delete your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;