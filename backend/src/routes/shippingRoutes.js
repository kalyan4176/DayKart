import express from 'express';
import { getShippingRules, createShippingRule, updateShippingRule, deleteShippingRule, getCodCharge, updateCodCharge } from '../controllers/shippingController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getShippingRules);
router.post('/', restrictTo('admin'), createShippingRule);
router.put('/:id', restrictTo('admin'), updateShippingRule);
router.delete('/:id', restrictTo('admin'), deleteShippingRule);

router.get('/cod-charge', getCodCharge);
router.post('/cod-charge', restrictTo('admin'), updateCodCharge);

export default router;
