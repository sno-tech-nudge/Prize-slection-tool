import React from 'react';

/**
 * Consistent title treatment for organisation/target names wherever they act as the primary
 * identifier of a row or card — tables, kanban cards, wishlist cards, activity feeds. Mirrors
 * the brand's "headings are lowercase" rule (enforced globally on h1-h6 in globals.css) so the
 * same name doesn't render lowercase on a detail page's <h1> but shout in raw caps everywhere
 * else, just because a <div> was used instead of a heading tag.
 */
export function OrgTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ textTransform: 'lowercase', ...style }}>{children}</span>;
}
