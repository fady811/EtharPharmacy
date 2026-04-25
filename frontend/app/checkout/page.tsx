'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderSummary } from '@/components/features/OrderSummary';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, ArrowLeft, AlertTriangle } from 'lucide-react';
import { OrderFormData } from '@/types';
import { ordersService } from '@/services/orders';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalItems, getTotalPrice, clearCart, updateQuantity, removeItem } = useCartStore();
  const addToast = useToastStore((state) => state.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => uuidv4());
  const [submittedOrderId, setSubmittedOrderId] = useState<number | null>(null);

  const [formData, setFormData] = useState<OrderFormData>({
    name: '',
    phone: '',
    address: '',
    email: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Please enter a complete address';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (items.length === 0) {
      newErrors.cart = 'Your cart is empty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;
    
    if (isSubmitting || submittedOrderId !== null) {
      return; // Prevent multiple submissions
    }

    setIsSubmitting(true);

    try {
      const response = await ordersService.createOrder(formData, items, idempotencyKey);

      if (response.data) {
        setOrderNumber(response.data.order_number || `ORD-${response.data.id}`);
        setSubmittedOrderId(response.data.id);
      } else {
        setOrderNumber(`ORD-${Date.now()}`);
      }

      setOrderSuccess(true);
      clearCart();
      addToast({ message: 'Order placed successfully!', type: 'success', duration: 5000 });
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        // Handle stock validation errors
        const stockErrors = error.response.data.errors;
        let errorMessage = 'Some items are out of stock:\n';
        
        stockErrors.forEach((stockError: any) => {
          errorMessage += `\n• ${stockError.product_name}: ${stockError.available} available (requested: ${stockError.requested})`;
          
          // Update cart quantity to match available stock
          if (stockError.available > 0) {
            updateQuantity(stockError.product_id, stockError.available, stockError.variation_id);
          } else {
            removeItem(stockError.product_id, stockError.variation_id);
          }
        });
        
        setSubmitError(errorMessage);
        addToast({ 
          message: 'Cart updated to reflect available stock', 
          type: 'info', 
          duration: 5000 
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
        setSubmitError(errorMessage);
        addToast({ message: errorMessage, type: 'error', duration: 5000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setSubmitError(null);
  };

  const handleQuantityChange = (productId: number, newQuantity: number, variationId?: number) => {
    if (newQuantity <= 0) {
      removeItem(productId, variationId);
    } else {
      updateQuantity(productId, newQuantity, variationId);
    }
  };

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="section">
        <div className="container-custom">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products before checkout</p>
            <Link href="/products">
              <Button size="lg">
                Browse Products
                <ArrowLeft className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="section">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-md p-12 text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-2">Your order has been received and is being processed.</p>
            <p className="text-gray-600 mb-6">
              Order Number: <span className="font-bold text-primary-600">{orderNumber}</span>
            </p>
            <Link href="/products">
              <Button size="lg">
                Continue Shopping
                <ArrowLeft className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container-custom">
        <Link href="/cart" className="text-primary-600 hover:text-primary-700 mb-6 inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Shipping Information</h2>

              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                >
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Order Failed</p>
                    <p className="text-sm text-red-600 mt-1">{submitError}</p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4">
                <Input
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />

                <Input
                  label="Phone Number *"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={errors.phone}
                  placeholder="+1 234 567 8900"
                  disabled={isSubmitting}
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  placeholder="john@example.com"
                  disabled={isSubmitting}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street, Apt 4B, New York, NY 10001"
                    rows={3}
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border bg-white px-4 py-2 text-gray-900 shadow-sm
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special instructions for your order..."
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
                      disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-6"
                loading={isSubmitting}
                disabled={isSubmitting || items.length === 0 || submittedOrderId !== null}
              >
                {submittedOrderId ? 'Order Placed' : isSubmitting ? 'Placing Order...' : 'Place Order'}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary 
              showCheckoutButton={false}
              showShippingInfo={true}
              className="sticky top-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
