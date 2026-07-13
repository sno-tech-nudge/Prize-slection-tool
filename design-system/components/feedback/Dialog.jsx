import React from 'react';

/** Modal dialog. Square edges, red top accent, dimmed charcoal backdrop. */
export function Dialog({ open, onClose, title, footer, width = 480, children, style, ...rest }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
        background: 'rgba(24,29,30,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div
        role="dialog" aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: '100%', background: 'var(--surface-card)',
          borderTop: '4px solid var(--delta-red)', borderRadius: 0,
          boxShadow: 'var(--shadow-lg)', ...style,
        }}
        {...rest}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{
              margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-bold)',
              fontSize: 'var(--fs-h4)', textTransform: 'lowercase',
            }}>{title}</h3>
            <button type="button" aria-label="close" onClick={onClose} style={{
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 20, lineHeight: 1, color: 'var(--text-secondary)',
            }}>×</button>
          </div>
        )}
        <div style={{
          padding: 'var(--space-6)', fontFamily: 'var(--font-sans)',
          fontWeight: 'var(--fw-light)', fontSize: 'var(--fs-body)',
          color: 'var(--text-secondary)', lineHeight: 'var(--lh-normal)',
        }}>{children}</div>
        {footer && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)',
            padding: 'var(--space-5) var(--space-6)', borderTop: '1px solid var(--border-subtle)',
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
