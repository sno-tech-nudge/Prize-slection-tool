'use client';
import React from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/lib/notifications/actions';

interface NotificationItem {
  id: string;
  applicationId: string;
  orgName: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30_000;

/** Top-nav bell — polls for unread @mention notifications and shows them in a dropdown. Clicking
 *  a notification marks just that one read and navigates to the application; "mark all as read"
 *  clears the badge without navigating. */
export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(async () => {
    const res = await fetch('/api/notifications');
    if (!res.ok) return;
    const data = await res.json();
    setUnreadCount(data.unreadCount);
    setNotifications(data.notifications);
  }, []);

  React.useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  React.useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open) await refresh();
  }

  async function handleClickNotification(n: NotificationItem) {
    if (!n.read) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      const formData = new FormData();
      formData.set('id', n.id);
      await markNotificationReadAction(formData);
    }
    setOpen(false);
  }

  async function handleMarkAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsReadAction();
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="notifications"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: 'var(--space-1)',
        }}
      >
        <Bell size={18} strokeLinejoin="miter" strokeLinecap="square" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              minWidth: 15,
              height: 15,
              padding: '0 var(--space-1)',
              background: 'var(--delta-red)',
              color: 'var(--surface-card)',
              fontSize: 10,
              fontWeight: 'var(--fw-bold)' as unknown as number,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 'var(--space-2)',
            width: 320,
            maxHeight: 400,
            overflowY: 'auto',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 'var(--z-modal)' as unknown as number,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-3)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <strong style={{ fontSize: 'var(--fs-small)' }}>notifications</strong>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--delta-red)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  padding: 0,
                }}
              >
                mark all as read
              </button>
            )}
          </div>
          {notifications.length === 0 && (
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', padding: 'var(--space-4)' }}>no notifications yet.</p>
          )}
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={`/applications/${n.applicationId}`}
              onClick={() => handleClickNotification(n)}
              style={{
                display: 'block',
                padding: 'var(--space-3)',
                borderBottom: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                background: n.read ? 'none' : 'var(--surface-canvas)',
              }}
            >
              <p style={{ fontSize: 'var(--fs-small)', margin: 0 }}>{n.message}</p>
              <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString('en-GB')}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
