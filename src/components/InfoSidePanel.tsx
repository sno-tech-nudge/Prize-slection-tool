'use client';
import React from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { Button } from '@/design-system';

/** Generic slide-out panel triggered by a button — same mechanism as RubricSidePanel and
 *  ReviewSidePanel, generalized so content-only panels (jury guidelines, a sample scorecard)
 *  don't each need their own copy of the open/close chrome. */
export function InfoSidePanel({
  triggerLabel,
  icon: Icon,
  title,
  children,
}: {
  triggerLabel: string;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Icon size={14} strokeLinejoin="miter" strokeLinecap="square" />
          {triggerLabel}
        </span>
      </Button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
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
              <h2 style={{ fontSize: 'var(--fs-h4)' }}>{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1)' }}
              >
                <X size={18} strokeLinejoin="miter" strokeLinecap="square" color="var(--text-secondary)" />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
