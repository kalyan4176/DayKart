'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ToastProvider';
import { useLoginMutation, useVerifyOtpMutation } from '@/store/api';
import { setCredentials } from '@/store/authSlice';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  
  const [loginApi, { isLoading: loginLoading }] = useLoginMutation();
  const [verifyOtpApi, { isLoading: otpLoading }] = useVerifyOtpMutation();

  const [otpSent, setOtpSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Forms
  const { register: loginRegister, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const { register: otpRegister, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors } } = useForm({
    resolver: zodResolver(otpSchema),
  });

  const onLogin = async (data) => {
    try {
      setErrorMsg('');
      const res = await loginApi(data).unwrap();
      
      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.accessToken,
      }));
      showToast(`Welcome back, ${res.data.user.name || 'User'}!`, 'success');
      router.push('/');
    } catch (err) {
      if (err.status === 403) {
        // Account unverified, OTP sent
        setUserEmail(data.email);
        setOtpSent(true);
        showToast('Verification OTP sent to your email.', 'info');
      } else {
        setErrorMsg(err.data?.message || 'Login failed. Please check credentials.');
      }
    }
  };

  const onVerifyOtp = async (data) => {
    try {
      setErrorMsg('');
      const res = await verifyOtpApi({ email: userEmail, otp: data.otp }).unwrap();
      
      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.accessToken,
      }));
      showToast('Account verified and logged in successfully!', 'success');
      router.push('/');
    } catch (err) {
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
              {otpSent ? 'Enter Verification Code' : 'Sign in to Daykart'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {otpSent 
                ? `We have sent a 6-digit OTP code to ${userEmail}` 
                : "Welcome back! Please enter your details."}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!otpSent ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@email.com"
                    {...loginRegister('email')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition dark:text-slate-200"
                  />
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                {loginErrors.email && <p className="text-xxs text-red-500 mt-1">{loginErrors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...loginRegister('password')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition dark:text-slate-200"
                  />
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                {loginErrors.password && <p className="text-xxs text-red-500 mt-1">{loginErrors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-secondary hover:bg-cyan-600 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {loginLoading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* OTP Code Verification Form */
            <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    {...otpRegister('otp')}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none text-center font-mono letter-spacing-lg transition dark:text-slate-200"
                  />
                  <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                </div>
                {otpErrors.otp && <p className="text-xxs text-red-500 mt-1">{otpErrors.otp.message}</p>}
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="text-xxs text-slate-500 bg-slate-100/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 leading-relaxed text-center">
                  💡 <strong>Development Hint:</strong> Real email sending is disabled without a configured SMTP provider. Use the bypass code <span className="text-secondary font-bold">123456</span> or look at your backend terminal logs to see the generated OTP.
                </div>
              )}

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {otpLoading ? 'Verifying...' : 'Verify OTP'} <ShieldCheck className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs text-slate-500 hover:text-secondary underline mt-2"
              >
                Back to Login
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
            <span className="text-slate-400">Don't have an account? </span>
            <Link href="/register" className="text-secondary font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
