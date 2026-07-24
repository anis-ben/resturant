'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase/client';
import { QrCode, Download, RefreshCw } from 'lucide-react';
import { AdminNav } from '@/components/layout/AdminNav';

export default function TablesManagementPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchTables = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('tables').select('*').order('table_number', { ascending: true });

    if (data) {
      setTables(data);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const urls: Record<string, string> = {};

      for (const t of data) {
        const fullUrl = `${origin}/menu?t=${t.access_token}`;
        try {
          const dataUrl = await QRCode.toDataURL(fullUrl, { width: 300, margin: 2 });
          urls[t.id] = dataUrl;
        } catch (e) {
          console.error('QR gen error:', e);
        }
      }
      setQrDataUrls(urls);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleRegenerateToken = async (tableId: string) => {
    if (!confirm('هل أنت تأكد من إلغاء رمز الوصول القديم وتوليد رمز QR جديد لهذه الطاولة؟')) return;

    const newAccessToken = crypto.randomUUID();
    await supabase.from('tables').update({ access_token: newAccessToken }).eq('id', tableId);
    fetchTables();
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <AdminNav />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-900 border border-gold-500/30 rounded-3xl p-4 sm:px-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-500 text-dark-950 flex items-center justify-center font-black">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-white">إدارة طاولات الصالة ورموز QR</h1>
              <p className="text-xs text-gray-400">طباعة بطاقات QR المخصصة لكل طاولة بأمان تـام</p>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500 font-bold">جاري توليد رموز QR للطاولات...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-dark-900 border border-gray-800 hover:border-gold-500/40 rounded-3xl p-6 flex flex-col items-center text-center space-y-4 shadow-xl transition-all"
              >
                <div className="bg-gold-500/10 border border-gold-500/30 text-gold-400 font-black text-sm px-4 py-1 rounded-full">
                  طاولة رقم #{table.table_number}
                </div>

                {/* QR Image Box */}
                {qrDataUrls[table.id] && (
                  <div className="bg-white p-3 rounded-2xl shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrls[table.id]} alt={`Table ${table.table_number} QR`} className="w-44 h-44" />
                  </div>
                )}

                <div className="text-[11px] text-gray-500 font-mono truncate w-full px-2">
                  Token: {table.access_token.slice(0, 13)}...
                </div>

                <div className="flex items-center gap-2 w-full pt-2 border-t border-gray-800">
                  {qrDataUrls[table.id] && (
                    <a
                      href={qrDataUrls[table.id]}
                      download={`table_${table.table_number}_qr.png`}
                      className="flex-1 bg-gold-500 hover:bg-gold-600 text-dark-950 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل QR</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleRegenerateToken(table.id)}
                    className="p-2 bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white rounded-xl border border-gray-700 transition"
                    title="تجديد رمز الوصول الأمني"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
