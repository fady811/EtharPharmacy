import { Product } from '@/types';

/**
 * Get the correct unit price for a product
 * Uses final_price which is computed on the backend as the actual price to pay
 */
export function getUnitPrice(product: Product): number {
  return parseFloat(product.final_price);
}

/**
 * Get the original price (regular price) for a product
 */
export function getOriginalPrice(product: Product): number {
  return parseFloat(product.price);
}

/**
 * Calculate line total for a cart item
 * Uses correct unit price logic
 */
export function calculateLineTotal(product: Product, quantity: number): number {
  const unitPrice = getUnitPrice(product);
  return unitPrice * quantity;
}

/**
 * Calculate discount amount for a product
 */
export function calculateDiscount(product: Product): number {
  const originalPrice = getOriginalPrice(product);
  const finalPrice = getUnitPrice(product);
  
  if (originalPrice <= finalPrice) {
    return 0;
  }
  
  return originalPrice - finalPrice;
}

/**
 * Check if a product has a valid discount
 */
export function hasValidDiscount(product: Product): boolean {
  return parseFloat(product.price) > parseFloat(product.final_price);
}

