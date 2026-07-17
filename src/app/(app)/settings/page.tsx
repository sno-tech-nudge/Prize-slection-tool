import Link from 'next/link';
import { AngularBanner, Card, Input, Select, Switch, Button } from '@/design-system';
import { getSettings } from '@/lib/settings';
import { updateSettingsAction } from '@/lib/settings-actions';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS } from '@/lib/scoring/rubric';
import { getAutomationStats } from '@/lib/automation/actions';
import { listUsers } from '@/lib/auth/session';
import { AutomationPanel } from '@/components/AutomationPanel';
import { SupabaseSyncPanel } from '@/components/SupabaseSyncPanel';
import { UserRoleManager } from '@/components/UserRoleManager';

export default async function SettingsPage() {
  const [settings, automationStats, users] = await Promise.all([getSettings(), getAutomationStats(), listUsers()]);
  const supabaseConfigured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

  return (
    <div>
      <AngularBanner eyebrow="internal platform" title="settings" subtitle="rubric weights, pipeline configuration and the active data source." />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-lg)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <UserRoleManager users={users} />
        <SupabaseSyncPanel configured={supabaseConfigured} />
        <AutomationPanel stats={{ ...automationStats, autoSendRejections: settings.autoSendRejections }} />

        <form action={updateSettingsAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>rubric weights</h2>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
            the team&apos;s real selection rubric — 20 criteria across 4 sections, weighted 20/30/25/25 by default. raise a
            criterion&apos;s weight to make it count more toward the composite.
          </p>
          {RUBRIC_SECTIONS.map((section) => (
            <div key={section.key} style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                {section.label} · {section.weight}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {RUBRIC_CRITERIA.filter((c) => c.section === section.key).map((c) => (
                  <Input
                    key={c.key}
                    name={`weight_${c.key}`}
                    type="number"
                    min={0}
                    max={30}
                    step={0.1}
                    label={c.label}
                    defaultValue={settings.rubricWeights[c.key] ?? 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-5)' }}>pipeline configuration</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Input name="shortlistSize" type="number" min={1} label="shortlist size (N)" defaultValue={settings.shortlistSize} />
            <Select name="activeSource" label="active application source" defaultValue={settings.activeSource}>
              <option value="seed">seed (historical workbook import)</option>
              <option value="supabase">supabase (live rapid re.gen backend)</option>
              <option value="zoho_crm">zoho crm (stubbed, see README)</option>
              <option value="google_form">google form webhook (stubbed, see README)</option>
            </Select>
          </div>
        </Card>

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
