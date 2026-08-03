import { prisma } from '@/lib/db';

/** Sorted by most recent activity (whichever is newer, sentAt or createdAt) rather than plain
 *  creation date — a row that gets resent long after it was first queued (a retry, or a fresh
 *  render picking up a fix made since) needs to surface near the top where it's actually
 *  noticed, not sit wherever its original creation date happens to place it. */
export async function listOutbox(status?: string) {
  const rows = await prisma.outboxEmail.findMany({
    where: status ? { status } : undefined,
    include: { application: { select: { id: true, orgName: true } } },
  });
  return rows.sort((a, b) => {
    const aTime = Math.max(a.sentAt?.getTime() ?? 0, a.createdAt.getTime());
    const bTime = Math.max(b.sentAt?.getTime() ?? 0, b.createdAt.getTime());
    return bTime - aTime;
  });
}
