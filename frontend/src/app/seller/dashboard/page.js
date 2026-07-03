'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { LayoutDashboard, ShoppingBag, PlusCircle, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Store, Clock, User, Mail, Phone, ShieldCheck, UploadCloud, X, Image as ImageIcon, Trash2, RefreshCw, ClipboardList, XCircle, Wallet, ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConfirmationModal from '@/components/ConfirmationModal';
import ReasonPromptModal from '@/components/ReasonPromptModal';
import { useToast } from '@/components/ToastProvider';
import { updateUser, logoutUser } from '@/store/authSlice';
import { useCreateProductMutation, useGetSellerProfileQuery, useCreateSellerProfileMutation, useGetCategoriesQuery, useGetBrandsQuery, useUpdateProfileMutation, useUploadProductImageMutation, useUpdateProductMutation, useDeleteProductMutation, useGetProductsQuery, useGetSellerOrdersQuery, useUpdateOrderStatusMutation, useGetWalletQuery, useDeleteProfileMutation } from '@/store/api';

function SellerDashboardContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: () => {},
  });

  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const { data: walletRes, isLoading: walletLoading, refetch: refetchWallet } = useGetWalletQuery(undefined, {
    skip: activeTab !== 'wallet' || !isAuthenticated || !mounted
  });
  const wallet = walletRes?.data?.wallet || { balance: 0, transactions: [] };

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerConfirmation = (config) => {
    setConfirmConfig({
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      type: config.type || 'danger',
      onConfirm: config.onConfirm,
    });
  };

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'seller') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Seller profile query & mutation
  const { data: profileRes, isLoading: profileLoading, refetch: refetchProfile } = useGetSellerProfileQuery(undefined, { skip: !isAuthenticated || user?.role !== 'seller' });
  const [createSellerProfile, { isLoading: profileCreating }] = useCreateSellerProfileMutation();
  const [createProduct, { isLoading: productLoading }] = useCreateProductMutation();
  const { data: categoriesRes, refetch: refetchCategories } = useGetCategoriesQuery();
  const { data: brandsRes, refetch: refetchBrands } = useGetBrandsQuery();

  const categories = categoriesRes?.data?.categories || [];
  const brands = brandsRes?.data?.brands || [];

  const sellerProfile = profileRes?.data?.seller;

  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [editingStock, setEditingStock] = useState({});

  const { data: sellerProductsRes, refetch: refetchSellerProducts } = useGetProductsQuery(
    { seller: sellerProfile?._id, status: 'all', limit: 100 },
    { skip: !sellerProfile || activeTab !== 'manage-listings' }
  );
  const sellerProducts = sellerProductsRes?.data?.products || [];

  const { data: sellerOrdersRes, refetch: refetchSellerOrders, isLoading: ordersLoading } = useGetSellerOrdersQuery(
    undefined,
    { skip: !sellerProfile || activeTab !== 'manage-orders' }
  );
  const sellerOrders = sellerOrdersRes?.data?.orders || [];
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [deleteProfile, { isLoading: isDeletingProfile }] = useDeleteProfileMutation();
  const [deleteCheckboxChecked, setDeleteCheckboxChecked] = useState(false);
  const handleDeleteAccount = () => {
    triggerConfirmation({
      title: 'Permanently Delete Your Account?',
      message: 'Are you absolutely sure you want to delete your Daykart seller account? This action is completely permanent and cannot be undone. All your personal details, wallet credit, store profile, and all product listings will be erased forever.',
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        try {
          await deleteProfile().unwrap();
          showToast('Your account was deleted successfully.', 'success');
          dispatch(logoutUser());
          router.push('/register');
        } catch (err) {
          showToast(err.data?.message || 'Failed to delete account.', 'error');
        }
      }
    });
  };

  const handleUpdateStock = async (productId) => {
    const qty = editingStock[productId];
    if (qty === undefined || qty === '') return;
    triggerConfirmation({
      title: 'Update Stock Level?',
      message: `Are you sure you want to change the stock level of this product to ${qty}?`,
      type: 'info',
      confirmText: 'Update Stock',
      onConfirm: async () => {
        try {
          await updateProduct({
            id: productId,
            inventory: {
              quantity: Number(qty),
              lowStockThreshold: 5
            }
          }).unwrap();
          showToast('Stock quantity updated successfully!', 'success');
          refetchSellerProducts();
        } catch (err) {
          showToast(err.data?.message || 'Failed to update stock.', 'error');
        }
      }
    });
  };

  const handleDeleteProduct = async (productId) => {
    triggerConfirmation({
      title: 'Delete Product Listing?',
      message: 'Are you sure you want to delete this listing? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Product',
      onConfirm: async () => {
        try {
          await deleteProduct(productId).unwrap();
          showToast('Product listing deleted successfully.', 'success');
          refetchSellerProducts();
        } catch (err) {
          showToast(err.data?.message || 'Failed to delete listing.', 'error');
        }
      }
    });
  };

  const handleAcceptOrder = async (orderId) => {
    triggerConfirmation({
      title: 'Accept & Process Order?',
      message: 'Are you sure you want to accept and process this customer order?',
      type: 'info',
      confirmText: 'Accept Order',
      onConfirm: async () => {
        try {
          await updateOrderStatus({ id: orderId, status: 'processed', message: 'Order approved and processed by seller.' }).unwrap();
          showToast('Order processed successfully!', 'success');
          refetchSellerOrders();
        } catch (err) {
          showToast(err.data?.message || 'Failed to accept order.', 'error');
        }
      }
    });
  };

  const handleRejectOrder = (orderId) => {
    setRejectOrderId(orderId);
    setIsRejectModalOpen(true);
  };

  const handleRejectOrderWithReason = async (reason) => {
    if (!rejectOrderId) return;
    try {
      await updateOrderStatus({ id: rejectOrderId, status: 'cancelled', message: reason.trim() }).unwrap();
      showToast('Order rejected and cancelled.', 'success');
      refetchSellerOrders();
    } catch (err) {
      showToast(err.data?.message || 'Failed to reject order.', 'error');
    }
  };

  const dispatch = useDispatch();
  const [updateProfileApi] = useUpdateProfileMutation();
  const [personalName, setPersonalName] = useState(user?.name || '');
  const [personalPhone, setPersonalPhone] = useState(user?.phoneNumber || '');
  const [personalProfileSuccess, setPersonalProfileSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setPersonalName(user.name || '');
      setPersonalPhone(user.phoneNumber || '');
    }
  }, [user]);

  const handleUpdatePersonalProfile = async (e) => {
    e.preventDefault();
    setPersonalProfileSuccess(false);
    try {
      const res = await updateProfileApi({ name: personalName, phoneNumber: personalPhone }).unwrap();
      dispatch(updateUser(res.data.user));
      showToast('Profile updated successfully!', 'success');
      setPersonalProfileSuccess(true);
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    }
  };

  // activeTab, successMsg, errorMsg states moved to top of component

  // CSV Bulk Upload States
  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);

  // Form for single product upload
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Cloudinary Image Upload
  const [uploadProductImage, { isLoading: uploadingImage }] = useUploadProductImageMutation();
  const [productImages, setProductImages] = useState([]);
  const [manualImageUrl, setManualImageUrl] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds the 5MB limit.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await uploadProductImage(formData).unwrap();
      const url = res.data?.imageUrl || res.url;
      if (url) {
        setProductImages((prev) => [...prev, url]);
        showToast('Image uploaded successfully!', 'success');
      }
    } catch (err) {
      showToast(err.data?.message || 'Failed to upload image.', 'error');
    }
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl.trim()) return;
    setProductImages((prev) => [...prev, manualImageUrl.trim()]);
    setManualImageUrl('');
    showToast('Manual image URL added to list!', 'success');
  };

  // Form for store profile registration
  const { 
    register: registerProfile, 
    handleSubmit: handleSubmitProfile, 
    setValue: setProfileValue,
    formState: { errors: profileErrors } 
  } = useForm();

  useEffect(() => {
    if (sellerProfile) {
      setProfileValue('storeName', sellerProfile.storeName || '');
      setProfileValue('storeDescription', sellerProfile.storeDescription || '');
      setProfileValue('gstin', sellerProfile.gstin || '');
      setProfileValue('pan', sellerProfile.pan || '');
      setProfileValue('bankAccountHolderName', sellerProfile.bankDetails?.accountHolderName || '');
      setProfileValue('bankName', sellerProfile.bankDetails?.bankName || '');
      setProfileValue('bankAccountNumber', sellerProfile.bankDetails?.accountNumber || '');
      setProfileValue('bankIfsc', sellerProfile.bankDetails?.ifsc || '');
      setProfileValue('street', sellerProfile.storeAddress?.street || '');
      setProfileValue('city', sellerProfile.storeAddress?.city || '');
      setProfileValue('state', sellerProfile.storeAddress?.state || '');
      setProfileValue('country', sellerProfile.storeAddress?.country || '');
      setProfileValue('postalCode', sellerProfile.storeAddress?.postalCode || '');
    }
  }, [sellerProfile, setProfileValue]);

  if (!mounted || !isAuthenticated || !user || user.role !== 'seller') {
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
    triggerConfirmation({
      title: 'Submit Catalog Listing?',
      message: `Are you sure you want to add the product "${data.title}"? It will await administrator approval before going live.`,
      type: 'info',
      confirmText: 'Submit Listing',
      onConfirm: async () => {
        try {
          setSuccessMsg('');
          setErrorMsg('');

          // Format arrays/objects
          const payload = {
            ...data,
            price: Number(data.price),
            compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
            gstRate: data.gstRate !== undefined ? Number(data.gstRate) : 18,
            images: productImages.length > 0 ? productImages : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'],
            inventory: {
              quantity: Number(data.quantity),
              lowStockThreshold: 5,
            },
            tags: data.tags ? data.tags.split(';').map(t => t.trim()) : [],
          };

          await createProduct(payload).unwrap();
          setSuccessMsg('Product added successfully! Awaiting administrator approval.');
          reset();
          setProductImages([]);
        } catch (err) {
          setErrorMsg(err.data?.message || 'Failed to create product listing.');
        }
      }
    });
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

  const tabNames = {
    overview: 'Overview & Analytics',
    'manage-orders': 'Manage Orders',
    'add-product': 'Add New Product',
    'manage-listings': 'Manage Listings',
    'bulk-upload': 'Bulk CSV Import',
    wallet: 'Store Wallet',
    profile: 'Profile Details',
    deleteAccount: 'Delete Account'
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
            {/* Mobile/Tablet Tab Dropdown Selector */}
            <div className="lg:hidden w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <label className="block text-xxs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Select Portal Section
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none focus:border-secondary transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{tabNames[activeTab]}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isTabDropdownOpen && (
                  <>
                    {/* Backdrop to close the dropdown when clicking outside */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsTabDropdownOpen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-2 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden py-1 max-h-60 overflow-y-auto">
                      {Object.entries(tabNames).map(([key, name]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setActiveTab(key);
                            setIsTabDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all ${
                            activeTab === key
                              ? 'bg-secondary text-white'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Sidebar Tabs */}
            <div className="hidden lg:flex lg:flex-col space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5" /> Overview & Analytics
              </button>
              <button
                onClick={() => setActiveTab('manage-orders')}
                className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                  activeTab === 'manage-orders'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ClipboardList className="w-4.5 h-4.5" /> Manage Orders
              </button>
              <button
                onClick={() => setActiveTab('add-product')}
                className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                  activeTab === 'add-product'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <PlusCircle className="w-4.5 h-4.5" /> Add New Product
              </button>
              <button
                onClick={() => setActiveTab('manage-listings')}
                className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                  activeTab === 'manage-listings'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ShoppingBag className="w-4.5 h-4.5" /> Manage Listings
              </button>
              <button
                onClick={() => setActiveTab('bulk-upload')}
                className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                  activeTab === 'bulk-upload'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Upload className="w-4.5 h-4.5" /> Bulk CSV Import
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                  activeTab === 'wallet'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Wallet className="w-4.5 h-4.5" /> Store Wallet
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <User className="w-4.5 h-4.5" /> Profile Details
              </button>
            </div>

            {/* Main Display Area */}
            <div className="lg:col-span-3">
              {activeTab === 'overview' && (
                /* Overview Stats Dashboard */
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-secondary" /> Seller Overview
                      </h3>
                      <p className="text-xxs text-slate-400 mt-1">Real-time statistics of your shop performance, earnings, and ratings.</p>
                    </div>
                    <button
                      onClick={() => refetchProfile()}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-250 rounded-xl transition-all"
                      title="Refresh Overview"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

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

              {activeTab === 'manage-orders' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
                    <span>Manage Customer Orders</span>
                    <button 
                      onClick={() => refetchSellerOrders()}
                      className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </h3>

                  {ordersLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xxs text-slate-500 font-semibold">Loading orders...</p>
                    </div>
                  ) : sellerOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No customer orders found for your products.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {sellerOrders.map((order) => {
                        const orderSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        return (
                          <div 
                            key={order._id} 
                            className="border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden bg-slate-50/10 dark:bg-slate-900/10 hover:shadow-xs transition duration-300"
                          >
                            {/* Order Card Header */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-850/80 px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-500">
                                <div>
                                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Order ID</p>
                                  <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{order.orderId}</p>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Customer</p>
                                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 truncate max-w-[120px]">{order.customer?.name || 'Guest'}</p>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Date Placed</p>
                                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Your Revenue</p>
                                  <p className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">₹{orderSubtotal.toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                              
                              <div>
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  order.status === 'processed' || order.status === 'shipped' || order.status === 'delivered'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                                    : order.status === 'pending' || order.status === 'placed'
                                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600'
                                      : 'bg-red-50 dark:bg-red-950/40 text-red-600'
                                }`}>
                                  {order.status === 'processed' ? 'Approved' : order.status}
                                </span>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-5 divide-y divide-slate-100 dark:divide-slate-850/60 bg-white dark:bg-slate-900">
                              {order.items.map((item) => (
                                <div key={item._id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4 text-xs">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-150 dark:border-slate-850 bg-slate-100 dark:bg-slate-850 flex-shrink-0">
                                    <img 
                                      src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=120'} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                  <div className="min-w-0 flex-grow">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.product?.title || 'Deleted Product'}</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                      Qty: <span className="font-bold text-slate-500">{item.quantity}</span> &middot; Price: <span className="font-bold text-slate-500">₹{item.price?.toLocaleString()}</span>
                                    </p>
                                  </div>
                                  <div className="text-right font-bold text-slate-800 dark:text-slate-200">
                                    ₹{(item.price * item.quantity).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Customer Contact & Shipping Details */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200/50 dark:border-slate-850/50 px-5 py-3.5 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[9px]">Buyer Contact Details</span>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">Name: <span className="font-normal text-slate-600 dark:text-slate-300">{order.customer?.name || 'N/A'}</span></p>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">Email: <span className="font-normal text-slate-600 dark:text-slate-300">{order.customer?.email || 'N/A'}</span></p>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">Phone: <span className="font-normal text-slate-600 dark:text-slate-300">{order.customer?.phoneNumber || 'N/A'}</span></p>
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[9px]">Shipping Address</span>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                  {order.shippingAddress 
                                    ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country} - ${order.shippingAddress.postalCode}`
                                    : 'No address provided.'}
                                </p>
                              </div>
                            </div>

                            {/* Order Actions */}
                            {(order.status === 'pending' || order.status === 'placed') && (
                              <div className="bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-850/50 px-5 py-3.5 flex justify-end gap-3">
                                <button
                                  onClick={() => handleRejectOrder(order.orderId)}
                                  className="inline-flex items-center gap-1.5 border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 font-bold px-4 py-2 rounded-xl text-xs transition active:scale-98"
                                >
                                  <XCircle className="w-4 h-4" /> Reject Order
                                </button>
                                <button
                                  onClick={() => handleAcceptOrder(order.orderId)}
                                  className="inline-flex items-center gap-1.5 bg-secondary hover:bg-cyan-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition active:scale-98"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Accept & Process
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'manage-listings' && (
                /* Manage Catalog Listings */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
                    <span>Manage Catalog Listings</span>
                    <button 
                      onClick={() => refetchSellerProducts()}
                      className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </h3>

                  {sellerProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No active product listings found.</p>
                      <button 
                        onClick={() => setActiveTab('add-product')}
                        className="mt-4 bg-secondary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-600 transition"
                      >
                        Add Your First Product
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-4 px-2">Product</th>
                            <th className="py-4 px-2">SKU</th>
                            <th className="py-4 px-2">Price</th>
                            <th className="py-4 px-2">Status</th>
                            <th className="py-4 px-2">Stock Qty</th>
                            <th className="py-4 px-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {sellerProducts.map((prod) => (
                            <tr key={prod._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                              <td className="py-4 px-2 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-100 flex-shrink-0">
                                  <img 
                                    src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=120'} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{prod.title}</span>
                              </td>
                              <td className="py-4 px-2 text-slate-500 font-mono">{prod.sku}</td>
                              <td className="py-4 px-2 font-semibold">₹{prod.price?.toLocaleString('en-IN')}</td>
                              <td className="py-4 px-2">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  prod.status === 'approved' 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                                    : prod.status === 'pending'
                                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600'
                                      : 'bg-red-50 dark:bg-red-950/40 text-red-600'
                                }`}>
                                  {prod.status}
                                </span>
                              </td>
                              <td className="py-4 px-2">
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    min="0"
                                    value={editingStock[prod._id] !== undefined ? editingStock[prod._id] : (prod.inventory?.quantity || 0)}
                                    onChange={(e) => setEditingStock({
                                      ...editingStock,
                                      [prod._id]: e.target.value
                                    })}
                                    className="w-16 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-2.5 py-1.5 rounded-lg text-xs outline-none text-center font-bold dark:text-slate-200"
                                  />
                                  <button
                                    onClick={() => handleUpdateStock(prod._id)}
                                    className="bg-secondary text-white p-1.5 rounded-lg hover:bg-cyan-600 transition"
                                    title="Update Stock Quantity"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-2 text-right">
                                <button
                                  onClick={() => handleDeleteProduct(prod._id)}
                                  className="bg-rose-500 text-white p-2 rounded-xl hover:bg-rose-600 transition inline-flex items-center"
                                  title="Delete Listing"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'add-product' && (
                /* Single Product Creation Form */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center">
                    <span>Add Catalog Listing</span>
                    <button 
                      type="button"
                      onClick={() => {
                        refetchCategories();
                        refetchBrands();
                      }}
                      className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh Options
                    </button>
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
                                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Product Images</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* File Upload Box */}
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-secondary dark:hover:border-secondary rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition relative group bg-slate-50 dark:bg-slate-900/50">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={uploadingImage}
                          />
                          <UploadCloud className={`w-8 h-8 ${uploadingImage ? 'text-secondary animate-bounce' : 'text-slate-400 group-hover:text-secondary'} transition mb-2`} />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {uploadingImage ? 'Uploading image...' : 'Choose image or drag here'}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">PNG, JPG, JPEG up to 5MB</span>
                        </div>

                        {/* Manual URL Input */}
                        <div className="flex flex-col justify-between p-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Add Image URL Manually</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Paste image URL here..."
                                value={manualImageUrl}
                                onChange={(e) => setManualImageUrl(e.target.value)}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3 py-2 rounded-lg text-[11px] outline-none transition dark:text-slate-200"
                              />
                              <button
                                type="button"
                                onClick={handleAddManualImage}
                                className="bg-secondary hover:bg-cyan-600 text-white font-bold px-3 py-2 rounded-lg text-[11px] transition shadow-xs"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-xxs text-slate-400 dark:text-slate-500 font-semibold mt-2">
                            Upload files or enter URLs to build your product image gallery.
                          </div>
                        </div>
                      </div>

                      {/* Grid of added images */}
                      {productImages.length > 0 && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-850/80">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Image Gallery ({productImages.length})</span>
                          <div className="flex flex-wrap gap-3">
                            {productImages.map((imgUrl, idx) => (
                              <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-950 flex-shrink-0 group">
                                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setProductImages(prev => prev.filter((_, i) => i !== idx))}
                                  className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition shadow-xs z-20"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}          </div>
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

              {activeTab === 'wallet' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                  <h3 className="font-extrabold text-base text-black dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-secondary" /> Store Wallet
                    </span>
                    <button 
                      onClick={() => refetchWallet()}
                      className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Balance Card */}
                    <div className="md:col-span-1 bg-gradient-to-br from-secondary to-cyan-600 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between min-h-[160px]">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Store Balance</p>
                        <h4 className="text-3xl font-black mt-2">₹{wallet.balance}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold opacity-90 bg-white/10 px-3 py-1.5 rounded-xl w-max">
                        <ShieldCheck className="w-3.5 h-3.5" /> Secure Merchant Wallet
                      </div>
                    </div>

                    {/* Stats Info */}
                    <div className="md:col-span-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl p-6 flex flex-col justify-center space-y-3">
                      <h5 className="font-bold text-xs text-black dark:text-white">Merchant Wallet Info</h5>
                      <p className="text-xxs text-slate-450 leading-relaxed">
                        This wallet displays your store referral credits and earnings. Platform sales revenue shares are periodically settled directly to your connected bank account:
                      </p>
                      <div className="text-[10px] text-slate-400 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
                        <div><strong>Account:</strong> {sellerProfile?.bankDetails?.accountHolderName || 'N/A'}</div>
                        <div><strong>Bank:</strong> {sellerProfile?.bankDetails?.bankName || 'N/A'} ({sellerProfile?.bankDetails?.accountNumber || 'N/A'})</div>
                      </div>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="space-y-4 pt-4">
                    <h4 className="font-extrabold text-sm text-black dark:text-white">
                      Store Wallet Ledger
                    </h4>

                    {walletLoading ? (
                      <p className="text-xxs text-slate-455 animate-pulse">Loading store wallet ledger...</p>
                    ) : !wallet.transactions || wallet.transactions.length === 0 ? (
                      <p className="text-xxs text-slate-455 italic py-4">No wallet transactions logged.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-black dark:text-white">
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Description</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wallet.transactions.map((tx, idx) => {
                              const isCredit = tx.type === 'credit';
                              return (
                                <tr key={idx} className="border-b border-slate-50 dark:border-slate-850 text-xxs text-slate-650 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-all">
                                  <td className="px-4 py-3 text-[10px] text-slate-450">
                                    {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-4 py-3 font-semibold">{tx.description}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      isCredit 
                                        ? 'bg-emerald-55/10 text-emerald-500 border border-emerald-100/20' 
                                        : 'bg-red-50/10 text-red-500 border border-red-100/20'
                                    }`}>
                                      {tx.type.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-3 text-right font-bold ${isCredit ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isCredit ? '+' : '-'}₹{tx.amount}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                /* Profile Details edit panel inside Seller Dashboard */
                <div className="space-y-6">
                  {/* Personal Details Form */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <User className="w-5 h-5 text-secondary" /> Personal Details
                      </span>
                      <button 
                        type="button"
                        onClick={() => refetchProfile()}
                        className="text-xs text-secondary hover:underline flex items-center gap-1 font-bold"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh Profile
                      </button>
                    </h3>

                    {personalProfileSuccess && (
                      <p className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-xl">
                        Profile updated successfully!
                      </p>
                    )}

                    <form onSubmit={handleUpdatePersonalProfile} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Full Name</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={personalName}
                            onChange={e => setPersonalName(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                          />
                          <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Email Address</label>
                        <div className="relative">
                          <input
                            type="email"
                            value={user?.email}
                            disabled
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none opacity-60 dark:text-slate-200"
                          />
                          <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">Phone Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={personalPhone}
                            onChange={e => setPersonalPhone(e.target.value)}
                            placeholder="Enter phone number"
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                          />
                          <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-secondary hover:bg-cyan-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
                      >
                        Update Profile
                      </button>
                    </form>
                  </div>

                  {/* Company & Store Details Form */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2 mb-4">
                      <Store className="w-5 h-5 text-secondary" /> Company & Store Details
                    </h3>

                    {successMsg && (
                      <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    {errorMsg && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                      <div>
                        <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider mb-4 border-b pb-1">Store Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Store Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Apex Tech Store"
                              {...registerProfile('storeName', { required: 'Store name is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                            {profileErrors.storeName && <p className="text-xxs text-red-500 mt-1">{profileErrors.storeName.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Store Description</label>
                            <input
                              type="text"
                              placeholder="e.g. Premium technology and accessories"
                              {...registerProfile('storeDescription')}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider mb-4 border-b pb-1">Tax & Business Identification</h4>
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
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200 uppercase"
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
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200 uppercase"
                            />
                            {profileErrors.pan && <p className="text-xxs text-red-500 mt-1">{profileErrors.pan.message}</p>}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider mb-4 border-b pb-1">Bank Account Details (For Payouts)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Holder Name</label>
                            <input
                              type="text"
                              placeholder="Full Legal Name"
                              {...registerProfile('bankAccountHolderName', { required: 'Account holder name is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                            {profileErrors.bankAccountHolderName && <p className="text-xxs text-red-500 mt-1">{profileErrors.bankAccountHolderName.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bank Name</label>
                            <input
                              type="text"
                              placeholder="e.g. State Bank of India"
                              {...registerProfile('bankName', { required: 'Bank name is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                            {profileErrors.bankName && <p className="text-xxs text-red-500 mt-1">{profileErrors.bankName.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Number</label>
                            <input
                              type="text"
                              placeholder="Bank Account Number"
                              {...registerProfile('bankAccountNumber', { required: 'Account number is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                            {profileErrors.bankAccountNumber && <p className="text-xxs text-red-500 mt-1">{profileErrors.bankAccountNumber.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">IFSC Code</label>
                            <input
                              type="text"
                              placeholder="11-character IFSC Code"
                              {...registerProfile('bankIfsc', { required: 'IFSC code is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200 uppercase"
                            />
                            {profileErrors.bankIfsc && <p className="text-xxs text-red-500 mt-1">{profileErrors.bankIfsc.message}</p>}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-extrabold text-secondary uppercase tracking-wider mb-4 border-b pb-1">Store Address</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address</label>
                            <input
                              type="text"
                              placeholder="e.g. 101 Corporate Suites"
                              {...registerProfile('street', { required: 'Street is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                            {profileErrors.street && <p className="text-xxs text-red-500 mt-1">{profileErrors.street.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                            <input
                              type="text"
                              placeholder="City"
                              {...registerProfile('city', { required: 'City is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                            {profileErrors.city && <p className="text-xxs text-red-500 mt-1">{profileErrors.city.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                            <input
                              type="text"
                              placeholder="State"
                              {...registerProfile('state', { required: 'State is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                            {profileErrors.state && <p className="text-xxs text-red-500 mt-1">{profileErrors.state.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
                            <input
                              type="text"
                              placeholder="Country"
                              {...registerProfile('country', { required: 'Country is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                            {profileErrors.country && <p className="text-xxs text-red-500 mt-1">{profileErrors.country.message}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Postal Code</label>
                            <input
                              type="text"
                              placeholder="Postal Code"
                              {...registerProfile('postalCode', { required: 'Postal code is required' })}
                              className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
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
                        {profileCreating ? 'Saving Details...' : 'Save Company Details'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'deleteAccount' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                  <h3 className="font-extrabold text-base text-red-600 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" /> Danger Zone: Delete Store Account
                  </h3>

                  <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-5 rounded-2xl text-xs space-y-3 text-slate-655 dark:text-slate-350 leading-relaxed font-semibold">
                    <p className="font-extrabold text-red-700 dark:text-red-400">WARNING: This operation is permanent and irreversible.</p>
                    <p>Deleting your Daykart merchant account will completely erase all details from our servers, including:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-500 font-medium pl-2">
                      <li>Your seller user profile and login credentials.</li>
                      <li>Your entire company registration, GSTIN/PAN info, and store settings.</li>
                      <li>All your products catalog and active storefront listings.</li>
                      <li>Your wallet transaction history.</li>
                    </ul>
                    <p className="font-bold">Once deleted, your store will be closed immediately, active orders will be cancelled, and this action cannot be undone.</p>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="confirmDeleteCheck"
                      checked={deleteCheckboxChecked}
                      onChange={(e) => setDeleteCheckboxChecked(e.target.checked)}
                      className="accent-red-600 h-4.5 w-4.5 rounded cursor-pointer mt-0.5"
                    />
                    <label htmlFor="confirmDeleteCheck" className="text-xxs sm:text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none leading-relaxed">
                      I understand the consequences and confirm that I wish to permanently delete my Daykart merchant account and store catalog.
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={!deleteCheckboxChecked || isDeletingProfile}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-md transition active:scale-98"
                  >
                    {isDeletingProfile ? 'Deleting Store...' : 'Permanently Delete My Merchant Account'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
      />
      <ReasonPromptModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectOrderWithReason}
        title="Reject Store Order"
        message="Are you sure you want to reject this order? Please specify the reason for rejection (required)."
        placeholder="e.g., Product out of stock, delivery location unserviceable..."
        confirmText="Reject Order"
        type="danger"
      />
      <Footer />
    </div>
  );
}

export default function SellerDashboard() {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-sm font-semibold text-slate-500 animate-pulse">Loading Seller Dashboard...</div>
        </main>
        <Footer />
      </div>
    }>
      <SellerDashboardContent />
    </React.Suspense>
  );
}
