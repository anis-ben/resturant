'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MenuItemWithModifiers, Modifier } from '@/services/menu.service';
import { CartItemModifier } from '@/utils/calculations';
import { formatCurrency } from '@/utils/formatters';
import { X, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CustomizationDrawerProps {
  item: MenuItemWithModifiers | null;
  onClose: () => void;
  onAddToCart: (cartItem: {
    menu_item_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    image_url?: string | null;
    notes?: string;
    selected_modifiers: CartItemModifier[];
  }) => void;
}

export function CustomizationDrawer({ item, onClose, onAddToCart }: CustomizationDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<CartItemModifier[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setNotes('');
      // Auto-select default modifiers for required single-choice groups
      const initialMods: CartItemModifier[] = [];
      item.modifier_groups.forEach((group) => {
        if (group.is_required && group.modifiers.length > 0) {
          initialMods.push({
            modifier_id: group.modifiers[0].id,
            name: group.modifiers[0].name,
            extra_price: Number(group.modifiers[0].extra_price),
          });
        }
      });
      setSelectedModifiers(initialMods);
    }
  }, [item]);

  if (!item) return null;

  const toggleModifier = (groupMax: number, isRequired: boolean, mod: Modifier) => {
    setSelectedModifiers((prev) => {
      const exists = prev.some((m) => m.modifier_id === mod.id);

      if (exists) {
        if (isRequired && groupMax === 1) return prev; // Cannot deselect required radio
        return prev.filter((m) => m.modifier_id !== mod.id);
      }

      if (groupMax === 1) {
        // Replace existing selection in same single-choice group
        return [
          ...prev.filter((m) => !item.modifier_groups.find((g) => g.modifiers.some((x) => x.id === m.modifier_id && g.max_selection === 1))),
          { modifier_id: mod.id, name: mod.name, extra_price: Number(mod.extra_price) },
        ];
      }

      return [...prev, { modifier_id: mod.id, name: mod.name, extra_price: Number(mod.extra_price) }];
    });
  };

  const modifiersExtraTotal = selectedModifiers.reduce((sum, m) => sum + m.extra_price, 0);
  const lineUnitPrice = Number(item.price) + modifiersExtraTotal;
  const lineGrandTotal = lineUnitPrice * quantity;

  const handleAdd = () => {
    onAddToCart({
      menu_item_id: item.id,
      name: item.name,
      unit_price: Number(item.price),
      quantity,
      image_url: item.image_url,
      notes,
      selected_modifiers: selectedModifiers,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-900 border border-gold-500/30 rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Drawer Header Image */}
        <div className="relative w-full h-48 bg-gray-800 shrink-0">
          {item.image_url && (
            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-dark-950/80 backdrop-blur-md text-white flex items-center justify-center hover:bg-dark-950 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">{item.name}</h2>
            {item.description && <p className="text-sm text-gray-400 mt-1 leading-relaxed">{item.description}</p>}
            <div dir="ltr" className="mt-2 text-lg font-extrabold text-gold-400">
              {formatCurrency(Number(item.price))}
            </div>
          </div>

          {/* Modifier Groups */}
          {item.modifier_groups.map((group) => (
            <div key={group.id} className="space-y-3 border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-gold-400">{group.title}</h4>
                <span className="text-xs text-gray-500">
                  {group.is_required ? 'إجباري' : 'اختياري'}
                </span>
              </div>

              <div className="space-y-2">
                {group.modifiers.map((mod) => {
                  const isSelected = selectedModifiers.some((m) => m.modifier_id === mod.id);
                  return (
                    <label
                      key={mod.id}
                      onClick={() => toggleModifier(group.max_selection, group.is_required, mod)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gold-500/10 border-gold-500 text-white'
                          : 'bg-dark-950 border-gray-800 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type={group.max_selection === 1 ? 'radio' : 'checkbox'}
                          checked={isSelected}
                          onChange={() => {}}
                          className="accent-gold-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium">{mod.name}</span>
                      </div>
                      {Number(mod.extra_price) > 0 && (
                        <span dir="ltr" className="text-xs font-bold text-gold-400">
                          +{formatCurrency(Number(mod.extra_price))}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notes Input */}
          <div className="border-t border-gray-800 pt-4">
            <label className="block text-sm font-bold text-gray-300 mb-2">ملاحظات خاصة على الطلب</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: بدون بصل، زيادة صلصة..."
              className="w-full bg-dark-950 border border-gray-800 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 transition"
              rows={2}
            />
          </div>
        </div>

        {/* Sticky Drawer Footer */}
        <div className="p-4 bg-dark-950 border-t border-gray-800 flex items-center justify-between gap-4">
          <div className="flex items-center border border-gray-800 rounded-xl bg-dark-900 px-2 py-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-800 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span dir="ltr" className="w-8 text-center font-bold text-white">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-800 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={handleAdd} className="flex-1 text-dark-950 font-bold">
            <span>إضافة إلى السلة</span>
            <span dir="ltr" className="mr-2 font-black text-sm bg-dark-950 text-gold-400 px-2 py-0.5 rounded-lg">
              {formatCurrency(lineGrandTotal)}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
