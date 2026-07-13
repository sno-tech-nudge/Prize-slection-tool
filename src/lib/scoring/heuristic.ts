import type { Application, Founder, Funder, TechUseCase, ReportLink } from '@prisma/client';
import { RUBRIC_CRITERIA, computeComposite, dispositionFromComposite } from './rubric';
import type { ScoringResult, CriterionScore } from './types';

type ApplicationForHeuristic = Application & {
  founders: Founder[];
  funders: Funder[];
  techUseCases: TechUseCase[];
  reportLinks: ReportLink[];
};

/**
 * Deterministic, rule-based fallback used when ANTHROPIC_API_KEY isn't set —
 * so the prototype still runs end to end with no live credentials. Scores
 * are derived from structured fields only (no language understanding), and
 * are labelled with model "heuristic-fallback-v1" so nobody mistakes this
 * for a real model judgement. Swap out by setting ANTHROPIC_API_KEY.
 */
export function heuristicScore(app: ApplicationForHeuristic): ScoringResult {
  const hasArchetype = !!app.operatingModelArchetype;
  const descriptionLen = (app.operatingModelDescription ?? '').length;
  const practiceCount = (app.regenerativePractices ?? '').split(';').filter(Boolean).length;
  const hasAdoptionHurdle = (app.adoptionHurdle ?? '').length > 40;
  const farmers = app.farmersCount ?? 0;
  const smallholderShare = app.farmersCount ? (app.smallholderFarmersCount ?? 0) / app.farmersCount : 0.5;
  const area = app.areaUnderRegenPractice ?? 0;
  const villages = app.villagesCount ?? 0;
  const hasVerifiedImpacts = (app.verifiedImpacts ?? '').length > 60;
  const hasReportLinks = app.reportLinks.length > 0;
  const yearsExperience = app.yearsExperience ?? 0;
  const registrations = [app.fcraStatus, app.cert12A, app.cert80G, app.csr1Registration].filter((s) => s === 'YES').length;
  const hasFunders = app.funders.length > 0;
  const techToolCount = (app.techTools ?? '').split(';').filter(Boolean).length;
  const hasTechUseCases = app.techUseCases.length > 0;
  const hasFounders = app.founders.length > 0;
  const hasFormalTraining = app.teamFormalTraining === true;
  const hasMel = !!app.melHandling;
  const hasLocalLanguage = app.materialsInLocalLanguages === true;
  const fundUsageLen = (app.fundUsagePlan ?? '').length;

  const scoreFor: Record<string, number> = {
    model_clarity: clamp5((hasArchetype ? 1.5 : 0) + (descriptionLen > 150 ? 2.5 : descriptionLen > 40 ? 1.5 : 0.5) + 1),
    regenerative_depth: clamp5(practiceCount * 0.5 + (hasAdoptionHurdle ? 1.5 : 0.5)),
    scale_and_reach: clamp5(1 + Math.min(farmers, 10000) / 2500 + smallholderShare * 1.5 + Math.min(villages, 20) / 10 + Math.min(area, 5000) / 2000),
    verified_impact: clamp5((hasVerifiedImpacts ? 2.5 : 0.5) + (hasReportLinks ? 1.5 : 0) + Math.min(yearsExperience, 10) / 4),
    org_credibility: clamp5(1 + registrations * 0.7 + (hasFunders ? 1.5 : 0)),
    tech_and_data_maturity: clamp5(1 + Math.min(techToolCount, 4) * 0.6 + (hasTechUseCases ? 1.5 : 0)),
    team_and_execution: clamp5((hasFounders ? 1.5 : 0.5) + (hasFormalTraining ? 1.2 : 0) + (hasMel ? 1.2 : 0) + (hasLocalLanguage ? 1 : 0)),
    fund_utilization: clamp5(fundUsageLen > 150 ? 3.5 : fundUsageLen > 40 ? 2 : 0.5),
  };

  const criteria: CriterionScore[] = RUBRIC_CRITERIA.map((c) => ({
    key: c.key,
    score: Math.round((scoreFor[c.key] ?? 0) * 10) / 10,
    rationale: `Heuristic estimate from structured fields (${c.label}) — no language model was consulted.`,
    evidence: excerptFor(app, c.key),
    confidence: 0.35,
  }));

  const composite = computeComposite(Object.fromEntries(criteria.map((c) => [c.key, c.score])));
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

function clamp5(n: number): number {
  return Math.max(0, Math.min(5, n));
}

function excerptFor(app: ApplicationForHeuristic, key: string): string {
  const preferred =
    key === 'model_clarity' || key === 'regenerative_depth'
      ? app.operatingModelDescription
      : key === 'verified_impact'
        ? app.verifiedImpacts
        : key === 'fund_utilization'
          ? app.fundUsagePlan
          : app.aboutSolution ?? app.problemAddressing;
  const candidates = [preferred, app.aboutSolution, app.problemAddressing].filter(
    (t): t is string => !!t && t.trim().length > 3,
  );
  const text = candidates[0] ?? '';
  return text ? text.slice(0, 140) + (text.length > 140 ? '…' : '') : 'no evidence provided';
}
