import { redirect } from 'next/navigation';
import { AngularBanner, Card } from '@/design-system';
import { InternalJuryRow } from '@/components/InternalJuryRow';
import { getCurrentUser } from '@/lib/auth/session';
import { listJuryOversight } from '@/lib/benches/queries';

const HEADERS = ['organisation', 'bench', 'int score', 'jury scores', 'j1', 'j2', 'j3'];

/** Internal team's jury dashboard — deliberately the same trimmed table + double-click-to-open
 *  view a jury member sees on their own applications list, just scoped to every bench instead of
 *  one, and showing how many jurors have scored (with the average) instead of "your score". */
export default async function JuryOversightPage() {
  const user = await getCurrentUser();
  if (user?.role === 'JURY') redirect('/applications');

  const applications = await listJuryOversight();

  return (
    <div>
      <AngularBanner
        eyebrow="jury oversight · rapid re.gen challenge"
        title="jury"
        subtitle={`${applications.length} shortlisted application${applications.length === 1 ? '' : 's'} across all benches — double-click a row to open it`}
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
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
