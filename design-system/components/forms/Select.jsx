import React from 'react';

/** Native select styled to the brand. Square edges, red focus. */
export function Select({ label, helper, id, children, style, containerStyle, ...rest }) {
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
      <div style={{ position: 'relative' }}>
        <select
          id={inputId}
          onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
          style={{
            appearance: 'none', width: '100%',
            fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-light)',
            fontSize: 'var(--fs-body)', color: 'var(--text-primary)',
            padding: '10px 36px 10px 12px',
            background: 'var(--surface-card)',
            border: '1px solid',
            borderColor: focus ? 'var(--delta-charcoal)' : 'var(--border-subtle)',
            outline: focus ? '2px solid var(--delta-red)' : 'none',
            outlineOffset: '1px', borderRadius: 0, cursor: 'pointer',
            ...style,
          }}
          {...rest}
        >
          {children}
        </select>
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--text-secondary)', fontSize: 12,
        }}>▾</span>
      </div>
      {helper && <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{helper}</span>}
    </div>
  );
}
