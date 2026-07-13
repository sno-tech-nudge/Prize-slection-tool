import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Returns null (rather than throwing) when env vars aren't set, so callers can surface a
 *  clear "not configured" message instead of a raw exception. */
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
