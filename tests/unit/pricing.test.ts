import { describe, it, expect } from 'vitest';
import { calculateItemLineTotal, calculateCartGrandTotal, CartItem } from '../../src/utils/calculations';

describe('Price Calculation Logic', () => {
  it('correctly calculates line total for item without modifiers', () => {
    const item: CartItem = {
      id: '1',
      menu_item_id: 'item-1',
      name: 'برغر الأصالة',
      unit_price: 1000,
      quantity: 2,
      selected_modifiers: [],
    };

    expect(calculateItemLineTotal(item)).toBe(2000);
  });

  it('correctly calculates line total for item with modifiers', () => {
    const item: CartItem = {
      id: '2',
      menu_item_id: 'item-2',
      name: 'طبق مشويات',
      unit_price: 3000,
      quantity: 2,
      selected_modifiers: [
        { modifier_id: 'm1', name: 'صلصة حارة', extra_price: 100 },
        { modifier_id: 'm2', name: 'جبن إضافي', extra_price: 200 },
      ],
    };

    // (3000 + 100 + 200) * 2 = 6600
    expect(calculateItemLineTotal(item)).toBe(6600);
  });

  it('correctly calculates grand total for multiple items', () => {
    const items: CartItem[] = [
      {
        id: '1',
        menu_item_id: 'item-1',
        name: 'برغر الأصالة',
        unit_price: 1000,
        quantity: 2,
        selected_modifiers: [],
      },
      {
        id: '2',
        menu_item_id: 'item-2',
        name: 'عصير برتقال',
        unit_price: 350,
        quantity: 1,
        selected_modifiers: [],
      },
    ];

    expect(calculateCartGrandTotal(items)).toBe(2350);
  });
});
