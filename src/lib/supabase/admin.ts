import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Server-side Supabase Admin Client using the SUPABASE_SERVICE_ROLE_KEY.
 * CRITICAL: NEVER import this file in client-side code or components.
 * Only use inside Server Actions, Route Handlers (/api/*), or Middleware.
 */
export function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('[getAdminSupabase] NEXT_PUBLIC_SUPABASE_URL is missing from environment variables.');
  }
  if (!serviceRoleKey) {
    throw new Error('[getAdminSupabase] SUPABASE_SERVICE_ROLE_KEY is missing from environment variables. Never use the anon key as a substitute for the service role key.');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
