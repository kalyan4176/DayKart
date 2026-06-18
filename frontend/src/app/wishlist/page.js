'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Star, ShoppingCart, Trash2, Heart, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useGetWishlistQuery } from '@/store/api';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch wishlist
  const { data: wishlistRes, isLoading, refetch } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated || !mounted,
  });
  const wishlistItems = wishlistRes?.data?.wishlist || [];

  // Redirect if not authenticated
  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3.5 mb-8">
          <div className="p-3 bg-cyan-50 text-secondary rounded-2xl border border-cyan-100 shadow-sm">
            <Heart className="w-6 h-6 fill-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Wishlist</h1>
            <p className="text-xs text-slate-500 mt-1">Products you've saved to buy later.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-80 bg-white border border-slate-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-md mx-auto mt-8">
            <div className="inline-flex items-center justify-center p-5 bg-orange-50 text-accent rounded-full mb-6">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Your wishlist is empty</h2>
            <p className="text-sm text-slate-500 mt-2.5 max-w-xs mx-auto leading-relaxed">
              Explore our products catalog and save your favorite items here.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 mt-8 bg-secondary hover:bg-cyan-600 text-white font-bold px-6 py-3 rounded-full transition-all shadow-md active:scale-98 text-sm"
            >
              Discover Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((product) => (
              <ProductCard key={product._id} product={product} wishlistMode={true} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
