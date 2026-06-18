'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-6 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            At Daykart, we value your trust and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and share information when you use our marketplace.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">1. Information We Collect</h2>
          <p>
            We collect personal information that you provide to us, such as your name, email address, phone number, shipping and billing addresses, and payment details during registration or checkout.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">2. How We Use Your Information</h2>
          <p>
            We use your data to process orders, verify vendor statuses, deliver parcels, calculate taxes (like GST), analyze shopping patterns, and send security OTPs.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">3. Data Sharing</h2>
          <p>
            We share relevant transaction details (e.g. shipping address, product order quantities) with the specific sellers of the items you purchase and our assigned delivery partners to ensure smooth fulfillment. We never sell your personal information to third-party advertisers.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
