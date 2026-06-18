'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Sparkles, ShoppingBag, ShieldCheck, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 dark:bg-cyan-950/40 text-secondary border border-cyan-100 dark:border-cyan-900/40 rounded-full text-xxs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Premium Marketplace
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">About Daykart</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
            Experience the future of multi-vendor shopping, engineered with premium aesthetics and dynamic responsiveness.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-secondary" /> Our Vision
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
              Daykart is a state-of-the-art e-commerce platform designed to bridge the gap between customers and local/international sellers. We prioritize speed, security, and a visually stunning user interface that feels premium on any device.
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-secondary" /> Security & Trust
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
              Every vendor on our marketplace goes through a rigorous KYC onboarding process. We verify GSTIN details, bank details, and trade documentation to ensure all products sold are genuine. Our platform supports secure checkout with automated tax calculations and tracking.
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-secondary" /> Built for the Future
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
              Engineered using Next.js, Redux, Express, and MongoDB, Daykart incorporates the latest trends in web design, including smooth micro-animations, theme support, custom promotion coupons, and intelligent product recommendations.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
