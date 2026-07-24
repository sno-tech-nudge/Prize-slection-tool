import { Suspense } from 'react';
import { AngularBanner, Card } from '@/design-system';
import { ApplicationFilters } from '@/components/ApplicationFilters';
import { ApplicationRow } from '@/components/ApplicationRow';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { RubricSidePanel } from '@/components/RubricSidePanel';
import { getCurrentUser } from '@/lib/auth/session';
import { listApplications, getApplicationFilterOptions, type ApplicationListFilters } from '@/lib/applications/queries';

const HEADERS = [
  'organisation',
  'registration type',
  'review status',
  'decision status',
  'operating model',
  'states',
  'eligibility',
  'score',
  'reviewer',
];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: ApplicationListFilters;
}) {
  const user = await getCurrentUser();
  const [applications, filterOptions] = await Promise.all([listApplications(searchParams, user), getApplicationFilterOptions()]);
  const canManage = user?.role === 'ADMIN';

  const rowParams = new URLSearchParams();
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) rowParams.set(key, value);
  });
  const rowQueryString = rowParams.toString() ? `?${rowParams.toString()}` : '';

  return (
    <div>
      <AngularBanner
        eyebrow="the^delta prize · rapid re.gen challenge"
        title="applications"
        subtitle={`${applications.length} application${applications.length === 1 ? '' : 's'}`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <RubricSidePanel />
            <ExportCsvButton searchParams={searchParams} />
          </div>
        }
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <Suspense>
          <ApplicationFilters options={filterOptions} />
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
                      minWidth: h === 'operating model' ? 260 : undefined,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <ApplicationRow key={app.id} app={app} canManage={canManage} queryString={rowQueryString} />
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
