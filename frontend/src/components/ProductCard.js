'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useUpdateCartMutation, useGetWishlistQuery, useToggleWishlistMutation } from '@/store/api';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { isAuthenticated } = useSelector(state => state.auth);
  const [updateCart, { isLoading }] = useUpdateCartMutation();

  const { data: wishlistRes } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();
  const isInWishlist = wishlistRes?.data?.wishlist?.some(p => p._id === product._id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

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

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      await toggleWishlist(product._id).unwrap();
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    }
  };

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Product Image */}
      <div className="block relative aspect-square overflow-hidden bg-slate-100">
        <Link href={`/product/${product._id}`} className="block w-full h-full">
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
        {discountPercent > 0 && (
          <span className="absolute top-3 left-3 bg-accent text-white font-bold text-xxs px-2.5 py-1 rounded-full shadow-md">
            -{discountPercent}% OFF
          </span>
        )}

        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md backdrop-blur-md transition-all active:scale-90 z-10 ${
            isInWishlist
              ? 'bg-red-50 text-red-500 border border-red-100'
              : 'bg-white/80 text-slate-400 hover:text-slate-600 border border-transparent'
          }`}
          title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart className={`w-3.5 h-3.5 ${isInWishlist ? 'fill-red-500' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
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
        <h3 className="text-sm font-semibold text-slate-800 mt-1.5 line-clamp-2 h-10 group-hover:text-secondary transition-colors">
          <Link href={`/product/${product._id}`}>
            {product.title}
          </Link>
        </h3>

        {/* Price & Cart Actions */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col gap-2.5">
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
            onClick={handleAddToCart}
            disabled={isLoading}
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
}
