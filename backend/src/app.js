import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';

import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import productRouter from './routes/productRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import couponRouter from './routes/couponRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import supportRouter from './routes/supportRoutes.js';
import recommendationRouter from './routes/recommendationRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import heroSlideRouter from './routes/heroSlideRoutes.js';
import shippingRouter from './routes/shippingRoutes.js';

import errorHandler from './middlewares/errorHandler.js';
import { NotFoundError } from './utils/customErrors.js';

const app = express();

// Trust proxy for rate limiting on Render / Vercel
app.set('trust proxy', 1);

// 1. Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. CORS setup supporting client credential transfers
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5005'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      origin.includes('localhost:');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// 3. Body parsers and cookie handler
app.use(express.json({ limit: '10kb' })); // protect against large payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 4. Data sanitization against NoSQL injection
app.use(mongoSanitize());

// 5. Global Rate Limiter to prevent Brute Force (150 requests per 15 minutes, elevated in dev)
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 5000 : 1000,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// 6. Specific login rate limit (elevated in dev)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 5000 : 150, // max 15 requests per 15 min for login/auth
  message: {
    status: 'fail',
    message: 'Too many auth attempts. Please try again in 15 minutes.'
  }
});
app.use('/api/v1/auth/login', loginLimiter);

// Serve static uploads
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// Root health check endpoint (returns 200 OK for Render / Vercel health checks)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Daykart Backend API is running successfully.'
  });
});

// 7. Mount API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/coupons', couponRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/support', supportRouter);
app.use('/api/v1/recommendations', recommendationRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/hero-slides', heroSlideRouter);
app.use('/api/v1/shipping-rules', shippingRouter);


// 8. 404 Route handler
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// 9. Global Express Error Handler
app.use(errorHandler);

export default app;
