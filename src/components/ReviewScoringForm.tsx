'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import type { HumanReview } from '@prisma/client';
import { Textarea, Input, Button } from '@/design-system';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS, computeComposite } from '@/lib/scoring/rubric';
import { parseCriteria } from '@/lib/scoring/parse';
import { submitHumanReviewAction } from '@/lib/applications/actions';

/** In-progress scores/comments are only ever held in React state, so a review that closes
 *  mid-way (accidental navigation, tab close, session hiccup) loses everything typed so far —
 *  this mirrors it into localStorage as the reviewer types, and clears it once actually
 *  submitted, so reopening the same application restores the draft instead of a blank form. */
interface ReviewDraft {
  scores: Record<string, number>;
  criterionComments: Record<string, string>;
  comment: string;
}

/** Every criterion's comment box starts at this same height, so the form reads as a clean,
 *  uniform grid at first glance rather than a jagged one sized per criterion's own guidance
 *  length. It only grows (or shrinks back) once the reviewer actually types — see
 *  CriterionCommentBox below — so a criterion with longer guidance just scrolls internally
 *  until then rather than making every box taller to accommodate it. */
const COMMENT_BOX_ROWS = 3;

/** Auto-grows to fit its own typed content (not the placeholder) as the reviewer types, and
 *  shrinks back down if they delete text — starts every box at the same COMMENT_BOX_ROWS height
 *  regardless of how long its placeholder guidance is. */
function CriterionCommentBox({
  name,
  placeholder,
  value,
  onChange,
}: {
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
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
      placeholder={placeholder}
      rows={COMMENT_BOX_ROWS}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontSize: 'var(--fs-caption)', resize: 'none', overflow: 'hidden' }}
    />
  );
}

function draftKeyFor(applicationId: string): string {
  return `delta-review-draft:${applicationId}`;
}

function loadDraft(applicationId: string): ReviewDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(draftKeyFor(applicationId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

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

  const existingComments = React.useMemo(() => {
    if (!existing) return {};
    return Object.fromEntries(parseCriteria(existing.criteria).map((c) => [c.key, c.comment ?? '']));
  }, [existing]);

  const draft = React.useMemo(() => loadDraft(applicationId), [applicationId]);

  const [scores, setScores] = React.useState<Record<string, number>>(draft?.scores ?? existingScores);
  const [criterionComments, setCriterionComments] = React.useState<Record<string, string>>(draft?.criterionComments ?? existingComments);
  const [comment, setComment] = React.useState(draft?.comment ?? existing?.comment ?? '');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(draftKeyFor(applicationId), JSON.stringify({ scores, criterionComments, comment }));
  }, [applicationId, scores, criterionComments, comment]);

  // USP (maxScore 0) is a free-text line the sheet itself marks "no scores" — it never appears
  // in the scored-criteria count, only in the numeric composite math (where 0 already means it
  // can't move the needle).
  const scoredCriteria = RUBRIC_CRITERIA.filter((c) => c.maxScore > 0);
  const answeredCount = Object.keys(scores).length;
  const liveComposite = computeComposite(scores);
  let runningIndex = 0;

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

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await submitHumanReviewAction(formData);
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
          {answeredCount} / {scoredCriteria.length} criteria scored
        </div>
      </div>

      {RUBRIC_SECTIONS.map((section) => {
        const sectionCriteria = RUBRIC_CRITERIA.filter((c) => c.section === section.key);

        return (
          <div key={section.key}>
            <div
              style={{
                fontSize: 'var(--fs-caption)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--ls-wide)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-3)',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-2)',
              }}
            >
              <span>{section.label}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {sectionCriteria.map((c) => {
                runningIndex += 1;
                return (
                  <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, marginBottom: 'var(--space-1)' }}>
                          {runningIndex}. {c.label}
                        </div>
                        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', margin: 0 }}>{c.description.join(' ')}</p>
                      </div>
                      {c.maxScore > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                          <Input
                            name={`criterion_${c.key}`}
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
                      )}
                    </div>
                    <CriterionCommentBox
                      name={`criterion_comment_${c.key}`}
                      placeholder={c.guidance}
                      value={criterionComments[c.key] ?? ''}
                      onChange={(v) => setCriterionComments((prev) => ({ ...prev, [c.key]: v }))}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Textarea name="comment" label="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />

      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? 'saving…' : existing ? 'update score' : 'submit score'}
      </Button>
    </form>
  );
}
