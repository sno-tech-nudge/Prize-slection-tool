import React from 'react';

/**
 * Interactive category tag / filter chip. Square edges; supports selected
 * and removable states. Lowercase by default.
 */
export function Tag({
  selected = false,
  onRemove,            // if provided, shows an × affordance
  style,
  children,
  ...rest
}) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
        padding: '5px 10px',
        fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-semibold)',
        fontSize: 'var(--fs-small)', lineHeight: 1.2,
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
          onClick={(e) => { e.stopPropagation(); onRemove(e); }}
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            color: 'inherit', fontSize: 14, lineHeight: 1, padding: 0,
          }}
        >×</button>
      )}
    </span>
  );
}
