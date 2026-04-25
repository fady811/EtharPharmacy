'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Category } from '@/types';
import type { ProductFilters } from '@/types';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';

interface ProductFiltersProps {
  categories: Category[];
  onFilterChange: (filters: ProductFilters) => void;
  filters: ProductFilters;
}

export function ProductFilters({ categories, onFilterChange, filters }: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  
  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [pendingFilters, setPendingFilters] = useState<Partial<ProductFilters>>({});
  const debouncedFilters = useDebounce(pendingFilters, 200);

  const handleFilterChange = (key: keyof ProductFilters, value: ProductFilters[keyof ProductFilters]) => {
    // Update pending filters immediately for UI
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply debounced filters
  useEffect(() => {
    if (Object.keys(debouncedFilters).length > 0) {
      onFilterChange({ ...filters, ...debouncedFilters });
      setPendingFilters({});
    }
  }, [debouncedFilters]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Don't call handleFilterChange here - let debounce handle it
  };

  // Update search filter when debounced value changes
  useEffect(() => {
    if (debouncedSearchTerm !== filters.search) {
      handleFilterChange('search', debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  const clearFilter = (key: keyof ProductFilters | 'all') => {
    const defaultValues = {
      search: '',
      category: undefined,
      min_price: undefined,
      max_price: undefined,
      price_range: undefined,
      featured: false,
      in_stock: false,
      on_sale: false,
      sort: 'newest' as const,
    };
    
    if (key === 'all') {
      setSearchTerm('');
      setPendingFilters({});
      onFilterChange(defaultValues);
    } else {
      const newValue = (defaultValues as any)[key];
      if (key === 'search') {
        setSearchTerm(newValue || '');
      }
      // Apply immediately for clear operations (no debounce)
      onFilterChange({ ...filters, [key]: newValue });
    }
  };

  const clearFilters = () => {
    clearFilter('all');
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== '' && value !== false && value !== 'newest'
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            label="Search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1"
          />
          {filters.search && (
            <button
              onClick={() => clearFilter('search')}
              className="mt-6 p-2 text-gray-500 hover:text-gray-700"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.product_count})
                </option>
              ))}
            </select>
          </div>
          {filters.category && (
            <button
              onClick={() => clearFilter('category')}
              className="mt-6 p-2 text-gray-500 hover:text-gray-700"
              title="Clear category"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-gray-200"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range
                  </label>
                  <select
                    value={filters.price_range || ''}
                    onChange={(e) => handleFilterChange('price_range', e.target.value)}
                    className="w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                  >
                    <option value="">All Prices</option>
                    <option value="budget">Under EGP 25</option>
                    <option value="standard">EGP 25 - EGP 100</option>
                    <option value="premium">EGP 100 - EGP 500</option>
                    <option value="luxury">Over EGP 500</option>
                  </select>
                </div>
                {filters.price_range && (
                  <button
                    onClick={() => clearFilter('price_range')}
                    className="mt-6 p-2 text-gray-500 hover:text-gray-700"
                    title="Clear price range"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    label="Min Price"
                    type="number"
                    placeholder="0"
                    value={filters.min_price || ''}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                    className="flex-1"
                  />
                  {filters.min_price && (
                    <button
                      onClick={() => clearFilter('min_price')}
                      className="mt-6 p-2 text-gray-500 hover:text-gray-700"
                      title="Clear min price"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    label="Max Price"
                    type="number"
                    placeholder="1000"
                    value={filters.max_price || ''}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    className="flex-1"
                  />
                  {filters.max_price && (
                    <button
                      onClick={() => clearFilter('max_price')}
                      className="mt-6 p-2 text-gray-500 hover:text-gray-700"
                      title="Clear max price"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.featured || false}
                      onChange={(e) => handleFilterChange('featured', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Featured Only</span>
                  </label>
                  {filters.featured && (
                    <button
                      onClick={() => clearFilter('featured')}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Clear featured filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.in_stock || false}
                      onChange={(e) => handleFilterChange('in_stock', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">In Stock Only</span>
                  </label>
                  {filters.in_stock && (
                    <button
                      onClick={() => clearFilter('in_stock')}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Clear in stock filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.on_sale || false}
                      onChange={(e) => handleFilterChange('on_sale', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">On Sale Only</span>
                  </label>
                  {filters.on_sale && (
                    <button
                      onClick={() => clearFilter('on_sale')}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Clear on sale filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sort || 'newest'}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A-Z</option>
                    <option value="name_desc">Name: Z-A</option>
                    <option value="featured">Featured First</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
                {filters.sort && filters.sort !== 'newest' && (
                  <button
                    onClick={() => clearFilter('sort')}
                    className="mt-6 p-2 text-gray-500 hover:text-gray-700"
                    title="Clear sort"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
