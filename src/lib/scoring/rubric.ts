export interface RubricCriterionDef {
  key: string;
  label: string;
  prompt: string;
}

/** The eight scoring dimensions for the rapid re.gen challenge, each rated 0-5. Composite is
 *  their weighted average, normalised to 0-100. Mapped directly to the six-step application
 *  form: organisation profile, model, tech and tools, experience & impact. */
export const RUBRIC_CRITERIA: RubricCriterionDef[] = [
  {
    key: 'model_clarity',
    label: 'model clarity and differentiation',
    prompt:
      'How clearly the chosen operating model archetype (direct extension, FPO enablement, input supply chain, market linkage, ' +
      'knowledge partner, tech/data platform, or hybrid) matches the described "how it works in practice" narrative, and whether ' +
      'the model is genuinely differentiated rather than a generic description.',
  },
  {
    key: 'regenerative_depth',
    label: 'depth of regenerative practice',
    prompt:
      'Breadth and depth of the regenerative practices actually covered (soil health, emissions/carbon, watershed health, ' +
      'biodiversity, farmer livelihoods, farm-worker security, cover cropping, reduced/no-till, composting & bio-inputs, crop ' +
      'rotation), and whether the stated adoption hurdle reflects real operational insight rather than a generic answer.',
  },
  {
    key: 'scale_and_reach',
    label: 'scale and reach',
    prompt:
      'Credibility of current scale (farmers reached, share of smallholders at or under 2 hectares, average land holding, area ' +
      'under regenerative practice, villages/districts/states covered) and whether a path to materially greater scale is believable.',
  },
  {
    key: 'verified_impact',
    label: 'verified impact and evidence quality',
    prompt:
      'Strength of the 2-3 claimed verified impacts — specifically whether baseline, endline, sample size and verification method ' +
      'are actually given — years of hands-on experience, and whether third-party reports or case studies back the claims.',
  },
  {
    key: 'org_credibility',
    label: 'organisational credibility and governance',
    prompt:
      'Legal registration type and compliance posture (FCRA, 12A, 80G, CSR-1, NITI Aayog DARPAN ID), annual operating budget and ' +
      'employee count relative to claimed scale, and diversity/credibility of current funders — signals of readiness to responsibly ' +
      'deploy results-based financing.',
  },
  {
    key: 'tech_and_data_maturity',
    label: 'technology and data maturity',
    prompt:
      'Which tools are used to manage data, transparency and program delivery, whether they were built in-house or off-the-shelf, ' +
      'and the specificity/credibility of the top tech use cases described (generic vs. genuinely embedded in daily operations).',
  },
  {
    key: 'team_and_execution',
    label: 'team and execution',
    prompt:
      "Founder-market fit from the founders' backgrounds and designations, whether the team has had formal training in regenerative " +
      '/ agroecological practice, rigor of the monitoring-evaluation-learning (MEL) setup, and whether materials/training exist in ' +
      'local languages — all proxies for execution capability at the farmer level.',
  },
  {
    key: 'fund_utilization',
    label: 'fund utilization plan',
    prompt:
      'Specificity and credibility of the plan for how prize funds would be used — concrete activities and intended outcomes, ' +
      'versus vague or aspirational statements.',
  },
];

export const DEFAULT_RUBRIC_WEIGHTS: Record<string, number> = Object.fromEntries(
  RUBRIC_CRITERIA.map((c) => [c.key, 1]),
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
  // scores are 0-5, normalise to 0-100
  return Math.round((weightedSum / weightTotal / 5) * 100);
}

export function dispositionFromComposite(composite: number): 'STRONG_ADVANCE' | 'ADVANCE' | 'BORDERLINE' | 'REJECT' {
  if (composite >= 80) return 'STRONG_ADVANCE';
  if (composite >= 62) return 'ADVANCE';
  if (composite >= 45) return 'BORDERLINE';
  return 'REJECT';
}
