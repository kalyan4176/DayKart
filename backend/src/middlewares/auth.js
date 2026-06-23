import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redisClient from '../config/redis.js';
import { UnauthorizedError, ForbiddenError } from '../utils/customErrors.js';
import logger from '../config/logger.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    // 1. Get token from cookies or auth headers
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return next(new UnauthorizedError('You are not logged in. Please log in to get access.'));
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback-access-secret');

    // 3. Performance Caching Check: Check if user exists in Redis cache
    let user = null;
    const cacheKey = `user:${decoded.id}`;
    
    if (redisClient.isOpen) {
      try {
        const cachedUser = await redisClient.get(cacheKey);
        if (cachedUser) {
          user = JSON.parse(cachedUser);
        }
      } catch (cacheErr) {
        logger.warn(`Redis fetch error in auth protect: ${cacheErr.message}`);
      }
    }

    // 4. Cache Miss: Query MongoDB
    if (!user) {
      user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
      }
      
      // Cache user info in Redis for 15 minutes (900 seconds)
      if (redisClient.isOpen) {
        try {
          await redisClient.set(cacheKey, JSON.stringify(user), { EX: 900 });
        } catch (cacheErr) {
          logger.warn(`Redis store error in auth protect: ${cacheErr.message}`);
        }
      }
    }

    // 5. Grant Access
    req.user = user;
    next();
  } catch (error) {
    next(new UnauthorizedError('Authentication failed. Invalid or expired token.'));
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }
    next();
  };
};
