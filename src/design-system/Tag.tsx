'use client';
import React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
  onRemove?: (e: React.MouseEvent) => void;
}

export function Tag({ selected = false, onRemove, style, children, ...rest }: TagProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '5px 10px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-semibold)' as unknown as number,
        fontSize: 'var(--fs-small)',
        lineHeight: 1.2,
        textTransform: 'lowercase',
        border: '1px solid',
        borderColor: selected ? 'var(--delta-red)' : 'var(--border-subtle)',
        color: selected ? 'var(--delta-red)' : 'var(--text-secondary)',
        background: selected ? 'var(--red-050)' : 'transparent',
        borderRadius: 0,
        cursor: 'pointer',
        ...style,
      }}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          aria-label="remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'inherit',
            fontSize: 14,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
