'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, CreditCard, ShieldCheck, ShoppingBag, PlusCircle, CheckCircle2, Ticket, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ToastProvider';
import { useGetCartQuery, useCheckoutMutation, useValidateCouponMutation, useAddAddressMutation, useGetShippingRulesQuery } from '@/store/api';
import { updateUser } from '@/store/authSlice';
import { getOptimizedImageUrl } from '@/utils/image';

const GATEWAYS = [
  { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Pay with cash upon package delivery.' },
  { id: 'stripe', name: 'Stripe Credit Card', desc: 'Secure card transaction processing.' },
  { id: 'razorpay', name: 'Razorpay UPI / Wallet', desc: 'Instant UPI, net banking, or wallet.' }
];

function CheckoutPageContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const initialCoupon = searchParams.get('coupon') || '';

  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // API Hooks
  const { data: cartRes, isLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated || !mounted });
  const [checkoutApi, { isLoading: orderPlacing }] = useCheckoutMutation();
  const [validateCoupon, { isLoading: couponValidating }] = useValidateCouponMutation();
  const [addAddressApi, { isLoading: addressAdding }] = useAddAddressMutation();
  const { data: shippingRulesRes } = useGetShippingRulesQuery(undefined, { skip: !isAuthenticated || !mounted });
  const shippingRules = shippingRulesRes?.data?.shippingRules || [];

  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.find(a => a.isDefault)?._id || user?.addresses?.[0]?._id || '');
  const [selectedGateway, setSelectedGateway] = useState('cod');
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const handleGetLocationAddress = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setFetchingLocation(true);
    showToast('Requesting location permission from browser...', 'info');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        showToast('Translating coordinates to street address...', 'info');
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          
          if (!response.ok) {
            throw new Error('Reverse geocoding failed');
          }

          const data = await response.json();
          const addr = data.address;

          if (!addr) {
            throw new Error('No address details returned');
          }

          const streetParts = [];
          if (addr.house_number) streetParts.push(addr.house_number);
          if (addr.road) streetParts.push(addr.road);
          if (addr.suburb || addr.neighbourhood) streetParts.push(addr.suburb || addr.neighbourhood);
          
          const street = streetParts.join(', ') || addr.amenity || data.name || 'Current Location';
          const city = addr.city || addr.town || addr.village || addr.city_district || 'Bangalore';
          const state = addr.state || 'Karnataka';
          const country = addr.country || 'India';
          const postalCode = addr.postcode || '560001';

          const res = await addAddressApi({
            street,
            city,
            state,
            country,
            postalCode,
            isDefault: true,
          }).unwrap();

          dispatch(updateUser({ addresses: res.data.addresses }));
          
          const newAddress = res.data.addresses?.find(addr => addr.isDefault) || res.data.addresses?.[res.data.addresses.length - 1];
          if (newAddress) {
            setSelectedAddress(newAddress._id);
          }
          
          showToast(`Address detected: ${street}, ${city}`, 'success');
        } catch (err) {
          console.error(err);
          showToast('Failed to retrieve address from map coordinate translation.', 'error');
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        setFetchingLocation(false);
        let errorMsg = 'Failed to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied by user.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location position unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out.';
        }
        showToast(errorMsg, 'error');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const [couponInput, setCouponInput] = useState(initialCoupon);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [animateDiscount, setAnimateDiscount] = useState(false);

  const cartItems = cartRes?.data?.cart || [];

  // Calculate Subtotal
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.variantSku 
      ? item.product?.variants.find(v => v.sku === item.variantSku)?.price || item.product?.price || 0
      : item.product?.price || 0;
    return acc + (price * item.quantity);
  }, 0);

  // Validate initial coupon on load if subtotal is available
  useEffect(() => {
    if (initialCoupon && subtotal > 0 && !discountInfo && !couponError) {
      const runInitialValidation = async () => {
        try {
          const res = await validateCoupon({ code: initialCoupon, cartValue: subtotal }).unwrap();
          const coupon = res.data.coupon;
          
          let discountAmount = 0;
          if (coupon.discountType === 'percentage') {
            discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
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
          setAnimateDiscount(true);
        } catch (err) {
          setCouponError(err.data?.message || 'Invalid coupon code.');
        }
      };
      runInitialValidation();
    }
  }, [initialCoupon, subtotal]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setDiscountInfo(null);
    setAnimateDiscount(false);

    if (!couponInput.trim()) return;

    try {
      const res = await validateCoupon({ code: couponInput, cartValue: subtotal }).unwrap();
      const coupon = res.data.coupon;
      
      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
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
      setAnimateDiscount(true);
      setTimeout(() => setAnimateDiscount(false), 1000);
    } catch (err) {
      setCouponError(err.data?.message || 'Invalid coupon code.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showToast('Please select a shipping address.', 'error');
      return;
    }

    try {
      const res = await checkoutApi({
        addressId: selectedAddress,
        couponCode: discountInfo ? discountInfo.code : undefined,
        gateway: selectedGateway,
      }).unwrap();

      setOrderSuccess(res.data);
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to place order.', 'error');
    }
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-sm font-semibold text-slate-500 animate-pulse">Loading Checkout Details...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center py-20 px-4">
          <div className="max-w-md w-full glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-xl">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-6">Order Placed Successfully!</h2>
            <p className="text-sm text-slate-500 mt-2">Thank you for shopping on Daykart. Your order tracking ID is:</p>
            
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl font-mono text-sm font-bold text-slate-800 dark:text-slate-100 mt-4 tracking-wider">
              {orderSuccess.orderId}
            </div>

            <p className="text-xs text-slate-400 mt-4">A confirmation email has been dispatched to your mailbox.</p>

            <button
              onClick={() => router.push('/')}
              className="mt-8 w-full bg-secondary hover:bg-cyan-600 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md transition"
            >
              Continue Shopping
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Dynamic Shipping Calculation
  let shippingCharges = 0;
  if (discountInfo && discountInfo.type === 'free_shipping') {
    shippingCharges = 0;
  } else if (shippingRules.length > 0) {
    const matchedRule = shippingRules.find(rule => {
      if (rule.maxCartValue === null || rule.maxCartValue === undefined) {
        return subtotal >= rule.minCartValue;
      }
      return subtotal >= rule.minCartValue && subtotal <= rule.maxCartValue;
    });
    shippingCharges = matchedRule ? matchedRule.charge : 0;
  } else {
    // Default fallback rules matching database seeds
    if (subtotal <= 150) shippingCharges = 50;
    else if (subtotal < 300) shippingCharges = 20;
    else shippingCharges = 0;
  }
  const calculatedTax = cartItems.reduce((acc, item) => {
    const price = item.variantSku 
      ? item.product?.variants.find(v => v.sku === item.variantSku)?.price || item.product?.price || 0
      : item.product?.price || 0;
    const gstRate = item.product?.gstRate !== undefined ? item.product.gstRate : 18;
    return acc + ((price * item.quantity * gstRate) / 100);
  }, 0);
  const tax = Math.round(calculatedTax);
  const discount = discountInfo?.discount || 0;
  const grandTotal = Math.max(0, Math.round(subtotal + shippingCharges + tax - discount));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Secure Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Shipping Address and Payment Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Selection */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary" /> 1. Shipping Address
                </h3>
                {user?.addresses?.length > 0 && (
                  <button
                    onClick={handleGetLocationAddress}
                    disabled={fetchingLocation || addressAdding}
                    className="inline-flex items-center gap-1 text-xxs font-bold text-secondary hover:underline disabled:opacity-50"
                  >
                    📍 {fetchingLocation ? 'Fetching...' : 'Get Address from Maps'}
                  </button>
                )}
              </div>

              {user?.addresses?.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 italic">No addresses saved. Please add one in profile settings.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button
                      onClick={handleGetLocationAddress}
                      disabled={fetchingLocation || addressAdding}
                      className="inline-flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                      📍 {fetchingLocation ? 'Fetching location...' : 'Get Address from Maps'}
                    </button>
                    <button
                      onClick={() => router.push('/profile')}
                      className="inline-flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                    >
                      Go to Profile Settings
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {user?.addresses?.map(addr => (
                    <label
                      key={addr._id}
                      className={`flex gap-3.5 p-4 border rounded-2xl cursor-pointer transition-all ${
                        selectedAddress === addr._id
                          ? 'border-secondary bg-cyan-50/25 dark:bg-cyan-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr._id}
                        checked={selectedAddress === addr._id}
                        onChange={() => setSelectedAddress(addr._id)}
                        className="mt-1 accent-secondary"
                      />
                      <div className="text-xs">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {addr.street}, {addr.city}
                        </span>
                        <p className="text-slate-500 mt-1">
                          {addr.state}, {addr.country} - {addr.postalCode}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-secondary" /> 2. Payment Gateway Options
              </h3>

              <div className="space-y-3">
                {GATEWAYS.map(gw => (
                  <label
                    key={gw.id}
                    className={`flex gap-3.5 p-4 border rounded-2xl cursor-pointer transition-all ${
                      selectedGateway === gw.id
                        ? 'border-secondary bg-cyan-50/25 dark:bg-cyan-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-secondary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gateway"
                      value={gw.id}
                      checked={selectedGateway === gw.id}
                      onChange={() => setSelectedGateway(gw.id)}
                      className="mt-1 accent-secondary"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{gw.name}</span>
                      <p className="text-slate-500 mt-1">{gw.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Place Order box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5">
            {/* Promo Coupon (Placed at the top of the sidebar/product items) */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3">
                <Ticket className="w-4.5 h-4.5 text-secondary" /> Apply Promo Coupon
              </h3>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="DAYKART10"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none uppercase dark:text-slate-200"
                />
                <button
                  type="submit"
                  disabled={couponValidating}
                  className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 flex-shrink-0"
                >
                  Apply
                </button>
              </form>

              {couponError && (
                <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {couponError}
                </p>
              )}

              {discountInfo && (
                <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1 animate-bounce">
                  <span>🎉 Coupon Applied! Saving ₹{discountInfo.discount.toLocaleString('en-IN')}</span>
                </p>
              )}
            </div>

            {/* Review Order Items */}
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4.5 h-4.5 text-secondary" /> Review Order Items
              </h3>

              <div className="max-h-48 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2.5 items-center">
                    <img src={getOptimizedImageUrl(item.product?.images[0], 100)} alt="" className="w-9 h-9 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.product?.title}</p>
                      <p className="text-slate-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Pricing Breakdown */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
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
                <div className={`flex justify-between text-emerald-500 font-bold ${animateDiscount ? 'animate-coupon-success' : ''}`}>
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-800 dark:text-slate-100 border-t border-slate-100 dark:border-slate-800 pt-3">
                <span>Grand Total</span>
                <span className={animateDiscount ? 'animate-coupon-success text-emerald-600' : ''}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={orderPlacing}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-orange-600 text-white font-extrabold py-4 rounded-2xl text-xs shadow-lg transition active:scale-98 disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5" /> {orderPlacing ? 'Processing Order...' : 'Place Secure Order'}
            </button>
            <p className="text-xxs text-center text-slate-400">Secure 256-bit SSL encrypted checkout platform.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary"></div>
      </div>
    }>
      <CheckoutPageContent />
    </React.Suspense>
  );
}
