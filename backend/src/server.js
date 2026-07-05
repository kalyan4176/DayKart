import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './services/seedService.js';
import { runAprioriPipeline } from './services/aprioriEngine.js';
import { startAutoAssignmentScheduler } from './services/autoAssignmentScheduler.js';
import logger from './config/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket Connected: ${socket.id}`);

  // Customer or courier joins order tracking room
  socket.on('join_order_room', (orderId) => {
    socket.join(`order:${orderId}`);
    logger.info(`Socket ${socket.id} joined room order:${orderId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket Disconnected: ${socket.id}`);
  });
});

// Attach socket server reference to app context
app.set('io', io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedDatabase();

  // Deactivate test coupons on startup
  try {
    const Coupon = (await import('./models/Coupon.js')).default;
    await Coupon.updateMany(
      { code: { $in: ['DAYKART10', 'FLAT500'] } },
      { active: false }
    );
    logger.info('Deactivated seeded testing coupons (DAYKART10, FLAT500) in database.');
  } catch (err) {
    logger.error('Error deactivating test coupons:', err);
  }

  await runAprioriPipeline();
  startAutoAssignmentScheduler();

  server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down... Msg: ${err.message}`, err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! Shutting down... Msg: ${err.message}`, err);
  server.close(() => {
    process.exit(1);
  });
});
export { io };
// Nodemon trigger comment 2
