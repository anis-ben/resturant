'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase/client';
import { Database, OrderStatus } from '@/types/database.types';
import { formatCurrency } from '@/utils/formatters';
import { Clock, Phone, MessageSquare, CheckCircle, ChefHat, Bike } from 'lucide-react';

function ExternalStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Database['public']['Tables']['orders']['Row'] | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    const { data: orderData } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (orderData) setOrder(orderData);

    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*, menu_items(name), order_item_modifiers(*, modifiers(name))')
      .eq('order_id', orderId);

    if (itemsData) setItems(itemsData);
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
    if (!orderId) return;

    const channel = supabase
      .channel(`ext_order_${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => setOrder(payload.new as any)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, fetchOrderDetails]);

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-950 p-6 text-white text-center flex flex-col items-center justify-center">
        <Clock className="w-12 h-12 text-gold-400 animate-pulse mb-3" />
        <p className="font-semibold text-lg">جاري تحميل حالة الطلب الخارجي...</p>
      </div>
    );
  }

  const steps: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { status: 'pending', label: 'استقبال الكاشير 📋', icon: <Clock className="w-4 h-4" /> },
    { status: 'preparing', label: 'في المطبخ 🍳', icon: <ChefHat className="w-4 h-4" /> },
    { status: 'ready', label: 'جاهز عند الكاشير 🔔', icon: <CheckCircle className="w-4 h-4" /> },
    { status: 'out_for_delivery', label: 'مع السائق للتوصيل 🛵', icon: <Bike className="w-4 h-4" /> },
    { status: 'completed', label: 'تم التسليم بنجاح ✨', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const currentIdx = steps.findIndex((s) => s.status === order.status);

  const whatsappMessage = encodeURIComponent(
    `مرحباً مطعم الأصالة، أود الاستفسار عن طلبي رقم #${order.order_number} باسم ${order.customer_name}`
  );

  return (
    <div className="min-h-screen bg-dark-950 pb-12">
      <Header />

      <div className="max-w-xl mx-auto p-4 space-y-6">
        <div className="bg-dark-900 border border-gold-500/30 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="inline-block bg-gold-500/10 border border-gold-500/30 text-gold-400 px-4 py-1.5 rounded-full text-xs font-bold">
            رقم الطلب الخارجي #{order.order_number}
          </div>

          <h2 className="text-2xl font-black text-white">تتبع طلب التوصيل / الاستلام</h2>
          <StatusBadge status={order.status} className="text-sm px-4 py-1.5" />

          {/* Timeline */}
          <div className="pt-6 border-t border-gray-800 flex items-center justify-between relative overflow-x-auto no-scrollbar">
            {steps.map((step, idx) => {
              const isPassed = idx <= currentIdx;
              return (
                <div key={step.status} className="flex flex-col items-center z-10 space-y-2 min-w-[70px]">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPassed
                        ? 'bg-gold-500 text-dark-950 shadow-lg shadow-gold-500/30 scale-110'
                        : 'bg-dark-950 border border-gray-800 text-gray-600'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className={`text-[10px] font-semibold text-center ${isPassed ? 'text-gold-400' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Contact Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`https://wa.me/213550000000?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>تأكيد عبر واتساب</span>
          </a>

          <a
            href="tel:023123456"
            className="flex items-center justify-center gap-2 bg-dark-900 border border-gray-800 hover:border-gray-700 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition"
          >
            <Phone className="w-4 h-4 text-gold-400" />
            <span>اتصال بالمطعم</span>
          </a>
        </div>

        {/* Breakdown */}
        <div className="bg-dark-900 border border-gray-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-base text-white border-b border-gray-800 pb-3">الأطباق والعميل</h3>

          <div className="text-xs text-gray-400 space-y-1">
            <p>الاسم: <span className="text-white font-bold">{order.customer_name}</span></p>
            <p>رقم الهاتف: <span dir="ltr" className="text-white font-bold">{order.customer_phone}</span></p>
            {order.delivery_address && <p>عنوان التوصيل: <span className="text-white font-bold">{order.delivery_address}</span></p>}
          </div>

          <div className="space-y-3 divide-y divide-gray-800/60 pt-2 border-t border-gray-800">
            {items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between">
                <div>
                  <span className="font-bold text-sm text-white">{item.quantity}x {item.menu_items?.name}</span>
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
      </div>
    </div>
  );
}

export default function ExternalStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950 p-6 text-white text-center">جاري التحميل...</div>}>
      <ExternalStatusContent />
    </Suspense>
  );
}
