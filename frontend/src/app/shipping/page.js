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
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <p className="font-semibold text-slate-800 dark:text-slate-300">Introduction</p>
            <p className="mt-2 text-xs">
              At DayKart (operated by <strong>ADHILAKSHMI ENTERPRISES</strong>, Udyam Registration Number: <strong>UDYAM-AP-17-0054999</strong>), we aim to provide a smooth and efficient shopping experience. Our shipping policy is designed to give you transparency regarding the handling and delivery of your orders.
            </p>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">1. Same-Day Shipping</h2>
          <p>
            We are proud to offer <strong>same-day shipping</strong> for orders placed before <strong>12:00 PM (noon) IST</strong> on business days (Monday to Friday, excluding holidays). Orders placed after this cutoff time or on weekends will be shipped the next business day.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">2. Order Processing</h2>
          <p>
            All orders are processed promptly, and we strive to ship products as quickly as possible. However, if any issue arises with your order (e.g., payment failure, inventory issue, or order verification), there may be a <strong>1-2 business day delay</strong> in shipping while we resolve the issue.
          </p>
          <p>
            If your order experiences any delays, you will be notified by our customer support team with an update on the status of your shipment.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">3. Shipping Methods & Delivery Times</h2>
          <p>
            We use reliable courier partners to ensure timely delivery. The expected delivery time will vary based on your location, the shipping method selected at checkout, and any potential unforeseen delays by our shipping partners. Typical delivery times are:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Standard Shipping:</strong> 3-5 business days</li>
            <li><strong>Express Shipping:</strong> 1-2 business days (available for select pin codes)</li>
          </ul>
          <p className="text-xs">
            Note: Delivery times are estimates and can be affected by weather conditions, holidays, or other circumstances beyond our control.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">4. Shipping Costs</h2>
          <p>
            Shipping charges will be calculated at checkout based on the weight, size of the items, and delivery location. We offer free shipping on orders over <strong>2,199 INR</strong>.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">5. Shipping Restrictions</h2>
          <p>
            At this time, we are only able to ship to addresses within <strong>INDIA</strong>. We do not offer international shipping at this time. However, this may change in the future, and we will update our shipping policy accordingly.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">6. Tracking Your Order</h2>
          <p>
            Once your order is shipped, you will receive a tracking number via email or SMS. You can use this tracking number to monitor the status of your shipment on the carrier's website.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">7. Shipping Issues & Customer Support</h2>
          <p>
            If there are any problems with your order’s shipping, such as delays or non-delivery, please contact our customer support team at <strong>daykart.services@gmail.com</strong>. We will work with the carrier to resolve any issues and ensure your order reaches you as soon as possible.
          </p>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6 text-xs text-slate-500">
            <p><strong>Legal Entity Name:</strong> ADHILAKSHMI ENTERPRISES</p>
            <p><strong>Udyam Registration No:</strong> UDYAM-AP-17-0054999</p>
            <p><strong>Registered Address:</strong> Peddapuram, Andhra Pradesh, India</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
