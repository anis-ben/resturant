'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CategoryChips } from '@/features/menu/CategoryChips';
import { MenuItemCard } from '@/features/menu/MenuItemCard';
import { CustomizationDrawer } from '@/features/menu/CustomizationDrawer';
import { CartFloatingBar } from '@/features/cart/CartFloatingBar';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { fetchCategories, fetchMenuItemsWithModifiers, Category, MenuItemWithModifiers } from '@/services/menu.service';
import { useCart } from '@/hooks/useCart';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

function MenuPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');

  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithModifiers[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItemWithModifiers | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { items, addItem, updateQuantity, removeItem, clearCart, totalItemsCount, grandTotal } = useCart();

  // Debounce search query (≥300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Table details if token present
  useEffect(() => {
    if (token) {
      supabase
        .from('tables')
        .select('table_number')
        .eq('access_token', token)
        .single()
        .then(({ data }) => {
          if (data) setTableNumber(data.table_number);
        });
    }
  }, [token]);

  // Fetch Menu Categories & Items
  useEffect(() => {
    Promise.all([fetchCategories(), fetchMenuItemsWithModifiers()])
      .then(([cats, items]) => {
        setCategories(cats);
        setMenuItems(items);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategoryId ? item.category_id === selectedCategoryId : true;
      const matchesSearch = debouncedQuery
        ? item.name.includes(debouncedQuery) || (item.description && item.description.includes(debouncedQuery))
        : true;
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategoryId, debouncedQuery]);

  return (
    <div className="min-h-screen bg-dark-950 pb-24">
      <Header tableNumber={tableNumber} />

      {/* Search Input Bar */}
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

      {/* Menu Item Grid */}
      <div className="max-w-4xl mx-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-base font-semibold">لم يتم العثور على أطباق مطابقة للبث</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} onSelect={setSelectedItemForCustomization} />
            ))}
          </div>
        )}
      </div>

      {/* Customization Drawer */}
      <CustomizationDrawer
        item={selectedItemForCustomization}
        onClose={() => setSelectedItemForCustomization(null)}
        onAddToCart={addItem}
      />

      {/* Cart Floating Bar */}
      <CartFloatingBar itemCount={totalItemsCount} totalAmount={grandTotal} onOpenCart={() => setIsCartOpen(true)} />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        tableToken={token}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        grandTotal={grandTotal}
      />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950 p-6 text-white text-center">جاري التحميل...</div>}>
      <MenuPageContent />
    </Suspense>
  );
}
