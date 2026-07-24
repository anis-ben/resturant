'use client';

import React from 'react';
import Image from 'next/image';
import { MenuItemWithModifiers } from '@/services/menu.service';
import { formatCurrency } from '@/utils/formatters';
import { Plus } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItemWithModifiers;
  onSelect: (item: MenuItemWithModifiers) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  return (
    <div
      onClick={() => onSelect(item)}
      className="bg-dark-900 border border-gray-800 hover:border-gold-500/40 rounded-2xl p-4 flex gap-4 cursor-pointer group transition-all duration-300 hover:shadow-xl hover:shadow-gold-500/5 active:scale-[0.99]"
    >
      <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-800 shrink-0">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="112px"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">بدون صورة</div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-white group-hover:text-gold-400 transition-colors">
              {item.name}
            </h3>
          </div>

          {item.badges && item.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.badges.map((badge, idx) => (
                <span key={idx} className="bg-gold-500/10 border border-gold-500/20 text-gold-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {badge}
                </span>
              ))}
            </div>
          )}

          {item.description && (
            <p className="text-xs text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800/60">
          <span dir="ltr" className="font-extrabold text-base text-gold-400 inline-block">
            {formatCurrency(Number(item.price))}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="w-9 h-9 rounded-xl bg-gold-500 text-dark-950 flex items-center justify-center font-bold hover:bg-gold-400 transition-transform active:scale-95 shadow-md shadow-gold-500/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
