'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { JuryScore } from '@prisma/client';
import { Textarea, Radio, Button } from '@/design-system';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS } from '@/lib/scoring/rubric';
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
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />

      {RUBRIC_SECTIONS.map((section) => (
        <div key={section.key}>
          <div
            style={{
              fontSize: 'var(--fs-caption)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--ls-wide)',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 'var(--space-2)',
            }}
          >
            {section.label} · weight {section.weight}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {RUBRIC_CRITERIA.filter((c) => c.section === section.key).map((c, i) => (
              <div key={c.key}>
                <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                  {i + 1}. {c.label}
                </div>
                <Radio
                  name={`criterion_${c.key}`}
                  defaultValue={String(existingScores[c.key] ?? '')}
                  options={c.bands.map((b) => ({
                    value: String(b.score),
                    label: (
                      <span>
                        <strong style={{ color: 'var(--delta-red)' }}>{b.score}</strong> — {b.label}
                      </span>
                    ),
                  }))}
                />
              </div>
            ))}
          </div>
        </div>
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
