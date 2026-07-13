import * as React from 'react';

export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> {
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/** Hover tooltip on a charcoal ground. */
export function Tooltip(props: TooltipProps): JSX.Element;
