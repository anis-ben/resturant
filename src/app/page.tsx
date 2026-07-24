'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bike, MapPin, Phone, Clock, ArrowLeft, Search, PackageCheck } from 'lucide-react';
import { fetchRestaurantSettings, RestaurantSettings } from '@/services/settings.service';
import { Header } from '@/components/layout/Header';

export default function HomePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [trackOrderId, setTrackOrderId] = useState('');

  useEffect(() => {
    fetchRestaurantSettings().then(setSettings);
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId.trim()) return;
    router.push(`/external-status?orderId=${trackOrderId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-between">
      <Header restaurantName={settings?.name_ar} isOpen={settings?.is_open} />

      {/* Hero Section */}
      <div className="relative overflow-hidden py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl -z-10" />

        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-block bg-gold-500/10 border border-gold-500/30 text-gold-400 px-4 py-1.5 rounded-full text-xs font-bold">
            أهلاً بكم في التجربة الرقمية الفاخرة ✨
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            تذوق أصالة <span className="text-gold-400">النكهات الجزائرية</span> والشرقية
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            استمتع بأشهى المشويات والأطباق التقليدية والبرغر. اطلب الآن للتوصيل المباشر أو تتبع حالة طلبك فورياً!
          </p>
        </div>

        {/* Customer Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 max-w-3xl mx-auto">
          {/* Card 1: Online Delivery & Pickup */}
          <Link
            href="/order-online"
            className="group relative bg-dark-900 border border-gold-500/40 hover:border-gold-500 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-gold-500/10 active:scale-[0.99]"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-xl text-white group-hover:text-gold-400 transition-colors">
                طلب توصيل أو استلام 🛵
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                استعرض قائمتنا واطلب وجبتك المفضلة لتصلك حتى باب المنزل أو للاستلام السريع.
              </p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800 text-gold-400 text-sm font-bold">
              <span>تصفح القائمة والطلب</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Track Order Card */}
          <div className="bg-dark-900 border border-gray-800 rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-xl text-white">
                تتبع حالة الطلب 🔍
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                أدخل معرف الطلب أو رقم الشفرة الممنوح لك لمتابعة مراحل تحضير وتوصيل وجبتك.
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                value={trackOrderId}
                onChange={(e) => setTrackOrderId(e.target.value)}
                placeholder="معرف الطلب (UUID)..."
                className="w-full bg-dark-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
              <button
                type="submit"
                className="bg-gold-500 hover:bg-gold-600 text-dark-950 px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition"
              >
                تتبع
              </button>
            </form>
          </div>
        </div>

        {/* Restaurant Quick Infos */}
        <div className="mt-12 bg-dark-900/60 border border-gray-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <MapPin className="w-5 h-5 text-gold-400" />
            <span className="text-xs font-semibold">{settings?.address}</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <Phone className="w-5 h-5 text-gold-400" />
            <span dir="ltr" className="text-xs font-bold text-gold-400">
              {settings?.phone_number}
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <Clock className="w-5 h-5 text-gold-400" />
            <span className="text-xs font-semibold">يومياً من 11:00 صباحاً إلى 11:00 مساءً</span>
          </div>
        </div>
      </div>

      <footer className="py-6 border-t border-gray-900 text-center text-xs text-gray-600">
        جميع الحقوق محفوظة © {new Date().getFullYear()} — {settings?.name_ar}
      </footer>
    </div>
  );
}
