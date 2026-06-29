'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS } from '@/lib/dummy-data';
import { Product } from '@/lib/types';
import { fetchProduct, fetchProductSuggestions } from '@/lib/api';
import { useCartContext } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { addToCart } = useCartContext();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Load the product (real API first, dummy data as a fallback).
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const p = await fetchProduct(id);
        if (cancelled) return;
        setProduct(p);
        // Suggestions from the backend; ignore failures (non-critical).
        try {
          const s = await fetchProductSuggestions(id);
          if (!cancelled) setRelated(s);
        } catch {
          if (!cancelled) setRelated([]);
        }
      } catch {
        // Backend unreachable or 404 — fall back to bundled demo data.
        const fallback = PRODUCTS.find((p) => p.id === id);
        if (cancelled) return;
        if (fallback) {
          setProduct(fallback);
          setRelated(
            PRODUCTS.filter(
              (p) => p.category === fallback.category && p.id !== fallback.id,
            ).slice(0, 4),
          );
        } else {
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Keep the chosen quantity within available stock.
  useEffect(() => {
    if (product) setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, product.stockQuantity)));
  }, [product]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [product, quantity, addToCart]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <DetailSkeleton />
          ) : notFound || !product ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Product not found</h2>
              <p className="text-gray-500 text-sm mb-5">This product doesn&apos;t exist or may have been removed.</p>
              <Link
                href="/"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
                <span>/</span>
                <span className="text-gray-400">{product.category}</span>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
              </nav>

              {/* Product detail */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z" />
                        </svg>
                      </div>
                    )}
                    {product.stockQuantity === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-gray-800 text-sm font-semibold px-4 py-1.5 rounded-full">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6 sm:p-8 flex flex-col">
                    <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full w-fit mb-3">
                      {product.category}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <p className="text-3xl font-bold text-indigo-600 mb-4">${product.price.toFixed(2)}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 whitespace-pre-line">
                      {product.description}
                    </p>

                    {/* Stock indicator */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className={`w-2 h-2 rounded-full ${product.stockQuantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={`text-sm font-medium ${product.stockQuantity > 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {product.stockQuantity > 0
                          ? `${product.stockQuantity} unit${product.stockQuantity === 1 ? '' : 's'} available`
                          : 'Out of Stock'}
                      </span>
                    </div>

                    {product.stockQuantity > 0 && (
                      <>
                        {/* Quantity selector */}
                        <div className="flex items-center gap-3 mb-5">
                          <label className="text-sm font-medium text-gray-700">Quantity</label>
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                              disabled={quantity <= 1}
                              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-12 text-center text-sm font-semibold text-gray-900">{quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                              disabled={quantity >= product.stockQuantity}
                              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <span className="text-sm text-gray-500">
                            Subtotal:{' '}
                            <span className="font-semibold text-gray-900">
                              ${(product.price * quantity).toFixed(2)}
                            </span>
                          </span>
                        </div>

                        {/* Add to cart */}
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          className={`w-full py-3 px-6 rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2 ${
                            added
                              ? 'bg-green-600 text-white'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {added ? (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Added to Cart!
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Add to Cart
                            </>
                          )}
                        </button>

                        <Link
                          href="/cart"
                          className="mt-3 w-full py-3 px-6 rounded-xl font-semibold text-base text-center border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          View Cart
                        </Link>
                      </>
                    )}

                    {product.createdAt && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          Added:{' '}
                          {new Date(product.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Related products */}
              {related.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">You might also like</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {related.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="aspect-square bg-gray-200" />
          <div className="p-8 space-y-4">
            <div className="h-6 w-24 bg-gray-200 rounded-full" />
            <div className="h-8 w-3/4 bg-gray-200 rounded" />
            <div className="h-8 w-32 bg-gray-200 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-xl mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
