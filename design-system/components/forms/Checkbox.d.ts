import * as React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

/** Square checkbox with a red checked state. */
export function Checkbox(props: CheckboxProps): JSX.Element;
