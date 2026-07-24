'use client';

import React, { useState } from 'react';
import { CartItem, calculateItemLineTotal } from '@/utils/calculations';
import { formatCurrency } from '@/utils/formatters';
import { X, Trash2, Plus, Minus, Send, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  tableToken?: string | null;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  grandTotal: number;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  tableToken,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  grandTotal,
}: CartDrawerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        type: tableToken ? 'dine_in' : 'takeout',
        access_token: tableToken || undefined,
        items: items.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          notes: item.notes,
          selected_modifiers: item.selected_modifiers.map((m) => ({
            modifier_id: m.modifier_id,
          })),
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل إرسال الطلب');
      }

      onClearCart();
      onClose();

      if (tableToken) {
        router.push(`/order-status?orderId=${data.orderId}`);
      } else {
        router.push(`/external-status?orderId=${data.orderId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الطلب';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-900 border-r border-gold-500/30 w-full max-w-md h-full flex flex-col justify-between shadow-2xl">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gold-400">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-bold text-lg text-white">سلة الطلبات</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-3">
              <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm">السلة فارغة حالياً</p>
            </div>
          ) : (
            items.map((item) => {
              const itemTotal = calculateItemLineTotal(item);
              return (
                <div key={item.id} className="bg-dark-950 border border-gray-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      {item.selected_modifiers.length > 0 && (
                        <p className="text-xs text-gold-400/80 mt-0.5">
                          {item.selected_modifiers.map((m) => m.name).join(' ، ')}
                        </p>
                      )}
                      {item.notes && <p className="text-xs text-gray-400 italic mt-0.5">ملاحظة: {item.notes}</p>}
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
                    <div className="flex items-center border border-gray-800 rounded-lg bg-dark-900 px-1 py-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-300 hover:bg-gray-800"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span dir="ltr" className="w-7 text-center font-bold text-xs text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded flex items-center justify-center text-gray-300 hover:bg-gray-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span dir="ltr" className="font-bold text-sm text-gold-400">
                      {formatCurrency(itemTotal)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="p-4 bg-dark-950 border-t border-gray-800 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">المجموع المبدئي</span>
              <span dir="ltr" className="font-black text-lg text-gold-400">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            <Button
              onClick={handleSubmitOrder}
              isLoading={isSubmitting}
              className="w-full text-dark-950 font-extrabold flex items-center justify-center gap-2 py-3.5"
            >
              <Send className="w-5 h-5" />
              <span>إرسال الطلب للمطبخ</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
