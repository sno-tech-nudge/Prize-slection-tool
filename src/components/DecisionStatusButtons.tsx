'use client';
import React from 'react';
import { setInternalDecisionAction } from '@/lib/applications/actions';

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

/** Every viewer sees the same pill buttons showing the current decision — `canManage` only
 *  controls whether they're clickable, it never swaps in a different read-only view. True for
 *  admin always, and for a reviewer only on an application they're actually assigned to
 *  (canManageApplication, enforced again server-side in setInternalDecisionAction). A reviewer
 *  looking at someone else's assigned application sees the exact same pills, just disabled, so
 *  they can still tell at a glance what's been marked. */
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

  async function decide(decision: 'YES' | 'NO' | 'ECOSYSTEM_PARTNER' | 'CLEAR') {
    if (!canManage) return;
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

  const disabled = pending || !canManage;

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <button type="button" disabled={disabled} onClick={() => decide('YES')} style={pillStyle(current === 'YES', 'red', disabled)}>
        mark yes
      </button>
      <button type="button" disabled={disabled} onClick={() => decide('NO')} style={pillStyle(current === 'NO', 'neutral', disabled)}>
        mark no
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => decide('ECOSYSTEM_PARTNER')}
        style={pillStyle(current === 'ECOSYSTEM_PARTNER', 'neutral', disabled)}
      >
        potential ecosystem partner
      </button>
      {current && (
        <button type="button" disabled={disabled} onClick={() => decide('CLEAR')} style={pillStyle(false, 'neutral', disabled)}>
          clear
        </button>
      )}
    </div>
  );
}
