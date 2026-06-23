import Notification from '../models/Notification.js';
import { addClient, removeClient } from '../services/notificationService.js';
import { NotFoundError } from '../utils/customErrors.js';

export const establishStream = (req, res) => {
  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const userId = req.user._id.toString();
  addClient(userId, res);

  // Send an initial keep-alive comment
  res.write(':ok\n\n');

  // Handle client disconnect
  req.on('close', () => {
    removeClient(userId);
  });
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return next(new NotFoundError('Notification not found.'));
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read.',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({ _id: id, recipient: req.user._id });

    if (!notification) {
      return next(new NotFoundError('Notification not found.'));
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted.',
    });
  } catch (error) {
    next(error);
  }
};
