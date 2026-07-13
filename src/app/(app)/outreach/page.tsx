import { AngularBanner } from '@/design-system';
import { OutboxTable } from '@/components/OutboxTable';
import { listOutbox } from '@/lib/mail/queries';
import { getCurrentUser } from '@/lib/auth/session';

export default async function OutreachPage({ searchParams }: { searchParams: { status?: string } }) {
  const [emails, user] = await Promise.all([listOutbox(searchParams.status), getCurrentUser()]);
  const canSend = user?.role === 'ADMIN';
  const queuedCount = emails.filter((e) => e.status === 'QUEUED').length;

  return (
    <div>
      <AngularBanner
        eyebrow="email automation"
        title="outreach"
        subtitle={`${queuedCount} email${queuedCount === 1 ? '' : 's'} waiting for approval, ${emails.length} total in this view.`}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
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
          }))}
          canSend={canSend}
        />
      </div>
    </div>
  );
}
