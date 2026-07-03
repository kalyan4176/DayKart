import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';
import Category from '../models/Category.js';
import redisClient from '../config/redis.js';
import { logAuditEvent } from '../services/auditService.js';
import { NotFoundError, BadRequestError } from '../utils/customErrors.js';
import { sendInAppNotification } from '../utils/notificationHelper.js';
import SystemConfig from '../models/SystemConfig.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalOrders = await Order.countDocuments();
    
    // Calculate total sales revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ['placed', 'processed', 'shipped', 'out_for_delivery', 'delivered'] } } },
      { $group: { _id: null, totalSales: { $sum: '$pricing.total' } } }
    ]);
    const totalSales = revenueResult[0]?.totalSales || 0;

    const rejectedBySellersCount = await Order.countDocuments({
      'statusTimeline': {
        $elemMatch: {
          status: 'cancelled',
          message: 'Order rejected by seller.'
        }
      }
    });

    // Monthly orders analytics pipeline
    const monthlyStats = await Order.aggregate([
      { $match: { status: { $in: ['placed', 'processed', 'shipped', 'out_for_delivery', 'delivered'] } } },
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
          rejectedBySellersCount,
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

    // Send in-app notification to the seller user
    await sendInAppNotification(
      seller.user,
      'info',
      status === 'approved' ? 'Seller Account Approved' : 'Seller Account Rejected',
      status === 'approved' 
        ? `Your seller store profile for "${seller.storeName}" has been approved! Welcome to Daykart.`
        : `Your seller store profile for "${seller.storeName}" was rejected by the administrator.`,
      '/seller/dashboard'
    );

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

    // Send in-app notification to the seller user
    const sellerDoc = await Seller.findById(product.seller);
    if (sellerDoc) {
      await sendInAppNotification(
        sellerDoc.user,
        'info',
        status === 'approved' ? 'Product Listing Approved' : 'Product Listing Rejected',
        status === 'approved'
          ? `Your product listing "${product.title}" has been approved and is now live on Daykart.`
          : `Your product listing "${product.title}" was rejected by the administrator.`,
        '/seller/dashboard'
      );
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

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, image, parentCategory } = req.body;
    
    // Check if slug is already taken
    const existingCategory = await Category.findOne({ slug: slug.toLowerCase() });
    if (existingCategory) {
      return next(new BadRequestError('Category slug is already taken.'));
    }

    const category = new Category({
      name,
      slug: slug.toLowerCase(),
      description,
      image,
      parentCategory: parentCategory || null,
    });

    await category.save();

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully.',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, parentCategory, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) return next(new NotFoundError('Category not found.'));

    if (slug && slug.toLowerCase() !== category.slug) {
      const existingCategory = await Category.findOne({ slug: slug.toLowerCase() });
      if (existingCategory) {
        return next(new BadRequestError('Category slug is already taken.'));
      }
      category.slug = slug.toLowerCase();
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully.',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) return next(new NotFoundError('Category not found.'));

    // Check if any product is using this category
    const productUsing = await Product.findOne({ category: id });
    if (productUsing) {
      return next(new BadRequestError('Cannot delete category because it is linked to products.'));
    }

    // Check if any child category is linked
    const childCategoryUsing = await Category.findOne({ parentCategory: id });
    if (childCategoryUsing) {
      return next(new BadRequestError('Cannot delete category because it has child categories.'));
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findById(id);
    if (!seller) return next(new NotFoundError('Seller profile not found.'));

    // 1. Delete associated products
    await Product.deleteMany({ seller: id });

    // 2. Find associated user and revert role to customer
    const user = await User.findById(seller.user);
    if (user) {
      user.role = 'customer';
      await user.save();

      // Send in-app notification to the user
      await sendInAppNotification(
        user._id,
        'alert',
        'Seller Store Removed',
        `Your seller store profile for "${seller.storeName}" has been removed by the administrator and your account has been reverted to customer.`,
        '/profile'
      );
    }

    // 3. Delete seller profile
    await Seller.findByIdAndDelete(id);

    await logAuditEvent({
      actor: req.user._id,
      action: 'ADMIN_DELETE_SELLER',
      req,
      details: { sellerId: id, storeName: seller.storeName },
    });

    res.status(200).json({
      status: 'success',
      message: 'Seller profile removed, associated products deleted, and user role reverted to customer.',
    });
  } catch (error) {
    next(error);
  }
};

export const createSellerDirectly = async (req, res, next) => {
  try {
    const { 
      name, email, password, phoneNumber, 
      storeName, storeDescription, gstin, pan, 
      bankAccountNumber, bankIfsc, bankName, bankAccountHolderName,
      street, city, state, country, postalCode 
    } = req.body;

    // 0. Validate password strength (at least 8 chars, 1 upper, 1 lower, 1 digit, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return next(new BadRequestError('Password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'));
    }

    // 1. Check if email is already taken
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new BadRequestError('Email address is already in use.'));
    }

    // 2. Check if store name is already taken
    const existingStore = await Seller.findOne({ storeName });
    if (existingStore) {
      return next(new BadRequestError('Store name is already in use.'));
    }

    // 3. Create User
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phoneNumber,
      role: 'seller',
      isVerified: true
    });
    await user.save();

    // 4. Create Seller Profile
    const seller = new Seller({
      user: user._id,
      storeName,
      storeDescription,
      gstin,
      pan,
      bankDetails: {
        accountNumber: bankAccountNumber,
        ifsc: bankIfsc,
        bankName,
        accountHolderName: bankAccountHolderName
      },
      storeAddress: {
        street,
        city,
        state,
        country,
        postalCode
      },
      status: 'approved'
    });
    await seller.save();

    // Send welcome and approval notifications to the user
    await sendInAppNotification(
      user._id,
      'info',
      'Welcome to Daykart!',
      `Welcome, ${name}! Your seller account has been directly registered and approved by the administrator.`,
      '/seller/dashboard'
    );

    await logAuditEvent({
      actor: req.user._id,
      action: 'ADMIN_CREATE_SELLER_DIRECTLY',
      req,
      details: { userId: user._id, sellerId: seller._id, storeName },
    });

    res.status(201).json({
      status: 'success',
      message: 'Seller profile registered and approved successfully.',
      data: { seller, user }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('items.product', 'title images SKU price')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    const totalOrders = await Order.countDocuments();
    const rejectedBySellersCount = await Order.countDocuments({
      'statusTimeline': {
        $elemMatch: {
          status: 'cancelled',
          message: 'Order rejected by seller.'
        }
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        totalOrders,
        rejectedBySellersCount,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReferralSettings = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne({ key: 'referral_reward_amount' });
    if (!config) {
      config = await SystemConfig.create({ key: 'referral_reward_amount', value: 50 });
    }
    res.status(200).json({
      status: 'success',
      data: { amount: config.value }
    });
  } catch (error) {
    next(error);
  }
};

export const updateReferralSettings = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (amount === undefined || amount === null || amount < 0) {
      return next(new BadRequestError('Referral reward amount must be a non-negative number.'));
    }

    let config = await SystemConfig.findOne({ key: 'referral_reward_amount' });
    if (!config) {
      config = new SystemConfig({ key: 'referral_reward_amount' });
    }
    config.value = Number(amount);
    await config.save();

    await logAuditEvent({
      actor: req.user._id,
      action: 'ADMIN_UPDATE_REFERRAL_SETTINGS',
      req,
      details: { amount: config.value },
    });

    res.status(200).json({
      status: 'success',
      message: 'Referral reward settings updated successfully.',
      data: { amount: config.value }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminReferrals = async (req, res, next) => {
  try {
    // Find all users who were referred by someone
    const referrals = await User.find({ referredBy: { $exists: true, $ne: null } })
      .select('name email createdAt referredBy')
      .populate('referredBy', 'name email referralCode')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { referrals }
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryApplications = async (req, res, next) => {
  try {
    const users = await User.find({ deliveryStatus: 'pending' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const approveDeliveryPartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved, rejected

    if (!['approved', 'rejected'].includes(status)) {
      return next(new BadRequestError('Invalid status selection. Must be approved or rejected.'));
    }

    const partner = await User.findById(id);
    if (!partner) return next(new NotFoundError('Delivery partner application not found.'));

    partner.deliveryStatus = status;
    if (status === 'approved') {
      partner.role = 'delivery_partner';
    } else {
      partner.role = 'customer';
    }
    await partner.save();

    // Send in-app notification to the user
    await sendInAppNotification(
      partner._id,
      'info',
      status === 'approved' ? 'Delivery Partner Approved' : 'Delivery Application Rejected',
      status === 'approved' 
        ? `Your application to register as a delivery partner has been approved! Welcome to Daykart's courier network.`
        : `Your application to register as a delivery partner was rejected by the administrator.`,
      '/tickets'
    );

    await logAuditEvent({
      actor: req.user._id,
      action: `ADMIN_${status.toUpperCase()}_DELIVERY_PARTNER`,
      req,
      details: { partnerId: partner._id, name: partner.name },
    });

    res.status(200).json({
      status: 'success',
      message: `Delivery partner application status updated to ${status}.`,
      data: { user: partner },
    });
  } catch (error) {
    next(error);
  }
};
