'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, Heart, User, Search, LogOut, LayoutDashboard, Sparkles } from 'lucide-react';
import { logoutUser } from '@/store/authSlice';
import { useGetCartQuery, useLogoutMutation } from '@/store/api';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch cart query if user is logged in
  const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [logoutApi] = useLogoutMutation();

  const cartCount = cartData?.data?.cart?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logoutUser());
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Daykart Logo" className="h-8 w-auto rounded-md object-contain" />
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-500 to-orange-500 bg-clip-text text-transparent">
                Daykart
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-800 pl-10 pr-4 py-2 rounded-full border border-transparent focus:border-secondary focus:bg-white outline-none transition-all duration-300 text-sm"
              />
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">

            {/* Wishlist */}
            <Link
              href={isAuthenticated ? "/wishlist" : "/login"}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 relative"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href={isAuthenticated ? "/cart" : "/login"}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 relative"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white font-bold text-xxs w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm border-2 border-secondary shadow-md">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </Link>

                    {user?.role === 'seller' && (
                      <Link
                        href="/seller/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Seller Dashboard
                      </Link>
                    )}

                    {user?.role === 'admin' && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-secondary hover:bg-cyan-600 text-white font-medium px-5 py-1.5 rounded-full shadow-md text-sm transition-all duration-300 transform hover:scale-105"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
