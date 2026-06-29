'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CATEGORIES, PRODUCTS } from '@/lib/dummy-data';
import { useAuthContext } from '@/context/AuthContext';
import { fetchProduct, updateProduct } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';

interface PageProps {
  params: { id: string };
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
  const { id } = params;
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
        setSuccessMsg('Product updated (demo mode)');
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
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Product not found</h2>
        <p className="text-gray-500 text-sm mb-5">This product does not exist or has been deleted.</p>
        <Link href="/admin/products" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
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
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-0.5">
            <span>Products</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-600">Edit Product</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        </div>
      </div>

      {form.name && !isFetching && (
        <div className="mb-5 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editing: {form.name}
        </div>
      )}

      {successMsg && (
        <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMsg}
        </div>
      )}

      {apiError && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {apiError}
        </div>
      )}

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isFetching ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                      <textarea
                        value={form.description}
                        onChange={(e) => update('description', e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white ${errors.description ? 'border-red-300' : 'border-gray-200'}`}
                      />
                      {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                      <select
                        value={form.category}
                        onChange={(e) => update('category', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white ${errors.category ? 'border-red-300' : 'border-gray-200'}`}
                      >
                        {productCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Pricing and Stock</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => update('price', e.target.value)}
                        min="0.01"
                        step="0.01"
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white ${errors.price ? 'border-red-300' : 'border-gray-200'}`}
                      />
                      {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={form.stockQuantity}
                        onChange={(e) => update('stockQuantity', e.target.value)}
                        min="0"
                        step="1"
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white ${errors.stockQuantity ? 'border-red-300' : 'border-gray-200'}`}
                      />
                      {errors.stockQuantity && <p className="text-xs text-red-500 mt-1">{errors.stockQuantity}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Product Image</h2>
                  <ImageUpload
                    currentUrl={form.imageUrl}
                    onUrlChange={(url) => update('imageUrl', url)}
                    error={errors.imageUrl}
                    token={token}
                  />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Link
                href="/admin/products"
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading || isFetching}
                className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
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

        <div className="w-72 shrink-0 space-y-4 sticky top-24">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Live Preview</h3>
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imageUrl}
                alt="Preview"
                className="w-full h-40 object-cover rounded-xl mb-4 bg-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="space-y-1">
              <p className="font-bold text-gray-900 text-sm line-clamp-1">{form.name || 'Product Name'}</p>
              {form.category && (
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {form.category}
                </span>
              )}
              {form.price && (
                <p className="text-lg font-black text-gray-900 mt-2">
                  ${parseFloat(form.price || '0').toFixed(2)}
                </p>
              )}
              {form.stockQuantity && (
                <p className="text-xs text-gray-500">{form.stockQuantity} in stock</p>
              )}
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Tips</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-xs text-indigo-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Use a clear, high-quality image. Square format works best.
              </li>
              <li className="flex items-start gap-2 text-xs text-indigo-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Write descriptive product names with key attributes included.
              </li>
              <li className="flex items-start gap-2 text-xs text-indigo-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Set stock to 0 if the product is temporarily unavailable.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
