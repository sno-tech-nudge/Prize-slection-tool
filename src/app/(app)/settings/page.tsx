import Link from 'next/link';
import { AngularBanner, Card, Switch, Button } from '@/design-system';
import { getSettings } from '@/lib/settings';
import { updateSettingsAction } from '@/lib/settings-actions';
import { listUsers } from '@/lib/auth/session';
import { SupabaseSyncPanel } from '@/components/SupabaseSyncPanel';
import { UserRoleManager } from '@/components/UserRoleManager';

export default async function SettingsPage() {
  const [settings, users] = await Promise.all([getSettings(), listUsers()]);
  const supabaseConfigured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

  return (
    <div>
      <AngularBanner eyebrow="internal platform" title="settings" subtitle="the active data source and rejection email automation." />
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

        <form action={updateSettingsAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>rejection email automation</h2>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            when off (default), rejection emails queue in{' '}
            <Link href="/outreach" style={{ color: 'var(--delta-red)' }}>
              outreach
            </Link>{' '}
            for manual approval before anything sends. the active provider is configured via <code>EMAIL_PROVIDER</code>. see the README.
          </p>
          <Switch name="autoSendRejections" defaultChecked={settings.autoSendRejections} label="auto-approve and send rejection emails" />
        </Card>

        <Card>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>target wishlist</h2>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
            manage the ~100-startup wishlist and upload a replacement CSV from the{' '}
            <Link href="/targets" style={{ color: 'var(--delta-red)' }}>
              wishlist board
            </Link>
            .
          </p>
        </Card>

          <Button type="submit" variant="cta" size="lg" style={{ alignSelf: 'flex-start' }}>
            save settings
          </Button>
        </form>
      </div>
    </div>
  );
}
