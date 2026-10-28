import { Response } from 'express';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Follow } from '../models/Follow';
import { AuthRequest } from '../middleware/auth';

/**
 * @desc    Get user profile by username
 * @route   GET /api/users/profile/:username
 * @access  Public (optional auth for follow status)
 */
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const username = String(req.params.username);
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      res.status(404).json({
        success: false,
        message: `User @${username} was not found.`,
      });
      return;
    }

    // Real dynamic database counts
    const [postsCount, followersCount, followingCount, userPosts] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
      Post.find({ author: user._id })
        .sort({ createdAt: -1 })
        .populate('author', 'name username avatar')
        .lean(),
    ]);

    // Check if the requesting user is following this profile
    let isFollowing = false;
    if (req.user && !req.user._id.equals(user._id)) {
      const followExists = await Follow.findOne({
        follower: req.user._id,
        following: user._id,
      });
      isFollowing = !!followExists;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        location: user.location,
        website: user.website,
        postsCount,
        followersCount,
        followingCount,
        createdAt: user.createdAt,
        isFollowing,
        isSelf: req.user ? req.user._id.equals(user._id) : false,
      },
      posts: userPosts,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching user profile',
    });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/edit-profile
 * @access  Private
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { name, bio, avatar, location, website } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name: name.trim() }),
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(avatar !== undefined && { avatar: avatar.trim() }),
        ...(location !== undefined && { location: location.trim() }),
        ...(website !== undefined && { website: website.trim() }),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error updating profile',
    });
  }
};

/**
 * @desc    Discover users to follow
 * @route   GET /api/users/discover
 * @access  Public (optional auth)
 */
export const discoverUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user ? req.user._id : null;
    let excludeIds: any[] = [];

    if (currentUserId) {
      const followingRecords = await Follow.find({ follower: currentUserId }).select('following');
      excludeIds = [currentUserId, ...followingRecords.map((f) => f.following)];
    }

    const users = await User.find({ _id: { $nin: excludeIds } })
      .limit(8)
      .select('name username avatar bio followersCount followingCount postsCount')
      .lean();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error discovering users',
    });
  }
};

/**
 * @desc    Search users by name or username
 * @route   GET /api/users/search?q=...
 * @access  Public
 */
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.status(200).json({ success: true, users: [] });
      return;
    }

    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [{ username: regex }, { name: regex }],
    })
      .limit(10)
      .select('name username avatar bio followersCount')
      .lean();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error searching users',
    });
  }
};
