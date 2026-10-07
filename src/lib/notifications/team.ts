import { prisma } from '@/lib/db';

/** Tells everyone on the review team (admins and reviewers) that something happened on an
 *  application — a round move, a mail going out — except the person who did it. Failing to write
 *  a notification must never fail the action that triggered it, so errors are logged, not thrown. */
export async function notifyTeam({ actorId, applicationId, message }: { actorId: string; applicationId: string; message: string }) {
  try {
    const recipients = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'REVIEWER'] }, id: { not: actorId } },
      select: { id: true },
    });
    if (recipients.length === 0) return;
    await prisma.notification.createMany({
      data: recipients.map((r) => ({ userId: r.id, applicationId, message })),
    });
  } catch (error) {
    console.error('notifyTeam failed', error);
  }
}
