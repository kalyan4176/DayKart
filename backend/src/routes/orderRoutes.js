import express from 'express';
import { checkout, getMyOrders, getOrderById, cancelOrder, getSellerOrders, updateOrderStatus, getDeliveryOrders, assignDeliveryPartner, returnOrder, verifyDeliveryOtp, phonepeRedirect, phonepeCallback } from '../controllers/orderController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// Public callback routes for PhonePe payment gateway integrations
router.post('/phonepe/callback', phonepeCallback);
router.post('/phonepe/redirect', phonepeRedirect);
router.get('/phonepe/redirect', phonepeRedirect);

router.use(protect); // protect all order routes

router.post('/checkout', restrictTo('customer', 'seller', 'admin'), checkout);
router.get('/my-orders', restrictTo('customer', 'seller', 'admin'), getMyOrders);
router.get('/seller-orders', restrictTo('seller'), getSellerOrders);
router.get('/delivery-orders', restrictTo('delivery_partner'), getDeliveryOrders);

router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/return', returnOrder);
router.patch('/:id/status', restrictTo('seller', 'admin', 'delivery_partner'), updateOrderStatus);
router.patch('/:id/assign', restrictTo('admin'), assignDeliveryPartner);
router.patch('/:id/verify-delivery-otp', restrictTo('delivery_partner', 'admin'), verifyDeliveryOtp);

export default router;
