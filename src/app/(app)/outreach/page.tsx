import { AngularBanner, Badge } from '@/design-system';
import { OutboxTable } from '@/components/OutboxTable';
import { EmailTemplateEditor } from '@/components/EmailTemplateEditor';
import { OutreachApplicationsTable } from '@/components/OutreachApplicationsTable';
import { listOutbox } from '@/lib/mail/queries';
import { listApplicationsForOutreach } from '@/lib/applications/queries';
import { getSettings } from '@/lib/settings';
import { getCurrentUser } from '@/lib/auth/session';
import { LiveRefreshTicker } from '@/components/LiveRefreshTicker';

const DECISION_FILTERS = ['', 'YES', 'NO', 'ECOSYSTEM_PARTNER', 'UNDECIDED'];
const DECISION_FILTER_LABEL: Record<string, string> = {
  YES: 'decision: yes',
  NO: 'decision: no',
  ECOSYSTEM_PARTNER: 'potential ecosystem partner',
  UNDECIDED: 'decision: undecided',
};

export default async function OutreachPage({ searchParams }: { searchParams: { status?: string; internal?: string } }) {
  const [emails, applications, settings, user] = await Promise.all([
    listOutbox(searchParams.status),
    listApplicationsForOutreach(searchParams.internal),
    getSettings(),
    getCurrentUser(),
  ]);
  const canSend = user?.role === 'ADMIN';
  const queuedCount = emails.filter((e) => e.status === 'QUEUED').length;

  return (
    <div>
      <LiveRefreshTicker intervalMs={8000} />
      <AngularBanner
        eyebrow="email automation"
        title="outreach"
        subtitle={`${applications.length} application${applications.length === 1 ? '' : 's'} in this view · ${queuedCount} email${queuedCount === 1 ? '' : 's'} waiting for approval below.`}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <EmailTemplateEditor
          templates={{
            acceptance: settings.emailTemplateAcceptance,
            rejection: settings.emailTemplateRejection,
            query: settings.emailTemplateQuery,
          }}
          canManage={canSend}
        />

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          {DECISION_FILTERS.map((d) => (
            <a key={d || 'all'} href={d ? `/outreach?internal=${d}` : '/outreach'} style={{ textDecoration: 'none' }}>
              <Badge tone={searchParams.internal === d || (!searchParams.internal && !d) ? 'red' : 'outline'}>
                {d ? DECISION_FILTER_LABEL[d] : 'all applications'}
              </Badge>
            </a>
          ))}
        </div>

        <div style={{ marginBottom: 'var(--space-8)' }}>
          <OutreachApplicationsTable
            applications={applications.map((a) => ({
              id: a.id,
              orgName: a.orgName,
              pocFirstName: a.pocFirstName,
              pocLastName: a.pocLastName,
              email: a.email,
              internalDecision: a.internalDecision,
              outboxEmails: a.outboxEmails.map((e) => ({ template: e.template, status: e.status })),
            }))}
            canSend={canSend}
          />
        </div>

        <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-4)' }}>queued &amp; sent emails</h2>
        <OutboxTable
          emails={emails.map((e) => ({
            id: e.id,
            orgName: e.application.orgName,
            to: e.to,
            subject: e.subject,
            body: e.body,
            template: e.template,
            status: e.status,
            createdAt: e.createdAt.toISOString(),
            sentAt: e.sentAt ? e.sentAt.toISOString() : null,
            provider: e.provider,
          }))}
          canSend={canSend}
        />
      </div>
    </div>
  );
}
