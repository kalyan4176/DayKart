'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ShoppingBag, Trash2, ArrowRight, Ticket, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useGetCartQuery, useUpdateCartMutation, useValidateCouponMutation } from '@/store/api';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);
  
  // API hooks
  const { data: cartRes, isLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated || !mounted });
  const [updateCart] = useUpdateCartMutation();
  const [validateCoupon, { isLoading: couponValidating }] = useValidateCouponMutation();

  const [couponCode, setCouponCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);
  const [couponError, setCouponError] = useState('');

  const cartItems = cartRes?.data?.cart || [];

  // Calculation parameters
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.variantSku 
      ? item.product?.variants.find(v => v.sku === item.variantSku)?.price || item.product?.price || 0
      : item.product?.price || 0;
    return acc + (price * item.quantity);
  }, 0);

  const handleQtyChange = async (productId, variantSku, currentQty, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId, variantSku);
      return;
    }
    try {
      await updateCart({
        productId,
        variantSku,
        action: 'update',
        quantity: newQty
      }).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (productId, variantSku) => {
    try {
      await updateCart({
        productId,
        variantSku,
        action: 'remove'
      }).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setDiscountInfo(null);

    if (!couponCode.trim()) return;

    try {
      const res = await validateCoupon({ code: couponCode, cartValue: subtotal }).unwrap();
      const coupon = res.data.coupon;
      
      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'flat') {
        discountAmount = coupon.discountValue;
      }

      setDiscountInfo({
        code: coupon.code,
        discount: discountAmount,
        type: coupon.discountType
      });
    } catch (err) {
      setCouponError(err.data?.message || 'Invalid coupon code.');
    }
  };

  // Checkout totals
  const shippingCharges = subtotal > 1000 || (discountInfo && discountInfo.type === 'free_shipping') ? 0 : 99;
  const calculatedTax = cartItems.reduce((acc, item) => {
    const price = item.variantSku 
      ? item.product?.variants.find(v => v.sku === item.variantSku)?.price || item.product?.price || 0
      : item.product?.price || 0;
    const gstRate = item.product?.gstRate !== undefined ? item.product.gstRate : 18;
    return acc + ((price * item.quantity * gstRate) / 100);
  }, 0);
  const tax = Math.round(calculatedTax);
  const discount = discountInfo?.discount || 0;
  const grandTotal = Math.max(0, subtotal + shippingCharges + tax - discount);

  if (!mounted || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-sm font-semibold text-slate-500 animate-pulse">Loading Shopping Cart...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Shopping Bag</h1>

        {cartItems.length === 0 ? (
          /* Empty Bag State */
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <ShoppingBag className="w-14 h-14 text-slate-300 dark:text-slate-700 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4">Your Bag is Empty</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xs text-center">Looks like you haven't added anything to your cart yet.</p>
            <Link
              href="/products"
              className="mt-6 bg-secondary hover:bg-cyan-600 text-white font-bold px-8 py-3 rounded-full text-xs shadow-md transition"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          /* Cart items and checkout summary splits */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items list */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, idx) => {
                const product = item.product;
                const isVariant = !!item.variantSku;
                const variant = isVariant ? product?.variants?.find(v => v.sku === item.variantSku) : null;
                const price = isVariant ? variant?.price : product?.price;
                const productId = product?._id || item.product;

                return (
                  <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                    {/* Image */}
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={product?.images?.[0] || '/placeholder.png'} alt={product?.title || 'Product'} className="w-full h-full object-cover" />
                    </div>

                    {/* Title & variants descriptions */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {product ? (
                            <Link href={`/product/${productId}`}>{product.title}</Link>
                          ) : (
                            <span className="text-slate-400 italic">Deleted Product</span>
                          )}
                        </h3>
                        {isVariant && (
                          <p className="text-xxs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                            SKU: {item.variantSku}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4 mt-2">
                        {/* Qty pickers */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                          <button
                            onClick={() => handleQtyChange(productId, item.variantSku, item.quantity, item.quantity - 1)}
                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition"
                          >
                            -
                          </button>
                          <span className="px-3.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200">{item.quantity}</span>
                          <button
                            onClick={() => handleQtyChange(productId, item.variantSku, item.quantity, item.quantity + 1)}
                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          ₹{((price || 0) * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveItem(productId, item.variantSku)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg h-fit self-start transition-all"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Checkout Pricing box */}
            <div className="space-y-6">
              {/* Coupon section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                  <Ticket className="w-4.5 h-4.5 text-secondary" /> Apply Promo Coupon
                </h3>

                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="DAYKART10"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none uppercase dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={couponValidating}
                    className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    Apply
                  </button>
                </form>

                {couponError && (
                  <p className="text-xxs text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}

                {discountInfo && (
                  <p className="text-xxs text-emerald-500 font-bold mt-2">
                    Coupon '{discountInfo.code}' Applied! Saving ₹{discountInfo.discount.toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              {/* Price Calculations */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                  Order Summary
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Bag Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST</span>
                    <span>₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Charges</span>
                    <span>{shippingCharges === 0 ? 'FREE' : `₹${shippingCharges}`}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-500 font-semibold">
                      <span>Discount</span>
                      <span>-₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm text-slate-800 dark:text-slate-100 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <Link
                  href={{
                    pathname: '/checkout',
                    query: discountInfo ? { coupon: discountInfo.code } : undefined
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-secondary hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl text-xs shadow-md mt-2 transition"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
