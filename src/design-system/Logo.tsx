import React from 'react';

export interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'wordmark' | 'mark';
  tone?: 'dark' | 'light' | 'red';
  program?: string;
  size?: number;
}

export function Logo({ variant = 'wordmark', tone = 'dark', program, size = 32, style, ...rest }: LogoProps) {
  const wordColor =
    tone === 'light' ? 'var(--text-inverse)' : tone === 'red' ? 'var(--delta-red)' : 'var(--text-primary)';

  if (variant === 'mark') {
    const fill = tone === 'light' ? '#ffffff' : tone === 'dark' ? '#363d3f' : '#b21010';
    return (
      <svg
        viewBox="0 0 114 82"
        role="img"
        aria-label="the^delta"
        style={{ height: size, width: 'auto', display: 'block', ...style }}
      >
        <path d="M47.5 0 L66.5 0 L114 82 L90 82 L57 26 L24 82 L0 82 Z" fill={fill} />
      </svg>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-bold)' as unknown as number,
        fontSize: size,
        lineHeight: 1,
        textTransform: 'lowercase',
        letterSpacing: 'var(--ls-tight)',
        color: wordColor,
        ...style,
      }}
      {...rest}
    >
      the<span style={{ color: 'var(--delta-red)', margin: '0 0.02em' }}>^</span>delta
      {program && (
        <span
          style={{
            fontWeight: 'var(--fw-light)' as unknown as number,
            color: tone === 'light' ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
            marginLeft: '0.35em',
          }}
        >
          {program}
        </span>
      )}
    </span>
  );
}
