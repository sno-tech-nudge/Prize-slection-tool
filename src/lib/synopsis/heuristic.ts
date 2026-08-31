import type { Application, TechUseCase } from '@prisma/client';
import { OPERATING_MODEL_ARCHETYPE_LABEL, REGEN_PRACTICE_LABEL, CROP_TYPE_LABEL } from '@/lib/constants';

type ApplicationForHeuristicSynopsis = Application & { techUseCases: TechUseCase[] };

function labels(raw: string | null, map: Record<string, string>): string | null {
  const values = (raw ?? '').split(';').filter(Boolean).map((v) => map[v] ?? v);
  return values.length ? values.join(', ') : null;
}

// keeps a clause to one short fragment, matching the AI-generated version's length budget — a
// template fallback that ran on for full sentences would look inconsistent next to the real thing.
function truncate(text: string, maxLen = 110): string {
  const trimmed = text.trim().replace(/\.$/, '');
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen - 1).trim()}…` : trimmed;
}

/** Deterministic, template-based fallback used when every configured AI provider fails (rate
 *  limit, exhausted billing, or no key at all) — so jury always sees a real snapshot rather than
 *  an error or an indefinite "not available yet.", the same philosophy as scoring/heuristic.ts's
 *  fallback for the AI evaluation. Built only from fields the applicant actually filled in; a
 *  field left blank is skipped, never guessed at. Opening sentence + up to 5 bullets, no metrics —
 *  same shape as the AI-generated snapshot. */
export function heuristicSynopsis(app: ApplicationForHeuristicSynopsis): string {
  const modelLabel = labels(app.operatingModelArchetype, OPERATING_MODEL_ARCHETYPE_LABEL);
  const practices = labels(app.regenerativePractices, REGEN_PRACTICE_LABEL);
  const crops = labels(app.primaryCrops, CROP_TYPE_LABEL);
  const states = labels(app.statesOperating, {});

  const opener = [modelLabel ? `operates as ${modelLabel.toLowerCase()}` : null, states ? `in ${states.toLowerCase()}` : null]
    .filter(Boolean)
    .join(' ');

  if (!opener && !app.operatingModelDescription) {
    return `${app.orgName} has not provided enough detail across the operating model fields yet to summarise.`;
  }

  const opening = opener ? `${app.orgName} ${opener}.` : `${app.orgName}.`;

  const bullets: string[] = [];

  if (app.operatingModelDescription) bullets.push(`model: ${truncate(app.operatingModelDescription, 150)}.`);

  const approach = [practices ? `uses ${practices.toLowerCase()}` : null, crops ? `across ${crops.toLowerCase()}` : null].filter(Boolean).join(' ');
  if (approach) bullets.push(`regenerative approach: ${approach}.`);

  if (app.adoptionHurdle) bullets.push(`adoption barrier: ${truncate(app.adoptionHurdle, 150)}.`);

  if (app.techUseCases.length > 0) bullets.push(`technology: ${truncate(app.techUseCases.map((t) => t.description).join('; '), 150)}.`);

  if (app.fundUsagePlan) bullets.push(`proposed scale-up: ${truncate(app.fundUsagePlan, 150)}.`);

  if (bullets.length === 0) return opening;

  return [opening, ...bullets.slice(0, 5).map((b) => `• ${b}`)].join('\n');
}
