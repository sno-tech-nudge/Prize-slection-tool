'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system';

export function RescoreButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId }),
          });
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? 'scoring…' : 're-run AI evaluation'}
    </Button>
  );
}
