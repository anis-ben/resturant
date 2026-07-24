'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CategoryChips } from '@/features/menu/CategoryChips';
import { MenuItemCard } from '@/features/menu/MenuItemCard';
import { CustomizationDrawer } from '@/features/menu/CustomizationDrawer';
import { CartFloatingBar } from '@/features/cart/CartFloatingBar';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { fetchCategories, fetchMenuItemsWithModifiers, Category, MenuItemWithModifiers } from '@/services/menu.service';
import { fetchRestaurantSettings, RestaurantSettings } from '@/services/settings.service';
import { useCart } from '@/hooks/useCart';
import { Bike, ShoppingBag, Search } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function OrderOnlinePage() {
  const router = useRouter();
  const [orderMode, setOrderMode] = useState<'delivery' | 'takeout'>('delivery');
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithModifiers[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItemWithModifiers | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { items, addItem, updateQuantity, removeItem, clearCart, totalItemsCount, grandTotal } = useCart();

  useEffect(() => {
    fetchRestaurantSettings().then(setSettings);
    Promise.all([fetchCategories(), fetchMenuItemsWithModifiers()]).then(([cats, items]) => {
      setCategories(cats);
      setMenuItems(items);
    });
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCat = selectedCategoryId ? item.category_id === selectedCategoryId : true;
      const matchesSearch = searchQuery
        ? item.name.includes(searchQuery) || (item.description && item.description.includes(searchQuery))
        : true;
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      <Header restaurantName={settings?.name_ar} isOpen={settings?.is_open} />

      {/* Mode Selector Header Banner */}
      <div className="bg-dark-900 border-b border-gray-800 p-4 sticky top-[65px] z-30 backdrop-blur-md">
        <div className="max-w-md mx-auto grid grid-cols-2 p-1 bg-dark-950 rounded-2xl border border-gray-800">
          <button
            onClick={() => setOrderMode('delivery')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              orderMode === 'delivery'
                ? 'bg-gold-500 text-dark-950 shadow-md shadow-gold-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>توصيل للمنزل 🛵</span>
          </button>

          <button
            onClick={() => setOrderMode('takeout')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              orderMode === 'takeout'
                ? 'bg-gold-500 text-dark-950 shadow-md shadow-gold-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>استلام من المطعم 🛍️</span>
          </button>
        </div>

        <div className="max-w-md mx-auto mt-2 text-center text-xs text-gold-400/80 font-medium">
          {orderMode === 'delivery' ? (
            <span>رسوم التوصيل: {formatCurrency(settings?.delivery_fee || 400)} · الأدنى: {formatCurrency(settings?.min_delivery_order || 1000)}</span>
          ) : (
            <span>وقت التحضير المقدر: 20-30 دقيقة</span>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن طبقك المفصل..."
            className="w-full bg-dark-900 border border-gray-800 rounded-2xl py-3.5 pr-12 pl-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition"
          />
        </div>
      </div>

      {/* Category Chips */}
      <CategoryChips
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Menu Grid */}
      <div className="max-w-4xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} onSelect={setSelectedItemForCustomization} />
        ))}
      </div>

      {/* Customization Drawer */}
      <CustomizationDrawer
        item={selectedItemForCustomization}
        onClose={() => setSelectedItemForCustomization(null)}
        onAddToCart={addItem}
      />

      {/* Floating Bar with Checkout Navigation */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
          <button
            onClick={() => router.push(`/checkout?mode=${orderMode}`)}
            className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-dark-950 p-4 rounded-2xl shadow-2xl flex items-center justify-between font-extrabold text-base transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-dark-950 text-gold-400 flex items-center justify-center text-xs font-black">
                {totalItemsCount}
              </div>
              <span>متابعة الشراء والتأكيد</span>
            </div>

            <span dir="ltr" className="font-extrabold">
              {formatCurrency(grandTotal)}
            </span>
          </button>
        </div>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        grandTotal={grandTotal}
      />
    </div>
  );
}
