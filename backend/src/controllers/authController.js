import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js';
import transporter from '../config/mailer.js';
import { sendTokenResponse } from '../utils/token.js';
import { logAuditEvent } from '../services/auditService.js';
import { AppError, BadRequestError, UnauthorizedError, NotFoundError } from '../utils/customErrors.js';
import logger from '../config/logger.js';
import { sendInAppNotification } from '../utils/notificationHelper.js';

// Helper to generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP Email
const sendOTPEmail = async (email, otp, name) => {
  try {
    const mailOptions = {
      from: `"Daykart Support" <support@daykart.com>`,
      to: email,
      subject: 'Daykart Account Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #06b6d4; text-align: center;">Welcome to Daykart!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a; border: 1px dashed #06b6d4; padding: 10px 20px; border-radius: 4px;">${otp}</span>
          </div>
          <p>This OTP is valid for 10 minutes. Do not share this OTP with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">If you did not request this email, please ignore it.</p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    logger.info(`OTP Email successfully sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending OTP email: ${error.message}`);
    // Fallback: print to console for development
    logger.info(`[DEVELOPMENT BACKUP] Verification OTP for ${email}: ${otp}`);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new BadRequestError('Email address is already in use.'));
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = new User({
      name,
      email,
      password,
      role: role || 'customer',
      otp,
      otpExpires,
    });

    await user.save();

    // Send email asynchronously
    sendOTPEmail(email, otp, name);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Please verify the OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new NotFoundError('User not found.'));
    }

    if (user.isVerified) {
      return next(new BadRequestError('User is already verified. Please log in directly.'));
    }

    const isDevelopmentBypass = process.env.NODE_ENV === 'development' && otp === '123456';
    if (!isDevelopmentBypass && (user.otp !== otp || user.otpExpires < new Date())) {
      return next(new BadRequestError('Invalid or expired OTP.'));
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send in-app welcome notification
    await sendInAppNotification(
      user._id,
      'info',
      'Welcome to Daykart!',
      `Welcome to Daykart, ${user.name}! We are thrilled to have you here. Start exploring our smart marketplace!`,
      '/products'
    );

    await logAuditEvent({
      actor: user._id,
      action: 'USER_VERIFY_EMAIL',
      req,
      details: { email: user.email },
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return next(new UnauthorizedError('Incorrect email or password.'));
    }

    if (!user.isVerified) {
      // Regenerate OTP
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      
      sendOTPEmail(email, otp, user.name);

      return res.status(403).json({
        status: 'fail',
        message: 'Account not verified. A new verification OTP has been sent to your email.',
      });
    }

    await logAuditEvent({
      actor: user._id,
      action: 'USER_LOGIN',
      req,
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    let token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
      return next(new BadRequestError('Refresh token is required.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(new UnauthorizedError('Invalid refresh token. Please log in again.'));
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // Invalidate Redis session cache
    if (userId && redisClient.isOpen) {
      await redisClient.del(`user:${userId}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return next(new NotFoundError('No account found with this email.'));
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendOTPEmail(email, otp, user.name);

    res.status(200).json({
      status: 'success',
      message: 'Password reset OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return next(new NotFoundError('No account found with this email.'));
    }

    const isDevelopmentBypass = process.env.NODE_ENV === 'development' && otp === '123456';
    if (!isDevelopmentBypass && (user.otp !== otp || user.otpExpires < new Date())) {
      return next(new BadRequestError('Invalid or expired OTP.'));
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    
    // Invalidate session cache
    if (redisClient.isOpen) {
      await redisClient.del(`user:${user._id}`);
    }

    await user.save();

    await logAuditEvent({
      actor: user._id,
      action: 'USER_RESET_PASSWORD',
      req,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

export const googleLoginMock = async (req, res, next) => {
  try {
    const { email, name, googleId, avatar } = req.body;

    if (!email || !googleId) {
      return next(new BadRequestError('Email and Google ID are required.'));
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        googleId,
        avatar,
        isVerified: true, // OAuth is pre-verified
      });
      await user.save();
    } else if (!user.googleId) {
      // Link google account to existing email
      user.googleId = googleId;
      if (avatar && !user.avatar) user.avatar = avatar;
      await user.save();
    }

    await logAuditEvent({
      actor: user._id,
      action: 'USER_GOOGLE_LOGIN',
      req,
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
