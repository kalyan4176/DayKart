'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { MapPin, CreditCard, ShieldCheck, ShoppingBag, PlusCircle, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useGetCartQuery, useCheckoutMutation } from '@/store/api';

const GATEWAYS = [
  { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Pay with cash upon package delivery.' },
  { id: 'stripe', name: 'Stripe Credit Card', desc: 'Secure card transaction processing.' },
  { id: 'razorpay', name: 'Razorpay UPI / Wallet', desc: 'Instant UPI, net banking, or wallet.' }
];

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponCode = searchParams.get('coupon') || '';

  const { user, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // API Hooks
  const { data: cartRes, isLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [checkoutApi, { isLoading: orderPlacing }] = useCheckoutMutation();

  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.find(a => a.isDefault)?._id || user?.addresses?.[0]?._id || '');
  const [selectedGateway, setSelectedGateway] = useState('cod');
  
  const [orderSuccess, setOrderSuccess] = useState(null);

  const cartItems = cartRes?.data?.cart || [];

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a shipping address.');
      return;
    }

    try {
      const res = await checkoutApi({
        addressId: selectedAddress,
        couponCode: couponCode || undefined,
        gateway: selectedGateway,
      }).unwrap();

      setOrderSuccess(res.data);
    } catch (err) {
      alert(err.data?.message || 'Failed to place order.');
    }
  };

  if (!isAuthenticated) {
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
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-secondary" /> 1. Shipping Address
              </h3>

              {user?.addresses?.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 italic">No addresses saved. Please add one in profile settings.</p>
                  <button
                    onClick={() => router.push('/profile')}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
                  >
                    <PlusCircle className="w-4 h-4" /> Add New Address
                  </button>
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
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-secondary" /> 3. Review Order Items
            </h3>

            <div className="max-h-56 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-2.5 items-center">
                  <img src={item.product?.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.product?.title}</p>
                    <p className="text-slate-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
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
