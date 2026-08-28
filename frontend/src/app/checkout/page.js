'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { MapPin, CreditCard, ShieldCheck, ShoppingBag, PlusCircle, CheckCircle2, Ticket, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';
import { useToast } from '@/components/ToastProvider';
import { useGetCartQuery, useCheckoutMutation, useValidateCouponMutation, useAddAddressMutation, useGetShippingRulesQuery, useGetCodChargeQuery, useGetCartLimitsQuery, useVerifyRazorpayPaymentMutation, useCancelOrderMutation } from '@/store/api';
import { updateUser } from '@/store/authSlice';
import { getOptimizedImageUrl } from '@/utils/image';

const GATEWAYS = [
  { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Pay with cash upon package delivery.' },
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

  useEffect(() => {
    if (mounted) {
      const status = searchParams.get('status');
      const orderId = searchParams.get('orderId');
      const error = searchParams.get('error');

      if (status === 'success' && orderId) {
        setOrderSuccess({ orderId });
        showToast('Payment verified and order placed successfully!', 'success');
        router.replace('/checkout');
      } else if (status === 'failed') {
        showToast(error === 'payment_failed' ? 'Payment failed. Please try again.' : 'Order verification failed.', 'error');
        router.replace('/checkout');
      }
    }
  }, [mounted, searchParams, router]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // API Hooks
  const { data: cartRes, isLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated || !mounted });
  const [checkoutApi, { isLoading: orderPlacing }] = useCheckoutMutation();
  const [verifyRazorpayPayment, { isLoading: verifyingPayment }] = useVerifyRazorpayPaymentMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [validateCoupon, { isLoading: couponValidating }] = useValidateCouponMutation();
  const [addAddressApi, { isLoading: addressAdding }] = useAddAddressMutation();
  const { data: shippingRulesRes } = useGetShippingRulesQuery(undefined, { skip: !isAuthenticated || !mounted });
  const shippingRules = shippingRulesRes?.data?.shippingRules || [];
  const { data: codChargeRes } = useGetCodChargeQuery(undefined, { skip: !isAuthenticated || !mounted });
  const codCharge = codChargeRes?.data?.charge || 0;
  const { data: cartLimitsRes } = useGetCartLimitsQuery(undefined, { skip: !isAuthenticated || !mounted });
  const minCheckoutValue = cartLimitsRes?.data?.minCheckoutValue || 0;
  const minCodValue = cartLimitsRes?.data?.minCodValue || 0;

  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.find(a => a.isDefault)?._id || user?.addresses?.[0]?._id || '');
  const [selectedGateway, setSelectedGateway] = useState('cod');
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDeliveryDateString = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 10);
    return maxDate.toISOString().split('T')[0];
  };

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

  const [buyNowItem, setBuyNowItem] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const source = searchParams.get('source');
      if (source === 'buy_now') {
        const stored = sessionStorage.getItem('buyNowItem');
        if (stored) {
          setBuyNowItem(JSON.parse(stored));
        }
      } else {
        sessionStorage.removeItem('buyNowItem');
        setBuyNowItem(null);
      }
    }
  }, [searchParams]);

  const dbCartItems = cartRes?.data?.cart || [];
  const cartItems = buyNowItem ? [buyNowItem] : dbCartItems;

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

    if (subtotal < minCheckoutValue) {
      showToast(`Minimum order value of ₹${minCheckoutValue} is required to place an order.`, 'error');
      return;
    }

    if (selectedGateway === 'cod' && subtotal < minCodValue) {
      showToast(`Minimum order value of ₹${minCodValue} is required for Cash on Delivery.`, 'error');
      return;
    }

    if (!preferredDeliveryDate) {
      showToast('Please select a preferred delivery date before placing your order.', 'error');
      return;
    }

    try {
      const payload = {
        addressId: selectedAddress,
        couponCode: discountInfo ? discountInfo.code : undefined,
        gateway: selectedGateway,
        preferredDeliveryDate,
      };

      if (buyNowItem) {
        payload.items = [{
          product: buyNowItem.product._id,
          quantity: buyNowItem.quantity,
          variantSku: buyNowItem.variantSku || undefined,
        }];
      }

      const res = await checkoutApi(payload).unwrap();

      if (buyNowItem) {
        sessionStorage.removeItem('buyNowItem');
      }

      if (res.data?.gateway === 'razorpay') {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          showToast('Failed to load Razorpay SDK. Please check your internet connection.', 'error');
          return;
        }

        const options = {
          key: res.data.razorpayKeyId,
          amount: Math.round(res.data.total * 100),
          currency: 'INR',
          name: 'Daykart',
          description: 'Payment for Order #' + res.data.orderId,
          order_id: res.data.razorpayOrderId,
          retry: {
            enabled: false
          },
          handler: async function (response) {
            try {
              showToast('Verifying payment signature...', 'info');
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: res.data.orderId
              }).unwrap();

              if (verifyRes.status === 'success') {
                showToast('Payment successful and verified!', 'success');
                setOrderSuccess({ orderId: res.data.orderId });
              } else {
                showToast('Payment verification failed.', 'error');
                setOrderError({ orderId: res.data.orderId, message: 'Payment verification failed.' });
              }
            } catch (verifyErr) {
              showToast(verifyErr.data?.message || 'Payment signature verification failed.', 'error');
              setOrderError({ orderId: res.data.orderId, message: verifyErr.data?.message || 'Payment signature verification failed.' });
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phoneNumber || '',
          },
          theme: {
            color: '#06b6d4'
          },
          modal: {
            ondismiss: async function() {
              try {
                showToast('Payment window closed. Cancelling order...', 'warning');
                await cancelOrder({
                  id: res.data.orderId,
                  reason: 'Customer closed the payment window during checkout.'
                }).unwrap();
                setOrderError({ orderId: res.data.orderId, message: 'The payment session lapsed or was cancelled.' });
              } catch (err) {
                console.error('Failed to cancel order on modal close:', err);
                setOrderError({ orderId: res.data.orderId, message: 'The payment window was closed before completion.' });
              }
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

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
          <Loader message="Loading Checkout Details..." />
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
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-6 font-sans">Order Placed Successfully!</h2>
            <p className="text-sm text-slate-500 mt-2 font-sans">Thank you for shopping on Daykart. Your order tracking ID is:</p>
            
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl font-mono text-sm font-bold text-slate-800 dark:text-slate-100 mt-4 tracking-wider">
              {orderSuccess.orderId}
            </div>

            <p className="text-xs text-slate-400 mt-4 font-sans">A confirmation email has been dispatched to your mailbox.</p>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => router.push(`/orders/${orderSuccess.orderId}`)}
                className="w-full bg-secondary hover:bg-cyan-600 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                Track Order
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl text-xs transition cursor-pointer font-sans"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderError) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 animate-fade-in">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center py-20 px-4">
          <div className="max-w-md w-full glass p-8 rounded-3xl border border-red-200 dark:border-red-900/40 text-center shadow-xl">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200/50 dark:border-red-900/30">
              <AlertCircle className="w-10 h-10 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-4 font-sans">Failed to Place Order</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {orderError.message || 'The payment session lapsed or was cancelled. Your items are still saved in your shopping cart.'}
            </p>

            {orderError.orderId && (
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl font-mono text-xxs text-slate-500 dark:text-slate-450 mt-4 tracking-wider">
                Reference Order ID: {orderError.orderId}
              </div>
            )}

            <div className="mt-8 space-y-3">
              <button
                onClick={() => setOrderError(null)}
                className="w-full bg-secondary hover:bg-cyan-600 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                Change Payment Method / Retry
              </button>
              <button
                onClick={() => router.push('/cart')}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl text-xs transition cursor-pointer font-sans"
              >
                Return to Cart
              </button>
            </div>
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

  // Add dynamic COD charge
  if (selectedGateway === 'cod') {
    shippingCharges += codCharge;
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

            {/* Preferred Delivery Date */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                <span className="w-5 h-5 text-secondary flex items-center justify-center font-bold text-base">📅</span> 2. Preferred Delivery Date
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Please select your preferred date for receiving this delivery (available starting tomorrow).
              </p>
              <div className="relative max-w-sm">
                <input
                  type="date"
                  required
                  value={preferredDeliveryDate}
                  min={getTomorrowDateString()}
                  max={getMaxDeliveryDateString()}
                  onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-250 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary dark:focus:ring-secondary dark:focus:border-secondary transition-all"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-secondary" /> 3. Payment Gateway Options
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
                      {gw.id === 'cod' && subtotal < minCodValue && (
                        <p className="text-[10px] text-red-500 font-extrabold mt-1">
                          (Requires a minimum order value of ₹{minCodValue})
                        </p>
                      )}
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
                <span>
                  {Math.max(0, shippingCharges - (selectedGateway === 'cod' ? codCharge : 0)) === 0 
                    ? 'FREE' 
                    : `₹${Math.max(0, shippingCharges - (selectedGateway === 'cod' ? codCharge : 0))}`}
                </span>
              </div>
              {selectedGateway === 'cod' && codCharge > 0 && (
                <div className="flex justify-between text-orange-500 font-bold">
                  <span>COD Handling Fee</span>
                  <span>+₹{codCharge}</span>
                </div>
              )}
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
