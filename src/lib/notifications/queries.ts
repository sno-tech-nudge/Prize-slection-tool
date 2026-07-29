import { prisma } from '@/lib/db';

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { application: { select: { orgName: true } } },
  });
}
