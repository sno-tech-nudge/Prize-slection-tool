'use client';
import { Info } from 'lucide-react';
import { Tooltip } from '@/design-system';

/** The "i" button next to a bench name on jury's applications dashboard — hovering shows just the
 *  names of every juror seated on that bench, nothing else (no roles/orgs), per the jury view
 *  field sheet's "just the name of jurors" note. */
export function BenchJurorsTooltip({ jurorNames }: { jurorNames: string[] }) {
  if (jurorNames.length === 0) return null;
  return (
    <Tooltip
      placement="right"
      content={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {jurorNames.map((name, i) => (
            <span key={name} style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{i + 1}.</span>
              <span>{name}</span>
            </span>
          ))}
        </div>
      }
      style={{ whiteSpace: 'normal', maxWidth: 240, padding: 'var(--space-3) var(--space-4)' }}
    >
      <button
        type="button"
        aria-label="jurors on this bench"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          marginLeft: 'var(--space-2)',
          cursor: 'default',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <Info size={14} strokeLinejoin="miter" strokeLinecap="square" />
      </button>
    </Tooltip>
  );
}
