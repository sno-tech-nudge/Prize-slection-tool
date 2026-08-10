import Link from 'next/link';
import { AngularBanner, Card } from '@/design-system';
import { listUsers } from '@/lib/auth/session';
import { SupabaseSyncPanel } from '@/components/SupabaseSyncPanel';
import { UserRoleManager } from '@/components/UserRoleManager';
import { AutomationPanel } from '@/components/AutomationPanel';
import { getAutomationStats } from '@/lib/automation/actions';

export default async function SettingsPage() {
  const [allUsers, automationStats] = await Promise.all([listUsers(), getAutomationStats()]);
  // jury members are managed on the benches page, not here — showing them in both places invited
  // editing the same person's login from two different forms.
  const users = allUsers.filter((u) => u.role !== 'JURY');
  const supabaseConfigured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

  return (
    <div>
      <AngularBanner eyebrow="internal platform" title="settings" subtitle="team, roles, jury benches, and the active data source." />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-lg)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <UserRoleManager users={users} />

        <Card>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>jury benches</h2>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            manage jury panels — add jury members with real logins, and place shortlisted companies onto benches.
          </p>
          <Link href="/settings/benches" style={{ color: 'var(--delta-red)', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
            manage benches →
          </Link>
        </Card>

        <SupabaseSyncPanel configured={supabaseConfigured} />

        <AutomationPanel stats={automationStats} />
      </div>
    </div>
  );
}
