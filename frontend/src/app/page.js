'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ArrowRight, Flame, Sparkles, Monitor, Shirt, Home as HomeIcon, Award, Zap, ShieldCheck, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getOptimizedImageUrl } from '@/utils/image';
import { useGetProductsQuery, useGetTrendingProductsQuery, useGetRecentlyViewedQuery, useGetHeroSlidesQuery } from '@/store/api';

const CATEGORIES = [
  { name: 'Mobiles', slug: 'mobiles', icon: Zap, color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-950/40' },
  { name: 'Laptops', slug: 'laptops', icon: Monitor, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-950/40' },
  { name: 'Fashion', slug: 'fashion', icon: Shirt, color: 'text-orange-500 bg-orange-100 dark:bg-orange-950/40' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: HomeIcon, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40' }
];

const HERO_SLIDES = [
  {
    tagline: 'THE ULTIMATE SHOPPING EXPERIENCE',
    title: (
      <>
        Discover the Future of <br/>
        <span className="bg-gradient-to-r from-cyan-400 to-orange-500 bg-clip-text text-transparent">Smart Shopping</span>
      </>
    ),
    description: 'Daykart brings together verified sellers, high-end tech, stylish fashion, and smart product bundles under a lag-free custom user interface.',
    ctaText: 'Shop Collection',
    ctaLink: '/products',
    secondaryCtaText: 'Sell on Daykart',
    secondaryCtaLink: '/register?role=seller',
    glowColor1: 'bg-cyan-500/10',
    glowColor2: 'bg-orange-500/10',
    categoryName: 'Trending Now',
    categoryIcon: Flame,
    categorySlug: null,
  },
  {
    tagline: 'HIGH-PERFORMANCE GADGETS',
    title: (
      <>
        Power Your Setup <br/>
        <span className="bg-gradient-to-r from-cyan-400 to-orange-500 bg-clip-text text-transparent">with Premium Tech</span>
      </>
    ),
    description: 'Explore the latest laptops, smartphones, and mobile accessories. Verified specifications, official warranties, and zero-interest payment options.',
    ctaText: 'Explore Electronics',
    ctaLink: '/products?category=laptops',
    secondaryCtaText: 'Browse Mobiles',
    secondaryCtaLink: '/products?category=mobiles',
    glowColor1: 'bg-blue-600/10',
    glowColor2: 'bg-indigo-500/10',
    categoryName: 'Premium Tech',
    categoryIcon: Monitor,
    categorySlug: 'laptops',
  },
  {
    tagline: 'STEP INTO STYLE & COMFORT',
    title: (
      <>
        Redefine Your <br/>
        <span className="bg-gradient-to-r from-cyan-400 to-orange-500 bg-clip-text text-transparent">Everyday Wardrobe</span>
      </>
    ),
    description: 'Shop the newest seasonal drops, classic streetwear, and comfortable daily wear. Handpicked fabrics, custom designs, and verified size charts.',
    ctaText: 'Shop Fashion',
    ctaLink: '/products?category=fashion',
    secondaryCtaText: 'View Collection',
    secondaryCtaLink: '/products',
    glowColor1: 'bg-rose-500/10',
    glowColor2: 'bg-amber-500/10',
    categoryName: 'Fashion Apparel',
    categoryIcon: Shirt,
    categorySlug: 'fashion',
  },
  {
    tagline: 'SMART HOUSEHOLD GEAR',
    title: (
      <>
        Transform Your <br/>
        <span className="bg-gradient-to-r from-cyan-400 to-orange-500 bg-clip-text text-transparent">Home & Kitchen Spaces</span>
      </>
    ),
    description: 'Upgrade your kitchen with energy-efficient smart appliances, cookware, and sleek organizers. Durable materials backed by verified product reviews.',
    ctaText: 'Shop Kitchen Gear',
    ctaLink: '/products?category=home-kitchen',
    secondaryCtaText: 'View All Deals',
    secondaryCtaLink: '/products',
    glowColor1: 'bg-emerald-600/10',
    glowColor2: 'bg-teal-500/10',
    categoryName: 'Home & Kitchen',
    categoryIcon: HomeIcon,
    categorySlug: 'home-kitchen',
  }
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [currentSubSlide, setCurrentSubSlide] = React.useState(0);

  // Redirect logged-in sellers and admins to their dashboards
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'seller') {
        router.push('/seller/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  // Fetch dynamic hero slides
  const { data: slidesRes } = useGetHeroSlidesQuery();
  const dbSlides = slidesRes?.data?.slides || [];
  const activeSlides = dbSlides.length > 0 ? dbSlides : HERO_SLIDES;

  // Main banner rotates every 12 seconds
  React.useEffect(() => {
    if (activeSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  // Adjust active slide if slide count changes dynamically
  React.useEffect(() => {
    if (currentSlide >= activeSlides.length) {
      setCurrentSlide(0);
    }
  }, [activeSlides.length, currentSlide]);

  // Sub-carousel rotates every 4 seconds and resets when main banner changes
  React.useEffect(() => {
    setCurrentSubSlide(0);
    const interval = setInterval(() => {
      setCurrentSubSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  // Fetch queries
  const { data: trendingRes, isLoading: trendingLoading } = useGetTrendingProductsQuery();
  const { data: productsRes, isLoading: productsLoading } = useGetProductsQuery({ limit: 6 });
  const { data: recentRes } = useGetRecentlyViewedQuery(undefined, { skip: !isAuthenticated });

  // Category specific queries for the sub-carousels
  const { data: laptopsRes } = useGetProductsQuery({ category: 'laptops', limit: 3 });
  const { data: fashionRes } = useGetProductsQuery({ category: 'fashion', limit: 3 });
  const { data: homeKitchenRes } = useGetProductsQuery({ category: 'home-kitchen', limit: 3 });

  const trendingProducts = trendingRes?.data?.products || [];
  const products = productsRes?.data?.products || [];
  const recentProducts = recentRes?.data?.products || [];

  // Helper to fetch/pad sub-carousel products for a category
  const getSubCarouselProducts = (slideIndex) => {
    const slide = activeSlides[slideIndex];
    if (!slide) return [];

    let catProducts = [];
    if (slide.products && slide.products.length > 0) {
      catProducts = slide.products;
    } else if (slide.categorySlug === 'laptops') {
      catProducts = laptopsRes?.data?.products || [];
    } else if (slide.categorySlug === 'fashion') {
      catProducts = fashionRes?.data?.products || [];
    } else if (slide.categorySlug === 'home-kitchen') {
      catProducts = homeKitchenRes?.data?.products || [];
    } else {
      catProducts = trendingProducts;
    }

    const fallbackList = [...trendingProducts, ...products];
    const finalProducts = [...catProducts];

    // Ensure exactly 3 products are in the list by padding with trending/catalog products
    for (const item of fallbackList) {
      if (finalProducts.length >= 3) break;
      if (!finalProducts.some((p) => p._id === item._id)) {
        finalProducts.push(item);
      }
    }

    return finalProducts.slice(0, 3);
  };

  // Render glassmorphic card for sub-carousel product
  const renderRightCard = (slideIndex) => {
    const subProducts = getSubCarouselProducts(slideIndex);
    if (!subProducts || subProducts.length === 0) {
      return (
        <div className="w-full max-w-sm h-[340px] sm:h-[350px] bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl flex items-center justify-center text-slate-500">
          <Package className="w-8 h-8 animate-pulse mr-2" />
          <span className="text-xs font-semibold">Loading Category Deals...</span>
        </div>
      );
    }

    const activeProduct = subProducts[currentSubSlide] || subProducts[0];
    if (!activeProduct) return null;

    const discountPercent = activeProduct.compareAtPrice
      ? Math.round(((activeProduct.compareAtPrice - activeProduct.price) / activeProduct.compareAtPrice) * 100)
      : 0;

    return (
      <div 
        onClick={() => router.push(`/product/${activeProduct._id}`)}
        className="w-full max-w-[92vw] sm:max-w-sm lg:max-w-[460px] mx-auto h-[340px] sm:h-[350px] lg:h-[430px] bg-slate-950/40 hover:bg-slate-950/60 backdrop-blur-md border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between transition-all duration-500 cursor-pointer group shadow-2xl relative"
      >
        {/* Sub-carousel Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSubSlide((prev) => (prev + 3 - 1) % 3);
          }}
          className="absolute left-1.5 sm:-left-3 top-1/2 -translate-y-1/2 z-20 bg-slate-900/80 hover:bg-slate-900 border border-slate-750 text-white p-2 rounded-full backdrop-blur-md shadow-lg transition duration-200 transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
          aria-label="Previous Product"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSubSlide((prev) => (prev + 1) % 3);
          }}
          className="absolute right-1.5 sm:-right-3 top-1/2 -translate-y-1/2 z-20 bg-slate-900/80 hover:bg-slate-900 border border-slate-750 text-white p-2 rounded-full backdrop-blur-md shadow-lg transition duration-200 transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
          aria-label="Next Product"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Sparkly badge indicator */}
        <div className="absolute -top-3 -right-3 bg-secondary text-white p-2 rounded-full shadow-lg border border-slate-800 group-hover:scale-110 transition-all duration-300 z-10">
          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
        </div>

        {/* Product Image Section */}
        <div className="h-40 sm:h-44 lg:h-[250px] w-full bg-slate-900/50 rounded-2xl flex items-center justify-center p-3 relative overflow-hidden group-hover:bg-slate-900/80 transition-colors duration-300">
          <img
            key={`img-${activeProduct._id}`}
            src={getOptimizedImageUrl(activeProduct.images?.[0] || '/placeholder.png', 600)}
            alt={activeProduct.title}
            className="object-contain max-h-full max-w-full transition-all duration-700 group-hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(255,255,255,0.06)] animate-fade-in"
          />
          
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 bg-gradient-to-r from-accent to-orange-500 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-md">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Product Details Section */}
        <div className="mt-3 flex-1 flex flex-col justify-between">
          <div key={`details-${activeProduct._id}`} className="animate-fade-in">
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-400">
              <span className="text-secondary truncate max-w-[120px]">{activeProduct.brand?.name || 'Premium Spec'}</span>
              <span className="bg-slate-800/60 px-2 py-0.5 rounded text-slate-300">
                {activeProduct.category?.name || 'Catalog'}
              </span>
            </div>
            
            <h3 className="text-sm font-extrabold text-white mt-1.5 line-clamp-1 group-hover:text-secondary transition-colors duration-300">
              {activeProduct.title}
            </h3>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-base text-white">
                ₹{activeProduct.price?.toLocaleString('en-IN')}
              </span>
              {activeProduct.compareAtPrice && (
                <span className="text-xs line-through text-slate-500">
                  ₹{activeProduct.compareAtPrice?.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            
            <span className="text-[10px] font-extrabold text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
              Buy Now <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Sub-carousel Indicators */}
        <div className="flex justify-center gap-1.5 mt-3 pt-1">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                currentSubSlide === idx 
                  ? 'w-5 bg-secondary' 
                  : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderSlideTitle = (slide) => {
    if (!slide) return null;
    if (typeof slide.title !== 'string') {
      return slide.title;
    }
    return (
      <>
        {slide.title} <br/>
        <span className="bg-gradient-to-r from-cyan-400 to-orange-500 bg-clip-text text-transparent font-bold">
          {slide.titleAccent}
        </span>
      </>
    );
  };

  const currentSlideData = activeSlides[currentSlide] || {};

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Hero Banner Section with Carousel */}
        <section className="relative overflow-hidden bg-slate-900 text-white pt-2.5 pb-4 sm:py-16 lg:py-24 transition-colors duration-1000">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e293b,transparent_70%)]" />
          <div className={`absolute right-0 bottom-0 w-96 h-96 ${currentSlideData.glowColor1 || 'bg-cyan-500/10'} rounded-full blur-3xl transition-all duration-1000`} />
          <div className={`absolute left-10 top-10 w-72 h-72 ${currentSlideData.glowColor2 || 'bg-orange-500/10'} rounded-full blur-3xl transition-all duration-1000`} />

          {/* Main Carousel Nav Arrows */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev + activeSlides.length - 1) % activeSlides.length)}
            className="hidden sm:flex absolute left-2 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 border border-white/10 text-white p-2 sm:p-3 rounded-full backdrop-blur-md shadow-lg transition duration-200 transform hover:scale-105 active:scale-95 cursor-pointer items-center justify-center"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % activeSlides.length)}
            className="hidden sm:flex absolute right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 border border-white/10 text-white p-2 sm:p-3 rounded-full backdrop-blur-md shadow-lg transition duration-200 transform hover:scale-105 active:scale-95 cursor-pointer items-center justify-center"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-12 items-center lg:min-h-[430px] py-1 lg:py-0">
              {/* Left Side Content */}
              <div className="transition-all duration-500 transform translate-x-0 opacity-100 flex flex-col justify-center lg:h-[430px]">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-orange-400 font-bold mb-2 sm:mb-6 self-start">
                  <Sparkles className="w-4 h-4 text-orange-400 animate-spin" />
                  {currentSlideData.tagline}
                </div>

                {/* Mobile-only Category Heading */}
                <h2 className="block lg:hidden text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                  {currentSlideData.categoryName || currentSlideData.tagline}
                </h2>

                {/* Desktop/Laptop Medium Sized Title */}
                <h1 className="hidden lg:flex text-2xl lg:text-3xl font-bold tracking-tight leading-snug items-center">
                  <span>
                    {renderSlideTitle(currentSlideData)}
                  </span>
                </h1>

                {/* Desktop/Laptop Description */}
                <p className="hidden lg:block mt-4 text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed">
                  {currentSlideData.description}
                </p>

                {/* Desktop CTA Buttons */}
                <div className="hidden lg:flex mt-4 sm:mt-6 flex-wrap gap-3">
                  {currentSlideData.ctaLink && (
                    <Link
                      href={currentSlideData.ctaLink}
                      className="inline-flex items-center gap-1.5 bg-secondary hover:bg-cyan-600 text-white font-bold px-4 py-2 rounded-full shadow-lg transition duration-300 transform hover:scale-103 text-[11px]"
                    >
                      {currentSlideData.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {currentSlideData.secondaryCtaLink && (
                    <Link
                      href={currentSlideData.secondaryCtaLink}
                      className="inline-flex items-center gap-1.5 border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-full transition duration-300 text-[11px]"
                    >
                      {currentSlideData.secondaryCtaText}
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Side Card */}
              <div className="w-full flex items-center justify-center transition-all duration-500 transform translate-x-0 opacity-100 mt-0 lg:mt-0">
                {renderRightCard(currentSlide)}
              </div>
            </div>

            {/* Mobile CTA Buttons (Downside of the sub-carousel card) */}
            <div className="flex lg:hidden mt-5 w-full justify-center flex-wrap gap-3">
              {currentSlideData.ctaLink && (
                <Link
                  href={currentSlideData.ctaLink}
                  className="inline-flex items-center gap-1.5 bg-secondary hover:bg-cyan-600 text-white font-bold px-4 py-2 rounded-full shadow-lg transition duration-300 transform hover:scale-103 text-[11px]"
                >
                  {currentSlideData.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              {currentSlideData.secondaryCtaLink && (
                <Link
                  href={currentSlideData.secondaryCtaLink}
                  className="inline-flex items-center gap-1.5 border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-full transition duration-300 text-[11px]"
                >
                  {currentSlideData.secondaryCtaText}
                </Link>
              )}
            </div>
            
            {/* Slide Indicators */}
            <div className="flex justify-center gap-3 mt-5 sm:mt-10 relative z-20">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    currentSlide === index 
                      ? 'bg-secondary w-8 shadow-md shadow-cyan-500/50' 
                      : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Browse Top Categories
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="flex items-center gap-3.5 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-secondary hover:shadow-md transition-all duration-300"
                >
                  <div className={`p-3 rounded-xl ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{cat.name}</h3>
                    <p className="text-xxs text-slate-400 mt-0.5">Explore Products</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Trending Section */}
        {trendingProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Trending This Week</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {trendingLoading ? (
                Array(6).fill(0).map((_, i) => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)
              ) : (
                trendingProducts.map(p => <ProductCard key={p._id} product={p} />)
              )}
            </div>
          </section>
        )}

        {/* General Featured Products Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Featured Products</h2>
            <Link href="/products" className="text-sm font-semibold text-secondary hover:underline flex items-center gap-1">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {productsLoading ? (
              Array(6).fill(0).map((_, i) => <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)
            ) : (
              products.map(p => <ProductCard key={p._id} product={p} />)
            )}
          </div>
        </section>

        {/* Recently Viewed Slider */}
        {isAuthenticated && recentProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Recently Viewed</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {recentProducts.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
