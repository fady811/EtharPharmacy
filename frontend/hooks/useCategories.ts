import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/products';
import type { Category } from '@/types';

export function useCategories(mainOnly = false) {
  const [state, setState] = useState<{
    categories: Category[];
    loading: boolean;
    error: string | null;
  }>({
    categories: [],
    loading: false,
    error: null,
  });

  const fetchCategories = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const categories = await productsService.fetchCategories({
        main_only: mainOnly,
      });
      setState({
        categories,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
      }));
    }
  }, [mainOnly]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    ...state,
    refetch: fetchCategories,
  };
}
