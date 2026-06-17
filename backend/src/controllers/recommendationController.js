import Product from '../models/Product.js';
import Order from '../models/Order.js';
import redisClient from '../config/redis.js';
import { NotFoundError } from '../utils/customErrors.js';
import logger from '../config/logger.js';

export const getFrequentlyBoughtTogether = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let rules = [];
    if (redisClient.isOpen) {
      const cachedRules = await redisClient.get('apriori:rules');
      if (cachedRules) {
        rules = JSON.parse(cachedRules);
      }
    }

    // Filter rules where antecedent is the target product ID
    const matches = rules.filter(r => r.antecedent === productId);
    
    // Sort matches by confidence and take top 3
    const productIds = matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(r => r.consequent);

    // Fetch actual products
    const products = await Product.find({ _id: { $in: productIds }, status: 'approved' });

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

export const getSimilarProducts = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return next(new NotFoundError('Product not found.'));

    // Content-Based Recommendations: Find products in same category or brand, excluding the product itself
    const products = await Product.find({
      _id: { $ne: productId },
      status: 'approved',
      $or: [
        { category: product.category },
        { brand: product.brand },
        { tags: { $in: product.tags } }
      ]
    })
    .limit(6);

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

export const trackRecentlyViewed = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) return res.status(400).json({ message: 'Product ID required.' });

    const key = `user:${userId}:recent`;

    if (redisClient.isOpen) {
      try {
        // Remove item if it exists in the list to avoid duplicate listings
        await redisClient.lRem(key, 0, productId);
        // Push to front of the list
        await redisClient.lPush(key, productId);
        // Trim list to last 6 entries
        await redisClient.lTrim(key, 0, 5);
        // Set expiry on recent views cache (30 days)
        await redisClient.expire(key, 30 * 24 * 60 * 60);
      } catch (cacheErr) {
        logger.warn(`Redis tracking recent views failed: ${cacheErr.message}`);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Product view tracked.',
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentlyViewed = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const key = `user:${userId}:recent`;

    let productIds = [];
    if (redisClient.isOpen) {
      try {
        productIds = await redisClient.lRange(key, 0, 5);
      } catch (cacheErr) {
        logger.warn(`Redis get recent views failed: ${cacheErr.message}`);
      }
    }

    const products = await Product.find({ _id: { $in: productIds }, status: 'approved' });
    
    // Sort products in the exact order of the Redis list
    const sortedProducts = productIds
      .map(id => products.find(p => p._id.toString() === id))
      .filter(p => p !== undefined);

    res.status(200).json({
      status: 'success',
      results: sortedProducts.length,
      data: { products: sortedProducts },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrendingProducts = async (req, res, next) => {
  try {
    const cacheKey = 'trending:products';

    // 1. Try Redis cache
    if (redisClient.isOpen) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return res.status(200).json({
            status: 'success',
            fromCache: true,
            data: { products: JSON.parse(cached) },
          });
        }
      } catch (cacheErr) {
        logger.warn(`Redis trending cache retrieval error: ${cacheErr.message}`);
      }
    }

    // 2. Aggregate purchases over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 6 }
    ]);

    const productIds = result.map(r => r._id);
    const products = await Product.find({ _id: { $in: productIds }, status: 'approved' });

    // 3. Store results in Redis cache for 2 hours (7200 seconds)
    if (redisClient.isOpen && products.length > 0) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(products), { EX: 7200 });
      } catch (cacheErr) {
        logger.warn(`Redis trending cache store error: ${cacheErr.message}`);
      }
    }

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};
