'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartContext } from '@/context/CartContext';
import { useAuthContext } from '@/context/AuthContext';
import { ShippingAddress, Order } from '@/lib/types';
import { checkout } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OrderStatusBadge from '@/components/OrderStatusBadge';

type Step = 1 | 2 | 3;

interface PaymentData {
  cardNumber: string;
  expiry: string;
  cvv: string;
  nameOnCard: string;
}

const STEPS = [
  { label: 'Shipping', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { label: 'Payment', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )},
  { label: 'Confirmed', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
];

const inputCls = (err?: string) =>
  `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
    err ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
  }`;

const selectCls = (err?: string) =>
  `w-full px-3 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-colors ${
    err ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
  }`;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartTotal, clearCart } = useCartContext();
  const { user, token } = useAuthContext();

  const [step, setStep]           = useState<Step>(1);
  const [orderId, setOrderId]     = useState(() => `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  const [placedTotal, setPlacedTotal]   = useState(0);
  const [placedOrder, setPlacedOrder]   = useState<Order | null>(null);
  const [isRealOrder, setIsRealOrder]   = useState(false);
  const [orderError, setOrderError]     = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [shipping, setShipping] = useState<ShippingAddress>({
    firstName: user?.firstName ?? '', lastName: user?.lastName ?? '',
    address: '', city: '', state: '', zip: '', country: 'United States',
  });
  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingAddress>>({});

  const [payment, setPayment] = useState<PaymentData>({ cardNumber: '', expiry: '', cvv: '', nameOnCard: '' });
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentData>>({});
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear,  setExpiryYear]  = useState('');

  const currentYear  = new Date().getFullYear();
  const expiryYears  = Array.from({ length: 12 }, (_, i) => currentYear + i);
  const expiryMonths = [
    { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' },
    { value: '03', label: 'Mar' }, { value: '04', label: 'Apr' },
    { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' },
    { value: '09', label: 'Sep' }, { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
  ];

  const handleExpiryChange = (month: string, year: string) => {
    const yy = year ? String(year).slice(-2) : '';
    setPayment((p) => ({ ...p, expiry: month && yy ? `${month}/${yy}` : '' }));
  };

  const shippingCost = cartTotal >= 100 ? 0 : 9.99;
  const orderTotal   = cartTotal + shippingCost;

  useEffect(() => { if (step === 3) clearCart(); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateShipping = (): boolean => {
    const e: Partial<ShippingAddress> = {};
    if (!shipping.firstName.trim()) e.firstName = 'Required';
    if (!shipping.lastName.trim())  e.lastName  = 'Required';
    if (!shipping.address.trim())   e.address   = 'Required';
    if (!shipping.city.trim())      e.city      = 'Required';
    if (!shipping.state.trim())     e.state     = 'Required';
    if (!shipping.zip.trim())       e.zip       = 'Required';
    if (!shipping.country.trim())   e.country   = 'Required';
    setShippingErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = (): boolean => {
    const e: Partial<PaymentData> = {};
    if (!payment.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) e.cardNumber = 'Enter a valid 16-digit card number';
    if (!payment.expiry.match(/^\d{2}\/\d{2}$/))                  e.expiry     = 'Select month and year';
    if (!payment.cvv.match(/^\d{3,4}$/))                          e.cvv        = 'Enter a valid CVV';
    if (!payment.nameOnCard.trim())                               e.nameOnCard = 'Required';
    setPaymentErrors(e);
    return Object.keys(e).length === 0;
  };

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayment()) return;
    setIsProcessing(true); setOrderError(null);
    try {
      if (token && !token.startsWith('mock_')) {
        const created = await checkout({ shippingAddress: shipping, payment, shippingCost }, token);
        setOrderId(String(created.id)); setPlacedOrder(created); setIsRealOrder(true);
      } else {
        await new Promise((r) => setTimeout(r, 1400));
        setPlacedOrder({
          id: orderId, status: 'pending', totalAmount: orderTotal,
          createdAt: new Date().toISOString(), shippingAddress: shipping,
          items: items.map((i) => ({ product: i.product, quantity: i.quantity, priceAtPurchase: i.product.price })),
        });
        setIsRealOrder(false);
      }
      setPlacedTotal(orderTotal); setStep(3);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally { setIsProcessing(false); }
  };

  if (!user) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in to checkout</h2>
          <p className="text-sm text-gray-500 mb-6">You need an account to complete your purchase.</p>
          <Link href="/auth/login" className="block w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm text-center">
            Sign In
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (items.length === 0 && step !== 3) { router.push('/cart'); return null; }

  /* ── Step indicator ─────────────────────────────────────────────────────── */
  const StepBar = () => (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map(({ label, icon }, idx) => {
        const num = (idx + 1) as Step;
        const done    = step > num;
        const current = step === num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                done    ? 'bg-emerald-500 text-white shadow-sm' :
                current ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' :
                          'bg-gray-100 text-gray-400'
              }`}>
                {done
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  : icon
                }
              </div>
              <span className={`text-xs mt-1.5 font-semibold ${current ? 'text-indigo-600' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-16 sm:w-28 h-0.5 mx-3 mb-5 rounded-full transition-all duration-500 ${step > num ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── Order summary sidebar ──────────────────────────────────────────────── */
  const OrderSummary = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h3>

      <div className="space-y-3 mb-5">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="relative shrink-0">
              <img src={item.product.imageUrl} alt={item.product.name}
                className="w-12 h-12 rounded-xl object-cover bg-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
              <p className="text-xs text-gray-400">${item.product.price.toFixed(2)} each</p>
            </div>
            <span className="text-sm font-semibold text-gray-900 shrink-0">
              ${(item.product.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Shipping</span>
          <span className={shippingCost === 0 ? 'text-emerald-600 font-medium' : ''}>
            {shippingCost === 0 ? '🎉 Free' : `$${shippingCost.toFixed(2)}`}
          </span>
        </div>
        {shippingCost > 0 && (
          <p className="text-xs text-gray-400">Free shipping on orders over $100</p>
        )}
        <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>${orderTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  /* ── Field helper ───────────────────────────────────────────────────────── */
  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
            <p className="text-sm text-gray-400 mt-1">Complete your purchase securely</p>
          </div>

          <StepBar />

          {/* ── Step 1 & 2 two-col layout ────────────────────────────────── */}
          {step !== 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">

                {/* STEP 1 — Shipping */}
                {step === 1 && (
                  <form onSubmit={(e) => { e.preventDefault(); if (validateShipping()) setStep(2); }}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 mb-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(['firstName', 'lastName'] as const).map((f) => (
                          <Field key={f} label={f === 'firstName' ? 'First Name *' : 'Last Name *'} error={shippingErrors[f]}>
                            <input type="text" value={shipping[f]}
                              onChange={(e) => setShipping({ ...shipping, [f]: e.target.value })}
                              className={inputCls(shippingErrors[f])} />
                          </Field>
                        ))}
                        <div className="sm:col-span-2">
                          <Field label="Street Address *" error={shippingErrors.address}>
                            <input type="text" value={shipping.address} placeholder="123 Main Street"
                              onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                              className={inputCls(shippingErrors.address)} />
                          </Field>
                        </div>
                        <Field label="City *" error={shippingErrors.city}>
                          <input type="text" value={shipping.city}
                            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                            className={inputCls(shippingErrors.city)} />
                        </Field>
                        <Field label="State / Province *" error={shippingErrors.state}>
                          <input type="text" value={shipping.state}
                            onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                            className={inputCls(shippingErrors.state)} />
                        </Field>
                        <Field label="ZIP / Postal Code *" error={shippingErrors.zip}>
                          <input type="text" value={shipping.zip}
                            onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                            className={inputCls(shippingErrors.zip)} />
                        </Field>
                        <Field label="Country *" error={shippingErrors.country}>
                          <input type="text" value={shipping.country}
                            onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                            className={inputCls(shippingErrors.country)} />
                        </Field>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Link href="/cart" className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Cart
                      </Link>
                      <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">
                        Continue to Payment
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2 — Payment */}
                {step === 2 && (
                  <form onSubmit={handlePaymentSubmit}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 mb-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <h2 className="text-lg font-bold text-gray-900">Payment Details</h2>
                        </div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                          Test Mode
                        </span>
                      </div>

                      {/* Test card hint */}
                      <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
                        <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-indigo-700">
                          Use test card <span className="font-mono font-semibold bg-indigo-100 px-1.5 py-0.5 rounded">4242 4242 4242 4242</span> with any future expiry and any CVV.
                        </p>
                      </div>

                      <div className="space-y-5">
                        <Field label="Card Number *" error={paymentErrors.cardNumber}>
                          <div className="relative">
                            <input type="text" value={payment.cardNumber}
                              onChange={(e) => setPayment({ ...payment, cardNumber: formatCardNumber(e.target.value) })}
                              placeholder="4242 4242 4242 4242" maxLength={19}
                              className={`${inputCls(paymentErrors.cardNumber)} font-mono pr-12`} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                          </div>
                        </Field>

                        <Field label="Name on Card *" error={paymentErrors.nameOnCard}>
                          <input type="text" value={payment.nameOnCard} placeholder="John Smith"
                            onChange={(e) => setPayment({ ...payment, nameOnCard: e.target.value })}
                            className={inputCls(paymentErrors.nameOnCard)} />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Expiry Date *" error={paymentErrors.expiry}>
                            <div className="grid grid-cols-2 gap-2">
                              <select value={expiryMonth}
                                onChange={(e) => { setExpiryMonth(e.target.value); handleExpiryChange(e.target.value, expiryYear); }}
                                className={selectCls(paymentErrors.expiry)}>
                                <option value="">Month</option>
                                {expiryMonths.map((m) => (
                                  <option key={m.value} value={m.value}>{m.value} — {m.label}</option>
                                ))}
                              </select>
                              <select value={expiryYear}
                                onChange={(e) => { setExpiryYear(e.target.value); handleExpiryChange(expiryMonth, e.target.value); }}
                                className={selectCls(paymentErrors.expiry)}>
                                <option value="">Year</option>
                                {expiryYears.map((y) => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                            </div>
                          </Field>

                          <Field label="CVV *" error={paymentErrors.cvv}>
                            <div className="relative">
                              <input type="text" value={payment.cvv} placeholder="123" maxLength={4}
                                onChange={(e) => setPayment({ ...payment, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                className={`${inputCls(paymentErrors.cvv)} font-mono pr-10`} />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            </div>
                          </Field>
                        </div>
                      </div>

                      {/* Secure badge */}
                      <div className="flex items-center gap-2 mt-6 pt-5 border-t border-gray-100">
                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p className="text-xs text-gray-400">Your payment information is encrypted and secure.</p>
                      </div>
                    </div>

                    {orderError && (
                      <div className="mb-5 flex items-start gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {orderError}
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button type="button" onClick={() => setStep(1)}
                        className="inline-flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back
                      </button>
                      <button type="submit" disabled={isProcessing}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm shadow-md shadow-indigo-200">
                        {isProcessing ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing…
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Place Order — ${orderTotal.toFixed(2)}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <OrderSummary />
              </div>
            </div>
          )}

          {/* ── Step 3 — Confirmation ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Green header band */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-10 text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Order Confirmed!</h2>
                  <p className="text-emerald-100 mt-1 text-sm">Thank you, {user.firstName}! We've received your order.</p>
                </div>

                <div className="p-8">
                  {/* Order ID + status */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Order ID</p>
                      <p className="text-lg font-bold text-gray-900">
                        #{isRealOrder ? orderId.slice(-8).toUpperCase() : orderId}
                      </p>
                    </div>
                    <OrderStatusBadge status={placedOrder?.status ?? 'pending'} />
                  </div>

                  {/* Items */}
                  {placedOrder && placedOrder.items.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Items Ordered</h3>
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                        {placedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.product.imageUrl} alt={item.product.name}
                              className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Qty {item.quantity} × ${item.priceAtPurchase.toFixed(2)}</p>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total + Shipping side by side */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 font-medium mb-1">Total Charged</p>
                      <p className="text-xl font-black text-gray-900">${placedTotal.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 font-medium mb-1">Shipping To</p>
                      <p className="text-sm font-semibold text-gray-900">{shipping.firstName} {shipping.lastName}</p>
                      <p className="text-xs text-gray-500">{shipping.city}, {shipping.state} {shipping.zip}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {isRealOrder && (
                      <Link href={`/orders/${orderId}`}
                        className="flex-1 text-center px-5 py-3 border border-indigo-200 text-indigo-700 rounded-xl font-medium hover:bg-indigo-50 transition-colors text-sm">
                        View Order Details
                      </Link>
                    )}
                    <Link href="/orders"
                      className="flex-1 text-center px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                      My Orders
                    </Link>
                    <Link href="/"
                      className="flex-1 text-center px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
