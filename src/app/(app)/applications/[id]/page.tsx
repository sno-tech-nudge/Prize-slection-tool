import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { AngularBanner, Card, Badge, Tag } from '@/design-system';
import { StageActionBar } from '@/components/StageActionBar';
import { DownloadPdfButton } from '@/components/DownloadPdfButton';
import { RescoreButton } from '@/components/RescoreButton';
import { ValidateOrgButton } from '@/components/ValidateOrgButton';
import { AiOverridePanel } from '@/components/AiOverridePanel';
import { DecisionStatusButtons } from '@/components/DecisionStatusButtons';
import { ReviewerAssignmentPanel } from '@/components/ReviewerAssignmentPanel';
import { ApplicationPagerKeys } from '@/components/ApplicationPagerKeys';
import { SectionJumpNav } from '@/components/SectionJumpNav';
import { ReviewSidePanel } from '@/components/ReviewSidePanel';
import { PersonalNotes } from '@/components/PersonalNotes';
import { CommentThread } from '@/components/CommentThread';
import { getApplicationDetail, getAdjacentApplications, type ApplicationListFilters } from '@/lib/applications/queries';
import { getCurrentUser, listUsers } from '@/lib/auth/session';
import { evaluateEligibility } from '@/lib/scoring/eligibility';
import { parseCriteria, parseRedFlags, parseEligibility } from '@/lib/scoring/parse';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS } from '@/lib/scoring/rubric';
import { slugify } from '@/lib/sources/normalize';
import { ORG_TYPE_LABEL, type OrgTypeValue } from '@/lib/constants';
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

// section-level read at a glance — a color swatch + one-word summary instead of a precise
// number, since the AI read is decision support, not a verdict a human should defer to.
function sectionTone(pct: number): { color: string; label: string } {
  if (pct >= 80) return { color: 'var(--delta-red)', label: 'strong' };
  if (pct >= 60) return { color: 'var(--delta-charcoal)', label: 'solid' };
  if (pct >= 40) return { color: 'var(--delta-yellow)', label: 'developing' };
  return { color: 'var(--grey-400)', label: 'weak' };
}

// same swatch-not-number treatment for organisation validation verdicts — confirmed
// independently reads as the strongest signal, contradicted as the weakest.
function verdictTone(verdict: string | null): { color: string; label: string } {
  if (verdict === 'CONFIRMED') return { color: 'var(--delta-red)', label: 'confirmed independently' };
  if (verdict === 'PARTIAL') return { color: 'var(--delta-charcoal)', label: 'partially confirmed' };
  if (verdict === 'CONTRADICTED') return { color: 'var(--grey-400)', label: 'contradicted' };
  return { color: 'var(--delta-yellow)', label: 'unverified' };
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

// missing/NO certificates are a real eligibility risk, not just an empty field — flag them with
// the same warning icon + red text used in the eligibility banners above, instead of plain text.
function certStatus(value: string | null): React.ReactNode {
  if (!value || value === 'NO') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--delta-red)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
        <AlertTriangle size={14} strokeLinejoin="miter" strokeLinecap="square" />
        {value === 'NO' ? 'no' : 'not provided'}
      </span>
    );
  }
  return value;
}

// a bare row of <Tag> chips with no caption above it doesn't say which question they're
// answering — this wraps a tag list with the same caption style Field uses, so every
// multi-select answer is legible on its own out of context (screenshot, export, etc.)
function TagGroup({ label, values }: { label: string; values: string[] | undefined }) {
  if (!values || values.length === 0) return null;
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {values.map((v) => (
          <Tag key={v}>{v}</Tag>
        ))}
      </div>
    </div>
  );
}

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
      <ApplicationPagerKeys prevId={adjacent.prevId} nextId={adjacent.nextId} queryString={pagerQueryString} />
      <AngularBanner
        eyebrow={app.historicallyShortlisted ? 'historically shortlisted · agwater 2024 cohort' : 'rapid re.gen challenge applicant'}
        title={app.orgName}
        subtitle={`${app.pocFirstName} ${app.pocLastName}${app.designation ? `, ${app.designation}` : ''}`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            {app.targetMatch && <Badge tone="red">target wishlist match</Badge>}
            {user && (
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

      {eligibilityScreen.eligible && eligibilityScreen.identityGaps.length > 0 && (
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
        <div>
          <SectionJumpNav />
          <div id="section-organisation-profile">
          <Card accent style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>organisation</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Field label="organisation type" value={ORG_TYPE_LABEL[app.orgType as OrgTypeValue] ?? app.orgType} />
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
              <TagGroup label="value chain focus" values={app.valueChainFocus?.split(';').map((v) => v.trim()).filter(Boolean)} />
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
                <Field label="12A certificate" value={certStatus(app.cert12A)} />
                <Field label="80G certificate" value={certStatus(app.cert80G)} />
                <Field label="CSR-1 registration" value={certStatus(app.csr1Registration)} />
                <Field label="NITI Aayog DARPAN ID" value={certStatus(app.darpanRegistered)} />
                <Field label="DARPAN registration number" value={app.darpanIdNumber} />
              </div>
            </Card>
          )}
          </div>

          <div id="section-model">
          {(app.operatingModelArchetype || app.operatingModelDescription || app.primaryCrops || app.regenerativePractices || app.adoptionHurdle) && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>model</h2>
              <TagGroup label="operating model archetype" values={tagList(app.operatingModelArchetype, OPERATING_MODEL_ARCHETYPE_LABEL)} />
              <Field label="how it works in practice" value={app.operatingModelDescription} />
              <TagGroup label="primary crops" values={tagList(app.primaryCrops, CROP_TYPE_LABEL)} />
              <TagGroup label="regenerative practices" values={tagList(app.regenerativePractices, REGEN_PRACTICE_LABEL)} />
              <Field label="biggest adoption hurdle" value={app.adoptionHurdle} />
            </Card>
          )}
          </div>

          <div id="section-tech-and-tools">
          {(app.techTools || app.otherTools || app.techToolsInternal !== null || app.techUseCases.length > 0) && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>tech and tools</h2>
              <TagGroup label="tools used for data / transparency / delivery" values={tagList(app.techTools, TECH_TOOL_LABEL)} />
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
                <Field label="years of experience in regenerative agriculture" value={app.yearsExperience} />
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {RUBRIC_SECTIONS.map((section) => {
                  const sectionDefs = RUBRIC_CRITERIA.filter((r) => r.section === section.key);
                  const sectionMax = sectionDefs.reduce((sum, r) => sum + r.maxScore, 0);
                  const sectionScore = criteria
                    .filter((c) => sectionDefs.some((r) => r.key === c.key))
                    .reduce((sum, c) => sum + c.score, 0);
                  const pct = sectionMax > 0 ? (sectionScore / sectionMax) * 100 : 0;
                  const tone = sectionTone(pct);
                  return (
                    <div
                      key={section.key}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}
                    >
                      <span style={{ width: 12, height: 12, flexShrink: 0, background: tone.color }} />
                      <strong style={{ textTransform: 'lowercase' }}>{section.label}</strong>
                      <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{tone.label}</span>
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

          <div id="section-scraper" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-1)' }}>scraper data</h2>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
              checks self-reported claims against independent outside sources — each check below runs and fails independently, manually triggered, never runs on its own.
            </p>
          </div>

          {(
            [
              {
                key: 'opModel' as const,
                label: 'organisation validation (presence in the ecosystem)',
                blurb: 'does outside coverage describe them as working directly with farmers, through partners, or both — matching what they claim?',
                status: app.opModelStatus,
                error: app.opModelError,
                verdict: app.opModelVerdict,
                summary: app.opModelSummary,
                raw: app.opModelRaw,
                model: app.opModelModel,
                runAt: app.opModelRunAt,
              },
              {
                key: 'funders' as const,
                label: 'organisation understanding',
                blurb: 'other agriculture programmes, funding, and annual-report disclosures — pulls funder names from every program in the report, not just the one under review.',
                status: app.fundersStatus,
                error: app.fundersError,
                verdict: app.fundersVerdict,
                summary: app.fundersSummary,
                raw: app.fundersRaw,
                model: app.fundersModel,
                runAt: app.fundersRunAt,
              },
              {
                key: 'founder' as const,
                label: 'founder expertise',
                blurb: 'confirms claimed founder expertise against LinkedIn, Scholar, press, or faculty pages — not just the bio page.',
                status: app.founderStatus,
                error: app.founderError,
                verdict: app.founderVerdict,
                summary: app.founderSummary,
                raw: app.founderRaw,
                model: app.founderModel,
                runAt: app.founderRunAt,
              },
            ] as const
          ).map((check) => {
            const tone = verdictTone(check.verdict);
            return (
              <Card key={check.key} accent style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                  <h2 style={{ fontSize: 'var(--fs-h3)', textTransform: 'lowercase' }}>{check.label}</h2>
                  {user && <ValidateOrgButton applicationId={app.id} section={check.key} hasRun={check.status === 'DONE' || check.status === 'FAILED'} />}
                </div>
                <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>{check.blurb}</p>

                {check.status === 'RUNNING' && (
                  <p style={{ color: 'var(--text-secondary)' }}>running — searching the web for independent sources, this can take up to a minute…</p>
                )}

                {check.status === 'FAILED' && <p style={{ color: 'var(--delta-red)' }}>check failed: {check.error ?? 'unknown error'}</p>}

                {(!check.status || check.status === 'PENDING') && <p style={{ color: 'var(--text-secondary)' }}>not yet run for this application.</p>}

                {check.status === 'DONE' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ width: 12, height: 12, flexShrink: 0, background: tone.color }} />
                      <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{tone.label}</span>
                    </div>
                    {check.summary && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>{check.summary}</p>}
                    {check.raw && (
                      <details style={{ marginTop: 'var(--space-2)' }}>
                        <summary style={{ fontSize: 'var(--fs-caption)', cursor: 'pointer', color: 'var(--text-muted)' }}>view raw</summary>
                        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginTop: 'var(--space-2)' }}>{check.raw}</p>
                      </details>
                    )}
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
                      model: {check.model ?? 'unknown'} · last run {check.runAt ? new Date(check.runAt).toLocaleString('en-GB') : 'unknown'}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}

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

        <div data-pdf-exclude="true">
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

        </div>
      </div>
    </div>
  );
}
