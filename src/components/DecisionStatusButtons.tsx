'use client';
import React from 'react';
import { setInternalDecisionAction } from '@/lib/applications/actions';

function pillStyle(active: boolean, tone: 'red' | 'neutral'): React.CSSProperties {
  return {
    fontSize: 'var(--fs-caption)',
    textTransform: 'lowercase',
    padding: 'var(--space-2) var(--space-3)',
    border: `1px solid ${active ? 'var(--delta-red)' : 'var(--border-strong)'}`,
    background: active ? (tone === 'red' ? 'var(--delta-red)' : 'var(--surface-ink)') : 'transparent',
    color: active ? 'var(--text-inverse)' : 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  };
}

/** `canManage` gates the actual buttons — the decision gate is an admin-only action server-side
 *  (CAN_TRANSITION_STAGE), so a viewer without that power (e.g. a reviewer, who can see this
 *  panel but not act on it) gets a plain read-only badge instead of buttons that would just fail
 *  on click. */
export function DecisionStatusButtons({
  applicationId,
  current,
  canManage,
}: {
  applicationId: string;
  current: string | null;
  canManage: boolean;
}) {
  const [pending, setPending] = React.useState(false);

  async function decide(decision: 'YES' | 'NO' | 'CLEAR') {
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('decision', decision);
    try {
      await setInternalDecisionAction(formData);
    } finally {
      setPending(false);
    }
  }

  if (!canManage) {
    const label = current === 'YES' ? 'decision: yes' : current === 'NO' ? 'decision: no' : 'undecided';
    return <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{label}</span>;
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <button type="button" disabled={pending} onClick={() => decide('YES')} style={pillStyle(current === 'YES', 'red')}>
        mark yes
      </button>
      <button type="button" disabled={pending} onClick={() => decide('NO')} style={pillStyle(current === 'NO', 'neutral')}>
        mark no
      </button>
      {current && (
        <button type="button" disabled={pending} onClick={() => decide('CLEAR')} style={pillStyle(false, 'neutral')}>
          clear
        </button>
      )}
    </div>
  );
}
