const router = require("express").Router();
const User = require("../models/User");

// Register User
router.post("/register", async (req, res) => {
  try {
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    // Check if email already exists
    const cUserEmail = await User.findOne({
      email: req.body.email,
    });
    if (cUserEmail) {
      // console.log("Email already exists")
      return res.status(400).json("Email already exists");
    }

    // Check if username already exists
    const cUserName = await User.findOne({
      username: req.body.username,
    });
    if (cUserName) {
      // console.log("Username already exists")
      return res.status(400).json("Username already exists");
    }

    // save the user and respond with the user
    const user = await newUser.save();
    // console.log("Creating new user")
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    // Check valid email
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user) {
      return res.status(404).json("User not found");
    }

    // Check valid password
    if (req.body.password !== user.password) {
      return res.status(400).json("Wrong password");
    }

    // Respond with the user if email and password are valid
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
