'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-sm space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <p className="font-semibold text-slate-800 dark:text-slate-300">Introduction</p>
            <p className="mt-2 text-xs">
              <strong>DayKart</strong> is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <strong>daykart.in</strong>, operated by <strong>ADHILAKSHMI ENTERPRISES</strong> (Udyam Registration Number: <strong>UDYAM-AP-17-0054999</strong>).
            </p>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">1. Information We Collect</h2>
          <div className="space-y-2">
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-300">a. Personal Information</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Full name</li>
              <li>Email address</li>
              <li>Billing and shipping address</li>
              <li>Phone number</li>
              <li>Payment information</li>
            </ul>
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-300 mt-2">b. Non-Personal Information</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Browser type</li>
              <li>Device information</li>
              <li>Pages visited, time spent, and referring URLs</li>
            </ul>
            <p className="font-semibold text-xs text-slate-800 dark:text-slate-300 mt-2">c. Cookies and Tracking Technologies</p>
            <p className="text-xs">
              We use cookies, web beacons, and similar technologies to improve your browsing experience and understand user behavior.
            </p>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Process and fulfill orders</li>
            <li>Communicate order status and promotional offers</li>
            <li>Improve our website and customer service</li>
            <li>Detect and prevent fraud or security breaches</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">3. Sharing Your Information</h2>
          <p>
            We do not sell your personal data. We may share it with trusted service providers (such as payment gateways and logistics companies) and legal authorities when required.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">4. Data Retention</h2>
          <p>
            We retain your data only as long as necessary for business, legal, or regulatory needs.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">5. Your Rights and Choices</h2>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Access or update personal data</li>
            <li>Request deletion of your account</li>
            <li>Unsubscribe from marketing emails</li>
            <li>Disable cookies in browser settings</li>
          </ul>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">6. Security of Your Information</h2>
          <p>
            We use secure measures to protect your data, though no method is 100% secure over the Internet.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">7. Children’s Privacy</h2>
          <p>
            We do not knowingly collect information from children under 13. Contact us if you believe a child has provided data.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy. Please review it regularly for changes.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6">9. Contact Us & Grievance Redressal</h2>
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl text-xs space-y-1 border border-slate-100 dark:border-slate-800/80">
            <p className="font-bold text-slate-800 dark:text-slate-200">DayKart (ADHILAKSHMI ENTERPRISES)</p>
            <p><strong>Udyam Registration No:</strong> UDYAM-AP-17-0054999</p>
            <p><strong>Contact Email:</strong> daykart.services@gmail.com</p>
            <p className="text-[10px] text-slate-400 mt-2">© 2025 DayKart. All rights reserved.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
