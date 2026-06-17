import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';
import redisClient from '../config/redis.js';
import { logAuditEvent } from '../services/auditService.js';
import { NotFoundError, BadRequestError } from '../utils/customErrors.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalOrders = await Order.countDocuments();
    
    // Calculate total sales revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalSales: { $sum: '$pricing.total' } } }
    ]);
    const totalSales = revenueResult[0]?.totalSales || 0;

    // Monthly orders analytics pipeline
    const monthlyStats = await Order.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
          sales: { $sum: '$pricing.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalCustomers,
          totalSellers,
          totalOrders,
          totalSales,
        },
        monthlyStats,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    if (role === 'seller') {
      const sellers = await Seller.find().populate('user', 'name email role').sort({ createdAt: -1 });
      return res.status(200).json({
        status: 'success',
        data: { sellers },
      });
    }

    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const approveSeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { status } = req.body; // approved, rejected

    if (!['approved', 'rejected'].includes(status)) {
      return next(new BadRequestError('Invalid status selection. Must be approved or rejected.'));
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) return next(new NotFoundError('Seller profile not found.'));

    seller.status = status;
    await seller.save();

    await logAuditEvent({
      actor: req.user._id,
      action: `ADMIN_${status.toUpperCase()}_SELLER`,
      req,
      details: { sellerId, storeName: seller.storeName },
    });

    res.status(200).json({
      status: 'success',
      message: `Seller store profile status updated to ${status}.`,
      data: { seller },
    });
  } catch (error) {
    next(error);
  }
};

export const approveProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { status } = req.body; // approved, rejected

    if (!['approved', 'rejected'].includes(status)) {
      return next(new BadRequestError('Invalid status selection. Must be approved or rejected.'));
    }

    const product = await Product.findById(productId);
    if (!product) return next(new NotFoundError('Product not found.'));

    product.status = status;
    await product.save();

    // Invalidate Redis caches
    if (redisClient.isOpen) {
      await redisClient.del(`product:detail:${productId}`);
    }

    await logAuditEvent({
      actor: req.user._id,
      action: `ADMIN_${status.toUpperCase()}_PRODUCT`,
      req,
      details: { productId, sku: product.sku },
    });

    res.status(200).json({
      status: 'success',
      message: `Product listing status updated to ${status}.`,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      status: 'success',
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
};
