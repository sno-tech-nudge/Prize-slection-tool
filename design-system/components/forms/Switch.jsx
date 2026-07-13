import React from 'react';

/** Square toggle switch. On = delta red. */
export function Switch({ label, checked, defaultChecked, onChange, disabled, id, style, ...rest }) {
  const inputId = id || React.useId();
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;

  return (
    <label htmlFor={inputId} style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-body)', color: 'var(--text-primary)', ...style,
    }}>
      <input
        id={inputId} type="checkbox" checked={on} disabled={disabled}
        onChange={(e) => { if (!isControlled) setInternal(e.target.checked); onChange?.(e); }}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        {...rest}
      />
      <span style={{
        width: 42, height: 22, flexShrink: 0, padding: 2,
        background: on ? 'var(--delta-red)' : 'var(--grey-300)',
        borderRadius: 0, position: 'relative',
        transition: 'background var(--dur-base) var(--ease-out)',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 22 : 2,
          width: 18, height: 18, background: '#fff', borderRadius: 0,
          transition: 'left var(--dur-base) var(--ease-out)',
        }} />
      </span>
      {label}
    </label>
  );
}
