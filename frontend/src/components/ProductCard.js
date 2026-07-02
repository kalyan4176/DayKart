'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useToast } from '@/components/ToastProvider';
import { Star, ShoppingCart, Heart, Minus, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useUpdateCartMutation, useGetWishlistQuery, useToggleWishlistMutation, useGetCartQuery } from '@/store/api';
import { getOptimizedImageUrl } from '@/utils/image';

export default function ProductCard({ product, wishlistMode = false }) {
  const router = useRouter();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { showToast } = useToast();
  const [updateCart, { isLoading }] = useUpdateCartMutation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: wishlistRes } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();
  const isInWishlist = wishlistRes?.data?.wishlist?.some(p => p._id === product._id);

  const { data: cartRes } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const cartItems = cartRes?.data?.cart || [];
  const cartItem = cartItems.find(item => {
    const id = item.product?._id || item.product;
    return id === product._id;
  });
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleUpdateQuantity = async (e, newQty) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      await updateCart({
        productId: product._id,
        action: 'update',
        quantity: newQty,
      }).unwrap();
    } catch (err) {
      console.error('Failed to update cart quantity:', err);
    }
  };

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
      showToast(`Added ${product.title} to cart successfully!`, 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to add item to cart.', 'error');
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

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const buyNowItem = {
      product,
      quantity: 1,
      variantSku: null,
    };

    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    router.push('/checkout');
  };

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
      {/* Product Image */}
      <div className="block relative aspect-square overflow-hidden bg-slate-100 flex-shrink-0">
        <Link href={`/product/${product._id}`} className="block w-full h-full">
          <img
            src={getOptimizedImageUrl(product.images[0], 400)}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
        {discountPercent > 0 && (
          <span className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 bg-accent text-white font-extrabold text-[10px] sm:text-xxs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md">
            -{discountPercent}% OFF
          </span>
        )}

        {wishlistMode ? (
          <button
            onClick={handleToggleWishlist}
            className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full shadow-md bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 backdrop-blur-md transition-all active:scale-90 z-10 border border-transparent flex items-center justify-center"
            title="Remove from Wishlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-1.5 right-1.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full shadow-md backdrop-blur-md transition-all active:scale-90 z-10 ${
              isInWishlist
                ? 'bg-red-50 text-red-500 border border-red-100'
                : 'bg-white/80 text-slate-400 hover:text-slate-600 border border-transparent'
            }`}
            title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${isInWishlist ? 'fill-red-500' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-xxs font-bold text-secondary tracking-wider lg:tracking-widest uppercase whitespace-nowrap truncate min-w-0">
            {product.category?.name || 'Catalog'}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xxs sm:text-xs font-semibold text-slate-500">
              {product.ratings?.average || '4.5'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mt-1 sm:mt-1.5 line-clamp-2 group-hover:text-secondary transition-colors">
          <Link href={`/product/${product._id}`}>
            {product.title}
          </Link>
        </h3>

        {/* Price & Cart Actions */}
        <div className="mt-auto pt-2 sm:pt-3.5 border-t border-slate-100 flex flex-col gap-2 sm:gap-2.5">
          <div className="flex items-baseline flex-wrap gap-1 sm:gap-1.5">
            <span className="font-extrabold text-xs sm:text-base text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice && (
              <span className="text-[10px] sm:text-xs line-through text-slate-400">
                ₹{product.compareAtPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {quantityInCart > 0 ? (
            <div className="flex flex-col gap-1.5">
              <div className="w-full flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-lg sm:rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={(e) => handleUpdateQuantity(e, quantityInCart - 1)}
                  disabled={isLoading}
                  className="p-1 sm:p-1.5 text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-md sm:rounded-lg transition active:scale-90 disabled:opacity-50 flex items-center justify-center"
                  title="Decrease quantity"
                >
                  {quantityInCart === 1 ? (
                    <Trash2 className="w-3.5 h-3.5" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 select-none px-2">
                  {quantityInCart}
                </span>
                <button
                  onClick={(e) => handleUpdateQuantity(e, quantityInCart + 1)}
                  disabled={isLoading || quantityInCart >= (product.inventory?.quantity || 100)}
                  className="p-1 sm:p-1.5 text-slate-500 hover:text-secondary hover:bg-white dark:hover:bg-slate-700 rounded-md sm:rounded-lg transition active:scale-90 disabled:opacity-50 flex items-center justify-center"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full bg-accent hover:bg-rose-600 text-white font-extrabold py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition shadow-xs active:scale-98 text-[10px] sm:text-xs flex items-center justify-center"
              >
                Buy Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="bg-secondary hover:bg-cyan-600 text-white font-bold py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs"
                title="Add to Cart"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="bg-accent hover:bg-rose-600 text-white font-extrabold py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition shadow-xs active:scale-98 flex items-center justify-center text-[10px] sm:text-xs"
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
