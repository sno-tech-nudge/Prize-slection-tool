import React from 'react';

/**
 * Signature the^delta banner: a blank canvas framed by sharp red diagonal
 * cuts (top-left + bottom-right). Used for hero units and program headers.
 */
export function AngularBanner({
  eyebrow,
  title,
  subtitle,
  action,               // ReactNode, e.g. <Button>apply now</Button>
  tone = 'light',       // 'light' (white canvas) | 'ink' (charcoal canvas)
  media,                // optional ReactNode pinned bottom-right (e.g. B&W image)
  style,
  children,
  ...rest
}) {
  const dark = tone === 'ink';
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: dark ? 'var(--surface-ink)' : 'var(--surface-card)',
        color: dark ? 'var(--text-inverse)' : 'var(--text-primary)',
        padding: 'var(--space-16) var(--space-12)',
        ...style,
      }}
      {...rest}
    >
      {/* top-left cut */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 0, height: 0,
        borderTop: '96px solid var(--delta-red)',
        borderRight: '96px solid transparent',
      }} />
      {/* bottom-right cut */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0, width: 0, height: 0,
        borderBottom: '160px solid var(--delta-red)',
        borderLeft: '220px solid transparent',
      }} />

      <div style={{ position: 'relative', maxWidth: 640 }}>
        {eyebrow && (
          <div style={{
            fontSize: 'var(--fs-overline)', fontWeight: 'var(--fw-bold)',
            letterSpacing: 'var(--ls-wide)', textTransform: 'uppercase',
            color: 'var(--delta-red)', marginBottom: 'var(--space-3)',
          }}>{eyebrow}</div>
        )}
        {title && (
          <h1 style={{
            margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-bold)',
            fontSize: 'var(--fs-h1)', lineHeight: 'var(--lh-tight)',
            letterSpacing: 'var(--ls-tight)', textTransform: 'lowercase',
          }}>{title}</h1>
        )}
        {subtitle && (
          <p style={{
            margin: 'var(--space-4) 0 0', fontWeight: 'var(--fw-light)',
            fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-relaxed)',
            color: dark ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
          }}>{subtitle}</p>
        )}
        {children}
        {action && <div style={{ marginTop: 'var(--space-8)' }}>{action}</div>}
      </div>

      {media && (
        <div style={{ position: 'absolute', right: 0, bottom: 0, zIndex: 1 }}>{media}</div>
      )}
    </section>
  );
}
