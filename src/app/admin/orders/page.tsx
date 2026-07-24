'use client';

import React, { useState } from 'react';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { activateAudio, isAudioEnabled } from '@/services/audio.service';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatElapsedTime } from '@/utils/formatters';
import { ChefHat, Bell, Volume2, Printer, Clock, Bike, ShoppingBag, Utensils, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { AdminNav } from '@/components/layout/AdminNav';

export default function KDSOrdersPage() {
  const { orders, waiterCalls, isLoading, refetch, refetchCalls } = useRealtimeOrders();
  const { updateOrderStatus } = useOfflineQueue(refetch);

  const [activeTab, setActiveTab] = useState<'dine_in' | 'external'>('dine_in');
  const [audioActive, setAudioActive] = useState(isAudioEnabled());
  const [kotOrder, setKotOrder] = useState<any | null>(null);

  const handleActivateAudio = async () => {
    const success = await activateAudio();
    setAudioActive(success);
  };

  const handleResolveWaiterCall = async (callId: string) => {
    await supabase.from('waiter_calls').update({ status: 'resolved' }).eq('id', callId);
    refetchCalls();
  };

  // Kitchen sees ONLY orders that were sent by Cashier (preparing, ready, completed)
  // New 'pending' orders waiting at Cashier are hidden until Cashier sends them!
  const kitchenOrders = orders.filter((o) => o.status !== 'pending');

  const filteredOrders = kitchenOrders
    .filter((o) => {
      if (activeTab === 'dine_in') return o.type === 'dine_in';
      return o.type === 'takeout' || o.type === 'delivery';
    })
    .sort((a, b) => {
      const isFinishedA = a.status === 'completed' || a.status === 'cancelled';
      const isFinishedB = b.status === 'completed' || b.status === 'cancelled';

      if (isFinishedA && !isFinishedB) return 1;
      if (!isFinishedA && isFinishedB) return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <AdminNav />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-900 border border-gold-500/30 rounded-3xl p-4 sm:px-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-500 text-dark-950 flex items-center justify-center font-black">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-white">شاشة المطبخ KDS (الأطباق المحولة من الكاشير)</h1>
              <p className="text-xs text-gray-400">تأكيد بدء التحضير ➔ تحديث الحالة ➔ إعادة الطلب إلى الكاشير</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!audioActive && (
              <Button
                onClick={handleActivateAudio}
                variant="outline"
                className="text-xs text-gold-400 border-gold-500/50 hover:bg-gold-500/10 py-2"
              >
                <Volume2 className="w-4 h-4 ml-1.5 animate-bounce text-gold-400" />
                <span>تفعيل التنبيهات الصوتية</span>
              </Button>
            )}
          </div>
        </div>

        {/* Pending Waiter Calls Alert Bar */}
        {waiterCalls.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <Bell className="w-5 h-5" />
              <span>تنبيـه: توجد {waiterCalls.length} نداءات نادل معلقة!</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {waiterCalls.map((call: WaiterCallRow) => (
                <div
                  key={call.id}
                  className="bg-dark-900 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white">
                      {call.type === 'request_bill' ? '💳 طلب فاتورة' : '🔔 نداء النادل'}
                    </span>
                    <span className="block text-[11px] text-amber-400 font-mono">
                      طاولة رقم #{call.table_id?.slice(0, 4)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleResolveWaiterCall(call.id)}
                    className="bg-amber-500 hover:bg-amber-600 text-dark-950 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    تمت التلبية
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-800 space-x-4 space-x-reverse">
          <button
            onClick={() => setActiveTab('dine_in')}
            className={`pb-3 font-bold text-sm flex items-center gap-2 transition border-b-2 ${
              activeTab === 'dine_in'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>طلبات الصالة (طاولات)</span>
            <span className="bg-gold-500/10 text-gold-400 text-xs px-2 py-0.5 rounded-full font-bold">
              {kitchenOrders.filter((o) => o.type === 'dine_in').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('external')}
            className={`pb-3 font-bold text-sm flex items-center gap-2 transition border-b-2 ${
              activeTab === 'external'
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>الطلبات الخارجية (توصيل/استلام)</span>
            <span className="bg-gold-500/10 text-gold-400 text-xs px-2 py-0.5 rounded-full font-bold">
              {kitchenOrders.filter((o) => o.type === 'takeout' || o.type === 'delivery').length}
            </span>
          </button>
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500 font-bold text-base">جاري تحميل طلبات المطبخ...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-dark-900/40 rounded-3xl border border-gray-800 text-gray-500">
            <ChefHat className="w-12 h-12 stroke-[1.5] mx-auto mb-2 text-gray-600" />
            <p className="font-bold text-base">لا توجد طلبات في المطبخ حالياً (في انتظار تحويل الكاشير)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isFinished = order.status === 'completed' || order.status === 'cancelled';
              const isCooking = order.status === 'preparing';
              const isReady = order.status === 'ready';

              return (
                <div
                  key={order.id}
                  className={`bg-dark-900 border rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all ${
                    isFinished
                      ? 'border-gray-850 opacity-50 bg-dark-950/80 grayscale-[30%]'
                      : isCooking
                      ? 'border-gold-500/50 bg-gold-500/5 ring-1 ring-gold-500/30'
                      : 'border-gray-800 hover:border-gold-500/40'
                  }`}
                >
                  {/* Order Top Info */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-lg ${isFinished ? 'line-through text-gray-500' : 'text-white'}`}>
                          #{order.order_number}
                        </span>
                        {order.type === 'dine_in' && (
                          <span className="bg-gold-500/20 text-gold-400 border border-gold-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            طاولة #{order.tables?.table_number || '?'}
                          </span>
                        )}
                        {order.type === 'delivery' && (
                          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Bike className="w-3 h-3" /> توصيل
                          </span>
                        )}
                        {order.type === 'takeout' && (
                          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" /> استلام
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-gold-400" />
                        <span>{formatElapsedTime(order.created_at)}</span>
                      </div>
                    </div>

                    {/* Customer details */}
                    {(order.customer_name || order.customer_phone) && (
                      <div className="mt-2 text-xs text-gray-300 space-y-0.5 bg-dark-950 p-2.5 rounded-xl border border-gray-800">
                        <p>العميل: <span className="font-bold text-white">{order.customer_name}</span></p>
                        <p>الهاتف: <span dir="ltr" className="font-bold text-gold-400">{order.customer_phone}</span></p>
                      </div>
                    )}

                    {/* Itemized Order Breakdown */}
                    <div className="mt-3 space-y-2">
                      {order.order_items?.map((item: OrderWithDetails['order_items'][number]) => (
                        <div key={item.id} className="text-xs bg-dark-950 p-2.5 rounded-xl border border-gray-800/60">
                          <div className={`flex items-center justify-between font-bold ${isFinished ? 'line-through text-gray-500' : 'text-white'}`}>
                            <span>{item.quantity}x {item.menu_items?.name}</span>
                          </div>
                          {item.order_item_modifiers?.length > 0 && (
                            <p className="text-[11px] text-gray-400 mt-1">
                              +{item.order_item_modifiers.map((m: OrderWithDetails['order_items'][number]['order_item_modifiers'][number]) => m.modifiers?.name).join(', ')}
                            </p>
                          )}
                          {item.notes && <p className="text-[11px] text-amber-400/90 italic mt-0.5">ملاحظة: {item.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kitchen Action Buttons */}
                  <div className="pt-3 border-t border-gray-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <StatusBadge status={order.status} />
                      <span dir="ltr" className="font-extrabold text-sm text-gold-400">
                        {formatCurrency(Number(order.total_amount))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isReady && !isFinished ? (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex-1 text-dark-950 font-black py-2.5 text-xs flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-4 h-4" />
                          <span>إعادة الطلب إلى الكاشير (جاهز) 🔔</span>
                        </Button>
                      ) : isReady ? (
                        <div className="flex-1 text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          ✓ تم تسليمه للكاشير (في انتظار الدفع)
                        </div>
                      ) : (
                        <div className="flex-1 text-center py-2 text-xs font-bold text-gray-500 bg-dark-950 rounded-xl border border-gray-850">
                          مكتمل / مشطوب في الأسفل
                        </div>
                      )}

                      <button
                        onClick={() => setKotOrder(order)}
                        className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 border border-gray-700 transition"
                        title="طباعة تذكرة المطبخ KOT"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* KOT Print Preview Modal */}
        {kotOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white text-black p-6 rounded-2xl max-w-sm w-full space-y-4 printable-receipt shadow-2xl">
              <div className="text-center border-b pb-3 border-black/20">
                <h2 className="font-black text-xl">تذكرة المطبخ KOT</h2>
                <p className="text-xs">طلب #{kotOrder.order_number}</p>
                <p className="text-xs font-mono">{new Date(kotOrder.created_at).toLocaleTimeString('ar-DZ')}</p>
              </div>

              <div className="space-y-2 text-sm">
                {kotOrder.order_items?.map((item: OrderWithDetails['order_items'][number]) => (
                  <div key={item.id} className="flex justify-between border-b pb-1 font-bold">
                    <span>{item.quantity}x {item.menu_items?.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-black text-white py-2 rounded-xl text-xs font-bold"
                >
                  طباعة الآن 🖨️
                </button>
                <button
                  onClick={() => setKotOrder(null)}
                  className="bg-gray-200 text-black px-4 py-2 rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
