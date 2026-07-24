import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type RestaurantSettings = Database['public']['Tables']['restaurant_settings']['Row'];

export async function fetchRestaurantSettings(): Promise<RestaurantSettings | null> {
  try {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('Could not fetch settings from DB, using fallback defaults.');
      return {
        id: 'default',
        name_ar: 'مطعم الأصالة والذوق الجميل',
        name_en: 'El Assala Gourmet',
        is_open: true,
        tax_rate: 19.0,
        delivery_fee: 400.0,
        min_delivery_order: 1000.0,
        whatsapp_number: '+213550000000',
        phone_number: '023123456',
        address: 'حي سعيد حمدين، الجزائر العاصمة',
        currency_symbol: 'دج',
        business_hours: { open: '11:00', close: '23:00' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data;
  } catch {
    return null;
  }
}
