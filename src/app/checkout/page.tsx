'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import { fetchRestaurantSettings, RestaurantSettings } from '@/services/settings.service';
import { formatCurrency } from '@/utils/formatters';
import { MapPin, Phone, User, Bike, ShoppingBag, Send, AlertCircle } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get('mode') as 'delivery' | 'takeout') || 'delivery';

  const { items, grandTotal, clearCart } = useCart();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurantSettings().then(setSettings);
  }, []);

  const deliveryFee = mode === 'delivery' ? Number(settings?.delivery_fee || 400) : 0;
  const finalTotal = grandTotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!customerName || customerName.trim().length < 2) {
      setErrorMessage('يرجى إدخال اسم الكامل صحيح');
      setIsSubmitting(false);
      return;
    }

    if (!customerPhone || !/^(\+213|0)(5|6|7|23)[0-9]{8}$/.test(customerPhone.trim())) {
      setErrorMessage('يرجى إدخال رقم هاتف جزائري صحيح (مثال: 0550123456)');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'delivery' && (!deliveryAddress || deliveryAddress.trim().length < 5)) {
      setErrorMessage('يرجى إدخال عنوان التوصيل المفصل');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        type: mode,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: mode === 'delivery' ? deliveryAddress : undefined,
        address_landmark: landmark || undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          notes: item.notes,
          selected_modifiers: item.selected_modifiers.map((m) => ({ modifier_id: m.modifier_id })),
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الطلب');

      clearCart();
      router.push(`/external-status?orderId=${data.orderId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ في النظام';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-16">
      <Header />

      <div className="max-w-xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">إتمام الطلب والدفع</h1>
          <p className="text-xs text-gray-400">
            {mode === 'delivery' ? 'طلب توصيل للمنزل 🛵' : 'استلام مباشر من المطعم 🛍️'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div className="bg-dark-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-base text-gold-400 border-b border-gray-800 pb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>معلومات التواصل</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: محمد الأمين"
                  className="w-full bg-dark-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0550123456"
                  className="w-full bg-dark-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          {mode === 'delivery' && (
            <div className="bg-dark-900 border border-gray-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-base text-gold-400 border-b border-gray-800 pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>عنوان التوصيل</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">العنوان التفصيلي *</label>
                  <textarea
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="الحي، اسم الشارع، رقم العمارة أو الشقة..."
                    rows={2}
                    className="w-full bg-dark-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">معلم قادم بالقرب منك (اختياري)</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="مثال: بجانب مسجد الأمة"
                    className="w-full bg-dark-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Order Summary & Payment */}
          <div className="bg-dark-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white border-b border-gray-800 pb-3">ملخص الحساب والدفع</h3>

            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>مجموع الأطباق</span>
                <span dir="ltr" className="font-bold text-white">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
              {mode === 'delivery' && (
                <div className="flex justify-between">
                  <span>رسوم التوصيل</span>
                  <span dir="ltr" className="font-bold text-white">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-800 text-base font-extrabold text-white">
                <span>المبلغ الإجمالي</span>
                <span dir="ltr" className="text-gold-400 text-lg">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            <div className="pt-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              💵 طريقة الدفع: الدفع نقداً عند الاستلام / التوصيل
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full text-dark-950 font-black py-4 text-base flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span>تأكيد الطلب المباشر</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950 p-6 text-white text-center">جاري التحميل...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
