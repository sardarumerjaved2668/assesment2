'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      if (email === 'admin@store.com') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } else {
      setError(result.error ?? 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex-col justify-between px-16 py-14 text-white relative overflow-hidden">
        {/* Brand */}
        <Link href="/" className="font-black text-3xl bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent tracking-tight">
          ShopNext
        </Link>

        {/* Product showcase grid */}
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
          <p className="text-indigo-200 text-lg font-light mb-6">Your premium shopping destination</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5 text-sm text-indigo-700">
              <p className="font-semibold mb-1">Demo credentials</p>
              <p>Customer: <code className="font-mono text-xs bg-indigo-100 px-1 py-0.5 rounded">customer@store.com</code> / <code className="font-mono text-xs bg-indigo-100 px-1 py-0.5 rounded">Customer123!</code></p>
              <p className="mt-1">Admin: <code className="font-mono text-xs bg-indigo-100 px-1 py-0.5 rounded">admin@store.com</code> / <code className="font-mono text-xs bg-indigo-100 px-1 py-0.5 rounded">Admin123!</code></p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    autoComplete="current-password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-6">
              {"Don't have an account? "}
              <Link href="/auth/register" className="text-indigo-600 font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
