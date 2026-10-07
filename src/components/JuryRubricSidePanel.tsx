'use client';
import React from 'react';
import { X, ListChecks } from 'lucide-react';
import { Button } from '@/design-system';
import { JURY_RUBRIC_CRITERIA, JURY_RUBRIC_MAX_TOTAL, JURY_FRAMING_QUESTION, JURY_DECISION_QUESTION } from '@/lib/scoring/juryRubric';

/** Round 2's counterpart to RubricSidePanel (the round 1 rubric on the applications page) —
 *  the jury's own five-criterion rubric, read-only, for the internal team to refer to while
 *  looking at jury scores. */
export function JuryRubricSidePanel() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ListChecks size={14} strokeLinejoin="miter" strokeLinecap="square" />
          explore round 2 rubric
        </span>
      </Button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-overlay)' as unknown as number, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'var(--surface-ink)', opacity: 0.5 }} />
          <div
            style={{
              position: 'relative',
              width: 460,
              maxWidth: '100%',
              height: '100%',
              background: 'var(--surface-card)',
              borderLeft: '4px solid var(--delta-red)',
              overflowY: 'auto',
              padding: 'var(--space-6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--fs-h4)' }}>jury scoring rubric</h2>
                <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                  {JURY_RUBRIC_CRITERIA.length} weighted criteria, each scored and commented on as a single unit, summing to{' '}
                  {JURY_RUBRIC_MAX_TOTAL}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1)' }}
              >
                <X size={18} strokeLinejoin="miter" strokeLinecap="square" color="var(--text-secondary)" />
              </button>
            </div>

            <p
              style={{
                fontSize: 'var(--fs-caption)',
                color: 'var(--text-secondary)',
                borderLeft: '2px solid var(--delta-red)',
                paddingLeft: 'var(--space-3)',
                marginBottom: 'var(--space-6)',
                overflowWrap: 'break-word',
              }}
            >
              {JURY_FRAMING_QUESTION}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {JURY_RUBRIC_CRITERIA.map((c, i) => (
                <div key={c.key} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-primary)' }}>
                      {i + 1}. {c.label}
                    </span>
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--delta-red)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                      max {c.maxScore}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', overflowWrap: 'break-word' }}>
                    {c.establishText}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {c.coreQuestions.map((q) => (
                      <div key={q} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--fs-caption)' }}>
                        <span style={{ color: 'var(--delta-red)', flexShrink: 0 }}>·</span>
                        <span style={{ color: 'var(--text-secondary)', overflowWrap: 'break-word' }}>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p
              style={{
                fontSize: 'var(--fs-caption)',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 'var(--space-3)',
                marginTop: 'var(--space-6)',
                overflowWrap: 'break-word',
              }}
            >
              <strong>verdict question:</strong> {JURY_DECISION_QUESTION}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
