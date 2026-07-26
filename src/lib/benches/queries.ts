import { prisma } from '@/lib/db';

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
    include: { bench: true },
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
export async function listJuryOversight() {
  return prisma.application.findMany({
    where: { isDuplicateOf: null, internalDecision: 'YES' },
    orderBy: [{ bench: { name: 'asc' } }, { orgName: 'asc' }],
    include: {
      bench: true,
      aiEvaluations: { orderBy: { createdAt: 'desc' as const }, take: 1 },
      juryScores: { include: { juror: true }, orderBy: { juror: { name: 'asc' } } },
    },
  });
}
