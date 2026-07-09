'use client';

import React from 'react';
import Link from 'next/link';
import { useGetCategoriesQuery } from '@/store/api';

export default function Footer() {
  const { data: categoriesRes } = useGetCategoriesQuery();
  const categories = categoriesRes?.data?.categories || [];

  // Fallback default categories to display when loading or empty
  const displayCategories = categories.length > 0
    ? categories.slice(0, 5)
    : [
        { name: 'Electronics', slug: 'electronics' },
        { name: 'Mobiles', slug: 'mobiles' },
        { name: 'Fashion & Apparel', slug: 'fashion' },
        { name: 'Home & Kitchen', slug: 'home-kitchen' }
      ];

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-orange-500 bg-clip-text text-transparent">
              DAYKART
            </span>
            <p className="mt-4 text-sm text-slate-500">
              The next-generation marketplace delivering premium multi-vendor shopping, lightning-fast cash on delivery, and intelligent recommendations.
            </p>
          </div>

          {/* Shopping */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Shop Categories</h4>
            <ul className="space-y-2 text-sm">
              {displayCategories.map((category) => (
                <li key={category._id || category.slug}>
                  <Link href={`/products?category=${category.slug}`} className="hover:text-cyan-400 transition">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tickets" className="hover:text-cyan-400 transition">My Support Tickets</Link></li>
              <li><Link href="/profile" className="hover:text-cyan-400 transition">Account Profile</Link></li>
              <li><Link href="/cart" className="hover:text-cyan-400 transition">Shopping Bag</Link></li>
              <li><Link href="/orders" className="hover:text-cyan-400 transition">Order History</Link></li>
            </ul>
          </div>

          {/* Corporate */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Daykart</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-cyan-400 transition">About Us</Link></li>
              <li><Link href="/terms" className="hover:text-cyan-400 transition">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-cyan-400 transition">Privacy Policy</Link></li>
              <li><Link href="/refund" className="hover:text-cyan-400 transition">Cancellation & Refund Policy</Link></li>
              <li><Link href="/shipping" className="hover:text-cyan-400 transition">Shipping Policy</Link></li>
              <li><Link href="/register?role=seller" className="text-orange-400 hover:text-orange-300 font-semibold transition">Become a Seller</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Daykart. All rights reserved.</p>
          <p className="text-center md:text-right text-[10px] text-slate-650 leading-relaxed max-w-lg">
            This platform is owned and operated by <strong>ADHILAKSHMI ENTERPRISES</strong> (Udyam Registration Number: <strong>UDYAM-AP-17-0054999</strong>).
          </p>
        </div>
      </div>
    </footer>
  );
}
