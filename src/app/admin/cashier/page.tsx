'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { fetchRestaurantSettings, RestaurantSettings } from '@/services/settings.service';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Database, OrderType, OrderStatus } from '@/types/database.types';
import { Receipt, Search, CreditCard, Banknote, RefreshCcw, Bike, CheckCircle2, Printer, ChefHat } from 'lucide-react';
import { AdminNav } from '@/components/layout/AdminNav';

// ─── Typed interfaces for Cashier page data ──────────────────────────────────

interface CashierPayment {
  id: string;
  status: string;
  receipt_number: string;
  printed_count: number;
}

interface CashierOrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  menu_items: { name: string } | null;
  order_item_modifiers: { id: string; modifiers: { name: string } | null }[];
}

interface CashierOrder extends Database['public']['Tables']['orders']['Row'] {
  tables: { table_number: number } | null;
  payments: CashierPayment[];
  order_items: CashierOrderItem[];
}

interface ReceiptResult {
  receiptNumber: string;
  isDuplicate: boolean;
  printedCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CashierPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [orders, setOrders] = useState<CashierOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<CashierOrder | null>(null);

  // Settlement Form State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptResult, setReceiptResult] = useState<ReceiptResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, tables(table_number), payments(id, status, receipt_number, printed_count), order_items(id, quantity, unit_price, notes, menu_items(name), order_item_modifiers(id, modifiers(name)))')
        .order('created_at', { ascending: false });

      if (data) setOrders(data as CashierOrder[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurantSettings().then(setSettings);
    fetchOrders();

    const channel = supabase
      .channel('cashier_workflow_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // Sort orders: New pending / ready orders top, completed/paid at the bottom strikethrough
  const filteredOrders = orders
    .filter((o) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const matchesNumber = o.order_number.toString().includes(query);
      const matchesTable = o.tables?.table_number?.toString() === query;
      const matchesPhone = o.customer_phone?.includes(query);
      return matchesNumber || matchesTable || matchesPhone;
    })
    .sort((a, b) => {
      const isFinishedA = a.status === 'completed' || a.status === 'out_for_delivery' || a.payments?.some((p: CashierPayment) => p.status === 'paid');
      const isFinishedB = b.status === 'completed' || b.status === 'out_for_delivery' || b.payments?.some((p: CashierPayment) => p.status === 'paid');

      if (isFinishedA && !isFinishedB) return 1;
      if (!isFinishedA && isFinishedB) return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Action 1: Cashier sends order to kitchen (updates status to 'preparing')
  const handleSendToKitchen = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'preparing', updated_at: new Date().toISOString() }).eq('id', orderId);
    fetchOrders();
  };

  // Action 2: Cashier hands delivery order to driver
  const handleSendToDelivery = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'out_for_delivery', updated_at: new Date().toISOString() }).eq('id', orderId);
    fetchOrders();
  };

  const handleOpenSettlement = (order: CashierOrder) => {
    setSelectedOrder(order);
    setReceiptResult(null);
    setErrorMessage(null);
    setDiscountAmount(0);
    setAmountTendered(Number(order.total_amount).toString());
  };

  const calculateSettlementDetails = () => {
    if (!selectedOrder) return { subtotal: 0, tax: 0, grandTotal: 0, change: 0 };
    const subtotal = Number(selectedOrder.total_amount);
    const taxRate = Number(settings?.tax_rate || 19);
    const tax = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + tax - discountAmount;
    const tendered = parseFloat(amountTendered) || 0;
    const change = Math.max(0, tendered - grandTotal);

    return { subtotal, tax, grandTotal, change };
  };

  const { subtotal, tax, grandTotal, change } = calculateSettlementDetails();

  const handleSettleAndPrint = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          payment_method: paymentMethod,
          amount_tendered: parseFloat(amountTendered) || grandTotal,
          discount_amount: discountAmount,
          tax_amount: tax,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تسديد الفاتورة');

      setReceiptResult(data);
      fetchOrders();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'حدث خطأ في التسديد';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <AdminNav />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-900 border border-gold-500/30 rounded-3xl p-4 sm:px-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-500 text-dark-950 flex items-center justify-center font-black">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-white">صندوق الكاشير واستقبال الفواتير</h1>
              <p className="text-xs text-gray-400">استقبال الطلبات الجديدة ➔ إرسال للمطبخ ➔ طباعة الوصل والتسديد</p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الطلب، الطاولة، أو الهاتف..."
              className="w-full bg-dark-900 border border-gray-800 rounded-2xl py-3.5 pr-12 pl-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-dark-900 border border-gray-800 rounded-3xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="pt-3 border-t border-gray-800 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isPaid = order.payments?.some((p: CashierPayment) => p.status === 'paid');
            const isFinished = order.status === 'completed' || order.status === 'out_for_delivery' || isPaid;
            const isPendingAtCashier = order.status === 'pending';
            const isReturnedFromKitchen = order.status === 'ready';
            const isExternal = order.type === 'delivery' || order.type === 'takeout';

            return (
              <div
                key={order.id}
                className={`bg-dark-900 border rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all ${
                  isFinished
                    ? 'border-gray-850 opacity-50 bg-dark-950/80'
                    : isReturnedFromKitchen
                    ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30'
                    : 'border-gray-800 hover:border-gold-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-lg ${isFinished ? 'line-through text-gray-500' : 'text-white'}`}>
                        طلب #{order.order_number}
                      </span>
                      {order.type === 'dine_in' ? (
                        <span className="bg-gold-500/10 text-gold-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          طاولة #{order.tables?.table_number || '?'}
                        </span>
                      ) : (
                        <span className="bg-purple-500/10 text-purple-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          خارجي ({order.type === 'delivery' ? 'توصيل' : 'استلام'})
                        </span>
                      )}
                    </div>

                    {isReturnedFromKitchen && (
                      <span className="bg-emerald-500 text-dark-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                        عائد من المطبخ (جاهز) 🔔
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-gray-300">
                    {order.order_items?.map((item: CashierOrderItem) => (
                      <div key={item.id} className={`flex justify-between ${isFinished ? 'line-through text-gray-500' : ''}`}>
                        <span>{item.quantity}x {item.menu_items?.name}</span>
                        <span dir="ltr" className="text-gold-400 font-bold">{formatCurrency(Number(item.unit_price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block">الإجمالي المبدئي</span>
                      <span dir="ltr" className="font-extrabold text-base text-gold-400">
                        {formatCurrency(Number(order.total_amount))}
                      </span>
                    </div>

                    {isFinished && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>مكتمل / مشطوب في الأسفل</span>
                      </span>
                    )}
                  </div>

                  {/* Cashier Workflow Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {/* Action 1: New order arrived at Cashier -> Send to Kitchen */}
                    {isPendingAtCashier && !isFinished && (
                      <Button
                        onClick={() => handleSendToKitchen(order.id)}
                        className="w-full text-dark-950 font-black text-xs py-3 flex items-center justify-center gap-1.5"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>إرسال الطلب إلى المطبخ 🍳</span>
                      </Button>
                    )}

                    {/* Action 2: Order returned ready from kitchen or dine-in ready to settle -> Settle & Print Bill */}
                    {(!isPendingAtCashier && !isFinished) && (
                      <Button
                        onClick={() => handleOpenSettlement(order)}
                        className="w-full text-dark-950 font-black text-xs py-2.5 flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        <span>طباعة الفاتورة وتأكيد الدفع 💳</span>
                      </Button>
                    )}

                    {/* Action 3: External order delivery handover */}
                    {isExternal && isReturnedFromKitchen && !isFinished && (
                      <Button
                        onClick={() => handleSendToDelivery(order.id)}
                        variant="outline"
                        className="w-full text-xs border-purple-500/40 text-purple-400 hover:bg-purple-500/10 py-2 font-bold flex items-center justify-center gap-1.5"
                      >
                        <Bike className="w-4 h-4" />
                        <span>التسليم للتوصيل الخارجي 🛵</span>
                      </Button>
                    )}

                    {/* Strikethrough Finished Reprint Button */}
                    {isFinished && (
                      <button
                        onClick={() => handleOpenSettlement(order)}
                        className="w-full bg-dark-800 hover:bg-dark-700 text-gray-400 font-bold text-xs py-2 rounded-xl border border-gray-700 flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-4 h-4 text-gold-400" />
                        <span>إعادة طباعة الوصل (نسخة ثانية)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Settlement & Print Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-dark-900 border border-gold-500/30 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white">تسديد الفاتورة وطباعة الإيصال</h2>
                  <p className="text-xs text-gold-400 font-bold mt-1">
                    طلب #{selectedOrder.order_number} {selectedOrder.tables?.table_number ? `· طاولة #${selectedOrder.tables.table_number}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'cash'
                      ? 'bg-gold-500 text-dark-950 border-gold-500'
                      : 'bg-dark-950 text-gray-400 border-gray-800'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span>نقداً (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'card'
                      ? 'bg-gold-500 text-dark-950 border-gold-500'
                      : 'bg-dark-950 text-gray-400 border-gray-800'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>بطاقة (CIB/Dahabia)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition ${
                    paymentMethod === 'online'
                      ? 'bg-gold-500 text-dark-950 border-gold-500'
                      : 'bg-dark-950 text-gray-400 border-gray-800'
                  }`}
                >
                  <RefreshCcw className="w-5 h-5" />
                  <span>دفع إلكتروني</span>
                </button>
              </div>

              {/* Cash Calculator Inputs */}
              {paymentMethod === 'cash' && (
                <div className="grid grid-cols-2 gap-3 bg-dark-950 p-4 rounded-2xl border border-gray-800">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">المبلغ المستلم من الزبون</label>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      className="w-full bg-dark-900 border border-gray-800 rounded-xl p-2.5 text-sm font-extrabold text-white text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">الباقي للزبون (Change)</label>
                    <div dir="ltr" className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 text-sm font-black text-emerald-400 text-center">
                      {formatCurrency(change)}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtotal & Tax Breakdown */}
              <div className="space-y-2 text-xs text-gray-400 border-t border-gray-800 pt-4">
                <div className="flex justify-between">
                  <span>المجموع المبدئي</span>
                  <span dir="ltr" className="font-bold text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>الضريبة ({settings?.tax_rate || 19}%)</span>
                  <span dir="ltr" className="font-bold text-white">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-800 text-sm font-black text-white">
                  <span>المجموع المستحق للدفع</span>
                  <span dir="ltr" className="text-gold-400 text-base">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* CTA */}
              {!receiptResult ? (
                <Button
                  onClick={handleSettleAndPrint}
                  isLoading={isSubmitting}
                  className="w-full text-dark-950 font-black py-4 text-base"
                >
                  تأكيد الدفع وإصدار الفاتورة 🖨️
                </Button>
              ) : (
                <div className="space-y-3 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center">
                  <p className="text-emerald-400 font-bold text-sm">
                    ✓ تم تسجيل العملية برقم إيصال <span className="font-mono">{receiptResult.receiptNumber}</span>
                  </p>
                  {receiptResult.isDuplicate && (
                    <p className="text-amber-400 text-xs font-bold">⚠️ تنبيه: هذه نسخة ثانية عن الإيصال الأصلي (Reprint Duplicate)</p>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => window.print()} className="flex-1 text-dark-950 font-bold py-3 text-xs">
                      طباعة الإيصال الحراري (80mm) 🖨️
                    </Button>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="bg-gray-800 text-white font-bold px-4 py-3 rounded-xl text-xs"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden printable thermal template */}
              {receiptResult && (
                <div className="hidden printable-receipt">
                  <div className="text-center font-mono text-black">
                    <h2 className="font-black text-lg">{settings?.name_ar}</h2>
                    <p className="text-xs">{settings?.address}</p>
                    <p className="text-xs">هاتف: {settings?.phone_number}</p>
                    {receiptResult.isDuplicate && <p className="text-xs font-bold border my-1 p-0.5">*** نسخة ثانية (DUPLICATE) ***</p>}
                    <hr className="my-2 border-black" />
                    <p className="text-xs font-bold">رقم الإيصال: {receiptResult.receiptNumber}</p>
                    <p className="text-xs">طلب #{selectedOrder.order_number}</p>
                    <hr className="my-2 border-black" />
                    <div className="space-y-1 text-xs text-right">
                      {selectedOrder.order_items?.map((item: CashierOrderItem) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.menu_items?.name}</span>
                          <span>{formatCurrency(Number(item.unit_price) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <hr className="my-2 border-black" />
                    <div className="text-xs space-y-1 text-right">
                      <p>المجموع: {formatCurrency(subtotal)}</p>
                      <p>الضريبة: {formatCurrency(tax)}</p>
                      <p className="font-bold text-sm">الإجمالي: {formatCurrency(grandTotal)}</p>
                      {paymentMethod === 'cash' && <p>الباقي: {formatCurrency(change)}</p>}
                    </div>
                    <hr className="my-2 border-black" />
                    <p className="text-xs font-bold">شكراً لزيارتكم 🌟</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
