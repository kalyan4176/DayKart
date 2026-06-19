'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ShoppingBag, ArrowRight, Clock, CheckCircle2, Package, Truck, XCircle, ShieldAlert } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useGetMyOrdersQuery, useGetSellerOrdersQuery, useGetAdminOrdersQuery } from '@/store/api';

export default function OrderHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('purchases');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Set default tab based on user role when mounted/loaded
  React.useEffect(() => {
    if (mounted && user) {
      if (user.role === 'seller') {
        setActiveTab('sales');
      } else if (user.role === 'admin') {
        setActiveTab('all');
      } else {
        setActiveTab('purchases');
      }
    }
  }, [mounted, user]);

  // Fetch customer purchases
  const { data: customerOrdersRes, isLoading: customerLoading } = useGetMyOrdersQuery(undefined, {
    skip: !isAuthenticated || !mounted || (user?.role !== 'customer' && activeTab !== 'purchases'),
  });

  // Fetch seller sales
  const { data: sellerOrdersRes, isLoading: sellerLoading } = useGetSellerOrdersQuery(undefined, {
    skip: !isAuthenticated || !mounted || user?.role !== 'seller' || activeTab !== 'sales',
  });

  // Fetch admin all orders
  const { data: adminOrdersRes, isLoading: adminLoading } = useGetAdminOrdersQuery(undefined, {
    skip: !isAuthenticated || !mounted || user?.role !== 'admin' || activeTab !== 'all',
  });

  let orders = [];
  let isLoading = false;

  if (activeTab === 'purchases') {
    orders = customerOrdersRes?.data?.orders || [];
    isLoading = customerLoading;
  } else if (activeTab === 'sales') {
    orders = sellerOrdersRes?.data?.orders || [];
    isLoading = sellerLoading;
  } else if (activeTab === 'all') {
    orders = adminOrdersRes?.data?.orders || [];
    isLoading = adminLoading;
  }

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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 text-secondary rounded-2xl border border-cyan-100 dark:border-cyan-900/40 shadow-sm animate-fade-in">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'sales' ? 'Store Sales Orders' : activeTab === 'all' ? 'All System Orders' : 'Order History'}
            </h1>
            <p className="text-xxs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeTab === 'sales' 
                ? 'Manage and track incoming sales for your store.' 
                : activeTab === 'all' 
                ? 'Administrative view of all transactions.' 
                : 'Manage and track your marketplace purchases.'}
            </p>
          </div>
        </div>

        {/* Tab Switcher for Sellers and Admins */}
        {mounted && user?.role && user.role !== 'customer' && (
          <div className="flex w-full bg-slate-200/60 dark:bg-slate-900 p-1.5 rounded-2xl mb-6 shadow-xs max-w-sm sm:max-w-md mx-auto border border-slate-300/30 dark:border-slate-800/80 backdrop-blur-sm animate-fade-in">
            {user.role === 'seller' && (
              <>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`flex-grow py-2 px-4 rounded-xl text-xxs sm:text-xs font-black uppercase tracking-wider transition-all duration-305 ${
                    activeTab === 'sales'
                      ? 'bg-white dark:bg-slate-800 text-secondary dark:text-cyan-400 shadow-md scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  Store Sales
                </button>
                <button
                  onClick={() => setActiveTab('purchases')}
                  className={`flex-grow py-2 px-4 rounded-xl text-xxs sm:text-xs font-black uppercase tracking-wider transition-all duration-305 ${
                    activeTab === 'purchases'
                      ? 'bg-white dark:bg-slate-800 text-secondary dark:text-cyan-400 shadow-md scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  My Purchases
                </button>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-grow py-2 px-4 rounded-xl text-xxs sm:text-xs font-black uppercase tracking-wider transition-all duration-305 ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-slate-800 text-secondary dark:text-cyan-400 shadow-md scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  All System Orders
                </button>
                <button
                  onClick={() => setActiveTab('purchases')}
                  className={`flex-grow py-2 px-4 rounded-xl text-xxs sm:text-xs font-black uppercase tracking-wider transition-all duration-305 ${
                    activeTab === 'purchases'
                      ? 'bg-white dark:bg-slate-800 text-secondary dark:text-cyan-400 shadow-md scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  My Purchases
                </button>
              </>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm max-w-md mx-auto mt-6 animate-fade-in">
            <div className="inline-flex items-center justify-center p-4 bg-cyan-50 dark:bg-cyan-950/40 text-secondary rounded-full mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeTab === 'sales' ? 'No sales orders yet' : activeTab === 'all' ? 'No orders registered' : 'No purchases yet'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {activeTab === 'sales'
                ? "You haven't received any orders for your store products yet. Keep promoting your shop!"
                : activeTab === 'all'
                ? 'No transactions are currently registered in the database.'
                : "Looks like you haven't placed any orders yet. Visit our shop and check out the premium selection."}
            </p>
            {activeTab === 'purchases' && (
              <Link
                href="/products"
                className="inline-flex items-center gap-2 mt-6 bg-secondary hover:bg-cyan-600 text-white font-bold px-5 py-2.5 rounded-full transition-all shadow-md active:scale-98 text-xs"
              >
                Start Shopping <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => router.push(`/orders/${order.orderId}`)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex justify-between items-start gap-4"
              >
                <div className="flex flex-col justify-between h-[96px] min-w-0">
                  {/* Top Left: Product Image & Info */}
                  <div className="flex gap-3.5 items-center min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0">
                      {order.items?.[0]?.product?.images?.[0] ? (
                        <img
                          src={order.items[0].product.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-850 dark:text-slate-250 truncate max-w-[150px] sm:max-w-[280px]">
                        {order.items?.[0]?.product?.title || 'Product Item'}
                      </h4>
                      {order.items?.length > 1 && (
                        <p className="text-[9px] font-bold text-secondary uppercase tracking-wider mt-0.5">
                          + {order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}
                        </p>
                      )}
                      {activeTab !== 'purchases' && order.customer && (
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[150px] sm:max-w-[280px]">
                          Buyer: {order.customer.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Left: Date */}
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex flex-col justify-between items-end h-[96px] flex-shrink-0 text-right">
                  {/* Top Right: Status */}
                  <div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Bottom Right: Total */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Amount</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                      ₹{order.pricing.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
