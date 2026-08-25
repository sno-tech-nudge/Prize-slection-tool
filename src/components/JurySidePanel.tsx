'use client';
import React from 'react';
import type { JuryScore } from '@prisma/client';
import { X, ClipboardCheck } from 'lucide-react';
import { Card, Badge, Button } from '@/design-system';
import { CompositeBadge } from '@/components/StatusBadges';
import { JuryScoringForm } from '@/components/JuryScoringForm';
import { JURY_DECISION_QUESTION } from '@/lib/scoring/juryRubric';

export interface JurySidePanelProps {
  applicationId: string;
  orgName: string;
  myScore?: JuryScore;
}

/** The jury's scoring workflow — a small always-visible summary box (current score/verdict, or
 *  "yet to score") with a "start scoring" button that opens the full rubric in a slide-out panel,
 *  same pattern as ReviewSidePanel for reviewers/admin. Jury only ever sees their own score — no
 *  other jurors' verdicts, scores, or comments are shown here at any point, blind or otherwise,
 *  so there's no cross-juror influence on an independent read. */
export function JurySidePanel({ applicationId, orgName, myScore }: JurySidePanelProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card accent accentSide="left" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-4)' }}>your score</h2>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          {myScore ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <CompositeBadge score={myScore.composite} />
              <Badge tone="outline">{myScore.verdict.toLowerCase()}</Badge>
            </div>
          ) : (
            <Badge tone="yellow">not yet scored</Badge>
          )}
        </div>
        <Button variant="cta" onClick={() => setOpen(true)} style={{ width: '100%', justifyContent: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ClipboardCheck size={14} strokeLinejoin="miter" strokeLinecap="square" />
            {myScore ? 'update your verdict' : 'start scoring'}
          </span>
        </Button>
      </Card>

      {/* No dimming backdrop on purpose — same reasoning as ReviewSidePanel: the underlying
       *  application page stays fully normal while this panel is open alongside it. */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 520,
            maxWidth: '100%',
            height: '100%',
            // must clear SectionJumpNav's sticky z-index (var(--z-sticky), 100) — see the same
            // note in ReviewSidePanel.tsx.
            zIndex: 'var(--z-overlay)' as unknown as number,
            background: 'var(--surface-card)',
            borderLeft: '4px solid var(--delta-red)',
            boxShadow: 'var(--shadow-md)',
            overflowY: 'auto',
            padding: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--fs-h4)' }}>score {orgName}</h2>
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>{JURY_DECISION_QUESTION}</p>
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

          <JuryScoringForm applicationId={applicationId} existing={myScore} onSubmitted={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
