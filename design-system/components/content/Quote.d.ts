import * as React from 'react';

/**
 * @startingPoint section="Content" subtitle="Testimonial with B&W portrait" viewport="900x360"
 */
export interface QuoteProps extends React.HTMLAttributes<HTMLElement> {
  quote: React.ReactNode;
  name: React.ReactNode;
  role?: React.ReactNode;
  /** Portrait URL — rendered black & white. */
  portrait?: string;
  layout?: 'row' | 'stacked';
}

/** Testimonial / pull-quote in the^delta collateral style. */
export function Quote(props: QuoteProps): JSX.Element;
