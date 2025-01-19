import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    desc: {
      type: String,
      max: 500,
      default: ''
    },
    img: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.model('Post', PostSchema);