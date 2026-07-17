export interface RubricBand {
  score: 0 | 1 | 3 | 5;
  label: string;
}

export interface RubricCriterionDef {
  key: string;
  section: string;
  label: string;
  prompt: string;
  /** rating bands in the team's actual selection rubric — a discrete 0/1/3/5 scale, not a
   *  continuous 0-5 one. There's no "2" or "4": you're either cancelling it (0), it's weak (1),
   *  it's middling (3), or it's strong (5). */
  bands: RubricBand[];
}

/** The real selection rubric from the team's "New-Selection Rubric" / "Internal review filters"
 *  sheets — 4 sections, 20 criteria, each scored 0/1/3/5 against the bands below. Section
 *  weights (20/30/25/25) are fixed; individual criteria within a section split that weight
 *  evenly since the sheet marks per-criterion weighting "TBD". */
export const RUBRIC_SECTIONS = [
  { key: 'org_health', label: 'organisation health / organisation strength', weight: 20 },
  { key: 'model_approach', label: 'model and approach', weight: 30 },
  { key: 'tech_science', label: 'tech and science integration', weight: 25 },
  { key: 'impact_operations', label: 'tangible impact / modality of operations', weight: 25 },
] as const;

export const RUBRIC_CRITERIA: RubricCriterionDef[] = [
  // ---- organisation health / organisation strength (20) ----
  {
    key: 'years_registered',
    section: 'org_health',
    label: 'years of registration',
    prompt: "How long has the organisation been registered? The longer the track record, the higher the score — it's a rough proxy for stability. Selection criteria: >3 years.",
    bands: [
      { score: 0, label: '<1 year or unstated duration' },
      { score: 1, label: '1–2 years' },
      { score: 3, label: '3–5 years' },
      { score: 5, label: '>5 years, well established' },
    ],
  },
  {
    key: 'annual_budget',
    section: 'org_health',
    label: 'annual operating budget',
    prompt: "What's their latest annual budget? A bigger, well-established budget signals they can run programmes at scale. Selection criteria: >50 lakhs.",
    bands: [
      { score: 0, label: 'no budget disclosed / <10 lakhs' },
      { score: 1, label: '10–50 lakhs' },
      { score: 3, label: '~50 lakhs, in line with threshold' },
      { score: 5, label: 'well above 50 lakhs' },
    ],
  },
  {
    key: 'org_size_fte',
    section: 'org_health',
    label: 'organisation size (FTE)',
    prompt: 'How many full-time staff do they have? More full-time people usually means more capacity to actually deliver. Selection criteria: >5 full-time staff.',
    bands: [
      { score: 0, label: '0–2 FTE (presence of no team is a problem)' },
      { score: 1, label: '3–5 FTE' },
      { score: 3, label: '6–15 FTE, adequate for delivery' },
      { score: 5, label: '15+ FTE, strong delivery capacity' },
    ],
  },
  {
    key: 'founder_expertise',
    section: 'org_health',
    label: 'founder(s) agri/soil expertise',
    prompt: 'Do the founders have real, hands-on experience in agriculture or soil health? Direct experience scores higher than something adjacent like agribusiness or horticulture.',
    bands: [
      { score: 0, label: 'no relevant background evident — no expertise in this domain' },
      { score: 1, label: 'adjacent field only — like agribusiness / horticulture etc.' },
      { score: 3, label: 'direct agri/soil experience evident' },
      { score: 5, label: 'deep, verifiable agri/soil expertise across the founding team' },
    ],
  },
  {
    key: 'funder_pipeline',
    section: 'org_health',
    label: 'funder pipeline',
    prompt: 'How many funders do they have? Selection criteria: 3 funders named — we want to check they are not 100% dependent on challenge money.',
    bands: [
      { score: 0, label: 'no funders named — no active programs, not a good sign' },
      { score: 1, label: '1–2 funders named' },
      { score: 3, label: '3 funders named' },
      { score: 5, label: 'diverse, credible funder base beyond the threshold' },
    ],
  },
  {
    key: 'government_linkage',
    section: 'org_health',
    label: 'government linkage',
    prompt: "Do they have any genuine government partnership, at a formal/agreement level? Tells us whether they're overly dependent on the prize fund, and whether government trusts them.",
    bands: [
      { score: 0, label: 'no alignment with any government scheme, no overlap with any government initiative' },
      { score: 1, label: 'no government link, but alignment with government schemes/policies' },
      { score: 3, label: 'an ad-hoc government contact' },
      { score: 5, label: 'a genuine, formal government partnership' },
    ],
  },
  {
    key: 'market_linkage',
    section: 'org_health',
    label: 'market linkages / private sector linkage',
    prompt: 'Is there a real market for this business? Working with markets makes the business more viable and shows potential for scale.',
    bands: [
      { score: 0, label: 'no private-sector engagement' },
      { score: 1, label: 'occasional / informal private-sector contact' },
      { score: 3, label: 'active private-sector partnership (funded or advisory) supporting the ag/regen programme' },
      { score: 5, label: 'multiple strong, revenue-generating private-sector partnerships' },
    ],
  },

  // ---- model and approach (30) ----
  {
    key: 'operating_model_clarity',
    section: 'model_approach',
    label: 'operating model clarity',
    prompt: 'Can you actually picture how they work with farmers — field staff, FPOs, partner NGOs, an app? Score according to how clear this is.',
    bands: [
      { score: 0, label: 'model unclear or not described' },
      { score: 1, label: 'vague description' },
      { score: 3, label: 'clear, coherent operating model' },
      { score: 5, label: 'clear, coherent and genuinely differentiated operating model' },
    ],
  },
  {
    key: 'regen_practices_coverage',
    section: 'model_approach',
    label: 'regenerative practices coverage',
    prompt: "What regenerative practices do they actually use — cover cropping, no-till, composting, agroforestry and so on? Count distinct practices, and whether they show up across more than one programme, and how they directly impact the challenge's core thresholds (farmer net income and soil health).",
    bands: [
      { score: 0, label: 'no specific practices named' },
      { score: 1, label: '1 practice named, single intervention' },
      { score: 3, label: 'several core regenerative practices covered, multiple interventions' },
      { score: 5, label: 'comprehensive, deeply-embedded practice coverage across programmes' },
    ],
  },
  {
    key: 'climate_adaptation',
    section: 'model_approach',
    label: 'climate adaptation integration',
    prompt: 'Is climate adaptation embedded in the main working of the model, or is it just a layer on top not affecting the efficacy of the solution itself?',
    bands: [
      { score: 0, label: 'no integration described' },
      { score: 1, label: 'mentioned but not embedded in model' },
      { score: 3, label: 'adaptation clearly built into programme design' },
      { score: 5, label: 'adaptation is central and demonstrably effective' },
    ],
  },
  {
    key: 'crop_specificity',
    section: 'model_approach',
    label: 'crop specificity / relevance',
    prompt: 'Background context, not scored hard — crop categories selected and regional relevance.',
    bands: [
      { score: 0, label: 'no crops specified' },
      { score: 1, label: 'single crop category, low regional relevance' },
      { score: 3, label: '2–3 relevant crop categories' },
      { score: 5, label: 'broad, highly regionally-relevant crop coverage' },
    ],
  },

  // ---- tech and science integration (25) ----
  {
    key: 'tech_use_case_maturity',
    section: 'tech_science',
    label: 'tech use-case maturity / adoption of tech',
    prompt: 'What are their top ways of using tech — record-keeping, remote sensing, farmer advisory apps? More integrated, actually-adopted (not just planned) use generally means stronger tech readiness.',
    bands: [
      { score: 0, label: 'no tech use cases described' },
      { score: 1, label: '1 basic use case (e.g. record-keeping only)' },
      { score: 3, label: '2–3 use cases supporting delivery/MEL' },
      { score: 5, label: 'mature, multi-use-case tech adoption embedded in daily operations' },
    ],
  },
  {
    key: 'internal_data_tools',
    section: 'tech_science',
    label: 'internal data / program-management tools',
    prompt: 'Do they have a real system for tracking their data, or is it all spreadsheets? Dedicated tools with good visibility into the data score higher.',
    bands: [
      { score: 0, label: 'no internal tools / fully manual' },
      { score: 1, label: 'basic spreadsheets only' },
      { score: 3, label: 'dedicated tool(s) for data/program tracking' },
      { score: 5, label: 'sophisticated, well-adopted internal data/program-management system' },
    ],
  },
  {
    key: 'inhouse_science_integration',
    section: 'tech_science',
    label: 'in-house science integration',
    prompt: 'Is there in-house or partner scientific/technical capacity for soil testing, inoculation etc? In-house built or external support, and what level/type of partnership if external.',
    bands: [
      { score: 0, label: 'no scientific/technical backing; purely field-practice based' },
      { score: 1, label: 'occasional external consultation, no structured partnership' },
      { score: 3, label: 'access to soil testing / advisory through a credible partner (formal partnership or tech vendor)' },
      { score: 5, label: 'strong in-house scientific/technical capacity' },
    ],
  },

  // ---- tangible impact / modality of operations (25) ----
  {
    key: 'verified_impact',
    section: 'impact_operations',
    label: 'verified impact (through empirical evidence)',
    prompt: 'Have they run an actual impact study — baseline, endline, sample size, and a way of verifying the results? Several such studies, independently checked, is the top mark. Selection criteria: at least 1 verified impact study.',
    bands: [
      { score: 0, label: 'no impact study / no verification' },
      { score: 1, label: '1 study but not published (missing baseline/endline/sample/verification)' },
      { score: 3, label: '≥1 fully-verified impact study as specified, research outputs' },
      { score: 5, label: 'multiple independently-verified impact studies' },
    ],
  },
  {
    key: 'scale',
    section: 'impact_operations',
    label: 'scale (farmers reached / hectares covered)',
    prompt: 'How many farmers have they reached (or hectares)? Selection criteria: >1000 farmers.',
    bands: [
      { score: 0, label: '<100 farmers' },
      { score: 1, label: '100–999 farmers' },
      { score: 3, label: '~1,000 farmers, threshold met' },
      { score: 5, label: 'well beyond 1,000 farmers' },
    ],
  },
  {
    key: 'geographic_depth',
    section: 'impact_operations',
    label: 'geographic depth (villages/districts)',
    prompt: 'How many villages, blocks, and districts are they actually working in? Spread across several districts scores higher than a single village or area.',
    bands: [
      { score: 0, label: 'single village / not specified' },
      { score: 1, label: 'handful of villages, 1 district' },
      { score: 3, label: 'multiple villages across several districts' },
      { score: 5, label: 'deep, multi-district or multi-state geographic spread' },
    ],
  },
  {
    key: 'mel_system',
    section: 'impact_operations',
    label: 'MEL system',
    prompt: 'Do they properly monitor and evaluate their own work, or is it just informal check-ins? A structured system scores well; one verified by a third party scores best.',
    bands: [
      { score: 0, label: 'no MEL system' },
      { score: 1, label: 'ad-hoc / informal monitoring only' },
      { score: 3, label: 'structured MEL system in place' },
      { score: 5, label: 'structured MEL system, independently verified' },
    ],
  },
  {
    key: 'published_evidence',
    section: 'impact_operations',
    label: 'published evidence',
    prompt: 'For reference — do they have any public reports, case studies, or research others have cited? The more credible, public evidence, the better.',
    bands: [
      { score: 0, label: 'no published evidence' },
      { score: 1, label: 'internal-only documentation, not shareable/public' },
      { score: 3, label: 'at least one public report or case study' },
      { score: 5, label: 'multiple credible, cited public reports/case studies' },
    ],
  },
  {
    key: 'fund_utilization_vision',
    section: 'impact_operations',
    label: 'vision & clarity of fund utilisation',
    prompt: "Is it clear what they'd actually do with the money and what results they expect? A detailed, costed plan with real milestones scores high.",
    bands: [
      { score: 0, label: 'no clear plan for funds' },
      { score: 1, label: 'vague activities, no outcomes stated' },
      { score: 3, label: 'clear activities with linked intended outcomes' },
      { score: 5, label: 'detailed, costed plan with concrete milestones' },
    ],
  },
];

export const DEFAULT_RUBRIC_WEIGHTS: Record<string, number> = Object.fromEntries(
  RUBRIC_CRITERIA.map((c) => {
    const section = RUBRIC_SECTIONS.find((s) => s.key === c.section)!;
    const criteriaInSection = RUBRIC_CRITERIA.filter((x) => x.section === c.section).length;
    return [c.key, Math.round((section.weight / criteriaInSection) * 1000) / 1000];
  }),
);

export function computeComposite(scores: Record<string, number>, weights: Record<string, number> = DEFAULT_RUBRIC_WEIGHTS): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const c of RUBRIC_CRITERIA) {
    const w = weights[c.key] ?? 1;
    const s = scores[c.key] ?? 0;
    weightedSum += w * s;
    weightTotal += w;
  }
  if (weightTotal === 0) return 0;
  // scores are 0/1/3/5, normalise to 0-100
  return Math.round((weightedSum / weightTotal / 5) * 100);
}

export function dispositionFromComposite(composite: number): 'STRONG_ADVANCE' | 'ADVANCE' | 'BORDERLINE' | 'REJECT' {
  if (composite >= 80) return 'STRONG_ADVANCE';
  if (composite >= 62) return 'ADVANCE';
  if (composite >= 45) return 'BORDERLINE';
  return 'REJECT';
}
