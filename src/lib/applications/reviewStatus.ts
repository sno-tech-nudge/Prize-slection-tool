import type { Prisma } from '@prisma/client';

/** The single definition of "reviewed" used everywhere it's shown or counted: dashboard KPI,
 *  the review-decision funnel, the applications list badge/filter, the analytics mix chart, and
 *  the CSV export. An application counts as reviewed only if a real review was submitted AND it
 *  hasn't since been manually sent back to "under review" — that stage-toggle move is a
 *  deliberate way to pull something out of the reviewed count (e.g. asking for a second pass)
 *  without deleting the human review data itself. */
export function isReviewed(app: { humanReviews: unknown[]; stageStatus: string }): boolean {
  return app.humanReviews.length > 0 && app.stageStatus !== 'UNDER_REVIEW';
}

export const REVIEWED_WHERE: Prisma.ApplicationWhereInput = {
  humanReviews: { some: {} },
  stageStatus: { not: 'UNDER_REVIEW' },
};

export const NOT_REVIEWED_WHERE: Prisma.ApplicationWhereInput = {
  OR: [{ humanReviews: { none: {} } }, { stageStatus: 'UNDER_REVIEW' }],
};
