'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { LayoutDashboard, ShoppingBag, PlusCircle, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCreateProductMutation } from '@/store/api';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'seller') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  const [createProduct, { isLoading: productLoading }] = useCreateProductMutation();

  const [activeTab, setActiveTab] = useState('overview');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // CSV Bulk Upload States
  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);

  // Form for single product upload
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  if (!isAuthenticated || !user || user.role !== 'seller') {
    return null;
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
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">₹1,45,290</h2>
                    <span className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 font-extrabold text-xxs px-2.5 py-0.5 rounded mt-2">+12% this month</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                    <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">12 Items</h2>
                    <span className="inline-block bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 font-extrabold text-xxs px-2.5 py-0.5 rounded mt-2">4 Pending Approvals</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                    <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Orders Processed</p>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">42 Orders</h2>
                    <span className="inline-block bg-orange-50 dark:bg-orange-950/40 text-orange-500 font-extrabold text-xxs px-2.5 py-0.5 rounded mt-2">3 Out for Delivery</span>
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
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Category ID (Object ID)</label>
                    <input
                      type="text"
                      placeholder="Enter category mongo ID"
                      {...register('category', { required: 'Category ID is required' })}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                    />
                    {errors.category && <p className="text-xxs text-red-500 mt-1">{errors.category.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Brand ID (Object ID)</label>
                    <input
                      type="text"
                      placeholder="Enter brand mongo ID"
                      {...register('brand', { required: 'Brand ID is required' })}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                    />
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
      </main>

      <Footer />
    </div>
  );
}
