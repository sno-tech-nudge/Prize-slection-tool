'use client';
import React from 'react';
import { Info } from 'lucide-react';
import { Dialog } from '@/design-system';
import { RUBRIC_CRITERIA } from '@/lib/scoring/rubric';
import type { CriterionScore } from '@/lib/scoring/types';

/** The "i" button next to each AI-evaluation section line — opens the AI's actual reasoning
 *  (rationale + evidence) for every criterion in that section, so a percentage never has to be
 *  taken on faith. Each criterion the AI scores already carries a rationale/evidence pair (see
 *  CriterionScore) — this is the only place in the UI that surfaces it. */
export function SectionScoreInfo({
  sectionLabel,
  sectionKey,
  criteria,
}: {
  sectionLabel: string;
  sectionKey: string;
  criteria: CriterionScore[];
}) {
  const [open, setOpen] = React.useState(false);
  const defs = RUBRIC_CRITERIA.filter((c) => c.section === sectionKey);
  const byKey = Object.fromEntries(criteria.map((c) => [c.key, c]));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`why ${sectionLabel} scored this`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <Info size={14} strokeLinejoin="miter" strokeLinecap="square" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={`why "${sectionLabel}" scored this`} width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {defs.map((def) => {
            const score = byKey[def.key];
            return (
              <div key={def.key} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <strong style={{ fontSize: 'var(--fs-small)' }}>{def.label}</strong>
                  <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                    {score ? `${score.score} / ${def.maxScore}` : `— / ${def.maxScore}`}
                  </span>
                </div>
                {score?.rationale && (
                  <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: score.evidence ? 'var(--space-2)' : 0, whiteSpace: 'pre-wrap' }}>
                    {score.rationale}
                  </p>
                )}
                {score?.evidence && (
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', fontStyle: 'italic' }}>&ldquo;{score.evidence}&rdquo;</p>
                )}
                {!score?.rationale && !score?.evidence && (
                  <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no rationale recorded for this criterion.</p>
                )}
              </div>
            );
          })}
        </div>
      </Dialog>
    </>
  );
}
