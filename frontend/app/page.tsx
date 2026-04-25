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
      
      <section className="relative bg-gradient-to-br from-blue-600 via-teal-500 to-green-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="container-custom relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[500px] lg:min-h-[600px] py-16 lg:py-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              >
                صيدلية إيثار
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl mb-8 text-gray-100"
              >
                أدوية ومنتجات صحية عالية الجودة تصل لباب بيتك. سريع، موثوق، وبأسعار مناسبة.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <Link href="/products">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    تسوق الآن
                    <ArrowRight className="ml-2 h-5 w-5" />
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
              <div className="relative w-full h-[300px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                  <Pill className="h-32 w-32 lg:h-64 lg:w-64 text-white opacity-20" />
                </div>
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 lg:p-8">
                      <p className="text-3xl sm:text-4xl font-bold mb-2">10,000+</p>
                      <p className="text-base sm:text-lg">منتج متوفر</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: Truck, title: 'توصيل سريع', description: 'توصيل في نفس اليوم متاح' },
              { icon: ShieldCheck, title: 'جودة مضمونة', description: 'منتجات 100% أصلية' },
              { icon: Heart, title: 'دعم متخصص', description: 'خدمة عملاء على مدار الساعة' },
              { icon: Pill, title: 'تشكيلة واسعة', description: 'آلاف المنتجات المتوفرة' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-4 lg:p-6"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <feature.icon className="h-7 w-7 lg:h-8 lg:w-8" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm lg:text-base">{feature.description}</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">تسوق حسب الفئة</h2>
            <p className="text-gray-600 text-base sm:text-lg">ابحث عما تحتاجه من تشكيلتنا الواسعة من الفئات</p>
          </motion.div>

          {categoriesLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                        <Pill className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      </div>
                      <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{category.name}</h3>
                      <p className="text-gray-500 text-xs sm:text-sm">{category.product_count} منتج</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">منتجات مميزة</h2>
            <p className="text-gray-600 text-base sm:text-lg">اكتشف منتجاتنا الأكثر شعبية و الموصى بها</p>
          </motion.div>

          {productsLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          ) : productsError ? (
            <div className="text-center text-red-600">{productsError}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                عرض جميع المنتجات
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="section bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">اطلب الآن وتوصل لباب بيتك</h2>
            <Link href="/products">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                تسوق الآن
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
