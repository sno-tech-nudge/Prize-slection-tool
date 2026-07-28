import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { AngularBanner, Card, Badge } from '@/design-system';
import { StageActionBar } from '@/components/StageActionBar';
import { DownloadPdfButton } from '@/components/DownloadPdfButton';
import { DecisionStatusButtons } from '@/components/DecisionStatusButtons';
import { ReviewerAssignmentPanel } from '@/components/ReviewerAssignmentPanel';
import { ApplicationPagerKeys } from '@/components/ApplicationPagerKeys';
import { ReviewSidePanel } from '@/components/ReviewSidePanel';
import { PersonalNotes } from '@/components/PersonalNotes';
import { CommentThread } from '@/components/CommentThread';
import { JurySidePanel } from '@/components/JurySidePanel';
import { JuryScoresTable } from '@/components/JuryScoresTable';
import { ApplicationMainContent } from '@/components/ApplicationMainContent';
import { getApplicationDetail, getAdjacentApplications, type ApplicationListFilters } from '@/lib/applications/queries';
import { getCurrentUser, listUsers } from '@/lib/auth/session';
import { evaluateEligibility } from '@/lib/scoring/eligibility';
import { slugify } from '@/lib/sources/normalize';
import { STAGE_STATUS_LABEL, type StageStatusValue } from '@/lib/constants';

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: ApplicationListFilters;
}) {
  const user = await getCurrentUser();
  const [app, adjacent, allUsers] = await Promise.all([
    getApplicationDetail(params.id, user?.id),
    getAdjacentApplications(params.id, user, searchParams),
    listUsers(),
  ]);
  const reviewers = allUsers;
  if (!app) notFound();

  const pagerParams = new URLSearchParams();
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) pagerParams.set(key, value);
  });
  const pagerQueryString = pagerParams.toString() ? `?${pagerParams.toString()}` : '';

  const eligibilityScreen = evaluateEligibility(app);
  const isAdmin = user?.role === 'ADMIN';
  const isJury = user?.role === 'JURY';
  const myReview = app.humanReviews.find((r) => r.reviewerId === user?.id);
  const myJuryScore = app.juryScores.find((s) => s.jurorId === user?.id);

  return (
    <div>
      <ApplicationPagerKeys prevId={adjacent.prevId} nextId={adjacent.nextId} queryString={pagerQueryString} />
      {isJury && (
        <div style={{ padding: 'var(--space-4) var(--space-10) 0', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
          <Link href={`/applications${pagerQueryString}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none', fontWeight: 'var(--fw-bold)' as unknown as number }}>
            <ChevronLeft size={16} strokeLinejoin="miter" strokeLinecap="square" />
            back to applications
          </Link>
        </div>
      )}
      <AngularBanner
        eyebrow={app.historicallyShortlisted ? 'historically shortlisted · agwater 2024 cohort' : 'rapid re.gen challenge applicant'}
        title={app.orgName}
        subtitle={`${app.pocFirstName} ${app.pocLastName}${app.designation ? `, ${app.designation}` : ''}`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            {app.targetMatch && <Badge tone="red">target wishlist match</Badge>}
            {user && !isJury && (
              <ReviewSidePanel applicationId={app.id} orgName={app.orgName} existing={myReview} />
            )}
            <DownloadPdfButton filename={slugify(app.orgName)} />
          </div>
        }
      />

      {isAdmin && (
        <div style={{ padding: 'var(--space-6) var(--space-10) 0', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
          <Card accent accentSide="left">
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--fs-h4)' }}>reviewers</h2>
            </div>
            <ReviewerAssignmentPanel
              applicationId={app.id}
              reviewers={reviewers}
              assignedReviewerIds={app.reviewAssignments.map((a) => a.reviewerId)}
            />
          </Card>
        </div>
      )}

      {!eligibilityScreen.eligible && (
        <div style={{ padding: 'var(--space-4) var(--space-10) 0', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
          <div style={{ background: 'var(--delta-red)', color: 'var(--text-inverse)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)' }}>
              <AlertTriangle size={16} strokeLinejoin="miter" strokeLinecap="square" />
              fails Level 1 eligibility screening
            </strong>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-small)' }}>
              {eligibilityScreen.failedReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!isJury && eligibilityScreen.eligible && eligibilityScreen.identityGaps.length > 0 && (
        <div style={{ padding: 'var(--space-4) var(--space-10) 0', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
          <div style={{ background: 'var(--delta-yellow)', color: 'var(--delta-charcoal)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)' }}>
              <AlertTriangle size={16} strokeLinejoin="miter" strokeLinecap="square" />
              identity details missing — passes eligibility, needs a human look
            </strong>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-small)' }}>
              {eligibilityScreen.identityGaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div style={{ padding: 'var(--space-6) var(--space-10) 0', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {adjacent.prevId ? (
          <Link href={`/applications/${adjacent.prevId}${pagerQueryString}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none', fontWeight: 'var(--fw-bold)' as unknown as number }}>
            <ChevronLeft size={16} strokeLinejoin="miter" strokeLinecap="square" />
            previous
          </Link>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
            <ChevronLeft size={16} strokeLinejoin="miter" strokeLinecap="square" />
            previous
          </span>
        )}
        {adjacent.position && (
          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
            {adjacent.position} of {adjacent.total}
          </span>
        )}
        {adjacent.nextId ? (
          <Link href={`/applications/${adjacent.nextId}${pagerQueryString}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none', fontWeight: 'var(--fw-bold)' as unknown as number }}>
            next
            <ChevronRight size={16} strokeLinejoin="miter" strokeLinecap="square" />
          </Link>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
            next
            <ChevronRight size={16} strokeLinejoin="miter" strokeLinecap="square" />
          </span>
        )}
      </div>

      <div data-pdf-grid="true" style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
        <ApplicationMainContent app={app} isJury={isJury} user={user} />

        <div data-pdf-exclude="true">
          {isJury ? (
            <JurySidePanel applicationId={app.id} myScore={myJuryScore} />
          ) : (
            <>
              {isAdmin && (
                <Card accent accentSide="left" style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>stage action</h2>
                  <StageActionBar applicationId={app.id} currentStage={app.stageStatus as StageStatusValue} />
                </Card>
              )}

              {isAdmin && (
                <Card style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>decision status</h2>
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                    only applications marked &ldquo;yes&rdquo; here are passed through to jury review.
                  </p>
                  <DecisionStatusButtons applicationId={app.id} current={app.internalDecision} />
                </Card>
              )}

              {isAdmin && app.juryScores.length > 0 && <JuryScoresTable juryScores={app.juryScores} />}

              {user && (
                <Card style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>personal notes</h2>
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                    private to you. not visible to anyone else on the team.
                  </p>
                  <PersonalNotes applicationId={app.id} initialBody={app.notes[0]?.body ?? ''} />
                </Card>
              )}

              <Card style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>discussion</h2>
                <CommentThread applicationId={app.id} comments={app.comments} users={allUsers.map((u) => ({ id: u.id, name: u.name }))} />
              </Card>

              <Card style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>transition history</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {app.stageTransitions.map((t) => (
                    <div key={t.id} style={{ fontSize: 'var(--fs-small)' }}>
                      <div>
                        <strong>{STAGE_STATUS_LABEL[t.fromStatus as StageStatusValue] ?? t.fromStatus}</strong> →{' '}
                        <strong style={{ color: 'var(--delta-red)' }}>{STAGE_STATUS_LABEL[t.toStatus as StageStatusValue] ?? t.toStatus}</strong>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>
                        {new Date(t.createdAt).toLocaleDateString('en-GB')} {t.actor ? `· ${t.actor.name}` : ''}
                      </div>
                      {t.reason && <div style={{ color: 'var(--text-secondary)' }}>{t.reason}</div>}
                    </div>
                  ))}
                </div>
              </Card>

              {app.outboxEmails.length > 0 && (
                <Card style={{ marginBottom: 'var(--space-6)' }}>
                  <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>outreach history</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {app.outboxEmails.map((e) => (
                      <Link key={e.id} href="/outreach" style={{ fontSize: 'var(--fs-small)', textDecoration: 'none', color: 'var(--text-primary)' }}>
                        <Badge tone={e.status === 'SENT' ? 'red' : 'neutral'}>{e.status.toLowerCase()}</Badge> {e.subject}
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
