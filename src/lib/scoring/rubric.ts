export interface RubricCriterionDef {
  key: string;
  section: string;
  label: string;
  /** points this criterion contributes to the 0-100 composite — this IS the criterion's weight,
   *  there's no separate weighting step. Section weights are just the sum of their criteria's
   *  maxScore. */
  maxScore: number;
  /** the evaluation question shown under the criterion label — a single question, not a bulleted
   *  list, kept as an array only so existing call sites (AI prompt, jury/rubric side panels) that
   *  already iterate `description` didn't need to change shape. */
  description: string[];
  /** scoring guidance shown as the review form's comment-box placeholder for this criterion — the
   *  team's own notes on what a given score should look like, not a fixed set of discrete bands. */
  guidance: string;
}

/** The team's "Selection Rubric" (new-selection-rubric.csv) — 4 scored sections (14 criteria,
 *  each on its own point scale, summing to 100) plus USP: a free-text, unscored line the sheet
 *  itself marks "(Text box, no scores)" — carries no weight and doesn't affect the composite. */
export const RUBRIC_SECTIONS = [
  { key: 'org_strength', label: "organisation's strength", weight: 30 },
  { key: 'model_strength', label: "model's strength", weight: 50 },
  { key: 'evidence_impact', label: 'evidence and impact', weight: 15 },
  { key: 'bonus', label: 'bonus', weight: 5 },
  { key: 'usp', label: 'usp', weight: 0 },
] as const;

export const RUBRIC_CRITERIA: RubricCriterionDef[] = [
  // ---- organisation's strength (30) ----
  {
    key: 'people_strength',
    section: 'org_strength',
    label: 'people strength',
    maxScore: 5,
    description: ['Does the organisation have the team capacity and relevant experience required to implement a challenge of this scale?'],
    guidance: 'Score 5 if:\n• Team strength is >50 members\n• Organisation has been operational for >10 years and demonstrates institutional stability',
  },
  {
    key: 'quality_of_funding',
    section: 'org_strength',
    label: 'quality of funding',
    maxScore: 5,
    description: ['Do they have the budget/pipeline to run the challenge?'],
    guidance:
      'Score 5 if:\n• Annual operating budget >₹5 crore\n• Multiple high-quality funders\n• Evidence of sustained funding pipeline (e.g., multi-year grants or repeat funders)',
  },
  {
    key: 'potential_for_scaling',
    section: 'org_strength',
    label: 'potential for scaling',
    maxScore: 10,
    description: ['Do they have the implementation muscle, and the networks required to reach scale?'],
    guidance: 'Assess:\n• Existing farmer networks\n• Geographic presence\n• Implementation partnerships\n• Ability to expand beyond current footprint',
  },
  {
    key: 'expertise_in_agriculture',
    section: 'org_strength',
    label: 'expertise in agriculture',
    maxScore: 5,
    description: ['Does the founder and/or team and/or consultants have agri/regen expertise?'],
    guidance: 'Check founders LinkedIn, training notes question (if received training from established/reputed centres)',
  },
  {
    key: 'credibility',
    section: 'org_strength',
    label: 'credibility',
    maxScore: 5,
    description: ['How credible are they as an organisation or as founders in the work of rapid regen?'],
    guidance:
      'Measures to look at:\nGovernment buy in or partnerships OR\nGoogle Search on Awards Grants PR OR\nWebsite and LinkedIn Scan OR\nPublications and Journals',
  },

  // ---- model's strength (50) ----
  {
    key: 'commitment_to_regen_agri',
    section: 'model_strength',
    label: 'commitment to regen agri',
    maxScore: 5,
    description: [
      'Has the organisation demonstrated a sustained, long-term commitment to driving the adoption and expansion of regenerative agriculture among smallholder farmers?',
    ],
    guidance:
      'Assess whether regen agri is a strategic programme area that the org has consistently invested in and strengthened over time, rather than a series of isolated, donor-funded projects.',
  },
  {
    key: 'strength_of_pop',
    section: 'model_strength',
    label: 'strength of package of practices (PoP)',
    maxScore: 5,
    description: ['What is the range (and how many across multiple domains) of the regenerative practices they deploy?'],
    guidance:
      'Assess the breadth and integration of the regenerative practices deployed by the org. Consider whether they promote a comprehensive package of complementary practices, rather than focusing on one or two standalone interventions.',
  },
  {
    key: 'robustness_of_model',
    section: 'model_strength',
    label: 'robustness of model',
    maxScore: 15,
    description: ['Does the organisation address multiple barriers to regenerative adoption across the agricultural value chain?'],
    guidance:
      'Strong models will address multiple barriers to adoption by combining technical, financial, operational, and market support. Activities: soil diagnostics, seeds, practices (mulching, cover crops etc), inputs, IPM, water management (watershedding etc), harvest (machinery), market linkages, certifications, crop residue mgmt (least likely to be seen in our applications)',
  },
  {
    key: 'tech_integration',
    section: 'model_strength',
    label: 'tech integration',
    maxScore: 15,
    description: [
      'Is tech meaningfully integrated into their model? (Practice-led advisory, diagnostics, inputs infra, market intelligence, traceability systems)',
    ],
    guidance: 'Assess use of technology across: practice-led advisory, diagnostics, inputs infra, market intelligence, traceability systems',
  },
  {
    key: 'science_integration',
    section: 'model_strength',
    label: 'science integration',
    maxScore: 10,
    description: [
      'Does the organisation have the deep science lens required to combat chemical dependency from Year 1 without yield risk/loss? E.g. do they have a biotechnology bone? Have they innovated or brought in innovations in biological inputs?',
    ],
    guidance: '<5 if they have no deep science lens (R&D with in-house or external)\nBringing new bio-inputs for soil performance',
  },

  // ---- evidence and impact (15) ----
  {
    key: 'verified_impact',
    section: 'evidence_impact',
    label: 'verified impact',
    maxScore: 5,
    description: ['Does an impact study exist like baseline, endline, sample size, verification and is it published/independently checked?'],
    guidance: '<3 if no independent studies conducted',
  },
  {
    key: 'growth_rate_in_regen',
    section: 'evidence_impact',
    label: 'growth rate in regen',
    maxScore: 5,
    description: ['What is the growth rate of farmers acquired by the organisation year on year?'],
    guidance:
      'Scoring basis [SHFarmer Reach:Years of Exp]\n<100: 0\n<500: 1\n<1000/yr: 2\n<2500: 3\n~2500: 4\n>2500: 5\ntake a judgement call if the org is very new and their growth rate seems impressive, or if the org is very established and may have hit saturation which they can push during mission mode.',
  },
  {
    key: 'tg_focus',
    section: 'evidence_impact',
    label: 'tg focus',
    maxScore: 5,
    description: ['Are SHFs the target group for the organisation?'],
    guidance: 'TG Focus : Average hectares:\n>2: 0\n1-2: 3\n<1: 5',
  },

  // ---- bonus (5) ----
  {
    key: 'extra_points',
    section: 'bonus',
    label: 'extra points',
    maxScore: 5,
    description: ["If you think they are doing additional work in the service of the challenge thresholds but isn't reflected in the rubric."],
    guidance:
      "0: nothing distinctive to add\n1-2: potential to do something unique, innovative that isn't directly reflected but you see the possibility of coming through\n3-5: Adoption mechanism or practice that you think will really propel challenge outcomes. Reflects a whole is better than the sum of its parts reading",
  },

  // ---- usp (0 — free text, not scored) ----
  {
    key: 'usp',
    section: 'usp',
    label: 'usp',
    maxScore: 0,
    description: ['What is their unique value proposition for driving the adoption of regenerative practices among SHFs?'],
    guidance: 'free text — no fixed scoring band for this one',
  },
];

/** Composite is a direct sum of per-criterion scores — each criterion's maxScore already IS its
 *  weight (they sum to 100 across all 14 criteria), so there's no separate weighting step. */
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
