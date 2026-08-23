import type { Application, TechUseCase } from '@prisma/client';
import { OPERATING_MODEL_ARCHETYPE_LABEL, REGEN_PRACTICE_LABEL, CROP_TYPE_LABEL } from '@/lib/constants';

type ApplicationForHeuristicSynopsis = Application & { techUseCases: TechUseCase[] };

function labels(raw: string | null, map: Record<string, string>): string | null {
  const values = (raw ?? '').split(';').filter(Boolean).map((v) => map[v] ?? v);
  return values.length ? values.join(', ') : null;
}

/** Deterministic, template-based fallback used when every configured AI provider fails (rate
 *  limit, exhausted billing, or no key at all) — so jury/observer always see a real, readable
 *  summary rather than an error or an indefinite "not available yet.", the same philosophy as
 *  scoring/heuristic.ts's fallback for the AI evaluation. Built only from fields the applicant
 *  actually filled in; a field left blank is skipped, never guessed at. */
export function heuristicSynopsis(app: ApplicationForHeuristicSynopsis): string {
  const modelLabel = labels(app.operatingModelArchetype, OPERATING_MODEL_ARCHETYPE_LABEL);
  const practices = labels(app.regenerativePractices, REGEN_PRACTICE_LABEL);
  const crops = labels(app.primaryCrops, CROP_TYPE_LABEL);
  const states = labels(app.statesOperating, {});

  const sentences: string[] = [];

  const modelSentence = [
    modelLabel ? `${app.orgName} operates as ${modelLabel.toLowerCase()}` : `${app.orgName}`,
    states ? `in ${states}` : null,
  ]
    .filter(Boolean)
    .join(' ');
  sentences.push(`${modelSentence}.`);

  if (app.operatingModelDescription) sentences.push(app.operatingModelDescription.trim().replace(/\.?$/, '.'));

  if (practices) {
    const practiceSentence = [`Its regenerative work centres on ${practices.toLowerCase()}`, crops ? `across ${crops.toLowerCase()}` : null]
      .filter(Boolean)
      .join(', applied ');
    sentences.push(`${practiceSentence}.`);
  }

  if (app.adoptionHurdle) sentences.push(`The model is designed around ${app.adoptionHurdle.trim().replace(/\.?$/, '')} as the main barrier to adoption.`);

  if (app.techUseCases.length > 0) sentences.push(`Technology plays a role through ${app.techUseCases.map((t) => t.description).join('; ')}.`);

  if (app.otherDevelopmentAreas) sentences.push(app.otherDevelopmentAreas.trim().replace(/\.?$/, '.'));

  if (app.fundUsagePlan) sentences.push(`Prize funds are proposed for ${app.fundUsagePlan.trim().replace(/\.?$/, '')}.`);

  if (sentences.length <= 1) {
    return `${app.orgName} has not provided enough detail across the operating model fields yet to summarise beyond its organisation type and location.`;
  }

  return sentences.join(' ');
}
