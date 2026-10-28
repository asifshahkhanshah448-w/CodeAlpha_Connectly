import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILike extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Like must have a user'],
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Like must reference a post'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index to prevent duplicate likes at database level
LikeSchema.index({ user: 1, post: 1 }, { unique: true });

export const Like: Model<ILike> =
  mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema);
export default Like;
