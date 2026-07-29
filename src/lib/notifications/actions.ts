'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

/** Users mentioned with an "@Full Name" in a comment (matched against the real team roster,
 *  same rule the comment thread UI uses to highlight/autocomplete mentions) each get one
 *  notification — never the comment's own author, and never the same person twice even if
 *  mentioned more than once in the same comment. */
export async function notifyMentionedUsers({
  applicationId,
  orgName,
  authorId,
  authorName,
  body,
}: {
  applicationId: string;
  orgName: string;
  authorId: string;
  authorName: string;
  body: string;
}) {
  const candidates = await prisma.user.findMany({ select: { id: true, name: true } });
  const mentionedIds = new Set<string>();
  for (const candidate of candidates) {
    if (candidate.id === authorId) continue;
    const pattern = new RegExp(`@${candidate.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\w)`);
    if (pattern.test(body)) mentionedIds.add(candidate.id);
  }
  if (mentionedIds.size === 0) return;

  await prisma.notification.createMany({
    data: [...mentionedIds].map((userId) => ({
      userId,
      applicationId,
      message: `${authorName} mentioned you on ${orgName}`,
    })),
  });
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get('id'));
  await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
}
