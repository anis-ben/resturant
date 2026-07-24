'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, PhoneCall, Clock } from 'lucide-react';

interface HeaderProps {
  tableNumber?: number | null;
  restaurantName?: string;
  isOpen?: boolean;
}

export function Header({ tableNumber, restaurantName = 'مطعم الأصالة والذوق الجميل', isOpen = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-gold-500/20 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-dark-950 shadow-md group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gold-400 leading-tight">{restaurantName}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}
              </span>
            </div>
          </div>
        </Link>

        {tableNumber !== undefined && tableNumber !== null && (
          <div className="bg-gold-500/10 border border-gold-500/30 text-gold-400 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span>طاولة رقم</span>
            <span dir="ltr" className="font-bold text-sm bg-gold-500 text-dark-950 px-2 py-0.5 rounded-full">
              #{tableNumber}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
