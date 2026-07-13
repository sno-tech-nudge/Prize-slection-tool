import React from 'react';

/** Multi-line text input. Shares Input styling. */
export function Textarea({ label, helper, error, id, rows = 4, style, containerStyle, ...rest }) {
  const inputId = id || React.useId();
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...containerStyle }}>
      {label && (
        <label htmlFor={inputId} style={{
          fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-small)', color: 'var(--text-primary)',
        }}>{label}</label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
        style={{
          fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-light)',
          fontSize: 'var(--fs-body)', color: 'var(--text-primary)',
          padding: '10px 12px', resize: 'vertical',
          background: 'var(--surface-card)',
          border: '1px solid',
          borderColor: error ? 'var(--delta-red)' : focus ? 'var(--delta-charcoal)' : 'var(--border-subtle)',
          outline: focus ? '2px solid var(--delta-red)' : 'none',
          outlineOffset: '1px', borderRadius: 0,
          ...style,
        }}
        {...rest}
      />
      {(helper || error) && (
        <span style={{ fontSize: 'var(--fs-caption)', color: error ? 'var(--delta-red)' : 'var(--text-secondary)' }}>
          {error || helper}
        </span>
      )}
    </div>
  );
}
