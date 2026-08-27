'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { JuryScore } from '@prisma/client';
import { Textarea, Radio, Input, Button, Dialog } from '@/design-system';
import { JURY_RUBRIC_CRITERIA, JURY_DECISION_QUESTION, JURY_WINNING_MODEL_QUESTION, JURY_FRAMING_QUESTION, computeJuryComposite } from '@/lib/scoring/juryRubric';
import { parseCriteria } from '@/lib/scoring/parse';
import { JurySectionInfo } from '@/components/JurySectionInfo';
import { submitJuryScoreAction, clearJuryScoreAction } from '@/lib/applications/jury-actions';

const COMMENT_BOX_ROWS = 2;

/** In-progress scores/comments are only ever held in React state, so a juror who closes the panel
 *  mid-way (accidental navigation, tab close, session hiccup) loses everything typed so far —
 *  this mirrors it into localStorage as they score, the same safety net ReviewScoringForm gives
 *  reviewers, and clears it once actually submitted or explicitly cleared. */
interface JuryDraft {
  scores: Record<string, number>;
  criterionComments: Record<string, string>;
  verdict: 'YES' | 'NO';
  comment: string;
}

function draftKeyFor(applicationId: string): string {
  return `delta-jury-draft:${applicationId}`;
}

function loadDraft(applicationId: string): JuryDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(draftKeyFor(applicationId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Auto-grows to fit its own typed content, same as ReviewScoringForm's CriterionCommentBox — so
 *  a longer comment never sits clipped or scrolling inside a fixed-height box below the scoring
 *  row. */
function CriterionCommentBox({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea
      ref={ref}
      name={name}
      label="comment"
      rows={COMMENT_BOX_ROWS}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ resize: 'none', overflow: 'hidden' }}
    />
  );
}

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
  const [confirmClear, setConfirmClear] = React.useState(false);

  const existingByKey = React.useMemo(() => {
    if (!existing) return {};
    return Object.fromEntries(parseCriteria(existing.criteria).map((c) => [c.key, c]));
  }, [existing]);

  // If this score was submitted under an earlier rubric (different criterion keys — including
  // every score submitted before this five-criterion rubric replaced the old fourteen-criterion
  // one), none of its stored values will match anything in the CURRENT rubric — reloading it is
  // expected to look entirely blank, not a data-loss bug. Surfaced as a warning rather than
  // silently pretending the score is complete.
  const existingCriteriaKeys = React.useMemo(() => {
    if (!existing) return new Set<string>();
    return new Set(parseCriteria(existing.criteria).map((c) => c.key));
  }, [existing]);
  const currentKeys = React.useMemo(() => new Set(JURY_RUBRIC_CRITERIA.map((c) => c.key)), []);
  const carriedOverCount = [...existingCriteriaKeys].filter((k) => currentKeys.has(k)).length;
  const isStaleRubric = !!existing && existingCriteriaKeys.size > 0 && carriedOverCount < currentKeys.size;

  // a draft saved under a since-changed rubric has keys that don't line up with the current
  // criteria — trusting it would silently reproduce the exact "mostly blank" confusion a rubric
  // change causes, instead of falling back to the real saved score below.
  const draft = React.useMemo(() => {
    const d = loadDraft(applicationId);
    if (!d) return null;
    const draftKeys = Object.keys(d.scores ?? {});
    const hasForeignKeys = draftKeys.some((k) => !currentKeys.has(k));
    return hasForeignKeys ? null : d;
  }, [applicationId, currentKeys]);

  const [scores, setScores] = React.useState<Record<string, number>>(() => {
    if (draft) return draft.scores;
    const init: Record<string, number> = {};
    for (const c of JURY_RUBRIC_CRITERIA) {
      const s = existingByKey[c.key]?.score;
      if (s !== undefined) init[c.key] = s;
    }
    return init;
  });
  const [criterionComments, setCriterionComments] = React.useState<Record<string, string>>(() => {
    if (draft) return draft.criterionComments;
    const init: Record<string, string> = {};
    for (const c of JURY_RUBRIC_CRITERIA) {
      init[c.key] = existingByKey[c.key]?.comment ?? '';
    }
    return init;
  });
  const [verdict, setVerdict] = React.useState<'YES' | 'NO'>(draft?.verdict ?? (existing?.verdict === 'YES' ? 'YES' : 'NO'));
  const [comment, setComment] = React.useState(draft?.comment ?? existing?.comment ?? '');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(draftKeyFor(applicationId), JSON.stringify({ scores, criterionComments, verdict, comment }));
  }, [applicationId, scores, criterionComments, verdict, comment]);

  const answeredCount = Object.keys(scores).length;
  const allCriteriaScored = answeredCount === JURY_RUBRIC_CRITERIA.length;
  const liveComposite = computeJuryComposite(scores);

  function setScore(key: string, raw: string, maxScore: number) {
    if (raw === '') {
      setScores((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    const clamped = Math.max(0, Math.min(Number(raw), maxScore));
    setScores((prev) => ({ ...prev, [key]: clamped }));
  }

  async function handleClear() {
    setConfirmClear(false);
    setPending(true);
    try {
      const formData = new FormData();
      formData.set('applicationId', applicationId);
      await clearJuryScoreAction(formData);
      window.localStorage.removeItem(draftKeyFor(applicationId));
      setScores({});
      setCriterionComments({});
      setVerdict('NO');
      setComment('');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await submitJuryScoreAction(formData);
          window.localStorage.removeItem(draftKeyFor(applicationId));
          router.refresh();
          onSubmitted?.();
        } finally {
          setPending(false);
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />

      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', fontStyle: 'italic' }}>
        {JURY_FRAMING_QUESTION}
      </p>

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
          {answeredCount} / {JURY_RUBRIC_CRITERIA.length} criteria scored
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {JURY_RUBRIC_CRITERIA.map((c, i) => (
          <div key={c.key} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <strong style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                    {i + 1}. {c.label}
                  </strong>
                  <JurySectionInfo label={c.label} coreQuestions={c.coreQuestions} />
                </div>
                <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', margin: 'var(--space-1) 0 0' }}>
                  {c.establishText}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                <Input
                  name={`criterion_${c.key}_score`}
                  type="number"
                  min={0}
                  max={c.maxScore}
                  step={1}
                  value={scores[c.key] !== undefined ? String(scores[c.key]) : ''}
                  onChange={(e) => setScore(c.key, e.target.value, c.maxScore)}
                  containerStyle={{ width: 70 }}
                />
                <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>/ {c.maxScore}</span>
              </div>
            </div>
            <CriterionCommentBox
              name={`criterion_${c.key}_comment`}
              value={criterionComments[c.key] ?? ''}
              onChange={(v) => setCriterionComments((prev) => ({ ...prev, [c.key]: v }))}
            />
          </div>
        ))}
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

      {verdict === 'YES' && (
        <Textarea name="comment" label={JURY_WINNING_MODEL_QUESTION} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      )}

      {!allCriteriaScored && (
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
          score all {JURY_RUBRIC_CRITERIA.length} criteria before submitting — {JURY_RUBRIC_CRITERIA.length - answeredCount} still blank.
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button type="submit" variant="cta" disabled={pending || !allCriteriaScored} style={{ flex: 1 }}>
          {pending ? 'saving…' : !allCriteriaScored ? 'score every criterion to continue' : existing ? 'update verdict' : 'submit verdict'}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirmClear(true)}>
          clear scorecard
        </Button>
      </div>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="clear scorecard"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
              cancel
            </Button>
            <Button variant="cta" size="sm" onClick={handleClear}>
              clear scorecard
            </Button>
          </>
        }
      >
        this clears every score and comment on this scorecard{existing ? ', including your already-submitted verdict' : ''} and resets
        it back to blank. this can&apos;t be undone.
      </Dialog>
    </form>
  );
}
