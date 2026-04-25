import { apiClient } from './apiClient';
import type {
  ProductsResponse,
  ProductDetailResponse,
  CategoriesResponse,
  ProductFilters,
  Product,
  ProductDetail,
  Category,
} from '@/types';

export const productsService = {
  async fetchProducts(params: ProductFilters = {}): Promise<{
    products: Product[];
    pagination: ProductsResponse['pagination'];
  }> {
    const response = await apiClient.get<ProductsResponse>('/products/', params);
    return {
      products: response.data,
      pagination: response.pagination,
    };
  },

  async fetchProduct(id: number): Promise<ProductDetail> {
    const response = await apiClient.get<ProductDetailResponse>(`/products/${id}/`);
    return response.data;
  },

  async fetchProductsByCategory(
    categoryId: number,
    params: ProductFilters = {}
  ): Promise<{
    products: Product[];
    pagination: ProductsResponse['pagination'];
  }> {
    const response = await apiClient.get<ProductsResponse>(
      `/categories/${categoryId}/products/`,
      params
    );
    return {
      products: response.data,
      pagination: response.pagination,
    };
  },

  async fetchCategories(params: { main_only?: boolean } = {}): Promise<Category[]> {
    const response = await apiClient.get<CategoriesResponse | Category[]>('/categories/', params);
    // Handle both wrapped {success, data} and raw array responses
    if (Array.isArray(response)) {
      return response;
    }
    return (response as CategoriesResponse).data;
  },

  async searchProducts(query: string, params: ProductFilters = {}): Promise<{
    products: Product[];
    pagination: ProductsResponse['pagination'];
  }> {
    return this.fetchProducts({ ...params, search: query });
  },
};
