export interface JuryRubricCriterionDef {
  key: string;
  label: string;
  /** the weightage for this criterion — its own single score is capped at this, and the five
   *  weightages sum to 100, same "maxScore already IS the weight" convention as the AI/human
   *  rubric in rubric.ts. */
  maxScore: number;
  /** "to establish that..." text from the jury rubric sheet — background on what this criterion
   *  is actually measuring, surfaced behind the info ("i") button next to the criterion heading,
   *  not shown inline (core questions below are the ones a juror should actively work through). */
  establishText: string;
  /** the core questions a juror should work through while forming their score for this
   *  criterion — shown inline as guidance, unlike establishText. */
  coreQuestions: string[];
}

/** The overall framing question the jury rubric sheet poses before the five scored criteria — the
 *  challenge thresholds a winning model needs to break, shown as context above the scorecard. */
export const JURY_FRAMING_QUESTION =
  'Can this organisation deliver an integrated regenerative transition model capable of breaking the challenge thresholds: double + 0.3pp SOC, broader physical/chemical/biological soil improvement, 70% reduction in chemical use, and ≥25% net income across 5,000-10,000 SHFs / 5,000 ha within 3-5 contiguous blocks in a district?';

/** The jury's own rubric — five weighted criteria (summing to 100), each scored and commented on
 *  as a single unit rather than broken into sub-criteria. Deliberately separate from
 *  RUBRIC_CRITERIA in rubric.ts, which stays the AI-scoring and human-review rubric — jury scoring
 *  uses only this one. Keys are kept stable across a wording/weighting refresh where the
 *  underlying criterion is genuinely the same one, so an already-submitted score still carries
 *  over cleanly; `robustness_of_model` and `ability_to_scale` got new keys because their
 *  definitions were substantively restructured (merged/split from the old "model strength &
 *  replicability" / "tech-enabled precision layer" pair), so an old score under those should
 *  surface the "predates the current rubric" prompt to rescore, not silently carry over under a
 *  changed meaning. */
export const JURY_RUBRIC_CRITERIA: JuryRubricCriterionDef[] = [
  {
    key: 'farmer_pull_value_proposition',
    label: 'farmer pull / value proposition',
    maxScore: 20,
    establishText:
      'The organisation offers farmers a compelling economic and practical case for adopting and sustaining regenerative practices, with a credible pathway to higher net income and a clear approach to managing transition risks, costs and frictions.',
    coreQuestions: [
      'Why would a farmer adopt your model, and what makes the value proposition you are bringing to the table materially better than the status quo?',
      'Where does the income upside come from, and what happens to economics and risk during the transition?',
      'Would the farmers continue with regen practices once the initial intervention or programme support reduces?',
    ],
  },
  {
    key: 'robustness_of_model',
    label: 'robustness of the model',
    maxScore: 30,
    establishText:
      'The organisation has a coherent, end-to-end transition model that addresses the critical constraints to soil health and farmer economics through integrated, complementary interventions. The organisation uses diagnostics, data and technology to enable differentiated, adaptive interventions at farm level, translating farm-level variation into actionable decisions and continuous learning without creating an unsustainable delivery burden.',
    coreQuestions: [
      "From diagnosis to intervention to farmer practice change to soil and economic outcomes — what is the model's strengths? Where are the critical links?",
      'How do you determine what a particular farm or farmer needs, and how does that translate into a differentiated intervention rather than a standard package?',
      'What needs to remain consistent for the model to work, what can adapt to context?',
      'How are diagnosis, advisory, implementation, monitoring, adaptation or market intelligence connected within the model?',
    ],
  },
  {
    key: 'scientific_breakthrough',
    label: 'scientific breakthrough',
    maxScore: 20,
    establishText:
      'The organisation has a scientifically credible and differentiated pathway capable of delivering rapid, measurable improvements in SOC (organically — not through amendments) and broader soil health, alongside substantial chemical reduction, under real smallholder conditions.',
    coreQuestions: [
      'Current science suggests that substantial SOC improvement can take years. What is different about your pathway that gives you confidence you can achieve the required change within 24 months?',
      'What is genuinely differentiated or breakthrough about this pathway relative to established regenerative agriculture approaches?',
      'What evidence supports the rate and magnitude of change you are proposing, and where do you see the scientific limits or uncertainties?',
    ],
  },
  {
    key: 'ability_to_scale',
    label: 'ability to scale',
    maxScore: 20,
    establishText:
      'The model is sufficiently adaptive and replicable to work across diverse farmer and farm contexts without losing efficacy, and the organisation has the technological and economical capacity to reach population-scale.',
    coreQuestions: [
      "What is the cost per hectare OR cost per farmer of your solution currently? What's the marginal cost of your Nth farmer versus your 1st, does cost per farmer fall, stay flat, or rise as you scale?",
      'What is the single biggest operational bottleneck to hitting your scale target?',
      'Do you have substantial unrestricted / programmatic funding that you can put towards hitting the thresholds of this challenge, w/o any capital provided by this Challenge?',
    ],
  },
  {
    key: 'ecosystem_leverage',
    label: 'ecosystem leverage',
    maxScore: 10,
    establishText:
      'The organisation can influence key ecosystem actors i.e. markets, government, FPOs, finance, service providers etc., to make regenerative transition more viable, sustainable and scalable beyond its direct programme.',
    coreQuestions: [
      'What systemic change does the model drive in its geography to make regenerative agriculture the new norm?',
      "What would enable this model to continue, expand or be taken up by others beyond the organisation's direct intervention?",
    ],
  },
];

/** Composite is a direct sum of per-criterion scores — each criterion's maxScore already IS its
 *  weightage (they sum to 100 across all five), so there's no separate weighting step. */
export function computeJuryComposite(scores: Record<string, number>): number {
  let total = 0;
  for (const c of JURY_RUBRIC_CRITERIA) {
    const raw = scores[c.key] ?? 0;
    total += Math.max(0, Math.min(raw, c.maxScore));
  }
  return Math.round(Math.max(0, Math.min(total, 100)));
}

export const JURY_DECISION_QUESTION =
  'Would you choose this organisation for the rapid re.gen challenge cohort — i.e. among the 8-10 organisations in India with the strongest potential to accelerate soil regeneration at scale, reach 5,000-10,000 farmers, and break the challenge thresholds within two years?';

export const JURY_WINNING_MODEL_QUESTION = 'If yes, what makes this a "winning" model?';
