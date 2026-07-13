'use client';
import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export function Checkbox({ label, checked, defaultChecked, onChange, disabled, id, style, ...rest }: CheckboxProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;

  return (
    <label
      htmlFor={inputId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-light)' as unknown as number,
        fontSize: 'var(--fs-body)',
        color: 'var(--text-primary)',
        ...style,
      }}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={(e) => {
          if (!isControlled) setInternal(e.target.checked);
          onChange?.(e);
        }}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        {...rest}
      />
      <span
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          border: '2px solid',
          borderColor: on ? 'var(--delta-red)' : 'var(--border-strong)',
          background: on ? 'var(--delta-red)' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--delta-white)',
          fontSize: 12,
          lineHeight: 1,
          borderRadius: 0,
          transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
        }}
      >
        {on ? '✓' : ''}
      </span>
      {label}
    </label>
  );
}
