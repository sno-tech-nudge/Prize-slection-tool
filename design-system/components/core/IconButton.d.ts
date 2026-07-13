import * as React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label (required). */
  label?: string;
}

/** Square icon-only button. Pass a single icon as children. */
export function IconButton(props: IconButtonProps): JSX.Element;
