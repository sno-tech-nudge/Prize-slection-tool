import React from 'react';

/** Inline toast/notification. Square, left accent by status. */
export function Toast({ status = 'info', title, children, onClose, style, ...rest }) {
  const accents = {
    info:    'var(--delta-charcoal)',
    success: 'var(--delta-red)',   // brand leans red for affirmative action
    warning: 'var(--delta-yellow)',
    error:   'var(--delta-red)',
  };
  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
        background: 'var(--surface-card)', borderRadius: 0,
        borderLeft: `4px solid ${accents[status]}`,
        boxShadow: 'var(--shadow-md)', padding: 'var(--space-4) var(--space-5)',
        minWidth: 280, maxWidth: 420, ...style,
      }}
      {...rest}
    >
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-bold)',
            fontSize: 'var(--fs-small)', color: 'var(--text-primary)',
            textTransform: 'lowercase', marginBottom: children ? 2 : 0,
          }}>{title}</div>
        )}
        {children && (
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-light)',
            fontSize: 'var(--fs-small)', color: 'var(--text-secondary)',
          }}>{children}</div>
        )}
      </div>
      {onClose && (
        <button type="button" aria-label="dismiss" onClick={onClose} style={{
          border: 'none', background: 'none', cursor: 'pointer',
          fontSize: 16, lineHeight: 1, color: 'var(--text-muted)',
        }}>×</button>
      )}
    </div>
  );
}
