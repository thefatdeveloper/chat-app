import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
 {
   userId: {
     type: String,
     required: true,  
   },
   desc: {
     type: String,
     max: 500,
   },
   img: {
     type: String,
     required: true,
   },
 },
 { timestamps: true }
);

export default mongoose.model("Post", PostSchema);