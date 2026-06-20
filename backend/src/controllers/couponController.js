import Coupon from '../models/Coupon.js';
import Seller from '../models/Seller.js';
import Order from '../models/Order.js';
import { logAuditEvent } from '../services/auditService.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/customErrors.js';

export const createCoupon = async (req, res, next) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, scope, startDate, endDate, usageLimit, userLimit, firstNOrders, isRandomPool } = req.body;

    // Check code duplication
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return next(new BadRequestError(`Coupon code '${code}' already exists.`));
    }

    let sellerId = null;
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      if (!seller) return next(new ForbiddenError('Seller profile not initialized.'));
      sellerId = seller._id;
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscount,
      scope: req.user.role === 'admin' ? (scope || 'platform') : 'seller',
      seller: req.user.role === 'admin' ? null : sellerId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit,
      userLimit: userLimit || 1,
      firstNOrders: firstNOrders || 0,
      isRandomPool: isRandomPool || false,
    });

    await coupon.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'CREATE_COUPON',
      req,
      details: { code: coupon.code, scope: coupon.scope },
    });

    res.status(201).json({
      status: 'success',
      message: 'Coupon code created successfully.',
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req, res, next) => {
  try {
    let query = {};
    
    if (req.user.role === 'customer' || req.query.view === 'customer') {
      query = {
        active: true,
        endDate: { $gt: new Date() },
        $or: [
          { assignedTo: req.user._id },
          { scope: 'platform', isRandomPool: false, assignedTo: null }
        ]
      };
    } else if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      query = { $or: [{ seller: seller?._id }, { scope: 'platform', isRandomPool: false, assignedTo: null }] };
    }

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { coupons },
    });
  } catch (error) {
    next(error);
  }
};

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartValue } = req.body;
    if (!code) return next(new BadRequestError('Coupon code is required.'));

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    
    if (!coupon) {
      return next(new BadRequestError('Coupon code is not available.'));
    }

    // Expiry check
    if (coupon.startDate > new Date() || coupon.endDate < new Date()) {
      return next(new BadRequestError('Coupon code is not available.'));
    }

    // Usage limits check
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return next(new BadRequestError('Coupon code is not available.'));
    }

    // Random pool or assignedTo check
    if (coupon.isRandomPool || coupon.assignedTo) {
      if (!coupon.assignedTo || coupon.assignedTo.toString() !== req.user._id.toString()) {
        return next(new BadRequestError('Coupon code is not available.'));
      }
    }

    // First N orders check
    if (coupon.firstNOrders && coupon.firstNOrders > 0) {
      const orderCount = await Order.countDocuments({ customer: req.user._id, status: { $ne: 'cancelled' } });
      if (orderCount >= coupon.firstNOrders) {
        return next(new BadRequestError('Coupon code is not available.'));
      }
    }

    // Min value check
    if (cartValue && Number(cartValue) < coupon.minOrderValue) {
      return next(new BadRequestError(`Minimum order value of ₹${coupon.minOrderValue} is required to apply code.`));
    }

    res.status(200).json({
      status: 'success',
      message: 'Coupon is valid.',
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) return next(new NotFoundError('Coupon not found.'));

    // Authorization: Admin or the seller who owns the coupon
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      if (!coupon.seller || coupon.seller.toString() !== seller?._id.toString()) {
        return next(new ForbiddenError('You are not authorized to edit this coupon.'));
      }
    }

    const fieldsToUpdate = [
      'description', 'discountType', 'discountValue', 'minOrderValue',
      'maxDiscount', 'startDate', 'endDate', 'usageLimit', 'userLimit',
      'active', 'firstNOrders', 'isRandomPool', 'assignedTo'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          coupon[field] = new Date(req.body[field]);
        } else {
          coupon[field] = req.body[field];
        }
      }
    });

    if (req.body.code) {
      const newCode = req.body.code.toUpperCase();
      if (newCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: newCode });
        if (existing) {
          return next(new BadRequestError(`Coupon code '${newCode}' already exists.`));
        }
        coupon.code = newCode;
      }
    }

    await coupon.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'UPDATE_COUPON',
      req,
      details: { code: coupon.code, active: coupon.active },
    });

    res.status(200).json({
      status: 'success',
      message: 'Coupon updated successfully.',
      data: { coupon },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) return next(new NotFoundError('Coupon not found.'));

    // Authorization: Admin or the seller who owns the coupon
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      if (!coupon.seller || coupon.seller.toString() !== seller?._id.toString()) {
        return next(new ForbiddenError('You are not authorized to delete this coupon.'));
      }
    }

    await Coupon.findByIdAndDelete(id);

    await logAuditEvent({
      actor: req.user._id,
      action: 'DELETE_COUPON',
      req,
      details: { code: coupon.code },
    });

    res.status(200).json({
      status: 'success',
      message: 'Coupon deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
