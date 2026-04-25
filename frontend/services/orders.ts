import { apiClient } from './apiClient';
import type { OrderFormData, OrderResponse, CartItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const ordersService = {
  async createOrder(
    orderData: OrderFormData,
    cartItems: CartItem[],
    idempotencyKey?: string
  ): Promise<OrderResponse> {
    const payload = {
      customer_name: orderData.name,
      customer_phone: orderData.phone,
      customer_address: orderData.address,
      customer_email: orderData.email || undefined,
      notes: orderData.notes || '',
      items: cartItems.map(item => {
        return {
          product_id: item.product.id,
          quantity: item.quantity,
        };
      }),
      idempotency_key: idempotencyKey || uuidv4(),
    };

    const response = await apiClient.post<OrderResponse>('/orders/', payload);
    return response;
  },
};
