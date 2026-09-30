'use client';
import React from 'react';
import { setEcosystemPartnerAction } from '@/lib/applications/actions';

/** Purely informational marker, independent of every round decision — mirrors ConsortiumButton's
 *  same "everyone sees the same pill, canManage only controls whether it's clickable" pattern.
 *  Replaces the old ECOSYSTEM_PARTNER decision value, which no longer exists as a decision. */
export function EcosystemPartnerCheckbox({ applicationId, current, canManage }: { applicationId: string; current: boolean; canManage: boolean }) {
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    if (!canManage) return;
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('value', current ? 'NO' : 'YES');
    try {
      await setEcosystemPartnerAction(formData);
    } finally {
      setPending(false);
    }
  }

  const disabled = pending || !canManage;

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
      <input type="checkbox" checked={current} disabled={disabled} onChange={toggle} style={{ width: 16, height: 16 }} />
      <span style={{ fontSize: 'var(--fs-caption)', textTransform: 'lowercase', fontFamily: 'var(--font-sans)' }}>potential ecosystem partner</span>
    </label>
  );
}
