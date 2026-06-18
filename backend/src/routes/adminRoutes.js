import express from 'express';
import { getDashboardStats, getUsers, approveSeller, approveProduct, getAuditLogs, createCategory, updateCategory, deleteCategory, createSellerDirectly, deleteSeller, getAdminOrders } from '../controllers/adminController.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect, restrictTo('admin')); // Only admins can access these endpoints

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.get('/orders', getAdminOrders);
router.patch('/seller/:sellerId/approve', approveSeller);
router.patch('/product/:productId/approve', approveProduct);
router.get('/audit-logs', getAuditLogs);

// Category Management
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Seller Management
router.post('/sellers', createSellerDirectly);
router.delete('/sellers/:id', deleteSeller);

export default router;
