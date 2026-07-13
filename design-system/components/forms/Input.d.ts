import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

/** Text input with label + helper/error. Red focus ring, square edges. */
export function Input(props: InputProps): JSX.Element;
