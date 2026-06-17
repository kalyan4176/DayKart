import express from 'express';
import { getDashboardStats, getUsers, approveSeller, approveProduct, getAuditLogs } from '../controllers/adminController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect, restrictTo('admin')); // Only admins can access these endpoints

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.patch('/seller/:sellerId/approve', approveSeller);
router.patch('/product/:productId/approve', approveProduct);
router.get('/audit-logs', getAuditLogs);

export default router;
