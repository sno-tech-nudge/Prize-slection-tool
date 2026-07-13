import * as React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
  /** If provided, shows an × remove affordance. */
  onRemove?: (e: React.MouseEvent) => void;
}

/** Interactive category tag / filter chip. */
export function Tag(props: TagProps): JSX.Element;
