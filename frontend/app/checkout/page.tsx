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

const stepLabels = ['Shipping', 'Payment', 'Confirmation'];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cartTotal, clearCart } = useCartContext();
  const { user, token } = useAuthContext();
  const [step, setStep] = useState<Step>(1);
  const [orderId, setOrderId] = useState(() => `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  const [placedTotal, setPlacedTotal] = useState(0);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isRealOrder, setIsRealOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingAddress>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });

  const [payment, setPayment] = useState<PaymentData>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  });

  const [shippingErrors, setShippingErrors] = useState<Partial<ShippingAddress>>({});
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentData>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (step === 3) {
      clearCart();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Please sign in to checkout</h2>
            <Link href="/auth/login" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Sign In
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0 && step !== 3) {
    router.push('/cart');
    return null;
  }

  const shippingCost = cartTotal >= 100 ? 0 : 9.99;
  const orderTotal = cartTotal + shippingCost;

  const validateShipping = (): boolean => {
    const errors: Partial<ShippingAddress> = {};
    if (!shipping.firstName.trim()) errors.firstName = 'Required';
    if (!shipping.lastName.trim()) errors.lastName = 'Required';
    if (!shipping.address.trim()) errors.address = 'Required';
    if (!shipping.city.trim()) errors.city = 'Required';
    if (!shipping.state.trim()) errors.state = 'Required';
    if (!shipping.zip.trim()) errors.zip = 'Required';
    if (!shipping.country.trim()) errors.country = 'Required';
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = (): boolean => {
    const errors: Partial<PaymentData> = {};
    if (!payment.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) errors.cardNumber = 'Invalid card number';
    if (!payment.expiry.match(/^\d{2}\/\d{2}$/)) errors.expiry = 'Use MM/YY format';
    if (!payment.cvv.match(/^\d{3,4}$/)) errors.cvv = 'Invalid CVV';
    if (!payment.nameOnCard.trim()) errors.nameOnCard = 'Required';
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping()) setStep(2);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayment()) return;
    setIsProcessing(true);
    setOrderError(null);
    try {
      if (token && !token.startsWith('mock_')) {
        // Real checkout — backend converts the cart into a paid order.
        const created = await checkout(
          {
            shippingAddress: shipping,
            payment,
            shippingCost,
          },
          token,
        );
        setOrderId(String(created.id));
        setPlacedOrder(created);
        setIsRealOrder(true);
      } else {
        // Demo mode — simulate payment and build a local confirmation.
        await new Promise((r) => setTimeout(r, 1200));
        setPlacedOrder({
          id: orderId,
          status: 'pending',
          totalAmount: orderTotal,
          createdAt: new Date().toISOString(),
          shippingAddress: shipping,
          items: items.map((i) => ({
            product: i.product,
            quantity: i.quantity,
            priceAtPurchase: i.product.price,
          })),
        });
        setIsRealOrder(false);
      }
      setPlacedTotal(orderTotal);
      setStep(3);
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : 'Payment failed. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

          {/* Step indicator */}
          <div className="flex items-center justify-center mb-8">
            {stepLabels.map((label, idx) => {
              const stepNum = (idx + 1) as Step;
              const isCompleted = step > stepNum;
              const isCurrent = step === stepNum;
              return (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-indigo-600 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : stepNum}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-4 ${step > stepNum ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1: Shipping */}
          {step === 1 && (
            <form onSubmit={handleShippingSubmit}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['firstName', 'lastName'] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {field === 'firstName' ? 'First Name' : 'Last Name'} *
                      </label>
                      <input
                        type="text"
                        value={shipping[field]}
                        onChange={(e) => setShipping({ ...shipping, [field]: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${shippingErrors[field] ? 'border-red-300' : 'border-gray-300'}`}
                      />
                      {shippingErrors[field] && <p className="text-xs text-red-500 mt-1">{shippingErrors[field]}</p>}
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      value={shipping.address}
                      onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${shippingErrors.address ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {shippingErrors.address && <p className="text-xs text-red-500 mt-1">{shippingErrors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={shipping.city}
                      onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${shippingErrors.city ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {shippingErrors.city && <p className="text-xs text-red-500 mt-1">{shippingErrors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      value={shipping.state}
                      onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${shippingErrors.state ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {shippingErrors.state && <p className="text-xs text-red-500 mt-1">{shippingErrors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <input
                      type="text"
                      value={shipping.zip}
                      onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${shippingErrors.zip ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {shippingErrors.zip && <p className="text-xs text-red-500 mt-1">{shippingErrors.zip}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      value={shipping.country}
                      onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${shippingErrors.country ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {shippingErrors.country && <p className="text-xs text-red-500 mt-1">{shippingErrors.country}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Link href="/cart" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                  Back to Cart
                </Link>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">
                  Continue to Payment
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <form onSubmit={handlePaymentSubmit}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">Payment Details</h2>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    Test Mode
                  </span>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-5 text-sm text-blue-700">
                  <strong>Test Mode</strong> — Use card number <code className="font-mono">4242 4242 4242 4242</code> with any expiry and CVV.
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                    <input
                      type="text"
                      value={payment.cardNumber}
                      onChange={(e) => setPayment({ ...payment, cardNumber: formatCardNumber(e.target.value) })}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${paymentErrors.cardNumber ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {paymentErrors.cardNumber && <p className="text-xs text-red-500 mt-1">{paymentErrors.cardNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card *</label>
                    <input
                      type="text"
                      value={payment.nameOnCard}
                      onChange={(e) => setPayment({ ...payment, nameOnCard: e.target.value })}
                      placeholder="John Smith"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${paymentErrors.nameOnCard ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {paymentErrors.nameOnCard && <p className="text-xs text-red-500 mt-1">{paymentErrors.nameOnCard}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry *</label>
                      <input
                        type="text"
                        value={payment.expiry}
                        onChange={(e) => setPayment({ ...payment, expiry: formatExpiry(e.target.value) })}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${paymentErrors.expiry ? 'border-red-300' : 'border-gray-300'}`}
                      />
                      {paymentErrors.expiry && <p className="text-xs text-red-500 mt-1">{paymentErrors.expiry}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                      <input
                        type="text"
                        value={payment.cvv}
                        onChange={(e) => setPayment({ ...payment, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        placeholder="123"
                        maxLength={4}
                        className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${paymentErrors.cvv ? 'border-red-300' : 'border-gray-300'}`}
                      />
                      {paymentErrors.cvv && <p className="text-xs text-red-500 mt-1">{paymentErrors.cvv}</p>}
                    </div>
                  </div>
                </div>

                {/* Order summary */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className={shippingCost === 0 ? 'text-green-600' : ''}>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                      <span>Total</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {orderError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {orderError}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : 'Place Order'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
              <p className="text-gray-500 mb-4">Thank you for your order, {user.firstName}! Your order has been placed successfully.</p>
              <div className="inline-flex flex-col items-center gap-2 bg-indigo-50 rounded-lg px-5 py-3 mb-6">
                <div className="text-center">
                  <p className="text-sm text-indigo-600 font-medium">Order ID</p>
                  <p className="text-lg font-bold text-indigo-800">
                    {isRealOrder ? `#${orderId.slice(-8).toUpperCase()}` : orderId}
                  </p>
                </div>
                <OrderStatusBadge status={placedOrder?.status ?? 'pending'} />
              </div>

              {/* Items */}
              {placedOrder && placedOrder.items.length > 0 && (
                <div className="text-left max-w-md mx-auto mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">Items</h3>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {placedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-400">Qty {item.quantity} × ${item.priceAtPurchase.toFixed(2)}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping */}
              <div className="text-left max-w-md mx-auto mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Shipping to</h3>
                <p className="text-sm text-gray-600">{shipping.firstName} {shipping.lastName}</p>
                <p className="text-sm text-gray-600">{shipping.address}</p>
                <p className="text-sm text-gray-600">{shipping.city}, {shipping.state} {shipping.zip}</p>
                <p className="text-sm text-gray-600">{shipping.country}</p>
              </div>

              <div className="mb-6">
                <p className="text-lg font-bold text-gray-900">Total Charged: ${placedTotal.toFixed(2)}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {isRealOrder && (
                  <Link href={`/orders/${orderId}`} className="px-6 py-3 border border-indigo-200 text-indigo-700 rounded-xl font-medium hover:bg-indigo-50 transition-colors text-sm">
                    View Order Details
                  </Link>
                )}
                <Link href="/orders" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                  View Orders
                </Link>
                <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
