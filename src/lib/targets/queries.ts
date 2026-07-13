import { prisma } from '@/lib/db';

export async function listTargets(status?: string) {
  return prisma.target.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: { applications: { select: { id: true, orgName: true, stageStatus: true } } },
  });
}

export async function getTargetStats() {
  const total = await prisma.target.count();
  const applied = await prisma.target.count({ where: { status: { in: ['APPLIED', 'CONTACTED'] } } });
  return { total, applied, notApplied: total - applied };
}

export async function listRecentMatches(limit = 5) {
  return prisma.target.findMany({
    where: { status: { in: ['APPLIED', 'CONTACTED'] } },
    orderBy: { matchConfidence: 'desc' },
    take: limit,
    include: { applications: { select: { id: true, orgName: true }, take: 1 } },
  });
}
