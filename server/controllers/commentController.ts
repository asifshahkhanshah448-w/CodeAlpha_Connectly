import { Response } from 'express';
import mongoose from 'mongoose';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import { AuthRequest } from '../middleware/auth';

/**
 * @desc    Get comments for a specific post
 * @route   GET /api/posts/:postId/comments
 * @access  Public
 */
export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = String(req.params.postId);

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('author', 'name username avatar')
      .lean();

    const commentsFormatted = comments.map((c) => ({
      ...c,
      id: c._id,
      isAuthor: req.user ? (c.author as unknown as { _id: mongoose.Types.ObjectId })._id.toString() === req.user._id.toString() : false,
    }));

    res.status(200).json({
      success: true,
      comments: commentsFormatted,
      count: comments.length,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching comments',
    });
  }
};

/**
 * @desc    Add comment to a post
 * @route   POST /api/posts/:postId/comments
 * @access  Private
 */
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const postId = String(req.params.postId);
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Comment text cannot be empty' });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content: content.trim(),
    });

    // Increment post comments count
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    await comment.populate('author', 'name username avatar');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully!',
      comment: {
        ...comment.toObject(),
        id: comment._id,
        isAuthor: true,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error adding comment',
    });
  }
};

/**
 * @desc    Update comment (author only)
 * @route   PUT /api/comments/:id
 * @access  Private
 */
export const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = String(req.params.id);
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
      return;
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    // Ownership check
    if (!comment.author.equals(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own comments.',
      });
      return;
    }

    comment.content = content.trim();
    await comment.save();
    await comment.populate('author', 'name username avatar');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully!',
      comment,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating comment',
    });
  }
};

/**
 * @desc    Delete comment (author only)
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = String(req.params.id);
    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    // Ownership check
    if (!comment.author.equals(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own comments.',
      });
      return;
    }

    const postId = comment.post;

    await Comment.findByIdAndDelete(id);
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error deleting comment',
    });
  }
};
