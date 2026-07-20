export interface RubricCriterionDef {
  key: string;
  section: string;
  label: string;
  /** points this criterion contributes to the 0-100 composite — this IS the criterion's weight,
   *  there's no separate weighting step. Section weights are just the sum of their criteria's
   *  maxScore. */
  maxScore: number;
  /** explainer bullets shown to both the reviewer and the AI model — what to actually look for
   *  when scoring this criterion, not a fixed set of discrete bands. */
  description: string[];
}

/** The team's "Those who clear level 1 — move to LEVEL 2" selection rubric — 4 sections, 11
 *  criteria, each scored on its own point scale (not a shared 0-5) summing to 100. */
export const RUBRIC_SECTIONS = [
  { key: 'org_health', label: 'organisation health', weight: 20 },
  { key: 'model_approach', label: 'model and approach', weight: 35 },
  { key: 'tech_science', label: 'tech and science integration', weight: 25 },
  { key: 'evidence_impact', label: 'evidence and impact', weight: 20 },
] as const;

export const RUBRIC_CRITERIA: RubricCriterionDef[] = [
  // ---- organisation health (20) ----
  {
    key: 'operating_capacity',
    section: 'org_health',
    label: 'operating capacity',
    maxScore: 10,
    description: ['annual operating budget', 'employee strength', 'year of registration', 'vision and clarity of fund utilisation'],
  },
  {
    key: 'team_expertise',
    section: 'org_health',
    label: 'team expertise in agri/soil',
    maxScore: 5,
    description: ['founder expertise', 'soil scientist / agri experts / sector experts (in team or advisory/consultant capacity)'],
  },
  {
    key: 'ecosystem_linkages',
    section: 'org_health',
    label: 'ecosystem linkages',
    maxScore: 5,
    description: ['funder pipeline', 'government / public institutions'],
  },

  // ---- model and approach (35) ----
  {
    key: 'regen_practices',
    section: 'model_approach',
    label: 'regen practices undertaken',
    maxScore: 15,
    description: [
      'single / multiple practice',
      'type (description): nature and rigour of practices undertaken',
      'interventions have a direct impact on soil health and farmer net income',
    ],
  },
  {
    key: 'operating_model',
    section: 'model_approach',
    label: 'operating model',
    maxScore: 20,
    description: [
      'directly working with farmers (only advisory/practice/both) OR working through partners (FPO/NGO/for profit/govt/markets)',
      'business model & revenue generation: who pays for the work? degree of philanthropy-dependence vs. farmer pay/co-pay; path to sustainability',
      'crop specificity: level of difficulty dealt with from an agro-climatic zone; soil type; landholding patterns',
    ],
  },

  // ---- tech and science integration (25) ----
  {
    key: 'tech_use_case_maturity',
    section: 'tech_science',
    label: 'tech use-case maturity / adoption of tech',
    maxScore: 10,
    description: [
      'type of tech integration (across the cultivation cycle)',
      'who is using it (internal team / farmer / partner org)',
      'maturity and actual (not just planned) adoption of technology in the model',
    ],
  },
  {
    key: 'last_mile_integration',
    section: 'tech_science',
    label: 'last mile integration of tech',
    maxScore: 10,
    description: ['whether technology actually reaches and is usable by field staff/farmers, not just at idea level'],
  },
  {
    key: 'science_integration',
    section: 'tech_science',
    label: 'science integration',
    maxScore: 5,
    description: [
      'is there an in-house or partner scientific/technical capacity for soil testing, inoculation etc',
      'in-house built or external support',
      'if external — what is the level/type of partnership?',
    ],
  },

  // ---- evidence and impact (20) ----
  {
    key: 'verified_impact',
    section: 'evidence_impact',
    label: 'verified impact (through empirical evidence)',
    maxScore: 5,
    description: [
      'whether an actual impact study exists — baseline, endline, sample size, verification',
      'and whether it is published / independently checked',
    ],
  },
  {
    key: 'scale',
    section: 'evidence_impact',
    label: 'scale (farmers reached / hectares covered)',
    maxScore: 10,
    description: ['how many farmers have they reached (or hectares)?'],
  },
  {
    key: 'geographic_depth',
    section: 'evidence_impact',
    label: 'geographic depth (villages/districts)',
    maxScore: 5,
    description: [
      'how many villages, blocks, and districts are they actually working in? spread across several districts scores higher than a single village or area',
    ],
  },
];

/** Composite is a direct sum of per-criterion scores — each criterion's maxScore already IS its
 *  weight (they sum to 100 across all 11 criteria), so there's no separate weighting step. */
export function computeComposite(scores: Record<string, number>): number {
  let total = 0;
  for (const c of RUBRIC_CRITERIA) {
    const raw = scores[c.key] ?? 0;
    total += Math.max(0, Math.min(raw, c.maxScore));
  }
  return Math.round(Math.max(0, Math.min(total, 100)));
}

export function dispositionFromComposite(composite: number): 'STRONG_ADVANCE' | 'ADVANCE' | 'BORDERLINE' | 'REJECT' {
  if (composite >= 80) return 'STRONG_ADVANCE';
  if (composite >= 62) return 'ADVANCE';
  if (composite >= 45) return 'BORDERLINE';
  return 'REJECT';
}
