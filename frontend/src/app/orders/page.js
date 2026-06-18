'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ShoppingBag, ArrowRight, XCircle, Clock, CheckCircle2, ChevronRight, Package, Truck, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ToastProvider';
import { useGetMyOrdersQuery, useCancelOrderMutation } from '@/store/api';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mounted, setMounted] = React.useState(false);
  const { showToast } = useToast();
  const [expandedOrders, setExpandedOrders] = React.useState({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch order history
  const { data: ordersRes, isLoading, refetch } = useGetMyOrdersQuery(undefined, {
    skip: !isAuthenticated || !mounted,
  });
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  const orders = ordersRes?.data?.orders || [];

  const handleCancelOrder = async (orderId) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelOrder(orderId).unwrap();
        showToast('Order cancelled successfully.', 'success');
      } catch (err) {
        showToast(err.data?.message || 'Failed to cancel the order.', 'error');
      }
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return null;
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200/60', icon: Clock, label: 'Pending Payment' },
      placed: { bg: 'bg-blue-50 text-blue-700 border-blue-200/60', icon: CheckCircle2, label: 'Placed' },
      processed: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', icon: Package, label: 'Approved by Seller' },
      shipped: { bg: 'bg-purple-50 text-purple-700 border-purple-200/60', icon: Truck, label: 'Shipped' },
      out_for_delivery: { bg: 'bg-orange-50 text-orange-700 border-orange-200/60', icon: Truck, label: 'Out for Delivery' },
      delivered: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', icon: CheckCircle2, label: 'Delivered' },
      cancelled: { bg: 'bg-red-50 text-red-700 border-red-200/60', icon: XCircle, label: 'Cancelled' },
      returned: { bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: ShieldAlert, label: 'Returned' },
    };

    const config = badges[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: Package, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold border ${config.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3.5 mb-8">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 text-secondary rounded-2xl border border-cyan-100 dark:border-cyan-900/40 shadow-sm animate-fade-in">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Order History</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage, track, or cancel your marketplace orders.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm max-w-md mx-auto mt-8">
            <div className="inline-flex items-center justify-center p-5 bg-cyan-50 dark:bg-cyan-950/40 text-secondary rounded-full mb-6">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">No orders placed yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2.5 max-w-xs mx-auto leading-relaxed">
              Looks like you haven't placed any orders yet. Visit our shop and check out the premium selection.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 mt-8 bg-secondary hover:bg-cyan-600 text-white font-bold px-6 py-3 rounded-full transition-all shadow-md active:scale-98 text-sm"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
              >
                {/* Order Header Info */}
                <div className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      <p className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Order ID</p>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{order.orderId}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Date Placed</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">Total Amount</p>
                      <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                        ₹{order.pricing.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Visual Order Stepper Tracker */}
                {order.status !== 'cancelled' && order.status !== 'returned' ? (
                  <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/10">
                    <div className="flex items-center justify-between max-w-xl mx-auto relative px-4">
                      {/* Connecting Line background */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>
                      
                      {/* Active Connecting Line overlay */}
                      <div 
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-secondary z-0 transition-all duration-500"
                        style={{
                          width: `${
                            order.status === 'delivered' ? 'calc(100% - 3rem)' :
                            order.status === 'out_for_delivery' ? 'calc(75% - 2.25rem)' :
                            order.status === 'shipped' ? 'calc(50% - 1.5rem)' :
                            order.status === 'processed' ? 'calc(25% - 0.75rem)' : '0%'
                          }`
                        }}
                      ></div>
                      
                      {/* Stepper Nodes */}
                      {[
                        { key: 'placed', label: 'Placed', icon: CheckCircle2, activeStatuses: ['pending', 'placed', 'processed', 'shipped', 'out_for_delivery', 'delivered'] },
                        { key: 'processed', label: 'Seller Approved', icon: Package, activeStatuses: ['processed', 'shipped', 'out_for_delivery', 'delivered'] },
                        { key: 'shipped', label: 'Dispatched', icon: Truck, activeStatuses: ['shipped', 'out_for_delivery', 'delivered'] },
                        { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, activeStatuses: ['out_for_delivery', 'delivered'] },
                        { key: 'delivered', label: 'Delivered', icon: CheckCircle2, activeStatuses: ['delivered'] },
                      ].map((step) => {
                        const isActive = step.activeStatuses.includes(order.status);
                        const StepIcon = step.icon;
                        return (
                          <div key={step.key} className="flex flex-col items-center z-10 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isActive 
                                ? 'bg-secondary border-secondary text-white shadow-md shadow-cyan-500/20 scale-105' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                            }`}>
                              <StepIcon className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] font-bold mt-2 tracking-wide hidden sm:block ${
                              isActive ? 'text-secondary font-black' : 'text-slate-450 dark:text-slate-405'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Small layout mobile description text */}
                    <div className="flex justify-between max-w-xl mx-auto px-4 mt-2 sm:hidden text-[9px] font-bold text-slate-400">
                      <span>Placed</span>
                      <span>Approved</span>
                      <span>Dispatched</span>
                      <span>Out</span>
                      <span>Delivered</span>
                    </div>
                  </div>
                ) : (
                  /* Cancelled or Returned banner */
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-red-50/10 dark:bg-red-950/10 flex items-center gap-3 text-xs text-red-600 dark:text-red-400">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-extrabold text-sm capitalize">Order {order.status}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {order.statusTimeline && order.statusTimeline.length > 0
                          ? order.statusTimeline[order.statusTimeline.length - 1].message
                          : `The order is marked as ${order.status}.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800/50">
                  {order.items.map((item) => (
                    <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate hover:text-secondary">
                          {item.product ? (
                            <Link href={`/product/${item.product._id}`}>{item.product.title}</Link>
                          ) : (
                            'Product Deleted'
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Qty: <span className="font-semibold">{item.quantity}</span> &middot; Price: <span className="font-semibold">₹{item.price.toLocaleString('en-IN')}</span>
                        </p>
                      </div>

                      <div className="text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline toggle & Cancel Actions */}
                <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between gap-4">
                  <button
                    onClick={() => toggleOrderExpand(order._id)}
                    className="text-xs font-bold text-secondary hover:text-cyan-600 transition flex items-center gap-1"
                  >
                    <span>{expandedOrders[order._id] ? 'Hide Order Journey' : 'Track Order Journey'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedOrders[order._id] ? 'rotate-90' : ''}`} />
                  </button>

                  {(order.status === 'pending' || order.status === 'placed') && (
                    <button
                      onClick={() => handleCancelOrder(order.orderId)}
                      disabled={isCancelling}
                      className="inline-flex items-center gap-1.5 border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 font-bold px-3 py-1.5 rounded-xl text-xs transition active:scale-98 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Order
                    </button>
                  )}
                </div>

                {/* Expandable Timeline Log */}
                {expandedOrders[order._id] && (
                  <div className="bg-slate-50/20 dark:bg-slate-950/30 px-8 py-5 border-t border-slate-100 dark:border-slate-800/85">
                    <h5 className="font-extrabold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Status Journey Details</h5>
                    <div className="relative border-l border-slate-250 dark:border-slate-800 pl-4 space-y-4 text-xs">
                      {order.statusTimeline?.map((t, idx) => (
                        <div key={idx} className="relative">
                          {/* Circle dot marker */}
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-white dark:border-slate-900 shadow-sm" />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <span className="font-bold capitalize text-slate-800 dark:text-slate-250">
                              {t.status === 'processed' ? 'Approved by Seller' : t.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {new Date(t.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">{t.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
