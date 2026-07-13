import { AngularBanner, Card, Badge } from '@/design-system';
import { TargetCard } from '@/components/TargetCard';
import { TargetUploadForm } from '@/components/TargetUploadForm';
import { listTargets, getTargetStats } from '@/lib/targets/queries';
import { getCurrentUser } from '@/lib/auth/session';

export default async function TargetsPage({ searchParams }: { searchParams: { status?: string } }) {
  const [targets, stats, user] = await Promise.all([listTargets(searchParams.status), getTargetStats(), getCurrentUser()]);
  const canManage = user?.role === 'ADMIN';
  const statusFilters = ['', 'NOT_APPLIED', 'APPLIED', 'CONTACTED'];

  return (
    <div>
      <AngularBanner
        eyebrow="target-startup matching"
        title="the wishlist board"
        subtitle={`${stats.applied} of ${stats.total} target startups have applied so far.`}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {statusFilters.map((s) => (
              <a
                key={s || 'all'}
                href={s ? `/targets?status=${s}` : '/targets'}
                style={{ textDecoration: 'none' }}
              >
                <Badge tone={searchParams.status === s || (!searchParams.status && !s) ? 'red' : 'outline'}>
                  {s ? s.replace('_', ' ').toLowerCase() : 'all'}
                </Badge>
              </a>
            ))}
          </div>
          {canManage && <TargetUploadForm />}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {targets.map((t) => (
            <TargetCard
              key={t.id}
              target={{
                id: t.id,
                name: t.name,
                website: t.website,
                notes: t.notes,
                status: t.status,
                matchConfidence: t.matchConfidence,
                applications: t.applications,
                canManage,
              }}
            />
          ))}
          {targets.length === 0 && (
            <Card>
              <p style={{ color: 'var(--text-secondary)' }}>no targets match this filter.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
