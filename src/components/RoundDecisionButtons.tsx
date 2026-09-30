'use client';
import React from 'react';
import { setRoundDecisionAction } from '@/lib/applications/actions';

function pillStyle(active: boolean, tone: 'red' | 'neutral', disabled: boolean): React.CSSProperties {
  return {
    fontSize: 'var(--fs-caption)',
    textTransform: 'lowercase',
    padding: 'var(--space-2) var(--space-3)',
    border: `1px solid ${active ? 'var(--delta-red)' : 'var(--border-strong)'}`,
    background: active ? (tone === 'red' ? 'var(--delta-red)' : 'var(--surface-ink)') : 'transparent',
    color: active ? 'var(--text-inverse)' : 'var(--text-primary)',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'var(--font-sans)',
  };
}

/** Generalized replacement for the old single-round DecisionStatusButtons — same four pills
 *  (yes / no / under review / clear) for whichever round is passed in. Round 2 is only actionable
 *  once round 1 is marked yes, round 3 only once round 2 is marked yes (enforced again
 *  server-side in setRoundDecisionAction) — `gated` renders the row disabled with an explanatory
 *  note instead of hiding it entirely, so it's always clear what's blocking the next round. */
export function RoundDecisionButtons({
  applicationId,
  round,
  current,
  canManage,
  gated,
}: {
  applicationId: string;
  round: 1 | 2 | 3;
  current: string | null;
  canManage: boolean;
  gated?: boolean;
}) {
  const [pending, setPending] = React.useState(false);

  async function decide(decision: 'YES' | 'NO' | 'UNDER_REVIEW' | 'CLEAR') {
    if (!canManage || gated) return;
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('decision', decision);
    try {
      await setRoundDecisionAction(round, formData);
    } finally {
      setPending(false);
    }
  }

  const disabled = pending || !canManage || Boolean(gated);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <button type="button" disabled={disabled} onClick={() => decide('YES')} style={pillStyle(current === 'YES', 'red', disabled)}>
          mark yes
        </button>
        <button type="button" disabled={disabled} onClick={() => decide('NO')} style={pillStyle(current === 'NO', 'neutral', disabled)}>
          mark no
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => decide('UNDER_REVIEW')}
          style={pillStyle(current === 'UNDER_REVIEW', 'neutral', disabled)}
        >
          under review
        </button>
        {current && (
          <button type="button" disabled={disabled} onClick={() => decide('CLEAR')} style={pillStyle(false, 'neutral', disabled)}>
            clear
          </button>
        )}
      </div>
      {gated && (
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
          round {round} decision opens once round {round - 1} is marked yes.
        </p>
      )}
    </div>
  );
}
