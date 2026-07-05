import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import redisClient from '../config/redis.js';
import { BadRequestError, NotFoundError } from '../utils/customErrors.js';

// Helper to recalculate average ratings
const updateProductRatings = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  const ratingAvg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const ratingCount = stats.length > 0 ? stats[0].nRating : 0;

  await Product.findByIdAndUpdate(productId, {
    'ratings.average': ratingAvg,
    'ratings.count': ratingCount,
  });

  // Invalidate Redis cache
  if (redisClient.isOpen) {
    await redisClient.del(`product:detail:${productId}`);
  }
};

export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, text, images, videos } = req.body;

    if (!productId || !rating || !text) {
      return next(new BadRequestError('Product ID, rating, and text are required.'));
    }

    const product = await Product.findById(productId);
    if (!product) return next(new NotFoundError('Product not found.'));

    // Check duplicate review
    const duplicate = await Review.findOne({ product: productId, customer: req.user._id });
    if (duplicate) {
      return next(new BadRequestError('You have already reviewed this product. Please update your existing review.'));
    }

    // Verify Purchase: Check if user has a delivered order for this product
    const purchased = await Order.findOne({
      customer: req.user._id,
      status: 'delivered',
      'items.product': productId,
    });

    const isVerifiedPurchase = !!purchased;

    const review = new Review({
      product: productId,
      customer: req.user._id,
      rating: Number(rating),
      text,
      images,
      videos,
      isVerifiedPurchase,
    });

    await review.save();

    // Recalculate average ratings
    await updateProductRatings(productId);

    res.status(201).json({
      status: 'success',
      message: 'Review posted successfully.',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId, status: 'approved' })
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};

export const voteHelpful = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) return next(new NotFoundError('Review not found.'));

    const voterId = req.user._id;
    const index = review.helpfulVotes.indexOf(voterId);

    if (index > -1) {
      // Unvote if clicked again
      review.helpfulVotes.splice(index, 1);
    } else {
      review.helpfulVotes.push(voterId);
    }

    await review.save();

    res.status(200).json({
      status: 'success',
      helpfulCount: review.helpfulVotes.length,
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved, rejected

    if (!['approved', 'rejected'].includes(status)) {
      return next(new BadRequestError('Invalid status. Use approved or rejected.'));
    }

    const review = await Review.findById(id);
    if (!review) return next(new NotFoundError('Review not found.'));

    review.status = status;
    await review.save();

    // Recalculate rating stats
    await updateProductRatings(review.product);

    res.status(200).json({
      status: 'success',
      message: `Review moderation status set to ${status}.`,
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};
