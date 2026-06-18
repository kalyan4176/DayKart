'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, Heart, User, Search, LogOut, LayoutDashboard, Sparkles, Menu, X, ChevronRight } from 'lucide-react';
import { logoutUser } from '@/store/authSlice';
import { useGetCartQuery, useLogoutMutation } from '@/store/api';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        {/* Main Row */}
        <div className="flex items-center justify-between h-14 lg:h-14 gap-2 sm:gap-4">
          {/* Left Side: Hamburg Menu, Logo, and Categories */}
          <div className="flex items-center gap-1.5 lg:gap-6 flex-shrink-0">
            {/* Mobile hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 text-slate-600 hover:text-secondary hover:bg-slate-100 rounded-full transition-all"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo Link */}
            <Link href="/" className="flex items-center gap-1.5" onClick={() => setMobileMenuOpen(false)}>
              <img src="/logo.png" alt="Daykart Logo" className="hidden lg:block lg:h-7 w-auto rounded-md object-contain" />
              <span className="text-base sm:text-lg lg:text-xl font-black bg-gradient-to-r from-cyan-500 to-orange-500 bg-clip-text text-transparent">
                Daykart
              </span>
            </Link>

            {/* Desktop Categories (visible on lg screens and above) */}
            <div className="hidden lg:flex items-center gap-4 lg:gap-6 text-xs lg:text-xs font-bold text-slate-600">
              <Link href="/products" className="hover:text-secondary transition duration-150">
                All Shop
              </Link>
              <Link href="/products?category=mobiles" className="hover:text-secondary transition duration-150 flex items-center gap-1 lg:gap-1">
                <span className="w-1.5 h-1.5 lg:w-1 lg:h-1 rounded-full bg-cyan-500"></span> Mobiles
              </Link>
              <Link href="/products?category=laptops" className="hover:text-secondary transition duration-150 flex items-center gap-1 lg:gap-1">
                <span className="w-1.5 h-1.5 lg:w-1 lg:h-1 rounded-full bg-indigo-500"></span> Laptops
              </Link>
              <Link href="/products?category=fashion" className="hover:text-secondary transition duration-150 flex items-center gap-1 lg:gap-1">
                <span className="w-1.5 h-1.5 lg:w-1 lg:h-1 rounded-full bg-orange-500"></span> Fashion
              </Link>
              <Link href="/products?category=home-kitchen" className="hover:text-secondary transition duration-150 flex items-center gap-1 lg:gap-1">
                <span className="w-1.5 h-1.5 lg:w-1 lg:h-1 rounded-full bg-emerald-500"></span> Home & Kitchen
              </Link>
            </div>
          </div>

          {/* Middle: Search Bar (fits dynamically on mobile and desktop) */}
          <div className="flex-1 max-w-[180px] sm:max-w-[240px] md:max-w-xs lg:max-w-xs mx-1 sm:mx-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 pl-7 pr-2.5 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-cyan-100/50 outline-none transition-all duration-300 text-xxs sm:text-xs shadow-xs"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 md:w-3.5 md:h-3.5 text-slate-500" />
            </form>
          </div>

          {/* Right Side: Actions (Wishlist, Cart, Profile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0 justify-end">
            {/* Wishlist */}
            <Link
              href={mounted && isAuthenticated ? "/wishlist" : "/login"}
              className="hidden lg:inline-flex p-1.5 text-slate-600 dark:text-slate-300 hover:text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 relative"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href={mounted && isAuthenticated ? "/cart" : "/login"}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 relative"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white font-bold text-[8px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            {mounted && isAuthenticated ? (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs lg:text-xs border-2 border-secondary shadow-md">
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
                className="hidden lg:inline-block bg-secondary hover:bg-cyan-600 text-white font-medium px-4 lg:px-4 py-1.5 lg:py-1.5 rounded-full shadow-md text-xs lg:text-xs transition-all duration-300 transform hover:scale-103"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 animate-slide-in">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <img src="/logo.png" alt="Daykart Logo" className="h-8 w-auto rounded-md object-contain" />
                <span className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-cyan-500 to-orange-500 bg-clip-text text-transparent">
                  Daykart
                </span>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories & Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="text-xxs font-extrabold text-slate-900 uppercase tracking-wider mb-3 pl-2">
                  Browse Categories
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/products?category=mobiles"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                  >
                    <span>Mobiles</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                  <Link
                    href="/products?category=laptops"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                  >
                    <span>Laptops</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                  <Link
                    href="/products?category=fashion"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                  >
                    <span>Fashion</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                  <Link
                    href="/products?category=home-kitchen"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                  >
                    <span>Home & Kitchen</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-xxs font-extrabold text-slate-900 uppercase tracking-wider mb-3 pl-2">
                  Quick Links
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                  >
                    Shop Collection
                  </Link>
                  <Link
                    href="/register?role=seller"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                  >
                    Sell on Daykart
                  </Link>
                </div>
              </div>

              {/* Account Section */}
              {mounted && (
                <div>
                  <h3 className="text-xxs font-extrabold text-slate-900 uppercase tracking-wider mb-3 pl-2">
                    Account Actions
                  </h3>
                  {isAuthenticated ? (
                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span>My Wishlist</span>
                      </Link>
                      {user?.role === 'seller' && (
                        <Link
                          href="/seller/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Seller Dashboard</span>
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-secondary text-xs font-semibold transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-500 hover:bg-slate-50 text-xs font-semibold transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 p-2">
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center w-full bg-secondary hover:bg-cyan-600 text-white font-medium py-2 rounded-xl shadow-sm text-xs transition duration-150"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-xl text-xs transition duration-150"
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer / Profile Info */}
            {mounted && isAuthenticated && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-bold text-xs text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xxs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
