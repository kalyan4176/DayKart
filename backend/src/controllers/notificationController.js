import Notification from '../models/Notification.js';
import { notificationEmitter } from '../utils/notificationEmitter.js';
import { NotFoundError } from '../utils/customErrors.js';

// Retrieve user-specific notifications list (up to 50 latest)
export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.status(200).json({
      status: 'success',
      data: { notifications }
    });
  } catch (err) {
    next(err);
  }
};

// Mark a single notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return next(new NotFoundError('Notification not found.'));
    }
    
    res.status(200).json({
      status: 'success',
      data: { notification }
    });
  } catch (err) {
    next(err);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.'
    });
  } catch (err) {
    next(err);
  }
};

// Delete a single notification
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return next(new NotFoundError('Notification not found.'));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// Stream notifications in real-time via Server-Sent Events (SSE)
export const streamNotifications = async (req, res, next) => {
  try {
    // Set headers required for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy response buffering
    
    // Initial connection confirmation frame
    res.write('data: {"connected": true}\n\n');
    
    const userId = req.user._id.toString();
    
    // Keep-alive heartbeat interval to prevent load-balancer/proxy timeout disconnects
    const keepAliveInterval = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': keep-alive\n\n');
      }
    }, 25000);
    
    // Event listener triggered whenever a new notification is emitted
    const listener = (notification) => {
      if (notification.recipient.toString() === userId && !res.writableEnded) {
        res.write(`data: ${JSON.stringify(notification)}\n\n`);
      }
    };
    
    notificationEmitter.on('notification:new', listener);
    
    // Handle client disconnect cleanup
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      notificationEmitter.off('notification:new', listener);
      res.end();
    });
    
  } catch (err) {
    next(err);
  }
};
