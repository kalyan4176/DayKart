import express from 'express';
import { createCoupon, getCoupons, validateCoupon, deleteCoupon, updateCoupon } from '../controllers/couponController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('admin', 'seller'), createCoupon);
router.get('/', getCoupons);
router.patch('/:id', restrictTo('admin', 'seller'), updateCoupon);
router.post('/validate', validateCoupon);
router.delete('/:id', restrictTo('admin', 'seller'), deleteCoupon);

export default router;
