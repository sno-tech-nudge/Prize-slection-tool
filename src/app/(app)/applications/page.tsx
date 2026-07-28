import { Suspense } from 'react';
import { AngularBanner, Card } from '@/design-system';
import { ApplicationFilters } from '@/components/ApplicationFilters';
import { ApplicationRow } from '@/components/ApplicationRow';
import { JuryApplicationRow } from '@/components/JuryApplicationRow';
import { JuryListFilters } from '@/components/JuryListFilters';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { RubricSidePanel } from '@/components/RubricSidePanel';
import { getCurrentUser } from '@/lib/auth/session';
import { listApplications, listJuryApplications, getApplicationFilterOptions, type ApplicationListFilters } from '@/lib/applications/queries';

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

// jury only ever sees their own bench's shortlisted applications, and only needs to know the
// company, which bench it's on, where it operates, the internal/AI read, and their own verdict
// — not the full admin operating picture. Kept to 5 columns on purpose.
const JURY_HEADERS = ['organisation', 'bench', 'state', 'int score', 'your score'];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: ApplicationListFilters;
}) {
  const user = await getCurrentUser();

  const rowParams = new URLSearchParams();
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) rowParams.set(key, value);
  });
  const rowQueryString = rowParams.toString() ? `?${rowParams.toString()}` : '';

  if (user?.role === 'JURY') {
    const [juryApplications, filterOptions] = await Promise.all([
      listJuryApplications(user, { q: searchParams.q, state: searchParams.state, operatingModel: searchParams.operatingModel }),
      getApplicationFilterOptions(),
    ]);
    return (
      <div>
        <AngularBanner
          eyebrow="jury review · rapid re.gen challenge"
          title="applications"
          subtitle={`${juryApplications.length} application${juryApplications.length === 1 ? '' : 's'} on your bench, alphabetical — double-click a row to open it`}
        />
        <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
          <Suspense>
            <JuryListFilters states={filterOptions.states} operatingModels={filterOptions.operatingModels} />
          </Suspense>

          <Card padding="0" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  {JURY_HEADERS.map((h) => (
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
                {juryApplications.map((app) => (
                  <JuryApplicationRow key={app.id} app={app} queryString={rowQueryString} />
                ))}
                {juryApplications.length === 0 && (
                  <tr>
                    <td colSpan={JURY_HEADERS.length} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      no applications on your bench yet.
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

  const [applications, filterOptions] = await Promise.all([listApplications(searchParams, user), getApplicationFilterOptions()]);
  const canManage = user?.role === 'ADMIN';

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
