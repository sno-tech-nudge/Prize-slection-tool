import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'red' | 'ink' | 'yellow' | 'outline';
}

export function Badge({ tone = 'neutral', style, children, ...rest }: BadgeProps) {
  const tones: Record<string, React.CSSProperties> = {
    neutral: { background: 'var(--grey-100)', color: 'var(--text-secondary)' },
    red: { background: 'var(--delta-red)', color: 'var(--delta-white)' },
    ink: { background: 'var(--delta-charcoal)', color: 'var(--delta-white)' },
    yellow: { background: 'var(--delta-yellow)', color: 'var(--delta-charcoal)' },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      boxShadow: 'inset 0 0 0 1px var(--border-strong)',
    },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-bold)' as unknown as number,
        fontSize: 'var(--fs-caption)',
        lineHeight: 1.4,
        letterSpacing: 'var(--ls-wide)',
        textTransform: 'uppercase',
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
