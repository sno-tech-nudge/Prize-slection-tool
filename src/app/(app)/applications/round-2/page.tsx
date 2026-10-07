import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Download } from 'lucide-react';
import { AngularBanner, Card, Button } from '@/design-system';
import { InternalJuryRow } from '@/components/InternalJuryRow';
import { JuryListFilters } from '@/components/JuryListFilters';
import { RoundAnalyticsSection } from '@/components/RoundAnalyticsSection';
import { JuryRubricSidePanel } from '@/components/JuryRubricSidePanel';
import { getCurrentUser } from '@/lib/auth/session';
import { listJuryOversight, listBenches } from '@/lib/benches/queries';
import type { ApplicationListFilters } from '@/lib/applications/queries';

/** Internal team's round 2 (jury) tracking page — deliberately the same trimmed table +
 *  double-click-to-open view a jury member sees on their own applications list, just scoped to
 *  every bench instead of one, alphabetical — plus one column per juror (j1, j2, …) so progress
 *  is visible without opening each application. */
export default async function Round2Page({ searchParams }: { searchParams: ApplicationListFilters }) {
  const user = await getCurrentUser();
  if (user?.role === 'JURY') redirect('/applications');

  const [applications, benches] = await Promise.all([
    listJuryOversight({
      q: searchParams.q,
      bench: searchParams.bench,
      intScore: searchParams.intScore,
      score: searchParams.score,
      sort: searchParams.sort,
    }),
    listBenches(),
  ]);

  // one column per juror seat on the largest bench, not per submitted score — so J2/J3 still show
  // as empty until that juror scores, instead of the columns only appearing once someone has.
  const jurorColumnCount = applications.reduce((max, a) => Math.max(max, a.bench?.jurors.length ?? 0), 0);
  const jurorHeaders = Array.from({ length: jurorColumnCount }, (_, i) => `j${i + 1}`);
  const headers = ['organisation', 'bench', 'int score', ...jurorHeaders, 'avg jury score', 'jury verdict', 'round 2 decision'];

  return (
    <div>
      <AngularBanner
        eyebrow="round 2 · rapid re.gen challenge"
        title="round 2"
        subtitle={`${applications.length} application${applications.length === 1 ? '' : 's'} across all benches, alphabetical — double-click a row to open it`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <JuryRubricSidePanel />
            <a href="/api/applications/round-2/export" style={{ textDecoration: 'none' }}>
              <Button variant="secondary">
                <Download size={14} strokeLinejoin="miter" strokeLinecap="square" style={{ marginRight: 'var(--space-2)' }} />
                download jury scoring
              </Button>
            </a>
          </div>
        }
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Suspense>
          <JuryListFilters benches={benches.map((b) => ({ id: b.id, name: b.name }))} />
        </Suspense>

        <Card padding="0" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                {headers.map((h) => (
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
                <InternalJuryRow key={app.id} app={app} jurorColumnCount={jurorColumnCount} />
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={headers.length} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    no applications marked &ldquo;decision: yes&rdquo; yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <RoundAnalyticsSection where={{ round1Decision: 'YES' }} />
      </div>
    </div>
  );
}
