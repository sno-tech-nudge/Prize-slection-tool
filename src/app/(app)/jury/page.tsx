import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AngularBanner, Card, Badge } from '@/design-system';
import { CompositeBadge } from '@/components/StatusBadges';
import { OrgTitle } from '@/components/OrgTitle';
import { getCurrentUser } from '@/lib/auth/session';
import { listJuryOversight } from '@/lib/benches/queries';

const HEADERS = ['organisation', 'int score', 'jury score', 'bench', 'j1', 'j2', 'j3'];

function JurorCell({ score }: { score?: { composite: number; verdict: string; juror: { name: string } } }) {
  if (!score) return <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>;
  return (
    <div style={{ fontSize: 'var(--fs-small)' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>{score.juror.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <CompositeBadge score={score.composite} />
        <Badge tone="outline">{score.verdict.toLowerCase()}</Badge>
      </div>
    </div>
  );
}

// jury is only ever meant to see their own bench's trimmed applications view — this internal
// oversight table (every bench, every juror's individual score) is for admins/reviewers, so a
// JURY-role visitor gets sent to their real view instead.
export default async function JuryOversightPage() {
  const user = await getCurrentUser();
  if (user?.role === 'JURY') redirect('/applications');

  const applications = await listJuryOversight();

  return (
    <div>
      <AngularBanner
        eyebrow="internal platform · jury oversight"
        title="jury"
        subtitle={`${applications.length} shortlisted application${applications.length === 1 ? '' : 's'} across all benches`}
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
              {applications.map((app) => {
                const intScore = app.aiEvaluations[0]?.composite;
                const juryComposite =
                  app.juryScores.length > 0
                    ? Math.round(app.juryScores.reduce((sum, s) => sum + s.composite, 0) / app.juryScores.length)
                    : null;
                return (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Link href={`/applications/${app.id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                        <OrgTitle>{app.orgName}</OrgTitle>
                      </Link>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {intScore !== undefined ? <CompositeBadge score={intScore} /> : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {juryComposite !== null ? <CompositeBadge score={juryComposite} /> : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>not scored</span>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{app.bench?.name ?? '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <JurorCell score={app.juryScores[0]} />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <JurorCell score={app.juryScores[1]} />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      {app.juryScores.length > 3 ? (
                        <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>+{app.juryScores.length - 2} more</span>
                      ) : (
                        <JurorCell score={app.juryScores[2]} />
                      )}
                    </td>
                  </tr>
                );
              })}
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
