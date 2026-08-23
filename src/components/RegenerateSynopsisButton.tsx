'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system';

export function RegenerateSynopsisButton({ applicationId, hasRun }: { applicationId: string; hasRun: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const res = await fetch('/api/synopsis/regenerate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ applicationId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(data.error ?? 'synopsis generation failed');
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
        {pending ? 'generating…' : hasRun ? 'regenerate' : 'generate'}
      </Button>
      {error && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)' }}>{error}</p>}
    </div>
  );
}
