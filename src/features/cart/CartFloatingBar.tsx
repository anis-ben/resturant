'use client';

import React from 'react';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface CartFloatingBarProps {
  itemCount: number;
  totalAmount: number;
  onOpenCart: () => void;
}

export function CartFloatingBar({ itemCount, totalAmount, onOpenCart }: CartFloatingBarProps) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto animate-slideUp">
      <button
        onClick={onOpenCart}
        className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-dark-950 p-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-base transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-dark-950 text-gold-400 flex items-center justify-center text-xs font-black">
            {itemCount}
          </div>
          <span>عرض السلة وإرسال الطلب</span>
        </div>

        <div className="flex items-center gap-2">
          <span dir="ltr" className="font-extrabold">
            {formatCurrency(totalAmount)}
          </span>
          <ArrowLeft className="w-5 h-5 rotate-180" />
        </div>
      </button>
    </div>
  );
}
