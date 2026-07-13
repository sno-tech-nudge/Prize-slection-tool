'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

/** Polls /api/sync/tick every 30s so a newly submitted application on the live Supabase backend
 *  shows up in the frontend on its own — no one has to remember to click "sync from supabase".
 *  Mounted once in the app shell, same pattern as JobQueueTicker. Silent — the settings page
 *  panel still shows manual sync results for anyone who wants to trigger + inspect one directly. */
export function SupabaseSyncTicker() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch('/api/sync/tick', { method: 'POST' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!data.notRun && (data.created > 0 || data.updated > 0)) router.refresh();
      } catch {
        // best-effort — a missed tick just means the next one picks it up
      }
    };
    const interval = setInterval(tick, 30000);
    tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
