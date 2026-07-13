import React from 'react';

/**
 * Underlined tab bar. Active tab carries a red underline (square).
 * items: [{ id, label }]
 */
export function Tabs({ items = [], value, defaultValue, onChange, style, ...rest }) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.id);
  const current = isControlled ? value : internal;

  return (
    <div
      role="tablist"
      style={{ display: 'flex', gap: 'var(--space-6)', borderBottom: '1px solid var(--border-subtle)', ...style }}
      {...rest}
    >
      {items.map((it) => {
        const on = current === it.id;
        return (
          <button
            key={it.id} role="tab" aria-selected={on} type="button"
            onClick={() => { if (!isControlled) setInternal(it.id); onChange?.(it.id); }}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              padding: '0 0 var(--space-3)',
              fontFamily: 'var(--font-sans)',
              fontWeight: on ? 'var(--fw-bold)' : 'var(--fw-semibold)',
              fontSize: 'var(--fs-body)', textTransform: 'lowercase',
              color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: on ? '3px solid var(--delta-red)' : '3px solid transparent',
              marginBottom: -1,
              transition: 'color var(--dur-fast) var(--ease-out)',
            }}
          >{it.label}</button>
        );
      })}
    </div>
  );
}
