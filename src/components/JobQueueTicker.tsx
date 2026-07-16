'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

/** Polls /api/jobs/tick every few seconds to drain the async job queue — the closest thing to a
 *  background worker this zero-infra prototype has. Mounted once in the app shell so it's always
 *  running while the internal tool is open. See src/lib/jobs/queue.ts for the swap point.
 *  Runs silently — no visible UI, just keeps the queue moving in the background. */
export function JobQueueTicker() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    // scoring/enrichment jobs can each take well over 3.5s (external API calls), so without this
    // guard a slow tick would still be in flight when the next interval fires — ticks then pile
    // up indefinitely, each holding a DB connection, exhausting the Prisma connection pool.
    let inFlight = false;
    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await fetch('/api/jobs/tick', { method: 'POST' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.ran > 0) router.refresh();
      } catch {
        // best-effort — a missed tick just means jobs wait for the next one
      } finally {
        inFlight = false;
      }
    };
    const interval = setInterval(tick, 3500);
    tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
