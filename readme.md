# SocialHub

SocialHub is a full-stack social media platform featuring real-time chat, user profiles, posts, and social connections. Built with React, Node.js, Express, and MongoDB.

## 🌟 Features

- **User Authentication**
  - Secure signup and login
  - Profile management
  - Profile picture upload

- **Social Features**
  - Create and share posts with images
  - Follow/unfollow users
  - View user profiles
  - Timeline of posts from followed users

- **Real-time Chat**
  - Real-time messaging using Socket.IO
  - Online user status
  - Typing indicators
  - Message delivery status

## 🛠️ Tech Stack

### Frontend
- React.js
- Redux Toolkit for state management
- React Router for navigation
- Axios for API requests
- Socket.IO client for real-time features

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.IO for real-time communication
- Multer for file uploads
- JWT for authentication

## 💻 Installation

1. Clone the repository
```bash
git clone https://github.com/thefatdeveloper/chat-app.git
```

2. Install dependencies for both client and server
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd client
npm install
```

3. Set up environment variables

Create `.env` file in the server directory:
```env
MONGO_URL=your_mongodb_connection_string
PORT=8080
NODE_ENV=development
```

Create `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:8080/api
```

4. Run the application

For development:
```bash
# Run server (from server directory)
npm start

# Run client (from client directory)
npm start
```

## 📁 Project Structure

```
chat-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/           # API client setup
│   │   ├── components/    # React components
│   │   ├── images/        # Static images
│   │   ├── pages/         # Page components
│   │   └── App.js         # Main app component
│   └── package.json
│
└── server/                # Node.js backend
    ├── models/           # Mongoose models
    ├── routes/          # API routes
    ├── public/          # Static files
    └── server.js        # Server entry point
```

## 🚀 Deployment

The application is deployed using:
- Frontend: GitHub Pages
- Backend: Render.com
- Database: MongoDB Atlas

## 📝 Environment Variables

### Server
- `MONGO_URL`: MongoDB connection string
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment (development/production)

### Client
- `REACT_APP_API_URL`: Backend API URL

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License

## 👥 Contact

Your Name - sreekarsai19@gmail.com
Project Link: [https://thefatdeveloper.github.io/chat-app/#/login](https://thefatdeveloper.github.io/chat-app/#/login)

## 🙏 Acknowledgments

- Socket.IO for real-time functionality
- MongoDB Atlas for database hosting
- Render.com for backend hosting
- GitHub Pages for frontend hosting