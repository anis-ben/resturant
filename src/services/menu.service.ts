import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type Category = Database['public']['Tables']['categories']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type ModifierGroup = Database['public']['Tables']['modifier_groups']['Row'];
export type Modifier = Database['public']['Tables']['modifiers']['Row'];

export interface MenuItemWithModifiers extends MenuItem {
  modifier_groups: (ModifierGroup & {
    modifiers: Modifier[];
  })[];
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[fetchCategories] Supabase query error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[fetchCategories] Unexpected error:', err);
    return [];
  }
}

export async function fetchMenuItemsWithModifiers(): Promise<MenuItemWithModifiers[]> {
  try {
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      console.error('[fetchMenuItemsWithModifiers] Supabase menu_items query error:', itemsError);
      return [];
    }
    if (!items || items.length === 0) return [];

    const itemIds = items.map((i) => i.id);

    const { data: groups, error: groupsError } = await supabase
      .from('modifier_groups')
      .select('*, modifiers(*)')
      .in('menu_item_id', itemIds);

    if (groupsError) {
      console.error('[fetchMenuItemsWithModifiers] Supabase modifier_groups query error:', groupsError);
    }

    const groupsByItem = new Map<string, (ModifierGroup & { modifiers: Modifier[] })[]>();

    if (groups) {
      for (const group of groups) {
        const existing = groupsByItem.get(group.menu_item_id) || [];
        existing.push(group as ModifierGroup & { modifiers: Modifier[] });
        groupsByItem.set(group.menu_item_id, existing);
      }
    }

    return items.map((item) => ({
      ...item,
      modifier_groups: groupsByItem.get(item.id) || [],
    }));
  } catch (err) {
    console.error('[fetchMenuItemsWithModifiers] Unexpected error:', err);
    return [];
  }
}
