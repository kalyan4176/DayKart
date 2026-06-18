'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { ArrowRight, Flame, Sparkles, Monitor, Shirt, Home as HomeIcon, Award, Zap, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useGetProductsQuery, useGetTrendingProductsQuery, useGetRecentlyViewedQuery } from '@/store/api';

const CATEGORIES = [
  { name: 'Mobiles', slug: 'mobiles', icon: Zap, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-950/40' },
  { name: 'Laptops', slug: 'laptops', icon: Monitor, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-950/40' },
  { name: 'Fashion', slug: 'fashion', icon: Shirt, color: 'text-orange-500 bg-orange-100 dark:bg-orange-950/40' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: HomeIcon, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40' }
];

export default function Home() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Fetch queries
  const { data: trendingRes, isLoading: trendingLoading } = useGetTrendingProductsQuery();
  const { data: productsRes, isLoading: productsLoading } = useGetProductsQuery({ limit: 8 });
  const { data: recentRes } = useGetRecentlyViewedQuery(undefined, { skip: !isAuthenticated });

  const trendingProducts = trendingRes?.data?.products || [];
  const products = productsRes?.data?.products || [];
  const recentProducts = recentRes?.data?.products || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Hero Banner Section */}
        <section className="relative overflow-hidden bg-slate-900 text-white pt-10 pb-12 sm:py-16 lg:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e293b,transparent_70%)]" />
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute left-10 top-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-orange-400 font-bold mb-4 sm:mb-6">
                  <Sparkles className="w-4 h-4 text-orange-400 animate-spin" />
                  THE ULTIMATE SHOPPING EXPERIENCE
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                  Discover the Future of <br />
                  <span className="bg-gradient-to-r from-cyan-400 to-orange-500 bg-clip-text text-transparent">
                    Smart Shopping
                  </span>
                </h1>

                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-400 max-w-lg leading-relaxed">
                  Daykart brings together verified sellers, high-end tech, stylish fashion, and smart product bundles under a lag-free custom user interface.
                </p>

                <div className="mt-6 sm:mt-8 lg:mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-secondary hover:bg-cyan-600 text-white font-bold px-8 py-3.5 rounded-full shadow-lg transition duration-300 transform hover:scale-103"
                  >
                    Shop Collection <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                  <Link
                    href="/register?role=seller"
                    className="inline-flex items-center gap-2 border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-full transition duration-300"
                  >
                    Sell on Daykart
                  </Link>
                </div>
              </div>

              {/* Glassmorphic Features Card */}
              <div className="lg:block hidden">
                <div className="bg-white p-8 rounded-3xl max-w-md mx-auto shadow-2xl relative border border-slate-100">
                  <div className="absolute -top-4 -right-4 bg-orange-500 text-white p-3 rounded-2xl shadow-lg transform rotate-6">
                    <Flame className="w-6 h-6 fill-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800">Why Shop With Us?</h3>
                  <div className="mt-6 space-y-6">
                    <div className="flex gap-4">
                      <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center h-11 w-11">
                        <Zap className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-700">Sub-5ms Page Loads</h4>
                        <p className="text-xs text-slate-500 mt-1">Utilizes high-speed Redis caching layers so your browsing has zero delays.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center h-11 w-11">
                        <Award className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-700">Apriori Recommendations</h4>
                        <p className="text-xs text-slate-500 mt-1">Intelligent market basket algorithm matches frequently bought combinations.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center h-11 w-11">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-700">Enterprise Security</h4>
                        <p className="text-xs text-slate-500 mt-1">HttpOnly session cookies, CSRF protection, and audit trails safeguard transfers.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Browse Top Categories
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="flex items-center gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-secondary hover:shadow-md transition-all duration-300"
                >
                  <div className={`p-3 rounded-xl ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{cat.name}</h3>
                    <p className="text-xxs text-slate-400 mt-0.5">Explore Products</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Trending Section */}
        {trendingProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Trending This Week</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {trendingLoading ? (
                Array(6).fill(0).map((_, i) => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)
              ) : (
                trendingProducts.map(p => <ProductCard key={p._id} product={p} />)
              )}
            </div>
          </section>
        )}

        {/* General Featured Products Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Featured Products</h2>
            <Link href="/products" className="text-sm font-semibold text-secondary hover:underline flex items-center gap-1">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productsLoading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)
            ) : (
              products.map(p => <ProductCard key={p._id} product={p} />)
            )}
          </div>
        </section>

        {/* Recently Viewed Slider */}
        {isAuthenticated && recentProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Recently Viewed</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {recentProducts.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
