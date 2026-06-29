'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);

    router.push('/auth/login?registered=true');
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex-col justify-center px-16 text-white relative overflow-hidden">
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full border-[40px] border-violet-700/30 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border-[30px] border-indigo-700/20 pointer-events-none" />
        <div className="relative z-10">
          <Link href="/" className="font-black text-3xl bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent tracking-tight">
            ShopNext
          </Link>
          <p className="text-indigo-200 mt-3 text-lg font-light">Your premium shopping destination</p>
          <div className="mt-12 space-y-6">
            {[
              'Free shipping on orders $100+',
              '30-day easy returns',
              'Secure & encrypted payments',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-indigo-100 font-medium">{feature}</span>
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
