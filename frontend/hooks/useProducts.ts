import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/products';
import type { Product, ProductFilters, Pagination } from '@/types';

export function useProducts(initialFilters: ProductFilters = {}) {
  const [state, setState] = useState<{
    products: Product[];
    pagination: Pagination | null;
    loading: boolean;
    error: string | null;
  }>({
    products: [],
    pagination: null,
    loading: false,
    error: null,
  });

  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  const fetchProducts = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await productsService.fetchProducts(filters);
      setState({
        products: result.products,
        pagination: result.pagination,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
      }));
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    ...state,
    filters,
    updateFilters,
    goToPage,
    refetch: fetchProducts,
  };
}
