import User from '../models/User.js';
import Wishlist from '../models/Wishlist.js';
import Cart from '../models/Cart.js';
import Seller from '../models/Seller.js';
import redisClient from '../config/redis.js';
import { NotFoundError, BadRequestError } from '../utils/customErrors.js';

export const getProfile = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      status: 'success',
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new NotFoundError('User not found.'));
    }

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (avatar) user.avatar = avatar;

    await user.save();

    // Invalidate Redis cache
    if (redisClient.isOpen) {
      await redisClient.del(`user:${user._id}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { street, city, state, country, postalCode, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('User not found.'));

    if (isDefault) {
      // Set all other addresses to false
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push({
      street,
      city,
      state,
      country,
      postalCode,
      isDefault: isDefault || user.addresses.length === 0, // default if first address
    });

    await user.save();

    if (redisClient.isOpen) {
      await redisClient.del(`user:${user._id}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'Address added successfully.',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    next(error);
  }
};

export const removeAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('User not found.'));

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
    
    // Ensure at least one default address remains if addressbook is not empty
    if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    if (redisClient.isOpen) {
      await redisClient.del(`user:${user._id}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'Address removed successfully.',
      data: { addresses: user.addresses },
    });
  } catch (error) {
    next(error);
  }
};

export const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ customer: req.user._id }).populate({
      path: 'products',
      match: { status: 'approved' },
    });

    if (!wishlist) {
      wishlist = new Wishlist({ customer: req.user._id, products: [] });
      await wishlist.save();
    }

    res.status(200).json({
      status: 'success',
      data: { wishlist: wishlist.products },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ customer: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ customer: req.user._id, products: [] });
    }

    const prodIndex = wishlist.products.indexOf(productId);

    if (prodIndex > -1) {
      wishlist.products.splice(prodIndex, 1);
      await wishlist.save();
      return res.status(200).json({
        status: 'success',
        message: 'Product removed from wishlist.',
        added: false,
      });
    } else {
      wishlist.products.push(productId);
      await wishlist.save();
      return res.status(200).json({
        status: 'success',
        message: 'Product added to wishlist.',
        added: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ customer: req.user._id }).populate('items.product');

    if (!cart) {
      cart = new Cart({ customer: req.user._id, items: [] });
      await cart.save();
    }

    res.status(200).json({
      status: 'success',
      data: { cart: cart.items },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCart = async (req, res, next) => {
  try {
    const { productId, variantSku, quantity, action } = req.body;

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      cart = new Cart({ customer: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variantSku === variantSku
    );

    if (action === 'add') {
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity || 1;
      } else {
        cart.items.push({ product: productId, variantSku, quantity: quantity || 1 });
      }
    } else if (action === 'update') {
      if (itemIndex > -1) {
        if (quantity <= 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
      } else {
        return next(new NotFoundError('Item not found in cart.'));
      }
    } else if (action === 'remove') {
      if (itemIndex > -1) {
        cart.items.splice(itemIndex, 1);
      } else {
        return next(new NotFoundError('Item not found in cart.'));
      }
    } else {
      return next(new BadRequestError('Invalid cart action. Use add, update, or remove.'));
    }

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      status: 'success',
      message: 'Cart updated successfully.',
      data: { cart: cart.items },
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerProfile = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    res.status(200).json({
      status: 'success',
      data: { seller },
    });
  } catch (error) {
    next(error);
  }
};

export const createSellerProfile = async (req, res, next) => {
  try {
    const { storeName, storeDescription, gstin, pan, bankDetails, storeAddress } = req.body;

    const existingSeller = await Seller.findOne({ $or: [{ user: req.user._id }, { storeName }] });
    if (existingSeller) {
      return next(new BadRequestError('Seller profile already exists or store name is taken.'));
    }

    const status = process.env.NODE_ENV === 'development' ? 'approved' : 'pending';

    const seller = new Seller({
      user: req.user._id,
      storeName,
      storeDescription,
      gstin,
      pan,
      bankDetails,
      storeAddress,
      status,
    });

    await seller.save();

    res.status(201).json({
      status: 'success',
      message: 'Seller profile created successfully.',
      data: { seller },
    });
  } catch (error) {
    next(error);
  }
};
