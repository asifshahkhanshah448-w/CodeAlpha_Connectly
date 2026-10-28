import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IFollow extends Document {
  follower: mongoose.Types.ObjectId;
  following: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follow must have a follower'],
      index: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follow must have a following user target'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index to prevent duplicate follows
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

// Prevent following oneself at schema level
FollowSchema.pre('validate', function () {
  if (this.follower && this.following && this.follower.equals(this.following)) {
    throw new Error('Users cannot follow themselves');
  }
});

export const Follow: Model<IFollow> =
  mongoose.models.Follow || mongoose.model<IFollow>('Follow', FollowSchema);
export default Follow;
