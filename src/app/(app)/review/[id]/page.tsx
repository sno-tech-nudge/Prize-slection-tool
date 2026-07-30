import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AngularBanner, Card, Badge } from '@/design-system';
import { CompositeBadge, SolutionCategoryTag } from '@/components/StatusBadges';
import { ReviewScoringForm } from '@/components/ReviewScoringForm';
import { getCurrentUser } from '@/lib/auth/session';
import { canManageApplication as canScoreApplication } from '@/lib/auth/guard';
import { getApplicationDetail } from '@/lib/applications/queries';
import { RUBRIC_CRITERIA } from '@/lib/scoring/rubric';
import { parseCriteria } from '@/lib/scoring/parse';
import { computeConsensus } from '@/lib/applications/consensus';

export default async function ReviewApplicationPage({ params }: { params: { id: string } }) {
  const [app, user] = await Promise.all([getApplicationDetail(params.id), getCurrentUser()]);
  if (!app) notFound();

  const latestEval = app.aiEvaluations[0];
  const aiCriteria = latestEval ? parseCriteria(latestEval.criteria) : [];
  const myReview = app.humanReviews.find((r) => r.reviewerId === user?.id);
  const otherReviews = app.humanReviews.filter((r) => r.reviewerId !== user?.id);
  const canScore = canScoreApplication(user, app.reviewAssignments);
  const consensus = computeConsensus({
    aiComposite: latestEval?.composite,
    humanComposites: app.humanReviews.map((r) => r.composite),
  });

  return (
    <div>
      <AngularBanner
        eyebrow="reviewer console"
        title={app.orgName}
        subtitle={`${app.pocFirstName} ${app.pocLastName} · scoring against the ${RUBRIC_CRITERIA.length} rapid re.gen rubric criteria`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <SolutionCategoryTag category={app.solutionCategory} />
            {latestEval && <CompositeBadge score={latestEval.composite} />}
            {consensus.divergent && <Badge tone="yellow">reviewers diverge</Badge>}
          </div>
        }
      />

      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)' }}>
        <div>
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>model</h2>
            <p style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-small)', lineHeight: 'var(--lh-relaxed)' }}>
              {app.operatingModelDescription ?? app.aboutSolution ?? '—'}
            </p>
          </Card>
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>biggest adoption hurdle</h2>
            <p style={{ color: 'var(--text-primary)', fontSize: 'var(--fs-small)', lineHeight: 'var(--lh-relaxed)' }}>
              {app.adoptionHurdle ?? app.problemAddressing ?? '—'}
            </p>
          </Card>
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>key figures</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--fs-small)' }}>
              {app.farmersCount !== null ? (
                <>
                  <div>farmers reached: <strong>{app.farmersCount ?? '—'}</strong></div>
                  <div>smallholder farmers: <strong>{app.smallholderFarmersCount ?? '—'}</strong></div>
                  <div>area under regen practice (ha): <strong>{app.areaUnderRegenPractice ?? '—'}</strong></div>
                  <div>years of experience: <strong>{app.yearsExperience ?? '—'}</strong></div>
                </>
              ) : (
                <>
                  <div>small/marginal farmer share: <strong>{app.smallMarginalFarmerPct ?? '—'}%</strong></div>
                  <div>TRL: <strong>{app.trl ?? '—'}</strong></div>
                  <div>area coverage: <strong>{app.areaHectaresRaw ?? '—'}</strong></div>
                  <div>water focus: <strong>{app.waterEfficiencyFocus ?? '—'}</strong></div>
                </>
              )}
            </div>
          </Card>

          {latestEval && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>AI read (decision support only)</h2>
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>{latestEval.summary}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {aiCriteria.map((c) => {
                  const def = RUBRIC_CRITERIA.find((r) => r.key === c.key);
                  return (
                    <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-small)' }}>
                      <span>{def?.label ?? c.key}</span>
                      <strong>{c.score} / {def?.maxScore ?? 5}</strong>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {otherReviews.length > 0 && (
            <Card>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>other reviewers</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {otherReviews.map((r) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-small)' }}>
                    <span>{r.reviewer.name}</span>
                    <span>
                      {r.composite}/100 · {r.recommendation.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card accent accentSide="left">
            {canScore ? (
              <>
                <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-1)' }}>{myReview ? 'update your score' : 'score this application'}</h2>
                <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
                  rate each threshold 0 (not addressed) to 5 (fully credible).
                </p>
                <ReviewScoringForm applicationId={app.id} existing={myReview} />
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-1)' }}>not assigned to you</h2>
                <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                  you can only score applications an admin has assigned to you. ask an admin to add you as a reviewer here if you
                  need to score it.
                </p>
              </>
            )}
          </Card>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Link href="/review" style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none' }}>
              ← back to queue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
