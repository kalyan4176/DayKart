'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RefundPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">Cancellation & Refund Policy</h1>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <p className="font-semibold text-slate-800 dark:text-slate-300">Introduction</p>
            <p className="mt-2 text-xs">
              At DayKart (operated by <strong>ADHILAKSHMI ENTERPRISES</strong>, Udyam Registration Number: <strong>UDYAM-AP-17-0054999</strong>), we want you to be completely satisfied with your purchase. We understand that sometimes, products may need to be exchanged. While we do not offer refunds, we provide a <strong>replacement</strong> for products with issues, but only under specific conditions.
            </p>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">1. No Refunds, Only Replacements</h2>
          <p>
            We do not offer refunds for products purchased from our platform. However, if there is a problem with the item you received, we offer a <strong>replacement</strong> under the following circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>The product is damaged or defective.</li>
            <li>The wrong item was delivered.</li>
          </ul>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">2. Replacement Policy</h2>
          <p>
            In the event that you receive a damaged, defective, or incorrect item, you are eligible for a <strong>replacement</strong> under the following conditions:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>You must request a replacement <strong>within 24 hours of delivery</strong>.</li>
            <li>The item must be returned in its original condition and packaging.</li>
            <li>You must provide proof of damage, defect, or error (e.g., photos of the damaged product).</li>
          </ul>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">3. Process for Requesting a Replacement</h2>
          <p>
            If you wish to request a replacement, please follow these steps:
          </p>
          <ul className="list-decimal pl-5 space-y-1 text-xs">
            <li>Contact our customer support team at <strong>daykart.services@gmail.com</strong> within 24 hours of receiving your order.</li>
            <li>Provide your order number, along with a detailed description of the issue and any supporting images (if applicable).</li>
            <li>Once we verify the issue, we will arrange for the replacement product to be sent to you.</li>
          </ul>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">4. Non-Eligible Items</h2>
          <p>
            The following items are <strong>not eligible</strong> for replacement under this policy:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Products that are used, damaged, or altered by the customer after delivery.</li>
            <li>Items that are returned without the original packaging or missing components.</li>
            <li>Items marked as "non-returnable" or "final sale" at the time of purchase.</li>
          </ul>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">5. Shipping Costs for Replacements</h2>
          <p>
            We will cover the shipping cost for the replacement item in cases of damaged, defective, or wrong items. However, in cases where the item is in good condition, the customer may be required to bear the shipping charges for returns or replacements.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">6. Replacement Limitations</h2>
          <p>
            We can only offer a <strong>one-time replacement</strong> for any given product. If a product is replaced, no further replacements will be provided for the same issue or item.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">7. Contact Us</h2>
          <p>
            If you have any questions regarding this policy or need assistance, please reach out to our customer support team at <strong>daykart.services@gmail.com</strong> or phone at <strong>+91 96523 77187</strong>. Our team is here to help resolve any issues as quickly as possible.
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
