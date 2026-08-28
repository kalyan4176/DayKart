import Order from '../models/Order.js';
import SystemSetting from '../models/SystemSetting.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';
import redisClient from '../config/redis.js';
import { sendInAppNotification } from '../utils/notificationHelper.js';
import logger from '../config/logger.js';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TV904Qy0SFduGD',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'bbL0euoX2MXtM3h1ZCzPAIAj',
});

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

export const runPaymentTimeoutCheck = async () => {
  try {
    // Cutoff time of 2 minutes ago
    const cutoffTime = new Date(Date.now() - 2 * 60 * 1000);
    const pendingOrders = await Order.find({
      status: 'pending',
      createdAt: { $lte: cutoffTime }
    });

    if (pendingOrders.length > 0) {
      logger.info(`Found ${pendingOrders.length} pending orders that timed out. Starting verification & cancellation check...`);
      for (const order of pendingOrders) {
        const payment = await Payment.findOne({ order: order._id });

        // Double-check with Razorpay if order is online
        if (payment && payment.gateway === 'razorpay' && payment.gatewayOrderId) {
          try {
            const rzpOrder = await razorpay.orders.fetch(payment.gatewayOrderId);
            if (rzpOrder && rzpOrder.status === 'paid') {
              // The user paid successfully but the browser session disconnected! Complete the order instead.
              order.status = 'placed';
              order.statusTimeline.push({
                status: 'placed',
                message: 'Payment verified via background scheduler check. Order placed successfully.'
              });
              await order.save();

              payment.status = 'success';
              await payment.save();

              // Clear customer's cart
              const cart = await Cart.findOne({ user: order.customer });
              if (cart) {
                cart.items = [];
                await cart.save();
              }

              logger.info(`Automatically recovered paid order ${order.orderId} from pending state.`);
              continue; // Skip cancellation
            }
          } catch (rzpErr) {
            logger.error(`Failed to fetch Razorpay order status for order ${order.orderId}:`, rzpErr.message);
          }
        }

        // If not paid (money not debited) or not online, cancel the order immediately
        order.status = 'cancelled';
        order.statusTimeline.push({
          status: 'cancelled',
          message: 'Order automatically cancelled due to payment timeout.'
        });
        await order.save();

        if (payment) {
          payment.status = 'failed';
          await payment.save();
        }

        // Restore stock
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            if (item.variantSku) {
              const variantIndex = product.variants.findIndex(v => v.sku === item.variantSku);
              if (variantIndex > -1) {
                product.variants[variantIndex].inventory += item.quantity;
              }
            } else {
              product.inventory.quantity += item.quantity;
            }
            await product.save();

            // Invalidate Redis cache
            try {
              if (redisClient.isOpen) {
                await redisClient.del(`product:detail:${product._id}`);
              }
            } catch (cacheErr) {
              logger.error(`Failed to invalidate cache for product ${product._id}:`, cacheErr);
            }
          }
        }
        logger.info(`Automatically cancelled pending order ${order.orderId} due to payment timeout.`);
      }
    }
  } catch (err) {
    logger.error('Error in payment timeout check:', err);
  }
};

export const startAutoAssignmentScheduler = () => {
  // Run once immediately on startup
  runAutoAssignmentCheck();
  runPaymentTimeoutCheck();

  // Then run every 5 minutes
  setInterval(() => {
    runAutoAssignmentCheck();
    runPaymentTimeoutCheck();
  }, 5 * 60 * 1000);
  logger.info('Auto-assignment and payment timeout scheduler initialized (runs every 5 minutes).');
};
