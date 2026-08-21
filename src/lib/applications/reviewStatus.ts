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

/** The "score" shown in the applications list and used for sorting — the composite from
 *  whichever HumanReview was submitted/updated most recently, or null if nobody's reviewed it
 *  yet. Deliberately NOT an average across every review: averaging is exactly what silently
 *  halved a reviewer's real score whenever a stale or duplicate row (an old account, a
 *  since-corrected re-score) sat alongside their real one — the most recent submission is always
 *  the current, intended answer, full stop. Single definition shared by the row display and the
 *  list's sort-by-score option, so they can never drift apart. */
export function computeHumanComposite(app: { humanReviews: { composite: number; submittedAt: Date }[] }): number | null {
  if (app.humanReviews.length === 0) return null;
  const latest = app.humanReviews.reduce((a, b) => (b.submittedAt > a.submittedAt ? b : a));
  return latest.composite;
}
