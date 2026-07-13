'use client';
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  iconLeft,
  iconRight,
  style,
  children,
  ...rest
}: ButtonProps) {
  const pads: Record<string, string> = {
    sm: '8px 14px',
    md: '12px 22px',
    lg: '16px 30px',
  };
  const fontSizes: Record<string, number> = { sm: 13, md: 15, lg: 17 };

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-bold)' as unknown as number,
    fontSize: fontSizes[size],
    lineHeight: 1,
    padding: pads[size],
    border: '2px solid transparent',
    borderRadius: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition:
      'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
    textTransform: 'lowercase',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    opacity: disabled ? 0.45 : 1,
    ...style,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--action)',
      color: 'var(--action-text)',
      borderColor: 'var(--action)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-strong)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--delta-red)',
      borderColor: 'transparent',
    },
    cta: {
      background: 'var(--action)',
      color: 'var(--action-text)',
      borderColor: 'var(--action)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-wide)',
    },
  };

  const [hover, setHover] = React.useState(false);
  const hoverStyle: React.CSSProperties | null =
    !disabled && hover
      ? ({
          primary: { background: 'var(--action-hover)', borderColor: 'var(--action-hover)' },
          cta: { background: 'var(--action-hover)', borderColor: 'var(--action-hover)' },
          secondary: { background: 'var(--delta-charcoal)', color: 'var(--text-inverse)' },
          ghost: { color: 'var(--action-hover)' },
        } as Record<string, React.CSSProperties>)[variant]
      : null;

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variants[variant], ...hoverStyle }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
