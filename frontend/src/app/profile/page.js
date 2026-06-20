'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin, Plus, Trash2, ShieldCheck, Mail, Phone, AlertTriangle, Store, Ticket } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/store/api';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '@/components/ToastProvider';
import { updateUser } from '@/store/authSlice';

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  isDefault: z.boolean().optional(),
});

const sellerProfileFormSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  storeDescription: z.string().optional(),
  gstin: z.string().min(15, 'GSTIN must be 15 characters').max(15, 'GSTIN must be 15 characters'),
  pan: z.string().min(10, 'PAN must be 10 characters').max(10, 'PAN must be 10 characters'),
  bankDetails: z.object({
    accountNumber: z.string().min(1, 'Account number is required'),
    ifsc: z.string().min(1, 'IFSC is required'),
    bankName: z.string().min(1, 'Bank name is required'),
    accountHolderName: z.string().min(1, 'Account holder name is required'),
  }),
  storeAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
});

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const [addAddressApi] = api.useAddAddressMutation();
  const [removeAddressApi] = api.useRemoveAddressMutation();
  const [updateProfileApi] = api.useUpdateProfileMutation();

  const { data: sellerProfileRes, refetch: refetchSellerProfile } = api.useGetSellerProfileQuery(undefined, {
    skip: !isAuthenticated || user?.role !== 'seller' || !mounted,
  });
  const { data: couponsRes } = api.useGetCouponsQuery({ view: 'customer' }, {
    skip: !isAuthenticated || !['customer', 'seller', 'admin'].includes(user?.role) || !mounted,
  });
  const [updateSellerProfileApi, { isLoading: isSellerUpdating }] = api.useCreateSellerProfileMutation();

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [addressError, setAddressError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [sellerSuccess, setSellerSuccess] = useState(false);
  const [sellerError, setSellerError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const sellerProfile = sellerProfileRes?.data?.seller;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(addressSchema)
  });

  const {
    register: registerSeller,
    handleSubmit: handleSubmitSeller,
    setValue: setSellerValue,
    formState: { errors: sellerErrors },
  } = useForm({
    resolver: zodResolver(sellerProfileFormSchema),
  });

  useEffect(() => {
    if (sellerProfile) {
      setSellerValue('storeName', sellerProfile.storeName || '');
      setSellerValue('storeDescription', sellerProfile.storeDescription || '');
      setSellerValue('gstin', sellerProfile.gstin || '');
      setSellerValue('pan', sellerProfile.pan || '');
      setSellerValue('bankDetails.accountNumber', sellerProfile.bankDetails?.accountNumber || '');
      setSellerValue('bankDetails.ifsc', sellerProfile.bankDetails?.ifsc || '');
      setSellerValue('bankDetails.bankName', sellerProfile.bankDetails?.bankName || '');
      setSellerValue('bankDetails.accountHolderName', sellerProfile.bankDetails?.accountHolderName || '');
      setSellerValue('storeAddress.street', sellerProfile.storeAddress?.street || '');
      setSellerValue('storeAddress.city', sellerProfile.storeAddress?.city || '');
      setSellerValue('storeAddress.state', sellerProfile.storeAddress?.state || '');
      setSellerValue('storeAddress.country', sellerProfile.storeAddress?.country || '');
      setSellerValue('storeAddress.postalCode', sellerProfile.storeAddress?.postalCode || '');
    }
  }, [sellerProfile, setSellerValue]);

  const handleUpdateSellerProfile = async (data) => {
    setSellerSuccess(false);
    setSellerError('');
    try {
      await updateSellerProfileApi(data).unwrap();
      showToast('Seller profile updated successfully!', 'success');
      setSellerSuccess(true);
      refetchSellerProfile();
    } catch (err) {
      showToast(err.data?.message || 'Failed to update seller profile.', 'error');
      setSellerError(err.data?.message || 'Failed to update seller profile.');
    }
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);
    try {
      const res = await updateProfileApi({ name, phoneNumber }).unwrap();
      dispatch(updateUser(res.data.user));
      showToast('Profile updated successfully!', 'success');
      setProfileSuccess(true);
    } catch (err) {
      showToast('Failed to update profile.', 'error');
    }
  };

  const handleAddAddress = async (data) => {
    try {
      setAddressError('');
      const res = await addAddressApi(data).unwrap();
      dispatch(updateUser({ addresses: res.data.addresses }));
      showToast('Address added successfully!', 'success');
      reset();
    } catch (err) {
      showToast(err.data?.message || 'Failed to save address.', 'error');
      setAddressError(err.data?.message || 'Failed to save address.');
    }
  };

  const handleRemoveAddress = async (addressId) => {
    try {
      const res = await removeAddressApi(addressId).unwrap();
      dispatch(updateUser({ addresses: res.data.addresses }));
      showToast('Address deleted successfully!', 'success');
    } catch (err) {
      showToast('Failed to delete address.', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Tabs */}
          <div className="space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'profile'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-4.5 h-4.5" /> Profile Details
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === 'addresses'
                  ? 'bg-secondary text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4.5 h-4.5" /> Shipping Addresses
            </button>
            {['customer', 'seller', 'admin'].includes(user?.role) && (
              <button
                onClick={() => setActiveTab('coupons')}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'coupons'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Ticket className="w-4.5 h-4.5" /> My Coupons
              </button>
            )}
            {user?.role === 'seller' && (
              <button
                onClick={() => setActiveTab('company')}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'company'
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Store className="w-4.5 h-4.5" /> Company Details
              </button>
            )}
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'profile' && (
              /* Profile details */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-secondary" /> Personal Details
                </h3>

                {profileSuccess && (
                  <p className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-xl">
                    Profile updated successfully!
                  </p>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                      Email Address
                    </label>
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
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
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
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                {/* Address list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-secondary" /> Shipping Addresses
                  </h3>

                  {user?.addresses?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No addresses saved yet. Use the form below to add your first address.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {user?.addresses?.map(addr => (
                        <div
                          key={addr._id}
                          className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-start"
                        >
                          <div className="text-xs space-y-1">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">
                              {addr.street}, {addr.city}
                            </span>
                            <p className="text-slate-500">{addr.state}, {addr.country} - {addr.postalCode}</p>
                            {addr.isDefault && (
                              <span className="inline-block bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 font-extrabold text-xxs px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 mt-2">
                                Default Address
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveAddress(addr._id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Address Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5 text-secondary" /> Add New Address
                  </h3>

                  {addressError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{addressError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(handleAddAddress)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Street Address</label>
                      <input
                        type="text"
                        placeholder="123 Shopping Lane"
                        {...register('street')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.street && <p className="text-xxs text-red-500 mt-1">{errors.street.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">City</label>
                      <input
                        type="text"
                        placeholder="Mumbai"
                        {...register('city')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.city && <p className="text-xxs text-red-500 mt-1">{errors.city.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">State</label>
                      <input
                        type="text"
                        placeholder="Maharashtra"
                        {...register('state')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.state && <p className="text-xxs text-red-500 mt-1">{errors.state.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Country</label>
                      <input
                        type="text"
                        placeholder="India"
                        {...register('country')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.country && <p className="text-xxs text-red-500 mt-1">{errors.country.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Postal Code</label>
                      <input
                        type="text"
                        placeholder="400001"
                        {...register('postalCode')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {errors.postalCode && <p className="text-xxs text-red-500 mt-1">{errors.postalCode.message}</p>}
                    </div>

                    <div className="flex items-center gap-2 md:mt-6">
                      <input
                        type="checkbox"
                        id="isDefault"
                        {...register('isDefault')}
                        className="accent-secondary h-4 w-4"
                      />
                      <label htmlFor="isDefault" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Set as default shipping address</label>
                    </div>

                    <button
                      type="submit"
                      className="w-full md:col-span-2 inline-flex items-center justify-center gap-1.5 bg-secondary hover:bg-cyan-600 text-white font-bold py-3 rounded-xl text-xs shadow-md mt-2 transition"
                    >
                      <ShieldCheck className="w-4 h-4" /> Save Address Details
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'company' && user?.role === 'seller' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2 mb-4">
                  <Store className="w-5 h-5 text-secondary" /> Company & Store Details
                </h3>

                {sellerSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>Company profile updated successfully!</span>
                  </div>
                )}

                {sellerError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{sellerError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitSeller(handleUpdateSellerProfile)} className="space-y-6">
                  {/* General Store info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Store Name</label>
                      <input
                        type="text"
                        {...registerSeller('storeName')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {sellerErrors.storeName && <p className="text-xxs text-red-500 mt-1">{sellerErrors.storeName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Store Description</label>
                      <input
                        type="text"
                        {...registerSeller('storeDescription')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {sellerErrors.storeDescription && <p className="text-xxs text-red-500 mt-1">{sellerErrors.storeDescription.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">GSTIN</label>
                      <input
                        type="text"
                        placeholder="15-character GSTIN"
                        {...registerSeller('gstin')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {sellerErrors.gstin && <p className="text-xxs text-red-500 mt-1">{sellerErrors.gstin.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">PAN Card Number</label>
                      <input
                        type="text"
                        placeholder="10-character PAN"
                        {...registerSeller('pan')}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                      />
                      {sellerErrors.pan && <p className="text-xxs text-red-500 mt-1">{sellerErrors.pan.message}</p>}
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">Bank Payout Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Account Holder Name</label>
                        <input
                          type="text"
                          {...registerSeller('bankDetails.accountHolderName')}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                        {sellerErrors.bankDetails?.accountHolderName && <p className="text-xxs text-red-500 mt-1">{sellerErrors.bankDetails.accountHolderName.message}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Bank Name</label>
                        <input
                          type="text"
                          {...registerSeller('bankDetails.bankName')}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                        {sellerErrors.bankDetails?.bankName && <p className="text-xxs text-red-500 mt-1">{sellerErrors.bankDetails.bankName.message}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Account Number</label>
                        <input
                          type="text"
                          {...registerSeller('bankDetails.accountNumber')}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                        {sellerErrors.bankDetails?.accountNumber && <p className="text-xxs text-red-500 mt-1">{sellerErrors.bankDetails.accountNumber.message}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">IFSC Code</label>
                        <input
                          type="text"
                          {...registerSeller('bankDetails.ifsc')}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                        {sellerErrors.bankDetails?.ifsc && <p className="text-xxs text-red-500 mt-1">{sellerErrors.bankDetails.ifsc.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Store Address */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">Registered Office Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Street Address</label>
                        <input
                          type="text"
                          {...registerSeller('storeAddress.street')}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                        {sellerErrors.storeAddress?.street && <p className="text-xxs text-red-500 mt-1">{sellerErrors.storeAddress.street.message}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">City</label>
                        <input
                          type="text"
                          {...registerSeller('storeAddress.city')}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                        {sellerErrors.storeAddress?.city && <p className="text-xxs text-red-500 mt-1">{sellerErrors.storeAddress.city.message}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">State</label>
                        <input
                          type="text"
                          {...registerSeller('storeAddress.state')}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                        {sellerErrors.storeAddress?.state && <p className="text-xxs text-red-500 mt-1">{sellerErrors.storeAddress.state.message}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Country</label>
                        <input
                          type="text"
                          {...registerSeller('storeAddress.country')}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                        {sellerErrors.storeAddress?.country && <p className="text-xxs text-red-500 mt-1">{sellerErrors.storeAddress.country.message}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Postal Code</label>
                        <input
                          type="text"
                          {...registerSeller('storeAddress.postalCode')}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                        />
                        {sellerErrors.storeAddress?.postalCode && <p className="text-xxs text-red-500 mt-1">{sellerErrors.storeAddress.postalCode.message}</p>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSellerUpdating}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-secondary hover:bg-cyan-600 text-white font-bold py-3 rounded-xl text-xs shadow-md transition"
                  >
                    <ShieldCheck className="w-4 h-4" /> {isSellerUpdating ? 'Saving details...' : 'Save Company Details'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'coupons' && ['customer', 'seller', 'admin'].includes(user?.role) && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-secondary" /> My Coupons
                </h3>

                <p className="text-xs text-slate-500">
                  Here are your available discount coupons. Apply these coupon codes at checkout to receive discounts on your orders.
                </p>

                {!couponsRes?.data?.coupons || couponsRes.data.coupons.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-400 italic">No coupons available at the moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {couponsRes.data.coupons.map((coupon) => {
                      const isExpired = new Date(coupon.endDate) < new Date();
                      const isFirstN = coupon.firstNOrders > 0;
                      return (
                        <div
                          key={coupon._id}
                          className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-secondary transition bg-slate-50/55 dark:bg-slate-900/30 flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="bg-cyan-100 dark:bg-cyan-950 text-secondary dark:text-cyan-400 text-xxs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                              </span>
                              {coupon.isRandomPool && (
                                <span className="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xxs font-bold px-2 py-0.5 rounded-full">
                                  🎁 Surprise
                                </span>
                              )}
                            </div>

                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                              {coupon.code}
                            </h4>
                            <p className="text-xxs text-slate-500 leading-relaxed">
                              {coupon.description || 'No description provided.'}
                            </p>
                            
                            <div className="space-y-1 pt-2 text-[10px] text-slate-400">
                              <div>Min Order Value: ₹{coupon.minOrderValue}</div>
                              {isFirstN && (
                                <div className="text-secondary font-semibold">
                                  Valid for first {coupon.firstNOrders} order(s) only
                                </div>
                              )}
                              <div>Expires: {new Date(coupon.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(coupon.code);
                                showToast(`Code "${coupon.code}" copied to clipboard!`, 'success');
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xxs transition active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              Copy Code
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
