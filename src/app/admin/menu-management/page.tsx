'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { fetchCategories, Category, MenuItem } from '@/services/menu.service';
import { formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Utensils, Plus, ToggleLeft, ToggleRight, Upload } from 'lucide-react';
import { AdminNav } from '@/components/layout/AdminNav';

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCatId, setItemCatId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadMenuData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, menuRes] = await Promise.all([
        fetchCategories(),
        supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
      ]);
      setCategories(cats);
      if (menuRes.data) setItems(menuRes.data);
    } catch (e) {
      console.error('[MenuManagement] Failed to load menu data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  const handleToggleAvailability = async (item: MenuItem) => {
    const newStatus = !item.is_available;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: newStatus } : i)));

    await supabase.from('menu_items').update({ is_available: newStatus }).eq('id', item.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `dish_${Date.now()}.${fileExt}`;
      const filePath = `dishes/${fileName}`;

      const { error } = await supabase.storage.from('restaurant-media').upload(filePath, file);
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('restaurant-media').getPublicUrl(filePath);
      setImageUrl(publicUrlData.publicUrl);
    } catch (e) {
      console.error('Image upload error:', e);
      alert('فشل رفع الصورة، يرجى التأكد من المقاس والحجم');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        category_id: itemCatId || categories[0]?.id,
        name: itemName,
        description: itemDesc,
        price: parseFloat(itemPrice) || 0,
        image_url: imageUrl || null,
        is_available: true,
      };

      const { error } = await supabase.from('menu_items').insert(payload);
      if (error) throw error;

      setIsModalOpen(false);
      setItemName('');
      setItemPrice('');
      setItemDesc('');
      setImageUrl('');
      loadMenuData();
    } catch (e) {
      console.error('Save error:', e);
      alert('حدث خطأ أثناء حفظ الطبق');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = selectedCatId ? items.filter((i) => i.category_id === selectedCatId) : items;

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col">
      <AdminNav />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full flex-1">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-900 border border-gold-500/30 rounded-3xl p-4 sm:px-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-500 text-dark-950 flex items-center justify-center font-black">
              <Utensils className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-white">إدارة قائمة الطعام والمنتجات</h1>
              <p className="text-xs text-gray-400">إضافة أطباق، تعديل الأسعار، وتوفر الوجبات فورياً</p>
            </div>
          </div>

          <Button onClick={() => setIsModalOpen(true)} className="text-dark-950 font-bold text-xs py-2.5">
            <Plus className="w-4 h-4 ml-1" />
            إضافة طبق جديد
          </Button>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCatId(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedCatId === null ? 'bg-gold-500 text-dark-950' : 'bg-dark-900 text-gray-400 border border-gray-800'
            }`}
          >
            الكل ({items.length})
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCatId === c.id ? 'bg-gold-500 text-dark-950' : 'bg-dark-900 text-gray-400 border border-gray-800'
              }`}
            >
              {c.name_ar}
            </button>
          ))}
        </div>

        {/* Item List Table */}
        <div className="bg-dark-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="divide-y divide-gray-800">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-dark-800/40 transition">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-800 shrink-0">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">بلا صورة</div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
                      <span dir="ltr" className="text-xs font-extrabold text-gold-400 block mt-1">
                        {formatCurrency(Number(item.price))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition ${
                        item.is_available
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {item.is_available ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-red-400" />}
                      <span>{item.is_available ? 'متوفر' : 'غير متوفر'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Dish Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-dark-900 border border-gold-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h2 className="font-bold text-lg text-white">إضافة طبق جديد للمنيو</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">اسم الطبق *</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="مثال: شواية دجاج عائلية"
                    className="w-full bg-dark-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">القسم *</label>
                  <select
                    value={itemCatId}
                    onChange={(e) => setItemCatId(e.target.value)}
                    className="w-full bg-dark-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">السعر (دج) *</label>
                  <input
                    type="number"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="1500"
                    className="w-full bg-dark-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">الوصف التفصيلي</label>
                  <textarea
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="المكونات والتفاصيل..."
                    rows={2}
                    className="w-full bg-dark-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                  />
                </div>

                {/* Image Upload Input */}
                <div>
                  <label className="block font-bold text-gray-300 mb-1">صورة الطبق (Supabase Storage)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="fileUploadInput"
                    />
                    <label
                      htmlFor="fileUploadInput"
                      className="bg-dark-950 hover:bg-dark-800 border border-gray-800 rounded-xl p-3 flex-1 text-center cursor-pointer text-gray-400 font-bold flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-gold-400" />
                      <span>{isUploading ? 'جاري الرفع...' : 'اختر صورة للرفع'}</span>
                    </label>
                  </div>
                  {imageUrl && <p className="text-[10px] text-emerald-400 mt-1 truncate">تمت الصورة: {imageUrl}</p>}
                </div>

                <Button type="submit" isLoading={isSaving} className="w-full text-dark-950 font-extrabold py-3.5">
                  حفظ الطبق وإضافته للقائمة ✨
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
