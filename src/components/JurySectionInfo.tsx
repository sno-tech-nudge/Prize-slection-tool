'use client';
import React from 'react';
import { Info } from 'lucide-react';
import { Dialog } from '@/design-system';

/** The "i" button next to each jury rubric criterion heading — opens the criterion's "to
 *  establish that..." text from the jury rubric sheet, kept out of the always-visible form so the
 *  core questions (shown inline) stay the focus while scoring. */
export function JurySectionInfo({ label, establishText }: { label: string; establishText: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`what "${label}" establishes`}
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

      <Dialog open={open} onClose={() => setOpen(false)} title={`what "${label}" establishes`} width={480}>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>{establishText}</p>
      </Dialog>
    </>
  );
}
