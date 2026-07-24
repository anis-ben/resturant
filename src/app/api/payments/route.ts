import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { PaymentSettlementSchema } from '@/types/zod.schemas';
import { checkRateLimit } from '@/lib/rate-limiter';

/**
 * POST /api/payments
 * Settles an order, records a payment, and marks the order as completed.
 * Rate-limited to 10 payment attempts per IP per minute (prevents double-charge spam).
 */

export async function POST(request: Request) {
  try {
    // Rate limiting: 10 payment attempts per IP per minute
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
    const rateCheck = await checkRateLimit(`payment_${ip}`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد المسموح لمحاولات الدفع. يرجى الانتظار دقيقة.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await request.json();
    const validationResult = PaymentSettlementSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'بيانات الدفع غير مكتملة', details: validationResult.error.format() }, { status: 400 });
    }

    const { order_id, payment_method, amount_tendered, discount_amount, tax_amount } = validationResult.data;
    const adminSupabase = getAdminSupabase();

    // Fetch Order details
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('id, total_amount, status, type, table_id')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Generate cryptographically safe, unique receipt number
    const receiptUUID = crypto.randomUUID().split('-')[0].toUpperCase();
    const receiptNumber = `RCPT-${receiptUUID}`;

    /**
     * Use Math.round to avoid floating-point drift (e.g., 0.1 + 0.2 = 0.30000000000000004).
     * Rounds to 2 decimal places for monetary precision.
     */
    const amountDue = Math.round((Number(order.total_amount) - discount_amount + tax_amount) * 100) / 100;

    // Check if already paid
    const { data: existingPayment } = await adminSupabase
      .from('payments')
      .select('id, receipt_number, printed_count')
      .eq('order_id', order_id)
      .eq('status', 'paid')
      .single();

    if (existingPayment) {
      // Increment printed count for duplicate reprint tracking
      await adminSupabase
        .from('payments')
        .update({ printed_count: existingPayment.printed_count + 1 })
        .eq('id', existingPayment.id);

      return NextResponse.json({
        success: true,
        receiptNumber: existingPayment.receipt_number,
        isDuplicate: true,
        printedCount: existingPayment.printed_count + 1,
      });
    }

    // Insert new payment record
    const { data: newPayment, error: paymentError } = await adminSupabase
      .from('payments')
      .insert({
        order_id: order_id,
        payment_method: payment_method,
        amount_due: amountDue,
        amount_tendered: amount_tendered || amountDue,
        discount_amount: discount_amount,
        tax_amount: tax_amount,
        receipt_number: receiptNumber,
        status: 'paid',
        printed_count: 1,
      })
      .select('*')
      .single();

    if (paymentError || !newPayment) {
      console.error('Payment Error:', paymentError);
      return NextResponse.json({ error: 'تعذر تسجيل استلام المبلغ في القاعدة' }, { status: 500 });
    }

    // Update order status to completed
    await adminSupabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order_id);

    return NextResponse.json({
      success: true,
      payment: newPayment,
      receiptNumber: receiptNumber,
      changeDue: newPayment.change_due,
      isDuplicate: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ في عملية التسديد';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
