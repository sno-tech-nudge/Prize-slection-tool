import * as React from 'react';

/**
 * @startingPoint section="Brand" subtitle="Wordmark + caret logo" viewport="360x120"
 */
export interface LogoProps extends React.HTMLAttributes<HTMLElement> {
  /** 'wordmark' renders the^delta text; 'mark' renders the caret glyph only. */
  variant?: 'wordmark' | 'mark';
  /** Colour of the word text / caret fill. */
  tone?: 'dark' | 'light' | 'red';
  /** Optional program lock-up appended after the wordmark. */
  program?: 'incubator' | 'accelerator' | 'prize' | string;
  /** font-size (wordmark) or height in px (mark). */
  size?: number;
}

/** the^delta wordmark / caret mark. The name is always written with the caret. */
export function Logo(props: LogoProps): JSX.Element;
