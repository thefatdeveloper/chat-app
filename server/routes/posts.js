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

const DEFAULT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAwAB/2+Bq7YAAAAASUVORK5CYII=';

function base64_encode(imagePath) {
  try {
    if (!imagePath) return DEFAULT_IMAGE;

    if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
      return imagePath;
    }

    const fullPath = join(UPLOAD_DIR, imagePath);
    if (!existsSync(fullPath)) {
      console.warn(`Image not found at path: ${fullPath}`);
      return DEFAULT_IMAGE;
    }

    const imageBuffer = readFileSync(fullPath);
    const base64String = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('Error encoding image:', error);
    return DEFAULT_IMAGE;
  }
}

router.post("/", async (req, res) => {
  try {
    const { userId, desc, img } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const processedImage = base64_encode(img);

    const newPost = new Post({
      userId,
      desc: desc || '',
      img: processedImage
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

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profilePicture');

    const total = await Post.countDocuments();

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username profilePicture');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.get("/profile/:username", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await Post.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profilePicture');

    const total = await Post.countDocuments({ userId: user._id });

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

router.get("/timeline/:userId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.params.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userIds = [currentUser._id, ...currentUser.followings];
    
    const posts = await Post.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profilePicture');

    const total = await Post.countDocuments({ userId: { $in: userIds } });

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

export default router;