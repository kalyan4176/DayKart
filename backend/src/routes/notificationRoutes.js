import express from 'express';
import {
  establishStream,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All notification endpoints require authentication
router.use(protect);

router.get('/stream', establishStream);
router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllNotificationsRead);
router.delete('/:id', deleteNotification);

export default router;
