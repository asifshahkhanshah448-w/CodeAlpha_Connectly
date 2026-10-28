import { Response } from 'express';
import mongoose from 'mongoose';
import { Like } from '../models/Like';
import { Post } from '../models/Post';
import { AuthRequest } from '../middleware/auth';

/**
 * @desc    Like a post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const postId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Check if already liked to prevent duplicates
    const existingLike = await Like.findOne({
      user: req.user._id,
      post: postId,
    });

    if (existingLike) {
      res.status(400).json({
        success: false,
        message: 'You have already liked this post.',
        likesCount: post.likesCount,
        isLiked: true,
      });
      return;
    }

    await Like.create({
      user: req.user._id,
      post: postId,
    });

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $inc: { likesCount: 1 } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Post liked.',
      likesCount: updatedPost ? updatedPost.likesCount : post.likesCount + 1,
      isLiked: true,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error liking post',
    });
  }
};

/**
 * @desc    Unlike a post
 * @route   DELETE /api/posts/:id/like
 * @access  Private
 */
export const unlikePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const postId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const deletedLike = await Like.findOneAndDelete({
      user: req.user._id,
      post: postId,
    });

    if (!deletedLike) {
      const currentPost = await Post.findById(postId);
      res.status(400).json({
        success: false,
        message: 'You have not liked this post.',
        likesCount: currentPost ? currentPost.likesCount : 0,
        isLiked: false,
      });
      return;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $inc: { likesCount: -1 } },
      { new: true }
    );

    // Ensure count never dips below 0
    if (updatedPost && updatedPost.likesCount < 0) {
      updatedPost.likesCount = 0;
      await updatedPost.save();
    }

    res.status(200).json({
      success: true,
      message: 'Post unliked.',
      likesCount: updatedPost ? Math.max(0, updatedPost.likesCount) : 0,
      isLiked: false,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error unliking post',
    });
  }
};
