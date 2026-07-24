'use client';
import React from 'react';
import { createPortal } from 'react-dom';
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
  // Toggling a checkbox used to call onChange immediately, which pushes a new URL on every
  // single click — that navigation re-renders this component from scratch and was closing the
  // dropdown after each selection, making "multi"-select only ever take one value at a time.
  // Draft state avoids navigating until the panel actually closes, so picking several options
  // in one sitting doesn't get interrupted.
  const [draft, setDraft] = React.useState<string[]>(selected);
  const [panelPos, setPanelPos] = React.useState<{ top: number; left: number } | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) setDraft(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close(commit: string[]) {
    setOpen(false);
    if (commit.length !== selected.length || commit.some((v) => !selected.includes(v))) onChange(commit);
  }

  function openPanel() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPanelPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    setOpen(true);
  }

  React.useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current && !panelRef.current.contains(target)) close(draft);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft]);

  const buttonLabel = selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${label} (${selected.length})`;

  return (
    <div style={{ position: 'relative', width, minWidth: 0, flexShrink: 0 }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close(draft) : openPanel())}
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
      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'absolute',
              top: panelPos.top,
              left: panelPos.left,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-strong)',
              zIndex: 'var(--z-modal)' as unknown as number,
              maxHeight: 300,
              overflowY: 'auto',
              minWidth: 220,
              padding: 'var(--space-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {draft.length > 0 && (
              <button
                type="button"
                onClick={() => setDraft([])}
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
                checked={draft.includes(o.value)}
                onChange={(e) => {
                  if (e.target.checked) setDraft((prev) => [...prev, o.value]);
                  else setDraft((prev) => prev.filter((v) => v !== o.value));
                }}
                style={{ padding: 'var(--space-1) var(--space-2)' }}
              />
            ))}
            <button
              type="button"
              onClick={() => close(draft)}
              style={{
                marginTop: 'var(--space-1)',
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-bold)' as unknown as number,
                color: 'var(--delta-red)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 'var(--space-1) var(--space-2)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              apply
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
