import { createClient } from 'redis';
import logger from './logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        logger.warn('Redis reconnection attempts exhausted. Operating without Redis cache.');
        return false; // stop retrying
      }
      return Math.min(retries * 1000, 5000);
    }
  }
});

redisClient.on('error', (err) => {
  // Only log if client connection isn't closed permanently
  if (redisClient.isOpen) {
    logger.error(`Redis Client Error: ${err.message}`);
  }
});
redisClient.on('connect', () => logger.info('Redis Client Connected'));

// Connect asynchronously and log errors
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error(`Failed to connect to Redis: ${err.message}`);
  }
};

connectRedis();

export default redisClient;
