'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { LayoutDashboard, Users, ShoppingBag, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useGetProductsQuery,
  useApproveSellerMutation,
  useApproveProductMutation,
} from '@/store/api';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const isAdmin = isAuthenticated && user && user.role === 'admin';

  // Queries
  const { data: statsRes, isLoading: statsLoading } = useGetAdminStatsQuery(undefined, { skip: activeTab !== 'overview' || !isAdmin });
  const { data: sellersRes, refetch: refetchSellers } = useGetAdminUsersQuery({ role: 'seller' }, { skip: activeTab !== 'sellers' || !isAdmin });
  const { data: productsRes, refetch: refetchProducts } = useGetProductsQuery({ status: 'pending' }, { skip: activeTab !== 'products' || !isAdmin });

  // Mutations
  const [approveSeller] = useApproveSellerMutation();
  const [approveProduct] = useApproveProductMutation();

  const stats = statsRes?.data?.stats || { totalCustomers: 0, totalSellers: 0, totalOrders: 0, totalSales: 0 };
  const sellersList = sellersRes?.data?.sellers || [];
  const pendingProducts = productsRes?.data?.products || [];

  if (!isAdmin) {
    return null;
  }

  const handleSellerApproval = async (id, status) => {
    try {
      await approveSeller({ id, status }).unwrap();
      alert(`Seller store has been ${status}.`);
      refetchSellers();
    } catch (err) {
      alert('Action failed.');
    }
  };

  const handleProductApproval = async (id, status) => {
    try {
      await approveProduct({ id, status }).unwrap();
      alert(`Product listing has been ${status}.`);
      refetchProducts();
    } catch (err) {
      alert('Action failed.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Admin Control Panel</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Side Tabs */}
          <div className="space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" /> Overview Metrics
            </button>
            <button
              onClick={() => setActiveTab('sellers')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'sellers'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4.5 h-4.5" /> Moderate Sellers
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'products'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" /> Moderate Products
            </button>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              /* Overview Stats Dashboard */
              <div className="space-y-8">
                {statsLoading ? (
                  <div className="text-sm text-slate-400 animate-pulse">Loading Platform Analytics...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Sales</p>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">₹{stats.totalSales.toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Active Customers</p>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalCustomers}</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Registered Sellers</p>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalSellers}</h2>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{stats.totalOrders}</h2>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sellers' && (
              /* Sellers list and approvals */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                  Moderate Seller Registrations
                </h3>

                {sellersList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No registered sellers found.</p>
                ) : (
                  <div className="space-y-4">
                    {sellersList.map(sel => (
                      <div key={sel._id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                        <div className="text-xs space-y-1">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{sel.storeName}</span>
                          <p className="text-slate-500">GSTIN: {sel.gstin} | PAN: {sel.pan}</p>
                          <p className="text-slate-500">Email: {sel.user?.email} | Status: <span className="font-bold uppercase text-orange-500">{sel.status}</span></p>
                        </div>

                        {sel.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSellerApproval(sel._id, 'approved')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl"
                              title="Approve Store"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSellerApproval(sel._id, 'rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl"
                              title="Reject Store"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              /* Pending Products list and approvals */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                  Moderate Product Submissions
                </h3>

                {pendingProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No pending products awaiting approval.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingProducts.map(prod => (
                      <div key={prod._id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <img src={prod.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <div className="text-xs space-y-0.5">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{prod.title}</span>
                            <p className="text-slate-500">Price: ₹{prod.price.toLocaleString('en-IN')} | SKU: {prod.sku}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProductApproval(prod._id, 'approved')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl"
                            title="Approve Listing"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleProductApproval(prod._id, 'rejected')}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl"
                            title="Reject Listing"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
