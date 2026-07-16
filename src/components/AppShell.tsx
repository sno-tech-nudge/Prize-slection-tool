'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Target, Inbox, Settings, type LucideIcon } from 'lucide-react';
import type { User } from '@prisma/client';
import { ROLE_LABEL, type UserRoleValue as UserRole } from '@/lib/constants';
import { Logo, Select, Badge } from '@/design-system';
import { switchUser } from '@/lib/auth/actions';
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
  { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'OBSERVER'] },
  { href: '/applications', label: 'applications', icon: FileText, roles: ['ADMIN', 'REVIEWER', 'OBSERVER'] },
  { href: '/outreach', label: 'outreach', icon: Inbox, roles: ['ADMIN'] },
  { href: '/targets', label: 'targets', icon: Target, roles: ['ADMIN', 'OBSERVER'] },
];

// reachable, but not counted among the 4 modules — admin-only configuration
const SETTINGS_ITEM: NavItem = { href: '/settings', label: 'settings', icon: Settings, roles: ['ADMIN'] };

// review, jury and analytics are deliberately off the nav for now — jury is getting its own
// dedicated view later; until then these routes still exist, just aren't linked here.

export function AppShell({
  user,
  users,
  children,
}: {
  user: User | null;
  users: User[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [...PRIMARY_NAV_ITEMS, SETTINGS_ITEM].filter((it) => !user || it.roles.includes(user.role as UserRole));

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
          {user && <Badge tone="outline">{ROLE_LABEL[user.role as UserRole]}</Badge>}
          <Select
            aria-label="switch role"
            value={user?.id ?? ''}
            style={{ minWidth: 220 }}
            onChange={async (e) => {
              await switchUser(e.target.value);
              router.refresh();
            }}
          >
            {users.length === 0 && <option value="">no users seeded yet</option>}
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {ROLE_LABEL[u.role as UserRole]}
              </option>
            ))}
          </Select>
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
        <span>internal platform · dev role switcher active</span>
      </footer>
    </div>
  );
}
