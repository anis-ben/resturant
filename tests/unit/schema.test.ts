import { describe, it, expect } from 'vitest';
import { CreateOrderSchema, PaymentSettlementSchema } from '../../src/types/zod.schemas';

describe('Zod Schema Validation Tests', () => {
  it('validates valid dine-in order submission payload', () => {
    const validDineIn = {
      type: 'dine_in',
      access_token: '11111111-1111-1111-1111-111111111111',
      items: [
        {
          menu_item_id: '22222222-2222-2222-2222-222222222222',
          quantity: 2,
          selected_modifiers: [],
        },
      ],
    };

    const result = CreateOrderSchema.safeParse(validDineIn);
    expect(result.success).toBe(true);
  });

  it('rejects order submission without items', () => {
    const invalidPayload = {
      type: 'takeout',
      items: [],
    };

    const result = CreateOrderSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('validates payment settlement payload', () => {
    const validPayment = {
      order_id: '33333333-3333-3333-3333-333333333333',
      payment_method: 'cash',
      amount_tendered: 2000,
      discount_amount: 0,
      tax_amount: 380,
    };

    const result = PaymentSettlementSchema.safeParse(validPayment);
    expect(result.success).toBe(true);
  });
});
