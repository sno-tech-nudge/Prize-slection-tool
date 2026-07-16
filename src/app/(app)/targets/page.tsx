import { AngularBanner, Card, Badge } from '@/design-system';
import { TargetRow } from '@/components/TargetRow';
import { TargetUploadForm } from '@/components/TargetUploadForm';
import { listTargets, getTargetStats } from '@/lib/targets/queries';
import { getCurrentUser } from '@/lib/auth/session';

const HEADERS = [
  'organisation',
  'connect status',
  'prize relevance',
  'focus type',
  'org type',
  'key locations',
  'model',
  'poc contact',
  'match status',
];

export default async function TargetsPage({ searchParams }: { searchParams: { status?: string } }) {
  const [targets, stats, user] = await Promise.all([listTargets(searchParams.status), getTargetStats(), getCurrentUser()]);
  const canManage = user?.role === 'ADMIN';
  const statusFilters = ['', 'NOT_APPLIED', 'APPLIED', 'CONTACTED'];

  return (
    <div>
      <AngularBanner
        eyebrow="target-startup matching"
        title="the wishlist board"
        subtitle={`${stats.applied} of ${stats.total} target organisations have applied so far.`}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {statusFilters.map((s) => (
              <a key={s || 'all'} href={s ? `/targets?status=${s}` : '/targets'} style={{ textDecoration: 'none' }}>
                <Badge tone={searchParams.status === s || (!searchParams.status && !s) ? 'red' : 'outline'}>
                  {s ? s.replace('_', ' ').toLowerCase() : 'all'}
                </Badge>
              </a>
            ))}
          </div>
          {canManage && <TargetUploadForm />}
        </div>

        <Card padding="0" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      fontSize: 'var(--fs-caption)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--ls-wide)',
                      color: 'var(--text-secondary)',
                      minWidth: h === 'model' ? 260 : undefined,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <TargetRow key={t.id} target={t} />
              ))}
              {targets.length === 0 && (
                <tr>
                  <td colSpan={HEADERS.length} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    no targets match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
