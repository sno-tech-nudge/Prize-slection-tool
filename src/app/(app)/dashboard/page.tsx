import Link from 'next/link';
import { FileText, ClipboardCheck, CheckCircle2, Globe2, type LucideIcon } from 'lucide-react';
import { AngularBanner, Card, Badge } from '@/design-system';
import { getDashboardKpis, getRecentActivity, getReviewDecisionFunnel, getReviewerStats } from '@/lib/dashboard/queries';
import { listRecentMatches, getTargetStats } from '@/lib/targets/queries';
import {
  getOperatingModelMix,
  getOperatingBudgetMix,
  getStateApplicationMix,
  getOrgSizeMix,
  getOrgAgeMix,
} from '@/lib/analytics/queries';
import { BarRow } from '@/components/BarRow';
import { PieChart } from '@/components/PieChart';
import { IndiaStatesMap } from '@/components/IndiaStatesMap';
import { OrgTitle } from '@/components/OrgTitle';

function Kpi({ label, value, icon: Icon, href }: { label: string; value: number | string; icon: LucideIcon; href?: string }) {
  const content = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', cursor: 'pointer' }}>{content}</Card>
      </Link>
    );
  }

  return <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>{content}</Card>;
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

function PartHeader({ title }: { title: string }) {
  return (
    <div style={{ borderTop: '2px solid var(--border-default)', paddingTop: 'var(--space-8)' }}>
      <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>{title}</h2>
    </div>
  );
}

export default async function DashboardPage() {
  const [
    kpis,
    funnel,
    recentMatches,
    targetStats,
    activity,
    categoryMix,
    budgetMix,
    stateMix,
    orgSizeMix,
    orgAgeMix,
    reviewerStats,
  ] = await Promise.all([
    getDashboardKpis(),
    getReviewDecisionFunnel(),
    listRecentMatches(4),
    getTargetStats(),
    getRecentActivity(),
    getOperatingModelMix(),
    getOperatingBudgetMix(),
    getStateApplicationMix(),
    getOrgSizeMix(),
    getOrgAgeMix(),
    getReviewerStats(),
  ]);
  const funnelMax = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div>
      <AngularBanner
        eyebrow="internal platform"
        title="dashboard"
        subtitle="application pipeline status: screening, scoring, review, and jury."
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-5)' }}>
          <Kpi label="total applications" value={kpis.total} icon={FileText} href="/applications" />
          <Kpi label="decision: yes" value={kpis.internalYes} icon={CheckCircle2} />
          <Kpi label="reviewed" value={kpis.reviewed} icon={ClipboardCheck} />
          <Kpi label="states represented" value={kpis.statesRepresented} icon={Globe2} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          <Card accent>
            <SectionHeader title="pipeline funnel" action={{ href: '/analytics', label: 'full analytics' }} />
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
            <SectionHeader title="recent activity" />
            <div>
              {activity.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--fs-small)',
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: 'var(--space-3) 0',
                  }}
                >
                  <Link href={`/applications/${t.application.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                    <OrgTitle>{t.application.orgName}</OrgTitle>
                  </Link>
                  <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{t.actor?.name ?? 'system'}</span>
                </div>
              ))}
              {activity.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', paddingTop: 'var(--space-3)' }}>no activity yet.</p>}
            </div>
          </Card>
        </div>

        <PartHeader title="application analytics" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          <Card accent>
            <SectionHeader title="operating model mix" />
            <PieChart data={categoryMix.map((c) => ({ label: c.category, count: c.count }))} />
          </Card>

          <Card accent>
            <SectionHeader title="operating budget mix" />
            <PieChart data={budgetMix} />
          </Card>
        </div>

        <Card accent>
          <SectionHeader title="applicants by state" />
          <IndiaStatesMap data={stateMix} />
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          <Card>
            <SectionHeader title="organisation size (full-time employees)" />
            <PieChart data={orgSizeMix} size={160} />
          </Card>

          <Card>
            <SectionHeader title="organisation age" />
            <PieChart data={orgAgeMix} size={160} />
          </Card>
        </div>
      </div>
    </div>
  );
}
