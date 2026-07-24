import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Server-side Supabase Admin Client using the SUPABASE_SERVICE_ROLE_KEY.
 * CRITICAL: Only use inside Server Actions, Route Handlers (/api/*), or Middleware.
 * Never hardcode secret keys in source code to satisfy GitHub Push Protection.
 */
export function getAdminSupabase() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://llgkwvvtjlpcxaiinhgq.supabase.co';

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('[getAdminSupabase] SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
