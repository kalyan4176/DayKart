'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ArrowLeft, XCircle, Clock, CheckCircle2, ChevronRight, Package, Truck, ShieldAlert, CreditCard, MapPin, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ToastProvider';
import { useGetOrderByIdQuery, useCancelOrderMutation, useReturnOrderMutation } from '@/store/api';
import ConfirmationModal from '@/components/ConfirmationModal';
import ReasonPromptModal from '@/components/ReasonPromptModal';

export default function OrderDetailsPage({ params }) {
  const router = useRouter();
  const unwrappedParams = React.use ? React.use(params) : params;
  const id = unwrappedParams?.id;
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mounted, setMounted] = React.useState(false);
  const { showToast } = useToast();
  const [timelineExpanded, setTimelineExpanded] = React.useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = React.useState(false);
  const [returnType, setReturnType] = React.useState('return');
  const [returnReason, setReturnReason] = React.useState('');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch single order details
  const { data: orderRes, isLoading, refetch } = useGetOrderByIdQuery(id, {
    skip: !isAuthenticated || !mounted || !id,
  });
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [submitReturn, { isLoading: isSubmittingReturn }] = useReturnOrderMutation();

  const order = orderRes?.data?.order;

  // Redirect if not authenticated
  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleCancelOrder = async (reason) => {
    if (!order) return;
    try {
      await cancelOrder({ id: order.orderId, reason: reason.trim() }).unwrap();
      showToast('Order cancelled successfully.', 'success');
      refetch();
    } catch (err) {
      showToast(err.data?.message || 'Failed to cancel the order.', 'error');
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;
    try {
      await submitReturn({
        id: order.orderId,
        type: returnType,
        reason: returnReason,
      }).unwrap();
      showToast('Return/Replacement request submitted successfully.', 'success');
      setIsReturnModalOpen(false);
      setReturnReason('');
      setReturnType('return');
      refetch();
    } catch (err) {
      showToast(err.data?.message || 'Failed to submit return request.', 'error');
    }
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-12">
          <div className="text-sm font-semibold text-slate-500 animate-pulse">Loading Order Details...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center py-12">
          <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-sm">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold mt-4 text-slate-900 dark:text-white">Order Not Found</h2>
            <p className="text-xs text-slate-500 mt-2">The requested order details could not be found or you do not have permission.</p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 mt-6 bg-secondary hover:bg-cyan-600 text-white font-bold px-6 py-3 rounded-full text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Back to History
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
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
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${config.bg}`}>
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 animate-fade-in">
        {/* Back navigation */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order History
        </Link>

        {/* Detailed Order Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Order Details Header */}
          <div className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Order Reference</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{order.orderId}</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* Stepper Tracker */}
          {order.status !== 'cancelled' && order.status !== 'returned' && (
            <div className="px-6 py-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-900/10">
              <div className="flex items-center justify-between max-w-xl mx-auto relative px-4">
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>
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
                {[
                  { key: 'placed', label: 'Placed', icon: CheckCircle2, activeStatuses: ['pending', 'placed', 'processed', 'shipped', 'out_for_delivery', 'delivered'] },
                  { key: 'processed', label: 'Approved', icon: Package, activeStatuses: ['processed', 'shipped', 'out_for_delivery', 'delivered'] },
                  { key: 'shipped', label: 'Dispatched', icon: Truck, activeStatuses: ['shipped', 'out_for_delivery', 'delivered'] },
                  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, activeStatuses: ['out_for_delivery', 'delivered'] },
                  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, activeStatuses: ['delivered'] },
                ].map((step) => {
                  const isActive = step.activeStatuses.includes(order.status);
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center z-10 relative">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
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
              <div className="flex justify-between max-w-xl mx-auto px-4 mt-2 sm:hidden text-[9px] font-bold text-slate-400">
                <span>Placed</span>
                <span>Approved</span>
                <span>Dispatched</span>
                <span>Out</span>
                <span>Delivered</span>
              </div>
            </div>
          )}

          {/* Cancellation alerts */}
          {(order.status === 'cancelled' || order.status === 'returned') && (
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

          {/* Shipping and Payment Info Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="space-y-2">
              <h4 className="text-xxs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-secondary" /> Shipping Address
              </h4>
              <div className="text-xs bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <p className="font-bold text-slate-850 dark:text-slate-200">
                  {order.shippingAddress?.street}
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {order.shippingAddress?.country} - {order.shippingAddress?.postalCode}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xxs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-secondary" /> Payment Summary
              </h4>
              <div className="text-xs bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gateway:</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-350 uppercase">{order.payment?.gateway || 'COD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">₹{order.pricing?.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                {order.pricing?.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{order.pricing.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-800 pt-2 font-black text-slate-900 dark:text-white">
                  <span>Total Amount Paid:</span>
                  <span>₹{order.pricing?.total?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Items */}
          <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800/50">
            <h4 className="text-xxs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Order Items</h4>
            {order.items?.map((item) => (
              <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0">
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

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate">
                    {item.product ? (
                      <Link href={`/product/${item.product._id}`} className="hover:text-secondary">{item.product.title}</Link>
                    ) : (
                      'Product Deleted'
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Qty: <span className="font-semibold">{item.quantity}</span> &middot; Price: <span className="font-semibold">₹{item.price.toLocaleString('en-IN')}</span>
                  </p>
                </div>

                <div className="text-right text-xs font-bold text-slate-850 dark:text-slate-200">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Expandable Timeline Log Section */}
          <div className="border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setTimelineExpanded(!timelineExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-850 dark:hover:text-slate-250 transition bg-slate-50/25 dark:bg-slate-900/25"
            >
              <span>Order Status Journey Timeline</span>
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${timelineExpanded ? 'rotate-90' : ''}`} />
            </button>

            {timelineExpanded && (
              <div className="bg-slate-50/10 dark:bg-slate-950/20 px-8 py-5 border-t border-slate-150/45 dark:border-slate-800/60">
                <div className="relative border-l border-slate-250 dark:border-slate-800 pl-4 space-y-4 text-xs">
                  {order.statusTimeline?.map((t, idx) => (
                    <div key={idx} className="relative">
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
        </div>

        {/* Cancel/Return action button */}
        {order.status !== 'cancelled' && order.status !== 'returned' && (
          <div className="mt-6 flex justify-end gap-3 flex-wrap">
            {order.status === 'delivered' ? (
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-cyan-550/10 hover:bg-cyan-550/20 border border-cyan-500/35 text-cyan-600 dark:text-cyan-400 font-bold px-6 py-3 rounded-2xl text-xs transition active:scale-98"
              >
                <RefreshCw className="w-4 h-4 animate-spin-hover" /> Return or Replace Order
              </button>
            ) : (
              <div className="relative group">
                <button
                  onClick={() => {
                    if (order.status === 'pending' || order.status === 'placed') {
                      setIsCancelModalOpen(true);
                    }
                  }}
                  disabled={isCancelling || (order.status !== 'pending' && order.status !== 'placed')}
                  className={`inline-flex items-center gap-1.5 border font-bold px-6 py-3 rounded-2xl text-xs transition ${
                    (order.status === 'pending' || order.status === 'placed')
                      ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600 cursor-pointer active:scale-98'
                      : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> {isCancelling ? 'Cancelling...' : 'Cancel Active Order'}
                </button>
                {(order.status !== 'pending' && order.status !== 'placed') && (
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 bg-slate-850 dark:bg-slate-800 text-white dark:text-slate-100 text-[10px] py-1.5 px-3 rounded-xl shadow-lg w-52 text-center pointer-events-none transition-all duration-200">
                    Cannot cancel after the seller has approved or shipped the order.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <ReasonPromptModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Active Order"
        message="Are you sure you want to cancel this order? This action cannot be undone. Please specify your reason for cancellation."
        placeholder="e.g., Ordered wrong size, changed my mind..."
        confirmText="Cancel Order"
        type="danger"
      />

      {/* Return/Replace Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-scale-up">
            <h3 className="text-base font-extrabold text-black dark:text-white flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-secondary" /> Return or Replace Order
            </h3>
            
            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Request Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnType('return')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                      returnType === 'return'
                        ? 'border-secondary bg-secondary/10 text-secondary'
                        : 'border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <span>Return & Refund</span>
                    <span className="text-[9px] font-normal opacity-70">Get money back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('replace')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                      returnType === 'replace'
                        ? 'border-secondary bg-secondary/10 text-secondary'
                        : 'border-slate-250 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <span>Replace & Exchange</span>
                    <span className="text-[9px] font-normal opacity-70">Get new item</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Reason for Return/Replacement *
                </label>
                <textarea
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Please describe the issue (e.g. wrong size, defective item, product not as described)..."
                  rows={4}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="flex-grow bg-secondary hover:bg-cyan-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsReturnModalOpen(false);
                    setReturnType('return');
                    setReturnReason('');
                  }}
                  disabled={isSubmittingReturn}
                  className="bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-2.5 rounded-xl text-xs transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
