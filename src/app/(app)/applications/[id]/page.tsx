import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AngularBanner, Card, Badge, Tag } from '@/design-system';
import { CompositeBadge, DispositionTag } from '@/components/StatusBadges';
import { StageActionBar } from '@/components/StageActionBar';
import { DownloadPdfButton } from '@/components/DownloadPdfButton';
import { RescoreButton } from '@/components/RescoreButton';
import { AiOverridePanel } from '@/components/AiOverridePanel';
import { DecisionStatusButtons } from '@/components/DecisionStatusButtons';
import { ReviewerAssignmentPanel } from '@/components/ReviewerAssignmentPanel';
import { ApplicationPagerKeys } from '@/components/ApplicationPagerKeys';
import { SectionJumpNav } from '@/components/SectionJumpNav';
import { ReviewSidePanel } from '@/components/ReviewSidePanel';
import { PersonalNotes } from '@/components/PersonalNotes';
import { CommentThread } from '@/components/CommentThread';
import { getApplicationDetail, getAdjacentApplications } from '@/lib/applications/queries';
import { getCurrentUser, listUsers } from '@/lib/auth/session';
import { evaluateEligibility } from '@/lib/scoring/eligibility';
import { parseCriteria, parseRedFlags, parseEligibility } from '@/lib/scoring/parse';
import { RUBRIC_CRITERIA } from '@/lib/scoring/rubric';
import { effectiveScore } from '@/lib/scoring/effective';
import { computeConsensus } from '@/lib/applications/consensus';
import {
  TEAM_SIZE_LABEL,
  STAGE_STATUS_LABEL,
  LEGAL_REGISTRATION_TYPE_LABEL,
  ANNUAL_BUDGET_BAND_LABEL,
  OPERATING_MODEL_ARCHETYPE_LABEL,
  CROP_TYPE_LABEL,
  REGEN_PRACTICE_LABEL,
  TECH_TOOL_LABEL,
  MEL_HANDLING_LABEL,
  type TeamSizeValue,
  type StageStatusValue,
  type LegalRegistrationTypeValue,
  type AnnualBudgetBandValue,
  type MelHandlingValue,
} from '@/lib/constants';

function tagList(raw: string | null, labels: Record<string, string>) {
  return raw
    ?.split(';')
    .filter(Boolean)
    .map((v) => labels[v] ?? v);
}

function driveEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return null;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-primary)', lineHeight: 'var(--lh-relaxed)' }}>{value ?? '—'}</div>
    </div>
  );
}

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const [app, adjacent, allUsers] = await Promise.all([getApplicationDetail(params.id, user?.id), getAdjacentApplications(params.id, user), listUsers()]);
  const reviewers = allUsers;
  if (!app) notFound();

  const latestEval = app.aiEvaluations[0];
  const criteria = latestEval ? parseCriteria(latestEval.criteria) : [];
  const redFlags = latestEval ? parseRedFlags(latestEval.redFlags) : [];
  const eligibility = latestEval ? parseEligibility(latestEval.eligibility) : null;
  const eligibilityScreen = evaluateEligibility(app);
  const embed = driveEmbedUrl(app.pitchDeckUrl);
  const isAdmin = user?.role === 'ADMIN';
  const myReview = app.humanReviews.find((r) => r.reviewerId === user?.id);

  return (
    <div>
      <ApplicationPagerKeys prevId={adjacent.prevId} nextId={adjacent.nextId} />
      <AngularBanner
        eyebrow={app.historicallyShortlisted ? 'historically shortlisted · agwater 2024 cohort' : 'rapid re.gen challenge applicant'}
        title={app.orgName}
        subtitle={`${app.pocFirstName} ${app.pocLastName}${app.designation ? `, ${app.designation}` : ''} · ${app.location ?? 'location not provided'}`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            {app.targetMatch && <Badge tone="red">target wishlist match</Badge>}
            {latestEval && <CompositeBadge score={effectiveScore(latestEval).composite} />}
            {user && (
              <ReviewSidePanel
                applicationId={app.id}
                orgName={app.orgName}
                existing={myReview}
                aiScore={latestEval ? { composite: effectiveScore(latestEval).composite, disposition: effectiveScore(latestEval).disposition } : undefined}
              />
            )}
            <DownloadPdfButton />
          </div>
        }
      />

      {isAdmin && (
        <div style={{ padding: 'var(--space-6) var(--space-10) 0', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
          <Card accent accentSide="left">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--fs-h4)' }}>reviewers</h2>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                assign whoever should review this application. manual only — there&apos;s no auto-assignment.
              </p>
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
            <strong style={{ fontSize: 'var(--fs-small)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)' }}>fails Level 1 eligibility screening</strong>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-5)', fontSize: 'var(--fs-small)' }}>
              {eligibilityScreen.failedReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {eligibilityScreen.eligible && eligibilityScreen.identityGaps.length > 0 && (
        <div style={{ padding: 'var(--space-4) var(--space-10) 0', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
          <div style={{ background: 'var(--delta-yellow)', color: 'var(--delta-charcoal)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <strong style={{ fontSize: 'var(--fs-small)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)' }}>
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
          <Link href={`/applications/${adjacent.prevId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none', fontWeight: 'var(--fw-bold)' as unknown as number }}>
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
          <Link href={`/applications/${adjacent.nextId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none', fontWeight: 'var(--fw-bold)' as unknown as number }}>
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

      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
        <div>
          <SectionJumpNav />
          <div id="section-organisation-profile">
          <Card accent style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>organisation</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Field label="organisation type" value={app.orgType === 'FOR_PROFIT' ? 'for-profit' : 'non-profit'} />
              <Field label="current stage (self-reported)" value={app.stageRaw} />
              <Field label="website" value={app.website ? <a href={app.website} target="_blank" rel="noreferrer">{app.website}</a> : undefined} />
              <Field label="LinkedIn" value={app.linkedinUrl ? <a href={app.linkedinUrl} target="_blank" rel="noreferrer">{app.linkedinUrl}</a> : undefined} />
              <Field label="incorporated" value={app.incorporationDate ? new Date(app.incorporationDate).toLocaleDateString('en-GB') : undefined} />
              <Field label="email" value={app.email} />
              <Field label="phone" value={app.phone} />
              <Field label="team size" value={app.teamSize ? (TEAM_SIZE_LABEL[app.teamSize as TeamSizeValue] ?? app.teamSize) : undefined} />
            </div>
          </Card>

          {(app.founders.length > 0 || app.funders.length > 0) && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>founders &amp; funders</h2>
              {app.founders.length > 0 && (
                <div style={{ marginBottom: app.funders.length > 0 ? 'var(--space-6)' : 0 }}>
                  <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    founders
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    {app.founders.map((f) => (
                      <div key={f.id} style={{ fontSize: 'var(--fs-small)' }}>
                        <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-primary)' }}>
                          {f.fullName}
                          {f.role && <span style={{ fontWeight: 'var(--fw-light)' as unknown as number, color: 'var(--text-secondary)' }}> · {f.role}</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 'var(--space-1)' }}>
                          {f.email ? (
                            <a href={`mailto:${f.email}`} style={{ color: 'var(--delta-red)' }}>{f.email}</a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>email not provided</span>
                          )}
                          {f.linkedin ? (
                            <a href={f.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--delta-red)' }}>{f.linkedin}</a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>LinkedIn not provided</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {app.funders.length > 0 && (
                <div>
                  <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                    funders
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {app.funders.map((f) => (
                      <div key={f.id} style={{ fontSize: 'var(--fs-small)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{f.name}</strong>
                        {f.worksWithGovernment !== null && (
                          <span style={{ color: 'var(--text-muted)' }}> · works with government: {f.worksWithGovernment ? 'yes' : 'no'}</span>
                        )}
                        {f.fundingNature && <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0' }}>{f.fundingNature}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {(app.problemAddressing || app.aboutSolution || app.valueChainFocus) && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>problem and solution</h2>
              <Field label="problem addressing" value={app.problemAddressing} />
              <Field label="about the solution" value={app.aboutSolution} />
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                {app.valueChainFocus?.split(';').filter(Boolean).map((v) => <Tag key={v}>{v.trim()}</Tag>)}
              </div>
            </Card>
          )}

          {(app.waterEfficiencyFocus || app.smallMarginalFarmerPct !== null || app.areaHectaresRaw) && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>impact and eligibility signals (AgWater cycle)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <Field label="beneficiaries" value={app.beneficiaries} />
                <Field label="small/marginal farmer share" value={app.smallMarginalFarmerPct !== null ? `${app.smallMarginalFarmerPct}%` : undefined} />
                <Field label="area under coverage" value={app.areaHectaresRaw} />
                <Field label="TRL" value={app.trl} />
                <Field label="water-use efficiency focus" value={app.waterEfficiencyFocus} />
                <Field label="water efficiency estimate" value={app.waterEfficiencyEstimate} />
                <Field label="crop production focus" value={app.cropProductionFocus} />
                <Field label="focus crops" value={app.focusCrops} />
              </div>
            </Card>
          )}

          {(app.legalRegistrationType ||
            app.fcraStatus ||
            app.annualOperatingBudget ||
            app.cert12A ||
            app.cert80G ||
            app.csr1Registration ||
            app.darpanRegistered ||
            app.darpanIdNumber) && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>registrations and governance</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <Field
                  label="legal registration type"
                  value={app.legalRegistrationType ? (LEGAL_REGISTRATION_TYPE_LABEL[app.legalRegistrationType as LegalRegistrationTypeValue] ?? app.legalRegistrationType) : undefined}
                />
                <Field
                  label="annual operating budget"
                  value={app.annualOperatingBudget ? (ANNUAL_BUDGET_BAND_LABEL[app.annualOperatingBudget as AnnualBudgetBandValue] ?? app.annualOperatingBudget) : undefined}
                />
                <Field label="FCRA registration" value={app.fcraStatus} />
                <Field label="12A certificate" value={app.cert12A} />
                <Field label="80G certificate" value={app.cert80G} />
                <Field label="CSR-1 registration" value={app.csr1Registration} />
                <Field label="NITI Aayog DARPAN ID" value={app.darpanRegistered} />
                <Field label="DARPAN registration number" value={app.darpanIdNumber} />
              </div>
            </Card>
          )}
          </div>

          <div id="section-model">
          {(app.operatingModelArchetype || app.operatingModelDescription || app.primaryCrops || app.regenerativePractices || app.adoptionHurdle) && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>model</h2>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                {tagList(app.operatingModelArchetype, OPERATING_MODEL_ARCHETYPE_LABEL)?.map((v) => <Tag key={v}>{v}</Tag>)}
              </div>
              <Field label="how it works in practice" value={app.operatingModelDescription} />
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {tagList(app.primaryCrops, CROP_TYPE_LABEL)?.map((v) => <Tag key={v}>{v}</Tag>)}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                {tagList(app.regenerativePractices, REGEN_PRACTICE_LABEL)?.map((v) => <Tag key={v}>{v}</Tag>)}
              </div>
              <Field label="biggest adoption hurdle" value={app.adoptionHurdle} />
            </Card>
          )}
          </div>

          <div id="section-tech-and-tools">
          {(app.techTools || app.otherTools || app.techToolsInternal !== null || app.techUseCases.length > 0) && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>tech and tools</h2>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                {tagList(app.techTools, TECH_TOOL_LABEL)?.map((v) => <Tag key={v}>{v}</Tag>)}
              </div>
              <Field label="tools developed internally" value={app.techToolsInternal === null ? undefined : app.techToolsInternal ? 'yes' : 'no'} />
              <Field label="other tools" value={app.otherTools} />
              <Field
                label="top tech use cases"
                value={app.techUseCases.length ? app.techUseCases.map((t) => t.description).join('; ') : undefined}
              />
            </Card>
          )}
          </div>

          <div id="section-experience-impact">
          {(app.farmersCount !== null ||
            app.yearsExperience !== null ||
            app.verifiedImpacts ||
            app.statesOperating ||
            app.fundUsagePlan ||
            app.reportLinks.length > 0 ||
            app.villagesDistrictsRaw ||
            app.otherDevelopmentAreas ||
            app.teamTrainingDescription ||
            app.heardAboutChallenge) && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>experience and impact</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <Field label="years of experience" value={app.yearsExperience} />
                <Field label="farmers reached" value={app.farmersCount} />
                <Field label="of which smallholder (≤2ha)" value={app.smallholderFarmersCount} />
                <Field label="average land holding (ha)" value={app.avgLandHolding} />
                <Field label="area under regenerative practice (ha)" value={app.areaUnderRegenPractice} />
                <Field label="villages / districts" value={app.villagesDistrictsRaw ?? (app.villagesCount ?? app.districtsCount ? `${app.villagesCount ?? '—'} villages, ${app.districtsCount ?? '—'} districts` : undefined)} />
                <Field label="MEL handled" value={app.melHandling ? (MEL_HANDLING_LABEL[app.melHandling as MelHandlingValue] ?? app.melHandling) : undefined} />
                <Field label="materials in local languages" value={app.materialsInLocalLanguages === null ? undefined : app.materialsInLocalLanguages ? 'yes' : 'no'} />
                <Field label="team formally trained" value={app.teamFormalTraining === null ? undefined : app.teamFormalTraining ? 'yes' : 'no'} />
                <Field label="works beyond agriculture" value={app.worksBeyondAg === null ? undefined : app.worksBeyondAg ? 'yes' : 'no'} />
                <Field label="info confirmed accurate by applicant" value={app.infoAccurateConfirmed === null ? undefined : app.infoAccurateConfirmed ? 'yes' : 'no'} />
              </div>
              <Field label="team training details" value={app.teamTrainingDescription} />
              <Field label="other development work beyond agriculture" value={app.otherDevelopmentAreas} />
              <Field label="states / UTs of operation" value={tagList(app.statesOperating, {})?.join(', ')} />
              <Field label="verified impacts" value={app.verifiedImpacts} />
              <Field label="planned use of prize funds" value={app.fundUsagePlan} />
              <Field label="how they heard about the challenge" value={[tagList(app.heardAboutChallenge, {})?.join(', '), app.otherHeardAbout].filter(Boolean).join(' — ') || undefined} />
              {app.reportLinks.length > 0 && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                    published reports / case studies
                  </div>
                  {app.reportLinks.map((r) => (
                    <div key={r.id}>
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ color: 'var(--delta-red)', fontSize: 'var(--fs-small)' }}>
                        {r.url}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          </div>

          {app.enrichmentSummary && (
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <h2 style={{ fontSize: 'var(--fs-h3)' }}>public-data enrichment</h2>
                <Badge tone="outline">{app.enrichmentSource === 'website+search' ? 'website + search' : 'website'}</Badge>
              </div>
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>{app.enrichmentSummary}</p>
              <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
                fetched from {app.website}. this is supporting context for AI scoring, not a substitute for the application itself.
              </p>
            </Card>
          )}

          {embed && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>pitch deck</h2>
              <iframe src={embed} width="100%" height="480" style={{ border: 'none' }} allow="autoplay" />
            </Card>
          )}
          {!embed && app.pitchDeckUrl && (
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <a href={app.pitchDeckUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--delta-red)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                open pitch deck ↗
              </a>
            </Card>
          )}
          <div id="section-scoring" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-1)' }}>scoring &amp; evaluation</h2>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
              AI read below is decision support only — use the &ldquo;review&rdquo; button above to score this application yourself.
            </p>
          </div>
          {latestEval && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontSize: 'var(--fs-h3)' }}>AI evaluation</h2>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <CompositeBadge score={effectiveScore(latestEval).composite} />
                  <DispositionTag disposition={effectiveScore(latestEval).disposition} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)' }}>
                  model: {latestEval.model} · rubric v{latestEval.rubricVersion}
                </p>
                {user && <RescoreButton applicationId={app.id} />}
              </div>

              {isAdmin && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <AiOverridePanel
                    evaluationId={latestEval.id}
                    applicationId={app.id}
                    aiComposite={latestEval.composite}
                    aiDisposition={latestEval.disposition}
                    override={{
                      overrideComposite: latestEval.overrideComposite,
                      overrideDisposition: latestEval.overrideDisposition,
                      overrideReason: latestEval.overrideReason,
                      overriddenByName: latestEval.overriddenBy?.name ?? null,
                      overriddenAt: latestEval.overriddenAt ? latestEval.overriddenAt.toISOString() : null,
                    }}
                  />
                </div>
              )}
              {latestEval.summary && <p style={{ marginBottom: 'var(--space-4)' }}>{latestEval.summary}</p>}

              {redFlags.length > 0 && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  {redFlags.map((f) => (
                    <Badge key={f} tone="yellow" style={{ marginRight: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      {f}
                    </Badge>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {criteria.map((c) => {
                  const def = RUBRIC_CRITERIA.find((r) => r.key === c.key);
                  return (
                    <div key={c.key} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ textTransform: 'lowercase' }}>{def?.label ?? c.key}</strong>
                        <span style={{ color: 'var(--delta-red)', fontWeight: 'var(--fw-bold)' as unknown as number }}>{c.score} / 5</span>
                      </div>
                      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0' }}>{c.rationale}</p>
                      {c.evidence && (
                        <p style={{ fontSize: 'var(--fs-small)', fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>
                          &ldquo;{c.evidence}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {eligibility && (
                <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                  eligibility notes: {eligibility.fit_notes}
                </p>
              )}
            </Card>
          )}

          {!latestEval && user && (
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>this application hasn&apos;t been scored yet.</p>
                <RescoreButton applicationId={app.id} />
              </div>
            </Card>
          )}

          {app.humanReviews.length > 0 && (
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontSize: 'var(--fs-h3)' }}>human reviews</h2>
                {(() => {
                  const consensus = computeConsensus({
                    aiComposite: latestEval?.composite,
                    humanComposites: app.humanReviews.map((r) => r.composite),
                  });
                  return consensus.divergent ? <Badge tone="yellow">reviewers diverge</Badge> : <Badge tone="outline">consensus aligned</Badge>;
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {app.humanReviews.map((r) => (
                  <div key={r.id} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{r.reviewer.name}</strong>
                      <Tag selected={r.recommendation === 'ADVANCE'}>{r.recommendation.toLowerCase()}</Tag>
                    </div>
                    <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {app.juryScores.length > 0 && (
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>jury scores</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {app.juryScores.map((j) => (
                  <div key={j.id} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{j.juror.name}</strong>
                      <Tag selected={j.verdict === 'YES'}>{j.verdict.toLowerCase()}</Tag>
                    </div>
                    <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{j.comment}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div>
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
            <CommentThread applicationId={app.id} comments={app.comments} />
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

        </div>
      </div>
    </div>
  );
}
