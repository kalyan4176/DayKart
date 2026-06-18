'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { LayoutDashboard, ShoppingBag, PlusCircle, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Store, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCreateProductMutation, useGetSellerProfileQuery, useCreateSellerProfileMutation, useGetCategoriesQuery, useGetBrandsQuery } from '@/store/api';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'seller') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Seller profile query & mutation
  const { data: profileRes, isLoading: profileLoading, refetch: refetchProfile } = useGetSellerProfileQuery(undefined, { skip: !isAuthenticated || user?.role !== 'seller' });
  const [createSellerProfile, { isLoading: profileCreating }] = useCreateSellerProfileMutation();
  const [createProduct, { isLoading: productLoading }] = useCreateProductMutation();
  const { data: categoriesRes } = useGetCategoriesQuery();
  const { data: brandsRes } = useGetBrandsQuery();

  const categories = categoriesRes?.data?.categories || [];
  const brands = brandsRes?.data?.brands || [];

  const sellerProfile = profileRes?.data?.seller;

  const [activeTab, setActiveTab] = useState('overview');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // CSV Bulk Upload States
  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);

  // Form for single product upload
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Form for store profile registration
  const { 
    register: registerProfile, 
    handleSubmit: handleSubmitProfile, 
    formState: { errors: profileErrors } 
  } = useForm();

  if (!isAuthenticated || !user || user.role !== 'seller') {
    return null;
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-semibold">Loading Seller Portal...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const onSubmitProduct = async (data) => {
    try {
      setSuccessMsg('');
      setErrorMsg('');

      // Format arrays/objects
      const payload = {
        ...data,
        price: Number(data.price),
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
        gstRate: data.gstRate !== undefined ? Number(data.gstRate) : 18,
        images: [data.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'],
        inventory: {
          quantity: Number(data.quantity),
          lowStockThreshold: 5,
        },
        tags: data.tags ? data.tags.split(';').map(t => t.trim()) : [],
      };

      await createProduct(payload).unwrap();
      setSuccessMsg('Product added successfully! Awaiting administrator approval.');
      reset();
    } catch (err) {
      setErrorMsg(err.data?.message || 'Failed to create product listing.');
    }
  };

  const onSubmitProfile = async (data) => {
    try {
      setSuccessMsg('');
      setErrorMsg('');

      const payload = {
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        gstin: data.gstin,
        pan: data.pan,
        bankDetails: {
          accountNumber: data.bankAccountNumber,
          ifsc: data.bankIfsc,
          bankName: data.bankName,
          accountHolderName: data.bankAccountHolderName,
        },
        storeAddress: {
          street: data.street,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
        }
      };

      await createSellerProfile(payload).unwrap();
      setSuccessMsg('Seller profile created successfully! Awaiting admin approval.');
      refetchProfile();
    } catch (err) {
      setErrorMsg(err.data?.message || 'Failed to submit store profile.');
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setCsvLoading(true);
    setCsvResult('');

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      // Direct fetch for multipart bulk imports
      const response = await fetch('http://localhost:5005/api/v1/products/import-csv', {
        method: 'POST',
        body: formData,
        headers: {
          // Cookies are automatically sent
        },
      });

      const result = await response.json();
      if (response.ok) {
        setCsvResult(`Bulk import done! Successfully added ${result.data.totalImported} items.`);
      } else {
        setCsvResult(`Bulk import failed. Error: ${result.message}`);
      }
    } catch (err) {
      setCsvResult('Error uploading CSV file.');
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Seller Portal</h1>

        {/* Case 1: No Seller Profile Registered */}
        {!sellerProfile ? (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm max-w-2xl mx-auto">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <Store className="w-6 h-6 text-secondary" />
              <h3 className="font-extrabold text-xl text-slate-800">
                Complete Your Seller Store Registration
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Before you can start listing products and tracking earnings, you must register your store details. Once submitted, your profile will be reviewed by our administrators.
            </p>

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-sm text-emerald-600">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-sm text-red-600">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
              {/* Store Section */}
              <div>
                <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider mb-4 border-b pb-1">
                  Store Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Store Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Tech Store"
                      {...registerProfile('storeName', { required: 'Store name is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                    {profileErrors.storeName && <p className="text-xxs text-red-500 mt-1">{profileErrors.storeName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Store Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Premium technology and accessories"
                      {...registerProfile('storeDescription')}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Verification Section */}
              <div>
                <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider mb-4 border-b pb-1">
                  Tax & Business Identification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">GSTIN</label>
                    <input
                      type="text"
                      placeholder="15-character GSTIN"
                      {...registerProfile('gstin', { 
                        required: 'GSTIN is required', 
                        minLength: { value: 15, message: 'GSTIN must be exactly 15 characters' },
                        maxLength: { value: 15, message: 'GSTIN must be exactly 15 characters' }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition uppercase"
                    />
                    {profileErrors.gstin && <p className="text-xxs text-red-500 mt-1">{profileErrors.gstin.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">PAN Number</label>
                    <input
                      type="text"
                      placeholder="10-character PAN"
                      {...registerProfile('pan', { 
                        required: 'PAN is required', 
                        minLength: { value: 10, message: 'PAN must be exactly 10 characters' },
                        maxLength: { value: 10, message: 'PAN must be exactly 10 characters' }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition uppercase"
                    />
                    {profileErrors.pan && <p className="text-xxs text-red-500 mt-1">{profileErrors.pan.message}</p>}
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div>
                <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider mb-4 border-b pb-1">
                  Bank Account Details (For Payouts)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Full Legal Name"
                      {...registerProfile('bankAccountHolderName', { required: 'Account holder name is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                    {profileErrors.bankAccountHolderName && <p className="text-xxs text-red-500 mt-1">{profileErrors.bankAccountHolderName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      {...registerProfile('bankName', { required: 'Bank name is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                    {profileErrors.bankName && <p className="text-xxs text-red-500 mt-1">{profileErrors.bankName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Number</label>
                    <input
                      type="text"
                      placeholder="Bank Account Number"
                      {...registerProfile('bankAccountNumber', { required: 'Account number is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                    {profileErrors.bankAccountNumber && <p className="text-xxs text-red-500 mt-1">{profileErrors.bankAccountNumber.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="11-character IFSC Code"
                      {...registerProfile('bankIfsc', { required: 'IFSC code is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition uppercase"
                    />
                    {profileErrors.bankIfsc && <p className="text-xxs text-red-500 mt-1">{profileErrors.bankIfsc.message}</p>}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div>
                <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider mb-4 border-b pb-1">
                  Store Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 101 Corporate Suites"
                      {...registerProfile('street', { required: 'Street is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                    {profileErrors.street && <p className="text-xxs text-red-500 mt-1">{profileErrors.street.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                    <input
                      type="text"
                      placeholder="City"
                      {...registerProfile('city', { required: 'City is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                    {profileErrors.city && <p className="text-xxs text-red-500 mt-1">{profileErrors.city.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                    <input
                      type="text"
                      placeholder="State"
                      {...registerProfile('state', { required: 'State is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                    {profileErrors.state && <p className="text-xxs text-red-500 mt-1">{profileErrors.state.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
                    <input
                      type="text"
                      placeholder="Country"
                      {...registerProfile('country', { required: 'Country is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                    {profileErrors.country && <p className="text-xxs text-red-500 mt-1">{profileErrors.country.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Postal Code</label>
                    <input
                      type="text"
                      placeholder="Postal Code"
                      {...registerProfile('postalCode', { required: 'Postal code is required' })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition"
                    />
                    {profileErrors.postalCode && <p className="text-xxs text-red-500 mt-1">{profileErrors.postalCode.message}</p>}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileCreating}
                className="w-full bg-secondary hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl text-xs shadow-md active:scale-98 transition"
              >
                {profileCreating ? 'Submitting Registration...' : 'Complete & Submit Store Registration'}
              </button>
            </form>
          </div>
        ) : sellerProfile.status === 'pending' ? (
          /* Case 2: Store Registered but Pending Approval */
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm max-w-xl mx-auto text-center">
            <Clock className="w-16 h-16 text-orange-400 mx-auto mb-4 animate-pulse" />
            <h3 className="font-extrabold text-xl text-slate-800 mb-2">
              Store Registration Under Review
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
              Thank you for registering! Your store profile <strong>"{sellerProfile.storeName}"</strong> is currently pending review by administrators. Once approved, your seller portal will be fully unlocked.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-2 text-xxs text-slate-600 max-w-sm mx-auto">
              <p><strong>Store Name:</strong> {sellerProfile.storeName}</p>
              <p><strong>GSTIN:</strong> {sellerProfile.gstin}</p>
              <p><strong>PAN:</strong> {sellerProfile.pan}</p>
              <p><strong>Submitted On:</strong> {new Date(sellerProfile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ) : sellerProfile.status === 'rejected' ? (
          /* Case 3: Rejected Profile */
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm max-w-xl mx-auto text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="font-extrabold text-xl text-red-600 mb-2">
              Store Registration Rejected
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
              We regret to inform you that your store registration for <strong>"{sellerProfile.storeName}"</strong> has been rejected by administrators. Please reach out to customer support to resolve any issues.
            </p>
          </div>
        ) : (
          /* Case 4: Approved Profile (Render Standard Portal) */
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
                <LayoutDashboard className="w-4.5 h-4.5" /> Overview & Analytics
              </button>
              <button
                onClick={() => setActiveTab('add-product')}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'add-product'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <PlusCircle className="w-4.5 h-4.5" /> Add New Product
              </button>
              <button
                onClick={() => setActiveTab('bulk-upload')}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'bulk-upload'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Upload className="w-4.5 h-4.5" /> Bulk CSV Import
              </button>
            </div>

            {/* Main Display Area */}
            <div className="lg:col-span-3">
              {activeTab === 'overview' && (
                /* Overview Stats Dashboard */
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Earnings</p>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">₹{sellerProfile.revenue?.toLocaleString() || '0'}</h2>
                      <span className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 font-extrabold text-xxs px-2.5 py-0.5 rounded mt-2">+12% this month</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Store Rating</p>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{sellerProfile.rating || '0.0'} ★</h2>
                      <span className="inline-block bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 font-extrabold text-xxs px-2.5 py-0.5 rounded mt-2">{sellerProfile.totalReviews || 0} Reviews</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                      <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Account Status</p>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 capitalize">{sellerProfile.status}</h2>
                      <span className="inline-block bg-orange-50 dark:bg-orange-950/40 text-orange-500 font-extrabold text-xxs px-2.5 py-0.5 rounded mt-2">Verified Store</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'add-product' && (
                /* Single Product Creation Form */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                    Add Catalog Listing
                  </h3>

                  {successMsg && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-2.5 text-sm text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmitProduct)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Product Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Nike Air Max Running Shoes"
                        {...register('title', { required: 'Title is required' })}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.title && <p className="text-xxs text-red-500 mt-1">{errors.title.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Unique SKU</label>
                      <input
                        type="text"
                        placeholder="NK-AIRMAX-WHT-10"
                        {...register('sku', { required: 'SKU is required' })}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.sku && <p className="text-xxs text-red-500 mt-1">{errors.sku.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Price (₹)</label>
                      <input
                        type="number"
                        placeholder="999"
                        {...register('price', { required: 'Price is required' })}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.price && <p className="text-xxs text-red-500 mt-1">{errors.price.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Compare Price (₹)</label>
                      <input
                        type="number"
                        placeholder="1499"
                        {...register('compareAtPrice')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Stock Quantity</label>
                      <input
                        type="number"
                        placeholder="50"
                        {...register('quantity', { required: 'Stock count required' })}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.quantity && <p className="text-xxs text-red-500 mt-1">{errors.quantity.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">GST Rate (%)</label>
                      <select
                        defaultValue="18"
                        {...register('gstRate', { required: 'GST rate is required' })}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      >
                        <option value="0">0% (Exempt)</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                      {errors.gstRate && <p className="text-xxs text-red-500 mt-1">{errors.gstRate.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                      <select
                        {...register('category', { required: 'Category is required' })}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && <p className="text-xxs text-red-500 mt-1">{errors.category.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Brand</label>
                      <select
                        {...register('brand', { required: 'Brand is required' })}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      >
                        <option value="">Select Brand</option>
                        {brands.map(br => (
                          <option key={br._id} value={br._id}>
                            {br.name}
                          </option>
                        ))}
                      </select>
                      {errors.brand && <p className="text-xxs text-red-500 mt-1">{errors.brand.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Image URL</label>
                      <input
                        type="text"
                        placeholder="http://example.com/image.jpg"
                        {...register('imageUrl')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        placeholder="Detailed product descriptions..."
                        rows={4}
                        {...register('description', { required: 'Description is required' })}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.description && <p className="text-xxs text-red-500 mt-1">{errors.description.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tags (semicolon separated)</label>
                      <input
                        type="text"
                        placeholder="smartphone;android;samsung"
                        {...register('tags')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={productLoading}
                      className="md:col-span-2 bg-secondary hover:bg-cyan-600 text-white font-bold py-3 rounded-xl text-xs shadow-md active:scale-98 transition"
                    >
                      {productLoading ? 'Creating listing...' : 'Submit Product for Approval'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'bulk-upload' && (
                /* Bulk CSV Upload Interface */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm text-center">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 text-left">
                    Bulk Catalog CSV Import
                  </h3>

                  <div className="max-w-md mx-auto border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-3xl hover:border-secondary transition cursor-pointer">
                    <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                    
                    <form onSubmit={handleCsvUpload} className="mt-4 space-y-4">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={e => setCsvFile(e.target.files[0])}
                        className="mx-auto block text-xs text-slate-500"
                      />

                      <button
                        type="submit"
                        disabled={csvLoading || !csvFile}
                        className="inline-flex items-center gap-1.5 bg-accent hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-md disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" /> {csvLoading ? 'Uploading...' : 'Upload & Process CSV'}
                      </button>
                    </form>
                  </div>

                  {csvResult && (
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-6 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      {csvResult}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
