import type { Application, TechUseCase } from '@prisma/client';
import { OPERATING_MODEL_ARCHETYPE_LABEL, REGEN_PRACTICE_LABEL, CROP_TYPE_LABEL } from '@/lib/constants';

type ApplicationForHeuristicSynopsis = Application & { techUseCases: TechUseCase[] };

function labels(raw: string | null, map: Record<string, string>): string | null {
  const values = (raw ?? '').split(';').filter(Boolean).map((v) => map[v] ?? v);
  return values.length ? values.join(', ') : null;
}

// Cuts to a clean sentence boundary within a word budget — same "never end mid-sentence" rule the
// AI prompt follows, so the fallback template can never produce the exact bug this replaced: a
// blind character-count slice with a period tacked on afterward regardless of where it landed
// (that's what was producing dangling fragments like "...across the district and."). If the text
// already fits the budget, only append a period when it doesn't already end in one. If no sentence
// boundary exists within budget, cut at the last whole word and leave it unterminated rather than
// fake a period onto a fragment that isn't actually a finished thought.
function truncate(text: string, maxWords = 28): string {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  }
  const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
  if (sentences) {
    let count = 0;
    let end = 0;
    for (const s of sentences) {
      const w = s.trim().split(/\s+/).filter(Boolean).length;
      if (count > 0 && count + w > maxWords) break;
      count += w;
      end += s.length;
    }
    if (end > 0 && end < trimmed.length) return trimmed.slice(0, end).trim();
  }
  return words.slice(0, maxWords).join(' ');
}

/** Deterministic, template-based fallback used when every configured AI provider fails (rate
 *  limit, exhausted billing, or no key at all) — so jury always sees a real snapshot rather than
 *  an error or an indefinite "not available yet.", the same philosophy as scoring/heuristic.ts's
 *  fallback for the AI evaluation. Built only from fields the applicant actually filled in; a
 *  field left blank is skipped, never guessed at. Same labelled-paragraph shape as the
 *  AI-generated snapshot (Model — ..., Regenerative approach — ..., etc.), not bullets — a
 *  template fallback that looked structurally different from the real thing would be its own
 *  inconsistency for a juror to notice. */
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

  const paragraphs: string[] = [];

  const modelParts = [
    opener ? `${app.orgName} ${opener}.` : null,
    app.operatingModelDescription ? truncate(app.operatingModelDescription) : null,
  ].filter(Boolean);
  if (modelParts.length > 0) paragraphs.push(`Model — ${modelParts.join(' ')}`);

  const approach = [practices ? `uses ${practices.toLowerCase()}` : null, crops ? `across ${crops.toLowerCase()}` : null].filter(Boolean).join(' ');
  if (approach) paragraphs.push(`Regenerative approach — the organisation ${approach}.`);

  if (app.adoptionHurdle) paragraphs.push(`Adoption barrier — ${truncate(app.adoptionHurdle)}`);

  if (app.techUseCases.length > 0) paragraphs.push(`Technology — ${truncate(app.techUseCases.map((t) => t.description).join('; '))}`);

  if (app.fundUsagePlan) paragraphs.push(`Proposed scale-up — ${truncate(app.fundUsagePlan)}`);

  return paragraphs.length > 0 ? paragraphs.join('\n\n') : `${app.orgName} ${opener}.`;
}
