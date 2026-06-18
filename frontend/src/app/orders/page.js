'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ShoppingBag, ArrowRight, XCircle, Clock, CheckCircle2, ChevronRight, Package, Truck, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useGetMyOrdersQuery, useCancelOrderMutation } from '@/store/api';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Fetch order history
  const { data: ordersRes, isLoading, refetch } = useGetMyOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  const orders = ordersRes?.data?.orders || [];

  const handleCancelOrder = async (orderId) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelOrder(orderId).unwrap();
        alert('Order cancelled successfully.');
      } catch (err) {
        alert(err.data?.message || 'Failed to cancel the order.');
      }
    }
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200/60', icon: Clock, label: 'Pending Payment' },
      placed: { bg: 'bg-blue-50 text-blue-700 border-blue-200/60', icon: CheckCircle2, label: 'Placed' },
      processed: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', icon: Package, label: 'Processed' },
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

                {/* Order Footer Actions */}
                {(order.status === 'pending' || order.status === 'placed') && (
                  <div className="bg-slate-50/20 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4.5 flex justify-end">
                    <button
                      onClick={() => handleCancelOrder(order.orderId)}
                      disabled={isCancelling}
                      className="inline-flex items-center gap-1.5 border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition active:scale-98 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Cancel Order
                    </button>
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
