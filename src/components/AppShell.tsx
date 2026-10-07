'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Target, Inbox, Settings, LogOut, Gavel, BookOpen, type LucideIcon } from 'lucide-react';
import type { User } from '@prisma/client';
import { ROLE_LABEL, type UserRoleValue as UserRole } from '@/lib/constants';
import { Logo, Badge } from '@/design-system';
import { logoutAction } from '@/lib/auth/actions';
import { JobQueueTicker } from '@/components/JobQueueTicker';
import { SupabaseSyncTicker } from '@/components/SupabaseSyncTicker';
import { NotificationBell } from '@/components/NotificationBell';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  /** opens in a new browser tab instead of navigating this one — for the jury guide, so a juror
   *  can keep the guidelines open in one tab while scoring in another. */
  newTab?: boolean;
}

// the 4 core modules — the whole day-to-day workflow
const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'REVIEWER', 'OBSERVER'] },
  { href: '/applications', label: 'round 1', icon: FileText, roles: ['ADMIN', 'REVIEWER', 'OBSERVER', 'JURY'] },
  { href: '/jury-guide', label: 'jury guide', icon: BookOpen, roles: ['JURY'], newTab: true },
  { href: '/outreach', label: 'outreach', icon: Inbox, roles: ['ADMIN', 'REVIEWER'] },
  { href: '/targets', label: 'targets', icon: Target, roles: ['ADMIN', 'REVIEWER'] },
];

// internal oversight — every bench, every juror's individual score, for the team running the
// jury process. distinct from what a jury member sees on /applications (their own bench only,
// trimmed columns, blind until they submit). Reviewers get the identical full view admins do.
const ROUND_2_ITEM: NavItem = { href: '/applications/round-2', label: 'round 2', icon: Gavel, roles: ['ADMIN', 'REVIEWER'] };
const ROUND_3_ITEM: NavItem = { href: '/applications/round-3', label: 'round 3', icon: Gavel, roles: ['ADMIN', 'REVIEWER'] };

// reachable, but not counted among the 4 modules — admin-only configuration
const SETTINGS_ITEM: NavItem = { href: '/settings', label: 'settings', icon: Settings, roles: ['ADMIN'] };

export function AppShell({ user, children }: { user: User | null; children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [...PRIMARY_NAV_ITEMS, ROUND_2_ITEM, ROUND_3_ITEM, SETTINGS_ITEM].filter(
    (it) => !user || it.roles.includes(user.role as UserRole),
  );
  // /applications is also the prefix of /applications/round-2 and /round-3, so a plain startsWith
  // would highlight round 1 alongside them — the most specific (longest) matching href wins instead.
  const activeHref = navItems
    .filter((it) => pathname === it.href || pathname?.startsWith(`${it.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-6)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)' as unknown as number,
          gap: 'var(--space-4)',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexShrink: 0 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <Logo program="prize" size={24} />
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {navItems.map((it) => {
              const active = it.href === activeHref;
              // jurors only ever see their own bench here, not the round 1 pipeline, so it keeps its plain name
              const label = it.href === '/applications' && user?.role === 'JURY' ? 'applications' : it.label;
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  target={it.newTab ? '_blank' : undefined}
                  rel={it.newTab ? 'noopener noreferrer' : undefined}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    fontSize: 'var(--fs-caption)',
                    fontWeight: (active ? 'var(--fw-bold)' : 'var(--fw-semibold)') as unknown as number,
                    color: active ? 'var(--delta-red)' : 'var(--text-secondary)',
                    textTransform: 'lowercase',
                    textDecoration: 'none',
                    padding: '0 var(--space-1) var(--space-2)',
                    borderBottom: active ? '2px solid var(--delta-red)' : '2px solid transparent',
                  }}
                >
                  <Icon size={14} strokeWidth={2} strokeLinejoin="miter" strokeLinecap="square" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
          <SupabaseSyncTicker />
          <JobQueueTicker />
          {user && user.role !== 'OBSERVER' && <NotificationBell />}
          {user && (
            <>
              <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', flexShrink: 0 }} />
              <span
                title={user.name}
                style={{
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 140,
                }}
              >
                {user.name}
              </span>
              <Badge tone="outline">{ROLE_LABEL[user.role as UserRole]}</Badge>
              <form action={logoutAction} style={{ flexShrink: 0 }}>
                <button
                  type="submit"
                  aria-label="log out"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    whiteSpace: 'nowrap',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--fs-caption)',
                    fontFamily: 'var(--font-sans)',
                    padding: 0,
                  }}
                >
                  <LogOut size={14} strokeLinejoin="miter" strokeLinecap="square" />
                  log out
                </button>
              </form>
            </>
          )}
        </div>
      </header>

      <main style={{ flex: 1, width: '100%' }}>{children}</main>

      <footer
        className="no-print"
        style={{
          padding: 'var(--space-6) var(--space-8)',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: 'var(--fs-caption)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>the^delta prize · rapid re.gen challenge</span>
        <span>internal platform</span>
      </footer>
    </div>
  );
}
