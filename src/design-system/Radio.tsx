'use client';
import React from 'react';

export interface RadioOptionSpec {
  value: string;
  label: React.ReactNode;
}

export interface RadioProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name?: string;
  options?: RadioOptionSpec[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function Radio({ name, options = [], value, defaultValue, onChange, disabled, style, ...rest }: RadioProps) {
  const generatedName = React.useId();
  const groupName = name || generatedName;
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const current = isControlled ? value : internal;

  return (
    <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', ...style }} {...rest}>
      {options.map((opt) => {
        const on = current === opt.value;
        return (
          <label
            key={opt.value}
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
            }}
          >
            <input
              type="radio"
              name={groupName}
              value={opt.value}
              checked={on}
              disabled={disabled}
              onChange={() => {
                if (!isControlled) setInternal(opt.value);
                onChange?.(opt.value);
              }}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                width: 18,
                height: 18,
                flexShrink: 0,
                border: '2px solid',
                borderColor: on ? 'var(--delta-red)' : 'var(--border-strong)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 0,
              }}
            >
              <span style={{ width: 8, height: 8, background: on ? 'var(--delta-red)' : 'transparent' }} />
            </span>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
