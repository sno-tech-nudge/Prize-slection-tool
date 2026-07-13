import React from 'react';

/**
 * Square icon button. Pass a single icon (e.g. a Lucide element) as children.
 */
export function IconButton({
  variant = 'secondary',  // 'primary' | 'secondary' | 'ghost'
  size = 'md',            // 'sm' | 'md' | 'lg'
  label,                  // accessible label (required for a11y)
  disabled = false,
  style,
  children,
  ...rest
}) {
  const dims = { sm: 32, md: 40, lg: 48 };
  const d = dims[size];

  const variants = {
    primary:   { background: 'var(--action)', color: 'var(--action-text)', borderColor: 'var(--action)' },
    secondary: { background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border-strong)' },
    ghost:     { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' },
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      style={{
        width: d, height: d,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid transparent', borderRadius: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
