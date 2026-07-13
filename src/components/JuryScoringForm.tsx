'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { JuryScore } from '@prisma/client';
import { Input, Textarea, Radio, Button } from '@/design-system';
import { RUBRIC_CRITERIA } from '@/lib/scoring/rubric';
import { parseCriteria } from '@/lib/scoring/parse';
import { submitJuryScoreAction } from '@/lib/applications/jury-actions';

export function JuryScoringForm({ applicationId, existing }: { applicationId: string; existing?: JuryScore }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const existingScores = React.useMemo(() => {
    if (!existing) return {};
    return Object.fromEntries(parseCriteria(existing.criteria).map((c) => [c.key, c.score]));
  }, [existing]);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await submitJuryScoreAction(formData);
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      {RUBRIC_CRITERIA.map((c, i) => (
        <Input
          key={c.key}
          name={`criterion_${c.key}`}
          type="number"
          min={0}
          max={5}
          step={0.5}
          label={`${i + 1}. ${c.label}`}
          defaultValue={existingScores[c.key] ?? 2.5}
        />
      ))}

      <div>
        <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
          verdict
        </div>
        <Radio
          name="verdict"
          defaultValue={existing?.verdict ?? 'MAYBE'}
          options={[
            { value: 'YES', label: 'yes' },
            { value: 'MAYBE', label: 'maybe' },
            { value: 'NO', label: 'no' },
          ]}
        />
      </div>

      <Textarea name="comment" label="comment" rows={3} defaultValue={existing?.comment ?? ''} />

      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? 'saving…' : existing ? 'update verdict' : 'submit verdict'}
      </Button>
    </form>
  );
}
