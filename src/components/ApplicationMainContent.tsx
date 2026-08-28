import { AlertTriangle } from 'lucide-react';
import { Card, Badge, Tag } from '@/design-system';
import { SectionJumpNav } from '@/components/SectionJumpNav';
import { RescoreButton } from '@/components/RescoreButton';
import { ValidateOrgButton } from '@/components/ValidateOrgButton';
import { RegenerateSynopsisButton } from '@/components/RegenerateSynopsisButton';
import { SectionScoreInfo } from '@/components/SectionScoreInfo';
import type { getApplicationDetail } from '@/lib/applications/queries';
import type { User } from '@prisma/client';
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

/** The real JURY role's entire application view, deliberately separate from the shared tree below
 *  rather than threaded through it with per-field conditionals — per the jury view field sheet,
 *  jury sees exactly four sections (organisation details, application synopsis, metrics, plus
 *  "internal reviewer remarks" rendered by the page itself in the sidebar) and nothing else. A
 *  dedicated component makes that a closed list: a new field added to the shared admin/reviewer
 *  tree can't leak into jury's view by accident. Observer is NOT this — observer still gets the
 *  fuller shared tree below, just with AI evaluation/scraper/scoring hidden. */
function JuryApplicationView({ app }: { app: ApplicationDetail }) {
  return (
    <div>
      <SectionJumpNav
        excludeIds={['section-model', 'section-tech-and-tools', 'section-scoring', 'section-scraper']}
        labelOverrides={{
          'section-organisation-profile': 'organisation details',
          'section-experience-impact': 'metrics',
          'section-ai-summary': 'application synopsis',
        }}
      />

      <div id="section-organisation-profile">
        <Card accent style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>organisation details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Field label="organisation name" value={app.orgName} />
            <Field label="website" value={app.website ? <a href={app.website} target="_blank" rel="noreferrer">{app.website}</a> : undefined} />
            <Field label="year of incorporation" value={app.incorporationDate ? new Date(app.incorporationDate).toLocaleDateString('en-GB') : undefined} />
            <Field
              label="legal registration"
              value={app.legalRegistrationType ? (LEGAL_REGISTRATION_TYPE_LABEL[app.legalRegistrationType as LegalRegistrationTypeValue] ?? app.legalRegistrationType) : undefined}
            />
            <Field
              label="annual operating budget"
              value={app.annualOperatingBudget ? (ANNUAL_BUDGET_BAND_LABEL[app.annualOperatingBudget as AnnualBudgetBandValue] ?? app.annualOperatingBudget) : undefined}
            />
            <Field label="team size" value={app.teamSize ? (TEAM_SIZE_LABEL[app.teamSize as TeamSizeValue] ?? app.teamSize) : undefined} />
          </div>
          {app.founders.length > 0 && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                founders
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {app.founders.map((f) => (
                  <div key={f.id} style={{ fontSize: 'var(--fs-small)' }}>
                    <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-primary)' }}>{f.fullName}</div>
                    <div style={{ marginTop: 'var(--space-1)' }}>
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
        </Card>
      </div>

      <div id="section-ai-summary">
        {app.internalDecision === 'YES' && (
          <Card accent style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>application synopsis</h2>
            {app.orgSynopsisText && (
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-primary)', lineHeight: 'var(--lh-relaxed)', whiteSpace: 'pre-wrap' }}>{app.orgSynopsisText}</p>
            )}
            {!app.orgSynopsisText && app.orgSynopsisStatus === 'RUNNING' && <p style={{ color: 'var(--text-secondary)' }}>generating…</p>}
            {!app.orgSynopsisText && app.orgSynopsisStatus !== 'RUNNING' && <p style={{ color: 'var(--text-secondary)' }}>summary not available yet.</p>}
          </Card>
        )}
      </div>

      <div id="section-experience-impact">
        {(app.yearsExperience !== null ||
          app.farmersCount !== null ||
          app.smallholderFarmersCount !== null ||
          app.avgLandHolding !== null ||
          app.areaUnderRegenPractice !== null ||
          app.statesOperating ||
          app.verifiedImpacts) && (
          <Card accent style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>metrics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Field label="years in regenerative agriculture" value={app.yearsExperience} />
              <Field label="farmers reached" value={app.farmersCount} />
              <Field label="smallholder farmers reached" value={app.smallholderFarmersCount} />
              <Field label="area under regenerative agriculture" value={app.areaUnderRegenPractice} />
              <Field label="average land holding (ha)" value={app.avgLandHolding} />
              <Field label="geography coverage" value={tagList(app.statesOperating, {})?.join(', ')} />
              <Field label="self reported impact" value={app.verifiedImpacts} />
            </div>
          </Card>
        )}
      </div>

      <div id="section-internal-reviewer-remarks">
        <Card accent style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>internal reviewer remarks</h2>
          {app.humanReviews[0]?.comment ? (
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{app.humanReviews[0].comment}</p>
          ) : (
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no reviewer remarks yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

/** The whole "application record" left column — organisation profile through AI evaluation,
 *  scraper checks, human review score, and jury scores. Shared between the regular admin
 *  application page and the internal jury-dashboard page so both render identically; `isJury`
 *  controls whether the AI evaluation / scraper-data / public-data enrichment sections are shown
 *  (jury and observer never see them, on either page) — the application detail page passes this
 *  true for OBSERVER-role viewers too, since the two roles are meant to see an identical
 *  restricted slice there. The real JURY role (`isJury && !isObserver`) doesn't render any of this
 *  — see JuryApplicationView above, a fully separate closed-list view per the jury view field
 *  sheet. Observer still gets everything below, just with `isJury`'s usual internal-only cuts. */
export function ApplicationMainContent({
  app,
  isJury,
  isObserver = false,
  user,
}: {
  app: ApplicationDetail;
  isJury: boolean;
  isObserver?: boolean;
  user: User | null;
}) {
  if (isJury && !isObserver) {
    return <JuryApplicationView app={app} />;
  }

  const latestEval = app.aiEvaluations[0];
  const criteria = latestEval ? parseCriteria(latestEval.criteria) : [];
  const redFlags = latestEval ? parseRedFlags(latestEval.redFlags) : [];
  const eligibility = latestEval ? parseEligibility(latestEval.eligibility) : null;
  const embed = driveEmbedUrl(app.pitchDeckUrl);

  return (
    <div>
      <SectionJumpNav excludeIds={isJury ? ['section-internal-reviewer-remarks', 'section-scoring', 'section-scraper'] : ['section-internal-reviewer-remarks']} />
      <div id="section-organisation-profile">
      <Card accent style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>organisation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <Field label="organisation type" value={ORG_TYPE_LABEL[app.orgType as OrgTypeValue] ?? app.orgType} />
          {!isObserver && !isJury && <Field label="rec_id" value={app.creatorRecordId} />}
          <Field label="website" value={app.website ? <a href={app.website} target="_blank" rel="noreferrer">{app.website}</a> : undefined} />
          <Field label="LinkedIn" value={app.linkedinUrl ? <a href={app.linkedinUrl} target="_blank" rel="noreferrer">{app.linkedinUrl}</a> : undefined} />
          <Field
            label="incorporated"
            value={app.incorporationDate ? new Date(app.incorporationDate).toLocaleDateString('en-GB') : undefined}
          />
          <Field label="email" value={app.email} />
          <Field label="phone" value={app.phone} />
          <Field label="team size" value={app.teamSize ? (TEAM_SIZE_LABEL[app.teamSize as TeamSizeValue] ?? app.teamSize) : undefined} />
        </div>
      </Card>

      <div id="section-ai-summary">
      {app.internalDecision === 'YES' && (
        <Card accent style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)', gap: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)' }}>AI summary</h2>
            {user && !isJury && (
              <RegenerateSynopsisButton applicationId={app.id} hasRun={app.orgSynopsisStatus === 'DONE' || app.orgSynopsisStatus === 'FAILED'} />
            )}
          </div>
          {app.orgSynopsisText && (
            <>
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-primary)', lineHeight: 'var(--lh-relaxed)', whiteSpace: 'pre-wrap' }}>
                {app.orgSynopsisText}
              </p>
              {!isJury && app.orgSynopsisModel === 'heuristic-fallback-v1' && (
                <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                  every configured AI provider failed, so this is a template-built fallback, not a model-generated read
                  {app.orgSynopsisError ? ` (${app.orgSynopsisError})` : ''}. regenerate once the provider issue clears for a real AI summary.
                </p>
              )}
            </>
          )}
          {!app.orgSynopsisText && app.orgSynopsisStatus === 'RUNNING' && <p style={{ color: 'var(--text-secondary)' }}>generating…</p>}
          {/* the raw provider error (rate limits, billing details) is only useful to whoever can
           *  act on it via the regenerate button above — observer gets the same neutral message as
           *  the not-yet-generated state instead of technical noise they can't fix. */}
          {!app.orgSynopsisText && app.orgSynopsisStatus === 'FAILED' && !isJury && (
            <p style={{ color: 'var(--delta-red)' }}>summary generation failed: {app.orgSynopsisError ?? 'unknown error'}</p>
          )}
          {!app.orgSynopsisText && (app.orgSynopsisStatus === 'FAILED' ? isJury : !app.orgSynopsisStatus || app.orgSynopsisStatus === 'PENDING') && (
            <p style={{ color: 'var(--text-secondary)' }}>summary not available yet.</p>
          )}
        </Card>
      )}
      </div>

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
                    {f.fundingNature && <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0', whiteSpace: 'pre-wrap' }}>{f.fundingNature}</p>}
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
            <Field label="NITI Aayog DARPAN ID" value={certStatus(app.darpanRegistered, 'yellow')} />
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

      {!isObserver && app.enrichmentSummary && (
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)' }}>public-data enrichment</h2>
            <Badge tone="outline">{app.enrichmentSource === 'website+search' ? 'website + search' : 'website'}</Badge>
          </div>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', whiteSpace: 'pre-wrap' }}>{app.enrichmentSummary}</p>
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
      {!isJury && (
        <>
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

      {!isJury && app.humanReviews.length > 0 && (
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

    </div>
  );
}
