import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Post from '../models/Post.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const UPLOAD_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/uploads/images'
  : join(__dirname, '../public/images');

// Create a post
router.post("/", async (req, res) => {
  try {
    const { userId, desc, img } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const newPost = new Post({
      userId,
      desc: desc || '',
      img: img || ''
    });

    const savedPost = await newPost.save();
    const populatedPost = await Post.findById(savedPost._id)
      .populate('userId', 'username profilePicture');
      
    res.status(200).json(populatedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post' });
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
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get user profile posts
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await Post.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profilePicture');

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get timeline posts
router.get("/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userIds = [currentUser._id, ...currentUser.followings];
    
    const posts = await Post.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profilePicture');

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

export default router;