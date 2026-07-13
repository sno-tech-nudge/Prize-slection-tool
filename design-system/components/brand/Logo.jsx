import React from 'react';

/**
 * the^delta wordmark + caret mark.
 * The name is ALWAYS written "the^delta" with the red caret between the words.
 */
export function Logo({
  variant = 'wordmark',   // 'wordmark' | 'mark'
  tone = 'dark',          // 'dark' | 'light' | 'red' — colour of "the"/"delta"
  program,                // optional: 'incubator' | 'accelerator' | 'prize' | string
  size = 32,              // font-size (wordmark) / height in px (mark)
  style,
  ...rest
}) {
  const wordColor =
    tone === 'light' ? 'var(--text-inverse)'
    : tone === 'red' ? 'var(--delta-red)'
    : 'var(--text-primary)';

  if (variant === 'mark') {
    const fill =
      tone === 'light' ? '#ffffff'
      : tone === 'dark' ? '#363d3f'
      : '#b21010';
    return (
      <svg
        viewBox="0 0 114 82"
        role="img"
        aria-label="the^delta"
        style={{ height: size, width: 'auto', display: 'block', ...style }}
        {...rest}
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
        fontWeight: 'var(--fw-bold)',
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
            fontWeight: 'var(--fw-light)',
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
