'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin, Plus, Trash2, ShieldCheck, Mail, Phone, AlertTriangle, Store, Ticket, Wallet, Gift, Copy, Check, ChevronDown, MessageSquare, Send, Clock, CheckCircle2, RefreshCw, Truck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConfirmationModal from '@/components/ConfirmationModal';
import { api } from '@/store/api';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '@/components/ToastProvider';
import { updateUser, logoutUser } from '@/store/authSlice';

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
      setNotificationsEnabled(user.notificationsEnabled !== false);
    }
  }, [user]);

  const [addAddressApi] = api.useAddAddressMutation();
  const [removeAddressApi] = api.useRemoveAddressMutation();
  const [updateProfileApi] = api.useUpdateProfileMutation();

  const { data: profileRes } = api.useGetProfileQuery(undefined, {
    skip: !isAuthenticated || !mounted,
  });

  useEffect(() => {
    if (profileRes?.data?.user) {
      dispatch(updateUser(profileRes.data.user));
    }
  }, [profileRes, dispatch]);

  const { data: sellerProfileRes, refetch: refetchSellerProfile } = api.useGetSellerProfileQuery(undefined, {
    skip: !isAuthenticated || user?.role !== 'seller' || !mounted,
  });
  const { data: couponsRes } = api.useGetCouponsQuery({ view: 'customer' }, {
    skip: !isAuthenticated || !['customer', 'seller', 'admin'].includes(user?.role) || !mounted,
  });
  const [updateSellerProfileApi, { isLoading: isSellerUpdating }] = api.useCreateSellerProfileMutation();

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled !== false);
  const [addressError, setAddressError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [sellerSuccess, setSellerSuccess] = useState(false);
  const [sellerError, setSellerError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);

  const { data: walletRes, isLoading: walletLoading } = api.useGetWalletQuery(undefined, {
    skip: activeTab !== 'wallet' || !isAuthenticated || !mounted
  });
  const wallet = walletRes?.data?.wallet || { balance: 0, transactions: [] };

  const [copied, setCopied] = useState(false);
  const handleCopyCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      showToast('Referral code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  // Support Tickets state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [selectedTicketId, setSelectedTicketId] = useState('new');
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');
  const [ticketError, setTicketError] = useState('');

  // Support Tickets API queries/mutations
  const { data: ticketsRes, refetch: refetchTickets, isLoading: ticketsLoading } = api.useGetMyTicketsQuery(undefined, {
    skip: activeTab !== 'tickets' || !isAuthenticated || !mounted,
  });
  const [createTicketApi, { isLoading: isCreatingTicket }] = api.useCreateTicketMutation();
  const [replyTicketApi, { isLoading: isReplyingTicket }] = api.useReplyTicketMutation();
  const [resolveTicketApi] = api.useResolveTicketMutation();

  const ticketsList = ticketsRes?.data?.tickets || [];
  const selectedTicket = ticketsList.find(t => t._id === selectedTicketId);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setTicketSuccess('');
    setTicketError('');
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      setTicketError('Please enter both subject and details for your ticket.');
      return;
    }
    try {
      await createTicketApi({
        subject: ticketSubject.trim(),
        description: ticketDescription.trim(),
        priority: ticketPriority,
      }).unwrap();
      setTicketSuccess('Support ticket submitted successfully!');
      setTicketSubject('');
      setTicketDescription('');
      setTicketPriority('medium');
      refetchTickets();
      setTimeout(() => {
        setSelectedTicketId(null);
        setTicketSuccess('');
      }, 3000);
    } catch (err) {
      setTicketError(err.data?.message || 'Failed to submit support ticket.');
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!ticketReplyText.trim()) return;
    try {
      await replyTicketApi({
        id: selectedTicketId,
        text: ticketReplyText.trim(),
      }).unwrap();
      setTicketReplyText('');
      refetchTickets();
      showToast('Reply sent successfully.', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to send reply.', 'error');
    }
  };

  const handleResolveTicket = async () => {
    try {
      await resolveTicketApi(selectedTicketId).unwrap();
      refetchTickets();
      showToast('Ticket marked resolved successfully.', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to resolve ticket.', 'error');
    }
  };

  // Account Deletion state & mutations
  const [deleteProfileApi, { isLoading: isDeletingProfile }] = api.useDeleteProfileMutation();
  const [deleteCheckboxChecked, setDeleteCheckboxChecked] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    type: 'danger',
    onConfirm: () => {},
  });

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

  const handleDeleteAccount = () => {
    triggerConfirmation({
      title: 'Permanently Delete Your Account?',
      message: 'Are you absolutely sure you want to delete your Daykart account? This action is completely permanent and cannot be undone. All your personal details, order history, addresses, and credits will be erased forever.',
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        try {
          await deleteProfileApi().unwrap();
          showToast('Your account was deleted successfully.', 'success');
          dispatch(logoutUser());
          router.push('/register');
        } catch (err) {
          showToast(err.data?.message || 'Failed to delete account.', 'error');
        }
      }
    });
  };

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
      const res = await updateProfileApi({ name, phoneNumber, notificationsEnabled }).unwrap();
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

  const tabConfig = {
    profile: { name: 'Profile Details', icon: User },
    addresses: { name: 'Shipping Addresses', icon: MapPin },
    coupons: { name: 'My Coupons', icon: Ticket },
    company: { name: 'Company Details', icon: Store },
    wallet: { name: 'My Wallet', icon: Wallet },
    referrals: { name: 'Referral Program', icon: Gift },
    tickets: { name: 'Support Tickets', icon: MessageSquare },
    deleteAccount: { name: 'Delete Account', icon: Trash2 }
  };

  const getActiveTabs = () => {
    const keys = ['profile'];
    if (user?.role === 'customer') {
      keys.push('addresses', 'coupons', 'wallet', 'referrals', 'tickets');
    } else if (user?.role === 'seller') {
      keys.push('company', 'wallet', 'referrals');
    } else if (user?.role === 'admin') {
      keys.push('wallet', 'referrals');
    }
    keys.push('deleteAccount');
    return keys.map(key => ({ key, ...tabConfig[key] }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Mobile/Tablet Tab Dropdown Selector */}
          <div className="lg:hidden w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <label className="block text-xxs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Select Account Section
            </label>
            <div className="relative">
              <button
                onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none focus:border-secondary transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {tabConfig[activeTab] && React.createElement(tabConfig[activeTab].icon, { className: "w-4.5 h-4.5 text-secondary" })}
                  <span>{tabConfig[activeTab]?.name}</span>
                </div>
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
                    {getActiveTabs().map(({ key, name, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => {
                          setActiveTab(key);
                          setIsTabDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 ${
                          activeTab === key
                            ? 'bg-secondary text-white'
                            : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${activeTab === key ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Desktop Sidebar Tabs */}
          <div className="hidden lg:flex lg:flex-col space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            {getActiveTabs().map(({ key, name, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-auto lg:w-full shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition select-none whitespace-nowrap ${
                  activeTab === key
                    ? 'bg-secondary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4.5 h-4.5" /> {name}
              </button>
            ))}
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

                {user?.deliveryStatus === 'pending' && (
                  <div className="p-4 bg-cyan-50 dark:bg-cyan-955/10 border border-cyan-100 dark:border-cyan-900/40 rounded-2xl text-xs flex items-center gap-3">
                    <Truck className="w-5 h-5 text-secondary flex-shrink-0 animate-bounce" />
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200">Delivery Partner Application Pending</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Your application to register as a delivery courier is currently under review by our administration team. You can continue shopping as a customer in the meantime.</p>
                    </div>
                  </div>
                )}

                {user?.deliveryStatus === 'rejected' && (
                  <div className="p-4 bg-red-50 dark:bg-red-955/10 border border-red-100 dark:border-red-900/40 rounded-2xl text-xs flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200">Delivery Application Rejected</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Your application to register as a delivery courier was rejected by the administrator. Please contact our support team if you believe this was an error.</p>
                    </div>
                  </div>
                )}

                {user?.deliveryStatus === 'approved' && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-xs flex items-center gap-3">
                    <Truck className="w-5 h-5 text-emerald-500 flex-shrink-0 animate-pulse" />
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200">Delivery Partner Application Approved!</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Welcome to Daykart's courier network. You can access the Delivery Portal at any time to accept pick ups and deliver orders.</p>
                      <a
                        href="/delivery/dashboard"
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-2 hover:underline"
                      >
                        Go to Delivery Dashboard &rarr;
                      </a>
                    </div>
                  </div>
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

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl select-none">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Real-Time Alerts</h4>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">Receive immediate push alerts on order updates and ticket replies.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 cursor-pointer ${
                        notificationsEnabled ? 'bg-secondary' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-250 shadow-sm ${
                        notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
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

            {activeTab === 'wallet' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-black dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-secondary" /> My Wallet
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Balance Card */}
                  <div className="md:col-span-1 bg-gradient-to-br from-secondary to-cyan-600 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between min-h-[160px]">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Available Balance</p>
                      <h4 className="text-3xl font-black mt-2">₹{wallet.balance}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold opacity-90 bg-white/10 px-3 py-1.5 rounded-xl w-max">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Secured Wallet
                    </div>
                  </div>

                  {/* Quick stats or info */}
                  <div className="md:col-span-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl p-6 flex flex-col justify-center space-y-3">
                    <h5 className="font-bold text-xs text-black dark:text-white">Wallet Information</h5>
                    <ul className="text-xxs text-slate-400 space-y-2 list-disc list-inside">
                      <li>Use referral rewards to automatically top up your balance.</li>
                      <li>Credits inside your wallet can be viewed by all roles (customer, seller, admin).</li>
                      <li>Contact customer support if you experience any transaction issues.</li>
                    </ul>
                  </div>
                </div>

                {/* Transactions Log */}
                <div className="space-y-4 pt-4">
                  <h4 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-1.5">
                    Transaction History
                  </h4>

                  {walletLoading ? (
                    <p className="text-xxs text-slate-400 animate-pulse">Loading wallet transactions...</p>
                  ) : !wallet.transactions || wallet.transactions.length === 0 ? (
                    <p className="text-xxs text-slate-450 italic py-4">No wallet transactions recorded yet.</p>
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
                                <td className="px-4 py-3 text-[10px] text-slate-400">
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

            {activeTab === 'referrals' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-black dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-secondary" /> Referral Program
                </h3>

                <p className="text-xs text-slate-500">
                  Invite your friends to join Daykart! Share your unique referral code. When a friend registers and verifies their account, a referral bonus will be credited to your wallet.
                </p>

                <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h4 className="font-extrabold text-xs text-black dark:text-white uppercase tracking-wide">Your Referral Code</h4>
                    <p className="text-[10px] text-slate-455 mt-1">Copy this code and share it with your friends.</p>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-5 py-3 rounded-2xl font-mono text-sm font-black tracking-wider text-slate-800 dark:text-white select-all">
                      {user?.referralCode || 'GENERATING...'}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="bg-secondary hover:bg-cyan-600 text-white font-bold p-3 rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center"
                      title="Copy Code"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                  <h4 className="font-bold text-xs text-black dark:text-white">Invite History & Stats</h4>
                  <p className="text-xxs text-slate-455">
                    You can view the bonuses credited under your <span className="text-secondary font-bold cursor-pointer" onClick={() => setActiveTab('wallet')}>My Wallet</span> transactions. Invite friends via SMS, email, or social media!
                  </p>
                </div>
              </div>
            )}
                   {activeTab === 'tickets' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header card with Title and Refresh Button */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-black dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-secondary" /> Support Tickets
                    </h3>
                    <p className="text-xxs text-slate-400 mt-1">Submit inquiries and chat with our customer support team directly.</p>
                  </div>
                  <button
                    onClick={() => refetchTickets()}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-250 rounded-xl transition-all"
                    title="Refresh Tickets"
                  >
                    <RefreshCw className="w-4 h-4 animate-hover-spin" />
                  </button>
                </div>

                {/* Side-by-Side Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Left Column: Tickets List */}
                  <div className={`${selectedTicketId ? 'hidden lg:block' : 'block'} lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4`}>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="font-extrabold text-xs uppercase text-slate-655 dark:text-slate-455 tracking-wider">Your Inquiries</h4>
                      <button
                        onClick={() => {
                          setSelectedTicketId('new');
                          setTicketSuccess('');
                          setTicketError('');
                        }}
                        className="bg-secondary hover:bg-cyan-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition shadow-xs active:scale-95"
                      >
                        New Ticket
                      </button>
                    </div>

                    {ticketsLoading ? (
                      <p className="text-xxs text-slate-400 animate-pulse py-4">Loading active tickets...</p>
                    ) : ticketsList.length === 0 ? (
                      <p className="text-xxs text-slate-450 italic py-6">No support tickets opened yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                        {ticketsList.map((ticket) => (
                          <div
                            key={ticket._id}
                            onClick={() => {
                              setSelectedTicketId(ticket._id);
                              setTicketSuccess('');
                              setTicketError('');
                            }}
                            className={`p-3.5 border rounded-2xl cursor-pointer transition flex justify-between items-center gap-3 ${
                              selectedTicketId === ticket._id
                                ? 'border-secondary bg-cyan-50/10 dark:bg-cyan-950/5'
                                : 'border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-855/10'
                            }`}
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase ${
                                  ticket.status === 'resolved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {ticket.status === 'in_progress' ? 'In Progress' : ticket.status}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border ${
                                  ticket.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-655 border-transparent'
                                }`}>{ticket.priority}</span>
                              </div>
                              <h5 className="font-extrabold text-xs text-slate-855 dark:text-slate-200 truncate mt-1">{ticket.subject}</h5>
                              <p className="text-[10px] text-slate-400 truncate">{new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                            </div>
                            <div className="text-right flex-shrink-0 flex items-center justify-center p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <span className="text-[9px] font-bold text-slate-400">{ticket.messages?.length || 1} msgs</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Chat/Creation form */}
                  <div className={`${!selectedTicketId ? 'hidden lg:block' : 'block'} lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm`}>
                    {selectedTicketId && selectedTicketId !== 'new' ? (
                      /* Ticket Thread View */
                      <div className="space-y-6 animate-fade-in">
                        {/* Back button on mobile */}
                        <button
                          onClick={() => setSelectedTicketId(null)}
                          className="lg:hidden text-xs text-secondary font-bold flex items-center gap-1 mb-2 hover:underline animate-fade-in"
                        >
                          &larr; Back to Inquiries
                        </button>
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/40">
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                              selectedTicket?.status === 'resolved' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {selectedTicket?.status === 'in_progress' ? 'In Progress' : selectedTicket?.status}
                            </span>
                            <h4 className="font-extrabold text-xs text-slate-850 dark:text-slate-200 mt-1">{selectedTicket?.subject}</h4>
                          </div>
                          {selectedTicket?.status !== 'resolved' && (
                            <button
                              onClick={handleResolveTicket}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xxs shadow-sm transition active:scale-95"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>

                        {/* Messages Log */}
                        <div className="space-y-4 max-h-[300px] overflow-y-auto p-4 border border-slate-100 dark:border-slate-850 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 scrollbar-thin">
                          {selectedTicket?.messages?.map((msg, idx) => {
                            const isAdminSender = msg.sender !== user?._id;
                            return (
                              <div key={idx} className={`flex flex-col ${isAdminSender ? 'items-start' : 'items-end'}`}>
                                <div className={`p-3.5 rounded-2xl max-w-[85%] text-[11px] leading-relaxed font-medium shadow-xs ${
                                  isAdminSender 
                                    ? 'bg-slate-150 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/20' 
                                    : 'bg-secondary text-white rounded-tr-none'
                                }`}>
                                  <p className="whitespace-pre-wrap">{msg.text}</p>
                                  <span className={`block text-[9px] mt-1 opacity-70 ${isAdminSender ? 'text-slate-400' : 'text-cyan-100'}`}>
                                    {isAdminSender ? 'Support Team' : 'You'} &middot; {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Reply Form */}
                        {selectedTicket?.status !== 'resolved' ? (
                          <form onSubmit={handleReplyTicket} className="flex gap-2">
                            <textarea
                              placeholder="Type your response to support team..."
                              value={ticketReplyText}
                              onChange={(e) => setTicketReplyText(e.target.value)}
                              rows={2}
                              className="flex-1 bg-slate-100 dark:bg-slate-855 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-2xl text-xs outline-none transition resize-none dark:text-slate-200"
                            />
                            <button
                              type="submit"
                              disabled={isReplyingTicket || !ticketReplyText.trim()}
                              className="bg-secondary hover:bg-cyan-600 disabled:opacity-50 text-white font-bold p-3.5 rounded-2xl transition active:scale-95 flex items-center justify-center self-end shadow-md"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </form>
                        ) : (
                          <p className="text-xxs text-slate-400 text-center py-2 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50">This support ticket is closed and resolved.</p>
                        )}
                      </div>
                    ) : (
                      /* Ticket Submission Form */
                      <div className="space-y-4 animate-fade-in">
                        {/* Back button on mobile */}
                        <button
                          onClick={() => setSelectedTicketId(null)}
                          className="lg:hidden text-xs text-secondary font-bold flex items-center gap-1 mb-2 hover:underline animate-fade-in"
                        >
                          &larr; Back to Inquiries
                        </button>
                        <h4 className="font-extrabold text-xs uppercase text-slate-655 dark:text-slate-450 tracking-wider">Submit Support Inquiry</h4>
                        {ticketSuccess && <p className="text-xxs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-xl">{ticketSuccess}</p>}
                        {ticketError && <p className="text-xxs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-2.5 rounded-xl">{ticketError}</p>}
                        
                        <form onSubmit={handleCreateTicket} className="space-y-3.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
                            <input
                              type="text"
                              value={ticketSubject}
                              onChange={(e) => setTicketSubject(e.target.value)}
                              placeholder="e.g. Refund issue"
                              className="w-full bg-slate-100 dark:bg-slate-850 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                            <select
                              value={ticketPriority}
                              onChange={(e) => setTicketPriority(e.target.value)}
                              className="w-full bg-slate-100 dark:bg-slate-850 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inquiry Details</label>
                            <textarea
                              value={ticketDescription}
                              onChange={(e) => setTicketDescription(e.target.value)}
                              rows={4}
                              placeholder="Describe your issue in detail..."
                              className="w-full bg-slate-100 dark:bg-slate-850 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none transition resize-none dark:text-slate-200"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isCreatingTicket}
                            className="w-full bg-secondary hover:bg-cyan-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xxs transition shadow-sm"
                          >
                            {isCreatingTicket ? 'Submitting...' : 'Submit Ticket'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deleteAccount' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-red-600 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" /> Danger Zone: Delete Account
                </h3>

                <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-5 rounded-2xl text-xs space-y-3 text-slate-655 dark:text-slate-350 leading-relaxed font-semibold">
                  <p className="font-extrabold text-red-700 dark:text-red-400">WARNING: This operation is permanent and irreversible.</p>
                  <p>Deleting your Daykart account will completely erase all your details from our servers, including:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 font-medium pl-2">
                    <li>Your profile details and credentials.</li>
                    <li>All saved shipping and billing addresses.</li>
                    <li>Your transaction logs and wallet credit balance (₹{wallet.balance}).</li>
                    {user?.role === 'seller' && (
                      <li className="text-red-600 font-semibold">Your store profile and all product catalog listings.</li>
                    )}
                  </ul>
                  <p className="font-bold">Once deleted, your account cannot be recovered. Any outstanding order history will be deleted, and you will be logged out immediately.</p>
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
                    I understand the consequences and confirm that I wish to permanently delete my Daykart account.
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={!deleteCheckboxChecked || isDeletingProfile}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-md transition active:scale-98"
                >
                  {isDeletingProfile ? 'Deleting Account...' : 'Permanently Delete My Account'}
                </button>
              </div>
            )}
          </div>
        </div>
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

      <Footer />
    </div>
  );
}
