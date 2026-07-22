'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system';

export function ValidateOrgButton({
  applicationId,
  section,
  hasRun,
}: {
  applicationId: string;
  section: 'opModel' | 'funders' | 'founder';
  hasRun: boolean;
}) {
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
              body: JSON.stringify({ applicationId, section }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(data.error ?? 'check failed');
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
        {pending ? 'running (up to a minute)…' : hasRun ? 're-run' : 'run check'}
      </Button>
      {error && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)' }}>{error}</p>}
    </div>
  );
}
