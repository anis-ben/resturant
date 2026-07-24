import { z } from 'zod';

export const OrderItemModifierInputSchema = z.object({
  modifier_id: z.string().uuid(),
});

export const OrderItemInputSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().min(1, 'الكمية يجب أن تكون 1 على الأقل'),
  notes: z.string().max(300).optional(),
  selected_modifiers: z.array(OrderItemModifierInputSchema).default([]),
});

export const CreateOrderSchema = z.object({
  type: z.enum(['dine_in', 'takeout', 'delivery']),
  access_token: z.string().uuid().optional(), // Required if type === dine_in
  customer_name: z.string().min(2, 'الاسم يجب أن يتكون من حرفين على الأقل').optional(),
  customer_phone: z.string().regex(/^(\+213|0)(5|6|7|23)[0-9]{8}$/, 'رقم الهاتف غير صحيح').optional(),
  delivery_address: z.string().min(5, 'يرجى إدخال عنوان التوصيل المفصل').optional(),
  address_landmark: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(OrderItemInputSchema).min(1, 'يجب أن تحتوي السلة على عنصر واحد على الأقل'),
});

export const WaiterCallSchema = z.object({
  access_token: z.string().uuid('رمز الطاولة غير صحيح'),
  type: z.enum(['call_waiter', 'request_bill']),
});

export const PaymentSettlementSchema = z.object({
  order_id: z.string().uuid(),
  payment_method: z.enum(['cash', 'card', 'online']),
  amount_tendered: z.number().min(0).optional(),
  discount_amount: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
});

export const MenuItemInputSchema = z.object({
  category_id: z.string().uuid('يرجى اختيار القسم'),
  name: z.string().min(2, 'اسم الطبق مطلوب'),
  description: z.string().optional(),
  price: z.number().min(0, 'السعر لا يمكن أن يكون سالباً'),
  image_url: z.string().url('رابط الصورة غير صحيح').optional().or(z.literal('')),
  is_available: z.boolean().default(true),
  badges: z.array(z.string()).default([]),
});
