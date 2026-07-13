import * as React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

/** Square toggle switch. On = delta red. */
export function Switch(props: SwitchProps): JSX.Element;
