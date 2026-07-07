'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, AlertTriangle, ArrowRight, CheckCircle2, Gift, Eye, EyeOff, UserPlus, X, ShieldCheck, Loader2, Phone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ToastProvider';
import { useRegisterMutation, useGoogleLoginMutation, useVerifyOtpMutation } from '@/store/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/authSlice';

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string()
    .regex(/^[6-9]\d{9}$/, 'Phone number must be a valid 10-digit number starting with 6-9'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['customer', 'seller', 'delivery_partner']),
  referralCode: z.string().optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Register() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [registerApi, { isLoading }] = useRegisterMutation();
  const [verifyOtpApi, { isLoading: otpLoading }] = useVerifyOtpMutation();

  const [otpSent, setOtpSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register: otpRegister, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors } } = useForm({
    resolver: zodResolver(otpSchema),
  });

  // Google OAuth Mock State
  const [googleLoginApi, { isLoading: googleLoading }] = useGoogleLoginMutation();
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [showGoogleCustomForm, setShowGoogleCustomForm] = useState(false);

  const handleGoogleLogin = useCallback(async (email, name, googleId, idToken = null) => {
    try {
      setErrorMsg('');
      const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email || 'google')}`;
      
      const payload = idToken 
        ? { idToken }
        : { email, name, googleId, avatar };

      const res = await googleLoginApi(payload).unwrap();
      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.accessToken,
      }));
      showToast(`Welcome! Logged in with Google as ${res.data.user.name || 'User'}`, 'success');
      setShowGoogleModal(false);
      
      if (res.data?.user?.role === 'admin') router.push('/admin/dashboard');
      else if (res.data?.user?.role === 'seller') router.push('/seller/dashboard');
      else router.push('/');
    } catch (err) {
      setErrorMsg(err.data?.message || 'Google registration/login failed.');
      setShowGoogleModal(false);
    }
  }, [googleLoginApi, dispatch, router, showToast]);

  useEffect(() => {
    const initGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '825964724032-mock-id.apps.googleusercontent.com',
          callback: async (response) => {
            await handleGoogleLogin(null, null, null, response.credential);
          },
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-login-btn'),
          { 
            theme: 'outline', 
            size: 'large', 
            width: '320', 
            logo_alignment: 'center'
          }
        );
      }
    };

    if (window.google) {
      initGoogleSignIn();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google) {
          initGoogleSignIn();
          clearInterval(checkInterval);
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }
  }, [handleGoogleLogin]);
 
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer' },
  });

  const passwordValue = watch('password') || '';
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam && ['customer', 'seller', 'delivery_partner'].includes(roleParam)) {
        setValue('role', roleParam);
      }
    }
  }, [setValue]);

  const onRegister = async (data) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await registerApi(data).unwrap();
      
      showToast(res.message || 'Registration successful! Verification code sent.', 'success');
      setUserEmail(data.email);
      setOtpSent(true);
    } catch (err) {
      showToast(err.data?.message || 'Registration failed. Please check inputs.', 'error');
      setErrorMsg(err.data?.message || 'Registration failed. Please check inputs.');
    }
  };

  const onVerifyOtp = async (data) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await verifyOtpApi({ email: userEmail, otp: data.otp }).unwrap();
      
      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.accessToken,
      }));
      if (res.data?.user?.deliveryStatus === 'pending') {
        showToast('Account verified! Your Delivery Partner application is pending admin review. Browsing as a customer.', 'info');
      } else {
        showToast('Account verified and logged in successfully!', 'success');
      }
      
      if (res.data?.user?.role === 'admin') router.push('/admin/dashboard');
      else if (res.data?.user?.role === 'seller') router.push('/seller/dashboard');
      else router.push('/');
    } catch (err) {
      showToast(err.data?.message || 'Invalid OTP code. Please try again.', 'error');
      setErrorMsg(err.data?.message || 'Invalid OTP code. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full glass p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {otpSent ? 'Verify Your Email' : 'Create an account'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {otpSent ? 'Confirm your registration details.' : 'Join the Daykart premium marketplace today.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {otpSent ? (
            <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-5 animate-fade-in">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold text-center leading-relaxed">
                We have sent a 6-digit OTP code to <br/>
                <span className="font-bold text-slate-800 dark:text-slate-200">{userEmail}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  {/* Anti-autofill decoy inputs */}
                  <input type="text" name="username" style={{ display: 'none' }} autoComplete="off" />
                  <input type="password" name="password" style={{ display: 'none' }} autoComplete="off" />
                  <input
                    type="text"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    {...otpRegister('otp')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition font-mono tracking-widest text-center text-slate-800 dark:text-slate-200"
                  />
                  <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                {otpErrors.otp && <p className="text-xxs text-red-500 mt-1">{otpErrors.otp.message}</p>}
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-secondary hover:bg-cyan-600 text-white font-bold py-3 rounded-xl shadow-md transition active:scale-98 disabled:opacity-50"
              >
                {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Verify OTP
              </button>

              <div className="text-center text-xs">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 font-semibold hover:underline"
                >
                  Back to Registration
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onRegister)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    {...register('name')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition dark:text-slate-200"
                  />
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                {errors.name && <p className="text-xxs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@email.com"
                    {...register('email')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition dark:text-slate-200"
                  />
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                {errors.email && <p className="text-xxs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="9876543210"
                    {...register('phoneNumber')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition dark:text-slate-200"
                  />
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                {errors.phoneNumber && <p className="text-xxs text-red-500 mt-1">{errors.phoneNumber.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition dark:text-slate-200"
                  />
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xxs text-red-500 mt-1">{errors.password.message}</p>}
                
                {passwordValue.length > 0 && (
                  <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl animate-fade-in text-[10px] sm:text-xxs font-extrabold tracking-wide uppercase">
                    <p className="text-slate-455 dark:text-slate-550 mb-2">Password Requirements Checklist</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className={hasMinLength ? "text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5" : "text-rose-500 dark:text-rose-455 flex items-center gap-1.5"}>
                        <span className="text-xs">{hasMinLength ? "✓" : "✗"}</span>
                        <span>At least 8 characters</span>
                      </div>
                      <div className={hasUppercase ? "text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5" : "text-rose-500 dark:text-rose-455 flex items-center gap-1.5"}>
                        <span className="text-xs">{hasUppercase ? "✓" : "✗"}</span>
                        <span>One uppercase letter</span>
                      </div>
                      <div className={hasLowercase ? "text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5" : "text-rose-500 dark:text-rose-455 flex items-center gap-1.5"}>
                        <span className="text-xs">{hasLowercase ? "✓" : "✗"}</span>
                        <span>One lowercase letter</span>
                      </div>
                      <div className={hasNumber ? "text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5" : "text-rose-500 dark:text-rose-455 flex items-center gap-1.5"}>
                        <span className="text-xs">{hasNumber ? "✓" : "✗"}</span>
                        <span>One number</span>
                      </div>
                      <div className={hasSpecial ? "text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5" : "text-rose-500 dark:text-rose-455 flex items-center gap-1.5"}>
                        <span className="text-xs">{hasSpecial ? "✓" : "✗"}</span>
                        <span>One special character</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition dark:text-slate-200"
                  />
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-655 dark:hover:text-slate-350 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xxs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Account Type
                </label>
                <select
                  {...register('role')}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-sm outline-none transition dark:text-slate-200"
                >
                  <option value="customer">Customer (Buy Products)</option>
                  <option value="seller">Seller (Sell Products)</option>
                  <option value="delivery_partner">Delivery Partner (Ship Parcels)</option>
                </select>
                {errors.role && <p className="text-xxs text-red-500 mt-1">{errors.role.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. KALYAN1234"
                    {...register('referralCode')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
                  />
                  <Gift className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                {errors.referralCode && <p className="text-xxs text-red-500 mt-1">{errors.referralCode.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-secondary hover:bg-cyan-600 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <span className="relative px-3 bg-white dark:bg-slate-900 text-xxs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  or
                </span>
              </div>

              <div className="w-full flex justify-center py-1">
                <div id="google-login-btn" className="w-full min-h-[44px] flex justify-center"></div>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
            <span className="text-slate-400">Already have an account? </span>
            <Link href="/login" className="text-secondary font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Simulated Google Accounts Selector Modal */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setShowGoogleModal(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mt-3 mb-6">
                <svg className="w-10 h-10 mb-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Choose an account</h3>
                <p className="text-xxs text-slate-400 mt-1">to continue to <span className="font-bold text-secondary">Daykart</span></p>
              </div>

              {!showGoogleCustomForm ? (
                <div className="space-y-3">
                  {/* Account 1: Jane Customer */}
                  <button
                    onClick={() => handleGoogleLogin('jane@example.com', 'Jane Customer', 'mock-google-jane-123')}
                    className="w-full flex items-center gap-3 p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 text-left transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-700 text-xs">
                      JC
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Jane Customer</p>
                      <p className="text-[10px] text-slate-400 truncate">jane@example.com</p>
                    </div>
                    <span className="text-[10px] font-bold text-secondary uppercase bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-150 dark:border-cyan-900 px-2 py-0.5 rounded-full">
                      Customer
                    </span>
                  </button>

                  {/* Account 2: John Seller */}
                  <button
                    onClick={() => handleGoogleLogin('john@example.com', 'John Seller', 'mock-google-john-123')}
                    className="w-full flex items-center gap-3 p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 text-left transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center font-bold text-orange-600 text-xs">
                      JS
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">John Seller</p>
                      <p className="text-[10px] text-slate-400 truncate">john@example.com</p>
                    </div>
                    <span className="text-[10px] font-bold text-accent uppercase bg-orange-50 dark:bg-orange-950/20 border border-orange-150 dark:border-orange-900 px-2 py-0.5 rounded-full">
                      Seller
                    </span>
                  </button>

                  {/* Option 3: Custom account */}
                  <button
                    onClick={() => setShowGoogleCustomForm(true)}
                    className="w-full flex items-center gap-3 p-3.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 text-left transition text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Use another account</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alice Smith"
                      value={googleCustomName}
                      onChange={(e) => setGoogleCustomName(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="alice@gmail.com"
                      value={googleCustomEmail}
                      onChange={(e) => setGoogleCustomEmail(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGoogleCustomForm(false);
                        setGoogleCustomEmail('');
                        setGoogleCustomName('');
                      }}
                      className="flex-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold py-2.5 rounded-xl text-xs transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!googleCustomEmail.trim() || !googleCustomName.trim()}
                      onClick={() => handleGoogleLogin(googleCustomEmail.trim(), googleCustomName.trim(), `mock-google-${Date.now()}`)}
                      className="flex-1 bg-secondary hover:bg-cyan-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
