import { prisma } from '@/lib/db';

export async function listOutbox(status?: string) {
  return prisma.outboxEmail.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { application: { select: { id: true, orgName: true } } },
  });
}
