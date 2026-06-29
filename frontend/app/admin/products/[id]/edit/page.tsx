'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CATEGORIES, PRODUCTS } from '@/lib/dummy-data';
import { useAuthContext } from '@/context/AuthContext';
import { fetchProduct, updateProduct } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  stockQuantity: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  category?: string;
  stockQuantity?: string;
}

const productCategories = CATEGORIES.filter((c) => c !== 'All');

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { token } = useAuthContext();

  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: productCategories[0],
    stockQuantity: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Load product on mount
  useEffect(() => {
    const load = async () => {
      setIsFetching(true);
      try {
        const product = await fetchProduct(id);
        setForm({
          name: product.name,
          description: product.description || '',
          price: String(product.price),
          imageUrl: product.imageUrl || '',
          category: product.category,
          stockQuantity: String(product.stockQuantity),
        });
      } catch {
        // Fall back to dummy data
        const fallback = PRODUCTS.find((p) => p.id === id);
        if (fallback) {
          setForm({
            name: fallback.name,
            description: fallback.description,
            price: String(fallback.price),
            imageUrl: fallback.imageUrl,
            category: fallback.category,
            stockQuantity: String(fallback.stockQuantity),
          });
        } else {
          setNotFound(true);
        }
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [id]);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    const priceNum = parseFloat(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (!form.imageUrl.trim()) newErrors.imageUrl = 'Product image is required';
    if (!form.category) newErrors.category = 'Category is required';
    const stockNum = parseInt(form.stockQuantity);
    if (form.stockQuantity === '' || isNaN(stockNum) || stockNum < 0) {
      newErrors.stockQuantity = 'Stock quantity must be 0 or more';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      imageUrl: form.imageUrl.trim(),
      category: form.category,
      stockQuantity: parseInt(form.stockQuantity),
    };

    try {
      if (token && !token.startsWith('mock_')) {
        await updateProduct(id, payload, token);
        setSuccessMsg('Product updated successfully!');
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setSuccessMsg('Product updated (demo mode — not saved to DB)');
      }
      setTimeout(() => router.push('/admin/products'), 1200);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to update product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-64">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
        <p className="text-gray-500 text-sm mb-4">This product does not exist or has been deleted.</p>
        <Link href="/admin/products" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/products"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      <div className="max-w-2xl">
        {successMsg && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMsg}
          </div>
        )}

        {apiError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {isFetching ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    min="0.01"
                    step="0.01"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.price ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => update('stockQuantity', e.target.value)}
                    min="0"
                    step="1"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.stockQuantity ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.stockQuantity && <p className="text-xs text-red-500 mt-1">{errors.stockQuantity}</p>}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white ${errors.category ? 'border-red-300' : 'border-gray-300'}`}
                >
                  {productCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>

              {/* Image Upload */}
              <ImageUpload
                currentUrl={form.imageUrl}
                onUrlChange={(url) => update('imageUrl', url)}
                error={errors.imageUrl}
              />
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            <Link
              href="/admin/products"
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || isFetching}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
