import { Suspense } from 'react';
import { ClipboardList } from 'lucide-react';
import { AngularBanner, Card } from '@/design-system';
import { ApplicationFilters } from '@/components/ApplicationFilters';
import { ApplicationRow } from '@/components/ApplicationRow';
import { JuryApplicationRow } from '@/components/JuryApplicationRow';
import { JuryApplicationFilters } from '@/components/JuryApplicationFilters';
import { ObserverApplicationRow } from '@/components/ObserverApplicationRow';
import { ObserverApplicationFilters } from '@/components/ObserverApplicationFilters';
import { ExportCsvButton } from '@/components/ExportCsvButton';
import { RubricSidePanel } from '@/components/RubricSidePanel';
import { InfoSidePanel } from '@/components/InfoSidePanel';
import { SampleScorecard } from '@/components/SampleScorecard';
import { LiveRefreshTicker } from '@/components/LiveRefreshTicker';
import { getCurrentUser } from '@/lib/auth/session';
import { listApplications, listJuryApplications, getApplicationFilterOptions, type ApplicationListFilters } from '@/lib/applications/queries';
import { computeHumanComposite } from '@/lib/applications/reviewStatus';
import { ensureOrgSynopsisQueued } from '@/lib/synopsis/ensure';

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

const JURY_HEADERS = ['organisation', 'scoring status', 'total score', 'bench decision', ''];

// observer now also sees review status, decision status, and score (all read-only) alongside the
// identifying/operational fields — reviewer and eligibility are still left out, internal working
// detail rather than something requested for this view.
const OBSERVER_HEADERS = ['organisation', 'registration type', 'review status', 'decision status', 'operating model', 'states', 'score'];

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
    const unsortedJuryApplications = await listJuryApplications(user, {
      q: searchParams.q,
      scored: searchParams.scored,
    });
    // score is per-juror-scoped in the query above (at most one juryScores entry — this juror's
    // own), so sorting on it is a plain in-memory sort rather than needing an aggregate.
    const juryApplications =
      searchParams.sort === 'score_desc' || searchParams.sort === 'score_asc'
        ? [...unsortedJuryApplications].sort((a, b) => {
            const scoreA = a.juryScores[0]?.composite ?? null;
            const scoreB = b.juryScores[0]?.composite ?? null;
            if (scoreA === null && scoreB === null) return 0;
            if (scoreA === null) return 1;
            if (scoreB === null) return -1;
            return searchParams.sort === 'score_desc' ? scoreB - scoreA : scoreA - scoreB;
          })
        : unsortedJuryApplications;

    // backfills any missing synopsis before the juror even opens an application — every
    // application on this list is already internalDecision: YES (that's the visibility gate), so
    // there's no per-app check to make here, just queue whatever's missing.
    await Promise.all(juryApplications.map((a) => ensureOrgSynopsisQueued(a)));

    return (
      <div>
        <AngularBanner
          eyebrow="jury review · rapid re.gen challenge"
          title="applications"
          subtitle={`${juryApplications.length} application${juryApplications.length === 1 ? '' : 's'} on your bench`}
          action={
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <InfoSidePanel
                triggerLabel="sample scorecard"
                icon={<ClipboardList size={14} strokeLinejoin="miter" strokeLinecap="square" />}
                title="sample scorecard"
              >
                <SampleScorecard />
              </InfoSidePanel>
            </div>
          }
        />
        <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
          <Suspense>
            <JuryApplicationFilters />
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
                      {searchParams.q || searchParams.scored ? 'no applications match these filters.' : 'no applications on your bench yet.'}
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
    await Promise.all(observerApplications.filter((a) => a.internalDecision === 'YES').map((a) => ensureOrgSynopsisQueued(a)));
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

  const [unsortedApplications, filterOptions] = await Promise.all([listApplications(searchParams, user), getApplicationFilterOptions()]);

  // score is a computed average across HumanReview rows, not a plain column, so sorting by it
  // happens here rather than as a database ORDER BY. Unscored applications always sink to the
  // bottom regardless of direction — there's no meaningful place to rank "no score yet" among
  // real numbers.
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

  // sweeps every YES-decided application on the admin/reviewer list too, so coverage isn't left
  // depending on jury/observer happening to browse first.
  await Promise.all(applications.filter((a) => a.internalDecision === 'YES').map((a) => ensureOrgSynopsisQueued(a)));

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
