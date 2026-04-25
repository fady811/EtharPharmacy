'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { ProductCard } from '@/components/features/ProductCard';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, PageLoading } from '@/components/ui/Loading';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { ArrowRight, Pill, Heart, Truck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const [retryKey, setRetryKey] = useState(0);
  const { products, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({
    featured: true,
    page_size: 8,
  });
  const { categories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useCategories(true);

  const handleRetry = () => {
    setRetryKey(prev => prev + 1);
    refetchProducts();
    refetchCategories();
  };

  if (productsLoading && categoriesLoading) {
    return <PageLoading />;
  }

  return (
    <div>
      {/* Error Banner */}
      {(productsError || categoriesError) && (
        <ErrorBanner
          message={productsError || categoriesError || 'Failed to load data'}
          onRetry={handleRetry}
          onDismiss={() => {/* Keep error visible for critical data */}}
          showRetry={true}
        />
      )}
      
      <section className="relative bg-gradient-to-br from-primary-600 to-accent-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container-custom relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px] py-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl lg:text-6xl font-bold mb-6"
              >
                Your Health, Our Priority
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl mb-8 text-gray-100"
              >
                Quality medicines and healthcare products delivered to your doorstep. Fast, reliable, and affordable.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <Link href="/products">
                  <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/products?category=1">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-600">
                    Browse Medicines
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative"
            >
              <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                  <Pill className="h-64 w-64 text-white opacity-20" />
                </div>
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-8">
                      <p className="text-4xl font-bold mb-2">10,000+</p>
                      <p className="text-lg">Products Available</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: 'Fast Delivery', description: 'Same-day delivery available' },
              { icon: ShieldCheck, title: 'Quality Assured', description: '100% genuine products' },
              { icon: Heart, title: 'Expert Support', description: '24/7 customer service' },
              { icon: Pill, title: 'Wide Range', description: 'Thousands of products' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Browse by Category</h2>
            <p className="text-gray-600 text-lg">Find what you need from our wide range of categories</p>
          </motion.div>

          {categoriesLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link href={`/products?category=${category.id}`}>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                        <Pill className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                      <p className="text-gray-500 text-sm">{category.product_count} products</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600 text-lg">Discover our most popular and recommended products</p>
          </motion.div>

          {productsLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          ) : productsError ? (
            <div className="text-center text-red-600">{productsError}</div>
          ) : (
            <div className="grid-products">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/products">
              <Button size="lg">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
