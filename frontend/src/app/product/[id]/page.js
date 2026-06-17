'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Star, ShoppingCart, Heart, Zap, Sparkles, Award } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import {
  useGetProductByIdQuery,
  useUpdateCartMutation,
  useGetFrequentlyBoughtQuery,
  useGetSimilarProductsQuery,
  useTrackProductViewMutation,
  useGetProductReviewsQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from '@/store/api';

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const { isAuthenticated } = useSelector(state => state.auth);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // API Queries
  const { data: productRes, isLoading } = useGetProductByIdQuery(productId);
  const { data: boughtTogetherRes } = useGetFrequentlyBoughtQuery(productId);
  const { data: similarRes } = useGetSimilarProductsQuery(productId);
  const { data: reviewsRes } = useGetProductReviewsQuery(productId);

  const [updateCart, { isLoading: cartUpdating }] = useUpdateCartMutation();
  const [trackView] = useTrackProductViewMutation();

  const product = productRes?.data?.product;
  const reviews = reviewsRes?.data?.reviews || [];
  const frequentlyBought = boughtTogetherRes?.data?.products || [];
  const similarProducts = similarRes?.data?.products || [];

  // Track product view on load
  useEffect(() => {
    if (productId && isAuthenticated) {
      trackView(productId);
    }
  }, [productId, isAuthenticated]);

  // Set default selected variant once product is loaded
  useEffect(() => {
    if (product?.variants?.length > 0) {
      setSelectedVariant(product.variants[0]);
      // Extract default attributes map
      const attrs = {};
      Object.entries(product.variants[0].attributes || {}).forEach(([key, val]) => {
        attrs[key] = val;
      });
      setSelectedAttributes(attrs);
    }
  }, [product]);

  const handleAttributeChange = (attributeName, value) => {
    const updatedAttrs = { ...selectedAttributes, [attributeName]: value };
    setSelectedAttributes(updatedAttrs);

    // Find matching variant
    const match = product.variants.find(v => {
      let isMatch = true;
      Object.entries(v.attributes || {}).forEach(([key, val]) => {
        if (updatedAttrs[key] !== val) isMatch = false;
      });
      return isMatch;
    });

    if (match) setSelectedVariant(match);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      await updateCart({
        productId: product._id,
        variantSku: selectedVariant ? selectedVariant.sku : undefined,
        action: 'add',
        quantity: 1,
      }).unwrap();
      alert('Product added to your cart successfully!');
    } catch (err) {
      alert(err.data?.message || 'Failed to add item.');
    }
  };

  const { data: wishlistRes } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();
  const isInWishlist = wishlistRes?.data?.wishlist?.some(p => p._id === productId);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      await toggleWishlist(productId).unwrap();
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    }
  };

  if (isLoading || !product) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-sm font-semibold text-slate-500 animate-pulse">Loading Product Details...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get unique attributes list across all variants
  const attributesMap = {};
  product.variants?.forEach(v => {
    Object.entries(v.attributes || {}).forEach(([key, val]) => {
      if (!attributesMap[key]) attributesMap[key] = new Set();
      attributesMap[key].add(val);
    });
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Product Core Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
          {/* Left: Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Spec description & variant modifiers */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Category, Brand */}
              <div className="flex items-center gap-2">
                <span className="text-xxs font-extrabold text-secondary tracking-widest uppercase bg-cyan-50 dark:bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
                  {product.category?.name}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs font-bold text-slate-500">{product.brand?.name}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-4 leading-tight">
                {product.title}
              </h1>

              {/* Star rating summary */}
              <div className="flex items-center gap-2 mt-3.5">
                <div className="flex items-center gap-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{product.ratings?.average || '4.5'}</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-xs font-semibold text-slate-500">{product.ratings?.count || 12} Verified Purchases</span>
              </div>

              {/* Price display */}
              <div className="flex items-center gap-3 mt-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  ₹{(selectedVariant ? selectedVariant.price : product.price).toLocaleString('en-IN')}
                </span>
                {product.compareAtPrice && (
                  <span className="text-base line-through text-slate-400">
                    ₹{product.compareAtPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">Product Description</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{product.description}</p>
              </div>

              {/* Attributes & Variants selections */}
              {Object.keys(attributesMap).length > 0 && (
                <div className="mt-8 space-y-4">
                  {Object.keys(attributesMap).map(attrName => (
                    <div key={attrName}>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{attrName}</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {[...attributesMap[attrName]].map(val => (
                          <button
                            key={val}
                            onClick={() => handleAttributeChange(attrName, val)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                              selectedAttributes[attrName] === val
                                ? 'bg-secondary text-white border-secondary shadow-md'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-secondary'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory warnings & Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              {/* Low stock alert */}
              {((selectedVariant ? selectedVariant.inventory : product.inventory.quantity) <= 5) && (
                <p className="text-xs font-bold text-orange-500 flex items-center gap-1.5 mb-4 animate-pulse">
                  <Sparkles className="w-4 h-4 fill-orange-500 text-orange-500" /> Only {selectedVariant ? selectedVariant.inventory : product.inventory.quantity} items left in stock!
                </p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={cartUpdating || (selectedVariant ? selectedVariant.inventory === 0 : product.inventory.quantity === 0)}
                  className="flex-grow inline-flex items-center justify-center gap-2 bg-secondary hover:bg-cyan-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg active:scale-98 disabled:opacity-50 transition"
                >
                  <ShoppingCart className="w-5 h-5" /> Add to Shopping Bag
                </button>
                <button
                  onClick={handleToggleWishlist}
                  className={`p-3.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${
                    isInWishlist
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                  }`}
                  title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-red-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Apriori Recommendations (Frequently Bought Together) */}
        {frequentlyBought.length > 0 && (
          <section className="mt-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Frequently Bought Together</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {frequentlyBought.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {similarProducts.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="mt-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No reviews have been written for this product yet.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review._id} className="pb-6 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm">
                        {review.customer?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{review.customer?.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex">
                            {Array(5).fill(0).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                          {review.isVerifiedPurchase && (
                            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-xxs px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xxs text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-3.5 leading-relaxed pl-11">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
