'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Database } from 'lucide-react';
import { Card, Button, Badge } from '@/design-system';
import { syncSupabaseAction } from '@/lib/automation/actions';
import type { SupabaseSyncResult } from '@/lib/sources/supabase-source';

export function SupabaseSyncPanel({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<SupabaseSyncResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function runSync() {
    setPending(true);
    setError(null);
    try {
      const r = await syncSupabaseAction();
      setResult(r);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'sync failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card accent accentSide="left">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Database size={16} color="var(--delta-red)" strokeLinejoin="miter" strokeLinecap="square" />
          <h2 style={{ fontSize: 'var(--fs-h4)' }}>live Supabase backend</h2>
        </div>
        <Badge tone={configured ? 'red' : 'outline'}>{configured ? 'connected' : 'not configured'}</Badge>
      </div>
      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        pulls every row from the live <code>applications</code> table (fed automatically from the Zoho Creator form) and upserts it
        into this database, keyed by the Supabase row id. safe to re-run at any time — existing applications are updated in place.
      </p>

      <Button variant="secondary" size="sm" disabled={pending || !configured} onClick={runSync}>
        <RefreshCw size={14} strokeLinejoin="miter" strokeLinecap="square" style={{ marginRight: 'var(--space-2)' }} />
        {pending ? 'syncing…' : 'sync from supabase'}
      </Button>

      {error && (
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--delta-red)', marginTop: 'var(--space-3)' }}>{error}</p>
      )}
      {result && (
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)' }}>
          fetched {result.fetched} · created {result.created} · updated {result.updated}
          {result.skipped.length > 0 ? ` · skipped ${result.skipped.length} (missing organisation name or email)` : ''}
        </p>
      )}
    </Card>
  );
}
