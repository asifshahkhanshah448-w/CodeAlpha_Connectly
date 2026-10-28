import { Response } from 'express';
import mongoose from 'mongoose';
import { Follow } from '../models/Follow';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * @desc    Follow a user
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const targetUserId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400).json({ success: false, message: 'Invalid target user ID' });
      return;
    }

    // Prevent self-following
    if (req.user._id.toString() === targetUserId) {
      res.status(400).json({
        success: false,
        message: 'You cannot follow yourself.',
      });
      return;
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'Target user not found' });
      return;
    }

    // Prevent duplicate follow
    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: targetUserId,
    });

    if (existingFollow) {
      res.status(400).json({
        success: false,
        message: `You are already following @${targetUser.username}.`,
        isFollowing: true,
      });
      return;
    }

    await Follow.create({
      follower: req.user._id,
      following: targetUserId,
    });

    // Update real follower & following counts
    const [updatedTargetUser, updatedCurrentUser] = await Promise.all([
      User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } }, { new: true }),
      User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } }, { new: true }),
    ]);

    res.status(200).json({
      success: true,
      message: `Now following @${targetUser.username}!`,
      isFollowing: true,
      targetFollowersCount: updatedTargetUser?.followersCount || 0,
      currentUserFollowingCount: updatedCurrentUser?.followingCount || 0,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error following user',
    });
  }
};

/**
 * @desc    Unfollow a user
 * @route   DELETE /api/users/:id/follow
 * @access  Private
 */
export const unfollowUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const targetUserId = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400).json({ success: false, message: 'Invalid target user ID' });
      return;
    }

    const deletedFollow = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: targetUserId,
    });

    if (!deletedFollow) {
      res.status(400).json({
        success: false,
        message: 'You are not following this user.',
        isFollowing: false,
      });
      return;
    }

    const [updatedTargetUser, updatedCurrentUser] = await Promise.all([
      User.findByIdAndUpdate(
        targetUserId,
        { $inc: { followersCount: -1 } },
        { new: true }
      ),
      User.findByIdAndUpdate(
        req.user._id,
        { $inc: { followingCount: -1 } },
        { new: true }
      ),
    ]);

    res.status(200).json({
      success: true,
      message: 'Unfollowed successfully.',
      isFollowing: false,
      targetFollowersCount: Math.max(0, updatedTargetUser?.followersCount || 0),
      currentUserFollowingCount: Math.max(0, updatedCurrentUser?.followingCount || 0),
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error unfollowing user',
    });
  }
};

/**
 * @desc    Get followers list of a user
 * @route   GET /api/users/:id/followers
 * @access  Public
 */
export const getFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const followers = await Follow.find({ following: id })
      .populate('follower', 'name username avatar bio followersCount')
      .lean();

    res.status(200).json({
      success: true,
      followers: followers.map((f) => f.follower),
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error getting followers',
    });
  }
};

/**
 * @desc    Get following list of a user
 * @route   GET /api/users/:id/following
 * @access  Public
 */
export const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const following = await Follow.find({ follower: id })
      .populate('following', 'name username avatar bio followersCount')
      .lean();

    res.status(200).json({
      success: true,
      following: following.map((f) => f.following),
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error getting following list',
    });
  }
};
