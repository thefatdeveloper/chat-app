import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Post from '../models/Post.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Helper function to encode image to base64
function base64_encode(file) {
  try {
    return "data:image/jpeg;base64," + readFileSync(file, "base64");
  } catch (error) {
    console.error('Error encoding image:', error);
    return null;
  }
}

// Create an image post
router.post("/", async (req, res) => {
  try {
    let base64str = req.body.img;

    // Only process image if it exists and isn't already a data URL or HTTPS URL
    if (base64str && !base64str.startsWith('data:') && !base64str.startsWith('https://')) {
      const uploadDir = process.env.NODE_ENV === 'production' 
        ? '/tmp/uploads/images'
        : join(__dirname, '../public/images');
        
      const imagePath = join(uploadDir, base64str);
      const encodedImage = base64_encode(imagePath);
      
      if (!encodedImage) {
        return res.status(400).json({ error: 'Failed to process image' });
      }
      base64str = encodedImage;
    }

    // Create a new post
    const newPost = new Post({
      userId: req.body.userId,
      desc: req.body.desc || '',
      img: base64str || ''
    });

    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post', details: err.message });
  }
});

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'username profilePicture');
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts', details: err.message });
  }
});

// Get a single image post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post', details: err.message });
  }
});

// Get all posts of a user
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const posts = await Post.find({ userId: user._id });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user posts', details: err.message });
  }
});

// Get timeline posts
router.get("/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all posts from current user
    const userPosts = await Post.find({ userId: currentUser._id });

    // Get all posts from followed users
    const followedPosts = await Promise.all(
      currentUser.followings.map((followingId) => {
        return Post.find({ userId: followingId });
      })
    );

    res.status(200).json(userPosts.concat(...followedPosts));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeline', details: err.message });
  }
});

// Update an image post
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId.toString() !== req.body.userId) {
      return res.status(403).json({ error: 'You can only update your own posts' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post', details: err.message });
  }
});

// Delete an image post
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId.toString() !== req.body.userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post', details: err.message });
  }
});

export default router;