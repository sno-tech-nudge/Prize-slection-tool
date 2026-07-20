'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { JuryScore } from '@prisma/client';
import { Textarea, Radio, Input, Button } from '@/design-system';
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
            {section.label} · max {section.weight}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {RUBRIC_CRITERIA.filter((c) => c.section === section.key).map((c, i) => (
              <div key={c.key} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, marginBottom: 'var(--space-1)' }}>
                    {i + 1}. {c.label}
                  </div>
                  <ul style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', margin: 0, paddingLeft: 'var(--space-4)' }}>
                    {c.description.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
                <Input
                  name={`criterion_${c.key}`}
                  type="number"
                  min={0}
                  max={c.maxScore}
                  step={1}
                  defaultValue={existingScores[c.key] !== undefined ? String(existingScores[c.key]) : ''}
                  containerStyle={{ width: 70, flexShrink: 0 }}
                  helper={`/ ${c.maxScore}`}
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
