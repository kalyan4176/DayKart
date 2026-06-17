import Coupon from '../models/Coupon.js';
import Seller from '../models/Seller.js';
import { logAuditEvent } from '../services/auditService.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/customErrors.js';

export const createCoupon = async (req, res, next) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount, scope, startDate, endDate, usageLimit, userLimit } = req.body;

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
    
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      query = { $or: [{ seller: seller?._id }, { scope: 'platform' }] };
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
      return next(new NotFoundError('Coupon code is invalid or deactivated.'));
    }

    // Expiry check
    if (coupon.startDate > new Date() || coupon.endDate < new Date()) {
      return next(new BadRequestError('Coupon code is not active or has expired.'));
    }

    // Min value check
    if (cartValue && Number(cartValue) < coupon.minOrderValue) {
      return next(new BadRequestError(`Minimum order value of ₹${coupon.minOrderValue} is required to apply code.`));
    }

    // Usage limits check
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return next(new BadRequestError('Coupon code limit reached.'));
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
