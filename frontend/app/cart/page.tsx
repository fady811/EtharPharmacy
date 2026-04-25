'use client';

import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { QuantityController } from '@/components/ui/QuantityController';
import { OrderSummary } from '@/components/features/OrderSummary';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { pricesService } from '@/services/prices';

export default function CartPage() {
  const { items, updateQuantity, updateItemPrices, removeItem, getTotalItems, getTotalPrice, clearCart, _hasHydrated } = useCartStore();
  const addToast = useToastStore((state) => state.addToast);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleQuantityChange = async (productId: number, newQuantity: number, productName: string) => {
    const itemKey = `${productId}-default`;
    
    // Add to updating set
    setUpdatingItems(prev => new Set(prev).add(itemKey));
    
    try {
      if (newQuantity <= 0) {
        removeItem(productId);
        addToast({ message: `${productName} removed from cart`, type: 'info' });
      } else {
        updateQuantity(productId, newQuantity);
        addToast({ message: `Cart updated`, type: 'success', duration: 2000 });
      }
    } catch (error) {
      addToast({ message: 'Action failed — your cart has been restored', type: 'error' });
    } finally {
      // Remove from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (productId: number, productName: string) => {
    const itemKey = `${productId}-default`;
    
    // Add to updating set
    setUpdatingItems(prev => new Set(prev).add(itemKey));
    
    try {
      removeItem(productId);
      addToast({ message: `${productName} removed from cart`, type: 'info' });
    } catch (error) {
      addToast({ message: 'Action failed — your cart has been restored', type: 'error' });
    } finally {
      // Remove from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      addToast({ message: 'Cart cleared', type: 'info' });
    }
  };

  // Check for price changes when cart is hydrated
  useEffect(() => {
    if (_hasHydrated && items.length > 0) {
      const productIds = [...new Set(items.map(item => item.product.id))];
      
      pricesService.getCurrentPrices(productIds)
        .then(response => {
          if (response.success) {
            const currentPrices = response.data.prices;
            
            items.forEach(item => {
              const productId = item.product.id.toString();
              const priceInfo = currentPrices[productId];
              if (!priceInfo) return;

              const cartPrice = item.product.final_price.toString();
              const priceChanged = priceInfo.current_price !== cartPrice;
              const stockChanged = priceInfo.stock_quantity !== item.product.stock_quantity;

              // Always sync stock (and price) from backend — never rely on stale local state
              if (priceChanged || stockChanged) {
                updateItemPrices(
                  item.product.id,
                  priceInfo.original_price,
                  priceInfo.current_price,
                  priceInfo.stock_quantity
                );
              }
            });
          }
        })
        .catch(error => {
          console.error('Failed to check current prices:', error);
        });
    }
  }, [_hasHydrated]); // Remove items from dependency to prevent re-render loops

  if (!_hasHydrated) {
    return (
      <div className="section">
        <div className="container-custom">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="section">
        <div className="container-custom">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started</p>
            <Link href="/products">
              <Button size="lg">
                Browse Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container-custom">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex gap-4">
                    <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product.primary_image ? (
                        <Image
                          src={item.product.primary_image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex-grow">
                      <Link href={`/products/${item.product.id}`}>
                        <h3 className="text-lg font-semibold hover:text-primary-600 transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500">{item.product.category_name}</p>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">
                          {item.quantity} × {formatPrice(item.product.final_price)} = {formatPrice(parseFloat(item.product.final_price) * item.quantity)}
                        </p>
                        {parseFloat(item.product.price) > parseFloat(item.product.final_price) && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatPrice(parseFloat(item.product.price))} each
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-primary-600">
                        {formatPrice(parseFloat(item.product.final_price) * item.quantity)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700 font-medium text-sm">Quantity:</span>
                      <div className="flex flex-col gap-1">
                        <QuantityController
                          quantity={item.quantity}
                          onIncrease={() =>
                            handleQuantityChange(item.product.id, item.quantity + 1, item.product.name)
                          }
                          onDecrease={() =>
                            handleQuantityChange(item.product.id, item.quantity - 1, item.product.name)
                          }
                          min={0}
                          max={item.product.stock_quantity}
                          disabled={updatingItems.has(`${item.product.id}-default`)}
                        />
                        {item.quantity >= item.product.stock_quantity && (
                          <span className="text-[10px] text-red-500 font-medium">
                            Max stock reached
                          </span>
                        )}
                      </div>

                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.product.id, item.product.name)}
                      disabled={updatingItems.has(`${item.product.id}-default`)}
                      className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingItems.has(`${item.product.id}-default`) ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {items.length > 1 && (
              <Button variant="outline" onClick={handleClearCart} className="w-full">
                Clear Cart
              </Button>
            )}
          </div>

          <div className="lg:col-span-1">
            <OrderSummary 
              showCheckoutButton={true}
              showShippingInfo={true}
              className="sticky top-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
