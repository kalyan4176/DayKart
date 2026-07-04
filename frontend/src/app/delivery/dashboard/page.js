'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, Truck, Phone, Mail, MapPin, CheckCircle2, 
  AlertCircle, RefreshCw, LogOut, ShieldAlert, KeyRound, 
  DollarSign, Clock, PackageCheck, ClipboardList, CheckCircle, ShieldCheck
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/store/api';
import { useToast } from '@/components/ToastProvider';
import { logoutUser } from '@/store/authSlice';

export default function DeliveryDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [otpInput, setOtpInput] = useState({});
  const [activeVerifyOrderId, setActiveVerifyOrderId] = useState(null);
  const [verifyOtpError, setVerifyOtpError] = useState('');

  // API Queries & Mutations
  const { data: deliveryOrdersRes, refetch: refetchOrders, isLoading: ordersLoading } = api.useGetDeliveryOrdersQuery(undefined, {
    skip: !isAuthenticated || user?.role !== 'delivery_partner' || !mounted
  });
  
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = api.useUpdateOrderStatusMutation();
  const [verifyDeliveryOtp, { isLoading: isVerifyingOtp }] = api.useVerifyDeliveryOtpMutation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || !user || user.role !== 'delivery_partner')) {
      showToast('Unauthorized access. Redirecting...', 'error');
      router.push('/login');
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !isAuthenticated || user?.role !== 'delivery_partner') {
    return null;
  }

  const orders = deliveryOrdersRes?.data?.orders || [];

  // Filter orders based on status tab
  const getFilteredOrders = () => {
    if (statusFilter === 'all') return orders;
    if (statusFilter === 'pending') {
      return orders.filter(o => o.status === 'processed' || o.status === 'shipped');
    }
    if (statusFilter === 'active') {
      return orders.filter(o => o.status === 'out_for_delivery');
    }
    if (statusFilter === 'completed') {
      return orders.filter(o => o.status === 'delivered');
    }
    return orders;
  };

  const filteredOrders = getFilteredOrders();

  // Metrics helper
  const getMetrics = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'processed' || o.status === 'shipped').length;
    const active = orders.filter(o => o.status === 'out_for_delivery').length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    return { total, pending, active, completed };
  };

  const metrics = getMetrics();

  const handleLogout = () => {
    dispatch(logoutUser());
    showToast('Logged out successfully.', 'success');
    router.push('/login');
  };

  const handleMarkOutForDelivery = async (orderId) => {
    try {
      await updateOrderStatus({
        id: orderId,
        status: 'out_for_delivery',
        message: 'Courier is out for delivery with the package.'
      }).unwrap();
      showToast('Order status updated to Out for Delivery!', 'success');
      refetchOrders();
    } catch (err) {
      showToast(err.data?.message || 'Failed to update order status.', 'error');
    }
  };

  const handleVerifyOtpSubmit = async (e, orderId) => {
    e.preventDefault();
    setVerifyOtpError('');
    const code = otpInput[orderId]?.trim();
    if (!code || code.length !== 6 || isNaN(code)) {
      setVerifyOtpError('Please enter a valid 6-digit numeric OTP.');
      return;
    }

    try {
      await verifyDeliveryOtp({ orderId, otp: code }).unwrap();
      showToast('Delivery OTP verified! Order successfully delivered.', 'success');
      setActiveVerifyOrderId(null);
      // clear input
      setOtpInput(prev => ({ ...prev, [orderId]: '' }));
      refetchOrders();
    } catch (err) {
      setVerifyOtpError(err.data?.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-800/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-lg mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">Courier Service Dashboard</h1>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Active Courier
                </span>
              </div>
              <p className="text-xs text-slate-450 mt-1">
                Welcome back, <span className="text-slate-200 font-bold">{user?.name}</span> &middot; {user?.email}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800 text-slate-350 hover:text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/30 border border-slate-800/80 p-4.5 rounded-2xl">
            <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider block">Assigned Tasks</span>
            <p className="text-2xl font-black mt-1 text-slate-200">{metrics.total}</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-800/80 p-4.5 rounded-2xl">
            <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider block">Pending Handover</span>
            <p className="text-2xl font-black mt-1 text-cyan-400">{metrics.pending}</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-800/80 p-4.5 rounded-2xl">
            <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider block">Out for Delivery</span>
            <p className="text-2xl font-black mt-1 text-orange-400">{metrics.active}</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-800/80 p-4.5 rounded-2xl">
            <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-wider block">Completed</span>
            <p className="text-2xl font-black mt-1 text-emerald-400">{metrics.completed}</p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-slate-800 mb-6 gap-2 sm:gap-4 text-xs font-bold overflow-x-auto scrollbar-none select-none">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`pb-3 px-1 transition whitespace-nowrap ${statusFilter === 'all' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-350'}`}
          >
            All Shipments
          </button>
          <button 
            onClick={() => setStatusFilter('pending')}
            className={`pb-3 px-1 transition whitespace-nowrap ${statusFilter === 'pending' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-350'}`}
          >
            Pending Handover ({metrics.pending})
          </button>
          <button 
            onClick={() => setStatusFilter('active')}
            className={`pb-3 px-1 transition whitespace-nowrap ${statusFilter === 'active' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-350'}`}
          >
            Out for Delivery ({metrics.active})
          </button>
          <button 
            onClick={() => setStatusFilter('completed')}
            className={`pb-3 px-1 transition whitespace-nowrap ${statusFilter === 'completed' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-350'}`}
          >
            Delivered ({metrics.completed})
          </button>
        </div>

        {/* Loading Spinner */}
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Retrieving courier registry...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-slate-800/10 border border-slate-800/80 rounded-3xl p-16 text-center">
            <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
            <p className="text-sm text-slate-400 font-bold">No delivery tasks matched this filter.</p>
            <p className="text-xxs text-slate-650 mt-1">Assigned tasks will appear automatically once generated by administration.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isCOD = order.payment?.paymentMethod === 'cod' && order.payment?.paymentStatus !== 'completed';
              const isPendingPickup = order.status === 'processed';
              const isShipped = order.status === 'shipped';
              const isOutForDelivery = order.status === 'out_for_delivery';
              const isDelivered = order.status === 'delivered';

              return (
                <div 
                  key={order._id}
                  className="bg-slate-800/20 border border-slate-850 rounded-2xl overflow-hidden shadow-md flex flex-col"
                >
                  {/* Card Header */}
                  <div className="bg-slate-800/40 border-b border-slate-850 px-6 py-4 flex flex-wrap justify-between items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block">Order ID</span>
                        <span className="text-slate-200 font-black mt-0.5">{order.orderId}</span>
                      </div>
                      <div className="hidden sm:block border-l border-slate-700 h-6"></div>
                      <div className="hidden sm:block">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block">Date Placed</span>
                        <span className="text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isCOD ? (
                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Collect Cash (COD)
                        </span>
                      ) : (
                        <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          Prepaid Online
                        </span>
                      )}
                      
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase border ${
                        isDelivered 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : isOutForDelivery 
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                      }`}>
                        {order.status === 'processed' ? 'Awaiting Handover' : order.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Grid */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    
                    {/* Pickup details (Sellers store) */}
                    <div className="space-y-3 bg-slate-800/10 border border-slate-850 p-4.5 rounded-xl">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                        <PackageCheck className="w-4 h-4 text-cyan-400" />
                        <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-slate-450">Pickup location (Seller Store)</h4>
                      </div>
                      {order.items?.[0]?.seller ? (
                        <div className="space-y-1.5 text-slate-350">
                          <p className="font-extrabold text-slate-200 text-sm">
                            {order.items?.[0]?.seller?.storeName || 'Partner Store'}
                          </p>
                          <p className="flex items-start gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                            <span>
                              {order.items?.[0]?.seller?.storeAddress
                                ? `${order.items?.[0]?.seller?.storeAddress?.street}, ${order.items?.[0]?.seller?.storeAddress?.city}, ${order.items?.[0]?.seller?.storeAddress?.state} - ${order.items?.[0]?.seller?.storeAddress?.postalCode}`
                                : 'Address not registered.'}
                            </span>
                          </p>
                          {order.items?.[0]?.seller?.user && (
                            <div className="pt-1.5 flex flex-col gap-1 text-[11px]">
                              <p className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <a href={`tel:${order.items?.[0]?.seller?.user?.phoneNumber}`} className="text-secondary hover:underline">
                                  {order.items?.[0]?.seller?.user?.phoneNumber || 'N/A'}
                                </a>
                              </p>
                              <p className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                <span>{order.items?.[0]?.seller?.user?.email}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">Seller store details unavailable.</p>
                      )}
                    </div>

                    {/* Delivery details (Customer) */}
                    <div className="space-y-3 bg-slate-800/10 border border-slate-850 p-4.5 rounded-xl">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                        <MapPin className="w-4 h-4 text-orange-400" />
                        <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-slate-450">Delivery Destination (Buyer)</h4>
                      </div>
                      <div className="space-y-1.5 text-slate-350">
                        <p className="font-extrabold text-slate-200 text-sm">{order.customer?.name || 'Customer'}</p>
                        <p className="flex items-start gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                          <span>
                            {order.shippingAddress 
                              ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country} - ${order.shippingAddress.postalCode}`
                              : 'No shipping address provided.'}
                          </span>
                        </p>
                        <div className="pt-1.5 flex flex-col gap-1 text-[11px]">
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <a href={`tel:${order.customer?.phoneNumber}`} className="text-secondary hover:underline">
                              {order.customer?.phoneNumber || 'N/A'}
                            </a>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{order.customer?.email || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing / COD Collection Info */}
                    <div className="md:col-span-2 p-4 rounded-xl border flex items-center justify-between gap-4 flex-wrap bg-slate-900/40 border-slate-850">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block">Parcel Contents</span>
                        <p className="font-bold text-slate-200 mt-0.5">
                          {order.items?.map(i => `${i.product?.title || 'Product'} (x${i.quantity})`).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        {isCOD ? (
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-amber-500 font-extrabold block">Amount to Collect</span>
                            <p className="text-lg font-black text-amber-400 mt-0.5">
                              ₹{order.pricing?.total?.toLocaleString('en-IN') || '0'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold block">Collected Online</span>
                            <p className="text-lg font-black text-slate-400 mt-0.5">
                              ₹{order.pricing?.total?.toLocaleString('en-IN') || '0'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="bg-slate-800/40 border-t border-slate-850 px-6 py-4 flex justify-between items-center gap-4 flex-wrap text-xxs font-bold">
                    <div className="text-slate-450 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Status: {order.status === 'processed' ? 'Seller packaging...' : order.status === 'shipped' ? 'Handed over' : order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Step 3: Awaiting seller handover */}
                      {isPendingPickup && (
                        <span className="text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-wider font-extrabold">
                          Awaiting Seller Handover
                        </span>
                      )}

                      {/* Step 4: Marked handover. Courier confirms package picked up from seller, marks out for delivery */}
                      {isShipped && (
                        <button
                          onClick={() => handleMarkOutForDelivery(order.orderId)}
                          disabled={isUpdatingStatus}
                          className="bg-secondary hover:bg-cyan-600 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                        >
                          Mark Out for Delivery
                        </button>
                      )}

                      {/* Step 5: Verify delivery OTP to complete delivery */}
                      {isOutForDelivery && (
                        <div className="w-full sm:w-auto">
                          {activeVerifyOrderId === order.orderId ? (
                            <form 
                              onSubmit={(e) => handleVerifyOtpSubmit(e, order.orderId)}
                              className="flex flex-col gap-2 bg-slate-900 border border-slate-850 p-4 rounded-xl max-w-sm"
                            >
                              <div className="flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-orange-400" />
                                <span className="text-xxs uppercase tracking-wider text-slate-400 font-extrabold">Enter Customer Delivery OTP</span>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="6-digit OTP"
                                  value={otpInput[order.orderId] || ''}
                                  onChange={(e) => setOtpInput(prev => ({ ...prev, [order.orderId]: e.target.value }))}
                                  className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-center tracking-widest text-white focus:outline-none focus:border-secondary w-32"
                                />
                                <button
                                  type="submit"
                                  disabled={isVerifyingOtp}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
                                >
                                  Verify & Deliver
                                </button>
                              </div>
                              {verifyOtpError && (
                                <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> {verifyOtpError}
                                </p>
                              )}
                            </form>
                          ) : (
                            <button
                              onClick={() => {
                                setVerifyOtpError('');
                                setActiveVerifyOrderId(order.orderId);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                            >
                              Verify OTP & Complete Delivery
                            </button>
                          )}
                        </div>
                      )}

                      {/* Completed */}
                      {isDelivered && (
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-2 rounded-xl flex items-center gap-1.5 uppercase font-extrabold text-xxs tracking-wider">
                          <CheckCircle className="w-4 h-4" /> Delivered & Verified
                        </span>
                      )}
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
