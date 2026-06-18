'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ToastProvider';
import { useRegisterMutation } from '@/store/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'seller', 'delivery_partner']),
});

export default function Register() {
  const router = useRouter();
  const { showToast } = useToast();
  const [registerApi, { isLoading }] = useRegisterMutation();

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer' },
  });

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
      setSuccessMsg(res.message || 'Registration successful! Verification code sent.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      showToast(err.data?.message || 'Registration failed. Please check inputs.', 'error');
      setErrorMsg(err.data?.message || 'Registration failed. Please check inputs.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full glass p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Join the Daykart premium marketplace today.
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
              <span>{successMsg} Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onRegister)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="John Doe"
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
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition dark:text-slate-200"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              {errors.password && <p className="text-xxs text-red-500 mt-1">{errors.password.message}</p>}
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-secondary hover:bg-cyan-600 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
            <span className="text-slate-400">Already have an account? </span>
            <Link href="/login" className="text-secondary font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
