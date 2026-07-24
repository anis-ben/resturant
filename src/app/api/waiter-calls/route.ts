import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { WaiterCallSchema } from '@/types/zod.schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = WaiterCallSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'بيانات النداء غير صحيحة' }, { status: 400 });
    }

    const { access_token, type } = validationResult.data;
    const adminSupabase = getAdminSupabase();

    // Verify access token
    const { data: tableData, error: tableError } = await adminSupabase
      .from('tables')
      .select('id, table_number')
      .eq('access_token', access_token)
      .single();

    if (tableError || !tableData) {
      return NextResponse.json({ error: 'طاولة غير معروفة' }, { status: 404 });
    }

    // Insert waiter call
    const { data: callData, error: insertError } = await adminSupabase
      .from('waiter_calls')
      .insert({
        table_id: tableData.id,
        type: type,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !callData) {
      return NextResponse.json({ error: 'تعذر إرسال التنبيه للنادل' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: type === 'request_bill' ? 'تم إرسال طلب الفاتورة بنجاح' : 'تم تنبيه النادل، وسيكون عندك في أقرب لحظة',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ في النظام';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
