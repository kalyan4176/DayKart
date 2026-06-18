'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin, Plus, Trash2, ShieldCheck, Mail, Phone, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/store/api';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '@/store/authSlice';

const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  isDefault: z.boolean().optional(),
});

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const [addAddressApi] = api.useAddAddressMutation();
  const [removeAddressApi] = api.useRemoveAddressMutation();
  const [updateProfileApi] = api.useUpdateProfileMutation();

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [addressError, setAddressError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(addressSchema)
  });

  if (!isAuthenticated) {
    return null;
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);
    try {
      const res = await updateProfileApi({ name, phoneNumber }).unwrap();
      dispatch(updateUser(res.data.user));
      setProfileSuccess(true);
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  const handleAddAddress = async (data) => {
    try {
      setAddressError('');
      const res = await addAddressApi(data).unwrap();
      dispatch(updateUser({ addresses: res.data.addresses }));
      reset();
    } catch (err) {
      setAddressError(err.data?.message || 'Failed to save address.');
    }
  };

  const handleRemoveAddress = async (addressId) => {
    try {
      const res = await removeAddressApi(addressId).unwrap();
      dispatch(updateUser({ addresses: res.data.addresses }));
    } catch (err) {
      alert('Failed to delete address.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Profile details */}
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

          {/* Address book details */}
          <div className="lg:col-span-2 space-y-6">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
