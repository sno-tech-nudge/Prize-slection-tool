import { Suspense } from 'react';
import { AngularBanner, Card } from '@/design-system';
import { ApplicationFilters } from '@/components/ApplicationFilters';
import { ApplicationRow } from '@/components/ApplicationRow';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { getCurrentUser } from '@/lib/auth/session';
import { listApplications } from '@/lib/applications/queries';

const HEADERS = ['organisation', 'review status', 'decision status', 'operating model', 'farmers reached', 'states', 'eligibility', 'AI composite', 'reviewer'];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: { stage?: string; category?: string; q?: string; internal?: string };
}) {
  const user = await getCurrentUser();
  const applications = await listApplications(searchParams, user);
  const canManage = user?.role === 'ADMIN';

  return (
    <div>
      <AngularBanner
        eyebrow="the^delta prize · rapid re.gen challenge"
        title="applications"
        subtitle={`${applications.length} application${applications.length === 1 ? '' : 's'}`}
        action={<ExportCsvButton searchParams={searchParams} />}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <Suspense>
          <ApplicationFilters />
        </Suspense>

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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <ApplicationRow key={app.id} app={app} canManage={canManage} />
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={HEADERS.length} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    no applications match these filters.
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
