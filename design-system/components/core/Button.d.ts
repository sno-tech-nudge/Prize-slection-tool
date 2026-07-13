import * as React from 'react';

/**
 * @startingPoint section="Core" subtitle="Buttons — primary, secondary, ghost, cta" viewport="360x120"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 'cta' is the uppercase, tracked "APPLY NOW" treatment. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/** Square-edged button. Primary is delta red. */
export function Button(props: ButtonProps): JSX.Element;
