import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCartStore } from './cart.store';

describe('cart.store', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    useCartStore.getState().clearCart();
  });

  const baseItem = {
    productId: 'prod-1',
    productName: 'Test Product',
    quantity: 1,
    priceCents: 1000,
  };

  describe('addItem', () => {
    it('adds a new item to the cart', () => {
      const { addItem, getItemCount, getSubtotalCents } = useCartStore.getState();
      addItem({ ...baseItem });
      expect(getItemCount()).toBe(1);
      expect(getSubtotalCents()).toBe(1000);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0]).toMatchObject({
        productId: 'prod-1',
        productName: 'Test Product',
        quantity: 1,
        priceCents: 1000,
        totalCents: 1000,
      });
    });

    it('increments quantity if item already exists', () => {
      const { addItem, getItemCount, getSubtotalCents } = useCartStore.getState();
      addItem({ ...baseItem });
      addItem({ ...baseItem, quantity: 2 });
      expect(getItemCount()).toBe(3);
      expect(getSubtotalCents()).toBe(3000);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
      expect(useCartStore.getState().items[0].totalCents).toBe(3000);
    });
  });

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const { addItem, removeItem, getItemCount } = useCartStore.getState();
      addItem({ ...baseItem });
      expect(getItemCount()).toBe(1);
      removeItem('prod-1');
      expect(getItemCount()).toBe(0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      const { addItem, updateQuantity, getItemCount, getSubtotalCents } = useCartStore.getState();
      addItem({ ...baseItem });
      updateQuantity('prod-1', 3);
      expect(getItemCount()).toBe(3);
      expect(getSubtotalCents()).toBe(3000);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
      expect(useCartStore.getState().items[0].totalCents).toBe(3000);
    });

    it('removes item when quantity is set to 0', () => {
      const { addItem, updateQuantity, getItemCount } = useCartStore.getState();
      addItem({ ...baseItem });
      updateQuantity('prod-1', 0);
      expect(getItemCount()).toBe(0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('empties the cart', () => {
      const { addItem, clearCart, getItemCount, getSubtotalCents } = useCartStore.getState();
      addItem({ ...baseItem });
      addItem({ ...baseItem, productId: 'prod-2', productName: 'Product 2' });
      expect(getItemCount()).toBe(2);
      clearCart();
      expect(getItemCount()).toBe(0);
      expect(getSubtotalCents()).toBe(0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('totals', () => {
    it('calculates correct subtotal, tax and total', () => {
      const { addItem, getSubtotalCents, getTaxCents, getTotalCents } = useCartStore.getState();
      addItem({ ...baseItem, quantity: 2 }); // 2000 cents
      addItem({ ...baseItem, productId: 'prod-2', productName: 'P2', priceCents: 500, quantity: 1 }); // 500 cents
      const subtotal = getSubtotalCents();
      const tax = getTaxCents();
      const total = getTotalCents();
      expect(subtotal).toBe(2500);
      expect(tax).toBe(500); // 20% of 2500
      expect(total).toBe(3000);
    });
  });
});
