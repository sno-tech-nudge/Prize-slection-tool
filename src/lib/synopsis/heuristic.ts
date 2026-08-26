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
 *  limit, exhausted billing, or no key at all) — so jury always sees a real, judgeable paragraph
 *  rather than an error or an indefinite "not available yet.", the same philosophy as
 *  scoring/heuristic.ts's fallback for the AI evaluation. Built only from fields the applicant
 *  actually filled in; a field left blank is skipped, never guessed at. One flowing paragraph
 *  with the concrete numbers included, same format the AI-generated synopsis uses. */
export function heuristicSynopsis(app: ApplicationForHeuristicSynopsis): string {
  const modelLabel = labels(app.operatingModelArchetype, OPERATING_MODEL_ARCHETYPE_LABEL);
  const practices = labels(app.regenerativePractices, REGEN_PRACTICE_LABEL);
  const crops = labels(app.primaryCrops, CROP_TYPE_LABEL);
  const states = labels(app.statesOperating, {});

  const sentences: string[] = [];

  const modelSentence = [
    modelLabel ? `${app.orgName} operates as ${modelLabel.toLowerCase()}` : app.orgName,
    states ? `in ${states}` : null,
    app.yearsExperience != null ? `with ${app.yearsExperience} years of experience in regenerative agriculture` : null,
  ]
    .filter(Boolean)
    .join(' ');
  if (modelSentence) sentences.push(`${modelSentence}.`);

  if (app.operatingModelDescription) sentences.push(`${truncate(app.operatingModelDescription, 200)}.`);

  const practiceSentence = [
    practices ? `Regenerative practices in use include ${practices.toLowerCase()}` : null,
    crops ? `across crops such as ${crops.toLowerCase()}` : null,
  ]
    .filter(Boolean)
    .join(' ');
  if (practiceSentence) sentences.push(`${practiceSentence}.`);

  const reachSentence = [
    app.farmersCount != null ? `${app.farmersCount} farmers reached` : null,
    app.areaUnderRegenPractice != null ? `${app.areaUnderRegenPractice} hectares under regenerative practice` : null,
  ]
    .filter(Boolean)
    .join(' and ');
  if (reachSentence) sentences.push(`${reachSentence} so far.`);

  if (app.adoptionHurdle) sentences.push(`The main adoption barrier addressed is ${truncate(app.adoptionHurdle, 150).toLowerCase()}.`);

  if (app.techUseCases.length > 0) sentences.push(`Technology is used for ${truncate(app.techUseCases.map((t) => t.description).join('; '), 150).toLowerCase()}.`);

  if (app.otherDevelopmentAreas) sentences.push(`Beyond agriculture, the organisation also works on ${truncate(app.otherDevelopmentAreas, 150).toLowerCase()}.`);

  if (app.fundUsagePlan) sentences.push(`Prize funds are planned for ${truncate(app.fundUsagePlan, 150).toLowerCase()}.`);

  if (sentences.length === 0) {
    return `${app.orgName} has not provided enough detail across the operating model fields yet to summarise.`;
  }

  return sentences.join(' ');
}
