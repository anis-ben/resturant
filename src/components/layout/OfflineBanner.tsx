'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncQueue } = useOfflineQueue();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-sm font-medium shadow-md transition-all">
      <div className="flex items-center gap-2">
        <WifiOff className="w-5 h-5 animate-pulse text-amber-200" />
        <span>
          {!isOnline
            ? '🔴 غير متصل بالإنترنت — سيتم مزامنة التغييرات تلقائياً عند عودة الاتصال'
            : `جاري مزامنة ${pendingCount} تحديثات معلقة...`}
        </span>
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={syncQueue}
          disabled={isSyncing}
          className="flex items-center gap-1 bg-amber-700 hover:bg-amber-800 text-white px-3 py-1 rounded-lg text-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          مزامنة الآن
        </button>
      )}
    </div>
  );
}
