'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, Receipt, Utensils, QrCode, LogOut, ShieldCheck } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/admin/orders',
      label: 'شاشة المطبخ (KDS)',
      icon: <ChefHat className="w-4 h-4" />,
    },
    {
      href: '/admin/cashier',
      label: 'صندوق الكاشير والفواتير',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      href: '/admin/menu-management',
      label: 'إدارة المنيو والأطباق',
      icon: <Utensils className="w-4 h-4" />,
    },
    {
      href: '/admin/tables',
      label: 'إدارة الطاولات ورموز QR',
      icon: <QrCode className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="bg-dark-900 border-b border-gold-500/20 px-4 py-3 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="w-9 h-9 rounded-xl bg-gold-500 text-dark-950 flex items-center justify-center font-black shadow-md shadow-gold-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-white leading-tight">لوحة الإدارة والطاقم</h1>
            <span className="text-[11px] text-gold-400 font-semibold">مطعم الأصالة والذوق الجميل</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto p-1 bg-dark-950 rounded-2xl border border-gray-800">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-dark-950 shadow-md shadow-gold-500/20 scale-[1.02]'
                    : 'text-gray-400 hover:text-white hover:bg-dark-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Exit Button */}
        <Link
          href="/admin/login"
          className="self-end md:self-auto text-xs text-gray-400 hover:text-red-400 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-800 hover:border-red-500/30 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>خروج</span>
        </Link>
      </div>
    </nav>
  );
}
