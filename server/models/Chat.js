import mongoose from 'mongoose';
const { Schema } = mongoose;

const ChatSchema = new Schema(
 {
   users: {
     type: Array,
   },
 },
 { timestamps: true }
);

export default mongoose.model("Chat", ChatSchema);