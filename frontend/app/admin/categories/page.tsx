'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/lib/types';
import { fetchCategories, createCategory, updateCategory, deleteCategory, toggleCategoryActive } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import ImageUpload from '@/components/ImageUpload';

const DUMMY_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices', imageUrl: '', isActive: true, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', imageUrl: '', isActive: true, createdAt: '', updatedAt: '' },
  { id: '3', name: 'Books', slug: 'books', description: 'Books and literature', imageUrl: '', isActive: false, createdAt: '', updatedAt: '' },
];

interface FormData {
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

const defaultForm: FormData = { name: '', description: '', imageUrl: '', isActive: true };

export default function AdminCategoriesPage() {
  const { token } = useAuthContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [usingDummy, setUsingDummy] = useState(false);

  const loadCategories = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories(searchTerm ? { search: searchTerm } : {});
      setCategories(data);
      setUsingDummy(false);
    } catch {
      setCategories(DUMMY_CATEGORIES);
      setUsingDummy(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      loadCategories(search || undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [search, loadCategories]);

  const openAdd = () => {
    setFormData(defaultForm);
    setEditingCategory(null);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setFormData({
      name: cat.name,
      description: cat.description ?? '',
      imageUrl: cat.imageUrl ?? '',
      isActive: cat.isActive,
    });
    setEditingCategory(cat);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (usingDummy || !token || token.startsWith('mock_')) {
        // Demo mode — simulate save
        await new Promise((r) => setTimeout(r, 400));
        if (editingCategory) {
          setCategories((prev) =>
            prev.map((c) =>
              c.id === editingCategory.id
                ? { ...c, ...formData }
                : c,
            ),
          );
        } else {
          const newCat: Category = {
            id: String(Date.now()),
            name: formData.name,
            slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
            description: formData.description,
            imageUrl: formData.imageUrl,
            isActive: formData.isActive,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCategories((prev) => [newCat, ...prev]);
        }
      } else {
        if (editingCategory) {
          await updateCategory(editingCategory.id, formData, token);
        } else {
          await createCategory(formData, token);
        }
        await loadCategories(search || undefined);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setError(null);

    try {
      if (usingDummy || !token || token.startsWith('mock_')) {
        await new Promise((r) => setTimeout(r, 400));
        setCategories((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      } else {
        await deleteCategory(deleteConfirm.id, token);
        await loadCategories(search || undefined);
      }
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (cat: Category) => {
    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c)),
    );

    if (usingDummy || !token || token.startsWith('mock_')) return;

    try {
      await toggleCategoryActive(cat.id, token);
    } catch {
      // Revert on error
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c)),
      );
      setError('Failed to toggle category status.');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full">
            {categories.length}
          </span>
          {usingDummy && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Demo data
            </span>
          )}
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Category
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-3 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex items-center gap-3">
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Image</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name &amp; Slug</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 10V5a2 2 0 012-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-semibold">No categories yet</p>
                      <p className="text-gray-400 text-xs">Get started by creating your first category.</p>
                      <button
                        onClick={openAdd}
                        className="mt-1 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
                      >
                        Add your first category
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    {/* Image */}
                    <td className="px-6 py-4">
                      {cat.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-10 h-10 rounded-xl object-cover bg-gray-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 10V5a2 2 0 012-2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    {/* Name & Slug */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">/{cat.slug}</p>
                    </td>
                    {/* Description */}
                    <td className="px-6 py-4">
                      <p className="text-gray-600 text-sm line-clamp-2 max-w-xs">
                        {cat.description || <span className="text-gray-300 italic">No description</span>}
                      </p>
                    </td>
                    {/* Status toggle */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                          cat.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(cat)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => setDeleteConfirm(cat)}
                          className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && categories.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Electronics"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
                <ImageUpload
                  currentUrl={formData.imageUrl}
                  onUrlChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                  token={token}
                />
              </div>

              {/* Active checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (visible on storefront)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setShowModal(false); setError(null); }}
                disabled={saving}
                className="flex-1 px-5 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saving && (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Category</h3>
              <p className="text-gray-600 text-sm mb-1">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900">{deleteConfirm.name}</span>?
              </p>
              <p className="text-gray-400 text-xs mb-7">This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { if (!deleting) setDeleteConfirm(null); }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {deleting && (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
