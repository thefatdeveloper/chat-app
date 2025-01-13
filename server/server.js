import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Import routes
import authRoute from './routes/auth.js';
import userRoute from './routes/users.js';
import chatRoute from './routes/chat.js';
import messageRoute from './routes/message.js';
import postRoute from './routes/posts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express and create HTTP server
const app = express();
const httpServer = createServer(app);

// Socket.io setup with enhanced CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://thefatdeveloper.github.io'
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  transports: ['websocket', 'polling']
});

// Configure environment variables
dotenv.config();
const PORT = process.env.PORT || 8080;

// Middleware setup
app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('combined'));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://thefatdeveloper.github.io'
    : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/images'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB limit
  }
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Enhanced Socket.io user management
const connectedUsers = new Map(); // Stores socketId -> userId
const userSockets = new Map();    // Stores userId -> socketId

// Socket.io event handlers with improved logging and error handling
io.on('connection', (socket) => {
  console.log('New socket connection established:', socket.id);

  // Handle user addition with validation
  socket.on('addUser', (userId) => {
    if (!userId) {
      console.error('Invalid user ID received');
      return;
    }

    try {
      // Remove any existing socket connections for this user
      const existingSocketId = userSockets.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        connectedUsers.delete(existingSocketId);
        io.to(existingSocketId).emit('forceDisconnect');
      }

      // Store new socket connection
      connectedUsers.set(socket.id, userId);
      userSockets.set(userId, socket.id);

      // Prepare user list for client
      const onlineUsers = Array.from(connectedUsers.entries()).map(([socketId, userId]) => ({
        socketId,
        userId
      }));

      console.log('User added:', userId);
      console.log('Current online users:', onlineUsers);

      // Broadcast updated user list
      io.emit('getUsers', onlineUsers);
    } catch (error) {
      console.error('Error in addUser event:', error);
    }
  });

  // Enhanced message handling with acknowledgment
  socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
    try {
      const receiverSocketId = userSockets.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('getMessage', {
          senderId,
          message,
          timestamp: new Date().toISOString()
        });
        console.log(`Message delivered from ${senderId} to ${receiverId}`);
      } else {
        console.log(`Receiver ${receiverId} is offline. Message queued.`);
        // Here you could implement message queuing for offline users
      }
    } catch (error) {
      console.error('Error in sendMessage event:', error);
    }
  });

  // Improved chat message broadcasting
  socket.on('chat message', (msg) => {
    try {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        io.emit('chat message', {
          userId,
          message: msg,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error in chat message event:', error);
    }
  });

  // Enhanced disconnection handling
  socket.on('disconnect', () => {
    try {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        console.log('User disconnected:', userId);
        connectedUsers.delete(socket.id);
        userSockets.delete(userId);

        // Prepare updated user list
        const onlineUsers = Array.from(connectedUsers.entries()).map(([socketId, userId]) => ({
          socketId,
          userId
        }));

        // Broadcast updated user list
        io.emit('getUsers', onlineUsers);
      }
    } catch (error) {
      console.error('Error in disconnect event:', error);
    }
  });

  // Handle ping to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Routes
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/chats', chatRoute);
app.use('/api/messages', messageRoute);
app.use("/api/posts", postRoute);

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.status(200).json({ 
      message: 'File uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: 'Error uploading file' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Start server with enhanced error handling
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO server is ready for connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;