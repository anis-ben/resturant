'use client';

import React from 'react';
import { OrderStatus } from '@/types/database.types';
import { Clock, ChefHat, CheckCircle2, Bike, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const configs: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: {
      label: 'قيد الانتظار',
      color: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: <Clock className="w-4 h-4 text-amber-400" />,
    },
    preparing: {
      label: 'جاري التحضير',
      color: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      icon: <ChefHat className="w-4 h-4 text-blue-400" />,
    },
    ready: {
      label: 'جاهز للتقديم',
      color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
    out_for_delivery: {
      label: 'مع السائق',
      color: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      icon: <Bike className="w-4 h-4 text-purple-400" />,
    },
    completed: {
      label: 'مكتمل',
      color: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
      icon: <CheckCircle2 className="w-4 h-4 text-gray-400" />,
    },
    cancelled: {
      label: 'ملغي',
      color: 'bg-red-500/10 border-red-500/30 text-red-400',
      icon: <XCircle className="w-4 h-4 text-red-400" />,
    },
  };

  const config = configs[status] || {
    label: status,
    color: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
    icon: <AlertCircle className="w-4 h-4" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
