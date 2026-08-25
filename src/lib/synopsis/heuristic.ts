import type { Application, TechUseCase } from '@prisma/client';
import { OPERATING_MODEL_ARCHETYPE_LABEL, REGEN_PRACTICE_LABEL, CROP_TYPE_LABEL } from '@/lib/constants';

type ApplicationForHeuristicSynopsis = Application & { techUseCases: TechUseCase[] };

function labels(raw: string | null, map: Record<string, string>): string | null {
  const values = (raw ?? '').split(';').filter(Boolean).map((v) => map[v] ?? v);
  return values.length ? values.join(', ') : null;
}

// keeps a bullet to one short line, matching the AI-generated version's length limit — a template
// fallback that ran on for a full sentence would look inconsistent next to the real thing.
function truncate(text: string, maxLen = 90): string {
  const trimmed = text.trim().replace(/\.$/, '');
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen - 1).trim()}…` : trimmed;
}

/** Deterministic, template-based fallback used when every configured AI provider fails (rate
 *  limit, exhausted billing, or no key at all) — so jury/observer always see real, scannable
 *  pointers rather than an error or an indefinite "not available yet.", the same philosophy as
 *  scoring/heuristic.ts's fallback for the AI evaluation. Built only from fields the applicant
 *  actually filled in; a field left blank is skipped, never guessed at. Bullet points, not
 *  prose — same format the AI-generated synopsis uses. */
export function heuristicSynopsis(app: ApplicationForHeuristicSynopsis): string {
  const modelLabel = labels(app.operatingModelArchetype, OPERATING_MODEL_ARCHETYPE_LABEL);
  const practices = labels(app.regenerativePractices, REGEN_PRACTICE_LABEL);
  const crops = labels(app.primaryCrops, CROP_TYPE_LABEL);
  const states = labels(app.statesOperating, {});

  const bullets: string[] = [];

  const modelBullet = [modelLabel ? `Operates as ${modelLabel.toLowerCase()}` : null, states ? `in ${states}` : null].filter(Boolean).join(' ');
  if (modelBullet) bullets.push(modelBullet);

  if (app.operatingModelDescription) bullets.push(truncate(app.operatingModelDescription));

  if (practices) bullets.push(truncate([`Regenerative practices: ${practices.toLowerCase()}`, crops ? `across ${crops.toLowerCase()}` : null].filter(Boolean).join(', ')));

  if (app.adoptionHurdle) bullets.push(truncate(`Main adoption barrier: ${app.adoptionHurdle}`));

  if (app.techUseCases.length > 0) bullets.push(truncate(`Technology: ${app.techUseCases.map((t) => t.description).join('; ')}`));

  if (app.otherDevelopmentAreas) bullets.push(truncate(app.otherDevelopmentAreas));

  if (app.fundUsagePlan) bullets.push(truncate(`Planned use of prize funds: ${app.fundUsagePlan}`));

  if (bullets.length === 0) {
    return `${app.orgName} has not provided enough detail across the operating model fields yet to summarise.`;
  }

  return bullets
    .slice(0, 6)
    .map((b) => `• ${b}`)
    .join('\n');
}
