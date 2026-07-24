'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, calculateCartGrandTotal } from '@/utils/calculations';
import { z } from 'zod';

const CART_STORAGE_KEY = 'resturant_cart_v1';

/**
 * Zod schema for validating a CartItem recovered from localStorage.
 * Prevents corrupt or tampered localStorage data from poisoning cart state.
 */
const CartItemSchema = z.object({
  id: z.string(),
  menu_item_id: z.string().uuid(),
  name: z.string(),
  unit_price: z.number().min(0),
  quantity: z.number().int().min(1),
  image_url: z.string().nullable().optional(),
  notes: z.string().optional(),
  selected_modifiers: z.array(
    z.object({
      modifier_id: z.string().uuid(),
      name: z.string(),
      extra_price: z.number().min(0),
    })
  ),
});

const CartStateSchema = z.array(CartItemSchema);

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount and validate via Zod to prevent corrupt data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const validationResult = CartStateSchema.safeParse(parsed);
        if (validationResult.success) {
          setItems(validationResult.data as CartItem[]);
        } else {
          // Corrupt data: clear it rather than crashing
          console.warn('[useCart] Corrupt cart data in localStorage, clearing it.', validationResult.error.issues);
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('[useCart] Could not read cart from localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Persist to localStorage whenever cart state changes (only after hydration)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[useCart] Could not persist cart to localStorage:', e);
    }
  }, [items, isInitialized]);

  /**
   * Adds a new item to the cart with a stable, unique ID.
   * @param newItem - CartItem without the client-side 'id' field.
   */
  const addItem = useCallback((newItem: Omit<CartItem, 'id'>) => {
    const id = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setItems((prev) => [...prev, { ...newItem, id }]);
  }, []);

  /**
   * Removes a cart item by its unique client-side ID.
   * @param id - The cart item ID to remove.
   */
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * Increments or decrements an item's quantity. Removes the item if quantity reaches 0.
   * @param id - The cart item ID.
   * @param delta - Positive to increment, negative to decrement.
   */
  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  /** Empties all cart items and clears localStorage. */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const grandTotal = calculateCartGrandTotal(items);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItemsCount,
    grandTotal,
    isInitialized,
  };
}
