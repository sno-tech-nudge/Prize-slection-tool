import * as React from 'react';

/**
 * @startingPoint section="Brand" subtitle="Diagonal-cut hero / program header" viewport="1200x420"
 */
export interface AngularBannerProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** CTA node, e.g. a <Button>. */
  action?: React.ReactNode;
  /** 'light' = white canvas, 'ink' = charcoal canvas. */
  tone?: 'light' | 'ink';
  /** Optional media pinned to the bottom-right. */
  media?: React.ReactNode;
}

/** Signature hero banner framed by sharp red diagonal cuts. */
export function AngularBanner(props: AngularBannerProps): JSX.Element;
