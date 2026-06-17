import express from 'express';
import { getFrequentlyBoughtTogether, getSimilarProducts, trackRecentlyViewed, getRecentlyViewed, getTrendingProducts } from '../controllers/recommendationController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/frequently-bought/:productId', getFrequentlyBoughtTogether);
router.get('/similar/:productId', getSimilarProducts);
router.get('/trending', getTrendingProducts);

router.post('/recent', protect, trackRecentlyViewed);
router.get('/recent', protect, getRecentlyViewed);

export default router;
