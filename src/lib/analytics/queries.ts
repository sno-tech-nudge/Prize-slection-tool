import { prisma } from '@/lib/db';
import { STAGE_ORDER } from '@/lib/stages/rules';
import { OPERATING_MODEL_ARCHETYPE_LABEL, type OperatingModelArchetypeValue, type StageStatusValue } from '@/lib/constants';
import { isReviewed } from '@/lib/applications/reviewStatus';

const OTHERS_THRESHOLD = 5;

/** A category is exempt from being folded into "others" even below the threshold when it's a
 *  meaningful, singular bucket (an absence of data, or a deliberately separate cohort) rather
 *  than one of many small stray free-text values. */
function isExemptFromOthers(label: string): boolean {
  const l = label.trim().toLowerCase();
  return l === 'not provided' || l.includes('not yet classified') || l.includes('not classified');
}

/** Collapses every category with a count below the threshold into a single "others" bucket —
 *  the free-text/multi-select dashboard charts (operating model, budget, heard-about) tend to
 *  accumulate a long tail of one-off values that clutter the chart without being individually
 *  meaningful. */
function collapseSmallSlices(entries: { label: string; count: number }[], threshold = OTHERS_THRESHOLD) {
  const kept: { label: string; count: number }[] = [];
  let othersCount = 0;
  for (const e of entries) {
    if (e.count < threshold && !isExemptFromOthers(e.label)) {
      othersCount += e.count;
    } else {
      kept.push(e);
    }
  }
  if (othersCount > 0) kept.push({ label: 'others', count: othersCount });
  return kept.sort((a, b) => b.count - a.count);
}

/**
 * "Reached stage X" = the application's furthest position at or beyond X in the linear
 * pipeline, derived from the app's current stageStatus plus every from/toStatus in its
 * transition history (not just toStatus rows) — an application that never left SUBMITTED
 * has zero transition rows (a zero-hop seed/apply path), so falling back to current
 * stageStatus is required or it would be invisible in the funnel entirely.
 */
export async function getFunnel() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: {
      stageStatus: true,
      stageTransitions: { select: { fromStatus: true, toStatus: true } },
    },
  });

  const indexOf = (s: string) => STAGE_ORDER.indexOf(s as StageStatusValue);
  const reachedCounts = new Map<string, number>(STAGE_ORDER.map((s) => [s, 0]));

  for (const app of apps) {
    let maxIndex = Math.max(indexOf(app.stageStatus), 0);
    for (const t of app.stageTransitions) {
      maxIndex = Math.max(maxIndex, indexOf(t.fromStatus), indexOf(t.toStatus));
    }
    for (let i = 0; i <= maxIndex; i++) {
      const stage = STAGE_ORDER[i];
      reachedCounts.set(stage, (reachedCounts.get(stage) ?? 0) + 1);
    }
  }

  const totalSubmitted = reachedCounts.get('SUBMITTED') ?? 0;
  return STAGE_ORDER.map((stage) => {
    const count = reachedCounts.get(stage) ?? 0;
    return {
      stage,
      count,
      pctOfSubmitted: totalSubmitted > 0 ? Math.round((count / totalSubmitted) * 100) : 0,
    };
  });
}

/** Mix by rapid re.gen operating model archetype — the current cycle's categorisation.
 *  Applications from the historical AgWater cohort predate this question, so they're
 *  bucketed separately rather than mixed in under a misleading label. */
export async function getOperatingModelMix() {
  const apps = await prisma.application.findMany({ where: { isDuplicateOf: null }, select: { operatingModelArchetype: true } });
  const tally = new Map<string, number>();
  for (const a of apps) {
    if (!a.operatingModelArchetype) {
      tally.set('not yet classified (legacy AgWater cohort)', (tally.get('not yet classified (legacy AgWater cohort)') ?? 0) + 1);
      continue;
    }
    // operating_model is a multi-select in the live form — tally each selected archetype
    // individually rather than treating "A;B" as its own bucket distinct from "A" and "B".
    for (const raw of a.operatingModelArchetype.split(';')) {
      const key = raw.trim();
      if (!key) continue;
      const label = OPERATING_MODEL_ARCHETYPE_LABEL[key as OperatingModelArchetypeValue] ?? key;
      tally.set(label, (tally.get(label) ?? 0) + 1);
    }
  }
  const collapsed = collapseSmallSlices([...tally.entries()].map(([label, count]) => ({ label, count })));
  return collapsed.map(({ label, count }) => ({ category: label, count }));
}

/** Annual operating budget is free text off the real Zoho form (not the fixed enum band list),
 *  so this tallies whatever distinct values actually exist rather than the enum. */
export async function getOperatingBudgetMix() {
  const apps = await prisma.application.findMany({ where: { isDuplicateOf: null }, select: { annualOperatingBudget: true } });
  const tally = new Map<string, number>();
  for (const a of apps) {
    const key = a.annualOperatingBudget?.trim() || 'not provided';
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  return collapseSmallSlices([...tally.entries()].map(([label, count]) => ({ label, count })));
}

/** How applicants found out about the challenge — a multi-select off the real Zoho form with no
 *  fixed enum list (same shape as operating budget above), so each selected value is tallied
 *  individually rather than treating "A;B" as its own bucket distinct from "A" and "B". */
export async function getHeardAboutMix() {
  const apps = await prisma.application.findMany({ where: { isDuplicateOf: null }, select: { heardAboutChallenge: true } });
  const tally = new Map<string, number>();
  for (const a of apps) {
    if (!a.heardAboutChallenge) {
      tally.set('not provided', (tally.get('not provided') ?? 0) + 1);
      continue;
    }
    for (const raw of a.heardAboutChallenge.split(';')) {
      const key = raw.trim();
      if (!key) continue;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }
  return collapseSmallSlices([...tally.entries()].map(([label, count]) => ({ label, count })));
}

export async function getReviewStatusMix() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: { stageStatus: true },
  });
  const reviewed = apps.filter(isReviewed).length;
  return [
    { label: 'reviewed', count: reviewed },
    { label: 'not reviewed', count: apps.length - reviewed },
  ];
}

export async function getInternalDecisionMix() {
  const [yes, no, undecided] = await Promise.all([
    prisma.application.count({ where: { isDuplicateOf: null, internalDecision: 'YES' } }),
    prisma.application.count({ where: { isDuplicateOf: null, internalDecision: 'NO' } }),
    prisma.application.count({ where: { isDuplicateOf: null, internalDecision: null } }),
  ]);
  return [
    { label: 'decision: yes', count: yes },
    { label: 'decision: no', count: no },
    { label: 'undecided', count: undecided },
  ];
}

/** Tally of applications by state operated in — statesOperating is a multi-select field, so an
 *  application counts toward every state it lists. Used to shade the India map. */
export async function getStateApplicationMix() {
  const apps = await prisma.application.findMany({ where: { isDuplicateOf: null }, select: { statesOperating: true } });
  const tally = new Map<string, number>();
  for (const a of apps) {
    (a.statesOperating ?? '').split(';').forEach((s) => {
      const state = s.trim();
      if (!state) return;
      tally.set(state, (tally.get(state) ?? 0) + 1);
    });
  }
  return [...tally.entries()].map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count);
}

/** teamSize on the live form is a fixed band string ("0-10", "10-50", ...), not free text. */
export async function getOrgSizeMix() {
  const apps = await prisma.application.findMany({ where: { isDuplicateOf: null }, select: { teamSize: true } });
  const tally = new Map<string, number>();
  for (const a of apps) {
    const key = a.teamSize?.trim() || 'not provided';
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  const order = ['0-10', '10-50', '50-100', '100-500', 'not provided'];
  return [...tally.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
}

/** Buckets organisation age from incorporationDate — "when was the organisation registered". */
export async function getOrgAgeMix() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null, incorporationDate: { not: null } },
    select: { incorporationDate: true },
  });
  const buckets = [
    { label: '< 1 year', min: 0, max: 1, count: 0 },
    { label: '1-3 years', min: 1, max: 3, count: 0 },
    { label: '3-5 years', min: 3, max: 5, count: 0 },
    { label: '5-10 years', min: 5, max: 10, count: 0 },
    { label: '10+ years', min: 10, max: Infinity, count: 0 },
  ];
  const now = Date.now();
  for (const a of apps) {
    const years = Math.max(0, (now - a.incorporationDate!.getTime()) / (365.25 * 86400000));
    const bucket = buckets.find((b) => years >= b.min && years < b.max) ?? buckets[buckets.length - 1];
    bucket.count++;
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}

export async function getValueChainMix() {
  const apps = await prisma.application.findMany({ where: { isDuplicateOf: null }, select: { valueChainFocus: true } });
  const tally = new Map<string, number>();
  for (const a of apps) {
    if (!a.valueChainFocus) continue;
    for (const raw of a.valueChainFocus.split(';')) {
      const key = raw.trim();
      if (!key) continue;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }
  return [...tally.entries()].map(([focus, count]) => ({ focus, count })).sort((a, b) => b.count - a.count);
}

export async function getGeographyMix(limit = 8) {
  const apps = await prisma.application.findMany({ where: { isDuplicateOf: null }, select: { location: true } });
  const tally = new Map<string, number>();
  for (const a of apps) {
    const key = (a.location ?? 'not provided').split(',')[0].trim() || 'not provided';
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getSmallFarmerHistogram() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null, smallMarginalFarmerPct: { not: null } },
    select: { smallMarginalFarmerPct: true },
  });
  const buckets = [
    { label: '0-20%', min: 0, max: 20, count: 0 },
    { label: '21-40%', min: 21, max: 40, count: 0 },
    { label: '41-60%', min: 41, max: 60, count: 0 },
    { label: '61-80%', min: 61, max: 80, count: 0 },
    { label: '81-100%', min: 81, max: 100, count: 0 },
  ];
  for (const a of apps) {
    const pct = a.smallMarginalFarmerPct ?? 0;
    const bucket = buckets.find((b) => pct >= b.min && pct <= b.max);
    if (bucket) bucket.count++;
  }
  return buckets;
}

export async function getTrlDistribution() {
  const apps = await prisma.application.findMany({ where: { isDuplicateOf: null, trl: { not: null } }, select: { trl: true } });
  const counts = new Map<number, number>();
  for (const a of apps) {
    const trl = a.trl ?? 0;
    counts.set(trl, (counts.get(trl) ?? 0) + 1);
  }
  return Array.from({ length: 9 }, (_, i) => i + 1).map((trl) => ({ trl, count: counts.get(trl) ?? 0 }));
}

export async function getReviewerThroughput() {
  const reviews = await prisma.humanReview.findMany({
    include: { reviewer: true, application: { select: { submittedAt: true } } },
  });
  const byReviewer = new Map<string, { name: string; count: number; totalDays: number }>();
  for (const r of reviews) {
    const key = r.reviewerId;
    if (!byReviewer.has(key)) byReviewer.set(key, { name: r.reviewer.name, count: 0, totalDays: 0 });
    const entry = byReviewer.get(key)!;
    entry.count++;
    const days = (r.submittedAt.getTime() - r.application.submittedAt.getTime()) / 86400000;
    entry.totalDays += Math.max(days, 0);
  }
  return [...byReviewer.values()]
    .map((e) => ({ name: e.name, reviewsCompleted: e.count, avgTurnaroundDays: e.count > 0 ? Math.round(e.totalDays / e.count) : 0 }))
    .sort((a, b) => b.reviewsCompleted - a.reviewsCompleted);
}

/** Backtests the AI scorer against the historical outcome: were the 78 historically-shortlisted
 *  applications the ones the AI would have advanced (composite-based disposition ADVANCE+)? */
export async function getCalibrationNote() {
  const evaluated = await prisma.application.findMany({
    where: { isDuplicateOf: null, aiEvaluations: { some: {} } },
    select: {
      historicallyShortlisted: true,
      aiEvaluations: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { disposition: true, composite: true },
      },
    },
  });
  if (evaluated.length === 0) return null;

  let truePositive = 0; // shortlisted AND AI advance+
  let falseNegative = 0; // shortlisted BUT AI did not advance
  let trueNegative = 0; // not shortlisted AND AI did not advance
  let falsePositive = 0; // not shortlisted BUT AI advance+

  for (const app of evaluated) {
    const evaluation = app.aiEvaluations[0];
    const disposition = evaluation?.disposition;
    const aiAdvanced = disposition === 'STRONG_ADVANCE' || disposition === 'ADVANCE';
    if (app.historicallyShortlisted && aiAdvanced) truePositive++;
    else if (app.historicallyShortlisted && !aiAdvanced) falseNegative++;
    else if (!app.historicallyShortlisted && !aiAdvanced) trueNegative++;
    else falsePositive++;
  }

  const total = evaluated.length;
  const accuracy = Math.round(((truePositive + trueNegative) / total) * 100);

  return { total, truePositive, falseNegative, trueNegative, falsePositive, accuracy };
}
