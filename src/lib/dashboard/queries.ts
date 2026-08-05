import { prisma } from '@/lib/db';
import { computeConsensus } from '@/lib/applications/consensus';
import { parseRedFlags } from '@/lib/scoring/parse';
import { evaluateEligibility } from '@/lib/scoring/eligibility';
import { isReviewed, REVIEWED_WHERE } from '@/lib/applications/reviewStatus';

/** Surfaces applications that need attention before they slip through the pipeline unnoticed:
 *  either the AI evaluation raised red flags, or the Level 1 eligibility screen (see
 *  src/lib/scoring/eligibility.ts) actually fails them. */
export async function getFlaggedApplications() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: {
      id: true,
      orgName: true,
      pocFirstName: true,
      pocLastName: true,
      designation: true,
      phone: true,
      email: true,
      website: true,
      linkedinUrl: true,
      legalRegistrationType: true,
      fcraStatus: true,
      cert12A: true,
      cert80G: true,
      csr1Registration: true,
      darpanRegistered: true,
      founders: { select: { fullName: true, email: true, linkedin: true } },
      aiEvaluations: { orderBy: { createdAt: 'desc' }, take: 1, select: { redFlags: true } },
    },
  });

  return apps
    .map((app) => {
      const redFlags = app.aiEvaluations[0] ? parseRedFlags(app.aiEvaluations[0].redFlags) : [];
      const eligibility = evaluateEligibility(app);
      return { id: app.id, orgName: app.orgName, redFlags, eligibilityReasons: eligibility.failedReasons, ineligible: !eligibility.eligible };
    })
    .filter((a) => a.redFlags.length > 0 || a.ineligible);
}

export async function getDashboardKpis() {
  const [total, reviewed, internalYes, internalNo, statesRaw, yearsRaw] = await Promise.all([
    prisma.application.count({ where: { isDuplicateOf: null } }),
    prisma.application.count({ where: { isDuplicateOf: null, ...REVIEWED_WHERE } }),
    prisma.application.count({ where: { isDuplicateOf: null, internalDecision: 'YES' } }),
    prisma.application.count({ where: { isDuplicateOf: null, internalDecision: 'NO' } }),
    prisma.application.findMany({ where: { isDuplicateOf: null }, select: { statesOperating: true } }),
    prisma.application.findMany({ where: { isDuplicateOf: null, yearsExperience: { not: null } }, select: { yearsExperience: true } }),
  ]);

  const statesSet = new Set<string>();
  for (const a of statesRaw) {
    (a.statesOperating ?? '').split(';').forEach((s) => {
      const v = s.trim();
      if (v) statesSet.add(v);
    });
  }

  const avgYearsExperience =
    yearsRaw.length > 0 ? Math.round((yearsRaw.reduce((sum, a) => sum + (a.yearsExperience ?? 0), 0) / yearsRaw.length) * 10) / 10 : null;

  return {
    total,
    reviewed,
    internalYes,
    internalNo,
    statesRepresented: statesSet.size,
    avgYearsExperience,
  };
}

/** Pipeline funnel that folds review status and internal decision into one view:
 *  received → reviewed → decision split (yes / no / undecided). */
export async function getReviewDecisionFunnel() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: { internalDecision: true, stageStatus: true },
  });
  const total = apps.length;
  const reviewed = apps.filter(isReviewed).length;
  const yes = apps.filter((a) => a.internalDecision === 'YES').length;
  const no = apps.filter((a) => a.internalDecision === 'NO').length;
  const undecided = total - yes - no;
  return [
    { label: 'applications received', count: total },
    { label: 'reviewed', count: reviewed },
    { label: 'decision: yes', count: yes },
    { label: 'decision: no', count: no },
    { label: 'undecided', count: undecided },
  ];
}

/** One row per person who actually has at least one review assignment — built from the
 *  assignment data itself rather than "every user minus an exclusion list", so an account that
 *  was never assigned anything (a new admin, the jury account, etc.) never shows up as a
 *  permanent 0/0 row, and an admin who genuinely was hand-assigned a review still shows
 *  correctly without needing to be added to any allow-list. */
export async function getReviewerStats() {
  const [users, assignments] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.reviewAssignment.findMany({
      where: { application: { isDuplicateOf: null } },
      select: { reviewerId: true, application: { select: { stageStatus: true } } },
    }),
  ]);
  const namesById = new Map(users.map((u) => [u.id, u.name]));
  const byUser = new Map<string, { name: string; assigned: number; reviewed: number }>();
  for (const a of assignments) {
    const name = namesById.get(a.reviewerId);
    if (!name) continue;
    const entry = byUser.get(a.reviewerId) ?? { name, assigned: 0, reviewed: 0 };
    entry.assigned++;
    // same reviewed definition as everywhere else (reviewStatus.ts) — the application's stage,
    // not whether this particular reviewer submitted a score.
    if (isReviewed(a.application)) entry.reviewed++;
    byUser.set(a.reviewerId, entry);
  }
  return [...byUser.values()]
    .map((e) => ({ name: e.name, reviewed: e.reviewed, yetToReview: e.assigned - e.reviewed }))
    .sort((a, b) => b.reviewed - a.reviewed);
}

export async function getRecentActivity(limit = 8) {
  return prisma.stageTransition.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { application: { select: { id: true, orgName: true } }, actor: true },
  });
}

export async function getDivergentApplications() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null, stageStatus: { in: ['UNDER_REVIEW', 'SHORTLISTED', 'JURY_REVIEW'] } },
    include: { humanReviews: true, aiEvaluations: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  return apps
    .map((app) => ({
      app,
      consensus: computeConsensus({
        aiComposite: app.aiEvaluations[0]?.composite,
        humanComposites: app.humanReviews.map((r) => r.composite),
      }),
    }))
    .filter((x) => x.consensus.divergent);
}
