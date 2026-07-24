'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, User, Lock, ChefHat, Receipt, Utensils } from 'lucide-react';
import { StaffRole } from '@/types/database.types';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('kitchen');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Fast-path demo staff routing with role context
    setTimeout(() => {
      if (selectedRole === 'kitchen') {
        router.push('/admin/orders');
      } else if (selectedRole === 'cashier') {
        router.push('/admin/cashier');
      } else if (selectedRole === 'admin') {
        router.push('/admin/menu-management');
      } else {
        router.push('/admin/orders');
      }
      setIsLoading(false);
    }, 400);
  };

  const roles: { role: StaffRole; label: string; icon: React.ReactNode }[] = [
    { role: 'kitchen', label: 'المطبخ (KDS)', icon: <ChefHat className="w-5 h-5" /> },
    { role: 'cashier', label: 'الكاشير والصندوق', icon: <Receipt className="w-5 h-5" /> },
    { role: 'admin', label: 'إدارة المنيو والطاولات', icon: <ShieldCheck className="w-5 h-5" /> },
    { role: 'waiter', label: 'طاقم الصالة (النادل)', icon: <Utensils className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-between">
      <Header />

      <div className="max-w-md mx-auto w-full p-4 my-auto space-y-6">
        <div className="bg-dark-900 border border-gold-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white">دخول طاقم العمل والمطبخ</h1>
            <p className="text-xs text-gray-400">اختر دورك الوظيفي للوصول إلى الواجهة المخصصة</p>
          </div>

          {/* Role Selection Chips */}
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => setSelectedRole(r.role)}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  selectedRole === r.role
                    ? 'bg-gold-500 text-dark-950 border-gold-500 shadow-md shadow-gold-500/20 scale-[1.02]'
                    : 'bg-dark-950 text-gray-400 border-gray-800 hover:border-gray-700'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">البريد الإلكتروني / اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@restaurant.dz"
                  className="w-full bg-dark-950 border border-gray-800 rounded-xl py-3 pr-10 pl-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">كلمة المرور / الرمز السرّي</label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-950 border border-gray-800 rounded-xl py-3 pr-10 pl-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full text-dark-950 font-black py-3.5">
              الدخول للوحة التحكم
            </Button>
          </form>
        </div>
      </div>

      <div className="py-4 text-center text-xs text-gray-600">نظام لوحة التحكم والمطبخ الحية KDS v2.0</div>
    </div>
  );
}
