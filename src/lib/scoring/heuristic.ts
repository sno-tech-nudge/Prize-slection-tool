import type { Application, Founder, Funder, TechUseCase, ReportLink } from '@prisma/client';
import { RUBRIC_CRITERIA, computeComposite, dispositionFromComposite } from './rubric';
import type { ScoringResult, CriterionScore } from './types';

type ApplicationForHeuristic = Application & {
  founders: Founder[];
  funders: Funder[];
  techUseCases: TechUseCase[];
  reportLinks: ReportLink[];
};

/** clamps a 0-1 "how strong is this signal" fraction onto a criterion's own point scale, rounded
 *  to the nearest whole point. */
function points(fraction: number, maxScore: number): number {
  return Math.round(Math.max(0, Math.min(fraction, 1)) * maxScore);
}

/**
 * Deterministic, rule-based fallback used when no AI provider is configured — so the prototype
 * still runs end to end with no live credentials. Scores are derived from structured fields only
 * (no language understanding), and are labelled with model "heuristic-fallback-v1" so nobody
 * mistakes this for a real model judgement. Criteria with no dedicated structured field on the
 * application form (credibility's awards/PR/government angle, science integration, the bonus
 * "extra points" criterion) get a low default fraction here and rely on the real AI/human scoring
 * path for a proper read.
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

  const techToolCount = (app.techTools ?? '').split(';').filter(Boolean).length;
  const hasTechUseCases = app.techUseCases.length > 0;

  const hasVerifiedImpacts = (app.verifiedImpacts ?? '').length > 60;
  const hasReportLinks = app.reportLinks.length > 0;
  const farmers = app.farmersCount ?? 0;
  const villages = app.villagesCount ?? 0;
  const districts = app.districtsCount ?? 0;
  const fundUsageLen = (app.fundUsagePlan ?? '').length;
  const avgLandHolding = app.avgLandHolding ?? null;

  const budgetFrac = /ABOVE_25CR|CR5_TO_25|CR1_TO_5/.test(budgetBand) ? 1 : /L25_TO_1CR/.test(budgetBand) ? 0.6 : /UNDER_25L/.test(budgetBand) ? 0.3 : 0;
  const teamFrac = /S_150_PLUS|S_50_150/.test(teamSizeBand) ? 1 : /S_10_50/.test(teamSizeBand) ? 0.6 : /S_0_10/.test(teamSizeBand) ? 0.3 : 0;
  const yearsFrac = registeredYears === null ? 0 : registeredYears > 5 ? 1 : registeredYears > 3 ? 0.6 : registeredYears > 1 ? 0.3 : 0;
  const fundVisionFrac = fundUsageLen > 150 ? 1 : fundUsageLen > 40 ? 0.5 : 0;
  const founderFrac = Math.min(1, (hasFounders ? 0.4 : 0) + Math.min(founderTextLen / 150, 0.6));
  const funderFrac = funderCount >= 3 ? 1 : funderCount >= 1 ? 0.5 : 0;
  const practiceFrac = Math.min(practiceCount / 5, 1);
  const modelClarityFrac = Math.min(1, (hasArchetype ? 0.3 : 0) + (descriptionLen > 150 ? 0.5 : descriptionLen > 40 ? 0.25 : 0));
  const techFrac = Math.min(1, (hasTechUseCases ? app.techUseCases.length * 0.3 : 0) + Math.min(techToolCount, 3) * 0.15);
  const impactFrac = Math.min(1, (hasVerifiedImpacts ? 0.6 : 0) + (hasReportLinks ? 0.4 : 0));
  const scaleFrac = farmers >= 1000 ? 1 : farmers >= 100 ? 0.5 : 0;
  const geoFrac = districts >= 2 ? 1 : districts >= 1 ? 0.6 : villages >= 1 ? 0.3 : 0;
  // "TG focus: average hectares" — the rubric's own guidance bands map directly onto this field
  // (<1ha: full marks, 1-2ha: partial, >2ha: none), so no proxy fraction is needed here.
  const tgFocusFrac = avgLandHolding === null ? 0.5 : avgLandHolding < 1 ? 1 : avgLandHolding <= 2 ? 0.6 : 0;

  const scoreFor: Record<string, number> = {
    people_strength: points((teamFrac + yearsFrac) / 2, 5),
    quality_of_funding: points((budgetFrac + funderFrac + fundVisionFrac) / 3, 5),
    potential_for_scaling: points((geoFrac + funderFrac) / 2, 10), // no dedicated networks/partnerships field
    expertise_in_agriculture: points(founderFrac, 5),
    credibility: points(0.2, 5), // no structured field (awards/PR/govt buy-in) — needs manual/AI read
    commitment_to_regen_agri: points(modelClarityFrac, 5),
    strength_of_pop: points(practiceFrac, 5),
    robustness_of_model: points(modelClarityFrac * 0.5 + practiceFrac * 0.5, 15),
    tech_integration: points(techFrac, 15),
    science_integration: points(0.2, 10), // no structured field — needs manual/AI read
    verified_impact: points(impactFrac, 5),
    growth_rate_in_regen: points(scaleFrac, 5), // farmers-reached proxy — not a true year-on-year rate
    tg_focus: points(tgFocusFrac, 5),
    extra_points: points(0.2, 5), // subjective bonus — needs manual/AI read
  };

  // USP (maxScore 0) is a free-text, unscored line for human judgement only — the heuristic
  // fallback has nothing structured to estimate it from, so it's left out entirely.
  const criteria: CriterionScore[] = RUBRIC_CRITERIA.filter((c) => c.maxScore > 0).map((c) => ({
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
      fit_notes: 'estimated from structured fields only — pending a full AI or human read for eligibility fit.',
    },
    composite,
    disposition: dispositionFromComposite(composite),
    red_flags: redFlags,
    summary: 'Estimated from structured form fields only — no AI model was consulted for this read.',
  };
}

function excerptFor(app: ApplicationForHeuristic, key: string): string {
  const preferred =
    key === 'robustness_of_model' || key === 'strength_of_pop' || key === 'commitment_to_regen_agri'
      ? app.operatingModelDescription
      : key === 'verified_impact'
        ? app.verifiedImpacts
        : key === 'quality_of_funding'
          ? app.fundUsagePlan
          : app.aboutSolution ?? app.problemAddressing;
  const candidates = [preferred, app.aboutSolution, app.problemAddressing].filter(
    (t): t is string => !!t && t.trim().length > 3,
  );
  const text = candidates[0] ?? '';
  return text ? text.slice(0, 140) + (text.length > 140 ? '…' : '') : 'no evidence provided';
}
