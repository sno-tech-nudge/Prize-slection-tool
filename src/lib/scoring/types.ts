export interface CriterionScore {
  key: string;
  score: number; // 0-5
  rationale: string;
  evidence: string;
  confidence: number; // 0-1
  comment?: string; // reviewer's own note on this criterion — human reviews only, AI leaves unset
}

export interface EligibilitySignals {
  farmers_reached: number | null;
  states_operating: string;
  hectares_under_practice: string;
  fit_notes: string;
}

export interface ScoringResult {
  criteria: CriterionScore[];
  eligibility: EligibilitySignals;
  composite: number;
  disposition: 'STRONG_ADVANCE' | 'ADVANCE' | 'BORDERLINE' | 'REJECT';
  red_flags: string[];
  summary: string;
}
