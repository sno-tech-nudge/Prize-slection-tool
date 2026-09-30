import type { Prisma } from '@prisma/client';
import { Card } from '@/design-system';
import { BarRow } from '@/components/BarRow';
import { PieChart } from '@/components/PieChart';
import { getReviewDecisionFunnel, getReviewerStats } from '@/lib/dashboard/queries';
import { getOperatingModelMix } from '@/lib/analytics/queries';

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
      <h2 style={{ fontSize: 'var(--fs-h4)' }}>{title}</h2>
    </div>
  );
}

/** Same dashboard-style analytics blocks (funnel, operating-model mix, reviewer stats) the main
 *  dashboard shows, reused here scoped to whichever subset of applications a round page passes
 *  in via `where` — rather than duplicating each query per round. */
export async function RoundAnalyticsSection({ where }: { where: Prisma.ApplicationWhereInput }) {
  const [funnel, operatingModelMix, reviewerStats] = await Promise.all([
    getReviewDecisionFunnel(where),
    getOperatingModelMix(where),
    getReviewerStats(where),
  ]);
  const funnelMax = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div style={{ borderTop: '2px solid var(--border-default)', paddingTop: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-6)' }}>analytics</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
        <Card accent>
          <SectionHeader title="pipeline funnel" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {funnel.map((f) => (
              <BarRow key={f.label} label={f.label} count={f.count} max={funnelMax} />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="reviewer stats" />
          {reviewerStats.length > 0 ? (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  fontSize: 'var(--fs-caption)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--ls-wide)',
                  color: 'var(--text-muted)',
                  paddingBottom: 'var(--space-2)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span>reviewer</span>
                <span style={{ textAlign: 'right' }}>reviewed / yet to review</span>
              </div>
              {reviewerStats.map((r) => (
                <div
                  key={r.name}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    alignItems: 'center',
                    fontSize: 'var(--fs-small)',
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: 'var(--space-3) 0',
                  }}
                >
                  <span>{r.name}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                    {r.reviewed} / {r.yetToReview}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no reviewers assigned yet.</p>
          )}
        </Card>
      </div>

      <Card accent>
        <SectionHeader title="operating model mix" />
        <PieChart data={operatingModelMix.map((c) => ({ label: c.category, count: c.count }))} />
      </Card>
    </div>
  );
}
