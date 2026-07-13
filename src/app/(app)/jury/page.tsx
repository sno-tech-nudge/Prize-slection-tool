import Link from 'next/link';
import { AngularBanner, Card, Badge } from '@/design-system';
import { StageBadge, CompositeBadge, SolutionCategoryTag } from '@/components/StatusBadges';
import { OrgTitle } from '@/components/OrgTitle';
import { getCurrentUser } from '@/lib/auth/session';
import { listJuryQueue } from '@/lib/applications/queries';

export default async function JuryPage() {
  const [user, applications] = await Promise.all([getCurrentUser(), listJuryQueue()]);

  return (
    <div>
      <AngularBanner
        eyebrow="jury review · rapid re.gen challenge"
        title="jury console"
        subtitle="applications an admin has marked decision: yes, ready for your read."
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {applications.map((app) => {
            const myScore = app.juryScores.find((s) => s.jurorId === user?.id);
            const oneLiner = (app.aboutSolution ?? '').slice(0, 160);
            return (
              <Link key={app.id} href={`/jury/${app.id}`} style={{ textDecoration: 'none' }}>
                <Card accent style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3) var(--space-6)' }}>
                  <div style={{ flexGrow: 1, flexBasis: 200 }}>
                    <div style={{ fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-primary)' }}>
                      <OrgTitle>{app.orgName}</OrgTitle>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <StageBadge stage={app.stageStatus} />
                      <SolutionCategoryTag category={app.solutionCategory} />
                    </div>
                  </div>
                  <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', flexGrow: 2, flexBasis: 240, margin: 0 }}>
                    {oneLiner}
                    {oneLiner.length === 160 ? '…' : ''}
                  </p>
                  <div style={{ flexShrink: 0, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <div>small farmers: {app.smallMarginalFarmerPct ?? '—'}%</div>
                    <div>hectares: {app.areaHectaresRaw ?? '—'}</div>
                  </div>
                  {app.aiEvaluations[0] && <CompositeBadge score={app.aiEvaluations[0].composite} />}
                  {myScore ? <Badge tone="outline">you scored: {myScore.verdict.toLowerCase()}</Badge> : <Badge tone="yellow">awaiting your score</Badge>}
                </Card>
              </Link>
            );
          })}
          {applications.length === 0 && (
            <Card>
              <p style={{ color: 'var(--text-secondary)' }}>no applications have been marked &ldquo;decision: yes&rdquo; yet.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
