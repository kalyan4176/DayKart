'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Star, ShoppingCart, Trash2, Heart, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useGetWishlistQuery, useToggleWishlistMutation, useUpdateCartMutation } from '@/store/api';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Fetch wishlist
  const { data: wishlistRes, isLoading, refetch } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [toggleWishlist] = useToggleWishlistMutation();
  const [updateCart, { isLoading: isCartLoading }] = useUpdateCartMutation();

  const wishlistItems = wishlistRes?.data?.wishlist || [];

  const handleRemove = async (productId) => {
    try {
      await toggleWishlist(productId).unwrap();
    } catch (err) {
      console.error('Failed to remove item from wishlist:', err);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await updateCart({
        productId: product._id,
        action: 'add',
        quantity: 1,
      }).unwrap();
    } catch (err) {
      console.error('Failed to add item to cart:', err);
    }
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
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
            {wishlistItems.map((product) => {
              const discountPercent = product.compareAtPrice
                ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                : 0;

              return (
                <div
                  key={product._id}
                  className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Product Image */}
                  <Link href={`/product/${product._id}`} className="block relative aspect-square overflow-hidden bg-slate-100">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {discountPercent > 0 && (
                      <span className="absolute top-3.5 left-3.5 bg-accent text-white font-bold text-xxs px-2.5 py-1 rounded-full shadow-md">
                        -{discountPercent}% OFF
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(product._id);
                      }}
                      className="absolute top-3.5 right-3.5 p-2 bg-white/80 hover:bg-red-50 text-slate-500 hover:text-red-500 backdrop-blur-md rounded-full shadow-md transition-all active:scale-90"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Link>

                  {/* Content */}
                  <div className="p-5">
                    {/* Category & Rating */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xxs font-bold text-secondary tracking-widest uppercase">
                        {product.category?.name || 'Catalog'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-500">
                          {product.ratings?.average || '4.5'}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-slate-800 mt-2 line-clamp-2 h-10 group-hover:text-secondary transition-colors">
                      <Link href={`/product/${product._id}`}>{product.title}</Link>
                    </h3>

                    {/* Price & Actions */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                      <div className="flex items-baseline flex-wrap gap-1.5">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-xxs sm:text-xs line-through text-slate-400">
                            ₹{product.compareAtPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-secondary hover:bg-cyan-600 text-white font-bold py-2 rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
