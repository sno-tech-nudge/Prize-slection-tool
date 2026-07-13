import React from 'react';

/**
 * the^delta button. Square edges, forward momentum.
 * Primary = delta red; secondary = charcoal outline; ghost = quiet.
 * Label copy is typically lowercase; the "cta" variant is uppercase + tracked
 * (matches the "APPLY NOW" collateral treatment).
 */
export function Button({
  variant = 'primary',   // 'primary' | 'secondary' | 'ghost' | 'cta'
  size = 'md',           // 'sm' | 'md' | 'lg'
  disabled = false,
  iconLeft,
  iconRight,
  style,
  children,
  ...rest
}) {
  const pads = {
    sm: '8px 14px',
    md: '12px 22px',
    lg: '16px 30px',
  };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-bold)',
    fontSize: fontSizes[size],
    lineHeight: 1,
    padding: pads[size],
    border: '2px solid transparent',
    borderRadius: 0,               // always square
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
    textTransform: 'lowercase',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    opacity: disabled ? 0.45 : 1,
    ...style,
  };

  const variants = {
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
  const hoverStyle = !disabled && hover ? {
    primary: { background: 'var(--action-hover)', borderColor: 'var(--action-hover)' },
    cta:     { background: 'var(--action-hover)', borderColor: 'var(--action-hover)' },
    secondary: { background: 'var(--delta-charcoal)', color: 'var(--text-inverse)' },
    ghost: { color: 'var(--action-hover)' },
  }[variant] : null;

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
