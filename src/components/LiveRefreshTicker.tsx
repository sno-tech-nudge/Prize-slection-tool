'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

/** Keeps the current page's server data fresh without a manual reload — e.g. the dashboard's
 *  "reviewed" KPI or the applications list "reviewed" filter, both of which are derived from
 *  HumanReview rows that can change from a submission elsewhere (a different reviewer, another
 *  open tab) while this page is sitting open. Same polling pattern as JobQueueTicker /
 *  SupabaseSyncTicker, but there's no background work to trigger here — just a periodic
 *  router.refresh() to re-run the page's server-side data fetch. */
export function LiveRefreshTicker({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter();

  React.useEffect(() => {
    const interval = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null;
}
