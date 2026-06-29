'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/api';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(form.password)) {
      newErrors.password = 'Password must include an uppercase letter and a number';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      await registerUser({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      router.push('/auth/login?registered=true');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fields: { key: keyof FormData; label: string; type: string; placeholder: string }[] = [
    { key: 'firstName', label: 'First Name', type: 'text', placeholder: 'John' },
    { key: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Smith' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'password' },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'confirm password' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex-col justify-between px-16 py-14 text-white relative overflow-hidden">
        {/* Brand */}
        <Link href="/" className="font-black text-3xl bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent tracking-tight">
          ShopNext
        </Link>

        {/* Product showcase */}
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {[
              { emoji: '💻', name: 'Electronics', price: '$299', color: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30' },
              { emoji: '👗', name: 'Clothing', price: '$49', color: 'from-violet-500/20 to-pink-500/20', border: 'border-violet-500/30' },
              { emoji: '📚', name: 'Books', price: '$19', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30' },
              { emoji: '🏡', name: 'Home & Garden', price: '$89', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30' },
            ].map((item) => (
              <div key={item.name} className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-4 backdrop-blur-sm`}>
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="text-white font-semibold text-sm">{item.name}</p>
                <p className="text-white/60 text-xs mt-0.5">From {item.price}</p>
                <div className="mt-2 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-2.5 h-2.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <p className="text-indigo-200 text-lg font-light mb-6">Join thousands of happy shoppers</p>
          <div className="space-y-4">
            {[
              { icon: '🚚', text: 'Free shipping on orders $100+' },
              { icon: '↩️', text: '30-day easy returns' },
              { icon: '🔒', text: 'Secure & encrypted payments' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-base shrink-0">
                  {feature.icon}
                </div>
                <span className="text-sm text-indigo-100 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="font-black text-2xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              ShopNext
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create account</h1>
              <p className="text-gray-500 text-sm mt-1">Join ShopNext today</p>
            </div>

            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* First & Last name side by side */}
              <div className="grid grid-cols-2 gap-4">
                {(['firstName', 'lastName'] as const).map((key) => {
                  const field = fields.find((f) => f.key === key)!;
                  return (
                    <div key={key}>
                      <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1.5">
                        {field.label}
                      </label>
                      <input
                        id={key}
                        type={field.type}
                        value={form[key]}
                        onChange={(e) => update(key, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                      />
                      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                    </div>
                  );
                })}
              </div>

              {(['email', 'password', 'confirmPassword'] as const).map((key) => {
                const field = fields.find((f) => f.key === key)!;
                return (
                  <div key={key}>
                    <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      id={key}
                      type={field.type}
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={field.placeholder}
                      autoComplete={key === 'email' ? 'email' : key === 'password' ? 'new-password' : 'new-password'}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    />
                    {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                  </div>
                );
              })}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-6">
              {'Already have an account? '}
              <Link href="/auth/login" className="text-indigo-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
