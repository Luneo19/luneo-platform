/**
 * Cart Store - Zustand
 * Manages shopping cart state with backend sync and localStorage fallback.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export interface CartItem {
  id?: string; // backend ID (undefined for local-only items)
  productId: string;
  productName: string;
  productImage?: string;
  designId?: string;
  customizationId?: string;
  quantity: number;
  priceCents: number;
  totalCents: number;
  metadata?: Record<string, unknown>;
}

/** Shape of a cart item as returned by the API (e.g. GET /api/cart) */
export interface CartItemFromApi {
  id?: string;
  productId: string;
  designId?: string;
  customizationId?: string;
  quantity: number;
  priceCents: number;
  totalCents: number;
  metadata?: { productName?: string; productImage?: string; [key: string]: unknown };
}

export interface CartState {
  items: CartItem[];
  brandId: string | null;
  isLoading: boolean;
  isOpen: boolean; // Cart drawer open state

  // Actions
  addItem: (item: Omit<CartItem, 'totalCents'>) => void;
  removeItem: (productId: string, designId?: string, customizationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, designId?: string, customizationId?: string) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setBrandId: (brandId: string) => void;
  syncWithBackend: () => Promise<void>;

  // Computed
  getSubtotalCents: () => number;
  getItemCount: () => number;
  getTaxCents: () => number;
  getTotalCents: () => number;
}

// ========================================
// STORE
// ========================================

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      brandId: null,
      isLoading: false,
      isOpen: false,

      addItem: (item) => {
        set((state) => {
          const existingIdx = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.designId === item.designId &&
              i.customizationId === item.customizationId
          );

          let newItems: CartItem[];
          if (existingIdx >= 0) {
            newItems = [...state.items];
            const existing = newItems[existingIdx];
            newItems[existingIdx] = {
              ...existing,
              quantity: existing.quantity + item.quantity,
              totalCents: (existing.quantity + item.quantity) * item.priceCents,
            };
          } else {
            newItems = [
              ...state.items,
              {
                ...item,
                totalCents: item.priceCents * item.quantity,
              },
            ];
          }

          return { items: newItems };
        });

        logger.info('Item added to cart', { productId: item.productId });

        // Sync to backend when user is logged in (silently fail for guests — local cart is source of truth)
        const brandId = get().brandId;
        if (brandId) {
          fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brandId,
              productId: item.productId,
              quantity: item.quantity,
              priceCents: item.priceCents,
              designId: item.designId,
              customizationId: item.customizationId,
              metadata: {
                ...item.metadata,
                productName: item.productName,
                productImage: item.productImage,
              },
            }),
          }).catch((error) => {
            logger.error('Cart sync failed', { error });
          });
        }
      },

      removeItem: (productId, designId, customizationId) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(
                i.productId === productId &&
                i.designId === designId &&
                i.customizationId === customizationId
              )
          ),
        }));
      },

      updateQuantity: (productId, quantity, designId, customizationId) => {
        if (quantity < 1) {
          get().removeItem(productId, designId, customizationId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId &&
            i.designId === designId &&
            i.customizationId === customizationId
              ? { ...i, quantity, totalCents: i.priceCents * quantity }
              : i
          ),
        }));
      },

      clearCart: () => {
        const brandId = get().brandId;
        set({ items: [] });
        // Sync clear to backend when user is logged in
        if (brandId) {
          fetch(`/api/cart?brandId=${encodeURIComponent(brandId)}`, { method: 'DELETE' }).catch(
            (error) => {
              logger.error('Cart clear sync failed', { error });
            }
          );
        }
      },

      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setBrandId: (brandId) => set({ brandId }),

      syncWithBackend: async () => {
        const { brandId, items } = get();
        if (!brandId || items.length === 0) return;

        set({ isLoading: true });
        try {
          const res = await fetch(`/api/cart?brandId=${brandId}`);
          if (res.ok) {
            const cart = await res.json();
            if (cart.items && cart.items.length > 0) {
              set({
                items: cart.items.map((i: CartItemFromApi) => ({
                  id: i.id,
                  productId: i.productId,
                  productName: i.metadata?.productName || 'Product',
                  productImage: i.metadata?.productImage,
                  designId: i.designId,
                  customizationId: i.customizationId,
                  quantity: i.quantity,
                  priceCents: i.priceCents,
                  totalCents: i.totalCents,
                  metadata: i.metadata,
                })),
              });
            }
          }
        } catch (error) {
          logger.error('Failed to sync cart with backend', { error });
        } finally {
          set({ isLoading: false });
        }
      },

      // Computed
      getSubtotalCents: () => {
        return get().items.reduce((sum, i) => sum + i.totalCents, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      getTaxCents: () => {
        return Math.round(get().getSubtotalCents() * 0.2); // 20% VAT
      },

      getTotalCents: () => {
        return get().getSubtotalCents() + get().getTaxCents();
      },
    }),
    {
      name: 'luneo-cart',
      partialize: (state) => ({
        items: state.items,
        brandId: state.brandId,
      }),
    }
  )
);
