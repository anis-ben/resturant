import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { CreateOrderSchema } from '@/types/zod.schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = CreateOrderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'بيانات الطلب غير صحيحة', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const orderData = validationResult.data;
    const adminSupabase = getAdminSupabase();
    let tableId: string | null = null;

    // Validate table access_token for dine-in orders
    if (orderData.type === 'dine_in') {
      if (!orderData.access_token) {
        return NextResponse.json({ error: 'رمز الطاولة مطلوب للطلبات المحلية' }, { status: 400 });
      }

      const { data: tableData, error: tableError } = await adminSupabase
        .from('tables')
        .select('id, table_number')
        .eq('access_token', orderData.access_token)
        .single();

      if (tableError || !tableData) {
        return NextResponse.json({ error: 'طاولة غير موجودة أو رمز الوصول غير صالح' }, { status: 404 });
      }
      tableId = tableData.id;
    }

    // Recalculate prices strictly from DB
    const menuItemIds = orderData.items.map((i) => i.menu_item_id);
    const { data: menuItems, error: menuError } = await adminSupabase
      .from('menu_items')
      .select('id, name, price, is_available')
      .in('id', menuItemIds);

    if (menuError || !menuItems) {
      return NextResponse.json({ error: 'عفواً، تعذر جلب قائمة الطعام لتأكيد الأسعار' }, { status: 500 });
    }

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

    // Check for unavailable items
    for (const item of orderData.items) {
      const dbItem = menuItemMap.get(item.menu_item_id);
      if (!dbItem || !dbItem.is_available) {
        return NextResponse.json(
          { error: `الطبق "${dbItem?.name || 'غير معروف'}" غير متوفر حالياً` },
          { status: 400 }
        );
      }
    }

    // Collect all modifier IDs
    const modifierIds = orderData.items.flatMap((i) => i.selected_modifiers.map((m) => m.modifier_id));
    let modifierMap = new Map<string, number>();

    if (modifierIds.length > 0) {
      const { data: dbModifiers } = await adminSupabase
        .from('modifiers')
        .select('id, extra_price')
        .in('id', modifierIds);

      if (dbModifiers) {
        modifierMap = new Map(dbModifiers.map((m) => [m.id, Number(m.extra_price)]));
      }
    }

    // Compute authoritative grand total
    let calculatedGrandTotal = 0;
    const preparedOrderItems = [];

    for (const item of orderData.items) {
      const dbItem = menuItemMap.get(item.menu_item_id)!;
      const unitPrice = Number(dbItem.price);

      let itemModifiersTotal = 0;
      const preparedModifiers = [];

      for (const mod of item.selected_modifiers) {
        const extraPrice = modifierMap.get(mod.modifier_id) || 0;
        itemModifiersTotal += extraPrice;
        preparedModifiers.push({
          modifier_id: mod.modifier_id,
          extra_price: extraPrice,
        });
      }

      const itemLineTotal = (unitPrice + itemModifiersTotal) * item.quantity;
      calculatedGrandTotal += itemLineTotal;

      preparedOrderItems.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        notes: item.notes || null,
        modifiers: preparedModifiers,
      });
    }

    // Insert order into DB
    const { data: newOrder, error: orderInsertError } = await adminSupabase
      .from('orders')
      .insert({
        type: orderData.type,
        table_id: tableId,
        customer_name: orderData.customer_name || null,
        customer_phone: orderData.customer_phone || null,
        delivery_address: orderData.delivery_address || null,
        address_landmark: orderData.address_landmark || null,
        notes: orderData.notes || null,
        status: 'pending',
        total_amount: calculatedGrandTotal,
      })
      .select('id, order_number')
      .single();

    if (orderInsertError || !newOrder) {
      console.error('Order Insert Error:', orderInsertError);
      return NextResponse.json({ error: 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى' }, { status: 500 });
    }

    // Insert order_items and order_item_modifiers
    for (const prepItem of preparedOrderItems) {
      const { data: insertedItem, error: itemError } = await adminSupabase
        .from('order_items')
        .insert({
          order_id: newOrder.id,
          menu_item_id: prepItem.menu_item_id,
          quantity: prepItem.quantity,
          unit_price: prepItem.unit_price,
          notes: prepItem.notes,
        })
        .select('id')
        .single();

      if (!itemError && insertedItem && prepItem.modifiers.length > 0) {
        await adminSupabase.from('order_item_modifiers').insert(
          prepItem.modifiers.map((m) => ({
            order_item_id: insertedItem.id,
            modifier_id: m.modifier_id,
            extra_price: m.extra_price,
          }))
        );
      }
    }

    // Log status history
    await adminSupabase.from('order_status_history').insert({
      order_id: newOrder.id,
      old_status: null,
      new_status: 'pending',
    });

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.order_number,
      totalAmount: calculatedGrandTotal,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة الطلب';
    console.error('API /api/orders error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
