'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">Terms & Conditions</h1>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <p className="font-semibold text-slate-800 dark:text-slate-300">Introduction</p>
            <p className="mt-2 text-xs">
              Welcome to <strong>DayKart.in</strong>, your trusted e-commerce platform. These terms and conditions govern your use of our website, services, and products. This platform is owned and operated by <strong>ADHILAKSHMI ENTERPRISES</strong> (Udyam Registration Number: <strong>UDYAM-AP-17-0054999</strong>). Please read them carefully before using our site.
            </p>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the website and services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, you should stop using the platform immediately.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">2. Account Registration</h2>
          <p>
            To make purchases, you must register on our platform by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account and password.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">3. Products and Pricing</h2>
          <p>
            All products listed on our platform are subject to availability. We strive to ensure all prices are accurate, but we reserve the right to change them without notice. Taxes and shipping charges are calculated at checkout.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">4. Payment Terms</h2>
          <p>
            We accept various payment methods, including credit/debit cards and online payment gateways. Payment is due at the time of purchase, and you agree to pay for all orders made through your account.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">5. Shipping & Delivery</h2>
          <p>
            We aim to ship orders within 1-2 business days. Delivery times may vary based on location, and we are not liable for delays caused by third-party couriers.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">6. Returns and Refunds</h2>
          <p>
            Our return policy allows you to do Replacement only; we offer No-Refunds. If the order was completed via cash-on-delivery, no money will be refunded.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">7. Limitation of Liability</h2>
          <p>
            We are not liable for any indirect, incidental, or consequential damages arising from your use of our platform, including loss of profits, data, or business opportunities.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">8. Intellectual Property</h2>
          <p>
            The content on this website, including text, graphics, logos, and images, is protected by copyright laws. You may not use, reproduce, or distribute any of the content without prior written permission from the platform owner.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">9. Privacy Policy</h2>
          <p>
            We are committed to protecting your privacy. Please refer to our Privacy Policy for more information on how we collect and use your personal data.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">10. Governing Law</h2>
          <p>
            These Terms & Conditions are governed by the laws of INDIA. Any disputes arising from the use of the website shall be subject to the exclusive jurisdiction of the courts in <strong>Peddapuram, INDIA</strong>.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms & Conditions at any time. Any changes will be posted on this page with an updated date. By continuing to use the platform, you agree to the updated terms.
          </p>
          
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6 text-xs text-slate-500">
            <p><strong>Legal Entity Name:</strong> ADHILAKSHMI ENTERPRISES</p>
            <p><strong>Udyam Registration No:</strong> UDYAM-AP-17-0054999</p>
            <p><strong>Registered Address:</strong> Peddapuram, Andhra Pradesh, India</p>
            <p><strong>Contact Email:</strong> daykart.services@gmail.com</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
