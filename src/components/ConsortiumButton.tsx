'use client';
import React from 'react';
import { setConsortiumAction } from '@/lib/applications/actions';

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

/** Purely informational marker, independent of the internalDecision pills above it — mirrors
 *  DecisionStatusButtons' same "everyone sees the same pills, canManage only controls whether
 *  they're clickable" pattern. Marking an application here has no effect on stage, pipeline, or
 *  jury visibility; it just gets remembered and shown wherever the application appears. */
export function ConsortiumButton({ applicationId, current, canManage }: { applicationId: string; current: boolean; canManage: boolean }) {
  const [pending, setPending] = React.useState(false);

  async function set(value: boolean) {
    if (!canManage) return;
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('value', value ? 'YES' : 'NO');
    try {
      await setConsortiumAction(formData);
    } finally {
      setPending(false);
    }
  }

  const disabled = pending || !canManage;

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <button type="button" disabled={disabled} onClick={() => set(true)} style={pillStyle(current, disabled)}>
        consortium: yes
      </button>
      <button type="button" disabled={disabled} onClick={() => set(false)} style={pillStyle(!current, disabled)}>
        consortium: no
      </button>
    </div>
  );
}
