import type { Prisma } from '@prisma/client';

/** The single definition of "reviewed" used everywhere it's shown or counted: dashboard KPI,
 *  the review-decision funnel, the applications list badge/filter, the analytics mix chart, and
 *  the CSV export. Reviewed is purely the pipeline stage set via the stage-action toggle:
 *  UNDER_REVIEW counts as reviewed, SUBMITTED (or anything else) does not. Submitting an actual
 *  score (HumanReview) is a separate, independent action and has no bearing on this flag. */
export function isReviewed(app: { stageStatus: string }): boolean {
  return app.stageStatus === 'UNDER_REVIEW';
}

export const REVIEWED_WHERE: Prisma.ApplicationWhereInput = { stageStatus: 'UNDER_REVIEW' };

export const NOT_REVIEWED_WHERE: Prisma.ApplicationWhereInput = { stageStatus: { not: 'UNDER_REVIEW' } };

/** The "score" shown in the applications list and used for sorting — average composite across
 *  every submitted HumanReview for the application, or null if nobody's reviewed it yet. Single
 *  definition shared by the row display and the list's sort-by-score option, so they can never
 *  drift apart. */
export function computeHumanComposite(app: { humanReviews: { composite: number }[] }): number | null {
  return app.humanReviews.length > 0
    ? Math.round(app.humanReviews.reduce((sum, r) => sum + r.composite, 0) / app.humanReviews.length)
    : null;
}
