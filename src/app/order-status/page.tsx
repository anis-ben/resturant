'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { Database, OrderStatus } from '@/types/database.types';
import { formatCurrency } from '@/utils/formatters';
import { Clock, Bell, Receipt, PlusCircle, CheckCircle, ChefHat } from 'lucide-react';

function OrderStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Database['public']['Tables']['orders']['Row'] | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    const { data: orderData } = await supabase
      .from('orders')
      .select('*, tables(table_number, access_token)')
      .eq('id', orderId)
      .single();

    if (orderData) {
      setOrder(orderData as any);
    }

    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*, menu_items(name), order_item_modifiers(*, modifiers(name))')
      .eq('order_id', orderId);

    if (itemsData) {
      setItems(itemsData);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
    if (!orderId) return;

    const channel = supabase
      .channel(`order_status_${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, fetchOrderDetails]);

  const handleCallWaiter = async (type: 'call_waiter' | 'request_bill') => {
    const tableAccessToken = (order as any)?.tables?.access_token;
    if (!tableAccessToken) return;

    if (type === 'call_waiter') setIsCallingWaiter(true);
    if (type === 'request_bill') setIsRequestingBill(true);

    try {
      const res = await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: tableAccessToken, type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAlertMessage({ text: data.message });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'فشل إرسال النداء';
      setAlertMessage({ text: msg, isError: true });
    } finally {
      setIsCallingWaiter(false);
      setIsRequestingBill(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-950 p-6 text-white text-center flex flex-col items-center justify-center">
        <Clock className="w-12 h-12 text-gold-400 animate-pulse mb-3" />
        <p className="font-semibold text-lg">جاري تحميل تفاصيل الطلب...</p>
      </div>
    );
  }

  const steps: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { status: 'pending', label: 'عند الكاشير 📋', icon: <Clock className="w-4 h-4" /> },
    { status: 'preparing', label: 'في المطبخ 🍳', icon: <ChefHat className="w-4 h-4" /> },
    { status: 'ready', label: 'جاهز بالصالة 🔔', icon: <CheckCircle className="w-4 h-4" /> },
    { status: 'completed', label: 'تم الحساب والتقديم ✨', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const currentStepIdx = steps.findIndex((s) => s.status === order.status);

  return (
    <div className="min-h-screen bg-dark-950 pb-12">
      <Header tableNumber={(order as any)?.tables?.table_number} />

      <div className="max-w-xl mx-auto p-4 space-y-6">
        {/* Order Status Banner */}
        <div className="bg-dark-900 border border-gold-500/30 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="inline-block bg-gold-500/10 border border-gold-500/30 text-gold-400 px-4 py-1.5 rounded-full text-xs font-bold">
            رقم الطلب #{order.order_number}
          </div>

          <h2 className="text-2xl font-black text-white">حالة طلب الطاولة M-{order.order_number}</h2>
          <StatusBadge status={order.status} className="text-sm px-4 py-1.5" />

          {/* Stepper Progression Bar */}
          <div className="pt-6 border-t border-gray-800 flex items-center justify-between relative">
            {steps.map((step, idx) => {
              const isPassed = idx <= currentStepIdx;
              return (
                <div key={step.status} className="flex flex-col items-center z-10 space-y-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPassed
                        ? 'bg-gold-500 text-dark-950 shadow-lg shadow-gold-500/30 scale-110'
                        : 'bg-dark-950 border border-gray-800 text-gray-600'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className={`text-[10px] font-semibold ${isPassed ? 'text-gold-400' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Alert Banner */}
        {alertMessage && (
          <div
            className={`p-4 rounded-2xl text-sm font-semibold text-center border ${
              alertMessage.isError
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {alertMessage.text}
          </div>
        )}

        {/* Staff Interactive Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleCallWaiter('call_waiter')}
            isLoading={isCallingWaiter}
            variant="outline"
            className="flex items-center justify-center gap-2 py-3"
          >
            <Bell className="w-4 h-4" />
            <span>طلب النادل 🔔</span>
          </Button>

          <Button
            onClick={() => handleCallWaiter('request_bill')}
            isLoading={isRequestingBill}
            variant="outline"
            className="flex items-center justify-center gap-2 py-3"
          >
            <Receipt className="w-4 h-4" />
            <span>طلب الفاتورة 💳</span>
          </Button>
        </div>

        {/* Itemized Order Breakdown */}
        <div className="bg-dark-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-base text-white border-b border-gray-800 pb-3">الأطباق المطلوبة</h3>

          <div className="space-y-3 divide-y divide-gray-800/60">
            {items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span dir="ltr" className="bg-dark-950 text-gold-400 text-xs px-2 py-0.5 rounded font-bold">
                      {item.quantity}x
                    </span>
                    <span className="font-bold text-sm text-white">{item.menu_items?.name}</span>
                  </div>
                </div>
                <span dir="ltr" className="font-bold text-sm text-gold-400">
                  {formatCurrency(Number(item.unit_price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-between font-extrabold text-base">
            <span className="text-gray-300">المجموع الكلي</span>
            <span dir="ltr" className="text-gold-400 text-lg">
              {formatCurrency(Number(order.total_amount))}
            </span>
          </div>
        </div>

        {/* Back to menu button */}
        <Button
          onClick={() => router.push(`/menu?t=${(order as any)?.tables?.access_token || ''}`)}
          className="w-full text-dark-950 font-extrabold flex items-center justify-center gap-2 py-3.5"
        >
          <PlusCircle className="w-5 h-5" />
          <span>إضافة أطباق أخرى للمائدة</span>
        </Button>
      </div>
    </div>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950 p-6 text-white text-center">جاري التحميل...</div>}>
      <OrderStatusContent />
    </Suspense>
  );
}
