'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, ArrowUpDown, RefreshCw, HelpCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useGetProductsQuery } from '@/store/api';

const CATEGORY_FILTERS = [
  { name: 'Mobiles', slug: 'mobiles' },
  { name: 'Laptops', slug: 'laptops' },
  { name: 'Mens Wear', slug: 'mens-wear' },
  { name: 'Womens Wear', slug: 'womens-wear' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' }
];

const BRAND_FILTERS = [
  { name: 'Apple', slug: 'apple' },
  { name: 'Samsung', slug: 'samsung' },
  { name: 'Nike', slug: 'nike' },
  { name: 'Levis', slug: 'levis' }
];

function ProductsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse queries from URL
  const initialCategory = searchParams.get('category') || '';
  const initialBrand = searchParams.get('brand') || '';
  const initialSearch = searchParams.get('search') || '';

  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [search, setSearch] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Sync inputs with search parameter updates
  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setBrand(searchParams.get('brand') || '');
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  // Query API
  const { data, isLoading, isFetching } = useGetProductsQuery({
    category,
    brand,
    search,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    sort,
    page,
    limit: 12,
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || { totalPages: 1 };

  const handleClearFilters = () => {
    setCategory('');
    setBrand('');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
    router.push('/products');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {search ? `Search results for "${search}"` : 'Daykart Catalog'}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Found {products.length} products
            </p>
          </div>

          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:block hidden space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl h-fit">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Filter Products</h3>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Category</h4>
              <div className="space-y-2">
                {CATEGORY_FILTERS.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => { setCategory(cat.slug); setPage(1); }}
                    className={`block w-full text-left text-sm py-1 transition-all ${
                      category === cat.slug 
                        ? 'text-secondary font-bold pl-1 border-l-2 border-secondary' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-secondary'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Brand</h4>
              <div className="space-y-2">
                {BRAND_FILTERS.map(br => (
                  <button
                    key={br.slug}
                    onClick={() => { setBrand(br.slug); setPage(1); }}
                    className={`block w-full text-left text-sm py-1 transition-all ${
                      brand === br.slug 
                        ? 'text-secondary font-bold pl-1 border-l-2 border-secondary' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-secondary'
                    }`}
                  >
                    {br.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Price Range (₹)</h4>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary p-2 rounded-xl text-xs outline-none dark:text-slate-200"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary p-2 rounded-xl text-xs outline-none dark:text-slate-200"
                />
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Sort By</h4>
              <div className="relative mt-2">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary p-2.5 rounded-xl text-xs outline-none dark:text-slate-200"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Average Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {isLoading || isFetching ? (
              /* Loading Skeletons */
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4">No Products Found</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-xs text-center">Try adjusting your keyword searches or clearing selected filters.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-6 bg-secondary hover:bg-cyan-600 text-white font-bold px-6 py-2 rounded-full text-xs shadow-md"
                >
                  Show All Products
                </button>
              </div>
            ) : (
              /* Loaded Products Grid */
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                    >
                      Next
                    </button>
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

export default function ProductsList() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-secondary"></div>
      </div>
    }>
      <ProductsListContent />
    </React.Suspense>
  );
}
