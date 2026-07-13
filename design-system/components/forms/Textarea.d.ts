import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

/** Multi-line text input. */
export function Textarea(props: TextareaProps): JSX.Element;
