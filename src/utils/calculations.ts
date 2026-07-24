export interface CartItemModifier {
  modifier_id: string;
  name: string;
  extra_price: number;
}

export interface CartItem {
  id: string;
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  image_url?: string | null;
  notes?: string;
  selected_modifiers: CartItemModifier[];
}

/**
 * Calculates the line total for a single cart item including modifiers.
 * Uses Math.round to avoid floating-point drift (e.g. 0.1 + 0.2 ≠ 0.30000000000000004).
 * @param item - A CartItem from the current cart state.
 */
export function calculateItemLineTotal(item: CartItem): number {
  const modifiersTotal = item.selected_modifiers.reduce((sum, mod) => sum + mod.extra_price, 0);
  const lineRaw = (item.unit_price + modifiersTotal) * item.quantity;
  return Math.round(lineRaw * 100) / 100;
}

/**
 * Calculates the total amount for an array of cart items with monetary precision.
 * @param items - Array of CartItem objects in the current cart.
 */
export function calculateCartGrandTotal(items: CartItem[]): number {
  const raw = items.reduce((total, item) => total + calculateItemLineTotal(item), 0);
  return Math.round(raw * 100) / 100;
}
