import { Suspense } from 'react';
import { AngularBanner, Card } from '@/design-system';
import { ApplicationFilters } from '@/components/ApplicationFilters';
import { ApplicationRow } from '@/components/ApplicationRow';
import { JuryApplicationRow } from '@/components/JuryApplicationRow';
import { ObserverApplicationRow } from '@/components/ObserverApplicationRow';
import { ObserverApplicationFilters } from '@/components/ObserverApplicationFilters';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { RubricSidePanel } from '@/components/RubricSidePanel';
import { LiveRefreshTicker } from '@/components/LiveRefreshTicker';
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
// company, where it operates, its operating model and registration type, and their own verdict
// — not the bench name or the internal/AI read. Kept to 5 columns on purpose.
const JURY_HEADERS = ['organisation', 'state', 'operating model', 'registration type', 'your score'];

// observer sees every field column except review status, decision status, reviewer, eligibility,
// and score — purely identifying/operational fields, no scoring of any kind.
const OBSERVER_HEADERS = ['organisation', 'registration type', 'operating model', 'states'];

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
    const juryApplications = await listJuryApplications(user);
    return (
      <div>
        <AngularBanner
          eyebrow="jury review · rapid re.gen challenge"
          title="applications"
          subtitle={`${juryApplications.length} application${juryApplications.length === 1 ? '' : 's'} on your bench, alphabetical — double-click a row to open it`}
        />
        <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
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

  if (user?.role === 'OBSERVER') {
    const observerApplications = await listApplications(searchParams, user);
    return (
      <div>
        <AngularBanner
          eyebrow="observer view · rapid re.gen challenge"
          title="applications"
          subtitle={`${observerApplications.length} application${observerApplications.length === 1 ? '' : 's'}`}
        />
        <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
          <Suspense>
            <ObserverApplicationFilters />
          </Suspense>

          <Card padding="0" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  {OBSERVER_HEADERS.map((h) => (
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
                {observerApplications.map((app) => (
                  <ObserverApplicationRow key={app.id} app={app} queryString={rowQueryString} />
                ))}
                {observerApplications.length === 0 && (
                  <tr>
                    <td colSpan={OBSERVER_HEADERS.length} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
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

  const [applications, filterOptions] = await Promise.all([listApplications(searchParams, user), getApplicationFilterOptions()]);

  return (
    <div>
      <LiveRefreshTicker />
      <AngularBanner
        eyebrow="the^delta prize · rapid re.gen challenge"
        title="applications"
        subtitle={`${applications.length} application${applications.length === 1 ? '' : 's'}`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <RubricSidePanel />
            <ExportCsvButton searchParams={searchParams} />
            <ExportCsvButton searchParams={searchParams} mine />
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
                <ApplicationRow key={app.id} app={app} queryString={rowQueryString} />
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
