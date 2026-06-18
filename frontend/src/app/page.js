'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { ArrowRight, Flame, Sparkles, Monitor, Shirt, Home as HomeIcon, Award, Zap, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useGetProductsQuery, useGetTrendingProductsQuery, useGetRecentlyViewedQuery } from '@/store/api';

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
    rightCard: (
      <div className="bg-white p-8 rounded-3xl max-w-md mx-auto shadow-2xl relative border border-slate-100 text-left h-[390px] flex flex-col justify-start">
        <div className="absolute -top-4 -right-4 bg-orange-500 text-white p-3 rounded-2xl shadow-lg transform rotate-6">
          <Flame className="w-6 h-6 fill-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Why Shop With Us?</h3>
        <div className="mt-6 space-y-6">
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <Zap className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Sub-5ms Page Loads</h4>
              <p className="text-xs text-slate-500 mt-1">Utilizes high-speed Redis caching layers so your browsing has zero delays.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Apriori Recommendations</h4>
              <p className="text-xs text-slate-500 mt-1">Intelligent market basket algorithm matches frequently bought combinations.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Enterprise Security</h4>
              <p className="text-xs text-slate-500 mt-1">HttpOnly session cookies, CSRF protection, and audit trails safeguard transfers.</p>
            </div>
          </div>
        </div>
      </div>
    )
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
    rightCard: (
      <div className="bg-white p-8 rounded-3xl max-w-md mx-auto shadow-2xl relative border border-slate-100 text-left h-[390px] flex flex-col justify-start">
        <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-2xl shadow-lg transform rotate-6">
          <Monitor className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Premium Tech Perks</h3>
        <div className="mt-6 space-y-6">
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Verified Original Specs</h4>
              <p className="text-xs text-slate-500 mt-1">Every listing is verified by our admins to match authentic device hardware configurations.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Brand Warranties</h4>
              <p className="text-xs text-slate-500 mt-1">Direct official brand protection and verified local seller returns.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Safe Transit Insurance</h4>
              <p className="text-xs text-slate-500 mt-1">Fully protected door-to-door delivery with verified shipping partners.</p>
            </div>
          </div>
        </div>
      </div>
    )
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
    rightCard: (
      <div className="bg-white p-8 rounded-3xl max-w-md mx-auto shadow-2xl relative border border-slate-100 text-left h-[390px] flex flex-col justify-start">
        <div className="absolute -top-4 -right-4 bg-rose-500 text-white p-3 rounded-2xl shadow-lg transform rotate-6">
          <Shirt className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Fashion Guarantee</h3>
        <div className="mt-6 space-y-6">
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <Zap className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">30-Day Easy Returns</h4>
              <p className="text-xs text-slate-500 mt-1">Hassle-free size exchanges or immediate platform wallet refunds.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Premium Fabrics</h4>
              <p className="text-xs text-slate-500 mt-1">Sourced from certified local textile weavers and clothing manufacturers.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Exclusive Designer Drops</h4>
              <p className="text-xs text-slate-500 mt-1">Direct limited listings from local designers only available on Daykart.</p>
            </div>
          </div>
        </div>
      </div>
    )
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
    rightCard: (
      <div className="bg-white p-8 rounded-3xl max-w-md mx-auto shadow-2xl relative border border-slate-100 text-left h-[390px] flex flex-col justify-start">
        <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-3 rounded-2xl shadow-lg transform rotate-6">
          <HomeIcon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Home Benefits</h3>
        <div className="mt-6 space-y-6">
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Eco-Friendly Materials</h4>
              <p className="text-xs text-slate-500 mt-1">Non-toxic, high-durability kitchenware materials verified for health safety.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <Award className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Energy Efficiency</h4>
              <p className="text-xs text-slate-500 mt-1">Appliances verified to lower electricity consumption and household bills.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center h-11 w-11 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Warranty Guard</h4>
              <p className="text-xs text-slate-500 mt-1">Hassle-free registry with instant claims processing directly inside support.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function Home() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [currentSlide, setCurrentSlide] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch queries
  const { data: trendingRes, isLoading: trendingLoading } = useGetTrendingProductsQuery();
  const { data: productsRes, isLoading: productsLoading } = useGetProductsQuery({ limit: 6 });
  const { data: recentRes } = useGetRecentlyViewedQuery(undefined, { skip: !isAuthenticated });

  const trendingProducts = trendingRes?.data?.products || [];
  const products = productsRes?.data?.products || [];
  const recentProducts = recentRes?.data?.products || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Hero Banner Section with Carousel */}
        <section className="relative overflow-hidden bg-slate-900 text-white pt-10 pb-12 sm:py-16 lg:py-24 transition-colors duration-1000">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e293b,transparent_70%)]" />
          <div className={`absolute right-0 bottom-0 w-96 h-96 ${HERO_SLIDES[currentSlide].glowColor1} rounded-full blur-3xl transition-all duration-1000`} />
          <div className={`absolute left-10 top-10 w-72 h-72 ${HERO_SLIDES[currentSlide].glowColor2} rounded-full blur-3xl transition-all duration-1000`} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[400px] lg:min-h-[390px]">
              {/* Left Side Content */}
              <div className="transition-all duration-500 transform translate-x-0 opacity-100 flex flex-col justify-center h-[400px] lg:h-[390px]">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-orange-400 font-bold mb-4 sm:mb-6 self-start">
                  <Sparkles className="w-4 h-4 text-orange-400 animate-spin" />
                  {HERO_SLIDES[currentSlide].tagline}
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight leading-tight flex items-center">
                  <span>
                    {HERO_SLIDES[currentSlide].title}
                  </span>
                </h1>

                <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed">
                  {HERO_SLIDES[currentSlide].description}
                </p>

                <div className="mt-6 sm:mt-8 flex flex-wrap gap-4">
                  <Link
                    href={HERO_SLIDES[currentSlide].ctaLink}
                    className="inline-flex items-center gap-2 bg-secondary hover:bg-cyan-600 text-white font-bold px-7 py-3 rounded-full shadow-lg transition duration-300 transform hover:scale-103 text-xs sm:text-sm"
                  >
                    {HERO_SLIDES[currentSlide].ctaText} <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={HERO_SLIDES[currentSlide].secondaryCtaLink}
                    className="inline-flex items-center gap-2 border border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-white font-bold px-7 py-3 rounded-full transition duration-300 text-xs sm:text-sm"
                  >
                    {HERO_SLIDES[currentSlide].secondaryCtaText}
                  </Link>
                </div>
              </div>

              {/* Right Side Card */}
              <div className="lg:block hidden transition-all duration-500 transform translate-x-0 opacity-100">
                {HERO_SLIDES[currentSlide].rightCard}
              </div>
            </div>
            
            {/* Slide Indicators */}
            <div className="flex justify-center gap-3 mt-10 relative z-20">
              {HERO_SLIDES.map((_, index) => (
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
