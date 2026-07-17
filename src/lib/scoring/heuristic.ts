import type { Application, Founder, Funder, TechUseCase, ReportLink } from '@prisma/client';
import { RUBRIC_CRITERIA, computeComposite, dispositionFromComposite } from './rubric';
import type { ScoringResult, CriterionScore } from './types';

type ApplicationForHeuristic = Application & {
  founders: Founder[];
  funders: Funder[];
  techUseCases: TechUseCase[];
  reportLinks: ReportLink[];
};

/** snaps a raw numeric estimate onto the rubric's actual 0/1/3/5 band scale — there's no "2" or
 *  "4" in the real rubric, so heuristic estimates must land on one of these four values too. */
function band(n: number): 0 | 1 | 3 | 5 {
  if (n <= 0.5) return 0;
  if (n <= 2) return 1;
  if (n <= 4) return 3;
  return 5;
}

/**
 * Deterministic, rule-based fallback used when ANTHROPIC_API_KEY isn't set —
 * so the prototype still runs end to end with no live credentials. Scores
 * are derived from structured fields only (no language understanding), and
 * are labelled with model "heuristic-fallback-v1" so nobody mistakes this
 * for a real model judgement. Several of the new rubric's 20 criteria (e.g.
 * government linkage, in-house science integration, climate adaptation) have
 * no dedicated structured field on the application form — those default to
 * band 1 here and rely on the real AI/human scoring path for a proper read.
 * Swap out by setting ANTHROPIC_API_KEY.
 */
export function heuristicScore(app: ApplicationForHeuristic): ScoringResult {
  const registeredYears = app.incorporationDate
    ? (Date.now() - new Date(app.incorporationDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    : null;
  const budgetBand = app.annualOperatingBudget ?? '';
  const teamSizeBand = app.teamSize ?? '';
  const hasFounders = app.founders.length > 0;
  const founderTextLen = app.founders.map((f) => f.role ?? '').join(' ').length + (app.operatingModelDescription ?? '').length;
  const funderCount = app.funders.length;

  const hasArchetype = !!app.operatingModelArchetype;
  const descriptionLen = (app.operatingModelDescription ?? '').length;
  const practiceCount = (app.regenerativePractices ?? '').split(';').filter(Boolean).length;
  const cropCount = (app.primaryCrops ?? '').split(';').filter(Boolean).length;

  const techToolCount = (app.techTools ?? '').split(';').filter(Boolean).length;
  const hasTechUseCases = app.techUseCases.length > 0;

  const hasVerifiedImpacts = (app.verifiedImpacts ?? '').length > 60;
  const hasReportLinks = app.reportLinks.length > 0;
  const farmers = app.farmersCount ?? 0;
  const villages = app.villagesCount ?? 0;
  const districts = app.districtsCount ?? 0;
  const hasMel = !!app.melHandling;
  const fundUsageLen = (app.fundUsagePlan ?? '').length;

  const scoreFor: Record<string, 0 | 1 | 3 | 5> = {
    // organisation health
    years_registered: registeredYears === null ? 0 : registeredYears > 5 ? 5 : registeredYears > 3 ? 3 : registeredYears > 1 ? 1 : 0,
    annual_budget: /ABOVE_25CR|CR5_TO_25|CR1_TO_5/.test(budgetBand) ? 5 : /L25_TO_1CR/.test(budgetBand) ? 3 : /UNDER_25L/.test(budgetBand) ? 1 : 0,
    org_size_fte: /S_150_PLUS|S_50_150/.test(teamSizeBand) ? 5 : /S_10_50/.test(teamSizeBand) ? 3 : /S_0_10/.test(teamSizeBand) ? 1 : 0,
    founder_expertise: band((hasFounders ? 2 : 0) + Math.min(founderTextLen / 100, 3)),
    funder_pipeline: funderCount >= 3 ? 3 : funderCount >= 1 ? 1 : 0,
    government_linkage: 1, // no structured field — needs manual/AI read
    market_linkage: 1, // no structured field — needs manual/AI read

    // model and approach
    operating_model_clarity: band((hasArchetype ? 2 : 0) + (descriptionLen > 150 ? 3 : descriptionLen > 40 ? 1.5 : 0)),
    regen_practices_coverage: band(practiceCount),
    climate_adaptation: 1, // no structured field — needs manual/AI read
    crop_specificity: cropCount >= 4 ? 5 : cropCount >= 2 ? 3 : cropCount >= 1 ? 1 : 0,

    // tech and science integration
    tech_use_case_maturity: band((hasTechUseCases ? app.techUseCases.length : 0) * 1.2 + Math.min(techToolCount, 3) * 0.5),
    internal_data_tools: band(Math.min(techToolCount, 4)),
    inhouse_science_integration: 1, // no structured field — needs manual/AI read

    // tangible impact / modality of operations
    verified_impact: band((hasVerifiedImpacts ? 3 : 0) + (hasReportLinks ? 2 : 0)),
    scale: farmers >= 1000 ? 3 : farmers >= 100 ? 1 : 0,
    geographic_depth: districts >= 2 ? 5 : districts >= 1 ? 3 : villages >= 1 ? 1 : 0,
    mel_system: hasMel ? 3 : 0,
    published_evidence: hasReportLinks ? 3 : 0,
    fund_utilization_vision: band(fundUsageLen > 150 ? 4 : fundUsageLen > 40 ? 2 : 0),
  };

  const criteria: CriterionScore[] = RUBRIC_CRITERIA.map((c) => ({
    key: c.key,
    score: scoreFor[c.key] ?? 0,
    rationale: `Heuristic estimate from structured fields (${c.label}) — no language model was consulted.`,
    evidence: excerptFor(app, c.key),
    confidence: 0.35,
  }));

  const composite = computeComposite(Object.fromEntries(criteria.map((c) => [c.key, c.score])));
  const smallholderShare = app.farmersCount ? (app.smallholderFarmersCount ?? 0) / app.farmersCount : 0.5;
  const redFlags: string[] = [];
  if (!app.operatingModelDescription) redFlags.push('no "how it works in practice" description on file');
  if (!app.verifiedImpacts) redFlags.push('no verified impact evidence on file');
  if (app.farmersCount != null && app.smallholderFarmersCount != null && smallholderShare < 0.3) {
    redFlags.push('low share of smallholder (≤2ha) farmers among those reached');
  }

  return {
    criteria,
    eligibility: {
      farmers_reached: app.farmersCount,
      states_operating: app.statesOperating ?? 'not provided',
      hectares_under_practice: app.areaUnderRegenPractice != null ? String(app.areaUnderRegenPractice) : 'not provided',
      fit_notes: 'heuristic fallback — set ANTHROPIC_API_KEY for a real model read on eligibility fit.',
    },
    composite,
    disposition: dispositionFromComposite(composite),
    red_flags: redFlags,
    summary: `Heuristic composite ${composite}/100 from structured fields only — no model was called. Set ANTHROPIC_API_KEY and re-run npm run score:all for a real evaluation.`,
  };
}

function excerptFor(app: ApplicationForHeuristic, key: string): string {
  const preferred =
    key === 'operating_model_clarity' || key === 'regen_practices_coverage'
      ? app.operatingModelDescription
      : key === 'verified_impact'
        ? app.verifiedImpacts
        : key === 'fund_utilization_vision'
          ? app.fundUsagePlan
          : app.aboutSolution ?? app.problemAddressing;
  const candidates = [preferred, app.aboutSolution, app.problemAddressing].filter(
    (t): t is string => !!t && t.trim().length > 3,
  );
  const text = candidates[0] ?? '';
  return text ? text.slice(0, 140) + (text.length > 140 ? '…' : '') : 'no evidence provided';
}
