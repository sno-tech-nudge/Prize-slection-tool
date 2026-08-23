'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { JuryScore } from '@prisma/client';
import { Textarea, Radio, Input, Button } from '@/design-system';
import { JURY_RUBRIC_CRITERIA, JURY_DECISION_QUESTION, JURY_WINNING_MODEL_QUESTION } from '@/lib/scoring/juryRubric';
import { parseCriteria } from '@/lib/scoring/parse';
import { JurySectionInfo } from '@/components/JurySectionInfo';
import { submitJuryScoreAction } from '@/lib/applications/jury-actions';

export function JuryScoringForm({
  applicationId,
  existing,
  onSubmitted,
}: {
  applicationId: string;
  existing?: JuryScore;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [verdict, setVerdict] = React.useState<'YES' | 'NO'>(existing?.verdict === 'YES' ? 'YES' : 'NO');

  const existingByKey = React.useMemo(() => {
    if (!existing) return {};
    return Object.fromEntries(parseCriteria(existing.criteria).map((c) => [c.key, c]));
  }, [existing]);

  // If this score was submitted under an earlier rubric (different criterion keys — including
  // every score submitted before this five-criterion rubric replaced the old fourteen-criterion
  // one), none of its stored values will match anything in the CURRENT rubric — reloading it is
  // expected to look entirely blank, not a data-loss bug. Surfaced as a warning rather than
  // silently pretending the score is complete (each score input below is also `required`, so it
  // can't be re-submitted half-blank and silently overwrite the original composite with a
  // deflated one).
  const existingCriteriaKeys = React.useMemo(() => {
    if (!existing) return new Set<string>();
    return new Set(parseCriteria(existing.criteria).map((c) => c.key));
  }, [existing]);
  const currentKeys = new Set(JURY_RUBRIC_CRITERIA.map((c) => c.key));
  const carriedOverCount = [...existingCriteriaKeys].filter((k) => currentKeys.has(k)).length;
  const isStaleRubric = !!existing && existingCriteriaKeys.size > 0 && carriedOverCount < currentKeys.size;

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await submitJuryScoreAction(formData);
          router.refresh();
          onSubmitted?.();
        } finally {
          setPending(false);
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />

      {isStaleRubric && (
        <div
          style={{
            border: '1px solid var(--delta-red)',
            background: 'var(--surface-canvas)',
            padding: 'var(--space-4)',
            fontSize: 'var(--fs-small)',
            lineHeight: 'var(--lh-relaxed)',
          }}
        >
          <strong>this score predates the current jury rubric.</strong> only {carriedOverCount} of the {currentKeys.size} current
          criteria carried over from the original submission — the rest show blank below and need to be scored fresh. the original
          score of <strong>{existing?.composite}/100</strong> stays exactly as recorded unless you save this form, so please only
          submit once every criterion below has been scored against the current rubric.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {JURY_RUBRIC_CRITERIA.map((c) => {
          const existingScore = existingByKey[c.key];
          return (
            <div key={c.key} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)', gap: 'var(--space-3)' }}>
                <strong style={{ fontSize: 'var(--fs-small)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {c.label}
                  <JurySectionInfo label={c.label} establishText={c.establishText} />
                </strong>
                <Input
                  name={`criterion_${c.key}_score`}
                  type="number"
                  min={0}
                  max={c.maxScore}
                  step={1}
                  required
                  defaultValue={existingScore?.score !== undefined ? String(existingScore.score) : ''}
                  containerStyle={{ width: 70, flexShrink: 0 }}
                  helper={`/ ${c.maxScore}`}
                />
              </div>
              <ul style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', margin: '0 0 var(--space-3)', paddingLeft: 'var(--space-4)' }}>
                {c.coreQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <Textarea
                name={`criterion_${c.key}_comment`}
                label="comment"
                rows={2}
                defaultValue={existingScore?.comment ?? ''}
              />
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
        <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
          {JURY_DECISION_QUESTION}
        </div>
        <Radio
          name="verdict"
          value={verdict}
          onChange={(v) => setVerdict(v === 'YES' ? 'YES' : 'NO')}
          options={[
            { value: 'YES', label: 'yes' },
            { value: 'NO', label: 'no' },
          ]}
        />
      </div>

      {verdict === 'YES' && <Textarea name="comment" label={JURY_WINNING_MODEL_QUESTION} rows={3} defaultValue={existing?.comment ?? ''} />}

      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? 'saving…' : existing ? 'update verdict' : 'submit verdict'}
      </Button>
    </form>
  );
}
