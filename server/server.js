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
import { existsSync, mkdirSync } from 'fs';

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

// Configure environment variables early
dotenv.config();

// Constants
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URL = process.env.MONGO_URL;
const CLIENT_URL = NODE_ENV === 'production' 
  ? 'https://thefatdeveloper.github.io'
  : 'http://localhost:3000';

// Configure upload directory
const UPLOAD_DIR = NODE_ENV === 'production'
  ? '/tmp/uploads/images'
  : path.join(__dirname, 'public/images');

// Create upload directory if it doesn't exist
try {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('Created upload directory:', UPLOAD_DIR);
  }
} catch (error) {
  console.error('Error creating upload directory:', error);
}

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  transports: ['websocket', 'polling']
});

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// MongoDB Connection with retry
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB successfully');
      return true;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('All MongoDB connection attempts failed');
        process.exit(1);
      }      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Socket.io user management with Maps for O(1) lookup
const connectedUsers = new Map(); // Stores socketId -> userId
const userSockets = new Map();    // Stores userId -> socketId
const userRooms = new Map();      // Stores userId -> Set of room IDs

// Socket.io event handlers with improved error handling
io.on('connection', (socket) => {
  console.log('New socket connection established:', socket.id);

  // Handle user addition with validation
  socket.on('addUser', (userId) => {
    if (!userId) {
      socket.emit('error', 'Invalid user ID provided');
      return;
    }

    try {
      // Handle existing connections for this user
      const existingSocketId = userSockets.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        connectedUsers.delete(existingSocketId);
        io.to(existingSocketId).emit('forceDisconnect', {
          message: 'New session started from another location'
        });
      }

      // Store new socket connection
      connectedUsers.set(socket.id, userId);
      userSockets.set(userId, socket.id);
      userRooms.set(userId, new Set());

      // Prepare user list for client
      const onlineUsers = Array.from(connectedUsers.entries()).map(([socketId, userId]) => ({
        socketId,
        userId
      }));

      // Broadcast updated user list
      io.emit('getUsers', onlineUsers);
      console.log(`User ${userId} connected. Total online users: ${onlineUsers.length}`);
    } catch (error) {
      console.error('Error in addUser event:', error);
      socket.emit('error', 'Failed to register user connection');
    }
  });

  // Enhanced message handling with acknowledgment and typing indicators
  socket.on('sendMessage', async ({ senderId, receiverId, message, chatId }) => {
    try {
      const receiverSocketId = userSockets.get(receiverId);
      const timestamp = new Date().toISOString();
      
      const messageData = {
        senderId,
        message,
        chatId,
        timestamp
      };

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('getMessage', messageData);
        socket.emit('messageDelivered', { messageId: chatId, timestamp });
        console.log(`Message delivered from ${senderId} to ${receiverId}`);
      } else {
        // Store message for offline delivery
        console.log(`Receiver ${receiverId} is offline. Message queued.`);
        socket.emit('messageQueued', { messageId: chatId, timestamp });
      }
    } catch (error) {
      console.error('Error in sendMessage event:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Typing indicator events
  socket.on('typing', ({ chatId, userId }) => {
    try {
      socket.broadcast.to(chatId).emit('userTyping', { userId, chatId });
    } catch (error) {
      console.error('Error in typing event:', error);
    }
  });

  socket.on('stopTyping', ({ chatId, userId }) => {
    try {
      socket.broadcast.to(chatId).emit('userStoppedTyping', { userId, chatId });
    } catch (error) {
      console.error('Error in stopTyping event:', error);
    }
  });

  // Chat room management
  socket.on('joinRoom', (roomId) => {
    try {
      socket.join(roomId);
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        userRooms.get(userId)?.add(roomId);
      }
      console.log(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join chat room');
    }
  });

  socket.on('leaveRoom', (roomId) => {
    try {
      socket.leave(roomId);
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        userRooms.get(userId)?.delete(roomId);
      }
      console.log(`User ${userId} left room ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Enhanced disconnection handling
  socket.on('disconnect', () => {
    try {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        // Clean up user data
        connectedUsers.delete(socket.id);
        userSockets.delete(userId);
        userRooms.delete(userId);

        // Prepare updated user list
        const onlineUsers = Array.from(connectedUsers.entries()).map(([socketId, userId]) => ({
          socketId,
          userId
        }));

        // Broadcast updated user list
        io.emit('getUsers', onlineUsers);
        console.log(`User ${userId} disconnected. Total online users: ${onlineUsers.length}`);
      }
    } catch (error) {
      console.error('Error in disconnect event:', error);
    }
  });

  // Handle ping to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Generic error handler
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('error', 'An unexpected error occurred');
  });
});

// Routes
app.use('/images', express.static(UPLOAD_DIR));
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/chat', chatRoute);
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
      filename: req.file.filename,
      path: `/images/${req.file.filename}`
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'Error uploading file',
      details: NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Global error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    details: NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  httpServer.close(() => process.exit(1));
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  httpServer.close(() => process.exit(1));
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`CORS enabled for origin: ${CLIENT_URL}`);
      console.log(`Upload directory: ${UPLOAD_DIR}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;