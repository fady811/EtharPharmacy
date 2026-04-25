'use client';

import { useParams } from 'next/navigation';
import { useProduct } from '@/hooks/useProduct';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToastStore } from '@/store/toastStore';
import { AnimatePresence } from 'framer-motion';
import { QuantityController } from '@/components/ui/QuantityController';

export default function ProductDetailPage() {
  const params = useParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const productId = idParam ? parseInt(idParam) : null;
  const { product, loading, error } = useProduct(productId);
  const [selectedImage, setSelectedImage] = useState(0);

  // Subscribe directly to items so cartQuantity is always reactive
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const { addToast } = useToastStore();

  const [mounted, setMounted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive cartQuantity directly from items — always fresh, no stale closure issues
  const cartQuantity = product
    ? (items.find((i) => i.product.id === product.id)?.quantity ?? 0)
    : 0;
  const isInCart = mounted && cartQuantity > 0;
  const maxStock = product?.stock_quantity ?? 0;
  const atStockLimit = cartQuantity >= maxStock;

  const handleAddToCart = () => {
    if (!product || isAdding || atStockLimit) return;
    setIsAdding(true);
    try {
      addItem(product, 1);
      addToast({ message: `${product.name} added to cart!`, type: 'success' });
    } catch {
      addToast({ message: 'Failed to add to cart', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrease = () => {
    if (!product || atStockLimit) return;
    updateQuantity(product.id, cartQuantity + 1);
  };

  const handleDecrease = () => {
    if (!product) return;
    if (cartQuantity <= 1) {
      removeItem(product.id);
      addToast({ message: `${product.name} removed from cart`, type: 'info' });
    } else {
      updateQuantity(product.id, cartQuantity - 1);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error || !product) {
    return (
      <div className="section">
        <div className="container-custom">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Product not found'}
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="section">
      <div className="container-custom">
        <Link href="/products" className="text-primary-600 hover:text-primary-700 mb-6 inline-block">
          ← Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-96 bg-gray-100">
                {product.images[selectedImage] ? (
                  <Image
                    src={product.images[selectedImage].image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Image
                  </div>
                )}
                {parseFloat(product.price) > parseFloat(product.final_price) && (
                  <Badge variant="danger" className="absolute top-4 left-4">
                    {product.discount_percentage}% OFF
                  </Badge>
                )}
                {product.featured && (
                  <Badge variant="warning" className="absolute top-4 right-4">
                    Featured
                  </Badge>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={image.thumbnail_url}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="info">{product.category.name}</Badge>
                {product.subcategory && (
                  <Badge variant="default">{product.subcategory.name}</Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-primary-600">
                  {formatPrice(product.final_price)}
                </span>
                {parseFloat(product.price) > parseFloat(product.final_price) && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                    <Badge variant="danger">
                      {product.discount_percentage}% OFF
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mb-6">
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    <span>In Stock ({product.stock_quantity} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-1" />
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>

              {product.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )}

              
              {product.stock_quantity > 0 && (
                <div className="space-y-4">
                  <div className="h-[48px] flex items-center">
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
                            size="lg"
                            className="w-full"
                            loading={isAdding}
                            disabled={isAdding || atStockLimit}
                          >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            {atStockLimit
                              ? 'Stock Limit Reached'
                              : `Add to Cart - ${formatPrice(product.final_price)}`
                            }
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="qty-ctrl"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className="w-full"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <span className="text-gray-700 font-medium whitespace-nowrap">In Cart:</span>
                              <div className="flex-grow flex justify-center">
                                <QuantityController
                                  quantity={cartQuantity}
                                  onIncrease={handleIncrease}
                                  onDecrease={handleDecrease}
                                  min={0}
                                  max={maxStock}
                                  size="md"
                                />
                              </div>
                              <span className="text-primary-600 font-bold whitespace-nowrap">
                                {formatPrice(parseFloat(product.final_price) * cartQuantity)}
                              </span>
                            </div>
                            {atStockLimit && (
                              <span className="text-xs text-red-500 font-medium text-center">
                                Max available stock reached
                              </span>
                            )}
                          </div>
                        </motion.div>

                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 font-medium">{product.category.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(product.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
