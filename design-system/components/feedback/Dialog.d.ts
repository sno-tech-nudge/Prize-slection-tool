import * as React from 'react';

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

/** Modal dialog with red top accent and charcoal backdrop. */
export function Dialog(props: DialogProps): JSX.Element | null;
