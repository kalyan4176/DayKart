'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ShippingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">Shipping & Delivery Policy</h1>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            The orders for the user are shipped through registered domestic courier companies and/or speed post only. Orders are shipped within <strong>1 days</strong> from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation and delivering of the shipment, subject to courier company / post office norms.
          </p>
          
          <p>
            Platform Owner shall not be liable for any delay in delivery by the courier company / postal authority. Delivery of all orders will be made to the address provided by the buyer at the time of purchase. Delivery of our services will be confirmed on your email ID as specified at the time of registration.
          </p>

          <p>
            If there are any shipping cost(s) levied by the seller or the Platform Owner (as the case be), the same is not refundable.
          </p>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6 text-xs text-slate-500">
            <p><strong>Legal Entity Name:</strong> +91 96523 77187</p>
            <p><strong>Registered Address:</strong> 1-38 Pedda Veedhi, Kandrakota, Peddapuram, Andhra Pradesh, India</p>
            <p><strong>Contact Email:</strong> daykart.services@gmail.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
