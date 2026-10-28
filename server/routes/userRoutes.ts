import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  discoverUsers,
  searchUsers,
} from '../controllers/userController';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../controllers/followController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/discover', optionalAuth, discoverUsers);
router.get('/search', searchUsers);
router.get('/profile/:username', optionalAuth, getUserProfile);
router.put('/edit-profile', protect, updateProfile);

// Follow / Unfollow endpoints
router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id/followers', optionalAuth, getFollowers);
router.get('/:id/following', optionalAuth, getFollowing);

export default router;
