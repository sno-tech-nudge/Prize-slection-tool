'use client';
import React from 'react';
import { createPortal } from 'react-dom';

export interface DialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  fullscreen?: boolean;
}

export function Dialog({ open, onClose, title, footer, width = 480, fullscreen = false, children, style, ...rest }: DialogProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  // Rendered via portal to document.body — Dialog is often invoked from inside tables, lists and
  // other structurally-constrained parents (e.g. a <tr> in a <tbody>) where a fixed-position
  // overlay <div> would otherwise be invalid HTML and trigger a hydration error.
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)' as unknown as number,
        background: 'rgba(24,29,30,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: fullscreen ? 0 : 'var(--space-6)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: fullscreen ? '100%' : width,
          height: fullscreen ? '100%' : undefined,
          maxWidth: '100%',
          display: fullscreen ? 'flex' : undefined,
          flexDirection: fullscreen ? 'column' : undefined,
          background: 'var(--surface-card)',
          borderTop: '4px solid var(--delta-red)',
          borderRadius: 0,
          boxShadow: 'var(--shadow-lg)',
          ...style,
        }}
        {...rest}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-5) var(--space-6)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontWeight: 'var(--fw-bold)' as unknown as number,
                fontSize: 'var(--fs-h4)',
                textTransform: 'lowercase',
              }}
            >
              {title}
            </h3>
            <button
              type="button"
              aria-label="close"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 20,
                lineHeight: 1,
                color: 'var(--text-secondary)',
              }}
            >
              ×
            </button>
          </div>
        )}
        <div
          style={{
            padding: 'var(--space-6)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--fw-light)' as unknown as number,
            fontSize: 'var(--fs-body)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--lh-normal)',
            flex: fullscreen ? 1 : undefined,
            overflowY: fullscreen ? 'auto' : undefined,
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-3)',
              padding: 'var(--space-5) var(--space-6)',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
