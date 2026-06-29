'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PRODUCTS, CATEGORIES } from '@/lib/dummy-data';
import { FilterState } from '@/lib/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductGrid from '@/components/ProductGrid';
import SearchFilters from '@/components/SearchFilters';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 8;

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

  // Sync search param from Navbar
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setFilters((prev) => ({ ...prev, search: q }));
    setCurrentPage(1);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = [...PRODUCTS];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    if (filters.category && filters.category !== 'All') {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.priceMin > 0) {
      result = result.filter((p) => p.price >= filters.priceMin);
    }

    if (filters.priceMax > 0) {
      result = result.filter((p) => p.price <= filters.priceMax);
    }

    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Discover Amazing Products</h1>
            <p className="text-indigo-200 text-lg">Shop the latest electronics, fashion, books, and home decor.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="mb-6">
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              categories={CATEGORIES}
            />
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'product' : 'products'} found
            </p>
          </div>

          {/* Grid */}
          {paginated.length > 0 ? (
            <ProductGrid products={paginated} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters or search term.</p>
              <button
                onClick={() => handleFilterChange({ search: '', category: 'All', priceMin: 0, priceMax: 0, sortBy: 'newest' })}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
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
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <CatalogPage />
    </Suspense>
  );
}
