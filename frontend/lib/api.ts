/**
 * API client for the NestJS backend.
 * All functions accept an optional `token` for authenticated endpoints.
 * Falls back gracefully when the backend is unreachable.
 */

import { Product } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductsQueryParams {
  search?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface ProductsApiResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  stockQuantity: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      errorMessage = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message || errorMessage;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorMessage);
  }
  return res.json() as Promise<T>;
}

// ─── Products API ─────────────────────────────────────────────────────────────

export async function fetchProducts(
  params: ProductsQueryParams = {},
): Promise<ProductsApiResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 0) {
      query.set(key, String(value));
    }
  });

  const res = await fetch(`${API_URL}/products?${query.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  return handleResponse<ProductsApiResponse>(res);
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    signal: AbortSignal.timeout(8000),
  });
  return handleResponse<Product>(res);
}

export async function fetchProductSuggestions(id: string): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products/${id}/suggestions`, {
    signal: AbortSignal.timeout(8000),
  });
  return handleResponse<Product[]>(res);
}

export async function createProduct(
  payload: CreateProductPayload,
  token: string,
): Promise<Product> {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  return handleResponse<Product>(res);
}

export async function updateProduct(
  id: string,
  payload: Partial<CreateProductPayload>,
  token: string,
): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  return handleResponse<Product>(res);
}

export async function deleteProduct(
  id: string,
  token: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
    signal: AbortSignal.timeout(10000),
  });
  return handleResponse<{ message: string }>(res);
}

// ─── Backend Image Upload ───────────────────────────────────────────────────

export interface UploadImageResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * Upload an image file to the backend. The backend stores it in its /uploads
 * folder and returns the public URL to save on the product.
 * Requires an admin token.
 */
export async function uploadProductImage(
  file: File,
  token: string,
): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append('image', file);

  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // NOTE: do NOT set Content-Type — the browser sets the multipart boundary.

  const res = await fetch(`${API_URL}/uploads/image`, {
    method: 'POST',
    headers,
    body: formData,
    signal: AbortSignal.timeout(30000),
  });
  return handleResponse<UploadImageResult>(res);
}

// ─── Cloudinary Image Upload (legacy, unused) ──────────────────────────────────

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

/**
 * Upload an image to Cloudinary using unsigned upload.
 * Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
 */
export async function uploadImageToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local',
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'ecommerce/products');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || 'Cloudinary upload failed');
  }

  return res.json();
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'admin';
  };
}

export async function registerUser(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  return handleResponse<AuthResponse>(res);
}
