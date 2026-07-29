import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listNotifications, getUnreadNotificationCount } from '@/lib/notifications/queries';

/** Polled by the bell icon in the nav — returns the signed-in user's recent notifications plus
 *  their unread count. GET only; marking read happens via the markNotificationReadAction /
 *  markAllNotificationsReadAction server actions the bell calls directly. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([listNotifications(user.id), getUnreadNotificationCount(user.id)]);

  return NextResponse.json({
    unreadCount,
    notifications: notifications.map((n) => ({
      id: n.id,
      applicationId: n.applicationId,
      orgName: n.application.orgName,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt,
    })),
  });
}
