// Add the server code here
const express = require("express");
const app = express();

const mongoose = require("mongoose");

const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const corsOptions = {
  origin: "https://y4d8ts-3000.csb.app", // Allow only your client's origin
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

dotenv.config();

const port = process.env.PORT || 8080;

// Import Auth Route
const authRoute = require("./routes/auth");

// Import User Route
const userRoute = require("./routes/users");

// Import Post Route
const postRoute = require("./routes/posts");

// Import Chat Route
const chatRoute = require("./routes/chat");

// Import Message Route
const messageRoute = require("./routes/message");

mongoose.set("strictQuery", false);

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    if (error.name === "MongoServerError" && error.code === 8000) {
      console.error(
        "Authentication failed. Please check your MongoDB credentials."
      );
    } else if (error.name === "MongoTimeoutError") {
      console.error(
        "Connection timed out. Please check your network or MongoDB Atlas status."
      );
    }
    process.exit(1);
  }
};

// Handling connection errors after initial connection
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
// Middleware
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
// app.use("/api/posts", postRoute);
// app.use("/api/chats", chatRoute);
// app.use("/api/messages", messageRoute);

// Multer
const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: imgStorage });

// Upload image to server and save to MongoDB database
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploaded!!!");
  } catch (error) {
    console.log(error);
  }
});

connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

module.exports = app;
