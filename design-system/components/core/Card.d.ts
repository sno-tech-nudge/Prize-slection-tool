import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Draw a red accent bar on one edge. */
  accent?: boolean;
  accentSide?: 'top' | 'left';
  /** Subtle shadow instead of a hairline border. */
  elevated?: boolean;
  padding?: string;
}

/** Flat, square-edged surface. */
export function Card(props: CardProps): JSX.Element;
