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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express
const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://thefatdeveloper.github.io'
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Configure environment variables
dotenv.config();
const PORT = process.env.PORT || 8080;

// Middleware
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

// Socket.io event handlers
let users = new Map();

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('addUser', (userId) => {
    users.set(userId, socket.id);
    io.emit('getUsers', Array.from(users.entries()));
  });

  socket.on('disconnect', () => {
    users.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        users.delete(userId);
      }
    });
    io.emit('getUsers', Array.from(users.entries()));
  });
});



// Routes
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/chat', chatRoute);
app.use('/api/messages', messageRoute);

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

// Start server
const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

export default app;