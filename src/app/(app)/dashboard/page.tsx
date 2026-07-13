import Link from 'next/link';
import { FileText, Layers, Trophy, Inbox, CheckCircle2, CircleAlert, type LucideIcon } from 'lucide-react';
import { AngularBanner, Card, Badge } from '@/design-system';
import { STAGE_STATUS_LABEL, type StageStatusValue } from '@/lib/constants';
import { getDashboardKpis, getRecentActivity, getDivergentApplications, getFlaggedApplications } from '@/lib/dashboard/queries';
import { listRecentMatches, getTargetStats } from '@/lib/targets/queries';
import { getFunnel, getOperatingModelMix, getCalibrationNote, getReviewerThroughput } from '@/lib/analytics/queries';
import { BarRow } from '@/components/BarRow';
import { OrgTitle } from '@/components/OrgTitle';

function Kpi({ label, value, icon: Icon }: { label: string; value: number | string; icon: LucideIcon }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-canvas)',
        }}
      >
        <Icon size={16} color="var(--delta-red)" strokeLinejoin="miter" strokeLinecap="square" />
      </div>
      <div>
        <div style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-primary)', lineHeight: 'var(--lh-tight)' }}>
          {value}
        </div>
        <div
          style={{
            fontSize: 'var(--fs-caption)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--ls-wide)',
            color: 'var(--text-muted)',
            marginTop: 'var(--space-1)',
          }}
        >
          {label}
        </div>
      </div>
    </Card>
  );
}

function SectionHeader({ title, action }: { title: string; action?: { href: string; label: string } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
      <h2 style={{ fontSize: 'var(--fs-h4)' }}>{title}</h2>
      {action && (
        <Link href={action.href} style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none', fontWeight: 'var(--fw-bold)' as unknown as number }}>
          {action.label} →
        </Link>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const [kpis, funnel, recentMatches, targetStats, activity, divergent, categoryMix, calibration, reviewerThroughput, flagged] = await Promise.all([
    getDashboardKpis(),
    getFunnel(),
    listRecentMatches(4),
    getTargetStats(),
    getRecentActivity(),
    getDivergentApplications(),
    getOperatingModelMix(),
    getCalibrationNote(),
    getReviewerThroughput(),
    getFlaggedApplications(),
  ]);
  const funnelMax = Math.max(...funnel.map((f) => f.count), 1);
  const categoryMax = Math.max(...categoryMix.map((c) => c.count), 1);

  return (
    <div>
      <AngularBanner
        eyebrow="internal platform"
        title="dashboard"
        subtitle="application pipeline status: screening, scoring, review, and jury."
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-5)' }}>
          <Kpi label="total applications" value={kpis.total} icon={FileText} />
          <Kpi label="decision: yes" value={kpis.internalYes} icon={CheckCircle2} />
          <Kpi label="shortlisted+" value={kpis.shortlisted} icon={Layers} />
          <Kpi label="winners" value={kpis.winners} icon={Trophy} />
          <Kpi label="outreach queued" value={kpis.queuedOutbox} icon={Inbox} />
          <Kpi label="flagged / ineligible" value={flagged.length} icon={CircleAlert} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          <Card accent>
            <SectionHeader title="pipeline funnel" action={{ href: '/analytics', label: 'full analytics' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {funnel.map((f) => (
                <BarRow key={f.stage} label={STAGE_STATUS_LABEL[f.stage as StageStatusValue]} count={f.count} max={funnelMax} />
              ))}
            </div>
          </Card>

          <Card accent>
            <SectionHeader title="operating model mix" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {categoryMix.map((c) => (
                <BarRow key={c.category} label={c.category} count={c.count} max={categoryMax} tone="ink" />
              ))}
              {categoryMix.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no applications yet.</p>}
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          <Card accent accentSide="left">
            <SectionHeader title="AI scoring accuracy" />
            {calibration ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <span style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--delta-red)' }}>
                    {calibration.accuracy}%
                  </span>
                  <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                    match against {calibration.total} historically decided applications
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--fs-small)' }}>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
                    <div style={{ color: 'var(--text-muted)' }}>correctly advanced</div>
                    <strong>{calibration.truePositive}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
                    <div style={{ color: 'var(--text-muted)' }}>correctly rejected</div>
                    <strong>{calibration.trueNegative}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
                    <div style={{ color: 'var(--text-muted)' }}>missed (should advance)</div>
                    <strong>{calibration.falseNegative}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
                    <div style={{ color: 'var(--text-muted)' }}>over-advanced</div>
                    <strong>{calibration.falsePositive}</strong>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no AI evaluations yet to backtest.</p>
            )}
          </Card>

          <Card>
            <SectionHeader title="reviewer throughput" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {reviewerThroughput.slice(0, 5).map((r) => (
                <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-small)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                  <span>{r.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {r.reviewsCompleted} review{r.reviewsCompleted === 1 ? '' : 's'} · {r.avgTurnaroundDays}d avg
                  </span>
                </div>
              ))}
              {reviewerThroughput.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no reviews submitted yet.</p>}
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          <Card accent accentSide="left">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ fontSize: 'var(--fs-h4)' }}>target matches</h2>
              <Badge tone="outline">
                {targetStats.applied}/{targetStats.total} applied
              </Badge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {recentMatches.map((t) => (
                <div key={t.id} style={{ fontSize: 'var(--fs-small)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                  <span><OrgTitle>{t.name}</OrgTitle></span>
                  <span style={{ color: 'var(--text-muted)' }}>{Math.round((t.matchConfidence ?? 0) * 100)}% match</span>
                </div>
              ))}
              {recentMatches.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no matches yet.</p>}
            </div>
            <Link href="/targets" style={{ display: 'inline-block', marginTop: 'var(--space-5)', fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none', fontWeight: 'var(--fw-bold)' as unknown as number }}>
              view wishlist board →
            </Link>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h2 style={{ fontSize: 'var(--fs-h4)' }}>reviewer divergence</h2>
              {divergent.length > 0 && <Badge tone="yellow">{divergent.length} flagged</Badge>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {divergent.slice(0, 5).map(({ app }) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  style={{ fontSize: 'var(--fs-small)', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}
                >
                  <span><OrgTitle>{app.orgName}</OrgTitle></span>
                  <span style={{ color: 'var(--text-muted)' }}>AI / human scores diverge</span>
                </Link>
              ))}
              {divergent.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no divergent reviews right now.</p>}
            </div>
          </Card>
        </div>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <h2 style={{ fontSize: 'var(--fs-h4)' }}>red flags &amp; ineligible applicants</h2>
            {flagged.length > 0 && <Badge tone="red">{flagged.length} flagged</Badge>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {flagged.slice(0, 8).map((a) => (
              <Link
                key={a.id}
                href={`/applications/${a.id}`}
                style={{ fontSize: 'var(--fs-small)', color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}
              >
                <span><OrgTitle>{a.orgName}</OrgTitle></span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {a.ineligible && `eligibility ${a.eligibilityAnswered}/4`}
                  {a.ineligible && a.redFlags.length > 0 && ' · '}
                  {a.redFlags.length > 0 && `${a.redFlags.length} AI red flag${a.redFlags.length === 1 ? '' : 's'}`}
                </span>
              </Link>
            ))}
            {flagged.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no flagged or ineligible applicants right now.</p>}
          </div>
        </Card>

        <Card>
          <SectionHeader title="recent activity" />
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr',
                fontSize: 'var(--fs-caption)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--ls-wide)',
                color: 'var(--text-muted)',
                paddingBottom: 'var(--space-2)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span>organisation</span>
              <span>transition</span>
              <span style={{ textAlign: 'right' }}>actor</span>
            </div>
            {activity.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr',
                  alignItems: 'center',
                  fontSize: 'var(--fs-small)',
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: 'var(--space-3) 0',
                }}
              >
                <Link href={`/applications/${t.application.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                  <OrgTitle>{t.application.orgName}</OrgTitle>
                </Link>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {STAGE_STATUS_LABEL[t.fromStatus as StageStatusValue] ?? t.fromStatus} → {STAGE_STATUS_LABEL[t.toStatus as StageStatusValue] ?? t.toStatus}
                </span>
                <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{t.actor?.name ?? 'system'}</span>
              </div>
            ))}
            {activity.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', paddingTop: 'var(--space-3)' }}>no activity yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
