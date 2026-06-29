'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PRODUCTS, CATEGORIES } from '@/lib/dummy-data';
import { FilterState, Product } from '@/lib/types';
import { fetchProducts } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductGrid from '@/components/ProductGrid';
import SearchFilters from '@/components/SearchFilters';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 8;

// Client-side fallback (used only when the backend is unreachable).
function filterDummy(filters: FilterState, page: number) {
  let result = [...PRODUCTS];
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }
  if (filters.category && filters.category !== 'All') {
    result = result.filter((p) => p.category === filters.category);
  }
  if (filters.priceMin > 0) result = result.filter((p) => p.price >= filters.priceMin);
  if (filters.priceMax > 0) result = result.filter((p) => p.price <= filters.priceMax);
  switch (filters.sortBy) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    default:
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
  const total = result.length;
  const data = result.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { data, total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

function CatalogPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') ?? '';

  const [filters, setFilters] = useState<FilterState>({
    search: initialSearch,
    category: 'All',
    priceMin: 0,
    priceMax: 0,
    sortBy: 'newest',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  // Keep search in sync with the Navbar's ?q= param.
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setFilters((prev) => ({ ...prev, search: q }));
    setCurrentPage(1);
  }, [searchParams]);

  // Fetch from the backend whenever filters or page change (debounced).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        const res = await fetchProducts({
          search: filters.search || undefined,
          category: filters.category !== 'All' ? filters.category : undefined,
          priceMin: filters.priceMin || undefined,
          priceMax: filters.priceMax || undefined,
          sortBy: filters.sortBy,
          page: currentPage,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setProducts(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
        setUsingFallback(false);
      } catch {
        // Backend unreachable — fall back to bundled demo data.
        if (cancelled) return;
        const fb = filterDummy(filters, currentPage);
        setProducts(fb.data);
        setTotal(fb.total);
        setTotalPages(fb.totalPages);
        setUsingFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(run, 300); // debounce search typing
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [filters, currentPage]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text content */}
              <div>
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-white/90 mb-6">
                  ✨ New arrivals every week
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
                  Shop the Future,<br />
                  <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Today.</span>
                </h1>
                <p className="text-lg text-white/70 mb-8 max-w-md leading-relaxed">
                  Discover thousands of premium products. Electronics, fashion, books, and more — all in one place.
                </p>
                <div className="flex flex-wrap gap-4 mb-10">
                  <a href="#products" className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:opacity-90 transition-all">
                    Shop Now
                  </a>
                  <button onClick={() => handleFilterChange({search:'',category:'All',priceMin:0,priceMax:0,sortBy:'newest'})} className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold text-white hover:bg-white/20 transition-all">
                    Browse All
                  </button>
                </div>
                <div className="flex items-center gap-6 text-sm text-white/60">
                  <span className="flex items-center gap-2">✓ Free Shipping $100+</span>
                  <span className="flex items-center gap-2">✓ Easy Returns</span>
                  <span className="flex items-center gap-2">✓ Secure Payment</span>
                </div>
              </div>
              {/* Right: Category cards grid */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {[
                  { name: 'Electronics', emoji: '💻', color: 'from-indigo-500 to-blue-600', cat: 'Electronics' },
                  { name: 'Clothing', emoji: '👗', color: 'from-violet-500 to-purple-600', cat: 'Clothing' },
                  { name: 'Books', emoji: '📚', color: 'from-amber-500 to-orange-600', cat: 'Books' },
                  { name: 'Home & Garden', emoji: '🏡', color: 'from-emerald-500 to-teal-600', cat: 'Home' },
                ].map(item => (
                  <button
                    key={item.cat}
                    onClick={() => handleFilterChange({search:'',category:item.cat,priceMin:0,priceMax:0,sortBy:'newest'})}
                    className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 text-left hover:scale-105 transition-transform cursor-pointer`}
                  >
                    <div className="text-3xl mb-3">{item.emoji}</div>
                    <div className="text-white font-bold text-lg">{item.name}</div>
                    <div className="text-white/70 text-sm mt-1">Shop &#8594;</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Products section */}
        <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filters */}
          <div className="mb-8">
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              categories={CATEGORIES}
            />
          </div>

          {/* Heading + result count */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Products</h2>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {loading ? (
                'Loading products…'
              ) : (
                <>
                  <span className="font-semibold text-gray-900">{total}</span>{' '}
                  {total === 1 ? 'product' : 'products'} found
                </>
              )}
            </p>
            {usingFallback && !loading && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">Showing demo data — backend offline</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-9 bg-gray-200 rounded-xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search term.</p>
              <button
                onClick={() => handleFilterChange({ search: '', category: 'All', priceMin: 0, priceMax: 0, sortBy: 'newest' })}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="h-16 bg-white border-b border-gray-100" />
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    }>
      <CatalogPage />
    </Suspense>
  );
}
