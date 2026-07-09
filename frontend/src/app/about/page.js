'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Sparkles, ShoppingBag, ShieldCheck, Zap, Target, Users, Leaf, Cpu } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 dark:bg-cyan-950/40 text-secondary border border-cyan-100 dark:border-cyan-900/40 rounded-full text-xxs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> E-Commerce Startup Roadmap
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">About Daykart</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
            Pioneering the transition from traditional online retail to instant Same-Day Commerce.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-8">
          {/* Our Core Identity */}
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

          {/* Evolving to Day Commerce Section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-secondary animate-pulse" /> The Transition to Day Commerce
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
              Traditional e-commerce keeps customers waiting for days. Daykart is actively building a hyper-local logistics network to offer <strong>Day Commerce</strong>—delivering your daily essentials, groceries, electronics, and fashion apparel within the same day. By connecting localized micro-fulfillment hubs directly with our courier network, we aim to eliminate multi-day delivery wait times.
            </p>
          </div>

          {/* Enlisted Future Goals */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-secondary" /> Startup Strategic Roadmap
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Goal 1 */}
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                  <Zap className="w-4 h-4 text-orange-400" /> Hyper-Local Dark Stores
                </div>
                <p className="text-xxs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Setting up micro-fulfillment centers (dark stores) in major urban centers to store high-demand inventory, enabling delivery times to shrink from 24 hours down to 2 hours.
                </p>
              </div>

              {/* Goal 2 */}
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                  <Users className="w-4 h-4 text-cyan-400" /> Unified Merchant Empowerment
                </div>
                <p className="text-xxs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Providing local retailers and sellers with advanced inventory prediction tools, giving local shops the technological power to compete with international corporate giants.
                </p>
              </div>

              {/* Goal 3 */}
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                  <Cpu className="w-4 h-4 text-indigo-400" /> AI-Driven Product Bundling
                </div>
                <p className="text-xxs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Using artificial intelligence to detect and bundle lifestyle requirements (e.g., student hostel kits, home office setups) automatically, reducing checkout friction.
                </p>
              </div>

              {/* Goal 4 */}
              <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                  <Leaf className="w-4 h-4 text-emerald-400" /> Eco-Friendly Deliveries
                </div>
                <p className="text-xxs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Aiming to complete 100% of our same-day local shipments via electric delivery vehicles (EVs) and zero-plastic recyclable packaging to support a green future.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
