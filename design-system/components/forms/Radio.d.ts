import * as React from 'react';

export interface RadioOption { value: string; label: React.ReactNode; }

export interface RadioProps {
  name?: string;
  options?: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/** Radio group with square indicators (brand rule: no circles). */
export function Radio(props: RadioProps): JSX.Element;
