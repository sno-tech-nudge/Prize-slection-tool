import Link from 'next/link';
import { AngularBanner, Card, Badge } from '@/design-system';
import { StageBadge, CompositeBadge } from '@/components/StatusBadges';
import { OrgTitle } from '@/components/OrgTitle';
import { getCurrentUser } from '@/lib/auth/session';
import { listReviewQueue } from '@/lib/applications/queries';

export default async function ReviewQueuePage() {
  const user = await getCurrentUser();
  const queue = await listReviewQueue(user);
  const pending = queue.filter((a) => !a.humanReviews.some((r) => r.reviewerId === user?.id));
  const done = queue.filter((a) => a.humanReviews.some((r) => r.reviewerId === user?.id));

  return (
    <div>
      <AngularBanner
        eyebrow="reviewer console"
        title="your review queue"
        subtitle={`${pending.length} application${pending.length === 1 ? '' : 's'} waiting for your score${user?.role === 'ADMIN' ? ' (viewing all assignments as admin)' : ''}.`}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-lg)', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>needs your score</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-10)' }}>
          {pending.map((app) => (
            <Link key={app.id} href={`/review/${app.id}`} style={{ textDecoration: 'none' }}>
              <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-primary)' }}>
                    <OrgTitle>{app.orgName}</OrgTitle>
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                    {app.reviewAssignments.length} reviewer{app.reviewAssignments.length === 1 ? '' : 's'} assigned
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <StageBadge stage={app.stageStatus} />
                  {app.aiEvaluations[0] && <CompositeBadge score={app.aiEvaluations[0].composite} />}
                  <Badge tone="red">score now →</Badge>
                </div>
              </Card>
            </Link>
          ))}
          {pending.length === 0 && (
            <Card>
              <p style={{ color: 'var(--text-secondary)' }}>nothing is waiting for your score.</p>
            </Card>
          )}
        </div>

        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>already scored by you</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {done.map((app) => (
            <Link key={app.id} href={`/review/${app.id}`} style={{ textDecoration: 'none' }}>
              <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.75 }}>
                <div style={{ color: 'var(--text-primary)' }}>
                  <OrgTitle>{app.orgName}</OrgTitle>
                </div>
                <StageBadge stage={app.stageStatus} />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
