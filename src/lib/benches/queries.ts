import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

/** Filter set for the internal jury oversight list — name, bench, and average jury score
 *  bucket. */
export interface JuryListFilters {
  q?: string;
  bench?: string;
  score?: string;
}

/** Score filter buckets, inclusive on both ends — e.g. "51-75" matches an average jury score of
 *  51 through 75. */
export const SCORE_BUCKETS = ['0-25', '26-50', '51-75', '76-100'] as const;

function buildJuryFilterWhere(filters: JuryListFilters): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {};
  if (filters.q) where.orgName = { contains: filters.q };
  if (filters.bench) where.benchId = filters.bench;
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
      aiEvaluations: { orderBy: { createdAt: 'desc' as const }, take: 1 },
      juryScores: { include: { juror: true }, orderBy: { juror: { name: 'asc' } } },
    },
  });

  // average jury score is an aggregate across a variable number of juryScores rows, not a stored
  // column, so the bucket filter is applied in-memory rather than pushed into the Prisma where.
  if (!filters.score) return apps;
  const [min, max] = filters.score.split('-').map(Number);
  return apps.filter((a) => {
    if (a.juryScores.length === 0) return false;
    const avg = a.juryScores.reduce((sum, s) => sum + s.composite, 0) / a.juryScores.length;
    return avg >= min && avg <= max;
  });
}
