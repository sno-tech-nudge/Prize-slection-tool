import type { AiEvaluation } from '@prisma/client';

export interface EffectiveScore {
  composite: number;
  disposition: string;
  isOverridden: boolean;
}

/** An admin override replaces the AI's own composite/disposition for every downstream display
 *  (lists, badges, calibration) while the original AI values stay on the row for audit purposes. */
export function effectiveScore(evaluation: Pick<AiEvaluation, 'composite' | 'disposition' | 'overrideComposite' | 'overrideDisposition'>): EffectiveScore {
  if (evaluation.overrideComposite != null && evaluation.overrideDisposition) {
    return { composite: evaluation.overrideComposite, disposition: evaluation.overrideDisposition, isOverridden: true };
  }
  return { composite: evaluation.composite, disposition: evaluation.disposition, isOverridden: false };
}
