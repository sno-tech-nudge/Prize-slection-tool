'use client';
import React from 'react';
import { CURRENT_ROUND_VALUES, CURRENT_ROUND_LABEL, type CurrentRoundValue } from '@/lib/constants';
import { setCurrentRoundAction } from '@/lib/applications/actions';

function pillStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    fontSize: 'var(--fs-caption)',
    textTransform: 'lowercase',
    padding: 'var(--space-2) var(--space-3)',
    border: `1px solid ${active ? 'var(--delta-red)' : 'var(--border-strong)'}`,
    background: active ? 'var(--delta-red)' : 'transparent',
    color: active ? 'var(--text-inverse)' : 'var(--text-primary)',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'var(--font-sans)',
  };
}

/** Replaces the old StageActionBar/stage machine. No transition-legality rules — any of the 4
 *  states is always clickable by an admin/assigned reviewer, independent of the round decision
 *  gates (RoundDecisionButtons); marking a round decision YES auto-advances this, but this control
 *  can also move it directly regardless of decisions (per explicit instruction: manual override,
 *  not purely automatic). */
export function ApplicationStatusBar({
  applicationId,
  currentRound,
  canManage,
}: {
  applicationId: string;
  currentRound: string;
  canManage: boolean;
}) {
  const [pending, setPending] = React.useState(false);

  async function setRound(value: CurrentRoundValue) {
    if (!canManage) return;
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('currentRound', value);
    try {
      await setCurrentRoundAction(formData);
    } finally {
      setPending(false);
    }
  }

  const disabled = pending || !canManage;

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      {CURRENT_ROUND_VALUES.map((value) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          onClick={() => setRound(value)}
          style={pillStyle(currentRound === value, disabled)}
        >
          {CURRENT_ROUND_LABEL[value]}
        </button>
      ))}
    </div>
  );
}
