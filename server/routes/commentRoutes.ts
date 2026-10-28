import { Router } from 'express';
import { updateComment, deleteComment } from '../controllers/commentController';
import { protect } from '../middleware/auth';

const router = Router();

router.route('/:id').put(protect, updateComment).delete(protect, deleteComment);

export default router;
