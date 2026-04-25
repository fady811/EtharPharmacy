import { apiClient } from './apiClient';

export interface CurrentPricesRequest {
  product_ids: number[];
}

export interface CurrentPricesResponse {
  success: boolean;
  data: {
    prices: Record<string, { original_price: string; current_price: string; stock_quantity: number }>;

  };
  message?: string;
}


export const pricesService = {
  async getCurrentPrices(productIds: number[]): Promise<CurrentPricesResponse> {
    const response = await apiClient.post<CurrentPricesResponse>(
      '/products/current-prices/',
      { product_ids: productIds }
    );
    return response;
  },
};
