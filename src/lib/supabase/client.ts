import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://llgkwvvtjlpcxaiinhgq.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZ2t3dnZ0amxwY3hhaWluaGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTc4MjEsImV4cCI6MjEwMDQ3MzgyMX0.qf-TT8NzC9MlwMC-yBg_wj-ne-2XAPJHJfdmQojtf2c';

/**
 * Browser-side Supabase client initialized with the public ANON key.
 * Safe for client bundles and realtime subscriptions.
 * Includes a fallback to ensure data fetching never fails on Netlify deploys.
 */
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
