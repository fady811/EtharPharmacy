import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';
import { getUnitPrice, getOriginalPrice, calculateLineTotal, calculateDiscount, hasValidDiscount } from '@/lib/pricing';

interface CartStore {
  items: CartItem[];
  _hasHydrated: boolean;
  _setHasHydrated: (hydrated: boolean) => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number, variationId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variationId?: number) => void;
  updateItemPrices: (productId: number, originalPrice: string, currentPrice: string, stockQuantity: number) => void;
  clearCart: () => void;
  isAtStockLimit: (productId: number) => boolean;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isInCart: (productId: number) => boolean;
  getItemQuantity: (productId: number) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      _setHasHydrated: (hydrated: boolean) => {
        set({ _hasHydrated: hydrated });
      },

      addItem: (product: Product, quantity?: number) => {
        // Snapshot current state for rollback
        const previousItems = useCartStore.getState().items;
        
        try {
          set((state) => {
            const existingItemIndex = state.items.findIndex(
              (item) => item.product.id === product.id
            );

            if (existingItemIndex >= 0) {
              // Update existing item quantity
              const updatedItems = [...state.items];
              updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: updatedItems[existingItemIndex].quantity + (quantity || 1),
              };
              return { items: updatedItems };
            } else {
              // Add new item
              const newItem: CartItem = {
                id: Date.now() + Math.random(), // Generate unique ID
                product,
                quantity: quantity || 1,
              };
              return { items: [...state.items, newItem] };
            }
          });
        } catch (error) {
          // Rollback on error
          set({ items: previousItems });
          throw error;
        }
      },

      removeItem: (productId, variationId?: number) => {
        // Snapshot current state for rollback
        const previousItems = useCartStore.getState().items;

        try {
          set((state) => ({
            items: state.items.filter((item) => item.product.id !== productId),
          }));
        } catch (error) {
          // Rollback on error
          set({ items: previousItems });
          throw error;
        }
      },

      updateQuantity: (productId, quantity, variationId?: number) => {
        if (quantity <= 0) {
          get().removeItem(productId, variationId);
          return;
        }

        // Snapshot current state for rollback
        const previousItems = useCartStore.getState().items;

        try {
          set((state) => ({
            items: state.items.map((item) =>
              item.product.id === productId
                ? { ...item, quantity }
                : item
            ),
          }));
        } catch (error) {
          // Rollback on error
          set({ items: previousItems });
          throw error;
        }
      },

      updateItemPrices: (productId, originalPrice, currentPrice, stockQuantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId
              ? {
                  ...item,
                  product: {
                    ...item.product,
                    price: originalPrice,
                    final_price: currentPrice,
                    sale_price: originalPrice !== currentPrice ? currentPrice : null,
                    is_on_sale: originalPrice !== currentPrice,
                    stock_quantity: stockQuantity,
                    has_stock: stockQuantity > 0
                  }
                }
              : item
          ),
        }));
      },

      isAtStockLimit: (productId) => {
        const item = get().items.find((i) => i.product.id === productId);
        if (!item) return false;
        return item.quantity >= item.product.stock_quantity;
      },



      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + calculateLineTotal(item.product, item.quantity),
          0
        );
      },

      isInCart: (productId) => {
        return get().items.some((item) => item.product.id === productId);
      },

      getItemQuantity: (productId) => {
        const item = get().items.find((item) => item.product.id === productId);
        return item?.quantity ?? 0;
      },

      getItemTotal: (productId: number) => {
        const item = get().items.find((item) => item.product.id === productId);
        if (!item) return 0;
        return calculateLineTotal(item.product, item.quantity);
      },

      getItemBreakdown: (productId: number) => {
        const item = get().items.find((item) => item.product.id === productId);
        if (!item) return null;
        const unitPrice = getUnitPrice(item.product);
        const originalPrice = getOriginalPrice(item.product);
        return {
          name: item.product.name,
          quantity: item.quantity,
          price: unitPrice,
          originalPrice: originalPrice,
          total: calculateLineTotal(item.product, item.quantity),
          originalTotal: originalPrice * item.quantity,
          isOnSale: hasValidDiscount(item.product),
          discount: calculateDiscount(item.product)
        };
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        console.log('Cart hydrated:', state?.items?.length || 0, 'items');
        state?._setHasHydrated(true);
      },
    }
  )
);

// Add storage event listener for cross-tab synchronization
if (typeof window !== 'undefined') {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'cart-storage') {
      // Rehydrate the store when cart changes in another tab
      useCartStore.persist.rehydrate();
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Clean up event listener on page unload
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('storage', handleStorageChange);
  });
}
