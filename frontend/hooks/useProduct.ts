import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/products';
import type { ProductDetail } from '@/types';

export function useProduct(id: number | null) {
  const [state, setState] = useState<{
    product: ProductDetail | null;
    loading: boolean;
    error: string | null;
  }>({
    product: null,
    loading: id !== null && !isNaN(id),
    error: null,
  });

  const fetchProduct = useCallback(async () => {
    if (!id) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const product = await productsService.fetchProduct(id);
      setState({
        product,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product',
      }));
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    ...state,
    refetch: fetchProduct,
  };
}
