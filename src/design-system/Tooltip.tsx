'use client';
import React from 'react';

export interface TooltipProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'content'> {
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, placement = 'top', children, style, ...rest }: TooltipProps) {
  const [show, setShow] = React.useState(false);
  const pos: Record<string, React.CSSProperties> = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
  };
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      {...rest}
    >
      {children}
      {show && (
        <span
          style={{
            position: 'absolute',
            zIndex: 'var(--z-overlay)' as unknown as number,
            whiteSpace: 'nowrap',
            background: 'var(--delta-charcoal)',
            color: 'var(--delta-white)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--fw-light)' as unknown as number,
            fontSize: 'var(--fs-caption)',
            padding: '6px 10px',
            borderRadius: 0,
            ...pos[placement],
            ...style,
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
