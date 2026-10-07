import { redirect } from 'next/navigation';
import { AngularBanner, Card } from '@/design-system';
import { Round3Row } from '@/components/Round3Row';
import { RoundAnalyticsSection } from '@/components/RoundAnalyticsSection';
import { getCurrentUser } from '@/lib/auth/session';
import { listFieldVisitApplications } from '@/lib/benches/queries';

const HEADERS = ['organisation', 'round 2 score', 'round 3 decision'];

/** Round 3 (field visits) — tracking/view page only, no separate scoring mechanism of its own;
 *  scoped to applications that cleared round 2 (round2Decision: 'YES'). Same double-click-to-open
 *  table style as round 2's page. */
export default async function Round3Page() {
  const user = await getCurrentUser();
  if (user?.role === 'JURY') redirect('/applications');

  const applications = await listFieldVisitApplications();

  return (
    <div>
      <AngularBanner
        eyebrow="round 3 · rapid re.gen challenge"
        title="round 3"
        subtitle={`${applications.length} application${applications.length === 1 ? '' : 's'}`}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
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
                <Round3Row key={app.id} app={app} />
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
