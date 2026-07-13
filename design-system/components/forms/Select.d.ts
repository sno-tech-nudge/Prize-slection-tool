import * as React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  helper?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

/** Native select styled to the brand. Pass <option>s as children. */
export function Select(props: SelectProps): JSX.Element;
