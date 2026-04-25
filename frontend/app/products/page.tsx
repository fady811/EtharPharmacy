'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductCard } from '@/components/features/ProductCard';
import { ProductFilters } from '@/components/features/ProductFilters';
import { Pagination } from '@/components/features/Pagination';
import { LoadingSpinner, PageLoading } from '@/components/ui/Loading';
import { ProductFilters as ProductFiltersType } from '@/types';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [localFilters, setLocalFilters] = useState<ProductFiltersType>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') ? parseInt(searchParams.get('category')!) : undefined,
    min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
    price_range: (searchParams.get('price_range') as any) || undefined,
    featured: searchParams.get('featured') === 'true',
    in_stock: searchParams.get('in_stock') === 'true',
    on_sale: searchParams.get('on_sale') === 'true',
    sort: (searchParams.get('sort') as any) || 'newest',
    page: 1,
    page_size: 20,
  });

  const debouncedSearch = useDebounce(localFilters.search, 300);

  const { products, pagination, loading, error, updateFilters, goToPage } = useProducts({
    ...localFilters,
    search: debouncedSearch,
  });

  const { categories } = useCategories(true);

  // Only update filters when they actually change (not on every render)
  const prevFiltersRef = useRef(localFilters);
  useEffect(() => {
    // Check if filters actually changed
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(localFilters);
    if (filtersChanged) {
      updateFilters(localFilters);
      prevFiltersRef.current = localFilters;
    }
  }, [localFilters, updateFilters]);

  const handleFilterChange = (newFilters: Partial<ProductFiltersType>) => {
    setLocalFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    // Only update page, don't reset other filters
    setLocalFilters((prev) => ({ ...prev, page }));
  };

  if (loading && products.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="section">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-gray-600">
            {pagination ? `${pagination.total_items} products found` : 'Browse our products'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ProductFilters
              categories={categories}
              filters={localFilters}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div className="lg:col-span-3">
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found</p>
                <p className="text-gray-400 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="grid-products">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pagination && pagination.total_pages > 1 && (
                  <div className="mt-8">
                    <Pagination pagination={pagination} onPageChange={handlePageChange} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ProductsContent />
    </Suspense>
  );
}
