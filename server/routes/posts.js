import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Post from '../models/Post.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Constants
const UPLOAD_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/uploads/images'
  : join(__dirname, '../public/images');

// Helper function to encode image to base64
function base64_encode(imagePath) {
  try {
    // Check if the path exists
    if (!existsSync(imagePath)) {
      console.warn(`Image not found at path: ${imagePath}`);
      return null;
    }

    // Check if the path is already a base64 string or URL
    if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
      return imagePath;
    }

    const imageBuffer = readFileSync(imagePath);
    const base64String = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('Error encoding image:', error);
    return null;
  }
}

// Create a post
router.post("/", async (req, res) => {
  try {
    const { userId, desc, img } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let processedImage = '';
    
    if (img) {
      // Handle base64 or URL images directly
      if (img.startsWith('data:') || img.startsWith('http')) {
        processedImage = img;
      } else {
        // Process file path
        const imagePath = join(UPLOAD_DIR, img);
        const encodedImage = base64_encode(imagePath);
        
        if (encodedImage) {
          processedImage = encodedImage;
        } else {
          console.warn(`Failed to process image at path: ${imagePath}`);
        }
      }
    }

    const newPost = new Post({
      userId,
      desc: desc || '',
      img: processedImage || '' // Ensure we store empty string if no image
    });

    const savedPost = await newPost.save();
    console.log('Post created successfully:', savedPost._id);
    res.status(200).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ 
      error: 'Failed to create post',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get all posts with pagination
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
    res.status(500).json({ 
      error: 'Failed to fetch posts',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get a single post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username profilePicture');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch post',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get all posts of a user with pagination
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
      .limit(limit);

    const total = await Post.countDocuments({ userId: user._id });

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch user posts',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get timeline posts with pagination
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
    res.status(500).json({ 
      error: 'Failed to fetch timeline',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;