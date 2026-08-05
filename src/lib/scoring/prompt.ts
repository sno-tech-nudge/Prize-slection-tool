import type { Application, Founder, Funder, TechUseCase, ReportLink } from '@prisma/client';
import { RUBRIC_CRITERIA } from './rubric';
import {
  TEAM_SIZE_LABEL,
  LEGAL_REGISTRATION_TYPE_LABEL,
  ANNUAL_BUDGET_BAND_LABEL,
  OPERATING_MODEL_ARCHETYPE_LABEL,
  MEL_HANDLING_LABEL,
  type TeamSizeValue,
} from '@/lib/constants';

export type ApplicationForScoring = Application & {
  founders: Founder[];
  funders: Funder[];
  techUseCases: TechUseCase[];
  reportLinks: ReportLink[];
};

export const CHALLENGE_STATEMENT =
  'Accelerate soil regeneration for India’s farmers: double soil organic carbon within 24 months and increase ' +
  'smallholder farmer net incomes by at least 25% through tech-enabled, replicable transition models for regenerative ' +
  'agriculture, reaching 5,000 to 10,000 farmers across at least 5,000 hectares within a cluster.';

export const SYSTEM_PROMPT = `You are a rigorous, sceptical evaluator for the^delta prize's rapid re.gen challenge — a \
the/nudge institute open innovation challenge accelerating soil regeneration for India's farmers. You score applications \
against a fixed rubric. You are decision SUPPORT, not the decision-maker: a human reviewer always makes the final call. \
Be concrete, quote the application's own words as evidence, and flag unsubstantiated claims plainly. Respond with ONLY \
valid JSON. No preamble, no markdown code fences, no commentary outside the JSON object.`;

function label<T extends string>(map: Record<T, string>, value: string | null, fallback = 'not provided'): string {
  return value ? map[value as T] ?? value : fallback;
}

export function buildUserPrompt(app: ApplicationForScoring): string {
  const criteriaList = RUBRIC_CRITERIA.map((c) => {
    const points = c.description.map((d) => `    - ${d}`).join('\n');
    return `- ${c.key} (${c.label}) — score as a whole number from 0 to ${c.maxScore}:\n${points}`;
  }).join('\n');

  return `CHALLENGE STATEMENT:
${CHALLENGE_STATEMENT}

RUBRIC — each criterion has its OWN point scale (not a shared 0-5): score it as a whole number \
between 0 and its maximum, based on how strongly the application demonstrates the points listed under \
it. Give a one-sentence rationale, a short quoted evidence excerpt from the application text below (or \
"no evidence provided" if none exists), and a confidence 0-1:
${criteriaList}

APPLICATION — organisation profile:
Organisation: ${app.orgName}
Organisation type: ${app.orgType}
Legal registration type: ${label(LEGAL_REGISTRATION_TYPE_LABEL, app.legalRegistrationType)}
FCRA registration: ${app.fcraStatus ?? 'not provided'}
12A certificate: ${app.cert12A ?? 'not provided'}
80G certificate: ${app.cert80G ?? 'not provided'}
CSR-1 registration: ${app.csr1Registration ?? 'not provided'}
NITI Aayog DARPAN ID: ${app.darpanRegistered ?? 'not provided'}
Annual operating budget: ${label(ANNUAL_BUDGET_BAND_LABEL, app.annualOperatingBudget)}
Team size: ${app.teamSize ? TEAM_SIZE_LABEL[app.teamSize as TeamSizeValue] ?? app.teamSize : 'not provided'}
Founders: ${app.founders.map((f) => `${f.fullName}${f.role ? ` (${f.role})` : ''}`).join('; ') || 'not provided'}
Funders: ${app.funders.map((f) => f.name).join('; ') || 'not provided'}

APPLICATION — model:
Operating model archetype: ${label(OPERATING_MODEL_ARCHETYPE_LABEL, app.operatingModelArchetype)}
How it works in practice: ${app.operatingModelDescription ?? 'not provided'}
Primary crops: ${app.primaryCrops ?? 'not provided'}
Regenerative practices covered: ${app.regenerativePractices ?? 'not provided'}
Biggest adoption hurdle (in the applicant's own words): ${app.adoptionHurdle ?? 'not provided'}

APPLICATION — tech and tools:
Tools used for data / transparency / delivery: ${app.techTools ?? 'not provided'}
Tools developed internally: ${app.techToolsInternal === null ? 'not provided' : app.techToolsInternal ? 'yes' : 'no'}
Top tech use cases: ${app.techUseCases.map((t) => t.description).join('; ') || 'not provided'}

APPLICATION — experience and impact:
Years of experience in regenerative / sustainable agriculture: ${app.yearsExperience ?? 'not provided'}
Verified impacts described (baseline/endline/sample size/verification method expected): ${app.verifiedImpacts ?? 'not provided'}
States / UTs of operation: ${app.statesOperating ?? 'not provided'}
Farmers currently reached: ${app.farmersCount ?? 'not provided'}
Of which smallholder (≤2 ha): ${app.smallholderFarmersCount ?? 'not provided'}
Average land holding (ha): ${app.avgLandHolding ?? 'not provided'}
Area under regenerative practice (ha): ${app.areaUnderRegenPractice ?? 'not provided'}
Villages active: ${app.villagesCount ?? 'not provided'} · Districts active: ${app.districtsCount ?? 'not provided'}
Work extends beyond regenerative agriculture: ${app.worksBeyondAg === null ? 'not provided' : app.worksBeyondAg ? 'yes' : 'no'}
Materials/training in local languages: ${app.materialsInLocalLanguages === null ? 'not provided' : app.materialsInLocalLanguages ? 'yes' : 'no'}
Team formally trained in regenerative / agroecological practice: ${app.teamFormalTraining === null ? 'not provided' : app.teamFormalTraining ? 'yes' : 'no'}
Monitoring, Evaluation & Learning handled: ${label(MEL_HANDLING_LABEL, app.melHandling)}
Published reports / case studies: ${app.reportLinks.map((r) => r.url).join('; ') || 'not provided'}
Planned use of prize funds: ${app.fundUsagePlan ?? 'not provided'}

Problem being addressed / about the solution (free text from the applicant, if provided):
${app.problemAddressing ?? app.aboutSolution ?? 'not provided'}

Public-data enrichment (fetched independently from the applicant's own website — corroborating
evidence only, weigh it lightly against unsubstantiated self-reported claims above):
${app.enrichmentSummary ?? 'no enrichment data available'}

RESPOND WITH ONLY THIS JSON SHAPE (no other text):
{
  "criteria": [
    {"key": "people_strength", "score": 0, "rationale": "", "evidence": "", "confidence": 0.0}
    // ... one entry per rubric key above, in the same order
  ],
  "eligibility": {"farmers_reached": 0, "states_operating": "", "hectares_under_practice": "", "fit_notes": ""},
  "composite": 0,
  "disposition": "STRONG_ADVANCE | ADVANCE | BORDERLINE | REJECT",
  "red_flags": ["unsubstantiated impact claim", "no verification method given", "geography mismatch"],
  "summary": "two-sentence plain-language take"
}`;
}
