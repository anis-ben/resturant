'use client';

import React from 'react';
import { Category } from '@/services/menu.service';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryChips({ categories, selectedCategoryId, onSelectCategory }: CategoryChipsProps) {
  return (
    <div className="overflow-x-auto no-scrollbar py-3 px-4 flex gap-2 sticky top-[65px] bg-dark-950/95 backdrop-blur-md z-30 border-b border-gray-800">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
          selectedCategoryId === null
            ? 'bg-gold-500 text-dark-950 shadow-md shadow-gold-500/20'
            : 'bg-dark-900 text-gray-300 hover:bg-dark-800 border border-gray-800'
        }`}
      >
        الكل ✨
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
            selectedCategoryId === cat.id
              ? 'bg-gold-500 text-dark-950 shadow-md shadow-gold-500/20'
              : 'bg-dark-900 text-gray-300 hover:bg-dark-800 border border-gray-800'
          }`}
        >
          {cat.name_ar}
        </button>
      ))}
    </div>
  );
}
