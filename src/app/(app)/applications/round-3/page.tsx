import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AngularBanner, Card } from '@/design-system';
import { ApplicationFilters } from '@/components/ApplicationFilters';
import { ApplicationRow } from '@/components/ApplicationRow';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { RoundAnalyticsSection } from '@/components/RoundAnalyticsSection';
import { getCurrentUser } from '@/lib/auth/session';
import { listApplications, getApplicationFilterOptions, type ApplicationListFilters } from '@/lib/applications/queries';
import { computeHumanComposite } from '@/lib/applications/reviewStatus';

const HEADERS = [
  'organisation',
  'registration type',
  'application status',
  'round 1 score',
  'internal reviewer',
  'round 2 score',
  'bench',
  'pdf',
];

/** Same shape as the round 2 tracking page — list, analytics, export — scoped to round 2's
 *  yes-decided applications. Tracking/view only: round 3 has no separate scoring mechanism of its
 *  own, decisions here are made the same way (RoundDecisionButtons on the detail page) as every
 *  other round. */
export default async function Round3Page({ searchParams }: { searchParams: ApplicationListFilters }) {
  const user = await getCurrentUser();
  if (user?.role === 'JURY') redirect('/applications');

  const scopedParams: ApplicationListFilters = { ...searchParams, round: '3' };
  const [unsortedApplications, filterOptions] = await Promise.all([
    listApplications(scopedParams, user),
    getApplicationFilterOptions(),
  ]);

  const applications =
    searchParams.sort === 'score_desc' || searchParams.sort === 'score_asc'
      ? [...unsortedApplications].sort((a, b) => {
          const scoreA = computeHumanComposite(a);
          const scoreB = computeHumanComposite(b);
          if (scoreA === null && scoreB === null) return 0;
          if (scoreA === null) return 1;
          if (scoreB === null) return -1;
          return searchParams.sort === 'score_desc' ? scoreB - scoreA : scoreA - scoreB;
        })
      : unsortedApplications;

  return (
    <div>
      <AngularBanner
        eyebrow="round 3 · rapid re.gen challenge"
        title="round 3"
        subtitle={`${applications.length} application${applications.length === 1 ? '' : 's'}`}
        action={<ExportCsvButton searchParams={{ ...searchParams, round: '3' }} />}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Suspense>
          <ApplicationFilters options={filterOptions} isAdmin={user?.role === 'ADMIN'} />
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
                <ApplicationRow key={app.id} app={app} />
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={HEADERS.length} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    no applications marked &ldquo;decision: yes&rdquo; in round 2 yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <RoundAnalyticsSection where={{ round2Decision: 'YES' }} />
      </div>
    </div>
  );
}
