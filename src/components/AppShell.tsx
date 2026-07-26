'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Target, Inbox, Settings, LogOut, Gavel, type LucideIcon } from 'lucide-react';
import type { User } from '@prisma/client';
import { ROLE_LABEL, type UserRoleValue as UserRole } from '@/lib/constants';
import { Logo, Badge } from '@/design-system';
import { logoutAction } from '@/lib/auth/actions';
import { JobQueueTicker } from '@/components/JobQueueTicker';
import { SupabaseSyncTicker } from '@/components/SupabaseSyncTicker';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

// the 4 core modules — the whole day-to-day workflow
const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'REVIEWER', 'OBSERVER'] },
  { href: '/applications', label: 'applications', icon: FileText, roles: ['ADMIN', 'REVIEWER', 'OBSERVER', 'JURY'] },
  { href: '/outreach', label: 'outreach', icon: Inbox, roles: ['ADMIN', 'REVIEWER'] },
  { href: '/targets', label: 'targets', icon: Target, roles: ['ADMIN', 'REVIEWER', 'OBSERVER'] },
];

// internal oversight — every bench, every juror's individual score, for the team running the
// jury process. distinct from what a jury member sees on /applications (their own bench only,
// trimmed columns, blind until they submit).
const JURY_OVERSIGHT_ITEM: NavItem = { href: '/jury', label: 'jury', icon: Gavel, roles: ['ADMIN'] };

// reachable, but not counted among the 4 modules — admin-only configuration
const SETTINGS_ITEM: NavItem = { href: '/settings', label: 'settings', icon: Settings, roles: ['ADMIN'] };

export function AppShell({ user, children }: { user: User | null; children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [...PRIMARY_NAV_ITEMS, JURY_OVERSIGHT_ITEM, SETTINGS_ITEM].filter((it) => !user || it.roles.includes(user.role as UserRole));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-8)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)' as unknown as number,
          gap: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-10)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Logo program="prize" size={26} />
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            {navItems.map((it) => {
              const active = pathname?.startsWith(it.href);
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--fs-small)',
                    fontWeight: (active ? 'var(--fw-bold)' : 'var(--fw-semibold)') as unknown as number,
                    color: active ? 'var(--delta-red)' : 'var(--text-secondary)',
                    textTransform: 'lowercase',
                    textDecoration: 'none',
                    padding: '0 var(--space-1) var(--space-2)',
                    borderBottom: active ? '2px solid var(--delta-red)' : '2px solid transparent',
                  }}
                >
                  <Icon size={16} strokeWidth={2} strokeLinejoin="miter" strokeLinecap="square" />
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <SupabaseSyncTicker />
          <JobQueueTicker />
          {user && (
            <>
              <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{user.name}</span>
              <Badge tone="outline">{ROLE_LABEL[user.role as UserRole]}</Badge>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="log out"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--fs-small)',
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
