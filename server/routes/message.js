import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// create a new message 
router.post("/", async (req, res) => {
 // create a new message
 const newMessage = new Message(req.body);

 try {
   // save the message
   const savedMessage = await newMessage.save();
   // send the saved message with a 200 status code  
   res.status(200).json(savedMessage);
 } catch (err) {
   // send the error with a 500 status code
   res.status(500).json(err); 
 }
});

// get all the messages of a chat based on the chat ID
router.get("/:chatId", async (req, res) => {
 try {
   // find all the messages where the chat ID is equal to the chat ID passed in the params
   const messages = await Message.find({
     chatId: req.params.chatId,
   });

   // send the messages with a 200 status code
   res.status(200).json(messages);
 } catch (err) {
   // send the error with a 500 status code
   res.status(500).json(err);
 }
});

export default router;