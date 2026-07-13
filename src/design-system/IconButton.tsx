import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label: string;
}

export function IconButton({
  variant = 'secondary',
  size = 'md',
  label,
  disabled = false,
  style,
  children,
  ...rest
}: IconButtonProps) {
  const dims: Record<string, number> = { sm: 32, md: 40, lg: 48 };
  const d = dims[size];

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--action)', color: 'var(--action-text)', borderColor: 'var(--action)' },
    secondary: { background: 'transparent', color: 'var(--text-primary)', borderColor: 'var(--border-strong)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' },
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      style={{
        width: d,
        height: d,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid transparent',
        borderRadius: 0,
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
