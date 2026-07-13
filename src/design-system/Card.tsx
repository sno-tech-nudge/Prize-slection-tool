import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  accentSide?: 'top' | 'left';
  elevated?: boolean;
  padding?: string;
}

export function Card({
  accent = false,
  accentSide = 'top',
  elevated = false,
  padding = 'var(--space-6)',
  style,
  children,
  ...rest
}: CardProps) {
  const accentBorder: React.CSSProperties | null = accent
    ? accentSide === 'left'
      ? { borderLeft: '4px solid var(--delta-red)' }
      : { borderTop: '4px solid var(--delta-red)' }
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
