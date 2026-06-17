import express from 'express';
import { createReview, getProductReviews, voteHelpful, moderateReview } from '../controllers/reviewController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.get('/product/:productId', getProductReviews);

router.use(protect);
router.post('/', restrictTo('customer'), createReview);
router.post('/:id/helpful', voteHelpful);
router.patch('/:id/moderate', restrictTo('admin'), moderateReview);

export default router;
