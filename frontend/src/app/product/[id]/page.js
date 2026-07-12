'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useToast } from '@/components/ToastProvider';
import { Star, ShoppingCart, Heart, Zap, Sparkles, Award, Minus, Plus, Trash2, CheckCircle2, X as XIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getOptimizedImageUrl } from '@/utils/image';
import {
  useGetProductByIdQuery,
  useUpdateCartMutation,
  useGetFrequentlyBoughtQuery,
  useGetSimilarProductsQuery,
  useGetProductsQuery,
  useTrackProductViewMutation,
  useGetProductReviewsQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useGetCartQuery,
} from '@/store/api';

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const { isAuthenticated } = useSelector(state => state.auth);
  const { showToast } = useToast();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Block/unblock scroll when fullscreen gallery is open
  useEffect(() => {
    if (isGalleryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isGalleryOpen]);

  // Keyboard navigation for gallery modal
  useEffect(() => {
    if (!isGalleryOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsGalleryOpen(false);
      } else if (e.key === 'ArrowLeft') {
        const len = product?.images?.length || 0;
        if (len > 1) setGalleryIndex((prev) => (prev - 1 + len) % len);
      } else if (e.key === 'ArrowRight') {
        const len = product?.images?.length || 0;
        if (len > 1) setGalleryIndex((prev) => (prev + 1) % len);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, product]);

  const handlePrevGalleryImage = (e) => {
    e.stopPropagation();
    const len = product?.images?.length || 0;
    if (len > 1) {
      setGalleryIndex((prev) => (prev - 1 + len) % len);
    }
  };

  const handleNextGalleryImage = (e) => {
    e.stopPropagation();
    const len = product?.images?.length || 0;
    if (len > 1) {
      setGalleryIndex((prev) => (prev + 1) % len);
    }
  };

  // Reset active image index when product changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [productId]);

  // API Queries
  const { data: productRes, isLoading } = useGetProductByIdQuery(productId);
  const { data: cartRes } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: boughtTogetherRes } = useGetFrequentlyBoughtQuery(productId);
  const { data: similarRes } = useGetSimilarProductsQuery(productId);
  const { data: allProductsRes } = useGetProductsQuery({ status: 'approved', limit: 12 });
  const { data: reviewsRes } = useGetProductReviewsQuery(productId);

  const [updateCart, { isLoading: cartUpdating }] = useUpdateCartMutation();
  const [trackView] = useTrackProductViewMutation();

  const product = productRes?.data?.product;
  const reviews = reviewsRes?.data?.reviews || [];
  const frequentlyBought = boughtTogetherRes?.data?.products || [];
  const similarProducts = similarRes?.data?.products || [];
  const allProducts = allProductsRes?.data?.products || [];
  const fallbackRelated = allProducts.filter(p => p._id !== productId);
  const finalSimilarProducts = similarProducts.length > 0 ? similarProducts : fallbackRelated.slice(0, 6);

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
      showToast(`Added ${product.title} to cart successfully!`, 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to add item.', 'error');
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const buyNowItem = {
      product,
      quantity: 1,
      variantSku: selectedVariant ? selectedVariant.sku : null,
    };

    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    router.push('/checkout?source=buy_now');
  };

  const { data: wishlistRes } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();
  const isInWishlist = wishlistRes?.data?.wishlist?.some(p => p._id === productId);

  const cartItems = cartRes?.data?.cart || [];
  const cartItem = cartItems.find(item => {
    const id = item.product?._id || item.product;
    const isSameProduct = id === productId;
    const isSameVariant = selectedVariant ? item.variantSku === selectedVariant.sku : !item.variantSku;
    return isSameProduct && isSameVariant;
  });
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleUpdateQuantity = async (newQty) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      await updateCart({
        productId: product._id,
        variantSku: selectedVariant ? selectedVariant.sku : undefined,
        action: 'update',
        quantity: newQty,
      }).unwrap();
    } catch (err) {
      console.error('Failed to update cart quantity:', err);
    }
  };

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
        {/* Product Core Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-8 lg:p-10 rounded-3xl shadow-sm">
          {/* Left: Product Images */}
          <div className="space-y-4">
            <div 
              onClick={() => {
                setGalleryIndex(activeImageIndex);
                setIsGalleryOpen(true);
              }}
              className="aspect-square bg-slate-50 dark:bg-slate-955 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center relative cursor-zoom-in group"
            >
              <img
                src={getOptimizedImageUrl(product.images?.[activeImageIndex] || product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600', 800)}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-355 ease-out group-hover:scale-102"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleWishlist();
                }}
                className={`absolute top-4 right-4 z-10 p-3 rounded-full border shadow-md transition-all duration-200 hover:scale-110 active:scale-90 flex items-center justify-center ${
                  isInWishlist
                    ? 'bg-white/90 border-red-200 text-red-500'
                    : 'bg-white/90 border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
                title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-red-500' : ''}`} />
              </button>

              {product.images?.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const len = product.images.length;
                      setActiveImageIndex((prev) => (prev - 1 + len) % len);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition shadow-sm opacity-0 group-hover:opacity-100 active:scale-90 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const len = product.images.length;
                      setActiveImageIndex((prev) => (prev + 1) % len);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition shadow-sm opacity-0 group-hover:opacity-100 active:scale-90 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 border transition-all duration-200 ${
                      activeImageIndex === idx
                        ? 'border-secondary ring-2 ring-secondary/20 shadow-md scale-102 opacity-100'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={getOptimizedImageUrl(img, 150)} alt="Preview" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Spec description & variant modifiers */}
          <div className="flex flex-col justify-start space-y-4">
            <div className="space-y-3.5">
              {/* Brand info */}
              {product.brand?.name && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/20 dark:border-slate-700/25">
                    {product.brand.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-black dark:text-black tracking-tight leading-tight capitalize">
                {product.title}
              </h1>

              {/* Glassmorphic Rating Badge */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25 dark:border-amber-500/15 px-3 py-1 rounded-full text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.ratings?.count > 0 ? Number(product.ratings.average).toFixed(1) : '0.0'}</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-550">
                  {product.ratings?.count || 0} Customer Reviews
                </span>
              </div>

              {/* Dynamic Price & Discount display */}
              {(() => {
                const price = selectedVariant ? selectedVariant.price : product.price;
                const compareAtPrice = product.compareAtPrice;
                const discount = compareAtPrice && compareAtPrice > price
                  ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
                  : null;
                return (
                  <div className="flex items-center gap-2 pt-1 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap sm:flex-nowrap">
                    <span className="text-2xl sm:text-3xl font-black text-black dark:text-black tracking-tight">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    {compareAtPrice && compareAtPrice > price && (
                      <span className="text-xs sm:text-sm line-through text-slate-400 font-semibold">
                        ₹{compareAtPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    {discount && (
                      <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xxs font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl border border-emerald-500/20 tracking-wider">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Description */}
              <div className="space-y-0.5">
                <h3 className="font-bold text-[10px] text-black dark:text-black uppercase tracking-wider">Product Description</h3>
                <p className="text-base text-black dark:text-black leading-relaxed font-semibold">{product.description}</p>
              </div>

              {/* Attributes & Variants selections */}
              {Object.keys(attributesMap).length > 0 && (
                <div className="pt-5 space-y-4 border-t border-slate-100 dark:border-slate-800">
                  {Object.keys(attributesMap).map(attrName => (
                    <div key={attrName} className="space-y-2">
                      <h4 className="text-xxs font-bold text-black dark:text-black uppercase tracking-wider">{attrName}</h4>
                      <div className="flex flex-wrap gap-2">
                        {[...attributesMap[attrName]].map(val => (
                          <button
                            key={val}
                            onClick={() => handleAttributeChange(attrName, val)}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
                              selectedAttributes[attrName] === val
                                ? 'bg-secondary text-white border-secondary shadow-md scale-102'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:border-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800'
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
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-4">
              {/* Low stock alert */}
              {((selectedVariant ? selectedVariant.inventory : product.inventory?.quantity || 0) <= 5) && (
                <p className="text-xs font-bold text-orange-500 flex items-center gap-1.5 animate-pulse bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/20 px-3.5 py-2 rounded-xl w-fit">
                  <Sparkles className="w-4 h-4 fill-orange-500 text-orange-500" /> Only {selectedVariant ? selectedVariant.inventory : product.inventory?.quantity || 0} items left in stock!
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {quantityInCart > 0 ? (
                  <div className="flex-grow flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 h-[52px]">
                    <button
                      onClick={() => handleUpdateQuantity(quantityInCart - 1)}
                      disabled={cartUpdating}
                      className="p-3 text-slate-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition active:scale-90 disabled:opacity-50 flex items-center justify-center"
                      title="Decrease quantity"
                    >
                      {quantityInCart === 1 ? (
                        <Trash2 className="w-5 h-5" />
                      ) : (
                        <Minus className="w-5 h-5" />
                      )}
                    </button>
                    <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-200 select-none">
                      {quantityInCart} in Cart
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(quantityInCart + 1)}
                      disabled={cartUpdating || quantityInCart >= (selectedVariant ? selectedVariant.inventory : product.inventory?.quantity || 100)}
                      className="p-3 text-slate-500 hover:text-secondary hover:bg-white dark:hover:bg-slate-700 rounded-xl transition active:scale-90 disabled:opacity-50 flex items-center justify-center"
                      title="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={cartUpdating || (selectedVariant ? selectedVariant.inventory === 0 : product.inventory?.quantity === 0)}
                    className="flex-grow inline-flex items-center justify-center gap-2 bg-secondary hover:bg-cyan-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl active:scale-98 disabled:opacity-50 disabled:bg-slate-250 dark:disabled:bg-slate-800 disabled:text-slate-400 transition duration-200 text-xs sm:text-sm h-[52px]"
                  >
                    <ShoppingCart className="w-4.5 h-4.5" /> 
                    {(selectedVariant ? selectedVariant.inventory === 0 : product.inventory?.quantity === 0) ? 'Out of Stock' : 'Add to Shopping Bag'}
                  </button>
                )}

                {(selectedVariant ? selectedVariant.inventory > 0 : product.inventory?.quantity > 0) && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="flex-grow inline-flex items-center justify-center bg-accent hover:bg-rose-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl active:scale-98 transition duration-200 text-xs sm:text-sm h-[52px]"
                  >
                    Buy Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Apriori Recommendations (Frequently Bought Together) */}
        {frequentlyBought.length > 0 && (
          <section className="mt-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-extrabold text-black dark:text-black">Frequently Bought Together</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {frequentlyBought.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* Similar / Related Products */}
        {finalSimilarProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-extrabold text-black dark:text-black mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {finalSimilarProducts.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="mt-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl">
          <h2 className="text-xl font-extrabold text-black dark:text-black mb-6">Customer Reviews</h2>
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
                        <h4 className="font-bold text-sm text-black dark:text-black">{review.customer?.name}</h4>
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

      {/* Fullscreen Image Gallery Modal (Flipkart-style) */}
      {isGalleryOpen && product && (
        <div 
          onClick={() => setIsGalleryOpen(false)}
          className="fixed inset-0 bg-black/95 z-[9999] flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between w-full text-white">
            <div className="text-xs sm:text-sm font-bold tracking-tight">
              {product.title} <span className="text-slate-400 font-normal ml-2">({galleryIndex + 1} of {product.images?.length || 1})</span>
            </div>
            <button 
              onClick={() => setIsGalleryOpen(false)}
              className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full transition active:scale-90"
              title="Close Fullscreen"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Main Stage */}
          <div className="flex-1 flex items-center justify-between max-w-7xl mx-auto w-full relative">
            {/* Left Control */}
            {product.images?.length > 1 && (
              <button
                onClick={handlePrevGalleryImage}
                className="p-3 sm:p-4 bg-slate-900/60 hover:bg-slate-800/80 text-white rounded-full transition border border-slate-800/50 hover:border-slate-700/85 active:scale-90 flex items-center justify-center cursor-pointer shadow-md select-none mr-2 sm:mr-4"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Image display */}
            <div className="flex-1 flex items-center justify-center p-2 relative h-full">
              <img
                src={getOptimizedImageUrl(product.images?.[galleryIndex] || product.images?.[0], 1200)}
                alt={product.title}
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-[60vh] sm:max-h-[75vh] object-contain rounded-xl shadow-2xl transition-all duration-300 transform scale-100"
              />
            </div>

            {/* Right Control */}
            {product.images?.length > 1 && (
              <button
                onClick={handleNextGalleryImage}
                className="p-3 sm:p-4 bg-slate-900/60 hover:bg-slate-800/80 text-white rounded-full transition border border-slate-800/50 hover:border-slate-700/85 active:scale-90 flex items-center justify-center cursor-pointer shadow-md select-none ml-2 sm:ml-4"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Thumbnails Carousel */}
          {product.images?.length > 1 && (
            <div className="w-full flex justify-center py-4 bg-black/40 backdrop-blur-md border-t border-slate-900/50">
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 overflow-x-auto max-w-full px-4 scrollbar-thin py-1"
              >
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setGalleryIndex(idx)}
                    className={`relative w-14 h-14 sm:w-18 sm:h-18 rounded-lg overflow-hidden border transition-all duration-200 flex-shrink-0 ${
                      galleryIndex === idx
                        ? 'border-secondary ring-2 ring-secondary/45 scale-105 opacity-100'
                        : 'border-slate-850 hover:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={getOptimizedImageUrl(img, 150)} alt="Preview thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
