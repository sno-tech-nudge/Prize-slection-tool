'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { HumanReview } from '@prisma/client';
import { Textarea, Radio, Button } from '@/design-system';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS, computeComposite } from '@/lib/scoring/rubric';
import { parseCriteria } from '@/lib/scoring/parse';
import { submitHumanReviewAction } from '@/lib/applications/actions';

export function ReviewScoringForm({
  applicationId,
  existing,
  onSubmitted,
}: {
  applicationId: string;
  existing?: HumanReview;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const existingScores = React.useMemo(() => {
    if (!existing) return {};
    return Object.fromEntries(parseCriteria(existing.criteria).map((c) => [c.key, c.score]));
  }, [existing]);

  const [scores, setScores] = React.useState<Record<string, number>>(existingScores);
  const answeredCount = Object.keys(scores).length;
  const liveComposite = computeComposite(scores);

  function setScore(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await submitHumanReviewAction(formData);
          router.refresh();
          onSubmitted?.();
        } finally {
          setPending(false);
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: 'var(--surface-card)',
          border: '1px solid var(--border-strong)',
          padding: 'var(--space-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)' }}>
            current score
          </div>
          <div style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--delta-red)' }}>
            {liveComposite} / 100
          </div>
        </div>
        <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', textAlign: 'right' }}>
          {answeredCount} / {RUBRIC_CRITERIA.length} criteria scored
        </div>
      </div>

      {RUBRIC_SECTIONS.map((section) => {
        const sectionCriteria = RUBRIC_CRITERIA.filter((c) => c.section === section.key);
        const sectionScored = sectionCriteria.filter((c) => scores[c.key] !== undefined);
        const sectionSubtotal =
          sectionScored.length > 0
            ? Math.round((sectionScored.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0) / (sectionScored.length * 5)) * 100)
            : null;

        return (
          <div key={section.key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontSize: 'var(--fs-caption)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--ls-wide)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-3)',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-2)',
              }}
            >
              <span>
                {section.label} · weight {section.weight}
              </span>
              {sectionSubtotal !== null && <span style={{ color: 'var(--delta-red)', fontWeight: 'var(--fw-bold)' as unknown as number }}>{sectionSubtotal}%</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {sectionCriteria.map((c, i) => (
                <div key={c.key}>
                  <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, marginBottom: 'var(--space-1)' }}>
                    {i + 1}. {c.label}
                  </div>
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>{c.prompt}</p>
                  <Radio
                    name={`criterion_${c.key}`}
                    value={scores[c.key] !== undefined ? String(scores[c.key]) : undefined}
                    onChange={(value) => setScore(c.key, Number(value))}
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
        );
      })}

      <div>
        <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
          recommendation
        </div>
        <Radio
          name="recommendation"
          defaultValue={existing?.recommendation ?? 'HOLD'}
          options={[
            { value: 'ADVANCE', label: 'advance' },
            { value: 'HOLD', label: 'hold for discussion' },
            { value: 'REJECT', label: 'reject' },
          ]}
        />
      </div>

      <Textarea name="comment" label="comment" rows={3} defaultValue={existing?.comment ?? ''} />

      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? 'saving…' : existing ? 'update score' : 'submit score'}
      </Button>
    </form>
  );
}
