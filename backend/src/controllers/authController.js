import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js';
import transporter from '../config/mailer.js';
import { sendTokenResponse } from '../utils/token.js';
import { logAuditEvent } from '../services/auditService.js';
import { AppError, BadRequestError, UnauthorizedError, NotFoundError } from '../utils/customErrors.js';
import logger from '../config/logger.js';
import { sendInAppNotification } from '../utils/notificationHelper.js';
import SystemConfig from '../models/SystemConfig.js';

// Helper to generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP Email
const sendOTPEmail = async (email, otp, name) => {
  try {
    const sender = process.env.EMAIL_FROM || process.env.SMTP_USER || 'support@daykart.com';
    const mailOptions = {
      from: `"Daykart Support" <${sender}>`,
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
    const { name, email, password, role, referralCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new BadRequestError('Email address is already in use.'));
    }

    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
      if (!referredByUser) {
        return next(new BadRequestError('Invalid referral code.'));
      }
    }

    // Generate unique referral code for the registering user
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 6);
    let randCode = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}`;
    let exists = await User.findOne({ referralCode: randCode });
    while (exists) {
      randCode = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}`;
      exists = await User.findOne({ referralCode: randCode });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let initialWallet = { balance: 0, transactions: [] };
    if (referredByUser) {
      let rewardAmountConfig = await SystemConfig.findOne({ key: 'referral_reward_amount' });
      const rewardAmount = rewardAmountConfig ? Number(rewardAmountConfig.value) : 50;

      initialWallet = {
        balance: rewardAmount,
        transactions: [{
          amount: rewardAmount,
          type: 'credit',
          description: `Referral sign-up bonus (referred by ${referredByUser.name})`,
          timestamp: new Date()
        }]
      };
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'customer',
      otp,
      otpExpires,
      referralCode: randCode,
      referredBy: referredByUser ? referredByUser._id : undefined,
      wallet: initialWallet
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

    // Credit referral rewards to referrer
    if (user.referredBy) {
      try {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          let rewardAmountConfig = await SystemConfig.findOne({ key: 'referral_reward_amount' });
          const rewardAmount = rewardAmountConfig ? Number(rewardAmountConfig.value) : 50;
          
          if (!referrer.wallet) {
            referrer.wallet = { balance: 0, transactions: [] };
          }
          referrer.wallet.balance += rewardAmount;
          referrer.wallet.transactions.push({
            amount: rewardAmount,
            type: 'credit',
            description: `Referral bonus for referring ${user.name}`
          });
          
          await referrer.save();
          
          // Delete referrer user Redis cache key to avoid stale user details
          if (redisClient.isOpen) {
            await redisClient.del(`user:${referrer._id}`);
          }
          
          // Send notification to referrer
          await sendInAppNotification(
            referrer._id,
            'info',
            'Referral Bonus Credited!',
            `Congratulations! You have received a ₹${rewardAmount} referral bonus for inviting ${user.name} to Daykart.`,
            '/profile'
          );
        }
      } catch (refErr) {
        logger.error(`Error crediting referral bonus: ${refErr.message}`);
      }
    }

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
      user.isVerified = true;
      await user.save();
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
    // 1. Always clear cookies (forces the browser to discard them)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    // 2. Try to extract token to clean up Redis cache (graceful optional fallback)
    let token;
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback-access-secret');
        if (decoded?.id && redisClient.isOpen) {
          await redisClient.del(`user:${decoded.id}`);
        }
      } catch (tokenErr) {
        // Suppress errors during logout token verification so the route always succeeds
      }
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
    const { idToken, email: mockEmail, name: mockName, googleId: mockGoogleId, avatar: mockAvatar } = req.body;

    let email = mockEmail;
    let name = mockName;
    let googleId = mockGoogleId;
    let avatar = mockAvatar;

    if (idToken) {
      // Real Google Sign-In Token Verification
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!response.ok) {
          return next(new UnauthorizedError('Invalid Google credential token.'));
        }
        const payload = await response.json();

        // Check Client ID matches if configured
        const expectedClientId = process.env.GOOGLE_CLIENT_ID;
        if (expectedClientId && payload.aud !== expectedClientId) {
          return next(new UnauthorizedError('Google credential token client ID mismatch.'));
        }

        email = payload.email;
        name = payload.name;
        googleId = payload.sub; // sub is the stable Google user ID
        avatar = payload.picture;
      } catch (fetchErr) {
        return next(new UnauthorizedError(`Failed to verify Google token: ${fetchErr.message}`));
      }
    } else {
      // Mock parameter validation (only allowed in development/test)
      if (process.env.NODE_ENV === 'production') {
        return next(new BadRequestError('Mock Google login is disabled in production. ID Token is required.'));
      }
    }

    if (!email || !googleId) {
      return next(new BadRequestError('Email and Google ID are required.'));
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Generate unique referral code for the registering user
      const cleanName = (name || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 6);
      let randCode = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}`;
      let exists = await User.findOne({ referralCode: randCode });
      while (exists) {
        randCode = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}`;
        exists = await User.findOne({ referralCode: randCode });
      }

      user = new User({
        name,
        email,
        googleId,
        avatar,
        referralCode: randCode,
        isVerified: true, // OAuth is pre-verified
      });
      await user.save();
    } else {
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (!user.referralCode) {
        const cleanName = (user.name || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 6);
        let randCode = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}`;
        let exists = await User.findOne({ referralCode: randCode });
        while (exists) {
          randCode = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}`;
          exists = await User.findOne({ referralCode: randCode });
        }
        user.referralCode = randCode;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
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
