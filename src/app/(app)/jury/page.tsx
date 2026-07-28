import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AngularBanner, Card } from '@/design-system';
import { InternalJuryRow } from '@/components/InternalJuryRow';
import { JuryListFilters } from '@/components/JuryListFilters';
import { getCurrentUser } from '@/lib/auth/session';
import { listJuryOversight } from '@/lib/benches/queries';
import { getApplicationFilterOptions, type ApplicationListFilters } from '@/lib/applications/queries';

const HEADERS = ['organisation', 'bench', 'state', 'int score', 'avg jury score'];

/** Internal team's jury dashboard — deliberately the same trimmed table + double-click-to-open
 *  view a jury member sees on their own applications list, just scoped to every bench instead of
 *  one, alphabetical, and kept to 5 columns — the per-juror breakdown lives on the detail page. */
export default async function JuryOversightPage({ searchParams }: { searchParams: ApplicationListFilters }) {
  const user = await getCurrentUser();
  if (user?.role === 'JURY') redirect('/applications');

  const [applications, filterOptions] = await Promise.all([
    listJuryOversight({ q: searchParams.q, state: searchParams.state, operatingModel: searchParams.operatingModel }),
    getApplicationFilterOptions(),
  ]);

  return (
    <div>
      <AngularBanner
        eyebrow="jury oversight · rapid re.gen challenge"
        title="jury"
        subtitle={`${applications.length} shortlisted application${applications.length === 1 ? '' : 's'} across all benches, alphabetical — double-click a row to open it`}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <Suspense>
          <JuryListFilters states={filterOptions.states} operatingModels={filterOptions.operatingModels} />
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
                <InternalJuryRow key={app.id} app={app} />
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={HEADERS.length} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    no applications marked &ldquo;decision: yes&rdquo; yet.
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
