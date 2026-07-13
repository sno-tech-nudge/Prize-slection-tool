import React from 'react';

/**
 * Small status/label chip. Square edges, uppercase, tracked.
 */
export function Badge({
  tone = 'neutral',   // 'neutral' | 'red' | 'ink' | 'yellow' | 'outline'
  style,
  children,
  ...rest
}) {
  const tones = {
    neutral: { background: 'var(--grey-100)', color: 'var(--text-secondary)' },
    red:     { background: 'var(--delta-red)', color: '#fff' },
    ink:     { background: 'var(--delta-charcoal)', color: '#fff' },
    yellow:  { background: 'var(--delta-yellow)', color: 'var(--delta-charcoal)' },
    outline: { background: 'transparent', color: 'var(--text-primary)', boxShadow: 'inset 0 0 0 1px var(--border-strong)' },
  };
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 8px',
        fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-bold)',
        fontSize: 'var(--fs-caption)', lineHeight: 1.4,
        letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase',
        borderRadius: 0,
        ...tones[tone],
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
