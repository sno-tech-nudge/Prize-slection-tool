'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

/** Polls /api/sync/tick every 2 minutes so a newly submitted application on the live Supabase
 *  backend shows up in the frontend on its own — no one has to remember to click "sync from
 *  supabase". This data is fed from a form submission process, not something needing
 *  near-real-time sync, so a wider interval trades a small amount of latency for a large cut in
 *  how often every open tab pulls from the source table (this ticker runs globally for every
 *  signed-in user on every page — 30s was the dominant driver of a 60GB/month Supabase egress
 *  bill against a table with only a few hundred rows; see syncApplicationsFromSupabase for the
 *  matching fix on the query side). Mounted once in the app shell, same pattern as
 *  JobQueueTicker. Silent — the settings page panel still shows manual sync results for anyone
 *  who wants to trigger + inspect one directly. */
export function SupabaseSyncTicker() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    // a full Supabase sync can take much longer than the 30s poll interval (each row is a
    // separate round trip to the DB), so without this guard overlapping ticks pile up and
    // exhaust the Prisma connection pool for the whole app, not just this ticker.
    let inFlight = false;
    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await fetch('/api/sync/tick', { method: 'POST' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!data.notRun && (data.created > 0 || data.updated > 0)) router.refresh();
      } catch {
        // best-effort — a missed tick just means the next one picks it up
      } finally {
        inFlight = false;
      }
    };
    const interval = setInterval(tick, 120000);
    tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
