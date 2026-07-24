import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://llgkwvvtjlpcxaiinhgq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Browser-side Supabase client initialized strictly with the public ANON key.
 * Safe for client bundles and realtime subscriptions.
 */
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
