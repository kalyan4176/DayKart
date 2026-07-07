import express from 'express';
import { register, verifyOtp, login, refreshToken, logout, forgotPassword, resetPassword, googleLoginMock, sendChangePasswordOtp, changePassword } from '../controllers/authController.js';
import { validate } from '../middlewares/validator.js';
import { protect } from '../middlewares/auth.js';
import { registerSchema, loginSchema, otpSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-otp', validate(otpSchema), verifyOtp);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/google-login', googleLoginMock);

// Secure logged-in password changes
router.post('/change-password-otp', protect, sendChangePasswordOtp);
router.post('/change-password', protect, changePassword);

export default router;
