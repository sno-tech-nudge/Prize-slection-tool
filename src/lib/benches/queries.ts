import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

/** Filter set for the internal jury oversight list — name, bench(es), int (human review) score
 *  bucket(s), and average jury score bucket(s). Bench, intScore, and score are all multi-select:
 *  each is a comma-separated list of values, same convention as the main applications table's
 *  multi-select filters (splitCsv). */
export interface JuryListFilters {
  q?: string;
  bench?: string;
  intScore?: string;
  score?: string;
  sort?: string;
}

export const JURY_SORT_OPTIONS = [
  { value: 'name', label: 'alphabetical' },
  { value: 'intScore', label: 'int score' },
  { value: 'juryScore', label: 'jury score' },
] as const;

/** Score filter buckets, inclusive on both ends — e.g. "51-75" matches an average jury score of
 *  51 through 75. */
export const SCORE_BUCKETS = ['0-25', '26-50', '51-75', '76-100'] as const;

function splitCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildJuryFilterWhere(filters: JuryListFilters): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {};
  if (filters.q) where.orgName = { contains: filters.q, mode: 'insensitive' };
  const benches = splitCsv(filters.bench);
  if (benches.length) where.benchId = { in: benches };
  return where;
}

export async function listBenches() {
  const benches = await prisma.bench.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      jurors: { orderBy: { name: 'asc' } },
      _count: { select: { applications: true } },
    },
  });
  return benches;
}

export async function listJuryUsers() {
  return prisma.user.findMany({
    where: { role: 'JURY' },
    orderBy: { name: 'asc' },
    include: { benches: true },
  });
}

/** The full jury-eligible pool (internalDecision: YES) with their current bench, if any — this
 *  is the assignment surface an admin uses to place companies onto benches. */
export async function listJuryEligibleApplications() {
  return prisma.application.findMany({
    where: { isDuplicateOf: null, internalDecision: 'YES' },
    orderBy: { orgName: 'asc' },
    select: { id: true, orgName: true, benchId: true, bench: { select: { name: true } } },
  });
}

/** Internal oversight view — every shortlisted application with its bench and every juror's
 *  individual score on that bench, so an admin/reviewer can see jury progress across all benches
 *  at a glance. This is distinct from what a jury member sees on /applications (their own bench
 *  only, no other jurors' names until they've submitted their own score). */
export async function listJuryOversight(filters: JuryListFilters = {}) {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null, internalDecision: 'YES', ...buildJuryFilterWhere(filters) },
    orderBy: { orgName: 'asc' },
    include: {
      bench: { include: { jurors: { orderBy: { name: 'asc' } } } },
      // "int score" means the internal team's own manual review score, not the automatic AI
      // read — an application can reach jury with an AI score already computed but nobody on
      // the review team having actually scored it yet, and that should show as unscored, not
      // borrow the AI number.
      humanReviews: { select: { composite: true } },
      juryScores: { include: { juror: true }, orderBy: { juror: { name: 'asc' } } },
    },
  });

  // both int (human review) score and average jury score are aggregates across a variable number
  // of rows, not stored columns, so both bucket filters are applied in-memory rather than pushed
  // into the Prisma where. Multi-select: a row matches if its average falls in ANY selected bucket.
  const toRanges = (csv: string | undefined) => splitCsv(csv).map((b) => b.split('-').map(Number));
  const intScoreRanges = toRanges(filters.intScore);
  const juryScoreRanges = toRanges(filters.score);

  const filtered = apps.filter((a) => {
    if (intScoreRanges.length > 0) {
      if (a.humanReviews.length === 0) return false;
      const avg = a.humanReviews.reduce((sum, r) => sum + r.composite, 0) / a.humanReviews.length;
      if (!intScoreRanges.some(([min, max]) => avg >= min && avg <= max)) return false;
    }
    if (juryScoreRanges.length > 0) {
      if (a.juryScores.length === 0) return false;
      const avg = a.juryScores.reduce((sum, s) => sum + s.composite, 0) / a.juryScores.length;
      if (!juryScoreRanges.some(([min, max]) => avg >= min && avg <= max)) return false;
    }
    return true;
  });

  // default order (from the Prisma query above) is already alphabetical by org name — only
  // re-sort in-memory for the two aggregate-based options, which aren't stored columns. Unscored
  // applications sort to the bottom rather than tying with a real 0 score.
  if (filters.sort === 'intScore') {
    const avgOf = (a: (typeof filtered)[number]) =>
      a.humanReviews.length > 0 ? a.humanReviews.reduce((sum, r) => sum + r.composite, 0) / a.humanReviews.length : -1;
    return [...filtered].sort((a, b) => avgOf(b) - avgOf(a));
  }
  if (filters.sort === 'juryScore') {
    const avgOf = (a: (typeof filtered)[number]) =>
      a.juryScores.length > 0 ? a.juryScores.reduce((sum, s) => sum + s.composite, 0) / a.juryScores.length : -1;
    return [...filtered].sort((a, b) => avgOf(b) - avgOf(a));
  }
  return filtered;
}
