import Order from '../models/Order.js';
import SystemSetting from '../models/SystemSetting.js';
import User from '../models/User.js';
import { sendInAppNotification } from '../utils/notificationHelper.js';
import logger from '../config/logger.js';

export const runAutoAssignmentCheck = async () => {
  try {
    const defaultAgentSetting = await SystemSetting.findOne({ key: 'default_delivery_agent' });
    if (!defaultAgentSetting || !defaultAgentSetting.value) {
      return;
    }

    const defaultAgentId = defaultAgentSetting.value;
    const defaultAgent = await User.findById(defaultAgentId);
    if (!defaultAgent || defaultAgent.role !== 'delivery_partner') {
      return;
    }

    // Find orders created more than 2 hours ago that are in 'placed' or 'processed' status and have no delivery partner
    const cutoffTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const ordersToAssign = await Order.find({
      status: { $in: ['placed', 'processed'] },
      $or: [
        { deliveryPartner: { $exists: false } },
        { deliveryPartner: null },
        { deliveryPartner: '' }
      ],
      createdAt: { $lte: cutoffTime }
    });

    if (ordersToAssign.length > 0) {
      for (const order of ordersToAssign) {
        order.deliveryPartner = defaultAgent._id;
        await order.save();

        // Notify courier
        await sendInAppNotification(
          defaultAgent._id,
          'order',
          'Order Automatically Assigned',
          `Order ${order.orderId} was automatically assigned to you after remaining unassigned for 2 hours.`,
          '/delivery/dashboard'
        );
      }
    }
  } catch (err) {
    logger.error('Error in auto-assignment check:', err);
  }
};

export const startAutoAssignmentScheduler = () => {
  // Run once immediately on startup
  runAutoAssignmentCheck();

  // Then run every 5 minutes
  setInterval(runAutoAssignmentCheck, 5 * 60 * 1000);
  logger.info('Auto-assignment scheduler initialized (runs every 5 minutes).');
};
