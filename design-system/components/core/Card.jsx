import React from 'react';

/**
 * Flat, square-edged surface. Optional red accent bar along one edge
 * (top by default) — the closest the brand comes to a rounded card.
 */
export function Card({
  accent = false,               // draw the red edge bar
  accentSide = 'top',           // 'top' | 'left'
  elevated = false,             // subtle shadow vs flat border
  padding = 'var(--space-6)',
  style,
  children,
  ...rest
}) {
  const accentBorder = accent
    ? (accentSide === 'left'
        ? { borderLeft: '4px solid var(--delta-red)' }
        : { borderTop: '4px solid var(--delta-red)' })
    : null;

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: elevated ? 'none' : '1px solid var(--border-subtle)',
        boxShadow: elevated ? 'var(--shadow-md)' : 'none',
        borderRadius: 0,
        padding,
        ...accentBorder,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
