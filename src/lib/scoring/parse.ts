import type { CriterionScore, EligibilitySignals } from './types';

export function parseCriteria(json: string): CriterionScore[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseRedFlags(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseEligibility(json: string): EligibilitySignals | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
