'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system';

export function ValidateOrgButton({ applicationId, hasRun }: { applicationId: string; hasRun: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const res = await fetch('/api/validate-org', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ applicationId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(data.error ?? 'organisation validation failed');
            } else {
              router.refresh();
            }
          } catch {
            setError('network error — could not reach the server');
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? 'running (searches the web, can take a minute)…' : hasRun ? 're-run validation' : 'run validation'}
      </Button>
      {error && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)' }}>{error}</p>}
    </div>
  );
}
