'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">Terms & Conditions</h1>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-6 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            Welcome to Daykart. By using our website, services, or making a purchase, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">1. Account Security</h2>
          <p>
            When you register on Daykart, you are responsible for maintaining the confidentiality of your account credentials. Any activities that occur under your account are your sole responsibility.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">2. Vendor & Seller Roles</h2>
          <p>
            Sellers on Daykart are independent businesses. While we verify basic registration details, Daykart is not liable for vendor inventory discrepancies, shipping delays by third-party carriers, or individual product defects.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">3. Pricing and Payments</h2>
          <p>
            All prices listed on the marketplace are set by the respective sellers. GST and delivery charges are calculated at checkout based on vendor configuration and delivery destination.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">4. Cancellations & Returns</h2>
          <p>
            Orders can be cancelled by the customer only while they are in the "pending" or "placed" status. Once processed or shipped, cancellations are no longer accepted, and refund/return policies of the respective vendor will apply.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
