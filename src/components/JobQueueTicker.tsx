'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/design-system';

interface JobStats {
  PENDING: number;
  RUNNING: number;
  DONE: number;
  FAILED: number;
}

/** Polls /api/jobs/tick every few seconds to drain the async job queue — the closest thing to a
 *  background worker this zero-infra prototype has. Mounted once in the app shell so it's always
 *  running while the internal tool is open. See src/lib/jobs/queue.ts for the swap point. */
export function JobQueueTicker() {
  const router = useRouter();
  const [stats, setStats] = React.useState<JobStats | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch('/api/jobs/tick', { method: 'POST' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setStats(data.stats);
        if (data.ran > 0) router.refresh();
      } catch {
        // best-effort — a missed tick just means jobs wait for the next one
      }
    };
    const interval = setInterval(tick, 3500);
    tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  const active = (stats?.PENDING ?? 0) + (stats?.RUNNING ?? 0);
  if (!active) return null;

  return (
    <Badge tone="outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <Loader2 size={12} className="spin" strokeLinejoin="miter" strokeLinecap="square" />
      processing {active} job{active === 1 ? '' : 's'}
    </Badge>
  );
}
