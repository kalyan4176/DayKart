import express from 'express';
import { checkout, getMyOrders, getOrderById, cancelOrder, getSellerOrders, updateOrderStatus, getDeliveryOrders, assignDeliveryPartner, returnOrder } from '../controllers/orderController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

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

export default router;
