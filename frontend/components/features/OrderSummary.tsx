'use client';

import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { getUnitPrice, getOriginalPrice, calculateLineTotal, calculateDiscount, hasValidDiscount } from '@/lib/pricing';
import { Button } from '@/components/ui/Button';
import { Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface OrderSummaryProps {
  showCheckoutButton?: boolean;
  showShippingInfo?: boolean;
  className?: string;
}

export function OrderSummary({ 
  showCheckoutButton = true, 
  showShippingInfo = true,
  className = "" 
}: OrderSummaryProps) {
  const { items, getTotalItems, getTotalPrice } = useCartStore();
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  
  const shippingCost = 0; // Free shipping
  const finalTotal = totalPrice + shippingCost;

  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Your cart is empty</p>
          <Link href="/products">
            <Button size="sm" className="mt-4">
              Browse Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {items.map((item) => {
          // Use utility functions for consistent price logic
          const unitPrice = getUnitPrice(item.product);
          const originalPrice = getOriginalPrice(item.product);
          const itemTotal = calculateLineTotal(item.product, item.quantity);
          const originalTotal = originalPrice * item.quantity;
          const hasDiscount = hasValidDiscount(item.product);
          const discountAmount = calculateDiscount(item.product);
          
          return (
            <div key={item.product.id} className="pb-3 border-b border-gray-100 last:border-0">
              <div className="flex gap-3 mb-2">
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.quantity} × {formatPrice(unitPrice)} = {formatPrice(itemTotal)}
                  </p>
                  {hasDiscount && (
                    <p className="text-xs text-green-600 font-medium">
                      Save {formatPrice(discountAmount * item.quantity)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatPrice(itemTotal)}</p>
                  {hasDiscount && (
                    <p className="text-xs text-gray-400 line-through">
                      {formatPrice(originalTotal)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Breakdown */}
      <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal ({totalItems} items)</span>
          <span className="font-medium">{formatPrice(totalPrice)}</span>
        </div>
        
        {showShippingInfo && (
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-green-600">
              {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
            </span>
          </div>
        )}
      </div>

      {/* Final Total */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between">
          <span className="text-lg font-bold">Total</span>
          <span className="text-lg font-bold text-primary-600">{formatPrice(finalTotal)}</span>
        </div>
      </div>

      {/* Shipping Info */}
      {showShippingInfo && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Free Delivery</p>
              <p className="text-sm text-blue-700">
                Estimated delivery: 2-3 business days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      {showCheckoutButton && (
        <Link href="/checkout">
          <Button size="lg" className="w-full">
            Proceed to Checkout
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      )}
    </div>
  );
}
