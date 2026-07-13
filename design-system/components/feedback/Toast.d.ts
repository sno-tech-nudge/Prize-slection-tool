import * as React from 'react';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: 'info' | 'success' | 'warning' | 'error';
  title?: React.ReactNode;
  onClose?: () => void;
}

/** Inline toast with a status-coloured left accent. */
export function Toast(props: ToastProps): JSX.Element;
