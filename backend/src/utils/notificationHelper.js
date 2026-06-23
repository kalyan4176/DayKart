import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { notificationEmitter } from './notificationEmitter.js';

export const sendInAppNotification = async (recipientId, type, title, message, link = '') => {
  try {
    const user = await User.findById(recipientId);
    if (user && user.notificationsEnabled === false) {
      // User has disabled notifications, skip creation
      return null;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      link,
    });
    
    // Broadcast real-time message
    notificationEmitter.emit('notification:new', notification);
    return notification;
  } catch (err) {
    console.error('Failed to create or emit notification:', err);
  }
};
