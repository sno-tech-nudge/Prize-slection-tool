import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'red' | 'ink' | 'yellow' | 'outline';
}

/** Small uppercase status label. Square edges. */
export function Badge(props: BadgeProps): JSX.Element;
