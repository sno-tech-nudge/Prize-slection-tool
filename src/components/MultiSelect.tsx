'use client';
import React from 'react';
import { Checkbox } from '@/design-system';

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  width = 150,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  width?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const buttonLabel = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${label} (${selected.length})`;

  return (
    <div ref={ref} style={{ position: 'relative', width, minWidth: 0, flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        style={{
          width: '100%',
          fontSize: 'var(--fs-caption)',
          padding: 'var(--space-2)',
          border: `1px solid ${selected.length ? 'var(--delta-red)' : 'var(--border-strong)'}`,
          background: 'var(--surface-card)',
          color: selected.length ? 'var(--delta-red)' : 'var(--text-primary)',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {buttonLabel}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 'var(--space-1)',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-strong)',
            zIndex: 'var(--z-sticky)' as unknown as number,
            maxHeight: 260,
            overflowY: 'auto',
            minWidth: 220,
            padding: 'var(--space-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                fontSize: 'var(--fs-caption)',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 'var(--space-1) var(--space-2)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              clear all
            </button>
          )}
          {options.map((o) => (
            <Checkbox
              key={o.value}
              label={<span style={{ fontSize: 'var(--fs-small)' }}>{o.label}</span>}
              checked={selected.includes(o.value)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, o.value]);
                else onChange(selected.filter((v) => v !== o.value));
              }}
              style={{ padding: 'var(--space-1) var(--space-2)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
