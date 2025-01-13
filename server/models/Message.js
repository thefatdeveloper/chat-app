import mongoose from 'mongoose';
const { Schema } = mongoose;

const MessageSchema = new Schema(
 {
   chatId: {
     type: String,
   },
   sender: {
     type: String,
   },
   message: {
     type: String,
   },
 },
 { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);