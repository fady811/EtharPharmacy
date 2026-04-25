'use client';

import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { QuantityController } from '../ui/QuantityController';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const cartQuantity = useCartStore((state) => state.getItemQuantity(product.id));
  const addToast = useToastStore((state) => state.addToast);
  const [mounted, setMounted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isInCart = mounted ? cartQuantity > 0 : false;

  const handleAddToCart = useCallback(
    debounce(async () => {
      if (isAdding || !product.has_stock) return;
      
      setIsAdding(true);
      try {
        // For products from list view, we need to fetch the detail to get variations
        // If product has no variations in the list, we'll add without variation
        // The order service will handle finding the first available variation
        addItem(product, 1);
        addToast({ message: `${product.name} added to cart`, type: 'success' });
      } catch (error) {
        addToast({ message: 'Failed to add to cart', type: 'error' });
      } finally {
        setIsAdding(false);
      }
    }, 300),
    [product, addItem, addToast, isAdding]
  );

  const handleIncrease = useCallback(
    debounce(async () => {
      if (isUpdating) return;
      
      setIsUpdating(true);
      try {
        updateQuantity(product.id, cartQuantity + 1);
      } catch (error) {
        addToast({ message: 'Failed to update quantity', type: 'error' });
      } finally {
        setIsUpdating(false);
      }
    }, 300),
    [product.id, cartQuantity, updateQuantity, addToast, isUpdating]
  );

  const handleDecrease = useCallback(
    debounce(async () => {
      if (isUpdating) return;
      
      setIsUpdating(true);
      try {
        if (cartQuantity <= 1) {
          removeItem(product.id);
          addToast({ message: `${product.name} removed from cart`, type: 'info' });
        } else {
          updateQuantity(product.id, cartQuantity - 1);
        }
      } catch (error) {
        addToast({ message: 'Failed to update quantity', type: 'error' });
      } finally {
        setIsUpdating(false);
      }
    }, 300),
    [product.id, cartQuantity, updateQuantity, removeItem, addToast, isUpdating]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {product.primary_image ? (
            <Image
              src={product.primary_image}
              alt={product.name}
              fill
              className="object-cover hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
          {product.featured && (
            <Badge variant="warning" className="absolute top-2 right-2">
              Featured
            </Badge>
          )}
          {product.is_on_sale && (
            <Badge variant="danger" className="absolute top-2 left-2">
              -{product.discount_percentage}%
            </Badge>
          )}
          {!product.has_stock && (
            <Badge variant="default" className="absolute top-2 left-2">
              Out of Stock
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-500 mt-1">{product.category_name}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary-600">
              {formatPrice(product.final_price)}
            </span>
            {parseFloat(product.price) > parseFloat(product.final_price) && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}

          </div>
        </div>

        {/* Add to Cart / Quantity Controller */}
        {product.has_stock && (
          <div className="mt-4 h-[40px] flex items-center">
            <AnimatePresence mode="wait">
              {!isInCart ? (
                <motion.div
                  key="add-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="w-full"
                >
                  <Button
                    onClick={handleAddToCart}
                    className="w-full"
                    size="sm"
                    loading={isAdding}
                    disabled={isAdding || !product.has_stock || cartQuantity >= product.stock_quantity}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {cartQuantity >= product.stock_quantity ? 'Limit Reached' : 'Add to Cart'}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="qty-ctrl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="w-full flex flex-col items-center gap-1"
                >
                  <QuantityController
                    quantity={cartQuantity}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                    min={0}
                    max={product.stock_quantity}
                    size="sm"
                    disabled={isUpdating}
                  />
                  {cartQuantity >= product.stock_quantity && (
                    <span className="text-[10px] text-red-500 font-medium leading-none">
                      Max stock reached
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </motion.div>
  );
}
