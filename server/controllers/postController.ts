import { Response } from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Like } from '../models/Like';
import { Comment } from '../models/Comment';
import { Follow } from '../models/Follow';
import { AuthRequest } from '../middleware/auth';

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private
 */
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { content, image } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Post content cannot be empty' });
      return;
    }

    // Extract hashtags like #javascript, #tech
    const extractedTags = (content.match(/#[a-zA-Z0-9_]+/g) || []).map((t: string) =>
      t.substring(1).toLowerCase()
    );

    const post = await Post.create({
      author: req.user._id,
      content: content.trim(),
      image: image ? image.trim() : '',
      tags: Array.from(new Set(extractedTags)),
    });

    // Update user post count
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    // Populate author
    await post.populate('author', 'name username avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      post: {
        ...post.toObject(),
        isLiked: false,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error creating post',
    });
  }
};

/**
 * @desc    Get feed posts (with pagination & following filter)
 * @route   GET /api/posts?page=1&limit=10&tab=all|following&tag=...
 * @access  Public (optional auth for isLiked & following tab)
 */
export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const tab = (req.query.tab as string) || 'all';
    const tag = req.query.tag as string;

    const query: Record<string, unknown> = {};

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    // If 'following' tab requested and user is authenticated
    if (tab === 'following') {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Please log in to view posts from people you follow.',
        });
        return;
      }

      const follows = await Follow.find({ follower: req.user._id }).select('following');
      const followingIds = follows.map((f) => f.following);
      // Include following users and the user's own posts
      query.author = { $in: [...followingIds, req.user._id] };
    }

    const [posts, totalPosts] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name username avatar bio')
        .lean(),
      Post.countDocuments(query),
    ]);

    // Check which posts the current user liked
    let userLikedPostIds = new Set<string>();
    if (req.user && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const userLikes = await Like.find({
        user: req.user._id,
        post: { $in: postIds },
      }).select('post');

      userLikedPostIds = new Set(userLikes.map((l) => l.post.toString()));
    }

    const postsWithLikes = posts.map((post) => ({
      ...post,
      id: post._id,
      isLiked: userLikedPostIds.has(post._id.toString()),
      isAuthor: req.user ? post.author && (post.author as unknown as { _id: mongoose.Types.ObjectId })._id.toString() === req.user._id.toString() : false,
    }));

    res.status(200).json({
      success: true,
      posts: postsWithLikes,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        hasMore: skip + posts.length < totalPosts,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching posts feed',
    });
  }
};

/**
 * @desc    Get single post by ID
 * @route   GET /api/posts/:id
 * @access  Public
 */
export const getPostById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid post ID' });
      return;
    }

    const post = await Post.findById(id).populate('author', 'name username avatar bio').lean();

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    let isLiked = false;
    if (req.user) {
      const like = await Like.findOne({ user: req.user._id, post: post._id });
      isLiked = !!like;
    }

    res.status(200).json({
      success: true,
      post: {
        ...post,
        id: post._id,
        isLiked,
        isAuthor: req.user ? (post.author as unknown as { _id: mongoose.Types.ObjectId })._id.toString() === req.user._id.toString() : false,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching post',
    });
  }
};

/**
 * @desc    Update post (author only)
 * @route   PUT /api/posts/:id
 * @access  Private
 */
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = String(req.params.id);
    const { content, image } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Ownership check
    if (!post.author.equals(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit your own posts.',
      });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Content cannot be empty' });
      return;
    }

    post.content = content.trim();
    if (image !== undefined) {
      post.image = image.trim();
    }

    // Re-extract tags
    const extractedTags = (post.content.match(/#[a-zA-Z0-9_]+/g) || []).map((t: string) =>
      t.substring(1).toLowerCase()
    );
    post.tags = Array.from(new Set(extractedTags));

    await post.save();
    await post.populate('author', 'name username avatar');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully!',
      post,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating post',
    });
  }
};

/**
 * @desc    Delete post (author only)
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const id = String(req.params.id);
    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Ownership check
    if (!post.author.equals(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own posts.',
      });
      return;
    }

    // Delete post, related likes, and comments
    await Promise.all([
      Post.findByIdAndDelete(id),
      Like.deleteMany({ post: id }),
      Comment.deleteMany({ post: id }),
      User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Post and associated comments and likes deleted successfully.',
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error deleting post',
    });
  }
};
