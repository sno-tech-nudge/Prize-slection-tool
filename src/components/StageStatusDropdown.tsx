'use client';
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/design-system';
import { STAGE_STATUS_LABEL, type StageStatusValue } from '@/lib/constants';
import { LEGAL_TRANSITIONS } from '@/lib/stages/rules';
import { transitionApplicationAction } from '@/lib/applications/actions';
import { StageBadge } from '@/components/StatusBadges';

/** Click-to-change stage status, inline in a list row. Only legal next stages are offered
 *  (same rules as the full-record stage action bar); falls back to a plain read-only badge
 *  for terminal stages or non-admin viewers. */
export function StageStatusDropdown({ applicationId, stage, canManage }: { applicationId: string; stage: string; canManage: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const options = LEGAL_TRANSITIONS[stage as StageStatusValue] ?? [];

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!canManage || options.length === 0) {
    return <StageBadge stage={stage} />;
  }

  async function move(to: string) {
    setOpen(false);
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('toStatus', to);
    try {
      await transitionApplicationAction(formData);
    } finally {
      setPending(false);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <StageBadge stage={stage} />
        <ChevronDown size={12} color="var(--text-muted)" strokeLinejoin="miter" strokeLinecap="square" />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 'var(--space-2)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-md)',
            minWidth: 180,
            zIndex: 'var(--z-overlay)' as unknown as number,
          }}
        >
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => move(o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                width: '100%',
                textAlign: 'left',
                padding: 'var(--space-3) var(--space-4)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-small)',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              move to <Badge tone="outline">{STAGE_STATUS_LABEL[o]}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
