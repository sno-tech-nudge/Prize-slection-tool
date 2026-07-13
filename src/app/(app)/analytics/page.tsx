import { AngularBanner, Card, Badge } from '@/design-system';
import { BarRow } from '@/components/BarRow';
import { STAGE_STATUS_LABEL, type StageStatusValue } from '@/lib/constants';
import {
  getFunnel,
  getOperatingModelMix,
  getValueChainMix,
  getGeographyMix,
  getSmallFarmerHistogram,
  getTrlDistribution,
  getReviewerThroughput,
  getCalibrationNote,
} from '@/lib/analytics/queries';
import { getTargetStats } from '@/lib/targets/queries';

export default async function AnalyticsPage() {
  const [funnel, categoryMix, valueChainMix, geoMix, farmerHistogram, trlDist, throughput, calibration, targetStats] = await Promise.all([
    getFunnel(),
    getOperatingModelMix(),
    getValueChainMix(),
    getGeographyMix(),
    getSmallFarmerHistogram(),
    getTrlDistribution(),
    getReviewerThroughput(),
    getCalibrationNote(),
    getTargetStats(),
  ]);

  const funnelMax = Math.max(...funnel.map((f) => f.count), 1);
  const categoryMax = Math.max(...categoryMix.map((c) => c.count), 1);
  const valueChainMax = Math.max(...valueChainMix.map((c) => c.count), 1);
  const geoMax = Math.max(...geoMix.map((c) => c.count), 1);
  const farmerMax = Math.max(...farmerHistogram.map((c) => c.count), 1);
  const trlMax = Math.max(...trlDist.map((c) => c.count), 1);

  return (
    <div>
      <AngularBanner eyebrow="rapid re.gen challenge" title="analytics" subtitle="live funnel, mix and reviewer throughput, computed from the current database." />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-5)' }}>stage funnel</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {funnel.map((f) => (
              <div key={f.stage} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <BarRow label={STAGE_STATUS_LABEL[f.stage as StageStatusValue]} count={f.count} max={funnelMax} />
                <div style={{ width: 56, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{f.pctOfSubmitted}%</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)' }}>
          <Card>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-5)' }}>operating model mix</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {categoryMix.map((c) => (
                <BarRow key={c.category} label={c.category} count={c.count} max={categoryMax} tone="ink" />
              ))}
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-5)' }}>value chain focus</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {valueChainMix.slice(0, 8).map((c) => (
                <BarRow key={c.focus} label={c.focus} count={c.count} max={valueChainMax} />
              ))}
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-5)' }}>geography spread</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {geoMix.map((g) => (
                <BarRow key={g.location} label={g.location} count={g.count} max={geoMax} tone="ink" />
              ))}
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-5)' }}>TRL distribution</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {trlDist.map((t) => (
                <BarRow key={t.trl} label={`TRL ${t.trl}`} count={t.count} max={trlMax} />
              ))}
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-5)' }}>small / marginal farmer share</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {farmerHistogram.map((b) => (
                <BarRow key={b.label} label={b.label} count={b.count} max={farmerMax} tone="ink" />
              ))}
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-5)' }}>reviewer throughput</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {throughput.map((r) => (
                <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-small)' }}>
                  <span>{r.name}</span>
                  <span>
                    {r.reviewsCompleted} reviews · avg {r.avgTurnaroundDays}d turnaround
                  </span>
                </div>
              ))}
              {throughput.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-small)' }}>no reviews submitted yet.</p>}
            </div>
          </Card>
        </div>

        <Card accent accentSide="left">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)' }}>target-list coverage</h2>
            <Badge tone="red">
              {targetStats.applied} / {targetStats.total} applied
            </Badge>
          </div>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
            {targetStats.notApplied} wishlist startups have not applied yet. see the{' '}
            <a href="/targets" style={{ color: 'var(--delta-red)' }}>
              wishlist board
            </a>{' '}
            to nudge them.
          </p>
        </Card>

        {calibration && (
          <Card accent accentSide="left">
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>AI calibration note</h2>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              backtesting the scorer against the historical outcome: of {calibration.total} scored applications, the AI&apos;s advance/strong-advance
              call agreed with the historical shortlist decision {calibration.accuracy}% of the time.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', fontSize: 'var(--fs-small)' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>shortlisted &amp; AI agreed</div>
                <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>{calibration.truePositive}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>shortlisted, AI missed</div>
                <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>{calibration.falseNegative}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>rejected &amp; AI agreed</div>
                <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>{calibration.trueNegative}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>rejected, AI overshot</div>
                <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>{calibration.falsePositive}</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
