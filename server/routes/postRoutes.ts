import { Router } from 'express';
import {
  createPost,
  getFeed,
  getPostById,
  updatePost,
  deletePost,
} from '../controllers/postController';
import { likePost, unlikePost } from '../controllers/likeController';
import { getComments, addComment } from '../controllers/commentController';
import { protect, optionalAuth } from '../middleware/auth';

const router = Router();

// Feed & Post creation
router.route('/').get(optionalAuth, getFeed).post(protect, createPost);

// Single post operations
router
  .route('/:id')
  .get(optionalAuth, getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

// Likes
router
  .route('/:id/like')
  .post(protect, likePost)
  .delete(protect, unlikePost);

// Comments nested under post
router
  .route('/:postId/comments')
  .get(optionalAuth, getComments)
  .post(protect, addComment);

export default router;
