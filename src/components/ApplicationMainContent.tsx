import { Fragment } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, Badge, Tag } from '@/design-system';
import { SectionJumpNav } from '@/components/SectionJumpNav';
import { RescoreButton } from '@/components/RescoreButton';
import { ValidateOrgButton } from '@/components/ValidateOrgButton';
import { SectionScoreInfo } from '@/components/SectionScoreInfo';
import { ExpandableText } from '@/components/ExpandableText';
import type { getApplicationDetail } from '@/lib/applications/queries';
import type { User } from '@prisma/client';
import type { FieldVisibilityConfig } from '@/lib/visibility/settings';
import { parseCriteria, parseRedFlags, parseEligibility } from '@/lib/scoring/parse';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS } from '@/lib/scoring/rubric';
import { computeConsensus } from '@/lib/applications/consensus';
import { ORG_TYPE_LABEL, type OrgTypeValue } from '@/lib/constants';
import {
  TEAM_SIZE_LABEL,
  LEGAL_REGISTRATION_TYPE_LABEL,
  ANNUAL_BUDGET_BAND_LABEL,
  OPERATING_MODEL_ARCHETYPE_LABEL,
  CROP_TYPE_LABEL,
  REGEN_PRACTICE_LABEL,
  TECH_TOOL_LABEL,
  MEL_HANDLING_LABEL,
  type TeamSizeValue,
  type LegalRegistrationTypeValue,
  type AnnualBudgetBandValue,
  type MelHandlingValue,
} from '@/lib/constants';

type ApplicationDetail = NonNullable<Awaited<ReturnType<typeof getApplicationDetail>>>;

function tagList(raw: string | null, labels: Record<string, string>) {
  return raw
    ?.split(';')
    .filter(Boolean)
    .map((v) => labels[v] ?? v);
}

// section-level read at a glance — a red/orange/green line filled to the section's percentage,
// since the AI read is decision support, not a precise verdict a human should defer to.
function sectionTone(pct: number): { color: string } {
  if (pct >= 80) return { color: 'var(--status-good)' };
  if (pct >= 40) return { color: 'var(--status-warn)' };
  return { color: 'var(--status-bad)' };
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
      <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-primary)', lineHeight: 'var(--lh-relaxed)', whiteSpace: 'pre-wrap' }}>{value ?? '—'}</div>
    </div>
  );
}

// missing/NO certificates are a real eligibility risk, not just an empty field — flag them with
// the same warning icon + red text used in the eligibility banners above, instead of plain text.
function certStatus(value: string | null, tone: 'red' | 'yellow' = 'red'): React.ReactNode {
  if (!value || value === 'NO') {
    const color = tone === 'yellow' ? 'var(--delta-yellow)' : 'var(--delta-red)';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color, fontWeight: 'var(--fw-bold)' as unknown as number }}>
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
      <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
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

/** The whole "application record" left column — organisation profile through AI evaluation,
 *  scraper checks, human review score, and jury scores. One unified render path for every role
 *  (admin, reviewer, observer, jury): which fields and sections actually show, and in what order,
 *  is entirely driven by `visibility` (admin's /settings/view config) via `ov()` below — jury and
 *  observer each have their own independent field map and section order over the exact same
 *  registry, so either can be handed anywhere from a couple of fields up to the full admin/
 *  reviewer view. Admin/reviewer are never gated or reordered — `ov()` returns true unconditionally
 *  for them. `canAct` (true only for admin/reviewer) separately gates action buttons (rescore,
 *  validate) and internal-only debug notes, which are permissions concerns, not display ones —
 *  making a field visible to jury/observer never grants them the ability to trigger AI rescoring
 *  or org validation. */
export function ApplicationMainContent({
  app,
  isJury,
  isObserver = false,
  user,
  visibility,
}: {
  app: ApplicationDetail;
  isJury: boolean;
  isObserver?: boolean;
  user: User | null;
  visibility: FieldVisibilityConfig;
}) {
  const latestEval = app.aiEvaluations[0];
  const criteria = latestEval ? parseCriteria(latestEval.criteria) : [];
  const redFlags = latestEval ? parseRedFlags(latestEval.redFlags) : [];
  const eligibility = latestEval ? parseEligibility(latestEval.eligibility) : null;
  const embed = driveEmbedUrl(app.pitchDeckUrl);

  const canAct = !isJury && !isObserver;
  const ov = (key: string) => {
    if (canAct) return true;
    return (isJury ? visibility.jury[key] : visibility.observer[key]) === true;
  };

  const sections: Record<string, () => React.ReactNode> = {
    organisation: () => (
      <div id="section-organisation-profile" key="organisation">
        <Card accent style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>organisation details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {ov('orgType') && <Field label="organisation type" value={ORG_TYPE_LABEL[app.orgType as OrgTypeValue] ?? app.orgType} />}
            {ov('recId') && <Field label="rec_id" value={app.creatorRecordId} />}
            {ov('website') && <Field label="website" value={app.website ? <a href={app.website} target="_blank" rel="noreferrer">{app.website}</a> : undefined} />}
            {ov('linkedinUrl') && <Field label="LinkedIn" value={app.linkedinUrl ? <a href={app.linkedinUrl} target="_blank" rel="noreferrer">{app.linkedinUrl}</a> : undefined} />}
            {ov('incorporationDate') && (
              <Field label="incorporated" value={app.incorporationDate ? new Date(app.incorporationDate).toLocaleDateString('en-GB') : undefined} />
            )}
            {ov('email') && <Field label="email" value={app.email} />}
            {ov('phone') && <Field label="phone" value={app.phone} />}
            {ov('teamSize') && <Field label="team size" value={app.teamSize ? (TEAM_SIZE_LABEL[app.teamSize as TeamSizeValue] ?? app.teamSize) : undefined} />}
          </div>
        </Card>
      </div>
    ),

    synopsis: () => {
      if (!ov('orgSynopsis') || app.internalDecision !== 'YES') return null;
      return (
        <div id="section-ai-summary" key="synopsis">
          <Card accent style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>application synopsis</h2>
            {app.orgSynopsisText && (
              <>
                <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-primary)', lineHeight: 'var(--lh-relaxed)', whiteSpace: 'pre-wrap' }}>
                  {app.orgSynopsisText}
                </p>
                {canAct && app.orgSynopsisModel === 'heuristic-fallback-v1' && (
                  <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                    every configured AI provider failed, so this is a template-built fallback, not a model-generated read
                    {app.orgSynopsisError ? ` (${app.orgSynopsisError})` : ''}.
                  </p>
                )}
              </>
            )}
            {!app.orgSynopsisText && app.orgSynopsisStatus === 'RUNNING' && <p style={{ color: 'var(--text-secondary)' }}>generating…</p>}
            {/* the raw provider error (rate limits, billing details) is only useful to whoever can
             *  act on it via the regenerate button above — jury/observer get the same neutral
             *  message as the not-yet-generated state instead of technical noise they can't fix. */}
            {!app.orgSynopsisText && app.orgSynopsisStatus === 'FAILED' && canAct && (
              <p style={{ color: 'var(--delta-red)' }}>summary generation failed: {app.orgSynopsisError ?? 'unknown error'}</p>
            )}
            {!app.orgSynopsisText && (app.orgSynopsisStatus === 'FAILED' ? !canAct : !app.orgSynopsisStatus || app.orgSynopsisStatus === 'PENDING') && (
              <p style={{ color: 'var(--text-secondary)' }}>summary not available yet.</p>
            )}
          </Card>
        </div>
      );
    },

    foundersFunders: () => {
      const showFounders = ov('founders') && app.founders.length > 0;
      const showFunders = ov('funders') && app.funders.length > 0;
      if (!showFounders && !showFunders) return null;
      return (
        <Card accent key="foundersFunders" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>founders &amp; funders</h2>
          {showFounders && (
            <div style={{ marginBottom: showFunders ? 'var(--space-6)' : 0 }}>
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
          {showFunders && (
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
                    {f.fundingNature && (
                      <div style={{ marginTop: 'var(--space-1)' }}>
                        <ExpandableText text={f.fundingNature} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      );
    },

    problemSolution: () => {
      const anyVisible = (ov('problemAddressing') && app.problemAddressing) || (ov('aboutSolution') && app.aboutSolution) || (ov('valueChainFocus') && app.valueChainFocus);
      if (!anyVisible) return null;
      return (
        <Card accent key="problemSolution" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>problem and solution</h2>
          {ov('problemAddressing') && <Field label="problem addressing" value={app.problemAddressing} />}
          {ov('aboutSolution') && <Field label="about the solution" value={app.aboutSolution} />}
          {ov('valueChainFocus') && <TagGroup label="value chain focus" values={app.valueChainFocus?.split(';').map((v) => v.trim()).filter(Boolean)} />}
        </Card>
      );
    },

    agwaterLegacy: () => {
      const anyVisible =
        (ov('waterEfficiencyFocus') && app.waterEfficiencyFocus) ||
        (ov('smallMarginalFarmerPct') && app.smallMarginalFarmerPct !== null) ||
        (ov('areaHectaresRaw') && app.areaHectaresRaw);
      if (!anyVisible) return null;
      return (
        <Card accent key="agwaterLegacy" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>impact and eligibility signals (AgWater cycle)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {ov('beneficiaries') && <Field label="beneficiaries" value={app.beneficiaries} />}
            {ov('smallMarginalFarmerPct') && <Field label="small/marginal farmer share" value={app.smallMarginalFarmerPct !== null ? `${app.smallMarginalFarmerPct}%` : undefined} />}
            {ov('areaHectaresRaw') && <Field label="area under coverage" value={app.areaHectaresRaw} />}
            {ov('trl') && <Field label="TRL" value={app.trl} />}
            {ov('waterEfficiencyFocus') && <Field label="water-use efficiency focus" value={app.waterEfficiencyFocus} />}
            {ov('waterEfficiencyEstimate') && <Field label="water efficiency estimate" value={app.waterEfficiencyEstimate} />}
            {ov('cropProductionFocus') && <Field label="crop production focus" value={app.cropProductionFocus} />}
            {ov('focusCrops') && <Field label="focus crops" value={app.focusCrops} />}
          </div>
        </Card>
      );
    },

    registrationsGovernance: () => {
      const anyVisible =
        (ov('legalRegistrationType') && app.legalRegistrationType) ||
        (ov('fcraStatus') && app.fcraStatus) ||
        (ov('annualOperatingBudget') && app.annualOperatingBudget) ||
        (ov('cert12A') && app.cert12A) ||
        (ov('cert80G') && app.cert80G) ||
        (ov('csr1Registration') && app.csr1Registration) ||
        (ov('darpanRegistered') && app.darpanRegistered) ||
        (ov('darpanIdNumber') && app.darpanIdNumber);
      if (!anyVisible) return null;
      return (
        <Card accent key="registrationsGovernance" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>registrations and governance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {ov('legalRegistrationType') && (
              <Field
                label="legal registration type"
                value={app.legalRegistrationType ? (LEGAL_REGISTRATION_TYPE_LABEL[app.legalRegistrationType as LegalRegistrationTypeValue] ?? app.legalRegistrationType) : undefined}
              />
            )}
            {ov('annualOperatingBudget') && (
              <Field
                label="annual operating budget"
                value={app.annualOperatingBudget ? (ANNUAL_BUDGET_BAND_LABEL[app.annualOperatingBudget as AnnualBudgetBandValue] ?? app.annualOperatingBudget) : undefined}
              />
            )}
            {ov('fcraStatus') && <Field label="FCRA registration" value={app.fcraStatus} />}
            {ov('cert12A') && <Field label="12A certificate" value={certStatus(app.cert12A)} />}
            {ov('cert80G') && <Field label="80G certificate" value={certStatus(app.cert80G)} />}
            {ov('csr1Registration') && <Field label="CSR-1 registration" value={certStatus(app.csr1Registration)} />}
            {ov('darpanRegistered') && <Field label="NITI Aayog DARPAN ID" value={certStatus(app.darpanRegistered, 'yellow')} />}
            {ov('darpanIdNumber') && <Field label="DARPAN registration number" value={app.darpanIdNumber} />}
          </div>
        </Card>
      );
    },

    model: () => {
      const anyVisible =
        (ov('operatingModelArchetype') && app.operatingModelArchetype) ||
        (ov('operatingModelDescription') && app.operatingModelDescription) ||
        (ov('primaryCrops') && app.primaryCrops) ||
        (ov('regenerativePractices') && app.regenerativePractices) ||
        (ov('adoptionHurdle') && app.adoptionHurdle);
      if (!anyVisible) return null;
      return (
        <div id="section-model" key="model">
          <Card accent style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>model</h2>
            {ov('operatingModelArchetype') && <TagGroup label="operating model archetype" values={tagList(app.operatingModelArchetype, OPERATING_MODEL_ARCHETYPE_LABEL)} />}
            {ov('operatingModelDescription') && (
              <Field label="how it works in practice" value={app.operatingModelDescription ? <ExpandableText text={app.operatingModelDescription} /> : undefined} />
            )}
            {ov('primaryCrops') && <TagGroup label="primary crops" values={tagList(app.primaryCrops, CROP_TYPE_LABEL)} />}
            {ov('regenerativePractices') && <TagGroup label="regenerative practices" values={tagList(app.regenerativePractices, REGEN_PRACTICE_LABEL)} />}
            {ov('adoptionHurdle') && (
              <Field label="biggest adoption hurdle" value={app.adoptionHurdle ? <ExpandableText text={app.adoptionHurdle} /> : undefined} />
            )}
          </Card>
        </div>
      );
    },

    techTools: () => {
      const anyVisible = (ov('techTools') && app.techTools) || (ov('otherTools') && app.otherTools) || (ov('techTools') && app.techToolsInternal !== null) || (ov('techUseCases') && app.techUseCases.length > 0);
      if (!anyVisible) return null;
      return (
        <div id="section-tech-and-tools" key="techTools">
          <Card accent style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>tech and tools</h2>
            {ov('techTools') && <TagGroup label="tools used for data / transparency / delivery" values={tagList(app.techTools, TECH_TOOL_LABEL)} />}
            {ov('techTools') && <Field label="tools developed internally" value={app.techToolsInternal === null ? undefined : app.techToolsInternal ? 'yes' : 'no'} />}
            {ov('otherTools') && <Field label="other tools" value={app.otherTools} />}
            {ov('techUseCases') && app.techUseCases.length > 0 && (
              <Field label="top tech use cases" value={<ExpandableText text={app.techUseCases.map((t) => t.description).join('; ')} />} />
            )}
          </Card>
        </div>
      );
    },

    experienceImpact: () => {
      const anyVisible =
        (ov('farmersCount') && app.farmersCount !== null) ||
        (ov('yearsExperience') && app.yearsExperience !== null) ||
        (ov('verifiedImpacts') && app.verifiedImpacts) ||
        (ov('statesOperating') && app.statesOperating) ||
        (ov('fundUsagePlan') && app.fundUsagePlan) ||
        (ov('reportLinks') && app.reportLinks.length > 0) ||
        (ov('villagesDistricts') && app.villagesDistrictsRaw) ||
        (ov('otherDevelopmentAreas') && app.otherDevelopmentAreas) ||
        (ov('teamTrainingDescription') && app.teamTrainingDescription) ||
        (ov('heardAboutChallenge') && app.heardAboutChallenge);
      if (!anyVisible) return null;
      return (
        <div id="section-experience-impact" key="experienceImpact">
          <Card accent style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>metrics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              {ov('yearsExperience') && <Field label="years of experience in regenerative agriculture" value={app.yearsExperience} />}
              {ov('farmersCount') && <Field label="farmers reached" value={app.farmersCount} />}
              {ov('smallholderFarmersCount') && <Field label="of which smallholder (≤2ha)" value={app.smallholderFarmersCount} />}
              {ov('avgLandHolding') && <Field label="average land holding (ha)" value={app.avgLandHolding} />}
              {ov('areaUnderRegenPractice') && <Field label="area under regenerative practice (ha)" value={app.areaUnderRegenPractice} />}
              {ov('villagesDistricts') && (
                <Field
                  label="villages / districts"
                  value={app.villagesDistrictsRaw ?? (app.villagesCount ?? app.districtsCount ? `${app.villagesCount ?? '—'} villages, ${app.districtsCount ?? '—'} districts` : undefined)}
                />
              )}
              {ov('melHandling') && <Field label="MEL handled" value={app.melHandling ? (MEL_HANDLING_LABEL[app.melHandling as MelHandlingValue] ?? app.melHandling) : undefined} />}
              {ov('materialsInLocalLanguages') && (
                <Field label="materials in local languages" value={app.materialsInLocalLanguages === null ? undefined : app.materialsInLocalLanguages ? 'yes' : 'no'} />
              )}
              {ov('teamFormalTraining') && <Field label="team formally trained" value={app.teamFormalTraining === null ? undefined : app.teamFormalTraining ? 'yes' : 'no'} />}
              {ov('worksBeyondAg') && <Field label="works beyond agriculture" value={app.worksBeyondAg === null ? undefined : app.worksBeyondAg ? 'yes' : 'no'} />}
              {ov('infoAccurateConfirmed') && (
                <Field label="info confirmed accurate by applicant" value={app.infoAccurateConfirmed === null ? undefined : app.infoAccurateConfirmed ? 'yes' : 'no'} />
              )}
            </div>
            {ov('teamTrainingDescription') && <Field label="team training details" value={app.teamTrainingDescription} />}
            {ov('otherDevelopmentAreas') && <Field label="other development work beyond agriculture" value={app.otherDevelopmentAreas} />}
            {ov('statesOperating') && <Field label="states / UTs of operation" value={tagList(app.statesOperating, {})?.join(', ')} />}
            {ov('verifiedImpacts') && (
              <Field label="verified impacts" value={app.verifiedImpacts ? <ExpandableText text={app.verifiedImpacts} /> : undefined} />
            )}
            {ov('fundUsagePlan') && (
              <Field label="planned use of prize funds" value={app.fundUsagePlan ? <ExpandableText text={app.fundUsagePlan} /> : undefined} />
            )}
            {ov('heardAboutChallenge') && (
              <Field label="how they heard about the challenge" value={[tagList(app.heardAboutChallenge, {})?.join(', '), app.otherHeardAbout].filter(Boolean).join(' — ') || undefined} />
            )}
            {ov('reportLinks') && app.reportLinks.length > 0 && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
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
        </div>
      );
    },

    enrichment: () => {
      if (!ov('enrichmentSummary') || !app.enrichmentSummary) return null;
      return (
        <Card key="enrichment" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)' }}>public-data enrichment</h2>
            <Badge tone="outline">{app.enrichmentSource === 'website+search' ? 'website + search' : 'website'}</Badge>
          </div>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', whiteSpace: 'pre-wrap' }}>{app.enrichmentSummary}</p>
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
            fetched from {app.website}. this is supporting context for AI scoring, not a substitute for the application itself.
          </p>
        </Card>
      );
    },

    pitchDeck: () => {
      if (!ov('pitchDeckUrl') || !app.pitchDeckUrl) return null;
      return embed ? (
        <Card accent key="pitchDeck" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>pitch deck</h2>
          <iframe src={embed} width="100%" height="480" style={{ border: 'none' }} allow="autoplay" />
        </Card>
      ) : (
        <Card key="pitchDeck" style={{ marginBottom: 'var(--space-6)' }}>
          <a href={app.pitchDeckUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--delta-red)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
            open pitch deck ↗
          </a>
        </Card>
      );
    },

    aiScoring: () => {
      const showEval = ov('aiEvaluation');
      const showScraper = ov('scraperChecks');
      if (!showEval && !showScraper) return null;
      return (
        <Fragment key="aiScoring">
          {showEval && (
            <>
              <div id="section-scoring" style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>scoring &amp; evaluation</h2>
                <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
                  AI read below is decision support only — use the &ldquo;review&rdquo; button above to score this application yourself.
                </p>
              </div>
              {latestEval && (
                <Card accent style={{ marginBottom: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <h2 style={{ fontSize: 'var(--fs-h3)' }}>AI evaluation</h2>
                    {user && canAct && <RescoreButton applicationId={app.id} />}
                  </div>

                  {latestEval.summary && <p style={{ marginBottom: 'var(--space-4)', whiteSpace: 'pre-wrap' }}>{latestEval.summary}</p>}

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
                          <strong style={{ textTransform: 'lowercase', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            {section.label}
                            <SectionScoreInfo sectionLabel={section.label} sectionKey={section.key} criteria={criteria} />
                          </strong>
                          <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${Math.max(pct, 4)}%`, background: tone.color }} />
                          </div>
                          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', flexShrink: 0 }}>{Math.round(pct)}%</span>
                        </div>
                      );
                    })}
                  </div>

                  {eligibility && (
                    <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                      eligibility notes: {eligibility.fit_notes}
                    </p>
                  )}
                </Card>
              )}

              {!latestEval && user && (
                <Card style={{ marginBottom: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>this application hasn&apos;t been scored yet.</p>
                    {canAct && <RescoreButton applicationId={app.id} />}
                  </div>
                </Card>
              )}
            </>
          )}

          {showScraper && (
            <>
              <div id="section-scraper" style={{ marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>scraper data</h2>
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
                      {user && canAct && <ValidateOrgButton applicationId={app.id} section={check.key} hasRun={check.status === 'DONE' || check.status === 'FAILED'} />}
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
                        {check.summary && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', whiteSpace: 'pre-wrap' }}>{check.summary}</p>}
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
            </>
          )}

          {ov('humanReviewScores') && app.humanReviews.length > 0 && (
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontSize: 'var(--fs-h3)' }}>score</h2>
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
                    <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Fragment>
      );
    },

    internalReview: () => {
      // admin/reviewer already get the fuller "score" card above (aiScoring's humanReviewScores) —
      // this simpler comment-only card is only for jury/observer.
      if (canAct || !ov('internalReviewerRemarks')) return null;
      return (
        <div id="section-internal-reviewer-remarks" key="internalReview">
          <Card accent style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>internal reviewer remarks</h2>
            {app.humanReviews[0]?.comment ? (
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{app.humanReviews[0].comment}</p>
            ) : (
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no reviewer remarks yet.</p>
            )}
          </Card>
        </div>
      );
    },
  };

  // reordering is a jury/observer-only affordance (per the settings UI) — admin/reviewer always
  // get the fixed, familiar registry order regardless of what's saved for either role.
  const order = canAct ? Object.keys(sections) : isJury ? visibility.jurySectionOrder : visibility.observerSectionOrder;

  const excludeIds = [
    ...(!canAct && ov('internalReviewerRemarks') ? [] : ['section-internal-reviewer-remarks']),
    ...(ov('aiEvaluation') ? [] : ['section-scoring']),
    ...(ov('scraperChecks') ? [] : ['section-scraper']),
  ];

  return (
    <div>
      <SectionJumpNav excludeIds={excludeIds} />
      <div>
        {order.map((key) => (
          <Fragment key={key}>{sections[key]?.()}</Fragment>
        ))}
      </div>
    </div>
  );
}
