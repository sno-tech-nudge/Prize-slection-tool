import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/sources/supabase-client';
import { syncApplicationsFromSupabase } from '@/lib/sources/supabase-source';

/** Polled client-side (see SupabaseSyncTicker) so newly submitted applications on the live
 *  Supabase backend show up in the frontend without anyone having to click "sync from supabase"
 *  manually. Runs unconditionally whenever Supabase is configured (SUPABASE_URL/ANON_KEY set) —
 *  same as the manual "sync from supabase" button, which isn't gated by the activeSource
 *  setting either. No-ops if Supabase isn't configured. */
export async function POST() {
  if (!getSupabaseClient()) {
    return NextResponse.json({ notRun: true, reason: 'Supabase not configured' });
  }

  try {
    const result = await syncApplicationsFromSupabase();
    return NextResponse.json({ notRun: false, ...result });
  } catch (error) {
    // most likely SUPABASE_URL / SUPABASE_ANON_KEY not set — fail quietly, next tick retries
    return NextResponse.json({ notRun: true, reason: error instanceof Error ? error.message : 'sync failed' });
  }
}
